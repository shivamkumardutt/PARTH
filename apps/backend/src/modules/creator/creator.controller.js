import {
  applyAsCreator,
  getMyCreatorApplication
} from './creator.service.js';

export async function submitCreatorApplication(req, res) {
  try {
    const application = await applyAsCreator(req.user.id, req.body);

    return res.status(201).json({
      success: true,
      message: 'Creator application submitted successfully',
      data: application
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;

    if (statusCode === 500) {
      console.error('Creator application error:', error);
    }

    return res.status(statusCode).json({
      success: false,
      message: statusCode === 500
        ? 'Unable to submit creator application'
        : error.message
    });
  }
}

export async function getMyApplication(req, res) {
  try {
    const application = await getMyCreatorApplication(req.user.id);

    return res.status(200).json({
      success: true,
      message: application
        ? 'Creator application fetched successfully'
        : 'No creator application found',
      data: application
    });
  } catch (error) {
    console.error('Get creator application error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch creator application'
    });
  }
}
