// Student Registration API Endpoint
// University of Port Harcourt - Hostel Allocation System

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';
import { AuthService, RateLimiter } from '$lib/server/auth';
import { extractAdmissionYearFromMatricNo } from '$lib/academic-levels';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  try {
    const clientIP = getClientAddress();
    
    // Rate limiting
    const rateCheck = RateLimiter.checkRateLimit(`register:${clientIP}`);
    if (!rateCheck.allowed) {
      return json(
        { 
          error: 'Too many registration attempts. Please try again later.',
          resetTime: rateCheck.resetTime 
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, matricNo, password, confirmPassword } = body;

    // Validation
    if (!name || !email || !matricNo || !password || !confirmPassword) {
      return json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return json({ error: 'Passwords do not match' }, { status: 400 });
    }

    // Validate email format
    if (!AuthService.isValidEmail(email)) {
      return json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate university email
    if (!AuthService.isValidUniversityEmail(email)) {
      return json({ 
        error: 'Please use your University of Port Harcourt email (@uniport.edu.ng or @student.uniport.edu.ng)' 
      }, { status: 400 });
    }

    // Validate matriculation number
    if (!AuthService.isValidMatricNumber(matricNo)) {
      return json({ 
        error: 'Invalid matriculation number format. Use format: U2021/5570062' 
      }, { status: 400 });
    }

    // Validate password strength
    const passwordValidation = AuthService.validatePassword(password);
    if (!passwordValidation.isValid) {
      return json({ 
        error: 'Password requirements not met',
        details: passwordValidation.errors 
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { matricNo: matricNo.toUpperCase() }
        ]
      }
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'email' : 'matriculation number';
      return json({ error: `A user with this ${field} already exists` }, { status: 409 });
    }

    // Hash password
    const passwordHash = await AuthService.hashPassword(password);

    // Extract admission year from matric number
    const admissionYear = extractAdmissionYearFromMatricNo(matricNo);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        matricNo: matricNo.toUpperCase(),
        passwordHash,
        role: 'STUDENT',
        admissionYear
      },
      select: {
        id: true,
        name: true,
        email: true,
        matricNo: true,
        role: true,
        accountStatus: true,
        createdAt: true
      }
    });

    // Generate tokens
    const level = AuthService.extractLevelFromMatricNo(matricNo);
    const tokens = AuthService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      matricNo: user.matricNo
    });

    // Reset rate limiter on successful registration
    RateLimiter.reset(`register:${clientIP}`);

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        details: {
          email: user.email,
          matricNo: user.matricNo,
          level: level
        },
        ipAddress: clientIP,
        userAgent: request.headers.get('user-agent')
      }
    });

    // Set HTTP-only cookies for tokens
    const cookieOptions = 'HttpOnly; Path=/; SameSite=Lax';
    const accessTokenCookie = `accessToken=${tokens.accessToken}; ${cookieOptions}; Max-Age=900`; // 15 minutes
    const refreshTokenCookie = `refreshToken=${tokens.refreshToken}; ${cookieOptions}; Max-Age=604800`; // 7 days

    const response = json({
      message: 'Registration successful',
      user,
      tokens,
      level
    }, { status: 201 });

    // Set multiple cookies
    response.headers.set('Set-Cookie', accessTokenCookie);
    response.headers.append('Set-Cookie', refreshTokenCookie);

    return response;

  } catch (error) {
    console.error('Registration error:', error);
    return json({ 
      error: 'Internal server error. Please try again later.' 
    }, { status: 500 });
  }
};
