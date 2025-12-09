/**
 * Admin Routes
 */

import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} from '../controllers/admin.controller';
import { getSystemHealth } from '../controllers/system-health.controller';

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireAdmin);

// System health route
router.get('/health', getSystemHealth);

// User management routes
router.get('/users', listUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.put('/users/:id/role', updateUserRole); // Changed from PATCH to PUT to match frontend
router.patch('/users/:id/role', updateUserRole); // Keep PATCH for backward compatibility
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

export default router;
