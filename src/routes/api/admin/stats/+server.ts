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

    console.log('[Admin Stats] Fetching real database statistics...');

    // Fetch real statistics from database
    const [
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      totalAllocations,
      confirmedAllocations,
      allRooms,
      totalPayments,
      pendingPayments,
      completedPayments,
      failedPayments
    ] = await Promise.all([
      prisma.application.count(),
      prisma.application.count({ where: { applicationStatus: 'PENDING' } }),
      prisma.application.count({ where: { applicationStatus: 'APPROVED' } }),
      prisma.application.count({ where: { applicationStatus: 'REJECTED' } }),
      prisma.allocation.count(),
      prisma.allocation.count({ where: { status: 'CONFIRMED' } }),
      prisma.room.findMany({ select: { capacity: true, _count: { select: { allocations: { where: { status: { in: ['ALLOCATED', 'CONFIRMED'] } } } } } } }),
      prisma.payment.count(),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.payment.count({ where: { status: 'COMPLETED' } }),
      prisma.payment.count({ where: { status: 'FAILED' } })
    ]);

    // Calculate bed statistics
    const totalBeds = allRooms.reduce((sum: number, room: any) => sum + room.capacity, 0);
    const occupiedBeds = allRooms.reduce((sum: number, room: any) => sum + room._count.allocations, 0);
    const availableBeds = totalBeds - occupiedBeds;
    const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0.0';

    const stats = {
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      totalAllocations,
      confirmedAllocations,
      totalBeds,
      availableBeds,
      occupiedBeds,
      occupancyRate: `${occupancyRate}%`,
      totalPayments,
      pendingPayments,
      completedPayments,
      failedPayments
    };

    console.log('[Admin Stats] Statistics:', stats);

    return json(stats);

  } catch (error) {
    console.error('[Admin Stats] Error:', error);
    return json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
};
