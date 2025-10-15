import { PrismaClient } from '@prisma/client';

async function checkConnection() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('DATABASE_URL from .env:');
    console.log(process.env.DATABASE_URL);
    console.log('\n');

    // Try a simple operation
    console.log('Attempting to connect...');
    const result = await prisma.user.findMany({ take: 1 });
    console.log('✅ Connection successful!');
    console.log('Found users:', result.length);
    
  } catch (error: any) {
    console.error('❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnection();
