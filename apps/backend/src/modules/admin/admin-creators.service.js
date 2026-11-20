import { prisma } from '../../config/database.js';

export async function listCreators({
  page = 1,
  limit = 10,
  search = '',
  status = ''
}) {
  const where = {};

  if (status) {
    where.verificationStatus = status;
  }

  if (search) {
    where.OR = [
      { displayName: { contains: search, mode: 'insensitive' } },
      { bio: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } }
    ];
  }

  const skip = (page - 1) * limit;

  const [creators, total] = await prisma.$transaction([
    prisma.creatorProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        displayName: true,
        bio: true,
        verificationStatus: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true
          }
        }
      }
    }),
    prisma.creatorProfile.count({ where })
  ]);

  return {
    creators,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getCreatorById(creatorId) {
  return prisma.creatorProfile.findUnique({
    where: { id: creatorId },
    select: {
      id: true,
      displayName: true,
      bio: true,
      verificationStatus: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          createdCourses: {
            select: {
              id: true,
              title: true,
              status: true,
              type: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    }
  });
}

export async function getCreatorStats() {
  const [total, pending, approved, rejected] = await Promise.all([
    prisma.creatorProfile.count(),
    prisma.creatorProfile.count({
      where: { verificationStatus: 'PENDING' }
    }),
    prisma.creatorProfile.count({
      where: { verificationStatus: 'APPROVED' }
    }),
    prisma.creatorProfile.count({
      where: { verificationStatus: 'REJECTED' }
    })
  ]);

  return { total, pending, approved, rejected };
}

export async function reviewCreator(creatorId, decision) {
  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    const error = new Error('Decision must be APPROVED or REJECTED');
    error.statusCode = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    const creator = await tx.creatorProfile.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        userId: true,
        verificationStatus: true
      }
    });

    if (!creator) {
      const error = new Error('Creator application not found');
      error.statusCode = 404;
      throw error;
    }

    if (creator.verificationStatus !== 'PENDING') {
      const error = new Error('Only pending applications can be reviewed');
      error.statusCode = 409;
      throw error;
    }

    let creatorRole = null;

    if (decision === 'APPROVED') {
      creatorRole = await tx.role.findFirst({
        where: { name: 'CREATOR' },
        select: { id: true }
      });

      if (!creatorRole) {
        const error = new Error('CREATOR role is not configured');
        error.statusCode = 500;
        throw error;
      }
    }

    const updated = await tx.creatorProfile.updateMany({
      where: {
        id: creatorId,
        verificationStatus: 'PENDING'
      },
      data: {
        verificationStatus: decision
      }
    });

    if (updated.count !== 1) {
      const error = new Error('Application has already been reviewed');
      error.statusCode = 409;
      throw error;
    }

    if (decision === 'APPROVED') {
      await tx.userRole.upsert({
        where: {
          userId_roleId: {
            userId: creator.userId,
            roleId: creatorRole.id
          }
        },
        update: {},
        create: {
          userId: creator.userId,
          roleId: creatorRole.id
        }
      });
    }

    return tx.creatorProfile.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        displayName: true,
        verificationStatus: true,
        updatedAt: true
      }
    });
  });
}
