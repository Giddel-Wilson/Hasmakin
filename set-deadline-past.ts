import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setDeadlinePassed() {
  try {
    // Set deadline to 1 hour ago
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const deadlineString = oneHourAgo.toISOString().slice(0, 16); // Format: 2025-10-12T00:00
    
    await prisma.systemSettings.upsert({
      where: { key: 'application_deadline' },
      update: { value: deadlineString },
      create: { key: 'application_deadline', value: deadlineString }
    });
    
    console.log('✅ Set application deadline to 1 hour ago');
    console.log('   Deadline:', deadlineString);
    console.log('   This should trigger the "Applications Closed" modal');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setDeadlinePassed();
