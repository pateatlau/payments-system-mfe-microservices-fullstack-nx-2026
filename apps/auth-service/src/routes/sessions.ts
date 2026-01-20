/**
 * Session Routes
 *
 * Session management endpoints for:
 * - Listing active sessions
 * - Viewing session details
 * - Terminating specific sessions
 * - Logging out other sessions
 * - Force logout (admin)
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import * as sessionService from '../services/session.service';

const router = Router();

/**
 * GET /sessions
 * Get all active sessions for the authenticated user
 *
 * @returns SessionListResponse with session details
 */
router.get('/sessions', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new ApiError(401, 'UNAUTHORIZED', 'User ID not found');
    }

    // Get current session ID from JWT claims or request header
    const currentSessionId = req.headers['x-session-id'] as string | undefined;

    const sessionList = await sessionService.getSessionList(userId, currentSessionId);

    res.status(200).json({
      success: true,
      data: sessionList,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /sessions/:sessionId
 * Get details for a specific session
 *
 * @param sessionId - Session ID to retrieve
 * @returns Session details
 */
router.get('/sessions/:sessionId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new ApiError(401, 'UNAUTHORIZED', 'User ID not found');
    }

    const { sessionId } = req.params;
    if (!sessionId) {
      throw new ApiError(400, 'SESSION_ID_REQUIRED', 'Session ID is required');
    }

    const session = await sessionService.getSession(sessionId);

    if (!session) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found');
    }

    // Verify the session belongs to the user
    if (session.userId !== userId) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this session');
    }

    // Return sanitized session info
    res.status(200).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        deviceType: session.fingerprint.deviceType,
        browser: `${session.fingerprint.browser.name} ${session.fingerprint.browser.version}`,
        os: `${session.fingerprint.os.name} ${session.fingerprint.os.version}`,
        lastIp: session.lastIp,
        lastLocation: session.lastLocation.city && session.lastLocation.country
          ? `${session.lastLocation.city}, ${session.lastLocation.country}`
          : session.lastLocation.country || 'Unknown',
        createdAt: session.createdAt,
        lastActivityAt: session.lastActivityAt,
        isActive: session.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /sessions/:sessionId/activity
 * Get activity history for a session
 *
 * @param sessionId - Session ID
 * @query limit - Maximum activities to return (default: 50)
 * @returns Array of session activities
 */
router.get('/sessions/:sessionId/activity', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new ApiError(401, 'UNAUTHORIZED', 'User ID not found');
    }

    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit as string, 10) || 50;

    if (!sessionId) {
      throw new ApiError(400, 'SESSION_ID_REQUIRED', 'Session ID is required');
    }

    // Verify the session belongs to the user
    const session = await sessionService.getSession(sessionId);
    if (!session || session.userId !== userId) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found');
    }

    const activities = await sessionService.getSessionActivity(sessionId, limit);

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /sessions/:sessionId
 * Terminate a specific session
 *
 * @param sessionId - Session ID to terminate
 */
