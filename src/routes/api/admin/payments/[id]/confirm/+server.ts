import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';

export const POST: RequestHandler = async ({ params, locals }) => {
	try {
		const paymentId = params.id;

		if (!paymentId) {
			return json({ error: 'Payment ID is required' }, { status: 400 });
		}

		// Find the payment
		const payment = await prisma.payment.findUnique({
			where: { id: paymentId },
			include: {
				user: true,
				application: {
					include: {
						allocations: {
							include: {
								room: {
									include: {
										hostel: true
									}
								}
							}
						}
					}
				}
			}
		});

		if (!payment) {
			return json({ error: 'Payment not found' }, { status: 404 });
		}

		if (payment.status === 'COMPLETED') {
			return json({ error: 'Payment already confirmed' }, { status: 400 });
		}

		// Update payment status
		const updatedPayment = await prisma.payment.update({
			where: { id: paymentId },
			data: {
				status: 'COMPLETED',
				paidAt: new Date()
			},
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
					include: {
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
					}
				}
			}
		});

		// Update application payment status
		await prisma.application.update({
			where: { id: payment.applicationId },
			data: {
				paymentStatus: 'COMPLETED'
			}
		});

		// Update allocation status to CONFIRMED if payment is confirmed
		const allocation = payment.application?.allocations?.[0];
		if (allocation) {
			await prisma.allocation.update({
				where: { id: allocation.id },
				data: {
					status: 'CONFIRMED',
					confirmedAt: new Date()
				}
			});
		}
		
		// Log the confirmation action
		console.log('[Payment Confirmation]', {
			paymentId: paymentId,
			reference: payment.reference,
			amount: payment.amount,
			confirmedBy: locals.user?.id || 'system',
			student: `${payment.user.name} (${payment.user.matricNo})`,
			timestamp: new Date().toISOString()
		});

		return json({
			success: true,
			payment: updatedPayment
		});
	} catch (error) {
		console.error('Error confirming payment:', error);
		return json({ error: 'Failed to confirm payment' }, { status: 500 });
	}
};

