import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../middleware/role.middleware.js';

import {
  getAllCreators,
  getSingleCreator,
  getAdminCreatorStats,
  approveCreator,
  rejectCreator
} from './admin-creators.controller.js';

const router = Router();

// All creator management routes require ADMIN access.
router.use(authenticate, authorizeRoles('ADMIN'));

router.get('/creators/stats', getAdminCreatorStats);
router.get('/creators', getAllCreators);
router.get('/creators/:id', getSingleCreator);
router.patch('/creators/:id/approve', approveCreator);
router.patch('/creators/:id/reject', rejectCreator);

export default router;
