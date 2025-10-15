// Create System Administrator Account
// University of Port Harcourt - Hostel Allocation System

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Load environment variables
config({ override: true });

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function createAdmin() {
  try {
    console.log('🔧 Creating System Administrator Account...');
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin account already exists:');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Name: ${existingAdmin.name}`);
      console.log(`🆔 Matric No: ${existingAdmin.matricNo}`);
      console.log('\n💡 If you need to reset the password, delete this user first and run the script again.');
      return;
    }

    // Admin account details
    const adminData = {
      name: 'System Administrator',
      email: 'admin@uniport.edu.ng',
      matricNo: 'ADMIN001',
      password: 'AdminPassword123!',
      role: 'ADMIN'
    };

    // Hash the password
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(adminData.password, 12);

    // Create the admin user
    console.log('👤 Creating admin user...');
    const adminUser = await prisma.user.create({
      data: {
        name: adminData.name,
        email: adminData.email,
        matricNo: adminData.matricNo,
        passwordHash: passwordHash,
        role: 'ADMIN',
        accountStatus: 'ACTIVE'
      }
    });

    // Create admin profile
    console.log('📋 Creating admin profile...');
    await prisma.adminProfile.create({
      data: {
        userId: adminUser.id,
        createdBy: adminUser.id // Self-created for initial admin
      }
    });

    // Create audit log entry
    console.log('📝 Creating audit log...');
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'ADMIN_ACCOUNT_CREATED',
        details: {
          adminId: adminUser.id,
          createdBy: 'SYSTEM',
          timestamp: new Date()
        }
      }
    });

    console.log('\n🎉 System Administrator Account Created Successfully!');
    console.log('╭─────────────────────────────────────────────────╮');
    console.log('│                 ADMIN CREDENTIALS               │');
    console.log('├─────────────────────────────────────────────────┤');
    console.log(`│ Email:      ${adminData.email.padEnd(30)} │`);
    console.log(`│ Password:   ${adminData.password.padEnd(30)} │`);
    console.log(`│ Matric No:  ${adminData.matricNo.padEnd(30)} │`);
    console.log(`│ Role:       ${adminData.role.padEnd(30)} │`);
    console.log('╰─────────────────────────────────────────────────╯');
    console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
    console.log('   1. Change the default password after first login');
    console.log('   2. Store these credentials securely');
    console.log('   3. Do not share admin credentials');
    console.log('   4. Enable two-factor authentication if available');
    console.log('\n🌐 Access the admin panel at: http://localhost:5173/admin');
    console.log('📱 Or login through: http://localhost:5173/auth/login');

  } catch (error) {
    if (error.code === 'P2002') {
      console.error('❌ Admin account creation failed: Email or Matric No already exists');
      console.log('\n💡 To recreate the admin account:');
      console.log('   1. Delete the existing user from the database');
      console.log('   2. Run this script again');
    } else {
      console.error('❌ Admin account creation failed:', error);
    }
    process.exit(1);
  }
}

async function main() {
  try {
    await createAdmin();
  } catch (error) {
    console.error('❌ Failed to create admin account:', error);
    if (error.message.includes('Can\'t reach database')) {
      console.log('\n🔌 Database Connection Issue:');
      console.log('   1. Ensure your DATABASE_URL is correctly set in .env');
      console.log('   2. Check your database server is running');
      console.log('   3. Verify network connectivity');
      console.log('   4. Run: bunx prisma db pull to test connection');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createAdmin };
