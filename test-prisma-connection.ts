import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testConnection() {
  try {
    console.log('Testing Prisma connection...\n');
    
    // Try to count users
    const userCount = await prisma.user.count();
    console.log('✅ Successfully connected!');
    console.log(`Found ${userCount} users in database\n`);
    
    // Try to find one user
    const user = await prisma.user.findFirst({
      where: { matricNo: 'U2021/5570004' }
    });
    
    if (user) {
      console.log('✅ Found user:', {
        id: user.id,
        name: user.name,
        matricNo: user.matricNo
      });
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
