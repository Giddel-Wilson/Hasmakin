import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRegistrationOpen() {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'registration_open' }
    });

    console.log('\n=== Registration Open Setting ===');
    console.log('Setting found:', !!setting);
    
    if (setting) {
      console.log('Raw value:', setting.value);
      console.log('Value type:', typeof setting.value);
      
      const regValue = setting.value as any;
      const isOpen = regValue === true || regValue.enabled === true;
      
      console.log('\nParsed as open:', isOpen);
      console.log('This is what blocks applications if false!');
    } else {
      console.log('No registration_open setting found (defaults to false)');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRegistrationOpen();
