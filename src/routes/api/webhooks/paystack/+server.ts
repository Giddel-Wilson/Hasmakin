// Paystack Webhook Handler
// University of Port Harcourt - Hostel Allocation System

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';
import { env } from '$env/dynamic/private';
import crypto from 'crypto';

/**
 * Webhook endpoint to receive payment notifications from Paystack
 * This endpoint is called by Paystack when payment status changes
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    // Verify webhook signature
    if (!signature) {
      console.error('[Webhook] No signature provided');
      return json({ error: 'No signature' }, { status: 400 });
    }

    const hash = crypto
      .createHmac('sha512', env.PAYSTACK_SECRET_KEY || '')
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('[Webhook] Invalid signature');
      return json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Parse webhook data
    const event = JSON.parse(body);
    console.log('[Webhook] Received event:', event.event);

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handlePaymentSuccess(event.data);
        break;
        
      case 'charge.failed':
        await handlePaymentFailed(event.data);
        break;
        
      default:
        console.log('[Webhook] Unhandled event type:', event.event);
    }

    return json({ success: true });

  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    return json({ error: 'Webhook processing failed' }, { status: 500 });
  }
};

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(data: any) {
  try {
    const reference = data.reference;
    console.log('[Webhook] Processing successful payment:', reference);

    // Find payment in database
    const payment = await prisma.payment.findFirst({
      where: { reference },
      include: {
        application: true
      }
    });

    if (!payment) {
      console.error('[Webhook] Payment not found:', reference);
      return;
    }

    // Check if already processed
    if (payment.status === 'COMPLETED') {
      console.log('[Webhook] Payment already processed:', reference);
      return;
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(data.paid_at),
        transactionId: data.id.toString(),
        gatewayResponse: data.gateway_response
      }
    });

    // Update application payment status
    await prisma.application.update({
      where: { id: payment.applicationId },
      data: {
        paymentStatus: 'COMPLETED'
      }
    });

    console.log('[Webhook] Payment processed successfully:', {
      reference,
      amount: data.amount / 100,
      status: 'COMPLETED'
    });

  } catch (error) {
    console.error('[Webhook] Error handling payment success:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(data: any) {
  try {
    const reference = data.reference;
    console.log('[Webhook] Processing failed payment:', reference);

    // Find payment in database
    const payment = await prisma.payment.findFirst({
      where: { reference }
    });

    if (!payment) {
      console.error('[Webhook] Payment not found:', reference);
      return;
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        failureReason: data.message || data.gateway_response
      }
    });

    console.log('[Webhook] Payment marked as failed:', reference);

  } catch (error) {
    console.error('[Webhook] Error handling payment failure:', error);
  }
}
