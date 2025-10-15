import { prisma } from './src/lib/server/database';

async function checkPaymentDates() {
  try {
    console.log('=== Checking Payment Date Settings ===\n');
    
    const paymentStartSetting = await prisma.systemSettings.findUnique({
      where: { key: 'payment_start_date' }
    });
    
    const paymentDeadlineSetting = await prisma.systemSettings.findUnique({
      where: { key: 'payment_deadline' }
    });
    
    console.log('Payment Start Date Setting:');
    if (paymentStartSetting) {
      console.log('  Exists: YES');
      console.log('  Value:', paymentStartSetting.value);
    } else {
      console.log('  Exists: NO - Not set!');
    }
    
    console.log('\nPayment Deadline Setting:');
    if (paymentDeadlineSetting) {
      console.log('  Exists: YES');
      console.log('  Value:', paymentDeadlineSetting.value);
    } else {
      console.log('  Exists: NO - Not set!');
    }
    
    console.log('\n=== Application Dates (for comparison) ===\n');
    
    const appStartSetting = await prisma.systemSettings.findUnique({
      where: { key: 'application_start_date' }
    });
    
    const appDeadlineSetting = await prisma.systemSettings.findUnique({
      where: { key: 'application_deadline' }
    });
    
    console.log('Application Start Date:', appStartSetting?.value);
    console.log('Application Deadline:', appDeadlineSetting?.value);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPaymentDates();
