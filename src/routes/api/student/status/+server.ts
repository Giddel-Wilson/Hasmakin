import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AuthService } from '$lib/server/auth';
import { prisma } from '$lib/server/database';

export const GET: RequestHandler = async ({ cookies }) => {
	console.log('=== STATUS API STARTING ===');
	
	try {
		// Authenticate user
		const accessToken = cookies.get('accessToken');
		if (!accessToken) {
			console.log('No access token found');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const payload = await AuthService.verifyAccessToken(accessToken);
		if (!payload) {
			console.log('Invalid access token');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		console.log('User authenticated:', { userId: payload.userId, role: payload.role });

		// Get user data
		const user = await prisma.user.findUnique({
			where: { id: payload.userId }
		});

		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Get latest application
		const application = await prisma.application.findFirst({
			where: { userId: user.id },
			orderBy: { submittedAt: 'desc' }
		});

		// Get allocation if exists
		const allocation = await prisma.allocation.findFirst({
			where: { userId: user.id },
			include: {
				room: {
					include: {
						hostel: {
							select: {
								name: true,
								location: true
							}
						}
					}
				}
			}
		});

		// Calculate progress
		let progressPercentage = 25; // Account created
		const timeline: any[] = [
			{
				id: 'account_created',
				title: 'Account Created',
				description: 'Your account was successfully created',
				status: 'completed',
				date: user.createdAt.toISOString(),
				icon: 'user'
			}
		];

		let applicationStatus = 'Not Submitted';
		let paymentStatus = 'Not Started';
		let allocationStatus = 'Pending';
		let hostelPreference = 'Not Selected';

		// Update based on application
		if (application) {
			applicationStatus = application.applicationStatus;
			paymentStatus = application.paymentStatus;
			progressPercentage = 50; // Application submitted
			
			if (application.preferences.length > 0) {
				hostelPreference = application.preferences.join(', ');
			}

			timeline.push({
				id: 'application_submitted',
				title: 'Application Submitted',
				description: `Your hostel application has been ${application.applicationStatus.toLowerCase()}`,
				status: application.applicationStatus === 'APPROVED' ? 'completed' : 
				        application.applicationStatus === 'PENDING' ? 'in_progress' : 'failed',
				date: application.submittedAt.toISOString(),
				icon: 'file-text'
			});

			if (application.applicationStatus === 'APPROVED') {
				progressPercentage = 75;
			}
		}

		// Update based on allocation
		if (allocation) {
			allocationStatus = allocation.status;
			progressPercentage = 100; // Fully allocated
			
			timeline.push({
				id: 'room_allocated',
				title: 'Room Allocated',
				description: `You have been allocated to ${allocation.room.hostel.name}, Room ${allocation.room.number}`,
				status: 'completed',
				date: allocation.allocatedAt.toISOString(),
				icon: 'home'
			});
		}

		const responseData = {
			user: {
				name: user.name,
				email: user.email,
				matricNo: user.matricNo
			},
			summary: {
				applicationStatus,
				paymentStatus,
				allocationStatus,
				hostelPreference,
				progressPercentage
			},
			timeline,
			application: application ? {
				id: application.id,
				status: application.applicationStatus,
				level: application.level,
				preferences: application.preferences,
				specialNeeds: application.specialNeeds,
				medicalConditions: application.medicalConditions,
				submittedAt: application.submittedAt,
				updatedAt: application.updatedAt
			} : null,
			allocation: allocation ? {
				id: allocation.id,
				hostelName: allocation.room.hostel.name,
				hostelLocation: allocation.room.hostel.location,
				roomNumber: allocation.room.number,
				status: allocation.status,
				allocatedAt: allocation.allocatedAt
			} : null
		};

		console.log('=== STATUS API RETURNING DATA ===', { 
			hasApplication: !!application, 
			applicationStatus,
			hasAllocation: !!allocation 
		});
		
		return json(responseData);

	} catch (error) {
		console.error('Status API Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
