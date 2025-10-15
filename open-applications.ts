import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function openApplications() {
  try {
    // Set application deadline to future date (30 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    await prisma.systemSettings.upsert({
      where: { key: 'application_deadline' },
      update: { value: futureDate.toISOString() },
      create: {
        key: 'application_deadline',
        value: futureDate.toISOString()
      }
    });

    await prisma.systemSettings.upsert({
      where: { key: 'registration_open' },
      update: { value: true },
      create: {
        key: 'registration_open',
        value: true
      }
    });

    console.log('✅ Application deadline set to:', futureDate.toISOString());
    console.log('✅ Registration open: true');
    console.log('\n📌 Applications should now be OPEN');
    console.log('Visit http://localhost:5173/dashboard/apply - the form should be accessible');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

openApplications();
