import { randomUUID } from 'node:crypto';
import { prisma } from '../../config/database.js';

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function ensureApprovedCreator(userId) {
  const profile = await prisma.creatorProfile.findUnique({
    where: { userId },
    select: { verificationStatus: true }
  });

  if (!profile || profile.verificationStatus !== 'APPROVED') {
    throw createError('Approved creator account required', 403);
  }
}

function createSlug(title) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70);

  return `${base || 'course'}-${randomUUID().slice(0, 8)}`;
}

export async function createCreatorCourse(userId, data) {
  await ensureApprovedCreator(userId);

  const title = typeof data.title === 'string'
    ? data.title.trim()
    : '';

  const description = typeof data.description === 'string'
    ? data.description.trim()
    : null;

  const type = data.type || 'FREE';
  const boardId = data.boardId || null;
  const gradeId = data.gradeId || null;
  const subjectId = data.subjectId || null;

  if (title.length < 3 || title.length > 120) {
    throw createError('Course title must be between 3 and 120 characters', 400);
  }

  if (description && description.length > 5000) {
    throw createError('Description cannot exceed 5000 characters', 400);
  }

  if (!['FREE', 'PREMIUM', 'PAID'].includes(type)) {
    throw createError('Invalid course type', 400);
  }

  if (gradeId && !boardId) {
    throw createError('Board is required when a grade is selected', 400);
  }

  if (subjectId && !gradeId) {
    throw createError('Grade is required when a subject is selected', 400);
  }

  if (boardId) {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { id: true, isActive: true }
    });

    if (!board || !board.isActive) {
      throw createError('Selected board does not exist or is inactive', 400);
    }
  }

  if (gradeId) {
    const grade = await prisma.grade.findUnique({
      where: { id: gradeId },
      select: { id: true, boardId: true }
    });

    if (!grade || grade.boardId !== boardId) {
      throw createError('Selected grade does not belong to the selected board', 400);
    }
  }

  if (subjectId) {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true, gradeId: true }
    });

    if (!subject || subject.gradeId !== gradeId) {
      throw createError('Selected subject does not belong to the selected grade', 400);
    }
  }

  return prisma.course.create({
    data: {
      creatorId: userId,
      title,
      slug: createSlug(title),
      description,
      type,
      status: 'DRAFT',
      boardId,
      gradeId,
      subjectId
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      type: true,
      status: true,
      boardId: true,
      gradeId: true,
      subjectId: true,
      createdAt: true
    }
  });
}

export async function getCreatorCourseById(userId, courseId) {
  await ensureApprovedCreator(userId);

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      creatorId: userId
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      type: true,
      status: true,
      boardId: true,
      gradeId: true,
      subjectId: true,
      createdAt: true,
      updatedAt: true,

      lessons: {
        orderBy: { sequence: 'asc' },
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          sequence: true
        }
      },

      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          decision: true,
          reason: true,
          createdAt: true
        }
      }
    }
  });

  if (!course) {
    throw createError('Course not found', 404);
  }

  const { reviews, ...courseData } = course;

  return {
    ...courseData,
    latestReview: reviews[0] || null
  };
}

