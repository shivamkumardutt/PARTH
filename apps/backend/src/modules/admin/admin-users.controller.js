import {
  listUsers,
  getUserById,
  getUserStats,
  updateUserStatus
} from './admin-users.service.js';

const VALID_STATUSES = ['ACTIVE', 'PENDING', 'SUSPENDED', 'DELETED'];

export async function getAllUsers(req, res) {
  try {
    const page = Number.parseInt(req.query.page ?? '1', 10);
    const limit = Number.parseInt(req.query.limit ?? '10', 10);
    const search = String(req.query.search ?? '').trim();
    const status = String(req.query.status ?? '').trim().toUpperCase();
    const role = String(req.query.role ?? '').trim().toUpperCase();

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
        message: 'Invalid user status filter'
      });
    }

    if (role && !/^[A-Z_]{2,40}$/.test(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role filter'
      });
    }

    const result = await listUsers({
      page,
      limit,
      search,
      status,
      role
    });

    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: result
    });
  } catch (error) {
    console.error('Admin list users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch users'
    });
  }
}

export async function getSingleUser(req, res) {
  try {
    const user = await getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User details fetched successfully',
      data: user
    });
  } catch (error) {
    console.error('Admin get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch user details'
    });
  }
}

export async function getAdminUserStats(req, res) {
  try {
    const stats = await getUserStats();

    return res.status(200).json({
      success: true,
      message: 'User statistics fetched successfully',
      data: stats
    });
  } catch (error) {
    console.error('Admin user statistics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch user statistics'
    });
  }
}

export async function changeUserStatus(req, res) {
  try {
    const { status } = req.body;

    if (typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const updatedUser = await updateUserStatus(
      req.params.id,
      status.trim().toUpperCase(),
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      data: updatedUser
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;

    if (statusCode === 500) {
      console.error('Admin update user status error:', error);
    }

    return res.status(statusCode).json({
      success: false,
      message: statusCode === 500
        ? 'Unable to update user status'
        : error.message
    });
  }
}