router.delete('/sessions/:sessionId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new ApiError(401, 'UNAUTHORIZED', 'User ID not found');
    }

    const { sessionId } = req.params;
    if (!sessionId) {
      throw new ApiError(400, 'SESSION_ID_REQUIRED', 'Session ID is required');
    }

    // Verify the session belongs to the user
    const session = await sessionService.getSession(sessionId);
    if (!session) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found');
    }

    if (session.userId !== userId) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this session');
    }

    const context = sessionService.createRequestContext(req);
    const success = await sessionService.logout(sessionId, context);

    if (!success) {
      throw new ApiError(500, 'LOGOUT_FAILED', 'Failed to terminate session');
    }

    res.status(200).json({
      success: true,
      message: 'Session terminated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /sessions/logout-others
 * Logout all other sessions except the current one
 *
 * @body currentSessionId - Current session ID to keep
 * @returns Number of sessions logged out
 */
router.post('/sessions/logout-others', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new ApiError(401, 'UNAUTHORIZED', 'User ID not found');
    }

    const { currentSessionId } = req.body;
    if (!currentSessionId) {
      throw new ApiError(400, 'SESSION_ID_REQUIRED', 'Current session ID is required');
    }

    // Verify the current session belongs to the user
    const currentSession = await sessionService.getSession(currentSessionId);
    if (!currentSession || currentSession.userId !== userId) {
      throw new ApiError(400, 'INVALID_SESSION', 'Invalid current session');
    }

    const loggedOutCount = await sessionService.logoutOtherSessions(
      userId,
      currentSessionId
    );

    res.status(200).json({
      success: true,
      data: {
        loggedOutCount,
        message: loggedOutCount > 0
          ? `Successfully logged out ${loggedOutCount} other session(s)`
          : 'No other sessions to logout',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /sessions/logout-all
 * Logout all sessions including current (security action)
 *
 * @returns Number of sessions logged out
 */
router.post('/sessions/logout-all', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new ApiError(401, 'UNAUTHORIZED', 'User ID not found');
    }

    const result = await sessionService.forceLogoutUser(userId, {
      reason: 'User requested logout of all sessions',
      initiatedBy: userId,
      notify: false,
    });

    res.status(200).json({
      success: true,
      data: {
        loggedOutCount: result.terminatedCount,
        message: `Successfully logged out ${result.terminatedCount} session(s)`,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// Admin Endpoints (require ADMIN role)
// ============================================================

/**
 * GET /admin/sessions/:userId
 * Get all sessions for any user (admin only)
 *
 * @param userId - User ID to get sessions for
 */
router.get('/admin/sessions/:userId', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      throw new ApiError(400, 'USER_ID_REQUIRED', 'User ID is required');
    }

    const sessionList = await sessionService.getSessionList(userId);

    res.status(200).json({
      success: true,
      data: sessionList,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /admin/sessions/force-logout
 * Force logout user sessions (admin only)
 *
 * @body userId - User ID to force logout
 * @body sessionIds - Optional specific session IDs to terminate
 * @body reason - Reason for force logout
 */
router.post('/admin/sessions/force-logout', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminUserId = req.userId;
    if (!adminUserId) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Admin user ID not found');
    }

    const { userId, sessionIds, reason } = req.body;

    if (!userId) {
      throw new ApiError(400, 'USER_ID_REQUIRED', 'Target user ID is required');
    }

    if (!reason) {
      throw new ApiError(400, 'REASON_REQUIRED', 'Reason for force logout is required');
    }

    const result = await sessionService.forceLogoutUser(userId, {
      sessionIds,
      reason,
      initiatedBy: `admin:${adminUserId}`,
      notify: true,
    });

    console.log(
      `[Session] Admin ${adminUserId} force logged out user ${userId}: ${result.terminatedCount} sessions`
    );

    res.status(200).json({
      success: true,
      data: {
        userId,
        terminatedCount: result.terminatedCount,
        terminatedSessionIds: result.terminatedSessionIds,
        notified: result.notified,
        message: `Force logged out ${result.terminatedCount} session(s) for user ${userId}`,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /admin/sessions/:userId/:sessionId
 * Terminate a specific session for any user (admin only)
 *
 * @param userId - User ID
 * @param sessionId - Session ID to terminate
 * @body reason - Reason for termination
 */
router.delete('/admin/sessions/:userId/:sessionId', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminUserId = req.userId;
    if (!adminUserId) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Admin user ID not found');
    }

    const { userId, sessionId } = req.params;
    const { reason } = req.body;

    if (!userId || !sessionId) {
      throw new ApiError(400, 'IDS_REQUIRED', 'User ID and Session ID are required');
    }

    // Verify the session belongs to the specified user
    const session = await sessionService.getSession(sessionId);
    if (!session) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found');
    }

    if (session.userId !== userId) {
      throw new ApiError(400, 'SESSION_MISMATCH', 'Session does not belong to specified user');
    }

    const success = await sessionService.terminateSession(
      sessionId,
      reason || 'Terminated by administrator',
      `admin:${adminUserId}`
    );

    if (!success) {
      throw new ApiError(500, 'TERMINATION_FAILED', 'Failed to terminate session');
    }

    console.log(
      `[Session] Admin ${adminUserId} terminated session ${sessionId} for user ${userId}`
    );

    res.status(200).json({
      success: true,
      message: 'Session terminated successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
