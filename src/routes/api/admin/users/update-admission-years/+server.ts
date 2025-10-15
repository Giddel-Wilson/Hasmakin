import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';
import { extractAdmissionYearFromMatricNo } from '$lib/academic-levels';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export const POST: RequestHandler = async ({ cookies }) => {
  try {
    // Verify admin authentication
    const token = cookies.get('accessToken');
    if (!token) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      if (payload.role !== 'ADMIN') {
        return json({ error: 'Admin access required' }, { status: 403 });
      }
    } catch (error) {
      // Check if it's a simple admin token
      if (!token.startsWith('admin-')) {
        return json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    // Get all users without admission year
    const users = await prisma.user.findMany({
      where: {
        admissionYear: null,
        role: 'STUDENT'
      },
      select: {
        id: true,
        matricNo: true,
        name: true
      }
    });

    let updated = 0;
    let errors = [];

    // Update each user's admission year based on their matric number
    for (const user of users) {
      try {
        const admissionYear = extractAdmissionYearFromMatricNo(user.matricNo);
        
        if (admissionYear) {
          await prisma.user.update({
            where: { id: user.id },
            data: { admissionYear }
          });
          updated++;
        } else {
          errors.push(`Could not extract admission year from matric number: ${user.matricNo}`);
        }
      } catch (error) {
        errors.push(`Error updating user ${user.name} (${user.matricNo}): ${error}`);
      }
    }

    return json({
      success: true,
      message: `Updated ${updated} users with admission years`,
      totalUsers: users.length,
      updated,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error updating admission years:', error);
    return json({ error: 'Failed to update admission years' }, { status: 500 });
  }
};
