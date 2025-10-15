import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';

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
    const { 
      settings,
      applicationIds
    } = body;

    const {
      maxAllocationsPerRun = 50,
      prioritizeByLevel = true,
      prioritizeBySubmissionDate = true,
      considerSpecialNeeds = true 
    } = settings || {};

    console.log('📥 Allocation request:', {
      applicationIds: applicationIds?.length || 0,
      maxAllocations: maxAllocationsPerRun
    });

    // Get approved applications without allocations (applications with completed payment)
    const pendingApplications = await prisma.application.findMany({
      where: {
        id: { in: applicationIds },
        applicationStatus: 'APPROVED', // Changed from PENDING to APPROVED
        paymentStatus: 'COMPLETED', // Only allocate to students who have paid
        // Exclude users who already have active allocations
        allocations: {
          none: {
            status: {
              in: ['ALLOCATED', 'CONFIRMED']
            }
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            matricNo: true,
            gender: true
          }
        }
      },
      orderBy: [
        ...(prioritizeBySubmissionDate ? [{ submittedAt: 'asc' as const }] : []),
        ...(prioritizeByLevel ? [{ level: 'desc' as const }] : [])
      ],
      take: maxAllocationsPerRun
    });

    console.log(`📋 Found ${pendingApplications.length} applications matching criteria`);

    if (pendingApplications.length === 0) {
      return json({ 
        success: true, 
        message: 'No pending applications to process',
        allocatedCount: 0 
      });
    }

    // Get available rooms with capacity
    const availableRooms = await prisma.room.findMany({
      where: {
        hostel: {
          isActive: true
        }
      },
      include: {
        hostel: {
          select: {
            id: true,
            name: true,
            gender: true // Changed from 'type' to 'gender'
          }
        },
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

    const roomsWithAvailability = availableRooms.filter(room => 
      room._count.allocations < room.capacity
    );

    if (roomsWithAvailability.length === 0) {
      return json({ 
        success: false, 
        message: 'No available rooms for allocation',
        allocatedCount: 0 
      });
    }

    // Allocation algorithm
    const allocations = [];
    
    console.log(`🔄 Starting allocation for ${pendingApplications.length} applications`);
    
    for (const application of pendingApplications) {
      try {
        // Validate application data
        if (!application.user || !application.user.gender) {
          console.error(`⚠️  Skipping application ${application.id} - missing user or gender data`);
          continue;
        }

        // Find suitable room based on gender and availability
        let suitableRoom = null;

        // Match gender with hostel type
        const matchingRooms = roomsWithAvailability.filter((room: any) => 
          room._count.allocations < room.capacity &&
          room.hostel.gender === application.user.gender
        );

        console.log(`  👤 ${application.user.name} (${application.user.gender}): ${matchingRooms.length} matching rooms`);

        // Pick first available matching room
        if (matchingRooms.length > 0) {
          suitableRoom = matchingRooms[0];
        }

        if (suitableRoom) {
          // Create allocation
          const allocation = await prisma.allocation.create({
            data: {
              userId: application.userId,
              applicationId: application.id,
              roomId: suitableRoom.id,
              status: 'ALLOCATED'
            }
          });

          // Application is already APPROVED at this stage, no need to update again

          allocations.push(allocation);

          // Update room occupancy count
          suitableRoom._count.allocations += 1;
          
          console.log(`  ✅ Allocated ${application.user.name} to ${suitableRoom.hostel.name} - Room ${suitableRoom.number}`);
        } else {
          console.log(`  ⚠️  No suitable room found for ${application.user.name}`);
        }
      } catch (allocError) {
        console.error(`  ❌ Error allocating application ${application.id}:`, allocError);
        // Continue to next application even if this one fails
      }
    }

    console.log(`✅ Allocation complete: ${allocations.length} successful allocations`);

    // Always return a proper response
    const response = { 
      success: true, 
      message: `Successfully allocated ${allocations.length} students`,
      allocatedCount: allocations.length,
      totalPending: pendingApplications.length
    };

    console.log('📤 Sending response:', JSON.stringify(response));
    
    return json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('❌ Error running allocation algorithm:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    const errorResponse = { 
      error: 'Failed to run allocation algorithm', 
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    
    console.log('📤 Sending error response:', JSON.stringify(errorResponse));
    
    return json(errorResponse, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
