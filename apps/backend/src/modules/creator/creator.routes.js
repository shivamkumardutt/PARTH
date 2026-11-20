import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../middleware/role.middleware.js';

import {
  submitCreatorApplication,
  getMyApplication
} from './creator.controller.js';

import {
  creatorDashboard,
  listCreatorCourses
} from './creator-studio.controller.js';

import {
  createCourse,
  getCourse,
  updateCourse,
  submitCourse
} from './creator-courses.controller.js';

import {
  createLesson,
  listLessons,
  updateLesson,
  reorderLessons
} from './creator-lessons.controller.js';

import {
  createResource,
  listResources,
  updateResource,
  deleteResource
} from './creator-resources.controller.js';

const router = Router();

router.use(authenticate);

// Creator application
router.post('/apply', submitCreatorApplication);
router.get('/me', getMyApplication);

// Approved creator studio
router.use(authorizeRoles('CREATOR'));

router.get('/dashboard', creatorDashboard);

// Course management
router.get('/courses', listCreatorCourses);
router.post('/courses', createCourse);
router.get('/courses/:id', getCourse);
router.patch('/courses/:id', updateCourse);
router.post('/courses/:id/submit', submitCourse);

// Lesson management
router.post('/courses/:id/lessons', createLesson);
router.get('/courses/:id/lessons', listLessons);
router.patch('/courses/:id/lessons/reorder', reorderLessons);
router.patch('/lessons/:lessonId', updateLesson);

// Resource management
router.post('/lessons/:lessonId/resources', createResource);
router.get('/lessons/:lessonId/resources', listResources);
router.patch('/resources/:resourceId', updateResource);
router.delete('/resources/:resourceId', deleteResource);

export default router;
