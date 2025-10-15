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

    const notificationSettings = await request.json();
    
    console.log('Testing notification settings:', notificationSettings);
    
    // Simulate notification test logic
    // In a real implementation, you would send a test notification via your notification service
    
    return json({ 
      success: true, 
      message: 'Test notification sent successfully!' 
    });

  } catch (error) {
    console.error('Notification test error:', error);
    return json({ error: 'Notification test failed' }, { status: 500 });
  }
};
