import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        matricNo: 'U2021/5570001'
      }
    });

    console.log('User Profile:');
    console.log('Matric No:', user?.matricNo);
    console.log('Gender:', user?.gender);
    console.log('Name:', user?.name);
    
    // Check available hostels for this gender
    if (user?.gender) {
      const hostels = await prisma.hostel.findMany({
        where: {
          gender: user.gender
        },
        select: {
          id: true,
          name: true,
          gender: true,
          location: true,
          available: true,
          capacity: true
        }
      });
      
      console.log('\nAvailable hostels for gender:', user.gender);
      console.log('Count:', hostels.length);
      hostels.forEach(h => {
        console.log(`- ${h.name} (${h.location}): ${h.available}/${h.capacity}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
