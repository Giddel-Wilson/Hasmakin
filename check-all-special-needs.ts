import { prisma } from './src/lib/server/database';

async function checkAllApplications() {
  const applications = await prisma.application.findMany({
    include: {
      user: {
        select: {
          name: true,
          matricNo: true
        }
      }
    }
  });

  console.log(`Found ${applications.length} applications\n`);
  
  for (const app of applications) {
    console.log('Student:', app.user.name, '-', app.user.matricNo);
    console.log('Special Needs:', JSON.stringify(app.specialNeeds));
    console.log('Has value:', !!app.specialNeeds);
    if (app.specialNeeds) {
      console.log('Actual text:', app.specialNeeds);
      console.log('Length:', app.specialNeeds.length);
    }
    console.log('---');
  }

  await prisma.$disconnect();
}

checkAllApplications();
