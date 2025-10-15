import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const type = url.searchParams.get('type') || url.searchParams.get('gender');
		const status = url.searchParams.get('status');

		// Build where clause
		const where: any = {
			isActive: true // Only show active hostels to students
		};

		if (type && type !== 'ALL') {
			where.gender = type; // Fixed: use 'gender' field instead of 'type'
		}

		if (status && status !== 'ALL') {
			where.status = status;
		}

		const hostels = await prisma.hostel.findMany({
			where,
			include: {
				rooms: {
					include: {
						allocations: {
							where: {
								status: 'ALLOCATED'
							}
						}
					}
				}
			},
			orderBy: {
				name: 'asc'
			}
		});

		// Calculate occupancy statistics and format response
		const hostelStats = hostels.map((hostel: any) => {
			const totalRooms = hostel.rooms.length;
			const totalBeds = hostel.rooms.reduce((sum: number, room: any) => sum + room.capacity, 0);
			
			const occupiedBeds = hostel.rooms.reduce((sum: number, room: any) => 
				sum + room.allocations.length, 0
			);
			
			const occupiedRooms = hostel.rooms.filter((room: any) => 
				room.allocations.length > 0
			).length;

			return {
				id: hostel.id,
				name: hostel.name,
				gender: hostel.gender, // Use 'gender' field from schema
				type: hostel.gender, // For backward compatibility
				location: hostel.location,
				totalRooms,
				occupiedRooms,
				availableRooms: totalRooms - occupiedRooms,
				totalBeds,
				occupiedBeds,
				availableBeds: totalBeds - occupiedBeds,
				capacity: totalBeds,
				// Use the actual 'available' field from database, not calculated
				available: hostel.available ?? (totalBeds - occupiedBeds),
				bedPrice: hostel.bedPrice,
				description: hostel.description,
				amenities: hostel.amenities || [],
				status: hostel.status,
				warden: {
					name: hostel.wardenName || '',
					phone: hostel.wardenPhone || '',
					email: hostel.wardenEmail || ''
				},
				createdAt: hostel.createdAt.toISOString(),
				updatedAt: hostel.updatedAt.toISOString()
			};
		});

		return json(hostelStats);
	} catch (error) {
		console.error('Error fetching hostels:', error);
		return json({ error: 'Failed to fetch hostels' }, { status: 500 });
	}
};
