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

    const allocationSettings = await request.json();
    
    console.log('Running allocation algorithm with settings:', allocationSettings);
    
    // Redirect to the existing allocation run endpoint
    // This endpoint should use the existing allocation run logic
    const response = await fetch('/api/admin/allocations/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `accessToken=${token}`
      },
      body: JSON.stringify({
        settings: allocationSettings,
        maxAllocationsPerRun: 50 // Default value
      })
    });

    if (response.ok) {
      const result = await response.json();
      return json(result);
    } else {
      return json({ error: 'Allocation algorithm failed' }, { status: 500 });
    }

  } catch (error) {
    console.error('Allocation algorithm error:', error);
    return json({ error: 'Allocation algorithm failed' }, { status: 500 });
  }
};
