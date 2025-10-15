// Paystack Payment Service
// University of Port Harcourt - Hostel Allocation System

import Paystack from 'paystack-api';
import { env } from '$env/dynamic/private';

const paystack = Paystack(env.PAYSTACK_SECRET_KEY || '');

export interface PaymentInitializationData {
  email: string;
  amount: number; // In kobo (Nigerian currency)
  reference: string;
  metadata?: {
    userId: string;
    applicationId: string;
    studentName: string;
    matricNo: string;
    [key: string]: any;
  };
  callback_url?: string;
}

export interface PaymentVerificationResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    fees: number;
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string | null;
    };
  };
}

export class PaymentService {
  /**
   * Check if Paystack is properly configured
   */
  static isConfigured(): boolean {
    const secretKey = env.PAYSTACK_SECRET_KEY || '';
    // Check if it's a real key (not placeholder)
    const isRealKey = (secretKey.startsWith('sk_test_') || secretKey.startsWith('sk_live_')) 
                      && !secretKey.includes('your-paystack') 
                      && secretKey.length > 20;
    return isRealKey;
  }

  /**
   * Initialize a payment transaction
   */
  static async initializePayment(data: PaymentInitializationData) {
    try {
      console.log('[PaymentService] Initializing payment:', {
        email: data.email,
        amount: data.amount,
        reference: data.reference
      });

      // Check if Paystack is configured
      if (!this.isConfigured()) {
        console.warn('[PaymentService] Paystack not configured - using demo mode');
        return {
          success: true,
          authorization_url: `${env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/payments/demo?reference=${data.reference}&amount=${data.amount}`,
          access_code: 'DEMO_ACCESS_CODE',
          reference: data.reference,
          demo: true
        };
      }

      const response = await paystack.transaction.initialize({
        email: data.email,
        amount: Math.round(data.amount * 100), // Convert to kobo
        reference: data.reference,
        metadata: data.metadata,
        callback_url: data.callback_url || `${env.FRONTEND_URL}/dashboard/payments/verify`
      });

      console.log('[PaymentService] Payment initialized:', response.data);

      return {
        success: true,
        authorization_url: response.data.authorization_url,
        access_code: response.data.access_code,
        reference: response.data.reference
      };
    } catch (error: any) {
      console.error('[PaymentService] Payment initialization failed:', error);
      
      // If it's an invalid key error, fall back to demo mode
      if (error.message?.includes('Invalid key') || error.statusCode === 401) {
        console.warn('[PaymentService] Invalid Paystack key - falling back to demo mode');
        return {
          success: true,
          authorization_url: `${env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/payments/demo?reference=${data.reference}&amount=${data.amount}`,
          access_code: 'DEMO_ACCESS_CODE',
          reference: data.reference,
          demo: true
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to initialize payment'
      };
    }
  }

  /**
   * Verify a payment transaction
   */
  static async verifyPayment(reference: string): Promise<PaymentVerificationResponse | null> {
    try {
      console.log('[PaymentService] Verifying payment:', reference);

      const response = await paystack.transaction.verify({
        reference
      });

      console.log('[PaymentService] Payment verified:', {
        status: response.data.status,
        amount: response.data.amount,
        reference: response.data.reference
      });

      return response as PaymentVerificationResponse;
    } catch (error: any) {
      console.error('[PaymentService] Payment verification failed:', error);
      return null;
    }
  }

  /**
   * Get transaction details
   */
  static async getTransaction(id: number) {
    try {
      const response = await paystack.transaction.get({ id });
      return response.data;
    } catch (error: any) {
      console.error('[PaymentService] Failed to get transaction:', error);
      return null;
    }
  }

  /**
   * List transactions
   */
  static async listTransactions(params?: { 
    perPage?: number; 
    page?: number;
    customer?: string;
    status?: string;
    from?: string;
    to?: string;
  }) {
    try {
      const response = await paystack.transaction.list(params);
      return response.data;
    } catch (error: any) {
      console.error('[PaymentService] Failed to list transactions:', error);
      return [];
    }
  }

  /**
   * Generate a unique payment reference
   */
  static generateReference(prefix = 'PAY'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Convert naira to kobo
   */
  static nairaToKobo(naira: number): number {
    return Math.round(naira * 100);
  }

  /**
   * Convert kobo to naira
   */
  static koboToNaira(kobo: number): number {
    return kobo / 100;
  }
}
