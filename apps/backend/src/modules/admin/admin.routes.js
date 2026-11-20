import { Router } from 'express';
import creatorRoutes from './admin-creators.routes.js';
import adminCourseRoutes from './admin-courses.routes.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../middleware/role.middleware.js';

import {
  getAllUsers,
  getSingleUser,
  getAdminUserStats,
  changeUserStatus
} from './admin-users.controller.js';

const router = Router();

// All routes require an authenticated ADMIN.
router.use(authenticate, authorizeRoles('ADMIN'));

// User statistics
router.get('/users/stats', getAdminUserStats);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getSingleUser);
router.patch('/users/:id/status', changeUserStatus);

router.use(adminCourseRoutes);
router.use(creatorRoutes);

export default router;

