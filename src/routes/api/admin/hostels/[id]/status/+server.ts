import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
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
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return json({ error: 'isActive must be a boolean' }, { status: 400 });
    }

    // Check if hostel exists
    const existingHostel = await prisma.hostel.findUnique({
      where: { id }
    });

    if (!existingHostel) {
      return json({ error: 'Hostel not found' }, { status: 404 });
    }

    // Update the hostel status
    const hostel = await prisma.hostel.update({
      where: { id },
      data: {
        isActive
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
    console.error('Error updating hostel status:', error);
    return json({ error: 'Failed to update hostel status' }, { status: 500 });
  }
};

// Also support PUT for backward compatibility
export const PUT = PATCH;
