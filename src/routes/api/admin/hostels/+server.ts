import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
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

    // Get all hostels with room and allocation data
    const hostels = await prisma.hostel.findMany({
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
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Calculate occupancy stats for each hostel
    const hostelsWithStats = hostels.map(hostel => {
      // If hostel has rooms, calculate from rooms; otherwise use hostel's capacity field
      const totalCapacity = hostel.rooms.length > 0 
        ? hostel.rooms.reduce((sum, room) => sum + room.capacity, 0)
        : hostel.capacity;
      
      const totalOccupied = hostel.rooms.reduce((sum, room) => sum + room._count.allocations, 0);
      const occupancyRate = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;

      return {
        ...hostel,
        totalCapacity,
        totalOccupied,
        occupancyRate: Math.round(occupancyRate * 100) / 100
      };
    });

    return json({ hostels: hostelsWithStats });

  } catch (error) {
    console.error('Error fetching hostels:', error);
    return json({ error: 'Failed to fetch hostels' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Verify admin authentication using locals (set by hooks)
    if (!locals.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    if (locals.user.role !== 'ADMIN') {
      return json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, gender, capacity, available, location, locationDescription, amenities, description } = body;

    if (!name || !gender || !location) {
      return json({ error: 'Name, gender, and location are required' }, { status: 400 });
    }

    // Check if hostel name already exists
    const existingHostel = await prisma.hostel.findUnique({
      where: { name }
    });

    if (existingHostel) {
      return json({ error: 'A hostel with this name already exists' }, { status: 400 });
    }

    // Create the hostel
    const hostel = await prisma.hostel.create({
      data: {
        name,
        gender,
        capacity: capacity || 0,
        available: available || 0,
        location,
        locationDescription: locationDescription || null,
        amenities: amenities || [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        rooms: true,
        _count: {
          select: {
            rooms: true
          }
        }
      }
    });

    return json({ hostel }, { status: 201 });

  } catch (error) {
    console.error('Error creating hostel:', error);
    return json({ error: 'Failed to create hostel' }, { status: 500 });
  }
};
