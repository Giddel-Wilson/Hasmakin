import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkApplication() {
	try {
		const matricNo = 'U2021/5570004';
		
		// Find user
		const user = await prisma.user.findFirst({
			where: { matricNo }
		});
		
		if (!user) {
			console.log('User not found');
			return;
		}
		
		console.log('User found:', {
			id: user.id,
			name: user.name,
			matricNo: user.matricNo
		});
		
		// Find application
		const application = await prisma.application.findFirst({
			where: { userId: user.id }
		});
		
		if (!application) {
			console.log('\n❌ No application found for this user');
		} else {
			console.log('\n✅ Application found:', {
				id: application.id,
				applicationStatus: application.applicationStatus,
				level: application.level,
				preferences: application.preferences,
				specialNeeds: application.specialNeeds,
				medicalConditions: application.medicalConditions,
				requestedRoommateId: application.requestedRoommateId,
				gender: application.gender,
				paymentStatus: application.paymentStatus,
				submittedAt: application.submittedAt,
				updatedAt: application.updatedAt
			});
		}
		
	} catch (error) {
		console.error('Error:', error);
	} finally {
		await prisma.$disconnect();
	}
}

checkApplication();
