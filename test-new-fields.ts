#!/usr/bin/env bun
import { MongoClient } from 'mongodb';

const DATABASE_URL = "mongodb+srv://GiddelWilson:yoegs7v74GJ7Jqcy@cluster0.oollojt.mongodb.net/hostel_allocation";

const client = new MongoClient(DATABASE_URL);
await client.connect();
const db = client.db('hostel_allocation');

// Update the student user with gender and guardian phone
const result = await db.collection('users').updateOne(
  { email: 'gogbonna004@uniport.edu.ng' },
  { 
    $set: { 
      gender: 'MALE',
      guardian_phone: '+2348012345678'
    } 
  }
);

console.log('Update result:', result);

// Verify the update
const user = await db.collection('users').findOne({ email: 'gogbonna004@uniport.edu.ng' });
console.log('\nUpdated user data:');
console.log('Name:', user.name);
console.log('Email:', user.email);
console.log('Gender:', user.gender);
console.log('Religion:', user.religion);
console.log('Phone:', user.phone_number);
console.log('Guardian Phone:', user.guardian_phone);
console.log('Department:', user.department);
console.log('Faculty:', user.faculty);

await client.close();
