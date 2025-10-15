import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';

export const POST: RequestHandler = async ({ request, params, locals }) => {
	try {
		const paymentId = params.id;
		const { reason } = await request.json();

		if (!paymentId) {
			return json({ error: 'Payment ID is required' }, { status: 400 });
		}

		if (!reason || reason.trim().length === 0) {
			return json({ error: 'Refund reason is required' }, { status: 400 });
		}

		// Find the payment
		const payment = await prisma.payment.findUnique({
			where: { id: paymentId },
			include: {
				user: true,
				allocation: {
					include: {
						hostel: true
					}
				}
			}
		});

		if (!payment) {
			return json({ error: 'Payment not found' }, { status: 404 });
		}

		if (payment.status !== 'CONFIRMED') {
			return json({ error: 'Only confirmed payments can be refunded' }, { status: 400 });
		}

		// Update payment status to refunded
		const updatedPayment = await prisma.payment.update({
			where: { id: paymentId },
			data: {
				status: 'REFUNDED',
				refundedAt: new Date(),
				refundedBy: locals.user?.id,
				refundReason: reason.trim()
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
				allocation: {
					include: {
						hostel: {
							select: {
								name: true
							}
						}
					}
				}
			}
		});

		// Update allocation status back to PENDING if payment is refunded
		if (payment.allocation) {
			await prisma.allocation.update({
				where: { id: payment.allocation.id },
				data: {
					status: 'PENDING',
					confirmedAt: null
				}
			});

			// Free up the bed/room space
			await prisma.room.update({
				where: { id: payment.allocation.roomId },
				data: {
					occupiedBeds: {
						decrement: 1
					}
				}
			});
		}

		// Create refund record for tracking
		await prisma.refund.create({
			data: {
				paymentId: paymentId,
				amount: payment.amount,
				reason: reason.trim(),
				status: 'PENDING',
				requestedBy: locals.user?.id,
				requestedAt: new Date()
			}
		});

		// Log the refund action
		await prisma.auditLog.create({
			data: {
				action: 'PAYMENT_REFUNDED',
				entityType: 'Payment',
				entityId: paymentId,
				userId: locals.user?.id,
				details: {
					paymentReference: payment.reference,
					amount: payment.amount,
					studentName: payment.user.name,
					studentMatricNo: payment.user.matricNo,
					reason: reason.trim()
				}
			}
		});

		return json({
			success: true,
			payment: updatedPayment,
			message: 'Payment refunded successfully. Refund will be processed within 5-7 business days.'
		});
	} catch (error) {
		console.error('Error refunding payment:', error);
		return json({ error: 'Failed to refund payment' }, { status: 500 });
	}
};
