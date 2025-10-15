import { MongoClient } from 'mongodb';

const DATABASE_URL = "mongodb+srv://GiddelWilson:yoegs7v74GJ7Jqcy@cluster0.oollojt.mongodb.net/hostel_allocation?retryWrites=true&w=majority";

async function main() {
  const client = new MongoClient(DATABASE_URL);
  
  try {
    await client.connect();
    const db = client.db('hostel_allocation');
    
    console.log('Checking applications collection...\n');
    
    const applicationsCount = await db.collection('applications').countDocuments();
    console.log(`Total applications: ${applicationsCount}\n`);
    
    if (applicationsCount > 0) {
      const applications = await db.collection('applications').find({}).toArray();
      console.log('Applications found:');
      applications.forEach((app: any, index: number) => {
        console.log(`\n${index + 1}. Application ID: ${app._id}`);
        console.log(`   User ID: ${app.user_id}`);
        console.log(`   Status: ${app.application_status}`);
        console.log(`   Level: ${app.level}`);
        console.log(`   Submitted: ${app.submitted_at}`);
      });
    } else {
      console.log('❌ No applications found in database');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

main();
