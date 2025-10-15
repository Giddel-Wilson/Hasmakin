import { AuthService } from './src/lib/server/auth';

async function testAPICall() {
  try {
    // Read the access token from cookies.txt
    const fs = await import('fs');
    const cookiesContent = fs.readFileSync('./cookies.txt', 'utf-8');
    const accessTokenMatch = cookiesContent.match(/accessToken=([^;]+)/);
    
    if (!accessTokenMatch) {
      console.error('No access token found in cookies.txt');
      return;
    }

    const accessToken = accessTokenMatch[1];
    console.log('Testing with access token:', accessToken.substring(0, 20) + '...');

    // Make the API call
    const response = await fetch('http://localhost:5173/api/student/dashboard', {
      headers: {
        'Cookie': `accessToken=${accessToken}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    console.log('Response status:', response.status);
    console.log('Response OK:', response.ok);

    if (response.ok) {
      const data = await response.json();
      console.log('\nReceived data:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.error('Error response:', text);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testAPICall();
