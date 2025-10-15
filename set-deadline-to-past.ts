import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setDeadlineToPast() {
  try {
    // Set deadline to 1 hour ago in local time
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    console.log('Setting deadline to 1 hour ago...');
    console.log('  Deadline (local):', oneHourAgo.toLocaleString());
    console.log('  Deadline (UTC):', oneHourAgo.toISOString());
    
    await prisma.systemSettings.upsert({
      where: { key: 'application_deadline' },
      update: { value: oneHourAgo.toISOString() },
      create: { key: 'application_deadline', value: oneHourAgo.toISOString() }
    });
    
    console.log('\n✅ Deadline set to past');
    console.log('🚨 Modal should now show "Applications Closed"');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setDeadlineToPast();
