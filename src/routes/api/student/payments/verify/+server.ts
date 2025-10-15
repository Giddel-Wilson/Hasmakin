// Payment Verification API Endpoint
// University of Port Harcourt - Hostel Allocation System

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';
import { AuthService } from '$lib/server/auth';
import { PaymentService } from '$lib/server/payments';

export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    const reference = url.searchParams.get('reference');
    
    if (!reference) {
      return json({ error: 'Payment reference is required' }, { status: 400 });
    }

    console.log('[Payment Verification] Verifying payment:', reference);

    // Verify payment with Paystack
    const verification = await PaymentService.verifyPayment(reference);

    if (!verification || !verification.status) {
      return json({ 
        error: 'Payment verification failed',
        details: 'Unable to verify payment with payment gateway'
      }, { status: 400 });
    }

    const paymentData = verification.data;

    // Find payment record in database
    const payment = await prisma.payment.findFirst({
      where: { reference },
      include: {
        application: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                matricNo: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      return json({ 
        error: 'Payment record not found',
        details: 'This payment reference does not exist in our system'
      }, { status: 404 });
    }

    // Check if payment was successful
    if (paymentData.status === 'success') {
      // Update payment status in database
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          paidAt: new Date(paymentData.paid_at),
          transactionId: paymentData.id.toString(),
          gatewayResponse: paymentData.gateway_response
        }
      });

      // Update application payment status
      await prisma.application.update({
        where: { id: payment.applicationId },
        data: {
          paymentStatus: 'COMPLETED'
        }
      });

      console.log('[Payment Verification] Payment completed:', {
        reference,
        amount: paymentData.amount / 100,
        status: 'COMPLETED'
      });

      return json({
        success: true,
        message: 'Payment verified successfully',
        payment: {
          reference: updatedPayment.reference,
          amount: updatedPayment.amount,
          status: updatedPayment.status,
          paidAt: updatedPayment.paidAt
        }
      });

    } else {
      // Payment failed or pending
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentData.status === 'failed' ? 'FAILED' : 'PENDING',
          failureReason: paymentData.message || paymentData.gateway_response
        }
      });

      console.log('[Payment Verification] Payment not successful:', {
        reference,
        status: paymentData.status
      });

      return json({
        success: false,
        message: 'Payment was not successful',
        status: paymentData.status,
        payment: {
          reference: payment.reference,
          status: paymentData.status
        }
      });
    }

  } catch (error) {
    console.error('[Payment Verification] Error:', error);
    return json({ 
      error: 'Payment verification failed',
      details: 'An error occurred while verifying your payment'
    }, { status: 500 });
  }
};
