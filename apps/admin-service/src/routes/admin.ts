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
import { listAuditLogs } from '../controllers/audit-logs.controller';
import { getAvailableActions } from '../services/audit-logs.service';

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireAdmin);

// System health route
router.get('/health', getSystemHealth);

// Audit logs routes
router.get('/audit-logs', listAuditLogs);
router.get('/audit-logs/actions', async (_req, res) => {
  try {
    const actions = await getAvailableActions();
    res.json({ success: true, data: actions });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve available actions',
    });
  }
});

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
