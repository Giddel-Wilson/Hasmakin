import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		// Get query parameters for filtering
		const role = url.searchParams.get('role');
		const status = url.searchParams.get('status');

		// Build where clause
		const where: any = {};

		if (role && role !== 'ALL') {
			where.role = role;
		}

		if (status && status !== 'ALL') {
			where.accountStatus = status;
		}

		const users = await prisma.user.findMany({
			where,
			include: {
				applications: {
					select: {
						id: true,
						applicationStatus: true,
						submittedAt: true
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
				createdAt: 'desc'
			}
		});

		// Format users for frontend
		const formattedUsers = users.map((user: any) => ({
			id: user.id,
			name: user.name,
			email: user.email,
			matricNo: user.matricNo,
			role: user.role,
			status: user.accountStatus,
			emailVerified: true, // Assume verified for now
			phoneVerified: true, // Assume verified for now
			lastLogin: null, // Not tracking this yet
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt.toISOString(),
			applications: user.applications,
			allocations: user.allocations
		}));

		return json(formattedUsers);
	} catch (error) {
		console.error('Error fetching users:', error);
		return json({ error: 'Failed to fetch users' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const userData = await request.json();

		const newUser = await prisma.user.create({
			data: {
				name: userData.name,
				email: userData.email,
				matricNo: userData.matricNo,
				passwordHash: 'temp-password', // Should be properly hashed
				role: userData.role || 'STUDENT',
				accountStatus: userData.status || 'ACTIVE'
			}
		});

		return json({
			success: true,
			user: newUser
		});
	} catch (error) {
		console.error('Error creating user:', error);
		return json({ error: 'Failed to create user' }, { status: 500 });
	}
};
