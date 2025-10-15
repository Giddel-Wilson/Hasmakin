import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSettings() {
  try {
    const settings = await prisma.systemSettings.findMany();
    
    console.log('Current System Settings:');
    console.log('========================\n');
    
    settings.forEach(setting => {
      console.log(`Key: ${setting.key}`);
      console.log(`Value:`, setting.value);
      console.log(`Type:`, typeof setting.value);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSettings();
