
import { Router } from 'express';

import {
  register,
  login,
  getMe,
} from './auth.controller.js';

import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected route
router.get('/me', authenticate, getMe);

export default router;
