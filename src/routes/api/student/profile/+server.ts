import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';
import { AuthService } from '$lib/server/auth';
import bcrypt from 'bcryptjs';
import { calculateAcademicLevel, getLevelDescription, extractAdmissionYearFromMatricNo } from '$lib/academic-levels';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export const GET: RequestHandler = async ({ cookies }) => {
  try {
    console.log('=== Profile GET Request ===');
    
    // Log all cookies for debugging
    const allCookies = cookies.getAll();
    console.log('Available cookies:', allCookies.map(c => ({ name: c.name, value: c.value?.substring(0, 20) + '...' })));
    
    // Verify authentication
    const token = cookies.get('accessToken');
    console.log('Access token present:', !!token);
    
    if (!token) {
      console.log('No access token found in cookies');
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = AuthService.verifyAccessToken(token);
      if (!decoded) {
        console.log('Token verification failed - token invalid');
        return json({ error: 'Invalid authentication token' }, { status: 401 });
      }
      userId = decoded.userId;
      console.log('Token decoded successfully, userId:', userId);
    } catch (error) {
      console.log('Token verification failed:', error);
      return json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        matricNo: true,
        role: true,
        admissionYear: true,
        department: true,
        faculty: true,
        gender: true,
        religion: true,
        nationality: true,
        stateOfOrigin: true,
        dateOfBirth: true,
        phoneNumber: true,
        guardianPhone1: true,
        guardianRelationship1: true,
        guardianPhone2: true,
        guardianRelationship2: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'STUDENT') {
      return json({ error: 'This endpoint is for students only' }, { status: 403 });
    }

    // Calculate current academic level
    let currentLevel: string = 'Unknown';
    let levelDescription = 'Unknown';
    let admissionYear = user.admissionYear;
    
    // If admission year is not set, try to extract from matric number
    if (!admissionYear && user.matricNo) {
      const extractedYear = extractAdmissionYearFromMatricNo(user.matricNo);
      if (extractedYear) {
        admissionYear = extractedYear;
        console.log(`Extracted admission year ${extractedYear} from matric number ${user.matricNo}`);
      }
    }
    
    if (admissionYear) {
      try {
        const calculatedLevel = calculateAcademicLevel(admissionYear);
        currentLevel = calculatedLevel;
        levelDescription = getLevelDescription(calculatedLevel);
        console.log(`Calculated level: ${currentLevel} (${levelDescription}) for admission year ${admissionYear}`);
      } catch (error) {
        console.error('Error calculating academic level:', error);
        currentLevel = 'Unknown';
        levelDescription = 'Unknown';
      }
    } else {
      console.log('No admission year available for level calculation');
    }

    return json({
      ...user,
      admissionYear, // Use the calculated admission year (original or extracted)
      currentLevel,
      levelDescription,
      // Don't include sensitive fields in response
      passwordHash: undefined
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ cookies, request }) => {
  try {
    // Verify authentication
    const token = cookies.get('accessToken');
    if (!token) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = AuthService.verifyAccessToken(token);
      if (!decoded) {
        return json({ error: 'Invalid authentication token' }, { status: 401 });
      }
      userId = decoded.userId;
    } catch {
      return json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Get current user to verify they're a student
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true }
    });

    if (!currentUser) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    if (currentUser.role !== 'STUDENT') {
      return json({ error: 'This endpoint is for students only' }, { status: 403 });
    }

    // Parse request body
    const updates = await request.json();
    const {
      name,
      email,
      department,
      faculty,
      gender,
      religion,
      nationality,
      stateOfOrigin,
      dateOfBirth,
      phoneNumber,
      guardianPhone1,
      guardianRelationship1,
      guardianPhone2,
      guardianRelationship2,
      currentPassword,
      newPassword
    } = updates;

    // Validation
    const errors: string[] = [];

    if (name && (typeof name !== 'string' || name.trim().length < 2)) {
      errors.push('Name must be at least 2 characters long');
    }

    if (email) {
      if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Please provide a valid email address');
      }
      // Check for university email requirement
      if (!email.endsWith('@uniport.edu.ng')) {
        errors.push('Email must be a valid University of Port Harcourt email (@uniport.edu.ng)');
      }
      // Check if email is already taken by another user
      if (email !== currentUser.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });
        if (existingUser) {
          errors.push('This email is already registered');
        }
      }
    }

    if (department && (typeof department !== 'string' || department.trim().length < 2)) {
      errors.push('Department must be at least 2 characters long');
    }

    if (faculty && (typeof faculty !== 'string' || faculty.trim().length < 2)) {
      errors.push('Faculty must be at least 2 characters long');
    }

    if (religion && (typeof religion !== 'string' || religion.trim().length < 2)) {
      errors.push('Religion must be at least 2 characters long');
    }

    if (nationality && (typeof nationality !== 'string' || nationality.trim().length < 2)) {
      errors.push('Nationality must be at least 2 characters long');
    }

    if (stateOfOrigin && (typeof stateOfOrigin !== 'string' || stateOfOrigin.trim().length < 2)) {
      errors.push('State of Origin must be at least 2 characters long');
    }

    if (guardianRelationship1 && (typeof guardianRelationship1 !== 'string' || guardianRelationship1.trim().length < 2)) {
      errors.push('Guardian relationship 1 must be at least 2 characters long');
    }

    if (guardianRelationship2 && (typeof guardianRelationship2 !== 'string' || guardianRelationship2.trim().length < 2)) {
      errors.push('Guardian relationship 2 must be at least 2 characters long');
    }

    if (dateOfBirth && (typeof dateOfBirth !== 'string' || isNaN(Date.parse(dateOfBirth)))) {
      errors.push('Please provide a valid date of birth');
    }

    if (phoneNumber && (typeof phoneNumber !== 'string' || !/^\+?[\d\s-()]{10,15}$/.test(phoneNumber))) {
      errors.push('Please provide a valid phone number');
    }

    if (guardianPhone1 && (typeof guardianPhone1 !== 'string' || !/^\+?[\d\s-()]{10,15}$/.test(guardianPhone1))) {
      errors.push('Please provide a valid guardian phone number 1');
    }

    if (guardianPhone2 && (typeof guardianPhone2 !== 'string' || !/^\+?[\d\s-()]{10,15}$/.test(guardianPhone2))) {
      errors.push('Please provide a valid guardian phone number 2');
    }

    if (gender && !['MALE', 'FEMALE'].includes(gender)) {
      errors.push('Gender must be either MALE or FEMALE');
    }

    // Password validation if updating password
    if (newPassword) {
      if (!currentPassword) {
        errors.push('Current password is required to set a new password');
      } else {
        // Verify current password
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { passwordHash: true }
        });
        
        const isValidPassword = await bcrypt.compare(currentPassword, user?.passwordHash || '');
        if (!isValidPassword) {
          errors.push('Current password is incorrect');
        }
      }

      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        errors.push('New password must be at least 6 characters long');
      }
    }

    if (errors.length > 0) {
      return json({ error: errors.join(', ') }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (department !== undefined) updateData.department = department ? department.trim() : null;
    if (faculty !== undefined) updateData.faculty = faculty ? faculty.trim() : null;
    if (gender !== undefined) updateData.gender = gender || null;
    if (religion !== undefined) updateData.religion = religion ? religion.trim() : null;
    if (nationality !== undefined) updateData.nationality = nationality ? nationality.trim() : null;
    if (stateOfOrigin !== undefined) updateData.stateOfOrigin = stateOfOrigin ? stateOfOrigin.trim() : null;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber ? phoneNumber.trim() : null;
    if (guardianPhone1 !== undefined) updateData.guardianPhone1 = guardianPhone1 ? guardianPhone1.trim() : null;
    if (guardianRelationship1 !== undefined) updateData.guardianRelationship1 = guardianRelationship1 ? guardianRelationship1.trim() : null;
    if (guardianPhone2 !== undefined) updateData.guardianPhone2 = guardianPhone2 ? guardianPhone2.trim() : null;
    if (guardianRelationship2 !== undefined) updateData.guardianRelationship2 = guardianRelationship2 ? guardianRelationship2.trim() : null;
    
    if (newPassword) {
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        matricNo: true,
        role: true,
        admissionYear: true,
        department: true,
        faculty: true,
        religion: true,
        stateOfOrigin: true,
        dateOfBirth: true,
        phoneNumber: true,
        updatedAt: true
      }
    });

    // Calculate current academic level
    let currentLevel: string = 'Unknown';
    let levelDescription = 'Unknown';
    let admissionYear = updatedUser.admissionYear;
    
    // If admission year is not set, try to extract from matric number
    if (!admissionYear && updatedUser.matricNo) {
      const extractedYear = extractAdmissionYearFromMatricNo(updatedUser.matricNo);
      if (extractedYear) {
        admissionYear = extractedYear;
      }
    }
    
    if (admissionYear) {
      try {
        const calculatedLevel = calculateAcademicLevel(admissionYear);
        currentLevel = calculatedLevel;
        levelDescription = getLevelDescription(calculatedLevel);
      } catch {
        currentLevel = 'Unknown';
        levelDescription = 'Unknown';
      }
    }

    return json({
      message: 'Profile updated successfully',
      user: {
        ...updatedUser,
        admissionYear, // Use the calculated admission year
        currentLevel,
        levelDescription
      }
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return json({ error: 'Failed to update profile' }, { status: 500 });
  }
};
