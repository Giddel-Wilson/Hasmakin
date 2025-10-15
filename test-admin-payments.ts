import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPayments() {
    try {
        console.log('Testing admin payments query...\n');

        // Test the exact query from the API
        const payments = await prisma.payment.findMany({
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

        console.log('✓ Query successful');
        console.log(`✓ Found ${payments.length} payments`);
        
        if (payments.length > 0) {
            console.log('\nFirst payment:');
            console.log(JSON.stringify(payments[0], null, 2));
        } else {
            console.log('\nNo payments found in database');
            
            // Check if there are any payments at all
            const paymentCount = await prisma.payment.count();
            console.log(`\nTotal payments in database: ${paymentCount}`);
            
            if (paymentCount > 0) {
                const simplePayments = await prisma.payment.findMany({
                    take: 5,
                    select: {
                        id: true,
                        reference: true,
                        amount: true,
                        status: true,
                        userId: true,
                        applicationId: true
                    }
                });
                console.log('\nSimple payment records:');
                console.log(JSON.stringify(simplePayments, null, 2));
            }
        }

    } catch (error) {
        console.error('✗ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testPayments();
