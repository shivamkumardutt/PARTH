import { prisma } from '../../config/database.js';

const allowedStatuses = ['ACTIVE', 'SUSPENDED'];

export async function listUsers({
  page = 1,
  limit = 10,
  search = '',
  status = '',
  role = ''
}) {
  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (status) where.status = status;

  if (role) {
    where.roles = {
      some: {
        role: { name: role }
      }
    };
  }

  const skip = (page - 1) * limit;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        roles: {
          select: {
            role: { select: { name: true } }
          }
        },
        studentProfile: {
          select: {
            grade: { select: { name: true, level: true } },
            board: { select: { name: true, code: true } }
          }
        },
        creatorProfile: {
          select: {
            displayName: true,
            verificationStatus: true
          }
        }
      }
    }),
    prisma.user.count({ where })
  ]);

  return {
    users: users.map(user => ({
      ...user,
      roles: user.roles.map(item => item.role.name)
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getUserById(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      roles: {
        select: {
          role: { select: { name: true } }
        }
      },
      studentProfile: {
        include: {
          grade: true,
          board: true
        }
      },
      creatorProfile: true,
      createdCourses: {
        select: {
          id: true,
          title: true,
          status: true,
          type: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  }).then(user => {
    if (!user) return null;

    return {
      ...user,
      roles: user.roles.map(item => item.role.name)
    };
  });
}

export async function getUserStats() {
  const [total, active, suspended, pending, students, creators, admins] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count({ where: { status: 'PENDING' } }),
      prisma.user.count({
        where: { roles: { some: { role: { name: 'STUDENT' } } } }
      }),
      prisma.user.count({
        where: { roles: { some: { role: { name: 'CREATOR' } } } }
      }),
      prisma.user.count({
        where: { roles: { some: { role: { name: 'ADMIN' } } } }
      })
    ]);

  return { total, active, suspended, pending, students, creators, admins };
}

export async function updateUserStatus(userId, newStatus, adminId) {
  if (!allowedStatuses.includes(newStatus)) {
    const error = new Error('Status must be ACTIVE or SUSPENDED');
    error.statusCode = 400;
    throw error;
  }

  if (userId === adminId) {
    const error = new Error('You cannot change your own account status');
    error.statusCode = 400;
    throw error;
  }

  return prisma.$transaction(async tx => {
    const target = await tx.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } }
      }
    });

    if (!target) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (
      target.roles.some(item => item.role.name === 'ADMIN') &&
      target.status === 'ACTIVE' &&
      newStatus === 'SUSPENDED'
    ) {
      const activeAdminCount = await tx.user.count({
        where: {
          status: 'ACTIVE',
          roles: { some: { role: { name: 'ADMIN' } } }
        }
      });

      if (activeAdminCount <= 1) {
        const error = new Error('Cannot suspend the last active admin');
        error.statusCode = 409;
        throw error;
      }
    }

    return tx.user.update({
      where: { id: userId },
      data: { status: newStatus },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        updatedAt: true
      }
    });
  });
}
