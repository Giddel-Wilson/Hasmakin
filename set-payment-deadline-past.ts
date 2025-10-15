import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setPaymentDeadlineToPast() {
  try {
    console.log('=== Setting Payment Deadline to Past ===\n');

    // Set deadline to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 0, 0);

    // Set start date to a week ago
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    console.log('Setting payment dates:');
    console.log('  Start Date:', weekAgo.toISOString());
    console.log('  Deadline:', yesterday.toISOString());
    console.log();

    // Update payment_start_date
    await prisma.systemSettings.upsert({
      where: { key: 'payment_start_date' },
      update: { value: JSON.stringify(weekAgo.toISOString()) },
      create: { key: 'payment_start_date', value: JSON.stringify(weekAgo.toISOString()) }
    });

    // Update payment_deadline
    await prisma.systemSettings.upsert({
      where: { key: 'payment_deadline' },
      update: { value: JSON.stringify(yesterday.toISOString()) },
      create: { key: 'payment_deadline', value: JSON.stringify(yesterday.toISOString()) }
    });

    console.log('✓ Payment dates updated successfully!');
    console.log('\n=== Current Payment Period Status ===');
    console.log('Payment period is now CLOSED (deadline has passed)');
    console.log('\nRefresh the student payment page to see the "Payment Period Closed" banner.');

  } catch (error) {
    console.error('Error updating payment dates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setPaymentDeadlineToPast();
