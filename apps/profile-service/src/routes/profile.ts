/**
 * Profile Routes
 */

import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getProfile,
  updateProfile,
  getPreferences,
  updatePreferences,
} from '../controllers/profile.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Profile routes
router.get('/', getProfile);
router.put('/', updateProfile);

// Preferences routes
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

export default router;
