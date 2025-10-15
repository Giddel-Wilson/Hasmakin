import { prisma } from './src/lib/server/database';

async function checkSpecialNeeds() {
  const giddel = await prisma.user.findFirst({
    where: { matricNo: 'U2021/570004' },
    include: {
      applications: true
    }
  });

  if (giddel && giddel.applications.length > 0) {
    console.log('Giddel\'s Application Data:');
    console.log('========================');
    const app = giddel.applications[0];
    console.log('Special Needs value:', JSON.stringify(app.specialNeeds));
    console.log('Length:', app.specialNeeds?.length);
    console.log('Has truthy value:', !!app.specialNeeds);
    console.log('Trimmed length:', app.specialNeeds?.trim().length);
  } else {
    console.log('No application found for Giddel');
  }

  await prisma.$disconnect();
}

checkSpecialNeeds();
