// Student Payments API Endpoint
// University of Port Harcourt - Hostel Allocation System

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';
import { AuthService } from '$lib/server/auth';
import { PaymentService } from '$lib/server/payments';

export const GET: RequestHandler = async ({ cookies }) => {
  try {
    // Verify authentication
    const token = cookies.get('accessToken');
    if (!token) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = AuthService.verifyAccessToken(token);
      if (!decoded) {
        return json({ error: 'Invalid authentication token' }, { status: 401 });
      }
      userId = decoded.userId;
    } catch (error) {
      return json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Get user's payments
    const payments = await prisma.payment.findMany({
      where: { 
        application: {
          userId: userId
        }
      },
      include: {
        application: {
          select: {
            id: true,
            applicationStatus: true,
            preferences: true,
            submittedAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get current application if exists
    const currentApplication = await prisma.application.findFirst({
      where: { 
        userId,
        applicationStatus: { in: ['PENDING', 'APPROVED', 'ALLOCATED'] }
      },
      orderBy: { submittedAt: 'desc' }
    });

    return json({
      payments,
      currentApplication,
      canMakePayment: currentApplication && 
        (currentApplication.applicationStatus === 'PENDING' || currentApplication.applicationStatus === 'APPROVED')
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    return json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ cookies, request }) => {
  console.log('[Payment API] POST request received');
  
  try {
    // Verify authentication
    const token = cookies.get('accessToken');
    if (!token) {
      console.error('[Payment API] No access token found');
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    let userId: string;
    let userEmail: string;
    let userName: string;
    let matricNo: string;
    
    try {
      const decoded = AuthService.verifyAccessToken(token);
      if (!decoded) {
        console.error('[Payment API] Invalid token - decoded to null');
        return json({ error: 'Invalid authentication token' }, { status: 401 });
      }
      userId = decoded.userId;
      userEmail = decoded.email;
      userName = decoded.name || 'Student';
      matricNo = decoded.matricNo || 'N/A';
      console.log('[Payment API] User authenticated:', { userId, email: userEmail });
    } catch (error) {
      console.error('[Payment API] Token verification failed:', error);
      return json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const { amount, paymentMethod = 'CARD', proofOfPayment, proofFileName } = await request.json();
    console.log('[Payment API] Payment request:', { amount, paymentMethod, hasProof: !!proofOfPayment });

    // Validate amount
    if (!amount || amount <= 0) {
      console.error('[Payment API] Invalid amount:', amount);
      return json({ error: 'Valid payment amount is required' }, { status: 400 });
    }

    // Get current application with user details
    const application = await prisma.application.findFirst({
      where: { 
        userId,
        applicationStatus: { in: ['PENDING', 'APPROVED', 'ALLOCATED'] }
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            matricNo: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    if (!application) {
      return json({ 
        error: 'No active hostel application found. Please submit an application first.' 
      }, { status: 400 });
    }

    // Check if payment already exists for this application
    const existingPayment = await prisma.payment.findFirst({
      where: { 
        applicationId: application.id,
        status: { in: ['PENDING', 'COMPLETED'] }
      }
    });

    if (existingPayment) {
      return json({ 
        error: 'Payment already exists for this application',
        payment: existingPayment
      }, { status: 400 });
    }

    // Generate unique payment reference
    const reference = PaymentService.generateReference('UNIPORT');

    // Handle bank transfer (manual payment)
    if (paymentMethod === 'BANK_TRANSFER') {
      console.log('[Payment API] Processing bank transfer payment');
      
      // Create payment record with PENDING status
      const payment = await prisma.payment.create({
        data: {
          userId,
          applicationId: application.id,
          amount: parseFloat(amount.toString()),
          paymentMethod: 'BANK_TRANSFER',
          status: 'PENDING', // Admin needs to verify
          reference,
          gatewayResponse: 'Awaiting admin verification',
          paystackData: proofOfPayment ? {
            proofOfPayment: proofOfPayment,
            proofFileName: proofFileName,
            submittedAt: new Date().toISOString()
          } : null
        }
      });

      console.log('[Payment API] Bank transfer payment created:', {
        reference,
        amount: payment.amount,
        applicationId: application.id,
        status: 'PENDING'
      });

      return json({
        success: true,
        message: 'Payment submitted successfully. Awaiting admin verification.',
        payment: {
          id: payment.id,
          reference: payment.reference,
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.createdAt
        }
      });
    }

    // Handle card payment (Paystack gateway)
    // Initialize Paystack payment
    const paymentInit = await PaymentService.initializePayment({
      email: application.user.email,
      amount: parseFloat(amount.toString()),
      reference,
      metadata: {
        userId,
        applicationId: application.id,
        studentName: application.user.name,
        matricNo: application.user.matricNo,
        paymentMethod,
        description: 'University of Port Harcourt Hostel Accommodation Fee'
      }
    });

    if (!paymentInit.success) {
      return json({ 
        error: paymentInit.error || 'Failed to initialize payment' 
      }, { status: 500 });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        applicationId: application.id,
        amount: parseFloat(amount.toString()),
        paymentMethod,
        status: 'PENDING',
        reference
      }
    });

    console.log('[Payment API] Payment initialized:', {
      reference,
      amount: payment.amount,
      applicationId: application.id
    });

    return json({
      success: true,
      message: 'Payment initialized successfully',
      authorization_url: paymentInit.authorization_url,
      access_code: paymentInit.access_code,
      reference: payment.reference,
      payment: {
        id: payment.id,
        reference: payment.reference,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    return json({ error: 'Failed to initiate payment' }, { status: 500 });
  }
};
