#!/usr/bin/env bun
import { prisma } from './src/lib/server/database';

async function verifyHostelAvailability() {
  console.log('🔍 Verifying Hostel Availability\n');

  const hostels = await prisma.hostel.findMany({
    include: {
      rooms: {
        include: {
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
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  console.log('📊 Detailed Hostel Information:\n');
  console.log('='.repeat(100));
  console.log(
    'Name'.padEnd(30),
    'Total Cap'.padEnd(12),
    'Available'.padEnd(12),
    'Occupied'.padEnd(12),
    'Occupancy %'.padEnd(12)
  );
  console.log('-'.repeat(100));

  hostels.forEach((hostel: any) => {
    const totalCapacity = hostel.rooms.length > 0 
      ? hostel.rooms.reduce((sum: number, room: any) => sum + room.capacity, 0)
      : hostel.capacity;
    
    const totalOccupied = hostel.rooms.reduce((sum: number, room: any) => sum + room._count.allocations, 0);
    
    const occupiedFromCalc = totalCapacity - hostel.available;
    const occupancyRate = totalCapacity > 0 ? Math.round((occupiedFromCalc / totalCapacity) * 100) : 0;

    console.log(
      hostel.name.padEnd(30),
      totalCapacity.toString().padEnd(12),
      hostel.available.toString().padEnd(12),
      `${occupiedFromCalc} (${totalOccupied})`.padEnd(12),
      `${occupancyRate}%`.padEnd(12)
    );
  });

  console.log('='.repeat(100));
  console.log('\n📝 Legend:');
  console.log('  - Total Cap: Total bed capacity (from rooms or hostel.capacity)');
  console.log('  - Available: Beds available for allocation (from database)');
  console.log('  - Occupied: First number = Total - Available, Second (in parens) = Actual allocations');
  console.log('  - Occupancy %: (Total - Available) / Total × 100');
  console.log('\n💡 Note: If Available ≠ Total, some beds have been reserved/allocated');

  await prisma.$disconnect();
}

verifyHostelAvailability();
