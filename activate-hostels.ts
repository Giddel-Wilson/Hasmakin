import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function activateAllHostels() {
  try {
    console.log('Activating all hostels...\n');
    
    const result = await prisma.hostel.updateMany({
      data: {
        isActive: true
      }
    });

    console.log(`✅ Successfully activated ${result.count} hostels\n`);
    
    // Show all hostels with their status
    const hostels = await prisma.hostel.findMany({
      select: {
        name: true,
        gender: true,
        location: true,
        isActive: true,
        capacity: true,
        available: true
      }
    });

    console.log('Current hostels:');
    hostels.forEach(h => {
      const status = h.isActive ? '✅ ACTIVE' : '❌ INACTIVE';
      console.log(`${status} - ${h.name} (${h.gender}) - ${h.location}`);
      console.log(`         ${h.available}/${h.capacity} beds available\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateAllHostels();
