import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createRoommate() {
  try {
    // Check if already exists
    const existing = await prisma.user.findFirst({
      where: { matricNo: 'U2021/5570001' }
    });

    if (existing) {
      console.log('✅ Roommate already exists:');
      console.log('Matric:', existing.matricNo);
      console.log('Name:', existing.name);
      return;
    }

    // Create the roommate
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const roommate = await prisma.user.create({
      data: {
        email: 'whyte.water@uniport.edu.ng',
        passwordHash: hashedPassword,
        name: 'Whyte Water',
        matricNo: 'U2021/5570001',
        role: 'STUDENT',
        admissionYear: 2021,
        gender: 'MALE', // Same gender as Giddel for roommate compatibility
      }
    });

    console.log('✅ Roommate created successfully:');
    console.log('Matric:', roommate.matricNo);
    console.log('Name:', roommate.name);
    console.log('Email:', roommate.email);
    console.log('\nYou can now use this matric number in the roommate request!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createRoommate();
