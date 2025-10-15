import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupAndSetProperDates() {
  try {
    console.log('🧹 Cleaning up and setting proper dates...\n');
    
    // Let's set dates that make sense:
    // Applications: October 10, 2025 12:00 AM to October 15, 2025 11:59 PM
    // (All times in local timezone, will be converted to UTC when saved)
    
    const appStart = new Date('2025-10-10T00:00:00'); // Oct 10 midnight local
    const appDeadline = new Date('2025-10-15T23:59:00'); // Oct 15 11:59 PM local
    
    console.log('Setting application dates:');
    console.log('  Start (local):', appStart.toLocaleString());
    console.log('  Start (UTC):', appStart.toISOString());
    console.log('  Deadline (local):', appDeadline.toLocaleString());
    console.log('  Deadline (UTC):', appDeadline.toISOString());
    
    await prisma.systemSettings.upsert({
      where: { key: 'application_start_date' },
      update: { value: appStart.toISOString() },
      create: { key: 'application_start_date', value: appStart.toISOString() }
    });
    
    await prisma.systemSettings.upsert({
      where: { key: 'application_deadline' },
      update: { value: appDeadline.toISOString() },
      create: { key: 'application_deadline', value: appDeadline.toISOString() }
    });
    
    // Set registration to open
    await prisma.systemSettings.upsert({
      where: { key: 'registration_open' },
      update: { value: 'true' },
      create: { key: 'registration_open', value: 'true' }
    });
    
    console.log('\n✅ Dates set successfully!');
    console.log('\nApplications are now OPEN');
    console.log('They will close on:', appDeadline.toLocaleString());

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupAndSetProperDates();
