import { prisma } from './src/lib/server/database';

async function setPaymentDates() {
  try {
    console.log('=== Setting Payment Dates ===\n');
    
    // Set payment to start now (or use application start date)
    const paymentStartDate = '2025-10-09T23:00:00.000Z'; // Same as application start
    
    // Set payment deadline to match or slightly after application deadline
    const paymentDeadline = '2025-10-20T22:59:00.000Z'; // Extended past application deadline
    
    console.log('Setting payment start date to:', paymentStartDate);
    await prisma.systemSettings.upsert({
      where: { key: 'payment_start_date' },
      update: { value: paymentStartDate },
      create: {
        key: 'payment_start_date',
        value: paymentStartDate
      }
    });
    console.log('✅ Payment start date set\n');
    
    console.log('Setting payment deadline to:', paymentDeadline);
    await prisma.systemSettings.upsert({
      where: { key: 'payment_deadline' },
      update: { value: paymentDeadline },
      create: {
        key: 'payment_deadline',
        value: paymentDeadline
      }
    });
    console.log('✅ Payment deadline set\n');
    
    console.log('=== Summary ===');
    console.log('Payment Period: OPEN');
    console.log(`Start: ${new Date(paymentStartDate).toLocaleString()}`);
    console.log(`Deadline: ${new Date(paymentDeadline).toLocaleString()}`);
    console.log('\nStudents can now make payments!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setPaymentDates();
