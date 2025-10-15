#!/usr/bin/env bun
import { MongoClient } from 'mongodb';

const DATABASE_URL = "mongodb+srv://GiddelWilson:yoegs7v74GJ7Jqcy@cluster0.oollojt.mongodb.net/hostel_allocation";

const client = new MongoClient(DATABASE_URL);
await client.connect();
const db = client.db('hostel_allocation');

// Update the student user with a test religion value
const result = await db.collection('users').updateOne(
  { email: 'gogbonna004@uniport.edu.ng' },
  { $set: { religion: 'Christianity' } }
);

console.log('Update result:', result);

// Verify the update
const user = await db.collection('users').findOne({ email: 'gogbonna004@uniport.edu.ng' });
console.log('\nUpdated user data:', JSON.stringify(user, null, 2));

await client.close();
