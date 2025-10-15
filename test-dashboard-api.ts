// Quick test to call the dashboard API and see what it returns
const response = await fetch('http://localhost:5173/api/student/dashboard', {
  headers: {
    'Cookie': 'accessToken=your-token-here'
  }
});

const data = await response.json();
console.log('\n=== Dashboard API Response ===');
console.log(JSON.stringify(data, null, 2));
