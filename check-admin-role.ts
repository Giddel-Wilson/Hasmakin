import { prisma } from './src/lib/server/database';

async function checkAdminRole() {
  const admin = await prisma.user.findFirst({
    where: {
      role: 'ADMIN'
    }
  });

  console.log('Admin found with role ADMIN:', admin?.name || 'None');

  const allAdmins = await prisma.user.findMany({
    where: {
      OR: [
        { role: 'ADMIN' },
        { role: 'SYSTEM_ADMIN' }
      ]
    },
    select: {
      name: true,
      email: true,
      role: true,
      matricNo: true
    }
  });

  console.log('\nAll admin users:');
  allAdmins.forEach(admin => {
    console.log(`  - ${admin.name} (${admin.matricNo || admin.email}): ${admin.role}`);
  });
}

checkAdminRole().then(() => process.exit(0)).catch(console.error);
