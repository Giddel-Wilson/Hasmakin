import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	try {
		const { id } = params;
		const { reason } = await request.json();

		if (!reason || reason.trim().length === 0) {
			return json({ error: 'Rejection reason is required' }, { status: 400 });
		}

		// Get the payment
		const payment = await prisma.payment.findUnique({
			where: { id },
			include: {
				user: true,
				application: true
			}
		});

		if (!payment) {
			return json({ error: 'Payment not found' }, { status: 404 });
		}

		// Only pending payments can be rejected
		if (payment.status !== 'PENDING') {
			return json(
				{ error: `Cannot reject a ${payment.status.toLowerCase()} payment` },
				{ status: 400 }
			);
		}

		// Update payment status to FAILED with rejection reason
		const updatedPayment = await prisma.payment.update({
			where: { id },
			data: {
				status: 'FAILED',
				failureReason: reason,
				gatewayResponse: JSON.stringify({
					rejected: true,
					rejectedBy: 'admin',
					rejectedAt: new Date().toISOString(),
					reason: reason
				})
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
					select: {
						id: true,
						level: true,
						gender: true,
						applicationStatus: true
					}
				}
			}
		});

		// Log the rejection for debugging
		console.log('[Payment Rejection]', {
			paymentId: payment.id,
			reference: payment.reference,
			rejectedBy: locals.user?.id || 'system',
			student: `${payment.user.name} (${payment.user.matricNo})`,
			reason: reason,
			timestamp: new Date().toISOString()
		});

		return json({
			success: true,
			payment: updatedPayment,
			message: 'Payment rejected successfully'
		});
	} catch (error) {
		console.error('Error rejecting payment:', error);
		return json({ error: 'Failed to reject payment' }, { status: 500 });
	}
};
