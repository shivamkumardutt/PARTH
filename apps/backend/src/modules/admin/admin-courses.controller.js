import {
  listCourses,
  getCourseForReview,
  reviewCourse,
  publishCourse as publishCourseService,
  unpublishCourse as unpublishCourseService,
  getCoursePublicationHistory as getCoursePublicationHistoryService
} from './admin-courses.service.js';

function handleError(res, error, label) {
  const statusCode = error.statusCode || 500;

  if (statusCode === 500) {
    console.error(`${label}:`, error);
  }

  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500
      ? 'Unable to process course review request'
      : error.message
  });
}

export async function getPendingCourses(req, res) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = typeof req.query.search === 'string'
      ? req.query.search.trim()
      : '';

    if (
      !Number.isInteger(page) || page < 1 ||
      !Number.isInteger(limit) || limit < 1 || limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters'
      });
    }

    const result = await listCourses({ page, limit, search });

    return res.status(200).json({
      success: true,
      message: 'Pending courses fetched successfully',
      data: result
    });
  } catch (error) {
    return handleError(res, error, 'List pending courses error');
  }
}

export async function getCourseReviewDetails(req, res) {
  try {
    const course = await getCourseForReview(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Course review details fetched successfully',
      data: course
    });
  } catch (error) {
    return handleError(res, error, 'Get course review details error');
  }
}

export async function approveCourse(req, res) {
  try {
    const result = await reviewCourse(
      req.params.id,
      req.user.id,
      'APPROVED'
    );

    return res.status(200).json({
      success: true,
      message: 'Course approved successfully',
      data: result
    });
  } catch (error) {
    return handleError(res, error, 'Approve course error');
  }
}

export async function rejectCourse(req, res) {
  try {
    const reason = typeof req.body.reason === 'string'
      ? req.body.reason.trim()
      : '';

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    if (reason.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason cannot exceed 2000 characters'
      });
    }

    const result = await reviewCourse(
      req.params.id,
      req.user.id,
      'REJECTED',
      reason
    );

    return res.status(200).json({
      success: true,
      message: 'Course rejected successfully',
      data: result
    });
  } catch (error) {
    return handleError(res, error, 'Reject course error');
  }
}

export async function publishCourse(req, res) {
  try {
    const result = await publishCourseService(
      req.params.id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: 'Course published successfully',
      data: result
    });
  } catch (error) {
    return handleError(res, error, 'Publish course error');
  }
}

export async function unpublishCourse(req, res) {
  try {
    const result = await unpublishCourseService(
      req.params.id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: 'Course unpublished successfully',
      data: result
    });
  } catch (error) {
    return handleError(res, error, 'Unpublish course error');
  }
}

export async function getCoursePublicationHistory(req, res) {
  try {
    const result = await getCoursePublicationHistoryService(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: 'Course publication history fetched successfully',
      data: result
    });
  } catch (error) {
    return handleError(
      res,
      error,
      'Get course publication history error'
    );
  }
}