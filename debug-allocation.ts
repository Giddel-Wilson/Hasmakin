import { prisma } from './src/lib/server/database';

async function debugAllocation() {
  console.log('\n🔍 ALLOCATION DEBUG\n');
  
  // Check the pending application
  const pendingApps = await prisma.application.findMany({
    where: {
      applicationStatus: 'PENDING'
    },
    include: {
      user: {
        select: {
          name: true,
          matricNo: true,
          gender: true
        }
      },
      allocations: true
    }
  });

  console.log('📋 Pending Applications:', pendingApps.length);
  pendingApps.forEach(app => {
    console.log(`  - ${app.user.name} (${app.user.matricNo})`);
    console.log(`    Gender: ${app.user.gender}`);
    console.log(`    Level: ${app.level}`);
    console.log(`    Existing Allocations: ${app.allocations.length}`);
  });

  // Check available rooms
  const rooms = await prisma.room.findMany({
    include: {
      hostel: {
        select: {
          name: true,
          gender: true,
          isActive: true
        }
      },
      _count: {
        select: {
          allocations: {
            where: {
              status: {
                in: ['ALLOCATED', 'CONFIRMED']
              }
            }
          }
        }
      }
    }
  });

  console.log('\n🏨 All Rooms:');
  rooms.forEach(room => {
    const available = room.capacity - room._count.allocations;
    console.log(`  - ${room.hostel.name} - Room ${room.number}`);
    console.log(`    Gender: ${room.hostel.gender}, Active: ${room.hostel.isActive}`);
    console.log(`    Capacity: ${room.capacity}, Occupied: ${room._count.allocations}, Available: ${available}`);
  });

  // Check if there's a gender match
  console.log('\n🔄 Matching Analysis:');
  pendingApps.forEach(app => {
    const matchingRooms = rooms.filter(room => 
      room.hostel.isActive &&
      room.hostel.gender === app.user.gender &&
      room._count.allocations < room.capacity
    );
    console.log(`  ${app.user.name} (${app.user.gender}): ${matchingRooms.length} matching rooms available`);
    if (matchingRooms.length > 0) {
      console.log(`    First match: ${matchingRooms[0].hostel.name} - Room ${matchingRooms[0].number}`);
    }
  });
}

debugAllocation()
  .then(() => process.exit(0))
  .catch(console.error);
