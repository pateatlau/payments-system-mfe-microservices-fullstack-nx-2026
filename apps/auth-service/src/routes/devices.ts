/**
 * Device Routes
 *
 * Device registration and management endpoints
 */

import { Router, type Request, type Response } from 'express';
import { authenticate } from '../middleware/auth';
import * as deviceService from '../services/device.service';
import { ApiError } from '../middleware/errorHandler';

const router = Router();

/**
 * Extend Express Request to include userId from auth middleware
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * POST /devices/register
 * Register or update a device for the authenticated user
 */
router.post(
  '/devices/register',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new ApiError(401, 'UNAUTHORIZED', 'User ID not found');
      }

      const { deviceId, deviceName, deviceType } = req.body;

      if (!deviceId) {
        throw new ApiError(400, 'DEVICE_ID_REQUIRED', 'Device ID is required');
      }

      const device = await deviceService.registerDevice(userId, {
        deviceId,
        deviceName,
        deviceType,
        userAgent: req.headers['user-agent'],
      });

      res.status(200).json({
        success: true,
        data: device,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'INTERNAL_ERROR', 'Failed to register device');
    }
  }
);

/**
 * GET /devices
 * Get all devices for the authenticated user
 */
router.get('/devices', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new ApiError(401, 'UNAUTHORIZED', 'User ID not found');
    }

    const devices = await deviceService.getUserDevices(userId);

    res.status(200).json({
      success: true,
      data: devices,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'INTERNAL_ERROR', 'Failed to get devices');
  }
});

/**
 * DELETE /devices/:deviceId
 * Logout a specific device
 */
router.delete(
  '/devices/:deviceId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new ApiError(401, 'UNAUTHORIZED', 'User ID not found');
      }

      const { deviceId } = req.params;

      if (!deviceId) {
        throw new ApiError(400, 'DEVICE_ID_REQUIRED', 'Device ID is required');
      }

      await deviceService.logoutDevice(userId, deviceId);

      res.status(204).send();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'INTERNAL_ERROR', 'Failed to logout device');
    }
  }
);

/**
 * POST /devices/logout-others
 * Logout all other devices (keep current device)
 */
router.post(
  '/devices/logout-others',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new ApiError(401, 'UNAUTHORIZED', 'User ID not found');
      }

      const { currentDeviceId } = req.body;

      if (!currentDeviceId) {
        throw new ApiError(
          400,
          'DEVICE_ID_REQUIRED',
          'Current device ID is required'
        );
      }

      const count = await deviceService.logoutOtherDevices(
        userId,
        currentDeviceId
      );

      res.status(200).json({
        success: true,
        data: { loggedOutCount: count },
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'Failed to logout other devices'
      );
    }
  }
);

export default router;
