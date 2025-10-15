import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function openNow() {
  try {
    // Set start date to 1 hour ago
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Set deadline to 30 days from now
    const future30Days = new Date();
    future30Days.setDate(future30Days.getDate() + 30);

    await prisma.systemSettings.upsert({
      where: { key: 'application_start_date' },
      update: { value: oneHourAgo.toISOString() },
      create: {
        key: 'application_start_date',
        value: oneHourAgo.toISOString()
      }
    });

    await prisma.systemSettings.upsert({
      where: { key: 'application_deadline' },
      update: { value: future30Days.toISOString() },
      create: {
        key: 'application_deadline',
        value: future30Days.toISOString()
      }
    });

    await prisma.systemSettings.upsert({
      where: { key: 'payment_start_date' },
      update: { value: oneHourAgo.toISOString() },
      create: {
        key: 'payment_start_date',
        value: oneHourAgo.toISOString()
      }
    });

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

    console.log('✅ Application start:', oneHourAgo.toISOString(), '(1 hour ago)');
    console.log('✅ Application deadline:', future30Days.toISOString(), '(30 days from now)');
    console.log('✅ Payment start:', oneHourAgo.toISOString(), '(1 hour ago)');
    console.log('✅ Payment deadline:', future25Days.toISOString(), '(25 days from now)');
    console.log('\n📌 Applications and Payments are NOW OPEN!');
    console.log('Refresh http://localhost:5173/dashboard/apply');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

openNow();
