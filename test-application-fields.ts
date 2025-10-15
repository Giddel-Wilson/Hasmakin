// Test Application Fields - Verify Medical Conditions and Roommate Request Storage
import { prisma } from './src/lib/server/database';

async function testApplicationFields() {
  console.log('=== Testing Application Fields ===\n');

  // Find a test application
  const applications = await prisma.application.findMany({
    include: {
      user: {
        select: {
          name: true,
          matricNo: true
        }
      }
    },
    take: 5,
    orderBy: {
      submittedAt: 'desc'
    }
  });

  console.log(`Found ${applications.length} applications\n`);

  for (const app of applications) {
    console.log('─'.repeat(60));
    console.log('Application ID:', app.id);
    console.log('Student:', app.user.name, `(${app.user.matricNo})`);
    console.log('Status:', app.applicationStatus);
    console.log('Submitted:', app.submittedAt.toLocaleString());
    console.log('\nNew Fields:');
    console.log('  Special Needs:', app.specialNeeds || '(none)');
    console.log('  Medical Conditions:', app.medicalConditions || '(none)');
    console.log('  Requested Roommate ID:', app.requestedRoommateId || '(none)');
    
    if (app.requestedRoommateId) {
      try {
        const roommate = await prisma.user.findUnique({
          where: { id: app.requestedRoommateId },
          select: {
            name: true,
            matricNo: true
          }
        });
        
        if (roommate) {
          console.log('  Roommate:', roommate.name, `(${roommate.matricNo})`);
        }
      } catch (e) {
        console.log('  Roommate: (error fetching details)');
      }
    }
    
    console.log('');
  }

  console.log('─'.repeat(60));
}

testApplicationFields()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
