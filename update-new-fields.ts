#!/usr/bin/env bun
import { MongoClient } from 'mongodb';

const DATABASE_URL = "mongodb+srv://GiddelWilson:yoegs7v74GJ7Jqcy@cluster0.oollojt.mongodb.net/hostel_allocation";

async function updateNewFields() {
  const client = new MongoClient(DATABASE_URL);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    const db = client.db('hostel_allocation');

    // Update the student user with new fields
    const result = await db.collection('users').updateOne(
      { email: 'gogbonna004@uniport.edu.ng' },
      { 
        $set: { 
          nationality: 'Nigeria',
          guardian_relationship_1: 'Father',
          guardian_relationship_2: 'Mother'
        } 
      }
    );

    console.log('Update result:', result);

    // Verify the update
    const user = await db.collection('users').findOne({ email: 'gogbonna004@uniport.edu.ng' });
    
    console.log('\n✅ Updated user data:');
    console.log('Name:', user?.name);
    console.log('Email:', user?.email);
    console.log('Gender:', user?.gender);
    console.log('Nationality:', user?.nationality);
    console.log('State of Origin:', user?.state_of_origin);
    console.log('Religion:', user?.religion);
    console.log('Phone:', user?.phone_number);
    console.log('\nGuardian 1:');
    console.log('  Relationship:', user?.guardian_relationship_1);
    console.log('  Phone:', user?.guardian_phone_1);
    console.log('\nGuardian 2:');
    console.log('  Relationship:', user?.guardian_relationship_2);
    console.log('  Phone:', user?.guardian_phone_2);

    await client.close();
    console.log('\n🔌 Connection closed.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await client.close();
  }
}

updateNewFields().catch(console.error);
