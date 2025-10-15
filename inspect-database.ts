#!/usr/bin/env bun
import { MongoClient } from 'mongodb';

// Database connection string from .env
const DATABASE_URL = "mongodb+srv://GiddelWilson:yoegs7v74GJ7Jqcy@cluster0.oollojt.mongodb.net/hostel_allocation?retryWrites=true&w=majority";

async function inspectDatabase() {
  const client = new MongoClient(DATABASE_URL);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    const db = client.db('hostel_allocation');

    // Get all collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name).sort();

    console.log('📊 DATABASE INSPECTION REPORT');
    console.log('=' .repeat(80));
    console.log(`Database: hostel_allocation`);
    console.log(`Total Collections: ${collectionNames.length}`);
    console.log(`Collections: ${collectionNames.join(', ')}`);
    console.log('=' .repeat(80) + '\n');

    // Inspect each collection
    for (const collectionName of collectionNames) {
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();

      console.log(`📋 COLLECTION: ${collectionName.toUpperCase()}`);
      console.log(`Total Documents: ${count}`);

      if (count === 0) {
        console.log('❌ No documents found\n');
        continue;
      }

      // Get sample documents (first 10)
      const documents = await collection.find({}).limit(10).toArray();

      // Get all unique keys for table headers
      const allKeys = new Set<string>();
      documents.forEach(doc => {
        Object.keys(doc).forEach(key => allKeys.add(key));
      });

      const headers = Array.from(allKeys).sort();

      // Create table
      console.log('\n' + '=' .repeat(100));

      // Print headers
      const headerRow = headers.map(h => h.padEnd(15)).join(' | ');
      console.log(headerRow);
      console.log('-'.repeat(headerRow.length));

      // Print data rows
      documents.forEach((doc, index) => {
        const row = headers.map(header => {
          let value = doc[header];

          // Format different data types
          if (value === null || value === undefined) {
            value = 'null';
          } else if (typeof value === 'object' && value instanceof Date) {
            value = value.toISOString().split('T')[0]; // Just date part
          } else if (typeof value === 'object' && value._bsontype === 'ObjectId') {
            value = value.toString().substring(0, 8) + '...'; // Shortened ObjectId
          } else if (typeof value === 'object') {
            value = JSON.stringify(value).substring(0, 12) + '...'; // Truncated JSON
          } else if (typeof value === 'string' && value.length > 15) {
            value = value.substring(0, 12) + '...';
          } else if (typeof value === 'boolean') {
            value = value ? 'true' : 'false';
          }

          return String(value).padEnd(15);
        }).join(' | ');

        console.log(row);

        // Add separator every 5 rows for readability
        if ((index + 1) % 5 === 0 && index < documents.length - 1) {
          console.log('-'.repeat(headerRow.length));
        }
      });

      // Show summary if more documents exist
      if (count > 10) {
        console.log(`\n... and ${count - 10} more documents`);
      }

      // Show collection statistics
      try {
        const stats = await db.command({ collStats: collectionName });
        console.log(`\n📈 Collection Stats:`);
        console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`   Storage Size: ${(stats.storageSize / 1024).toFixed(2)} KB`);
        console.log(`   Documents: ${stats.count}`);
        console.log(`   Indexes: ${stats.nindexes}`);
        console.log(`   Total Index Size: ${(stats.totalIndexSize / 1024).toFixed(2)} KB`);
      } catch (error) {
        console.log(`\n📈 Collection Stats: Unable to retrieve stats (${error instanceof Error ? error.message : 'Unknown error'})`);
      }

      console.log('\n' + '=' .repeat(100) + '\n');
    }

    // Database-level statistics
    console.log('🏗️  DATABASE STATISTICS');
    console.log('=' .repeat(50));

    try {
      const dbStats = await db.command({ dbStats: 1 });
      console.log(`Collections: ${dbStats.collections}`);
      console.log(`Views: ${dbStats.views || 0}`);
      console.log(`Objects: ${dbStats.objects}`);
      console.log(`Data Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Storage Size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Indexes: ${dbStats.indexes}`);
      console.log(`Index Size: ${(dbStats.indexSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`File Size: ${(dbStats.fileSize / 1024 / 1024).toFixed(2)} MB`);
    } catch (error) {
      console.log(`Unable to retrieve database stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Error inspecting database:', error);
  } finally {
    await client.close();
    console.log('🔌 Connection closed.');
  }
}

// Run the inspection
inspectDatabase().catch(console.error);