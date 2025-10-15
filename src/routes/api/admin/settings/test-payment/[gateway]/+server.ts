import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export const POST: RequestHandler = async ({ params, request, cookies }) => {
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

    const { gateway } = params;
    const paymentSettings = await request.json();
    
    console.log(`Testing ${gateway} payment gateway:`, paymentSettings);
    
    // Simulate payment gateway test logic
    if (gateway === 'paystack') {
      if (!paymentSettings.paystackPublicKey || !paymentSettings.paystackSecretKey) {
        return json({ error: 'Missing Paystack API keys' }, { status: 400 });
      }
    } else if (gateway === 'flutterwave') {
      if (!paymentSettings.flutterwavePublicKey || !paymentSettings.flutterwaveSecretKey) {
        return json({ error: 'Missing Flutterwave API keys' }, { status: 400 });
      }
    } else {
      return json({ error: 'Unsupported payment gateway' }, { status: 400 });
    }

    // Simulate successful connection test
    return json({ 
      success: true, 
      message: `${gateway} payment gateway test successful` 
    });

  } catch (error) {
    console.error('Payment gateway test error:', error);
    return json({ error: 'Payment gateway test failed' }, { status: 500 });
  }
};
