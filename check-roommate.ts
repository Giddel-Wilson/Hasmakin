import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRoommate() {
  try {
    const roommate = await prisma.user.findFirst({
      where: {
        matricNo: 'U2021/5570001',
        role: 'STUDENT'
      }
    });

    if (roommate) {
      console.log('✅ Roommate found:');
      console.log('Matric:', roommate.matricNo);
      console.log('Name:', roommate.name);
      console.log('Email:', roommate.email);
    } else {
      console.log('❌ Roommate NOT found with matric: U2021/5570001');
      console.log('\nAvailable students:');
      
      const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: {
          matricNo: true,
          name: true,
          email: true
        }
      });
      
      students.forEach(s => {
        console.log(`- ${s.matricNo}: ${s.name} (${s.email})`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoommate();
