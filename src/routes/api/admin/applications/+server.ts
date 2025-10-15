import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';
import { AuthService } from '$lib/server/auth';

export const GET: RequestHandler = async ({ url, cookies }) => {
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
			// Try to verify as JWT token using AuthService
			const payload = AuthService.verifyAccessToken(token);
			if (!payload) {
				return json({ error: 'Invalid token' }, { status: 401 });
			}
			if (payload.role !== 'ADMIN') {
				return json({ error: 'Admin access required' }, { status: 403 });
			}
		}

		// Get query parameters for filtering
		const status = url.searchParams.get('status');
		const level = url.searchParams.get('level');
		const gender = url.searchParams.get('gender');
		const startDate = url.searchParams.get('startDate');
		const endDate = url.searchParams.get('endDate');

		// Build where clause
		const where: any = {};

		if (status && status !== 'ALL') {
			where.applicationStatus = status;
			
			// If fetching APPROVED applications, exclude those with existing allocations
			if (status === 'APPROVED') {
				where.allocations = {
					none: {
						status: {
							in: ['ALLOCATED', 'CONFIRMED']
						}
					}
				};
			}
		}

		if (level && level !== 'ALL') {
			where.level = level;
		}

		if (gender && gender !== 'ALL') {
			where.gender = gender;
		}

		if (startDate) {
			where.submittedAt = {
				...where.submittedAt,
				gte: new Date(startDate)
			};
		}

		if (endDate) {
			const endDateTime = new Date(endDate);
			endDateTime.setHours(23, 59, 59, 999);
			where.submittedAt = {
				...where.submittedAt,
				lte: endDateTime
			};
		}

		const applications = await prisma.application.findMany({
			where,
			include: {
				user: {
					select: {
						id: true,
						name: true,
						matricNo: true,
						email: true
					}
				},
				payments: {
					select: {
						status: true,
						amount: true
					}
				},
				allocations: {
					include: {
						room: {
							include: {
								hostel: {
									select: {
										name: true
									}
								}
							}
						}
					}
				}
			},
			orderBy: {
				submittedAt: 'desc'
			}
		});

		console.log('[Admin Applications API] Found', applications.length, 'applications');
		if (applications.length > 0) {
			console.log('[Admin Applications API] First application:', {
				id: applications[0].id,
				status: applications[0].applicationStatus,
				user: applications[0].user?.name
			});
		}

		// Fetch hostel names for preferences
		const allHostelIds = [...new Set(applications.flatMap((app: any) => app.preferences))];
		const hostels = await prisma.hostel.findMany({
			where: {
				id: { in: allHostelIds }
			},
			select: {
				id: true,
				name: true
			}
		});

		const hostelMap = new Map(hostels.map((h: any) => [h.id, h.name]));

		// Fetch roommate details for applications with roommate requests
		const roommateIds = applications
			.map((app: any) => app.requestedRoommateId)
			.filter((id: string | null) => id !== null);
		
		const roommates = await prisma.user.findMany({
			where: {
				id: { in: roommateIds }
			},
			select: {
				id: true,
				name: true,
				matricNo: true
			}
		});

		const roommateMap = new Map(roommates.map((r: any) => [r.id, r]));

		// Transform applications to include hostel names and roommate details
		const transformedApplications = applications.map((app: any) => ({
			...app,
			hostelPreferences: app.preferences.map((id: string) => hostelMap.get(id) || id),
			academicLevel: app.level,
			requestedRoommate: app.requestedRoommateId ? roommateMap.get(app.requestedRoommateId) : null
		}));

		return json(transformedApplications);
	} catch (error) {
		console.error('Error fetching applications:', error);
		return json({ error: 'Failed to fetch applications' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request, locals }) => {
	try {
		const { applicationId, status, rejectionReason } = await request.json();

		const updatedApplication = await prisma.application.update({
			where: { id: applicationId },
			data: {
				applicationStatus: status,
				...(rejectionReason && { specialNeeds: rejectionReason })
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

		return json({
			success: true,
			application: updatedApplication
		});
	} catch (error) {
		console.error('Error updating application:', error);
		return json({ error: 'Failed to update application' }, { status: 500 });
	}
};
