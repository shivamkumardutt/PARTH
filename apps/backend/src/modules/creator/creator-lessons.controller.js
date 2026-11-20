import {
  createCreatorLesson,
  getCreatorLessons,
  updateCreatorLesson,
  reorderCreatorLessons
} from './creator-lessons.service.js';

function handleError(res, error, label) {
  const statusCode = error.statusCode || 500;

  if (statusCode === 500) {
    console.error(`${label}:`, error);
  }

  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500
      ? 'Unable to process lesson request'
      : error.message
  });
}

export async function createLesson(req, res) {
  try {
    const lesson = await createCreatorLesson(
      req.user.id,
      req.params.id,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: lesson
    });
  } catch (error) {
    return handleError(res, error, 'Create lesson error');
  }
}

export async function listLessons(req, res) {
  try {
    const lessons = await getCreatorLessons(
      req.user.id,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: 'Lessons fetched successfully',
      data: lessons
    });
  } catch (error) {
    return handleError(res, error, 'List lessons error');
  }
}

export async function updateLesson(req, res) {
  try {
    const lesson = await updateCreatorLesson(
      req.user.id,
      req.params.lessonId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: 'Lesson updated successfully',
      data: lesson
    });
  } catch (error) {
    return handleError(res, error, 'Update lesson error');
  }
}

export async function reorderLessons(req, res) {
  try {
    const lessons = await reorderCreatorLessons(
      req.user.id,
      req.params.id,
      req.body.lessonIds
    );

    return res.status(200).json({
      success: true,
      message: 'Lessons reordered successfully',
      data: lessons
    });
  } catch (error) {
    return handleError(res, error, 'Reorder lessons error');
  }
}
