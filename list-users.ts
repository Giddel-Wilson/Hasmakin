import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        matricNo: true,
        name: true,
        email: true,
        gender: true,
        role: true
      },
      take: 10
    });

    console.log(`Total users found: ${users.length}\n`);
    
    users.forEach(user => {
      console.log(`Matric: ${user.matricNo || 'N/A'}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Gender: ${user.gender || 'Not set'}`);
      console.log(`Role: ${user.role}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
