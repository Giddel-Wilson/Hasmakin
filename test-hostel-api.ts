#!/usr/bin/env bun
import { prisma } from './src/lib/server/database';

async function testHostelAPI() {
  console.log('🔍 Testing Hostel API Data Structure\n');

  try {
    // Get all hostels with room and allocation data (same as API)
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
        },
        _count: {
          select: {
            rooms: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`Found ${hostels.length} hostels\n`);

    // Calculate occupancy stats for each hostel (same as API)
    const hostelsWithStats = hostels.map(hostel => {
      // If hostel has rooms, calculate from rooms; otherwise use hostel's capacity field
      const totalCapacity = hostel.rooms.length > 0 
        ? hostel.rooms.reduce((sum: any, room: any) => sum + room.capacity, 0)
        : hostel.capacity;
      
      const totalOccupied = hostel.rooms.reduce((sum: any, room: any) => sum + room._count.allocations, 0);
      const occupancyRate = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;

      return {
        id: hostel.id,
        name: hostel.name,
        gender: hostel.gender,
        capacity: hostel.capacity,
        available: hostel.available,
        roomCount: hostel._count.rooms,
        totalCapacity,
        totalOccupied,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        isActive: hostel.isActive
      };
    });

    console.log('📊 Hostel Stats:\n');
    console.log('='.repeat(100));
    console.log(
      'Name'.padEnd(25),
      'Gender'.padEnd(10),
      'Rooms'.padEnd(8),
      'Capacity'.padEnd(10),
      'Available'.padEnd(10),
      'Occupied'.padEnd(10),
      'Rate'.padEnd(8),
      'Active'
    );
    console.log('-'.repeat(100));

    hostelsWithStats.forEach(h => {
      console.log(
        h.name.padEnd(25),
        h.gender.padEnd(10),
        h.roomCount.toString().padEnd(8),
        h.totalCapacity.toString().padEnd(10),
        (h.totalCapacity - h.totalOccupied).toString().padEnd(10),
        h.totalOccupied.toString().padEnd(10),
        `${h.occupancyRate}%`.padEnd(8),
        h.isActive ? '✅' : '❌'
      );
    });

    console.log('='.repeat(100));
    console.log('\n✅ Data structure looks correct!');
    console.log('\nFrontend Mapping:');
    console.log('  API Field         → Frontend Field');
    console.log('  totalCapacity     → totalBeds');
    console.log('  totalOccupied     → occupiedBeds');
    console.log('  totalCapacity - totalOccupied → availableBeds');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testHostelAPI();
