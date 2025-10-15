// Admin Application Status Update API
// University of Port Harcourt - Hostel Allocation System
// Handles updating application status (approve/reject/pending)

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/database';
import { AuthService } from '$lib/server/auth';

/**
 * PATCH /api/admin/applications/[id]/status
 * Update an application's status
 */
export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
  try {
    // Authenticate admin user
    const accessToken = cookies.get('accessToken');
    
    if (!accessToken) {
      console.error('[Admin Status Update] No access token found');
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    let userId: string;
    let userRole: string;

    // Check for simple admin token (fallback mode)
    if (accessToken.startsWith('admin-')) {
      console.log('[Admin Status Update] Using simple admin token');
      userId = 'admin';
      userRole = 'ADMIN';
    } else {
      // Verify JWT token using AuthService
      try {
        const decoded = AuthService.verifyAccessToken(accessToken);
        
        if (!decoded) {
          console.error('[Admin Status Update] Token verification returned null');
          return json({ error: 'Invalid token' }, { status: 401 });
        }
        
        userId = decoded.userId;
        userRole = decoded.role;
        
        console.log('[Admin Status Update] JWT verified:', {
          userId,
          role: userRole
        });
        
        if (userRole !== 'ADMIN') {
          console.error('[Admin Status Update] User is not admin:', {
            userId,
            role: userRole
          });
          return json({ error: 'Admin access required' }, { status: 403 });
        }
      } catch (err) {
        console.error('[Admin Status Update] Token verification failed:', err);
        return json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    const applicationId = params.id;
    const { status } = await request.json();

    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return json({ error: 'Invalid status value' }, { status: 400 });
    }

    // Check if application exists
    const existingApp = await prisma.application.findUnique({
      where: { id: applicationId }
    });

    if (!existingApp) {
      return json({ error: 'Application not found' }, { status: 404 });
    }

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        applicationStatus: status,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            matricNo: true,
            email: true
          }
        }
      }
    });

    // Create audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: userId,
          action: `APPLICATION_${status}`,
          details: {
            applicationId,
            studentId: updatedApplication.userId,
            studentName: updatedApplication.user.name,
            previousStatus: existingApp.applicationStatus,
            newStatus: status,
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (auditError) {
      console.error('[Admin Status Update] Failed to create audit log:', auditError);
    }

    console.log('[Admin Status Update] Application status updated:', {
      applicationId,
      previousStatus: existingApp.applicationStatus,
      newStatus: status,
      updatedBy: userId
    });

    return json({
      success: true,
      application: {
        id: updatedApplication.id,
        applicationStatus: updatedApplication.applicationStatus,
        updatedAt: updatedApplication.updatedAt
      }
    });

  } catch (error) {
    console.error('[Admin Status Update] Error:', error);
    return json(
      { error: 'Failed to update application status' },
      { status: 500 }
    );
  }
};
