import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export const GET: RequestHandler = async ({ cookies }) => {
  try {
    // Verify admin authentication
    const token = cookies.get('accessToken');
    if (!token) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check for simple admin token (fallback mode)
    if (token.startsWith('admin-')) {
      // Simple admin token is valid, proceed
    } else {
      // Try to verify as JWT token
      try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        if (payload.role !== 'ADMIN') {
          return json({ error: 'Admin access required' }, { status: 403 });
        }
      } catch (error) {
        return json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    // Get all allocations with related data
    const allocations = await prisma.allocation.findMany({
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
            id: true,
            level: true,
            gender: true,
            applicationStatus: true
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
      },
      orderBy: {
        allocatedAt: 'desc'
      }
    });

    return json({ allocations });

  } catch (error) {
    console.error('Error fetching allocations:', error);
    return json({ error: 'Failed to fetch allocations' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    // Verify admin authentication
    const token = cookies.get('accessToken');
    if (!token) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check for simple admin token (fallback mode)
    if (token.startsWith('admin-')) {
      // Simple admin token is valid, proceed
    } else {
      // Try to verify as JWT token
      try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        if (payload.role !== 'ADMIN') {
          return json({ error: 'Admin access required' }, { status: 403 });
        }
      } catch (error) {
        return json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { studentId, roomId, applicationId } = body;

    if (!studentId || !roomId) {
      return json({ error: 'Student ID and Room ID are required' }, { status: 400 });
    }

    // If no applicationId provided, try to find the student's pending application
    let finalApplicationId = applicationId;
    if (!finalApplicationId) {
      const pendingApplication = await prisma.application.findFirst({
        where: {
          userId: studentId,
          applicationStatus: 'PENDING'
        }
      });
      
      if (!pendingApplication) {
        return json({ error: 'No pending application found for this student' }, { status: 400 });
      }
      
      finalApplicationId = pendingApplication.id;
    }

    // Check if student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return json({ error: 'Student not found' }, { status: 404 });
    }

    // Check if room exists and has capacity
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        _count: {
          select: {
            allocations: {
              where: {
                status: {
                  in: ['ALLOCATED', 'CONFIRMED']
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

    // Check if student already has an allocation
    const existingAllocation = await prisma.allocation.findFirst({
      where: {
        userId: studentId,
        status: {
          in: ['ALLOCATED', 'CONFIRMED']
        }
      }
    });

    if (existingAllocation) {
      return json({ error: 'Student already has an active allocation' }, { status: 400 });
    }

    // Create the allocation
    const allocation = await prisma.allocation.create({
      data: {
        userId: studentId,
        applicationId: finalApplicationId,
        roomId,
        status: 'ALLOCATED'
      },
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
            id: true,
            level: true,
            gender: true,
            applicationStatus: true
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

    return json({ allocation }, { status: 201 });

  } catch (error) {
    console.error('Error creating allocation:', error);
    return json({ error: 'Failed to create allocation' }, { status: 500 });
  }
};
