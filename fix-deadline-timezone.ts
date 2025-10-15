import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDeadlineDates() {
  try {
    // Set proper ISO dates with explicit UTC timezone
    // October 11, 2025 at 11:00 PM UTC = 2025-10-11T23:00:00.000Z
    // This will display as October 12, 12:00 AM in WAT (UTC+1)
    
    // Let's set it to October 11 at 10:00 PM UTC instead
    // So it displays as October 11, 11:00 PM in local time
    const deadline = '2025-10-11T22:00:00.000Z'; // 10:00 PM UTC = 11:00 PM WAT
    const startDate = '2025-10-10T00:00:00.000Z'; // Oct 10 midnight UTC = 1:00 AM WAT
    
    await prisma.systemSettings.upsert({
      where: { key: 'application_deadline' },
      update: { value: deadline },
      create: { key: 'application_deadline', value: deadline }
    });
    
    await prisma.systemSettings.upsert({
      where: { key: 'application_start_date' },
      update: { value: startDate },
      create: { key: 'application_start_date', value: startDate }
    });
    
    console.log('✅ Fixed deadline dates with proper UTC timestamps');
    console.log('\nDatabase values:');
    console.log('  application_start_date:', startDate);
    console.log('  application_deadline:', deadline);
    console.log('\nThese will display in your local timezone');
    console.log('If you are in WAT (UTC+1):');
    console.log('  Start: October 10, 2025 at 1:00 AM');
    console.log('  Deadline: October 11, 2025 at 11:00 PM');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDeadlineDates();
