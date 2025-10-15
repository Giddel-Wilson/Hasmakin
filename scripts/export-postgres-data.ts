/**
 * Export data from PostgreSQL (Neon) before migrating to MongoDB
 */

import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('Starting data export from PostgreSQL...\n');

    // Export all data from each table
    const data = {
      users: await prisma.user.findMany(),
      adminProfiles: await prisma.adminProfile.findMany(),
      applications: await prisma.application.findMany(),
      hostels: await prisma.hostel.findMany(),
      rooms: await prisma.room.findMany(),
      allocations: await prisma.allocation.findMany(),
      payments: await prisma.payment.findMany(),
      systemSettings: await prisma.systemSettings.findMany(),
      auditLogs: await prisma.auditLog.findMany(),
      historicalData: await prisma.historicalData.findMany(),
    };

    // Log counts
    console.log('Data export summary:');
    console.log(`- Users: ${data.users.length}`);
    console.log(`- Admin Profiles: ${data.adminProfiles.length}`);
    console.log(`- Applications: ${data.applications.length}`);
    console.log(`- Hostels: ${data.hostels.length}`);
    console.log(`- Rooms: ${data.rooms.length}`);
    console.log(`- Allocations: ${data.allocations.length}`);
    console.log(`- Payments: ${data.payments.length}`);
    console.log(`- System Settings: ${data.systemSettings.length}`);
    console.log(`- Audit Logs: ${data.auditLogs.length}`);
    console.log(`- Historical Data: ${data.historicalData.length}`);

    // Save to JSON file
    const exportPath = join(process.cwd(), 'postgres-export.json');
    await writeFile(
      exportPath,
      JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      , 2)
    );

    console.log(`\n✅ Data exported successfully to: ${exportPath}`);
    console.log('\nNote: Keep this file safe as a backup!');
  } catch (error) {
    console.error('❌ Error exporting data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
