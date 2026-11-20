import { Router } from 'express';

import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

// Student-only dashboard
router.get(
  '/student',
  authenticate,
  authorizeRoles('STUDENT'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Welcome to Student Dashboard',
      user: req.user,
    });
  }
);

// Admin-only dashboard
router.get(
  '/admin',
  authenticate,
  authorizeRoles('ADMIN'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Welcome to Admin Dashboard',
      user: req.user,
    });
  }
);

export default router;
