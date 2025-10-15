// Set Application Deadline for Testing
import { prisma } from './src/lib/server/database';

async function setApplicationDeadline() {
  // Set deadline to yesterday (closed)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.systemSettings.upsert({
    where: { key: 'application_deadline' },
    update: {
      value: yesterday.toISOString()
    },
    create: {
      key: 'application_deadline',
      value: yesterday.toISOString()
    }
  });

  // Set registration as open
  await prisma.systemSettings.upsert({
    where: { key: 'registration_open' },
    update: {
      value: true
    },
    create: {
      key: 'registration_open',
      value: true
    }
  });

  console.log('✅ Application deadline set to:', yesterday.toISOString());
  console.log('✅ Registration open: true');
  console.log('\n📌 Applications should now be CLOSED');
  console.log('Visit http://localhost:5173/dashboard/apply to see the deadline modal');
}

setApplicationDeadline()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
