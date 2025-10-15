import { prisma } from './src/lib/server/database';

async function testDashboardStatus() {
  try {
    console.log('=== Testing Dashboard Status Logic ===\n');
    
    // Get user with applications
    const user = await prisma.user.findFirst({
      where: { matricNo: 'U2021/5570004' },
      include: {
        applications: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
          include: {
            payments: {
              orderBy: { createdAt: 'desc' },
              take: 1
            },
            allocations: {
              orderBy: { allocatedAt: 'desc' },
              take: 1,
              include: {
                room: {
                  include: {
                    hostel: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:', user.name);
    console.log('Applications count:', user.applications?.length || 0);

    const latestApplication = user.applications?.[0];
    console.log('\nLatest Application:');
    console.log('  Exists?', !!latestApplication);
    console.log('  Status:', latestApplication?.applicationStatus);
    console.log('  Payment Status:', latestApplication?.paymentStatus);
    console.log('  Submitted:', latestApplication?.submittedAt);

    // Check application period status
    const appStartSetting = await prisma.systemSettings.findUnique({
      where: { key: 'application_start_date' }
    });
    const appDeadlineSetting = await prisma.systemSettings.findUnique({
      where: { key: 'application_deadline' }
    });
    const regOpenSetting = await prisma.systemSettings.findUnique({
      where: { key: 'registration_open' }
    });

    console.log('\nSettings:');
    console.log('  Start date:', appStartSetting?.value);
    console.log('  Deadline:', appDeadlineSetting?.value);
    console.log('  Registration open:', regOpenSetting?.value);

    const now = new Date();
    let startDate: Date | null = null;
    let deadline: Date | null = null;

    // Parse start date
    if (appStartSetting?.value) {
      let dateStr = appStartSetting.value as string;
      try {
        const parsed = JSON.parse(dateStr);
        dateStr = typeof parsed === 'string' ? parsed : dateStr;
      } catch {}
      if (dateStr) {
        dateStr = dateStr.trim();
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
          dateStr = dateStr + ':00Z';
        }
        startDate = new Date(dateStr);
        if (isNaN(startDate.getTime())) startDate = null;
      }
    }

    // Parse deadline
    if (appDeadlineSetting?.value) {
      let dateStr = appDeadlineSetting.value as string;
      try {
        const parsed = JSON.parse(dateStr);
        dateStr = typeof parsed === 'string' ? parsed : dateStr;
      } catch {}
      if (dateStr) {
        dateStr = dateStr.trim();
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
          dateStr = dateStr + ':00Z';
        }
        deadline = new Date(dateStr);
        if (isNaN(deadline.getTime())) deadline = null;
      }
    }

    // Parse registration open
    let isRegistrationOpen = false;
    if (regOpenSetting?.value) {
      const regValue = regOpenSetting.value as any;
      if (typeof regValue === 'string') {
        isRegistrationOpen = regValue.toLowerCase() === 'true';
      } else {
        isRegistrationOpen = regValue === true || regValue.enabled === true;
      }
    }

    console.log('\nParsed Settings:');
    console.log('  Start date:', startDate?.toISOString());
    console.log('  Deadline:', deadline?.toISOString());
    console.log('  Registration open:', isRegistrationOpen);
    console.log('  Current time:', now.toISOString());

    // Determine period status
    let applicationPeriodStatus: 'not_started' | 'open' | 'closed' = 'closed';
    if (!isRegistrationOpen || !startDate) {
      applicationPeriodStatus = 'not_started';
    } else if (now < startDate) {
      applicationPeriodStatus = 'not_started';
    } else if (deadline && now > deadline) {
      applicationPeriodStatus = 'closed';
    } else {
      applicationPeriodStatus = 'open';
    }

    console.log('\nPeriod Status:', applicationPeriodStatus);

    // Calculate application status
    let applicationStatus = 'Not Started';
    
    if (latestApplication) {
      // Student has an application - show application status
      switch (latestApplication.applicationStatus) {
        case 'PENDING':
          applicationStatus = 'Submitted';
          break;
        case 'APPROVED':
          applicationStatus = 'Approved';
          break;
        case 'ALLOCATED':
          applicationStatus = 'Allocated';
          break;
        case 'REJECTED':
          applicationStatus = 'Rejected';
          break;
        default:
          applicationStatus = latestApplication.applicationStatus;
      }
    } else {
      // No application - show period status
      if (applicationPeriodStatus === 'open') {
        applicationStatus = 'Open - Apply Now';
      } else if (applicationPeriodStatus === 'closed') {
        applicationStatus = 'Closed';
      } else {
        applicationStatus = 'Not Started';
      }
    }

    console.log('\n=== FINAL STATUS ===');
    console.log('Application Status:', applicationStatus);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardStatus();
