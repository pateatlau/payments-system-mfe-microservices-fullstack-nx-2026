/**
 * Admin Routes
 */

import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  listUsers,
  getUserById,
  updateUser,
  updateUserRole,
  updateUserStatus,
} from '../controllers/admin.controller';

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireAdmin);

// User management routes
router.get('/users', listUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);

export default router;
