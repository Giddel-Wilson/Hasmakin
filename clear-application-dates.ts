import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDates() {
  try {
    // Delete the date settings to simulate "not configured yet"
    await prisma.systemSettings.deleteMany({
      where: {
        key: {
          in: ['application_start_date', 'application_deadline']
        }
      }
    });

    console.log('✅ Cleared application start date and deadline');
    console.log('\n📌 Applications should now show "Not Yet Open"');
    console.log('Visit http://localhost:5173/dashboard/apply to test');
    console.log('\nTo re-enable, set dates in admin settings or run: bun open-applications-now.ts');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDates();
