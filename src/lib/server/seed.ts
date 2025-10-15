// Database Initialization Script
// University of Port Harcourt - Hostel Allocation System

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Create Admin User
    console.log('📝 Creating admin user...');
    const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 12);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@uniport.edu.ng' },
      update: {},
      create: {
        id: 'admin-uniport-2024',
        name: 'System Administrator',
        email: 'admin@uniport.edu.ng',
        matricNo: 'ADMIN001',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        accountStatus: 'ACTIVE'
      }
    });

    // Create Admin Profile
    await prisma.adminProfile.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: {
        userId: adminUser.id,
        createdBy: adminUser.id
      }
    });

    // 2. Create Hostels
    console.log('🏠 Creating hostels...');
    const hostels = [
      // Male Hostels
      {
        name: 'Mandela Hall',
        gender: 'MALE',
        capacity: 480,
        available: 480,
        location: 'University Main Campus',
        amenities: ['WiFi', 'Study Hall', 'Common Room', 'Laundry', 'Security']
      },
      {
        name: 'Freedom Hall',
        gender: 'MALE',
        capacity: 400,
        available: 400,
        location: 'University Main Campus',
        amenities: ['Common Room', 'Study Area', 'Security']
      },
      // Female Hostels
      {
        name: 'Queens Hall',
        gender: 'FEMALE',
        capacity: 300,
        available: 300,
        location: 'University Main Campus',
        amenities: ['WiFi', 'Study Hall', 'Common Room', 'Beauty Salon', 'Laundry', 'Security']
      },
      {
        name: 'New Hall (Female)',
        gender: 'FEMALE',
        capacity: 240,
        available: 240,
        location: 'University Main Campus',
        amenities: ['WiFi', 'Study Area', 'Common Room', 'Security']
      },
      {
        name: 'Amina Hall',
        gender: 'FEMALE',
        capacity: 270,
        available: 270,
        location: 'University Main Campus',
        amenities: ['Study Hall', 'Common Room', 'Security']
      }
    ];

    for (const hostel of hostels) {
      await prisma.hostel.upsert({
        where: { name: hostel.name },
        update: {},
        create: {
          name: hostel.name,
          gender: hostel.gender as any,
          capacity: hostel.capacity,
          available: hostel.available,
          location: hostel.location,
          amenities: hostel.amenities
        }
      });
    }

    // 3. Create Rooms for Each Hostel
    console.log('🚪 Creating rooms...');
    const hostelData = await prisma.hostel.findMany();
    
    for (const hostel of hostelData) {
      const roomsPerFloor = 20;
      const totalRooms = Math.ceil(hostel.capacity / 4); // Assuming average 4 beds per room
      const floors = Math.ceil(totalRooms / roomsPerFloor);
      
      for (let floor = 1; floor <= floors; floor++) {
        const roomsOnThisFloor = Math.min(roomsPerFloor, totalRooms - ((floor - 1) * roomsPerFloor));
        
        for (let roomNum = 1; roomNum <= roomsOnThisFloor; roomNum++) {
          const roomNumber = `${String.fromCharCode(64 + floor)}${roomNum.toString().padStart(2, '0')}`;
          
          // Determine bed count based on hostel type
          let bedCount;
          if (hostel.name.includes('Queens') || hostel.name.includes('Mandela')) {
            // Premium hostels have fewer beds per room
            bedCount = roomNum <= 5 ? 1 : (roomNum <= 15 ? 2 : 3);
          } else {
            // Regular hostels have more beds per room
            bedCount = roomNum <= 2 ? 1 : (roomNum <= 8 ? 2 : (roomNum <= 16 ? 3 : 4));
          }

          await prisma.room.upsert({
            where: {
              hostelId_number: {
                hostelId: hostel.id,
                number: roomNumber
              }
            },
            update: {},
            create: {
              number: roomNumber,
              capacity: bedCount,
              occupied: 0,
              hostelId: hostel.id
            }
          });
        }
      }
    }

    // 4. Create Sample Students
    console.log('👥 Creating sample students...');
    const sampleStudents = [
      {
        name: 'Adaora Okafor',
        email: 'adaora.okafor@uniport.edu.ng',
        matricNo: '20211234567',
        password: 'student123',
        gender: 'FEMALE',
        level: 'YEAR_3'
      },
      {
        name: 'Chukwuma Nwosu',
        email: 'chukwuma.nwosu@uniport.edu.ng',
        matricNo: '20211234568',
        password: 'student123',
        gender: 'MALE',
        level: 'YEAR_2'
      },
      {
        name: 'Fatima Abdullahi',
        email: 'fatima.abdullahi@uniport.edu.ng',
        matricNo: '20211234569',
        password: 'student123',
        gender: 'FEMALE',
        level: 'YEAR_4'
      },
      {
        name: 'Emmanuel Okoro',
        email: 'emmanuel.okoro@uniport.edu.ng',
        matricNo: '20211234570',
        password: 'student123',
        gender: 'MALE',
        level: 'YEAR_1'
      }
    ];

    for (const student of sampleStudents) {
      const passwordHash = await bcrypt.hash(student.password, 12);
      
      await prisma.user.upsert({
        where: { email: student.email },
        update: {},
        create: {
          name: student.name,
          email: student.email,
          matricNo: student.matricNo,
          passwordHash: passwordHash,
          role: 'STUDENT',
          accountStatus: 'ACTIVE'
        }
      });
    }

    // 5. Create Sample Applications
    console.log('📋 Creating sample applications...');
    const students = await prisma.user.findMany({ where: { role: 'STUDENT' } });
    const femaleHostels = await prisma.hostel.findMany({ where: { gender: 'FEMALE' } });
    const maleHostels = await prisma.hostel.findMany({ where: { gender: 'MALE' } });

    for (const student of students.slice(0, 3)) { // Create applications for first 3 students
      const isFemalStudent = student.matricNo === '20211234567' || student.matricNo === '20211234569';
      const availableHostels = isFemalStudent ? femaleHostels : maleHostels;
      const preferences = availableHostels.slice(0, 3).map(h => h.name);
      
      // Check if application already exists
      const existingApplication = await prisma.application.findFirst({
        where: { userId: student.id }
      });

      if (!existingApplication) {
        await prisma.application.create({
          data: {
            userId: student.id,
            gender: isFemalStudent ? 'FEMALE' : 'MALE',
            level: student.matricNo === '20211234567' ? 'YEAR_3' : 
                   student.matricNo === '20211234568' ? 'YEAR_2' : 'YEAR_4',
            preferences: preferences,
            specialNeeds: null,
            paymentStatus: 'PENDING',
            applicationStatus: 'PENDING'
          }
        });
      }
    }

    // 6. Create System Settings
    console.log('⚙️ Creating system settings...');
    const settings = [
      { key: 'ALLOCATION_ACTIVE', value: false },
      { key: 'APPLICATION_DEADLINE', value: '2025-03-31T23:59:59Z' },
      { key: 'ALLOCATION_START_DATE', value: '2025-04-01T00:00:00Z' },
      { key: 'PAYMENT_DEADLINE', value: '2025-04-15T23:59:59Z' },
      { key: 'HOSTEL_FEE_AMOUNT', value: 200000 },
      { key: 'MAXIMUM_APPLICATIONS_PER_STUDENT', value: 1 }
    ];

    for (const setting of settings) {
      await prisma.systemSettings.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: {
          key: setting.key,
          value: setting.value
        }
      });
    }

    console.log('✅ Database seeding completed successfully!');
    console.log(`
📊 Database Summary:
   - 1 Admin user created
   - ${hostels.length} Hostels created
   - Rooms created for all hostels
   - ${sampleStudents.length} Sample students created
   - 3 Sample applications created
   - ${settings.length} System settings configured
   
🔐 Admin Login:
   Email: admin@uniport.edu.ng
   Password: AdminPassword123!
   
👥 Sample Student Login:
   Email: adaora.okafor@uniport.edu.ng
   Password: student123
    `);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase()
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default seedDatabase;
