
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ['HS256'] }
    );

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive account',
      });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles.map((item) => item.role.name),
    };

    next();
  } catch (error) {
    if (
      error.name === 'TokenExpiredError' ||
      error.name === 'JsonWebTokenError'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    console.error('Authentication error:', error);

    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
}
