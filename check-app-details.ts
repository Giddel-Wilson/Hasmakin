import { MongoClient, ObjectId } from 'mongodb';

const DATABASE_URL = "mongodb+srv://GiddelWilson:yoegs7v74GJ7Jqcy@cluster0.oollojt.mongodb.net/hostel_allocation?retryWrites=true&w=majority";

async function main() {
  const client = new MongoClient(DATABASE_URL);
  
  try {
    await client.connect();
    const db = client.db('hostel_allocation');
    
    // Get the latest approved application
    const application: any = await db.collection('applications').findOne(
      { application_status: 'APPROVED' },
      { sort: { submitted_at: -1 } }
    );
    
    if (!application) {
      console.log('No approved application found');
      return;
    }
    
    console.log('\n📋 Latest Approved Application:');
    console.log('================================');
    console.log('Application ID:', application._id);
    console.log('User ID:', application.user_id);
    console.log('Status:', application.application_status);
    console.log('Level:', application.level);
    console.log('Preferences (Hostel IDs):', application.preferences);
    console.log('Special Needs:', application.special_needs || 'None');
    console.log('Medical Conditions:', application.medical_conditions || 'None');
    console.log('Submitted:', application.submitted_at);
    
    // Get hostel names for preferences
    if (application.preferences && application.preferences.length > 0) {
      console.log('\n🏨 Hostel Preferences:');
      console.log('======================');
      
      for (let i = 0; i < application.preferences.length; i++) {
        const hostelId = application.preferences[i];
        const hostel = await db.collection('hostels').findOne({ 
          _id: new ObjectId(hostelId) 
        });
        
        if (hostel) {
          console.log(`${i + 1}. ${hostel.name} (${hostel.location})`);
        } else {
          console.log(`${i + 1}. Unknown Hostel (ID: ${hostelId})`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

main();
