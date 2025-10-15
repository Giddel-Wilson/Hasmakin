import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/database';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    // Verify admin authentication using locals (set by hooks)
    if (!locals.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    if (locals.user.role !== 'ADMIN') {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch the 5 most recent applications
    const applications = await prisma.application.findMany({
      take: 5,
      orderBy: {
        submittedAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            matricNo: true,
            email: true
          }
        }
      }
    });

    const formattedApplications = applications.map(app => ({
      id: app.id,
      studentName: app.user.name,
      matricNo: app.user.matricNo,
      academicLevel: app.level.replace('YEAR_', 'Year '),
      status: app.applicationStatus,
      createdAt: app.submittedAt
    }));

    return json(formattedApplications);

  } catch (error) {
    console.error('[Recent Applications] Error:', error);
    return json({ error: 'Failed to fetch recent applications' }, { status: 500 });
  }
};
