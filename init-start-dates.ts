import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setStartDates() {
  try {
    const now = new Date();
    const future30Days = new Date();
    future30Days.setDate(future30Days.getDate() + 30);

    // Set application start date to now (applications open immediately)
    await prisma.systemSettings.upsert({
      where: { key: 'application_start_date' },
      update: { value: now.toISOString() },
      create: {
        key: 'application_start_date',
        value: now.toISOString()
      }
    });

    // Set payment start date to now (payments open immediately)
    await prisma.systemSettings.upsert({
      where: { key: 'payment_start_date' },
      update: { value: now.toISOString() },
      create: {
        key: 'payment_start_date',
        value: now.toISOString()
      }
    });

    // Set allocation start date to 20 days from now
    const future20Days = new Date();
    future20Days.setDate(future20Days.getDate() + 20);
    await prisma.systemSettings.upsert({
      where: { key: 'allocation_start_date' },
      update: { value: future20Days.toISOString() },
      create: {
        key: 'allocation_start_date',
        value: future20Days.toISOString()
      }
    });

    // Set payment deadline to 25 days from now
    const future25Days = new Date();
    future25Days.setDate(future25Days.getDate() + 25);
    await prisma.systemSettings.upsert({
      where: { key: 'payment_deadline' },
      update: { value: future25Days.toISOString() },
      create: {
        key: 'payment_deadline',
        value: future25Days.toISOString()
      }
    });

    console.log('✅ Application start date set to:', now.toISOString());
    console.log('✅ Application deadline set to:', future30Days.toISOString());
    console.log('✅ Payment start date set to:', now.toISOString());
    console.log('✅ Payment deadline set to:', future25Days.toISOString());
    console.log('✅ Allocation start date set to:', future20Days.toISOString());
    console.log('\n📌 Applications and Payments should now be OPEN');
    console.log('Visit http://localhost:5173/dashboard/apply and /dashboard/payments');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setStartDates();
