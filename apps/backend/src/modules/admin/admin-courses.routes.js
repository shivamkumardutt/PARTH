import { Router } from 'express';

import {
  getPendingCourses,
  getCourseReviewDetails,
  approveCourse,
  rejectCourse,
  publishCourse,
  unpublishCourse,
  getCoursePublicationHistory,
  approveLesson,
  rejectLesson
} from './admin-courses.controller.js';

const router = Router();

router.get('/courses', getPendingCourses);
router.get('/courses/:id', getCourseReviewDetails);
router.patch('/courses/:id/approve', approveCourse);
router.patch('/courses/:id/reject', rejectCourse);

// Lesson-level moderation before course approval
router.patch('/lessons/:lessonId/approve', approveLesson);
router.patch('/lessons/:lessonId/reject', rejectLesson);

// Course publishing management
router.patch('/courses/:id/publish', publishCourse);
router.patch('/courses/:id/unpublish', unpublishCourse);
router.get('/courses/:id/publication-history', getCoursePublicationHistory);

export default router;
