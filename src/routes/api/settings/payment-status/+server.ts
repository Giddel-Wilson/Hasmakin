// Payment Status API
// Returns whether payment period is open and deadline information

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';

export const GET: RequestHandler = async () => {
  try {
    // Fetch payment start date setting
    const paymentStartSetting = await prisma.systemSettings.findUnique({
      where: { key: 'payment_start_date' }
    });

    // Fetch payment deadline setting
    const paymentDeadlineSetting = await prisma.systemSettings.findUnique({
      where: { key: 'payment_deadline' }
    });

    const now = new Date();
    let paymentStartDate: Date | null = null;
    let paymentDeadline: Date | null = null;
    let paymentStatus: 'not_started' | 'open' | 'closed' = 'closed';

    // Parse start date
    if (paymentStartSetting?.value) {
      const startValue = paymentStartSetting.value as any;
      let dateString = null;
      
      if (typeof startValue === 'string') {
        // Try to parse if it's a JSON string
        try {
          const parsed = JSON.parse(startValue);
          dateString = typeof parsed === 'string' ? parsed : startValue;
        } catch {
          dateString = startValue;
        }
        
        // Trim whitespace
        if (dateString) {
          dateString = dateString.trim();
        }
      } else if (startValue.startDate) {
        dateString = startValue.startDate;
      }
      
      if (dateString) {
        // Fix incomplete ISO strings from datetime-local inputs (YYYY-MM-DDTHH:MM -> YYYY-MM-DDTHH:MM:00Z)
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
          dateString = dateString + ':00Z';
        }
        
        paymentStartDate = new Date(dateString);
        // Validate the date
        if (isNaN(paymentStartDate.getTime())) {
          console.warn('[Payment Status] Invalid start date:', dateString);
          paymentStartDate = null;
        }
      }
    }

    // Parse deadline
    if (paymentDeadlineSetting?.value) {
      const deadlineValue = paymentDeadlineSetting.value as any;
      let dateString = null;
      
      if (typeof deadlineValue === 'string') {
        // Try to parse if it's a JSON string
        try {
          const parsed = JSON.parse(deadlineValue);
          dateString = typeof parsed === 'string' ? parsed : deadlineValue;
        } catch {
          dateString = deadlineValue;
        }
        
        // Trim whitespace
        if (dateString) {
          dateString = dateString.trim();
        }
      } else if (deadlineValue.deadline) {
        dateString = deadlineValue.deadline;
      }
      
      if (dateString) {
        // Fix incomplete ISO strings from datetime-local inputs (YYYY-MM-DDTHH:MM -> YYYY-MM-DDTHH:MM:00Z)
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
          dateString = dateString + ':00Z';
        }
        
        paymentDeadline = new Date(dateString);
        // Validate the date
        if (isNaN(paymentDeadline.getTime())) {
          console.warn('[Payment Status] Invalid deadline date:', dateString);
          paymentDeadline = null;
        }
      }
    }

    // Determine payment status based on start and end dates
    // Priority 1: If no start date is set, show not_started (not configured yet)
    if (!paymentStartDate) {
      paymentStatus = 'not_started';
    }
    // Priority 2: If start date is in the future, show not_started
    else if (paymentStartDate && now < paymentStartDate) {
      paymentStatus = 'not_started';
    }
    // Priority 3: If deadline is set and we're past it, show closed
    else if (paymentDeadline && now > paymentDeadline) {
      paymentStatus = 'closed';
    }
    // Priority 4: We're between start and deadline (or no deadline set), show open
    else {
      paymentStatus = 'open';
    }

    return json({
      status: paymentStatus,
      isOpen: paymentStatus === 'open',
      startDate: paymentStartDate?.toISOString() || null,
      deadline: paymentDeadline?.toISOString() || null,
      message: getStatusMessage(paymentStatus, paymentStartDate, paymentDeadline)
    });

  } catch (error) {
    console.error('[Payment Status] Error:', error);
    // Default to closed if error
    return json({
      status: 'closed',
      isOpen: false,
      startDate: null,
      deadline: null,
      message: 'Unable to verify payment status. Please contact administration.'
    });
  }
};

function getStatusMessage(status: 'not_started' | 'open' | 'closed', startDate: Date | null, deadline: Date | null): string {
  switch (status) {
    case 'not_started':
      if (startDate) {
        return `Payment period will open on ${startDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}.`;
      }
      return 'Payment period has not started yet. Please check back later.';
    case 'closed':
      if (deadline) {
        return `Payment period closed on ${deadline.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}.`;
      }
      return 'Payment period is currently closed.';
    case 'open':
      if (deadline) {
        return `Payment period closes on ${deadline.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}.`;
      }
      return 'Payment period is currently open.';
  }
}
