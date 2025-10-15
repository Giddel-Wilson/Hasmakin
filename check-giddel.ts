import { prisma } from './src/lib/server/database';

async function checkGiddelWilson() {
  console.log('\n🔍 Checking Giddel Wilson\'s Application\n');
  
  const user = await prisma.user.findFirst({
    where: {
      name: { contains: 'Giddel', mode: 'insensitive' }
    }
  });

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log('👤 User:', user.name, '(', user.matricNo, ')');
  console.log('   Gender:', user.gender);

  const applications = await prisma.application.findMany({
    where: {
      userId: user.id
    },
    include: {
      allocations: true
    }
  });

  console.log('\n📋 Applications:', applications.length);
  applications.forEach((app, index) => {
    console.log(`\n  Application ${index + 1}:`);
    console.log(`    ID: ${app.id}`);
    console.log(`    Application Status: ${app.applicationStatus}`);
    console.log(`    Payment Status: ${app.paymentStatus}`);
    console.log(`    Level: ${app.level}`);
    console.log(`    Submitted: ${app.submittedAt}`);
    console.log(`    Allocations: ${app.allocations.length}`);
    if (app.allocations.length > 0) {
      app.allocations.forEach(alloc => {
        console.log(`      - Status: ${alloc.status}, Room: ${alloc.roomId}`);
      });
    }
  });
}

checkGiddelWilson()
  .then(() => process.exit(0))
  .catch(console.error);
