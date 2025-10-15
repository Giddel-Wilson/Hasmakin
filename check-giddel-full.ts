import { prisma } from './src/lib/server/database';

async function checkGiddelPayment() {
  try {
    const user = await prisma.user.findUnique({
      where: { matricNo: 'U2021/5570004' },
      include: {
        applications: {
          include: {
            allocations: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    console.log('Giddel Wilson data:');
    console.log('\nApplications:', JSON.stringify(user?.applications, null, 2));
    console.log('\nPayments:', JSON.stringify(user?.payments, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGiddelPayment();
