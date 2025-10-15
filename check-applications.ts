#!/usr/bin/env bun
import { prisma } from './src/lib/server/database';

async function checkApplications() {
  try {
    console.log('Checking applications in database...\n');
    
    const applications = await prisma.application.findMany({
      include: {
        user: {
          select: {
            name: true,
            matricNo: true,
            email: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });
    
    console.log(`Total applications found: ${applications.length}\n`);
    
    if (applications.length > 0) {
      console.log('Applications:');
      applications.forEach((app, index) => {
        console.log(`\n${index + 1}. Application ID: ${app.id}`);
        console.log(`   Student: ${app.user.name} (${app.user.matricNo})`);
        console.log(`   Status: ${app.applicationStatus}`);
        console.log(`   Level: ${app.level}`);
        console.log(`   Gender: ${app.gender}`);
        console.log(`   Submitted: ${app.submittedAt}`);
        console.log(`   Preferences: ${app.preferences.join(', ')}`);
      });
    } else {
      console.log('❌ No applications found in database!');
      console.log('\nPossible reasons:');
      console.log('1. No student has successfully submitted an application yet');
      console.log('2. Application submission is failing before data is saved');
      console.log('3. Applications are being created in a different database');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApplications();
