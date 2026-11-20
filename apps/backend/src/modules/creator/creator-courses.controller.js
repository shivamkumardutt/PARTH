import {
  createCreatorCourse,
  getCreatorCourseById,
  updateCreatorCourse,
  submitCreatorCourse
} from './creator-courses.service.js';

function handleError(res, error, label) {
  const statusCode = error.statusCode || 500;

  if (statusCode === 500) {
    console.error(`${label}:`, error);
  }

  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500
      ? 'Unable to process course request'
      : error.message
  });
}

export async function createCourse(req, res) {
  try {
    const course = await createCreatorCourse(req.user.id, req.body);

    return res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    return handleError(res, error, 'Create course error');
  }
}

export async function getCourse(req, res) {
  try {
    const course = await getCreatorCourseById(
      req.user.id,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: 'Course details fetched successfully',
      data: course
    });
  } catch (error) {
    return handleError(res, error, 'Get course error');
  }
}

export async function updateCourse(req, res) {
  try {
    const course = await updateCreatorCourse(
      req.user.id,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    return handleError(res, error, 'Update course error');
  }
}

export async function submitCourse(req, res) {
  try {
    const course = await submitCreatorCourse(
      req.user.id,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: 'Course submitted for admin review successfully',
      data: course
    });
  } catch (error) {
    return handleError(res, error, 'Submit course error');
  }
}
