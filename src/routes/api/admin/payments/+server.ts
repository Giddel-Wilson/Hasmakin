import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		// Get query parameters for filtering
		const status = url.searchParams.get('status');
		const method = url.searchParams.get('method');
		const startDate = url.searchParams.get('startDate');
		const endDate = url.searchParams.get('endDate');

		// Build where clause
		const where: any = {};

		if (status && status !== 'ALL') {
			where.status = status;
		}

		if (method && method !== 'ALL') {
			where.paymentMethod = method;
		}

		if (startDate) {
			where.createdAt = {
				...where.createdAt,
				gte: new Date(startDate)
			};
		}

		if (endDate) {
			const endDateTime = new Date(endDate);
			endDateTime.setHours(23, 59, 59, 999);
			where.createdAt = {
				...where.createdAt,
				lte: endDateTime
			};
		}

		const payments = await prisma.payment.findMany({
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
				application: {
					select: {
						id: true,
						level: true,
						gender: true,
						applicationStatus: true,
						allocations: {
							include: {
								room: {
									include: {
										hostel: {
											select: {
												id: true,
												name: true
											}
										}
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

		return json(payments);
	} catch (error) {
		console.error('Error fetching payments:', error);
		return json({ error: 'Failed to fetch payments' }, { status: 500 });
	}
};
