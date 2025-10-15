import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDates() {
  try {
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: ['application_start_date', 'application_deadline', 'payment_start_date', 'payment_deadline']
        }
      }
    });
    
    console.log('\n=== Current Date/Time Settings ===');
    console.log('Current time:', new Date().toISOString());
    console.log('\n');
    
    settings.forEach(s => {
      const value = typeof s.value === 'string' ? s.value : JSON.stringify(s.value);
      let parsedDate;
      try {
        const parsed = JSON.parse(value);
        parsedDate = new Date(parsed);
      } catch {
        parsedDate = new Date(value);
      }
      
      console.log(`${s.key}:`);
      console.log(`  Raw value: ${value}`);
      console.log(`  Parsed date: ${parsedDate.toISOString()}`);
      console.log(`  Is valid: ${!isNaN(parsedDate.getTime())}`);
      console.log(`  Is in past: ${parsedDate < new Date()}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDates();
