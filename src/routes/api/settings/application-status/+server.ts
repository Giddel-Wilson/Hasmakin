// Application Status API
// Returns whether applications are open and deadline information

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';

export const GET: RequestHandler = async () => {
  try {
    // Fetch application start date setting
    const applicationStartSetting = await prisma.systemSettings.findUnique({
      where: { key: 'application_start_date' }
    });

    // Fetch application deadline setting
    const applicationDeadlineSetting = await prisma.systemSettings.findUnique({
      where: { key: 'application_deadline' }
    });

    // Fetch registration open setting
    const registrationOpenSetting = await prisma.systemSettings.findUnique({
      where: { key: 'registration_open' }
    });

    const now = new Date();
    let applicationStartDate: Date | null = null;
    let applicationDeadline: Date | null = null;
    let isRegistrationOpen = false;
    let applicationStatus: 'not_started' | 'open' | 'closed' = 'closed';

    // Parse start date
    if (applicationStartSetting?.value) {
      const startValue = applicationStartSetting.value as any;
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
        
        applicationStartDate = new Date(dateString);
        // Validate the date
        if (isNaN(applicationStartDate.getTime())) {
          console.warn('[Application Status] Invalid start date:', dateString);
          applicationStartDate = null;
        }
      }
    }

    // Parse deadline
    if (applicationDeadlineSetting?.value) {
      const deadlineValue = applicationDeadlineSetting.value as any;
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
        
        applicationDeadline = new Date(dateString);
        // Validate the date
        if (isNaN(applicationDeadline.getTime())) {
          console.warn('[Application Status] Invalid deadline date:', dateString);
          applicationDeadline = null;
        }
      }
    }

    // Check if registration is open
    if (registrationOpenSetting?.value) {
      const regValue = registrationOpenSetting.value as any;
      // Handle string "true"/"false" as well as boolean true/false
      if (typeof regValue === 'string') {
        isRegistrationOpen = regValue.toLowerCase() === 'true';
      } else {
        isRegistrationOpen = regValue === true || regValue.enabled === true;
      }
    }

    // Determine application status based on start and end dates
    // Priority 1: If registration is not open, show not_started
    if (!isRegistrationOpen) {
      applicationStatus = 'not_started';
    }
    // Priority 2: If no start date is set, show not_started (not configured yet)
    else if (!applicationStartDate) {
      applicationStatus = 'not_started';
    }
    // Priority 3: If start date is in the future, show not_started
    else if (applicationStartDate && now < applicationStartDate) {
      applicationStatus = 'not_started';
    }
    // Priority 4: If deadline is set and we're past it, show closed
    else if (applicationDeadline && now > applicationDeadline) {
      applicationStatus = 'closed';
    }
    // Priority 5: We're between start and deadline (or no deadline set), show open
    else {
      applicationStatus = 'open';
    }

    return json({
      status: applicationStatus,
      isOpen: applicationStatus === 'open',
      startDate: applicationStartDate?.toISOString() || null,
      deadline: applicationDeadline?.toISOString() || null,
      message: getStatusMessage(applicationStatus, applicationStartDate, applicationDeadline)
    });

  } catch (error) {
    console.error('[Application Status] Error:', error);
    // Default to closed if error
    return json({
      status: 'closed',
      isOpen: false,
      startDate: null,
      deadline: null,
      message: 'Unable to verify application status. Please contact administration.'
    });
  }
};

function getStatusMessage(status: 'not_started' | 'open' | 'closed', startDate: Date | null, deadline: Date | null): string {
  switch (status) {
    case 'not_started':
      if (startDate) {
        return `Applications will open on ${startDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}.`;
      }
      return 'Applications have not started yet. Please check back later.';
    case 'closed':
      if (deadline) {
        return `Applications closed on ${deadline.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}.`;
      }
      return 'Applications are currently closed.';
    case 'open':
      if (deadline) {
        return `Applications close on ${deadline.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}.`;
      }
      return 'Applications are currently open.';
  }
}
