import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupSettings() {
  try {
    // Delete the old camelCase keys that have invalid formats
    await prisma.systemSettings.deleteMany({
      where: {
        key: {
          in: ['applicationDeadline', 'allocationDate', 'paymentDeadline', 'registrationOpen']
        }
      }
    });
    
    console.log('✅ Deleted old settings with invalid formats');
    
    // Verify the good settings still exist
    const goodSettings = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: ['application_deadline', 'registration_open']
        }
      }
    });
    
    console.log('\n✅ Valid settings remaining:');
    goodSettings.forEach(s => {
      console.log(`  ${s.key}: ${s.value}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupSettings();
