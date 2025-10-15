import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
  try {
    // Clear authentication cookies
    const response = json({ success: true, message: 'Logged out successfully' });
    
    // Clear cookies by setting them with past expiration date
    const expiredCookie = 'HttpOnly; Path=/; SameSite=Lax; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    response.headers.set('Set-Cookie', `accessToken=; ${expiredCookie}`);
    response.headers.append('Set-Cookie', `refreshToken=; ${expiredCookie}`);

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return json({ error: 'Logout failed' }, { status: 500 });
  }
};
