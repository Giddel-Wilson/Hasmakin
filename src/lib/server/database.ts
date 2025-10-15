// Database Configuration
// University of Port Harcourt - Hostel Allocation System

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use a try-catch to handle connection issues gracefully
export const prisma = (() => {
  try {
    return globalForPrisma.prisma ?? new PrismaClient({
      log: ['error', 'warn'], // Reduced logging to avoid spam
    });
  } catch (error) {
    console.warn('Database connection not available:', error);
    // Return a mock client that will fail gracefully
    return null as any;
  }
})();

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}

// Initialize database with default data
export async function initializeDatabase() {
  try {
    // Check if hostels exist
    const hostelCount = await prisma.hostel.count();
    
    if (hostelCount === 0) {
      // Create default hostels
      const defaultHostels = [
        {
          name: 'Alvan Ikoku Hall',
          gender: 'MALE' as const,
          capacity: 500,
          available: 500,
          location: 'North Campus',
          amenities: ['WiFi', 'Study Room', 'Recreation Center', 'Laundry']
        },
        {
          name: 'Professor Dike Hall',
          gender: 'MALE' as const,
          capacity: 400,
          available: 400,
          location: 'South Campus',
          amenities: ['WiFi', 'Study Room', 'Sports Facility']
        },
        {
          name: 'Eleanor Roosevelt Hall',
          gender: 'FEMALE' as const,
          capacity: 600,
          available: 600,
          location: 'Central Campus',
          amenities: ['WiFi', 'Study Room', 'Beauty Salon', 'Recreation Center']
        },
        {
          name: 'Queen Elizabeth Hall',
          gender: 'FEMALE' as const,
          capacity: 450,
          available: 450,
          location: 'North Campus',
          amenities: ['WiFi', 'Study Room', 'Gym', 'Laundry']
        }
      ];

      for (const hostel of defaultHostels) {
        const createdHostel = await prisma.hostel.create({
          data: hostel
        });

        // Create rooms for each hostel
        const roomsPerFloor = 20;
        const floors = Math.ceil(hostel.capacity / (roomsPerFloor * 2)); // 2 students per room

        for (let floor = 1; floor <= floors; floor++) {
          for (let roomNum = 1; roomNum <= roomsPerFloor; roomNum++) {
            const roomNumber = `${floor.toString().padStart(2, '0')}${roomNum.toString().padStart(2, '0')}`;
            
            await prisma.room.create({
              data: {
                hostelId: createdHostel.id,
                number: roomNumber,
                capacity: 2,
                occupied: 0
              }
            });
          }
        }
      }

      console.log('✅ Default hostels and rooms created');
    }

    // Create system settings
    const settingsCount = await prisma.systemSettings.count();
    if (settingsCount === 0) {
      const defaultSettings = [
        {
          key: 'ALLOCATION_OPEN',
          value: { enabled: true, openDate: new Date(), closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
        },
        {
          key: 'HOSTEL_FEES',
          value: { amount: 25000, currency: 'NGN' }
        },
        {
          key: 'ALLOCATION_CRITERIA',
          value: {
            priorityOrder: ['YEAR_5', 'YEAR_4', 'YEAR_3', 'YEAR_2', 'YEAR_1'],
            requirePayment: true,
            confirmationDeadlineHours: 72
          }
        }
      ];

      for (const setting of defaultSettings) {
        await prisma.systemSettings.create({
          data: setting
        });
      }

      console.log('✅ Default system settings created');
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}
