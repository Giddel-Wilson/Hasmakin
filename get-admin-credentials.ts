import { prisma } from './src/lib/server/database';

async function getAdminCredentials() {
  console.log('\n🔍 Looking for admin account...\n');
  
  const admin = await prisma.user.findFirst({
    where: {
      role: 'ADMIN'
    },
    select: {
      name: true,
      email: true,
      matricNo: true,
      role: true
    }
  });

  if (admin) {
    console.log('┌─────────────────────────────────────────────┐');
    console.log('│         ADMIN LOGIN CREDENTIALS             │');
    console.log('├─────────────────────────────────────────────┤');
    console.log(`│ Name:        ${admin.name.padEnd(28)} │`);
    console.log(`│ Matric No:   ${admin.matricNo.padEnd(28)} │`);
    console.log(`│ Email:       ${admin.email.padEnd(28)} │`);
    console.log(`│ Password:    AdminPassword123!               │`);
    console.log('├─────────────────────────────────────────────┤');
    console.log('│ Use the Matric No and Password to log in    │');
    console.log('└─────────────────────────────────────────────┘\n');
  } else {
    console.log('❌ No admin account found!\n');
  }
}

getAdminCredentials()
  .then(() => process.exit(0))
  .catch(console.error);
