#!/usr/bin/env bun
import { MongoClient } from 'mongodb';

const DATABASE_URL = "mongodb+srv://GiddelWilson:yoegs7v74GJ7Jqcy@cluster0.oollojt.mongodb.net/hostel_allocation";

const client = new MongoClient(DATABASE_URL);
await client.connect();
const db = client.db('hostel_allocation');

// Update the student user to rename guardian_phone to guardian_phone_1 and add guardian_phone_2
const result = await db.collection('users').updateOne(
  { email: 'gogbonna004@uniport.edu.ng' },
  { 
    $rename: { 
      guardian_phone: 'guardian_phone_1'
    },
    $set: {
      guardian_phone_2: '+2349087654321'
    }
  }
);

console.log('Update result:', result);

// Verify the update
const user = await db.collection('users').findOne({ email: 'gogbonna004@uniport.edu.ng' });
console.log('\nUpdated user data:');
console.log('Name:', user?.name);
console.log('Email:', user?.email);
console.log('Gender:', user?.gender);
console.log('Phone:', user?.phone_number);
console.log('Guardian Phone 1:', user?.guardian_phone_1);
console.log('Guardian Phone 2:', user?.guardian_phone_2);

await client.close();
