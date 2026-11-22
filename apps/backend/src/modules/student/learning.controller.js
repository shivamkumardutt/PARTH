import {
  enrollStudentInCourse,
  getStudentLearning,
  getStudentLearningCourse,
  setLessonCompletion,
} from './learning.service.js';

function sendError(res, error, fallbackMessage) {
  console.error(fallbackMessage, error);
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : fallbackMessage,
  });
}

export async function enrollInCourse(req, res) {
  try {
    const enrollment = await enrollStudentInCourse(req.user.id, req.params.id);
    return res.status(201).json({
      success: true,
      message: 'Course enrollment successful',
      data: { enrollment },
    });
  } catch (error) {
    return sendError(res, error, 'Unable to enroll in course');
  }
}

export async function listMyLearning(req, res) {
  try {
    const enrollments = await getStudentLearning(req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Your learning courses fetched successfully',
      data: { enrollments },
    });
  } catch (error) {
    return sendError(res, error, 'Unable to fetch your learning courses');
  }
}

export async function getMyLearningCourse(req, res) {
  try {
    const learning = await getStudentLearningCourse(
      req.user.id,
      req.params.enrollmentId
    );
    return res.status(200).json({
      success: true,
      message: 'Learning course fetched successfully',
      data: learning,
    });
  } catch (error) {
    return sendError(res, error, 'Unable to fetch learning course');
  }
}

export async function updateLessonProgress(req, res) {
  try {
    const result = await setLessonCompletion(
      req.user.id,
      req.params.enrollmentId,
      req.params.lessonId,
      req.body?.completed
    );
    return res.status(200).json({
      success: true,
      message: 'Lesson progress updated successfully',
      data: result,
    });
  } catch (error) {
    return sendError(res, error, 'Unable to update lesson progress');
  }
}
