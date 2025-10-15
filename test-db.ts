// Test database connection
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables with override
config({ override: true });

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    console.log('📡 DATABASE_URL:', process.env.DATABASE_URL);
    
    // Test with a simple query
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful!');
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('📋 Tables found:', tables);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
