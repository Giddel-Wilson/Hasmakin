import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllSettings() {
  try {
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: ['application_start_date', 'application_deadline', 'payment_start_date', 'payment_deadline', 'allocation_start_date', 'allocation_date', 'registration_open']
        }
      }
    });

    console.log('\n=== ALL DATE SETTINGS IN DATABASE ===\n');
    
    for (const setting of settings) {
      console.log(`${setting.key}:`);
      console.log(`  Raw value: ${JSON.stringify(setting.value)}`);
      console.log(`  Type: ${typeof setting.value}`);
      
      // Try to parse as date
      if (setting.key !== 'registration_open') {
        let dateStr = setting.value as string;
        try {
          const parsed = JSON.parse(dateStr);
          dateStr = typeof parsed === 'string' ? parsed : dateStr;
        } catch {}
        
        if (dateStr) {
          dateStr = dateStr.trim();
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
            dateStr = dateStr + ':00Z';
          }
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            console.log(`  Parsed: ${date.toISOString()}`);
            console.log(`  Display: ${date.toLocaleString()}`);
          }
        }
      }
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllSettings();
