import {
  getCreatorDashboard,
  getCreatorCourses
} from './creator-studio.service.js';

function sendError(res, error, label) {
  const statusCode = error.statusCode || 500;

  if (statusCode === 500) {
    console.error(`${label}:`, error);
  }

  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500
      ? 'Unable to process creator studio request'
      : error.message
  });
}

export async function creatorDashboard(req, res) {
  try {
    const dashboard = await getCreatorDashboard(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Creator dashboard fetched successfully',
      data: dashboard
    });
  } catch (error) {
    return sendError(res, error, 'Creator dashboard error');
  }
}

export async function listCreatorCourses(req, res) {
  try {
    const page = Number.parseInt(req.query.page ?? '1', 10);
    const limit = Number.parseInt(req.query.limit ?? '10', 10);

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 50
    ) {
      return res.status(400).json({
        success: false,
        message: 'Page must be positive and limit must be between 1 and 50'
      });
    }

    const result = await getCreatorCourses(
      req.user.id,
      page,
      limit
    );

    return res.status(200).json({
      success: true,
      message: 'Creator courses fetched successfully',
      data: result
    });
  } catch (error) {
    return sendError(res, error, 'Creator courses error');
  }
}
