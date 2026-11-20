import { Router } from 'express';

import {
  getPendingCourses,
  getCourseReviewDetails,
  approveCourse,
  rejectCourse,
  publishCourse,
  unpublishCourse,
  getCoursePublicationHistory
} from './admin-courses.controller.js';

const router = Router();

router.get('/courses', getPendingCourses);
router.get('/courses/:id', getCourseReviewDetails);
router.patch('/courses/:id/approve', approveCourse);
router.patch('/courses/:id/reject', rejectCourse);

// Course publishing management
router.patch('/courses/:id/publish', publishCourse);
router.patch('/courses/:id/unpublish', unpublishCourse);
router.get('/courses/:id/publication-history', getCoursePublicationHistory);

export default router;
