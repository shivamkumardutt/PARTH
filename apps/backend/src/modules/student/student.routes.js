
import { Router } from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../middleware/role.middleware.js';

import {
  listPublishedCourses,
  getPublishedCourse,
  getProfile,
  saveProfile,
  listStudentOptions,
  listPathways,
  addPathway,
  editPathway,
  removePathway
} from './student.controller.js';

const router = Router();

// All student routes require authentication and STUDENT role.
router.use(authenticate);
router.use(authorizeRoles('STUDENT'));

// Student profile
router.get('/profile', getProfile);
router.put('/profile', saveProfile);

// Education board and grade options
router.get('/options', listStudentOptions);


// Published courses
router.get('/courses', listPublishedCourses);
router.get('/courses/:id', getPublishedCourse);

// Student pathways
router.get('/pathways', listPathways);
router.post('/pathways', addPathway);
router.put('/pathways/:id', editPathway);
router.delete('/pathways/:id', removePathway);

export default router;


