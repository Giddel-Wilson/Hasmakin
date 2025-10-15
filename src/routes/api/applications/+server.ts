// Hostel Application Submission API
// University of Port Harcourt - Hostel Allocation System
// Handles student hostel application submissions

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';
import { calculateAcademicLevel } from '$lib/academic-levels';
import { AuthService } from '$lib/server/auth';

/**
 * POST /api/applications
 * Submit a new hostel application
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    // Step 1: Authenticate the user via cookie
    const accessToken = cookies.get('accessToken');
    
    console.log('[Application] Request received');
    console.log('[Application] Access token present:', !!accessToken);
    if (accessToken) {
      console.log('[Application] Token preview:', accessToken.substring(0, 20) + '...');
    }
    
    if (!accessToken) {
      console.error('[Application] No access token found in cookies');
      return json(
        { error: 'Authentication required. Please log in again.' },
        { status: 401 }
      );
    }

    // Step 2: Verify and decode the JWT token
    let userId: string;
    let userRole: string;
    
    try {
      const decoded = AuthService.verifyAccessToken(accessToken);
      
      if (!decoded) {
        throw new Error('Token verification returned null');
      }
      
      userId = decoded.userId;
      userRole = decoded.role;
      
      console.log('[Application] Authenticated user:', { userId, role: userRole });
    } catch (jwtError) {
      console.error('[Application] JWT verification failed:', jwtError instanceof Error ? jwtError.message : 'Unknown error');
      
      // Don't delete cookies here - let the client handle refresh
      // The ClientAuth.fetch will attempt to refresh the token
      return json(
        { error: 'Invalid or expired session. Please try refreshing or log in again.' },
        { status: 401 }
      );
    }

    // Step 3: Verify user is a student
    if (userRole !== 'STUDENT') {
      console.error('[Application] Non-student attempted to apply:', { userId, role: userRole });
      return json(
        { error: 'Only students can apply for hostel accommodation.' },
        { status: 403 }
      );
    }

    // Step 4: Fetch user profile from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        matricNo: true,
        gender: true,
        admissionYear: true,
        accountStatus: true,
        applications: {
          where: {
            applicationStatus: {
              in: ['PENDING', 'APPROVED', 'ALLOCATED', 'CONFIRMED']
            }
          },
          orderBy: {
            submittedAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!user) {
      console.error('[Application] User not found:', userId);
      return json(
        { error: 'User account not found. Please contact support.' },
        { status: 404 }
      );
    }

    // Step 5: Check account status
    if (user.accountStatus !== 'ACTIVE') {
      console.error('[Application] Inactive account attempted application:', {
        userId,
        status: user.accountStatus
      });
      return json(
        { 
          error: `Your account is ${user.accountStatus.toLowerCase()}. Please contact the hostel office.` 
        },
        { status: 403 }
      );
    }

    // Step 6: Check for existing active application
    if (user.applications && user.applications.length > 0) {
      const existingApp = user.applications[0];
      console.log('[Application] User has existing application:', {
        userId,
        applicationId: existingApp.id,
        status: existingApp.applicationStatus
      });
      
      return json(
        { 
          error: 'You already have an active hostel application. Please check your dashboard.',
          existingApplicationId: existingApp.id
        },
        { status: 400 }
      );
    }

    // Step 7: Parse and validate request body
    let requestData: {
      hostelGenderPreference?: string;
      hostelPreferences?: string[];
      specialNeeds?: string;
      medicalConditions?: string;
      roommate?: { requested: boolean; matricNo: string; name: string };
      declaration?: boolean;
      gender?: string;
    };
    
    try {
      requestData = await request.json();
    } catch (parseError) {
      console.error('[Application] Failed to parse request body:', parseError);
      return json(
        { error: 'Invalid request data format.' },
        { status: 400 }
      );
    }

    const {
      hostelGenderPreference,
      hostelPreferences,
      specialNeeds,
      medicalConditions,
      roommate,
      declaration,
      gender: submittedGender
    } = requestData;

    console.log('[Application] Received application data:', {
      userId,
      hostelGenderPreference,
      preferenceCount: hostelPreferences?.length,
      hasRoommate: roommate?.requested,
      declared: declaration
    });

    // Step 8: Validate required fields
    const validationErrors: Record<string, string> = {};

    if (!hostelGenderPreference) {
      validationErrors.hostelGenderPreference = 'Hostel gender preference is required';
    }

    if (!hostelPreferences || !Array.isArray(hostelPreferences) || hostelPreferences.length === 0) {
      validationErrors.hostelPreferences = 'At least one hostel preference is required';
    }

    if (!hostelPreferences || !hostelPreferences[0]) {
      validationErrors.hostelPreferences = 'First hostel preference is required';
    }

    if (!declaration) {
      validationErrors.declaration = 'You must accept the terms and conditions';
    }

    // Verify gender matches profile
    const userGender = submittedGender || user.gender;
    if (!userGender) {
      validationErrors.gender = 'Gender information is required. Please update your profile.';
    }

    if (Object.keys(validationErrors).length > 0) {
      console.log('[Application] Validation failed:', validationErrors);
      return json(
        { error: 'Validation failed', fields: validationErrors },
        { status: 400 }
      );
    }

    // Step 9: Determine gender filter for hostels
    let genderFilter: string | string[];
    
    if (hostelGenderPreference === 'SAME_GENDER') {
      genderFilter = userGender;
    } else if (hostelGenderPreference === 'MIXED') {
      genderFilter = 'MIXED';
    } else {
      // Default to user's gender if preference is unclear
      genderFilter = userGender;
    }

    // Step 10: Filter out empty preferences and validate hostels
    const validPreferences = (hostelPreferences || []).filter((id: string) => id && id.trim() !== '');

    if (validPreferences.length === 0) {
      console.error('[Application] No valid preferences after filtering');
      return json(
        { error: 'Please select at least one hostel.' },
        { status: 400 }
      );
    }

    // Step 11: Fetch and validate selected hostels
    const selectedHostels = await prisma.hostel.findMany({
      where: {
        id: { in: validPreferences },
        isActive: true
      }
    });

    if (selectedHostels.length === 0) {
      console.error('[Application] No active hostels found for preferences:', validPreferences);
      return json(
        { 
          error: 'None of the selected hostels are currently available. Please choose different hostels.' 
        },
        { status: 400 }
      );
    }

    // Validate gender compatibility
    const incompatibleHostels = selectedHostels.filter((hostel: { gender: string; name: string }) => {
      if (Array.isArray(genderFilter)) {
        return !genderFilter.includes(hostel.gender);
      }
      return hostel.gender !== genderFilter;
    });

    if (incompatibleHostels.length > 0) {
      console.error('[Application] Gender incompatible hostels:', {
        userGender,
        preference: hostelGenderPreference,
        incompatible: incompatibleHostels.map((h: { name: string; gender: string }) => ({ name: h.name, gender: h.gender }))
      });
      
      return json(
        { 
          error: `Some selected hostels do not match your gender preference. Please review your selections.`,
          incompatibleHostels: incompatibleHostels.map((h: { name: string }) => h.name)
        },
        { status: 400 }
      );
    }

    // Step 12: Calculate academic level
    let academicLevel = 'YEAR_1'; // Default
    
    if (user.admissionYear) {
      try {
        academicLevel = calculateAcademicLevel(user.admissionYear);
        console.log('[Application] Calculated academic level:', {
          admissionYear: user.admissionYear,
          level: academicLevel
        });
      } catch (error) {
        console.warn('[Application] Failed to calculate academic level, using default:', error);
      }
    } else {
      console.warn('[Application] No admission year for user, using default level');
    }

    // Step 13: Validate roommate request if provided
    let roommateUserId: string | null = null;
    
    if (roommate?.requested && roommate?.matricNo) {
      const roommateMatricNo = roommate.matricNo.trim();
      const roommateName = roommate.name?.trim();
      
      if (!roommateName) {
        console.error('[Application] Roommate name not provided');
        return json(
          { 
            error: 'Please provide your roommate\'s full name.',
            field: 'roommate'
          },
          { status: 400 }
        );
      }
      
      if (roommateMatricNo === user.matricNo) {
        console.error('[Application] User tried to request self as roommate');
        return json(
          { 
            error: 'You cannot request yourself as a roommate.',
            field: 'roommate'
          },
          { status: 400 }
        );
      }

      // Find roommate user by matric number
      const roommateUser = await prisma.user.findFirst({
        where: {
          matricNo: roommateMatricNo,
          role: 'STUDENT'
        },
        include: {
          allocations: {
            where: {
              status: { in: ['ALLOCATED', 'CONFIRMED'] }
            }
          }
        }
      });

      if (!roommateUser) {
        console.error('[Application] Roommate not found:', roommateMatricNo);
        return json(
          { 
            error: 'Student not found. Please verify the matric number.',
            field: 'roommate'
          },
          { status: 400 }
        );
      }

      // Verify that the name matches the matric number
      const roommateFullName = roommateUser.name.toLowerCase().trim();
      const providedName = roommateName.toLowerCase();
      
      // Check if the provided name matches (allowing partial matches for flexibility)
      if (!roommateFullName.includes(providedName) && !providedName.includes(roommateFullName)) {
        console.error('[Application] Roommate name mismatch:', {
          providedName: roommateName,
          actualName: roommateUser.name,
          matricNo: roommateMatricNo
        });
        return json(
          { 
            error: `The name "${roommateName}" does not match the student with matric number "${roommateMatricNo}". The registered name is "${roommateUser.name}".`,
            field: 'roommate'
          },
          { status: 400 }
        );
      }

      // Check if roommate is active
      if (roommateUser.accountStatus !== 'ACTIVE') {
        console.error('[Application] Roommate account not active:', roommateMatricNo);
        return json(
          { 
            error: 'Student not found. Please verify the matric number and name.',
            field: 'roommate'
          },
          { status: 400 }
        );
      }

      // Check if roommate already has allocation
      if (roommateUser.allocations && roommateUser.allocations.length > 0) {
        console.error('[Application] Roommate already allocated:', roommateMatricNo);
        return json(
          { 
            error: 'Student already allocated. This student has already been assigned to a hostel.',
            field: 'roommate'
          },
          { status: 400 }
        );
      }

      roommateUserId = roommateUser.id;
      console.log('[Application] Roommate validated:', {
        matricNo: roommateMatricNo,
        name: roommateUser.name,
        providedName: roommateName
      });
    }

    // Step 14: Create the application in database
    const application = await prisma.application.create({
      data: {
        userId,
        gender: userGender,
        level: academicLevel as 'YEAR_1' | 'YEAR_2' | 'YEAR_3' | 'YEAR_4' | 'YEAR_5',
        preferences: validPreferences,
        specialNeeds: specialNeeds?.trim() || null,
        medicalConditions: medicalConditions?.trim() || null,
        requestedRoommateId: roommateUserId,
        applicationStatus: 'PENDING',
        paymentStatus: 'PENDING'
      }
    });

    console.log('[Application] Created application:', {
      applicationId: application.id,
      userId,
      preferences: validPreferences.length
    });

    // Step 15: Create audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'APPLICATION_SUBMITTED',
          details: {
            applicationId: application.id,
            preferences: validPreferences,
            hostelGenderPreference,
            level: academicLevel,
            hasSpecialNeeds: !!specialNeeds,
            hasMedicalConditions: !!medicalConditions,
            hasRoommateRequest: !!roommateUserId,
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (auditError) {
      // Don't fail the request if audit log fails
      console.error('[Application] Failed to create audit log:', auditError);
    }

    // Step 16: Return success response
    console.log('[Application] Successfully submitted application:', application.id);
    
    return json({
      success: true,
      message: 'Your hostel application has been submitted successfully!',
      application: {
        id: application.id,
        status: application.applicationStatus,
        submittedAt: application.submittedAt
      }
    }, { status: 201 });

  } catch (error) {
    // Catch-all error handler
    console.error('[Application] Unexpected error during submission:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return json(
      { 
        error: 'An unexpected error occurred while processing your application. Please try again.',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
};

/**
 * GET /api/applications
 * Retrieve user's applications
 */
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    // Authenticate
    const accessToken = cookies.get('accessToken');
    
    if (!accessToken) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    let userId: string;
    
    try {
      const decoded = AuthService.verifyAccessToken(accessToken);
      if (!decoded) {
        throw new Error('Token verification failed');
      }
      userId = decoded.userId;
    } catch {
      return json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Fetch user's applications
    const applications = await prisma.application.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        },
        allocations: {
          include: {
            room: {
              include: {
                hostel: true
              }
            }
          }
        }
      }
    });

    return json({ applications });

  } catch (error) {
    console.error('[Application GET] Error:', error);
    return json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
};

