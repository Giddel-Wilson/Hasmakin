#!/usr/bin/env bun
import { prisma } from './src/lib/server/database';

async function testZeroAvailable() {
  console.log('🧪 Testing Zero Available Beds Update\n');

  // Find Alvan Ikoku Hall
  const hostel = await prisma.hostel.findFirst({
    where: { name: 'Alvan Ikoku Hall' }
  });

  if (!hostel) {
    console.log('❌ Alvan Ikoku Hall not found');
    await prisma.$disconnect();
    return;
  }

  console.log('Before Update:');
  console.log(`  Name: ${hostel.name}`);
  console.log(`  Capacity: ${hostel.capacity}`);
  console.log(`  Available: ${hostel.available}`);

  // Update to 0 available
  const updated = await prisma.hostel.update({
    where: { id: hostel.id },
    data: { available: 0 }
  });

  console.log('\nAfter Update to 0:');
  console.log(`  Name: ${updated.name}`);
  console.log(`  Capacity: ${updated.capacity}`);
  console.log(`  Available: ${updated.available}`);
  console.log(`  Occupancy: ${updated.capacity > 0 ? Math.round(((updated.capacity - updated.available) / updated.capacity) * 100) : 0}%`);

  console.log('\n✅ Successfully updated available to 0!');
  console.log('\n🔄 Restoring original value...');

  // Restore original value
  await prisma.hostel.update({
    where: { id: hostel.id },
    data: { available: hostel.available }
  });

  console.log('✅ Restored to original value');

  await prisma.$disconnect();
}

testZeroAvailable();
