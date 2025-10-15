// Authentication Utilities
// University of Port Harcourt - Hostel Allocation System

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { UserRole } from '@prisma/client';
import { extractAdmissionYearFromMatricNo, calculateAcademicLevel } from '$lib/academic-levels';

interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  matricNo?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

export class AuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT tokens
  static generateTokens(payload: JWTPayload): TokenPair {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '15m',
      issuer: 'uniport-hostel-system',
      audience: 'uniport-students-admins'
    });

    const refreshToken = jwt.sign(
      { userId: payload.userId, tokenType: 'refresh' },
      JWT_REFRESH_SECRET,
      {
        expiresIn: '7d',
        issuer: 'uniport-hostel-system',
        audience: 'uniport-students-admins'
      }
    );

    return { accessToken, refreshToken };
  }

  // Verify access token
  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'uniport-hostel-system',
        audience: 'uniport-students-admins'
      }) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
        issuer: 'uniport-hostel-system',
        audience: 'uniport-students-admins'
      }) as { userId: string; tokenType: string };
      
      if (decoded.tokenType !== 'refresh') {
        return null;
      }
      
      return { userId: decoded.userId };
    } catch (error) {
      return null;
    }
  }

  // Validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate University of Port Harcourt email
  static isValidUniversityEmail(email: string): boolean {
    const uniportDomains = ['uniport.edu.ng', 'student.uniport.edu.ng'];
    const domain = email.split('@')[1]?.toLowerCase();
    return uniportDomains.includes(domain);
  }

  // Validate matriculation number format
  static isValidMatricNumber(matricNo: string): boolean {
    // Format: U2021/5570062 (U + year + / + 7 digits)
    const matricRegex = /^U\d{4}\/\d{7}$/;
    return matricRegex.test(matricNo);
  }

  // Validate password strength
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Extract user level from matriculation number (deprecated - use academic-levels.ts instead)
  static extractLevelFromMatricNo(matricNo: string): 'YEAR_1' | 'YEAR_2' | 'YEAR_3' | 'YEAR_4' | 'YEAR_5' {
    const admissionYear = extractAdmissionYearFromMatricNo(matricNo);
    if (admissionYear) {
      try {
        return calculateAcademicLevel(admissionYear);
      } catch (error) {
        console.error('Error calculating academic level:', error);
      }
    }
    
    // Fallback to old logic if new calculation fails
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    let academicYear = currentYear;
    if (currentMonth < 11) {
      academicYear = currentYear - 1;
    }
    
    const matricYear = parseInt(matricNo.substring(1, 5));
    const yearsDifference = academicYear - matricYear;

    switch (yearsDifference) {
      case 0:
        return 'YEAR_1';
      case 1:
        return 'YEAR_2';
      case 2:
        return 'YEAR_3';
      case 3:
        return 'YEAR_4';
      case 4:
      default:
        return 'YEAR_5';
    }
  }

  // Generate secure random token
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// Rate limiting for authentication
export class RateLimiter {
  private static attempts: Map<string, { count: number; firstAttempt: Date }> = new Map();
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  static checkRateLimit(identifier: string): { allowed: boolean; remainingAttempts: number; resetTime?: Date } {
    const now = new Date();
    const record = this.attempts.get(identifier);

    if (!record) {
      this.attempts.set(identifier, { count: 1, firstAttempt: now });
      return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS - 1 };
    }

    // Reset if window has passed
    if (now.getTime() - record.firstAttempt.getTime() > this.WINDOW_MS) {
      this.attempts.set(identifier, { count: 1, firstAttempt: now });
      return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS - 1 };
    }

    // Increment attempts
    record.count++;

    if (record.count > this.MAX_ATTEMPTS) {
      const resetTime = new Date(record.firstAttempt.getTime() + this.WINDOW_MS);
      return { allowed: false, remainingAttempts: 0, resetTime };
    }

    return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS - record.count };
  }

  static reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  static clearAll(): void {
    this.attempts.clear();
  }
}
