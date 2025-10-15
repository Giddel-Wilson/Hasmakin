import type { RequestHandler } from './$types';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';

export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const token = cookies.get('auth-token');
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'No token provided' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for simple admin token (fallback mode)
    if (token.startsWith('admin-')) {
      return new Response(JSON.stringify({
        user: {
          id: 'admin-fallback',
          name: 'System Administrator',
          email: 'admin@uniport.edu.ng',
          matricNo: 'ADMIN001',
          role: 'ADMIN'
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Try to verify as JWT token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      if (!decoded || !decoded.userId) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // For demo mode, return admin user data
      if (decoded.email === 'admin@uniport.edu.ng') {
        return new Response(JSON.stringify({
          user: {
            id: 'admin',
            name: 'System Administrator',
            email: 'admin@uniport.edu.ng',
            matricNo: 'ADMIN001',
            role: 'ADMIN'
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // TODO: When database is available, fetch user from database
      // For now, return basic user data from token
      return new Response(JSON.stringify({
        user: {
          id: decoded.userId,
          name: decoded.name || 'User',
          email: decoded.email,
          matricNo: decoded.matricNo || 'N/A',
          role: decoded.role || 'STUDENT'
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Token verification error:', error);
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