export async function updateCreatorCourse(userId, courseId, data) {
  await ensureApprovedCreator(userId);

  const existingCourse = await prisma.course.findFirst({
    where: {
      id: courseId,
      creatorId: userId
    }
  });

  if (!existingCourse) {
    throw createError('Course not found', 404);
  }

  if (!['DRAFT', 'REJECTED'].includes(existingCourse.status)) {
    throw createError(
      'Only draft or rejected courses can be edited',
      409
    );
  }

  const updateData = {};

  if (Object.hasOwn(data, 'title')) {
    if (typeof data.title !== 'string') {
      throw createError('Course title must be text', 400);
    }

    const title = data.title.trim();

    if (title.length < 3 || title.length > 120) {
      throw createError(
        'Course title must be between 3 and 120 characters',
        400
      );
    }

    updateData.title = title;
    updateData.slug = createSlug(title);
  }

  if (Object.hasOwn(data, 'description')) {
    if (
      data.description !== null &&
      typeof data.description !== 'string'
    ) {
      throw createError('Description must be text or null', 400);
    }

    const description = data.description?.trim() || null;

    if (description && description.length > 5000) {
      throw createError(
        'Description cannot exceed 5000 characters',
        400
      );
    }

    updateData.description = description;
  }

  if (Object.hasOwn(data, 'type')) {
    if (!['FREE', 'PREMIUM', 'PAID'].includes(data.type)) {
      throw createError('Invalid course type', 400);
    }

    updateData.type = data.type;
  }

  for (const field of ['boardId', 'gradeId', 'subjectId']) {
    if (Object.hasOwn(data, field)) {
      const value = data[field];

      if (
        value !== null &&
        value !== '' &&
        typeof value !== 'string'
      ) {
        throw createError(`${field} must be a string or null`, 400);
      }

      updateData[field] = value || null;
    }
  }

  const boardId = updateData.boardId !== undefined
    ? updateData.boardId
    : existingCourse.boardId;

  const gradeId = updateData.gradeId !== undefined
    ? updateData.gradeId
    : existingCourse.gradeId;

  const subjectId = updateData.subjectId !== undefined
    ? updateData.subjectId
    : existingCourse.subjectId;

  if (gradeId && !boardId) {
    throw createError('Board is required when a grade is selected', 400);
  }

  if (subjectId && !gradeId) {
    throw createError('Grade is required when a subject is selected', 400);
  }

  if (boardId) {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { id: true, isActive: true }
    });

    if (!board || !board.isActive) {
      throw createError('Selected board does not exist or is inactive', 400);
    }
  }

  if (gradeId) {
    const grade = await prisma.grade.findUnique({
      where: { id: gradeId },
      select: { id: true, boardId: true }
    });

    if (!grade || grade.boardId !== boardId) {
      throw createError(
        'Selected grade does not belong to the selected board',
        400
      );
    }
  }

  if (subjectId) {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true, gradeId: true }
    });

    if (!subject || subject.gradeId !== gradeId) {
      throw createError(
        'Selected subject does not belong to the selected grade',
        400
      );
    }
  }

  return prisma.course.update({
    where: { id: courseId },
    data: updateData,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      type: true,
      status: true,
      boardId: true,
      gradeId: true,
      subjectId: true,
      updatedAt: true
    }
  });
}


export async function submitCreatorCourse(userId, courseId) {
  await ensureApprovedCreator(userId);

  return prisma.$transaction(async (tx) => {
    const course = await tx.course.findFirst({
      where: {
        id: courseId,
        creatorId: userId
      },
      select: {
        id: true,
        title: true,
        status: true,
        lessons: {
          orderBy: { sequence: 'asc' },
          select: {
            id: true,
            title: true,
            type: true,
            videoUrl: true,
            resources: {
              select: {
                id: true,
                fileUrl: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      throw createError('Course not found', 404);
    }

    if (!['DRAFT', 'REJECTED'].includes(course.status)) {
      throw createError(
        'Only draft or rejected courses can be submitted for review',
        409
      );
    }

    if (course.lessons.length === 0) {
      throw createError(
        'Add at least one lesson before submitting the course',
        400
      );
    }
    
    if (process.env.NODE_ENV !== 'development') {
    const missingVideoLessons = course.lessons
      .filter(lesson => lesson.type === 'VIDEO')
      .filter(lesson => {
        if (!lesson.videoUrl) return true;

        try {
          const url = new URL(lesson.videoUrl);
          return !['http:', 'https:'].includes(url.protocol);
        } catch {
          return true;
        }
      });

    if (missingVideoLessons.length > 0) {
      throw createError(
        `Add valid video URLs to these lessons: ${
          missingVideoLessons.map(lesson => lesson.title).join(', ')
        }`,
        400
      );
    }

    const resources = course.lessons.flatMap(
      lesson => lesson.resources
    );

    const hasValidResource = resources.some(resource => {
      try {
        const url = new URL(resource.fileUrl);
        return ['http:', 'https:'].includes(url.protocol);
      } catch {
        return false;
      }
    });

    if (!hasValidResource) {
      throw createError(
        'Add at least one valid study material resource before submitting',
        400
      );
    }
}

    const updated = await tx.course.updateMany({
      where: {
        id: course.id,
        creatorId: userId,
        status: { in: ['DRAFT', 'REJECTED'] }
      },
      data: {
        status: 'PENDING_REVIEW'
      }
    });

    if (updated.count !== 1) {
      throw createError(
        'Course status changed. Refresh and try again.',
        409
      );
    }

    return tx.course.findUnique({
      where: { id: course.id },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true
      }
    });
  });
}
