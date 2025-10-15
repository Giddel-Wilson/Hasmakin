import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserApplication() {
  try {
    // Check for Giddel Wilson (U2021/5570004)
    const user = await prisma.user.findUnique({
      where: { matricNo: 'U2021/5570004' },
      include: {
        applications: {
          orderBy: { submittedAt: 'desc' },
          take: 1
        }
      }
    });

    console.log('\n=== User Application Status ===');
    console.log('User:', user?.name);
    console.log('Matric No:', user?.matricNo);
    console.log('\nApplications count:', user?.applications?.length || 0);
    
    if (user?.applications?.[0]) {
      const app = user.applications[0];
      console.log('\nLatest Application:');
      console.log('  Status:', app.applicationStatus);
      console.log('  Submitted:', app.submittedAt?.toLocaleString());
    } else {
      console.log('\n❌ No application found');
      console.log('Dashboard should check if applications are OPEN and show that status');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserApplication();
