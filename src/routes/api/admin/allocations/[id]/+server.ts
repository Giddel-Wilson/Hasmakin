import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';

export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    // Verify admin authentication using locals (set by hooks)
    if (!locals.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    if (locals.user.role !== 'ADMIN') {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = params;

    // Check if allocation exists
    const allocation = await prisma.allocation.findUnique({
      where: { id },
      include: {
        user: true,
        application: true
      }
    });

    if (!allocation) {
      return json({ error: 'Allocation not found' }, { status: 404 });
    }

    // Delete the allocation
    await prisma.allocation.delete({
      where: { id }
    });

    // Update related application status back to APPROVED (so they can be re-allocated)
    // No need to change status - application remains APPROVED but without allocation
    // The allocation query will now pick it up again since allocations.none filter will match

    return json({ success: true });

  } catch (error) {
    console.error('Error deleting allocation:', error);
    return json({ error: 'Failed to delete allocation' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  try {
    // Verify admin authentication using locals (set by hooks)
    if (!locals.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    if (locals.user.role !== 'ADMIN') {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { status, roomId } = body;

    // Validate status
    const validStatuses = ['PENDING', 'ALLOCATED', 'CONFIRMED', 'REJECTED'];
    if (status && !validStatuses.includes(status)) {
      return json({ error: 'Invalid status' }, { status: 400 });
    }

    // Check if allocation exists
    const existingAllocation = await prisma.allocation.findUnique({
      where: { id }
    });

    if (!existingAllocation) {
      return json({ error: 'Allocation not found' }, { status: 404 });
    }

    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
    }

    if (roomId) {
      // Validate room exists and has capacity
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
          _count: {
            select: {
              allocations: {
                where: {
                  status: {
                    in: ['ALLOCATED', 'CONFIRMED']
                  },
                  id: {
                    not: id // Exclude current allocation from count
                  }
                }
              }
            }
          }
        }
      });

      if (!room) {
        return json({ error: 'Room not found' }, { status: 404 });
      }

      if (room._count.allocations >= room.capacity) {
        return json({ error: 'Room is at full capacity' }, { status: 400 });
      }

      updateData.roomId = roomId;
    }

    // Update the allocation
    const allocation = await prisma.allocation.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            matricNo: true,
            name: true,
            email: true
          }
        },
        application: {
          select: {
            level: true
          }
        },
        room: {
          select: {
            id: true,
            number: true,
            capacity: true,
            hostel: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    return json({ allocation });

  } catch (error) {
    console.error('Error updating allocation:', error);
    return json({ error: 'Failed to update allocation' }, { status: 500 });
  }
};
