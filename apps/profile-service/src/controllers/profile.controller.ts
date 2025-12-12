/**
 * Profile Controllers
 */

import type { Request, Response, NextFunction } from 'express';
import { profileService } from '../services/profile.service';
import {
  updateProfileSchema,
  updatePreferencesSchema,
} from '../validators/profile.validators';
import logger from '../utils/logger';

/**
 * Get current user's profile
 */
export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
      return;
    }

    const profile = await profileService.getOrCreateProfile(userId);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error('Error getting profile', { error });
    next(error);
  }
}

/**
 * Update current user's profile
 */
export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
      return;
    }

    // Validate request body
    const validatedData = updateProfileSchema.parse(req.body);

    const profile = await profileService.updateProfile(userId, validatedData);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error('Error updating profile', { error });
    next(error);
  }
}

/**
 * Get current user's preferences
 */
export async function getPreferences(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
      return;
    }

    const preferences = await profileService.getPreferences(userId);

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    logger.error('Error getting preferences', { error });
    next(error);
  }
}

/**
 * Update current user's preferences
 */
export async function updatePreferences(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
      return;
    }

    // Validate request body
    const validatedData = updatePreferencesSchema.parse(req.body);

    const preferences = await profileService.updatePreferences(
      userId,
      validatedData
    );

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    logger.error('Error updating preferences', { error });
    next(error);
  }
}
