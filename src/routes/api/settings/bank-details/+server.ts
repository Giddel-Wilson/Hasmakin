import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
  try {
    return json({
      bankName: env.BANK_NAME || 'OPay',
      accountNumber: env.ACCOUNT_NUMBER || '',
      accountName: env.ACCOUNT_NAME || 'UNIPORT Hostel Allocation',
      bankCode: env.BANK_CODE || '999992'
    });
  } catch (error) {
    console.error('Error fetching bank details:', error);
    return json({ error: 'Failed to fetch bank details' }, { status: 500 });
  }
};
