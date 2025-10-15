// Database Seed Script
// University of Port Harcourt - Hostel Allocation System

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Load environment variables with override
config({ override: true });

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('🔌 DATABASE_URL configured');
    
    // Test connection first
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Create default hostels
    console.log('📍 Creating hostels...');
    
    const hostels = [
      {
        name: 'Alvan Ikoku Hall',
        gender: 'MALE' as const,
        capacity: 500,
        available: 500,
        location: 'North Campus',
        amenities: ['WiFi', 'Study Room', 'Recreation Center', 'Laundry', 'Security']
      },
      {
        name: 'Professor Dike Hall',
        gender: 'MALE' as const,
        capacity: 400,
        available: 400,
        location: 'South Campus',
        amenities: ['WiFi', 'Study Room', 'Sports Facility', 'Security']
      },
      {
        name: 'Eleanor Roosevelt Hall',
        gender: 'FEMALE' as const,
        capacity: 600,
        available: 600,
        location: 'Central Campus',
        amenities: ['WiFi', 'Study Room', 'Beauty Salon', 'Recreation Center', 'Security']
      },
      {
        name: 'Queen Elizabeth Hall',
        gender: 'FEMALE' as const,
        capacity: 450,
        available: 450,
        location: 'North Campus',
        amenities: ['WiFi', 'Study Room', 'Gym', 'Laundry', 'Security']
      }
    ];

    for (const hostelData of hostels) {
      const hostel = await prisma.hostel.create({
        data: hostelData
      });

      console.log(`✅ Created hostel: ${hostel.name}`);

      // Create rooms for each hostel
      const roomsPerFloor = 20;
      const floors = Math.ceil(hostel.capacity / (roomsPerFloor * 2)); // 2 students per room

      for (let floor = 1; floor <= floors; floor++) {
        for (let roomNum = 1; roomNum <= roomsPerFloor; roomNum++) {
          if ((floor - 1) * roomsPerFloor + roomNum > hostel.capacity / 2) break;
          
          const roomNumber = `${floor.toString().padStart(2, '0')}${roomNum.toString().padStart(2, '0')}`;
          
          await prisma.room.create({
            data: {
              hostelId: hostel.id,
              number: roomNumber,
              capacity: 2,
              occupied: 0
            }
          });
        }
      }

      console.log(`📦 Created rooms for ${hostel.name}`);
    }

    // Create system settings
    console.log('⚙️ Creating system settings...');
    
    const settings = [
      {
        key: 'ALLOCATION_OPEN',
        value: { 
          enabled: true, 
          openDate: new Date(), 
          closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
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
      },
      {
        key: 'ACADEMIC_SESSION',
        value: {
          current: '2024/2025',
          semester: 'First Semester'
        }
      }
    ];

    for (const setting of settings) {
      await prisma.systemSettings.create({
        data: setting
      });
      console.log(`✅ Created setting: ${setting.key}`);
    }

    // Create default admin user
    console.log('👤 Creating default admin user...');
    
    const adminPassword = await bcrypt.hash('AdminPassword123!', 12);
    
    const adminUser = await prisma.user.create({
      data: {
        name: 'System Administrator',
        email: 'admin@uniport.edu.ng',
        matricNo: 'ADMIN001',
        passwordHash: adminPassword,
        role: 'ADMIN'
      }
    });

    await prisma.adminProfile.create({
      data: {
        userId: adminUser.id,
        createdBy: adminUser.id // Self-created for initial admin
      }
    });

    console.log('✅ Created default admin user');
    console.log('📧 Admin Email: admin@uniport.edu.ng');
    console.log('🔐 Admin Password: AdminPassword123!');

    // Create sample historical data for ML training
    console.log('📊 Creating sample historical data...');
    
    const historicalData = [
      {
        academicSession: '2022/2023',
        semester: 'First Semester',
        hostelName: 'Alvan Ikoku Hall',
        applicants: 280,
        allocated: 250,
        waitlisted: 30,
        gender: 'MALE' as const,
        level: 'YEAR_2' as const
      },
      {
        academicSession: '2022/2023',
        semester: 'First Semester',
        hostelName: 'Eleanor Roosevelt Hall',
        applicants: 350,
        allocated: 300,
        waitlisted: 50,
        gender: 'FEMALE' as const,
        level: 'YEAR_3' as const
      },
      {
        academicSession: '2023/2024',
        semester: 'First Semester',
        hostelName: 'Professor Dike Hall',
        applicants: 220,
        allocated: 200,
        waitlisted: 20,
        gender: 'MALE' as const,
        level: 'YEAR_4' as const
      },
      {
        academicSession: '2023/2024',
        semester: 'First Semester',
        hostelName: 'Queen Elizabeth Hall',
        applicants: 270,
        allocated: 225,
        waitlisted: 45,
        gender: 'FEMALE' as const,
        level: 'YEAR_2' as const
      }
    ];

    for (const data of historicalData) {
      await prisma.historicalData.create({
        data
      });
    }

    console.log('✅ Created sample historical data for ML training');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Created ${hostels.length} hostels with rooms`);
    console.log(`- Created ${settings.length} system settings`);
    console.log('- Created default admin user');
    console.log(`- Created ${historicalData.length} historical data records`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Database seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
