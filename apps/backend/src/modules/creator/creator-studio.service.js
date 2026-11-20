import { prisma } from '../../config/database.js';

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function ensureApprovedCreator(userId) {
  const profile = await prisma.creatorProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      displayName: true,
      verificationStatus: true
    }
  });

  if (!profile) {
    throw createError('Creator profile not found', 404);
  }

  if (profile.verificationStatus !== 'APPROVED') {
    throw createError('Your creator account is not approved', 403);
  }

  return profile;
}

export async function getCreatorDashboard(userId) {
  const profile = await ensureApprovedCreator(userId);

  const [
    totalCourses,
    draftCourses,
    pendingCourses,
    approvedCourses,
    rejectedCourses,
    totalLessons
  ] = await Promise.all([
    prisma.course.count({ where: { creatorId: userId } }),
    prisma.course.count({ where: { creatorId: userId, status: 'DRAFT' } }),
    prisma.course.count({ where: { creatorId: userId, status: 'PENDING_REVIEW' } }),
    prisma.course.count({ where: { creatorId: userId, status: 'APPROVED' } }),
    prisma.course.count({ where: { creatorId: userId, status: 'REJECTED' } }),
    prisma.lesson.count({
      where: { course: { creatorId: userId } }
    })
  ]);

  return {
    profile,
    statistics: {
      totalCourses,
      draftCourses,
      pendingCourses,
      approvedCourses,
      rejectedCourses,
      totalLessons
    }
  };
}

export async function getCreatorCourses(userId, page = 1, limit = 10) {
  await ensureApprovedCreator(userId);

  const skip = (page - 1) * limit;

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where: { creatorId: userId },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        type: true,
        status: true,
        isPublished: true,
        publishedAt: true,
        boardId: true,
        gradeId: true,
        subjectId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { lessons: true }
        }
      }
    }),
    prisma.course.count({
      where: { creatorId: userId }
    })
  ]);

  return {
    courses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
