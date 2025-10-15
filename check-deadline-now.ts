import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDeadline() {
  try {
    const deadlineSetting = await prisma.systemSettings.findUnique({
      where: { key: 'application_deadline' }
    });

    const now = new Date();
    
    console.log('\n=== Deadline Check ===');
    console.log('Current time (UTC):', now.toISOString());
    console.log('Current time (Local):', now.toLocaleString());
    
    if (deadlineSetting?.value) {
      const rawValue = deadlineSetting.value;
      console.log('\nRaw deadline value:', rawValue);
      
      let dateString = typeof rawValue === 'string' ? rawValue : null;
      
      // Try JSON.parse first (for double-encoded strings like "\"2025-10-12T00:50\"")
      if (dateString) {
        try {
          const parsed = JSON.parse(dateString);
          dateString = typeof parsed === 'string' ? parsed : dateString;
        } catch {
          // Not JSON, use as-is
        }
      }
      
      console.log('Date string after JSON.parse:', JSON.stringify(dateString));
      
      // Trim whitespace
      if (dateString) {
        dateString = dateString.trim();
      }
      
      console.log('After trim:', JSON.stringify(dateString));
      console.log('Matches pattern?', dateString?.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/));
      
      // Fix incomplete ISO strings
      if (dateString && dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        dateString = dateString + ':00Z';
        console.log('Fixed to:', dateString);
      }
      
      if (dateString) {
        const deadline = new Date(dateString);
        
        if (!isNaN(deadline.getTime())) {
          console.log('\nDeadline (UTC):', deadline.toISOString());
          console.log('Deadline (Local):', deadline.toLocaleString());
          
          const isPast = now > deadline;
          const diff = Math.abs(now.getTime() - deadline.getTime());
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          
          console.log('\n' + (isPast ? '❌ DEADLINE PASSED' : '✅ DEADLINE NOT REACHED'));
          console.log('Time difference:', hours, 'hours', minutes, 'minutes');
          
          if (isPast) {
            console.log('\n🚨 Modal SHOULD be showing "Applications Closed"');
          } else {
            console.log('\n✓ Applications are still OPEN');
          }
        } else {
          console.log('\n❌ Invalid date string');
        }
      }
    } else {
      console.log('\n⚠️ No deadline setting found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDeadline();
