import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export const PUT: RequestHandler = async ({ params, request, cookies }) => {
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

    const { id } = params;
    const body = await request.json();
    const { name, gender, capacity, available, location, locationDescription, amenities } = body;

    if (!name || !gender || !location) {
      return json({ error: 'Name, gender, and location are required' }, { status: 400 });
    }

    // Check if hostel exists
    const existingHostel = await prisma.hostel.findUnique({
      where: { id }
    });

    if (!existingHostel) {
      return json({ error: 'Hostel not found' }, { status: 404 });
    }

    // Check if name is being changed to an existing name
    if (name !== existingHostel.name) {
      const nameConflict = await prisma.hostel.findUnique({
        where: { name }
      });

      if (nameConflict) {
        return json({ error: 'A hostel with this name already exists' }, { status: 400 });
      }
    }

    // Update the hostel
    const hostel = await prisma.hostel.update({
      where: { id },
      data: {
        name,
        gender,
        capacity: capacity || existingHostel.capacity,
        available: available !== undefined ? available : existingHostel.available,
        location,
        locationDescription: locationDescription || null,
        amenities: amenities || [],
        updatedAt: new Date()
      },
      include: {
        rooms: {
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
        },
        _count: {
          select: {
            rooms: true
          }
        }
      }
    });

    return json({ hostel });

  } catch (error) {
    console.error('Error updating hostel:', error);
    return json({ error: 'Failed to update hostel' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, cookies }) => {
  try {
    // Verify admin authentication
    const token = cookies.get('accessToken');
    if (!token) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      if (payload.role !== 'ADMIN') {
        return json({ error: 'Admin access required' }, { status: 403 });
      }
    } catch (error) {
      return json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = params;

    // Check if hostel exists
    const hostel = await prisma.hostel.findUnique({
      where: { id },
      include: {
        rooms: {
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
        }
      }
    });

    if (!hostel) {
      return json({ error: 'Hostel not found' }, { status: 404 });
    }

    // Check if hostel has active allocations
    const hasActiveAllocations = hostel.rooms.some((room: any) => room._count.allocations > 0);
    if (hasActiveAllocations) {
      return json({ error: 'Cannot delete hostel with active allocations' }, { status: 400 });
    }

    // Delete the hostel (this will cascade delete rooms due to database constraints)
    await prisma.hostel.delete({
      where: { id }
    });

    return json({ success: true });

  } catch (error) {
    console.error('Error deleting hostel:', error);
    return json({ error: 'Failed to delete hostel' }, { status: 500 });
  }
};
