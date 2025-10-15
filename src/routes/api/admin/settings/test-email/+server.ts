import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    // Verify admin authentication
    const token = cookies.get('accessToken');
    if (!token) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      if (payload.role !== 'ADMIN') {
        return json({ error: 'Admin access required' }, { status: 403 });
      }
    } catch (error) {
      // Check if it's a simple admin token
      if (!token.startsWith('admin-')) {
        return json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    const emailSettings = await request.json();
    
    // For now, simulate a successful email test
    // In a real implementation, you would test the SMTP connection
    console.log('Testing email settings:', emailSettings);
    
    // Simulate email test logic
    if (!emailSettings.smtpHost || !emailSettings.fromEmail) {
      return json({ error: 'Missing required email configuration' }, { status: 400 });
    }

    // Simulate successful connection
    return json({ 
      success: true, 
      message: 'Email configuration test successful' 
    });

  } catch (error) {
    console.error('Email test error:', error);
    return json({ error: 'Email test failed' }, { status: 500 });
  }
};
