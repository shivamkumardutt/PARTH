import {
  listCreators,
  getCreatorById,
  getCreatorStats,
  reviewCreator
} from './admin-creators.service.js';

const VALID_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

export async function getAllCreators(req, res) {
  try {
    const page = Number.parseInt(req.query.page ?? '1', 10);
    const limit = Number.parseInt(req.query.limit ?? '10', 10);
    const search = String(req.query.search ?? '').trim();
    const status = String(req.query.status ?? '').trim().toUpperCase();

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page must be a positive integer'
      });
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100'
      });
    }

    if (search.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Search cannot exceed 100 characters'
      });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid creator verification status'
      });
    }

    const result = await listCreators({
      page,
      limit,
      search,
      status
    });

    return res.status(200).json({
      success: true,
      message: 'Creators fetched successfully',
      data: result
    });
  } catch (error) {
    console.error('Admin list creators error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch creators'
    });
  }
}

export async function getSingleCreator(req, res) {
  try {
    const creator = await getCreatorById(req.params.id);

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator application not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Creator details fetched successfully',
      data: creator
    });
  } catch (error) {
    console.error('Admin get creator error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch creator details'
    });
  }
}

export async function getAdminCreatorStats(req, res) {
  try {
    const stats = await getCreatorStats();

    return res.status(200).json({
      success: true,
      message: 'Creator statistics fetched successfully',
      data: stats
    });
  } catch (error) {
    console.error('Admin creator statistics error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch creator statistics'
    });
  }
}

export async function approveCreator(req, res) {
  try {
    const creator = await reviewCreator(req.params.id, 'APPROVED');

    return res.status(200).json({
      success: true,
      message: 'Creator approved successfully',
      data: creator
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;

    if (statusCode === 500) {
      console.error('Admin approve creator error:', error);
    }

    return res.status(statusCode).json({
      success: false,
      message: statusCode === 500
        ? 'Unable to approve creator'
        : error.message
    });
  }
}

export async function rejectCreator(req, res) {
  try {
    const creator = await reviewCreator(req.params.id, 'REJECTED');

    return res.status(200).json({
      success: true,
      message: 'Creator rejected successfully',
      data: creator
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;

    if (statusCode === 500) {
      console.error('Admin reject creator error:', error);
    }

    return res.status(statusCode).json({
      success: false,
      message: statusCode === 500
        ? 'Unable to reject creator'
        : error.message
    });
  }
}
