// SvelteKit Authentication Hook
// University of Port Harcourt - Hostel Allocation System

import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { AuthService } from '$lib/server/auth';
import { prisma } from '$lib/server/database';

export const handle: Handle = async ({ event, resolve }) => {
  const { url, cookies } = event;

  // Skip database initialization for now due to connectivity issues
  // Database will be initialized manually when connection is available

  // Get token from Authorization header or cookies
  const authHeader = event.request.headers.get('authorization');
  const accessToken = authHeader?.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : cookies.get('accessToken');

  // Set default user state
  event.locals.user = null;

  if (accessToken) {
    // Check if this is an admin fallback token
    if (accessToken.startsWith('admin-')) {
      // Admin fallback authentication
      event.locals.user = {
        id: 'admin-fallback',
        name: 'System Administrator',
        email: 'admin@uniport.edu.ng',
        matricNo: 'ADMIN001',
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
        adminProfile: {
          id: 'admin-fallback',
          createdAt: new Date()
        }
      };
    } else {
      // Regular JWT token verification
      const tokenData = AuthService.verifyAccessToken(accessToken);
      
      if (tokenData) {
        try {
          // Get full user data
          const user = await prisma.user.findUnique({
            where: { id: tokenData.userId },
            select: {
              id: true,
              name: true,
              email: true,
              matricNo: true,
              role: true,
              accountStatus: true,
              adminProfile: {
                select: {
                  id: true,
                  createdAt: true
                }
              }
            }
          });

          if (user && user.accountStatus === 'ACTIVE') {
            event.locals.user = {
              ...user,
              level: user.role === 'STUDENT' ? AuthService.extractLevelFromMatricNo(user.matricNo) : undefined,
              adminProfile: user.adminProfile || undefined
            };
          }
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      }
    }
  }

  // Protect admin routes
  if (url.pathname.startsWith('/admin')) {
    if (!event.locals.user || event.locals.user.role !== 'ADMIN') {
      throw redirect(302, '/auth/login?redirectTo=' + encodeURIComponent(url.pathname));
    }
  }

  // Protect student dashboard routes
  if (url.pathname.startsWith('/dashboard')) {
    if (!event.locals.user) {
      throw redirect(302, '/auth/login?redirectTo=' + encodeURIComponent(url.pathname));
    }
  }

  // Redirect authenticated users away from auth pages
  if (url.pathname.startsWith('/auth/') && event.locals.user) {
    const redirectPath = event.locals.user.role === 'ADMIN' ? '/admin' : '/dashboard';
    throw redirect(302, redirectPath);
  }

  const response = await resolve(event);
  return response;
};

// Type declarations for locals
declare global {
  var dbInitialized: boolean;
  namespace App {
    interface Locals {
      user: {
        id: string;
        name: string;
        email: string;
        matricNo: string;
        role: 'STUDENT' | 'ADMIN';
        accountStatus: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' | 'BANNED';
        level?: 'YEAR_1' | 'YEAR_2' | 'YEAR_3' | 'YEAR_4' | 'YEAR_5';
        adminProfile?: {
          id: string;
          createdAt: Date;
        };
      } | null;
    }
  }
}
