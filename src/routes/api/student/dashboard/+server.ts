// Student Dashboard API Endpoint
// University of Port Harcourt - Hostel Allocation System

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';
import { AuthService } from '$lib/server/auth';
import { extractAdmissionYearFromMatricNo, calculateAcademicLevel, getLevelDescription } from '$lib/academic-levels';

export const GET: RequestHandler = async ({ request, cookies }) => {
  try {
    // Get token from cookies first, then try authorization header
    let token = cookies.get('accessToken') || cookies.get('auth-token');
    let tokenData;

    if (token) {
      // Check for simple admin token (fallback mode)
      if (token.startsWith('admin-')) {
        // Return demo data for admin
        return json({
          user: {
            id: 'admin-fallback',
            name: 'System Administrator',
            email: 'admin@uniport.edu.ng',
            matricNo: 'ADMIN001',
            role: 'ADMIN'
          },
          stats: {
            applicationStatus: 'Admin View',
            paymentStatus: 'N/A',
            allocationStatus: 'N/A',
            hostelPreference: 'N/A'
          }
        });
      }

      // Try to verify JWT token
      try {
        tokenData = AuthService.verifyAccessToken(token);
      } catch (jwtError) {
        console.error('Cookie JWT verification failed:', jwtError);
        return json({ error: 'Invalid token' }, { status: 401 });
      }
    } else {
      // Fallback to authorization header
      const authHeader = request.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return json({ error: 'Authorization token required' }, { status: 401 });
      }

      token = authHeader.slice(7);
      try {
        tokenData = AuthService.verifyAccessToken(token);
      } catch (jwtError) {
        console.error('Header JWT verification failed:', jwtError);
        return json({ error: 'Invalid or expired token' }, { status: 401 });
      }
    }
    
    if (!tokenData) {
      return json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Try to get user from database, fallback to token data
    let user;
    let dbAvailable = true;
    
    try {
      if (!prisma) {
        throw new Error('Database not available');
      }

      user = await prisma.user.findUnique({
        where: { id: tokenData.userId },
        include: {
          applications: {
            orderBy: { submittedAt: 'desc' },
            take: 1,
            include: {
              payments: {
                orderBy: { createdAt: 'desc' },
                take: 1
              },
              allocations: {
                orderBy: { allocatedAt: 'desc' },
                take: 1,
                include: {
                  room: {
                    include: {
                      hostel: true
                    }
                  }
                }
              }
            }
          }
        }
      });

    } catch (dbError) {
      console.error('Database error in student dashboard:', dbError);
      dbAvailable = false;
      
      // Use fallback data from token
      const tokenDataTyped = tokenData as any;
      user = {
        id: tokenDataTyped.userId,
        name: tokenDataTyped.name || 'Student',
        email: tokenDataTyped.email,
        matricNo: tokenDataTyped.matricNo || 'N/A',
        applications: [],
        createdAt: new Date()
      };
    }

    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[Dashboard API] User data loaded:');
    console.log('  User ID:', user.id);
    console.log('  User name:', user.name);
    console.log('  Applications count:', user.applications?.length || 0);

    const latestApplication = user.applications?.[0];
    const latestPayment = latestApplication?.payments?.[0];
    
    console.log('[Dashboard API] Latest application:');
    console.log('  Application exists?', !!latestApplication);
    console.log('  Application status:', latestApplication?.applicationStatus);
    console.log('  Payment status:', latestApplication?.paymentStatus);
    
    // Check application period status
    let applicationPeriodStatus: 'not_started' | 'open' | 'closed' = 'closed';
    try {
      const appStartSetting = await prisma.systemSettings.findUnique({
        where: { key: 'application_start_date' }
      });
      const appDeadlineSetting = await prisma.systemSettings.findUnique({
        where: { key: 'application_deadline' }
      });
      const regOpenSetting = await prisma.systemSettings.findUnique({
        where: { key: 'registration_open' }
      });

      console.log('[Dashboard API] Settings fetched:');
      console.log('  Start date setting:', appStartSetting?.value);
      console.log('  Deadline setting:', appDeadlineSetting?.value);
      console.log('  Registration open:', regOpenSetting?.value);

      const now = new Date();
      let startDate: Date | null = null;
      let deadline: Date | null = null;
      let isRegistrationOpen = false;

      // Parse start date
      if (appStartSetting?.value) {
        let dateStr = appStartSetting.value as string;
        try {
          const parsed = JSON.parse(dateStr);
          dateStr = typeof parsed === 'string' ? parsed : dateStr;
        } catch {}
        if (dateStr) {
          dateStr = dateStr.trim();
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
            dateStr = dateStr + ':00Z';
          }
          startDate = new Date(dateStr);
          if (isNaN(startDate.getTime())) startDate = null;
        }
      }

      // Parse deadline
      if (appDeadlineSetting?.value) {
        let dateStr = appDeadlineSetting.value as string;
        try {
          const parsed = JSON.parse(dateStr);
          dateStr = typeof parsed === 'string' ? parsed : dateStr;
        } catch {}
        if (dateStr) {
          dateStr = dateStr.trim();
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
            dateStr = dateStr + ':00Z';
          }
          deadline = new Date(dateStr);
          if (isNaN(deadline.getTime())) deadline = null;
        }
      }

      // Parse registration open
      if (regOpenSetting?.value) {
        const regValue = regOpenSetting.value as any;
        if (typeof regValue === 'string') {
          isRegistrationOpen = regValue.toLowerCase() === 'true';
        } else {
          isRegistrationOpen = regValue === true || regValue.enabled === true;
        }
      }

      // Determine period status
      if (!isRegistrationOpen || !startDate) {
        applicationPeriodStatus = 'not_started';
      } else if (now < startDate) {
        applicationPeriodStatus = 'not_started';
      } else if (deadline && now > deadline) {
        applicationPeriodStatus = 'closed';
      } else {
        applicationPeriodStatus = 'open';
      }
    } catch (error) {
      console.error('Error checking application period:', error);
    }
    
    console.log('[Dashboard API] Application period check:');
    console.log('  Period status:', applicationPeriodStatus);
    console.log('  Has application?', !!latestApplication);
    
    // Build stats based on actual data and application period
    let applicationStatus = 'Not Started';
    
    if (latestApplication) {
      // Student has an application - show application status
      switch (latestApplication.applicationStatus) {
        case 'PENDING':
          applicationStatus = 'Submitted';
          break;
        case 'APPROVED':
          applicationStatus = 'Approved';
          break;
        case 'ALLOCATED':
          applicationStatus = 'Allocated';
          break;
        case 'REJECTED':
          applicationStatus = 'Rejected';
          break;
        default:
          applicationStatus = latestApplication.applicationStatus;
      }
    } else {
      // No application - show period status
      if (applicationPeriodStatus === 'open') {
        applicationStatus = 'Open - Apply Now';
      } else if (applicationPeriodStatus === 'closed') {
        applicationStatus = 'Closed';
      } else {
        applicationStatus = 'Not Started';
      }
    }
    
    console.log('  Final application status:', applicationStatus);

    let paymentStatus = 'Pending';
    if (latestPayment) {
      switch (latestPayment.status) {
        case 'COMPLETED':
          paymentStatus = 'Completed';
          break;
        case 'FAILED':
          paymentStatus = 'Failed';
          break;
        case 'PENDING':
          paymentStatus = 'Processing';
          break;
        default:
          paymentStatus = latestPayment.status;
      }
    }

    const stats = {
      applicationStatus,
      paymentStatus,
      allocationStatus: latestApplication?.allocations?.[0]?.status || 'Pending',
      hostelPreference: latestApplication?.preferences?.[0] || 'None'
    };

    // Get recent activities (simplified for now)
    const activities = [
      {
        id: '1',
        type: 'account_created',
        title: 'Account created successfully',
        description: dbAvailable ? 'Welcome to the hostel allocation system' : 'Welcome (Demo Mode)',
        timestamp: user.createdAt,
        icon: 'user'
      }
    ];

    // Add application activities if they exist
    if (latestApplication) {
      activities.unshift({
        id: '2',
        type: 'application_submitted',
        title: 'Hostel application submitted',
        description: 'Your application is being processed',
        timestamp: latestApplication.submittedAt,
        icon: 'document'
      });
    }

    // Calculate user level properly
    let userLevel = 'Unknown';
    if (user.matricNo) {
      const admissionYear = extractAdmissionYearFromMatricNo(user.matricNo);
      if (admissionYear) {
        try {
          const level = calculateAcademicLevel(admissionYear);
          userLevel = level;
        } catch (error) {
          console.error('Error calculating level for dashboard:', error);
        }
      }
    }

    return json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        matricNo: user.matricNo,
        level: userLevel
      },
      stats,
      activities,
      currentApplication: latestApplication ? {
        id: latestApplication.id,
        status: latestApplication.applicationStatus,
        preferences: latestApplication.preferences,
        specialNeeds: latestApplication.specialNeeds,
        submittedAt: latestApplication.submittedAt,
        allocation: latestApplication.allocations?.[0] ? {
          room: latestApplication.allocations[0].room.number,
          hostel: latestApplication.allocations[0].room.hostel.name,
          status: latestApplication.allocations[0].status
        } : null
      } : null
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};
