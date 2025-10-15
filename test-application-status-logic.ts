import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testApplicationStatus() {
  try {
    // Fetch settings
    const startSetting = await prisma.systemSettings.findUnique({
      where: { key: 'application_start_date' }
    });
    const deadlineSetting = await prisma.systemSettings.findUnique({
      where: { key: 'application_deadline' }
    });
    const regOpenSetting = await prisma.systemSettings.findUnique({
      where: { key: 'registration_open' }
    });

    const now = new Date();
    
    // Parse start date
    let startDate: Date | null = null;
    if (startSetting?.value) {
      const val = startSetting.value as any;
      let dateStr = typeof val === 'string' ? val : null;
      if (dateStr) {
        // Fix incomplete ISO strings (2025-10-10T00:00 -> 2025-10-10T00:00:00Z)
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
          dateStr = dateStr + ':00Z';
        }
        startDate = new Date(dateStr);
        if (isNaN(startDate.getTime())) {
          console.warn('Invalid start date:', dateStr);
          startDate = null;
        }
      }
    }
    
    // Parse deadline
    let deadline: Date | null = null;
    if (deadlineSetting?.value) {
      const val = deadlineSetting.value as any;
      let dateStr = typeof val === 'string' ? val : null;
      if (dateStr) {
        // Fix incomplete ISO strings (2025-10-12T00:50 -> 2025-10-12T00:50:00Z)
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
          dateStr = dateStr + ':00Z';
        }
        deadline = new Date(dateStr);
        if (isNaN(deadline.getTime())) {
          console.warn('Invalid deadline:', dateStr);
          deadline = null;
        }
      }
    }
    
    // Parse registration open - WITH FIX
    let isRegistrationOpen = false;
    if (regOpenSetting?.value) {
      const regValue = regOpenSetting.value as any;
      if (typeof regValue === 'string') {
        isRegistrationOpen = regValue.toLowerCase() === 'true';
      } else {
        isRegistrationOpen = regValue === true || regValue.enabled === true;
      }
    }
    
    // Determine status
    let status: 'not_started' | 'open' | 'closed' = 'closed';
    
    if (!isRegistrationOpen) {
      status = 'not_started';
    } else if (!startDate) {
      status = 'not_started';
    } else if (now < startDate) {
      status = 'not_started';
    } else if (deadline && now > deadline) {
      status = 'closed';
    } else {
      status = 'open';
    }
    
    console.log('\n=== Application Status Test ===');
    console.log('Current time:', now.toISOString());
    console.log('\nSettings:');
    console.log('  registration_open:', isRegistrationOpen, '(raw:', regOpenSetting?.value, ')');
    console.log('  Start date:', startDate ? startDate.toISOString() : 'null');
    console.log('  Deadline:', deadline ? deadline.toISOString() : 'null');
    console.log('\nLogic checks:');
    console.log('  !isRegistrationOpen?', !isRegistrationOpen);
    console.log('  !startDate?', !startDate);
    console.log('  now < startDate?', startDate ? now < startDate : 'N/A');
    console.log('  now > deadline?', deadline ? now > deadline : 'N/A');
    console.log('\n✅ RESULT:', status);
    console.log('   isOpen:', status === 'open');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApplicationStatus();
