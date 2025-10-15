import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Verify admin authentication using locals (set by hooks)
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		if (locals.user.role !== 'ADMIN') {
			return json({ error: 'Admin access required' }, { status: 403 });
		}

		// Get all system settings from database
		const settings = await prisma.systemSettings.findMany();

		// Group settings by category
		const settingsObject: any = {
			system: {},
			allocation: {},
			payment: {},
			email: {},
			notifications: {}
		};

		settings.forEach((setting: any) => {
			// Determine category based on key prefix or key name
			let category = 'system'; // default category
			
			// Date-related settings always go to system
			if (setting.key.includes('_start_date') || setting.key.includes('_deadline') || setting.key.includes('_date')) {
				category = 'system';
			} else if (setting.key.includes('allocation') || setting.key.includes('priority') || setting.key.includes('weight') || setting.key.includes('Room')) {
				category = 'allocation';
			} else if (setting.key.includes('payment') || setting.key.includes('paystack') || setting.key.includes('flutterwave')) {
				category = 'payment';
			} else if (setting.key.includes('email') || setting.key.includes('smtp') || setting.key.includes('from')) {
				category = 'email';
			} else if (setting.key.includes('notification')) {
				category = 'notifications';
			}
			
			if (settingsObject[category]) {
				// Parse JSON value since we store values as JSON
				try {
					settingsObject[category][setting.key] = JSON.parse(setting.value);
				} catch {
					settingsObject[category][setting.key] = setting.value;
				}
			}
		});

		// Provide defaults if no settings exist
		if (Object.keys(settingsObject.system).length === 0) {
			settingsObject.system = {
				application_start_date: '',
				application_deadline: '',
				payment_start_date: '',
				payment_deadline: '',
				allocation_start_date: '',
				allocation_date: '',
				allowLateApplications: 'false',
				requirePaymentForAllocation: 'true',
				maxApplicationsPerStudent: '1',
				systemMaintenanceMode: 'false',
				registration_open: 'true'
			};
		}

		if (Object.keys(settingsObject.allocation).length === 0) {
			settingsObject.allocation = {
				priorityByLevel: 'true',
				priorityByGPA: 'false',
				priorityByDistance: 'false',
				priorityByDisability: 'true',
				gpaWeight: '30',
				levelWeight: '40',
				distanceWeight: '20',
				disabilityWeight: '10',
				maxRoomOccupancy: '4',
				allowGenderMixing: 'false',
				autoAllocation: 'true'
			};
		}

		if (Object.keys(settingsObject.payment).length === 0) {
			settingsObject.payment = {
				maleHallAFee: '45000',
				maleHallBFee: '50000',
				femaleHallAFee: '48000',
				femaleHallBFee: '52000',
				lateFee: '5000',
				processingFee: '1000',
				enableOnlinePayment: 'true',
				enableBankTransfer: 'true',
				enableUSSD: 'true',
				enableMobileMoney: 'true',
				paystackPublicKey: '',
				paystackSecretKey: '',
				flutterwavePublicKey: '',
				flutterwaveSecretKey: ''
			};
		}

		if (Object.keys(settingsObject.email).length === 0) {
			settingsObject.email = {
				smtpHost: 'smtp.gmail.com',
				smtpPort: '587',
				smtpUsername: '',
				smtpPassword: '',
				fromEmail: 'noreply@uniport.edu.ng',
				fromName: 'UNIPORT Hostel System',
				enableEmailNotifications: 'true'
			};
		}

		if (Object.keys(settingsObject.notifications).length === 0) {
			settingsObject.notifications = {
				applicationReceived: 'true',
				applicationApproved: 'true',
				applicationRejected: 'true',
				allocationAssigned: 'true',
				paymentReceived: 'true',
				paymentConfirmed: 'true',
				deadlineReminders: 'true',
				systemMaintenance: 'true'
			};
		}

		return json(settingsObject);
	} catch (error) {
		console.error('Error fetching settings:', error);
		return json({ error: 'Failed to fetch settings' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Verify admin authentication using locals (set by hooks)
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		if (locals.user.role !== 'ADMIN') {
			return json({ error: 'Admin access required' }, { status: 403 });
		}

		const updatedSettings = await request.json();

		// Update settings in database
		const updatePromises = [];

		for (const [category, settings] of Object.entries(updatedSettings)) {
			for (const [key, value] of Object.entries(settings as any)) {
				updatePromises.push(
					prisma.systemSettings.upsert({
						where: {
							key: key
						},
						update: {
							value: JSON.stringify(value)
						},
						create: {
							key: key,
							value: JSON.stringify(value)
						}
					})
				);
			}
		}

		await Promise.all(updatePromises);

		return json({ success: true });
	} catch (error) {
		console.error('Error updating settings:', error);
		return json({ error: 'Failed to update settings' }, { status: 500 });
	}
};
