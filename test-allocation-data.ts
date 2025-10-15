import { prisma } from './src/lib/server/database';

async function testAllocationData() {
  try {
    // Get Giddel's application
    const app = await prisma.application.findFirst({
      where: {
        user: {
          matricNo: 'U2021/5570004'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            matricNo: true,
            gender: true
          }
        },
        allocations: true
      }
    });

    console.log('Application data structure:', JSON.stringify(app, null, 2));

    // Test the exact query used in allocation endpoint
    const pendingApps = await prisma.application.findMany({
      where: {
        id: app?.id ? { in: [app.id] } : undefined,
        applicationStatus: 'APPROVED',
        paymentStatus: 'COMPLETED',
        allocations: {
          none: {
            status: {
              in: ['ALLOCATED', 'CONFIRMED']
            }
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            matricNo: true,
            gender: true
          }
        }
      }
    });

    console.log('\n\nQuery result:', JSON.stringify(pendingApps, null, 2));
    
    if (pendingApps.length > 0) {
      console.log('\n\nFirst application user data:');
      console.log('- user object:', pendingApps[0].user);
      console.log('- user.name:', pendingApps[0].user?.name);
      console.log('- user.gender:', pendingApps[0].user?.gender);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAllocationData();
