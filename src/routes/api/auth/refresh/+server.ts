// Token Refresh API Endpoint
// University of Port Harcourt - Hostel Allocation System

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';
import { AuthService } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    console.log('=== Refresh Token Request ===');
    
    // Try to get refresh token from cookie first, then fall back to request body
    let refreshToken = cookies.get('refreshToken');
    
    if (!refreshToken) {
      // Fall back to request body for backwards compatibility
      const body = await request.json().catch(() => ({}));
      refreshToken = body.refreshToken;
    }
    
    console.log('Refresh token provided:', !!refreshToken);
    console.log('Refresh token source:', cookies.get('refreshToken') ? 'cookie' : 'body');

    if (!refreshToken) {
      console.log('No refresh token provided');
      return json({ error: 'Refresh token is required' }, { status: 400 });
    }

    // Verify refresh token
    const tokenData = AuthService.verifyRefreshToken(refreshToken);
    console.log('Refresh token verification result:', !!tokenData);
    
    if (!tokenData) {
      console.log('Invalid refresh token');
      return json({ error: 'Invalid refresh token' }, { status: 401 });
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: {
        id: true,
        email: true,
        matricNo: true,
        role: true,
        accountStatus: true
      }
    });

    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Check account status
    if (user.accountStatus !== 'ACTIVE') {
      return json({ error: 'Account is not active' }, { status: 403 });
    }

    // Generate new tokens
    const tokens = AuthService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      matricNo: user.matricNo
    });

    console.log('Generated new tokens');
    console.log('  New access token preview:', tokens.accessToken.substring(0, 30) + '...');
    console.log('  Setting cookies...');
    
    // Set HTTP-only cookies for new tokens using SvelteKit's cookie API
    cookies.set('accessToken', tokens.accessToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 900, // 15 minutes
      secure: false // Set to true in production with HTTPS
    });
    
    cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 604800, // 7 days
      secure: false // Set to true in production with HTTPS
    });

    console.log('✅ Cookies set successfully');

    return json({
      message: 'Tokens refreshed successfully',
      tokens
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return json({ 
      error: 'Internal server error. Please try again later.' 
    }, { status: 500 });
  }
};
