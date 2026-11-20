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

async function getOwnedEditableCourse(userId, courseId) {
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      creatorId: userId
    },
    select: {
      id: true,
      status: true
    }
  });

  if (!course) {
    throw createError('Course not found', 404);
  }

  if (!['DRAFT', 'REJECTED'].includes(course.status)) {
    throw createError(
      'Lessons can only be changed in draft or rejected courses',
      400
    );
  }

  return course;
}

export async function createCreatorLesson(userId, courseId, data) {
  await ensureApprovedCreator(userId);

  const course = await getOwnedEditableCourse(userId, courseId);

  const title = typeof data.title === 'string'
    ? data.title.trim()
    : '';

  if (title.length < 3 || title.length > 150) {
    throw createError('Lesson title must be between 3 and 150 characters', 400);
  }

  const allowedTypes = [
    'VIDEO',
    'ARTICLE',
    'PDF',
    'INTERACTIVE',
    'LIVE'
  ];

  const type = data.type || 'VIDEO';

  if (!allowedTypes.includes(type)) {
    throw createError('Invalid lesson type', 400);
  }

  const sequence = Number(data.sequence);

  if (!Number.isInteger(sequence) || sequence < 1) {
    throw createError('Lesson sequence must be a positive integer', 400);
  }

  const description = data.description ?? null;

  if (
    description !== null &&
    (typeof description !== 'string' || description.length > 5000)
  ) {
    throw createError('Lesson description cannot exceed 5000 characters', 400);
  }

  const videoUrl = data.videoUrl ?? null;

  if (videoUrl !== null) {
    if (typeof videoUrl !== 'string') {
      throw createError('Invalid video URL', 400);
    }

    try {
      const parsedUrl = new URL(videoUrl);

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      throw createError('Please provide a valid HTTP or HTTPS video URL', 400);
    }
  }

  const durationSec = data.durationSec ?? null;

  if (
    durationSec !== null &&
    (!Number.isInteger(Number(durationSec)) || Number(durationSec) < 1)
  ) {
    throw createError('Duration must be a positive integer in seconds', 400);
  }

  try {
    return await prisma.lesson.create({
      data: {
        courseId: course.id,
        title,
        description,
        type,
        sequence,
        videoUrl,
        durationSec: durationSec === null ? null : Number(durationSec)
      }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      throw createError('This lesson sequence is already in use', 409);
    }

    throw error;
  }
}

export async function getCreatorLessons(userId, courseId) {
  await ensureApprovedCreator(userId);

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      creatorId: userId
    },
    select: { id: true }
  });

  if (!course) {
    throw createError('Course not found', 404);
  }

  return prisma.lesson.findMany({
    where: { courseId: course.id },
    orderBy: { sequence: 'asc' },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      status: true,
      sequence: true,
      videoUrl: true,
      durationSec: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

export async function updateCreatorLesson(userId, lessonId, data) {
  await ensureApprovedCreator(userId);

  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      course: {
        creatorId: userId
      }
    },
    include: {
      course: {
        select: {
          id: true,
          status: true
        }
      }
    }
  });

  if (!lesson) {
    throw createError('Lesson not found', 404);
  }

  if (!['DRAFT', 'REJECTED'].includes(lesson.course.status)) {
    throw createError('Lessons can only be edited in draft or rejected courses', 400);
  }

  const updateData = {};

  if (Object.hasOwn(data, 'title')) {
    if (typeof data.title !== 'string') {
      throw createError('Invalid lesson title', 400);
    }

    const title = data.title.trim();

    if (title.length < 3 || title.length > 150) {
      throw createError('Lesson title must be between 3 and 150 characters', 400);
    }

    updateData.title = title;
  }

  if (Object.hasOwn(data, 'description')) {
    if (
      data.description !== null &&
      (typeof data.description !== 'string' || data.description.length > 5000)
    ) {
      throw createError('Invalid lesson description', 400);
    }

    updateData.description = data.description;
  }

  if (Object.hasOwn(data, 'type')) {
    const allowedTypes = ['VIDEO', 'ARTICLE', 'PDF', 'INTERACTIVE', 'LIVE'];

    if (!allowedTypes.includes(data.type)) {
      throw createError('Invalid lesson type', 400);
    }

    updateData.type = data.type;
  }

  if (Object.hasOwn(data, 'videoUrl')) {
    if (data.videoUrl === null) {
      updateData.videoUrl = null;
    } else {
      try {
        const url = new URL(data.videoUrl);

        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Invalid protocol');
        }

        updateData.videoUrl = data.videoUrl;
      } catch {
        throw createError('Please provide a valid HTTP or HTTPS video URL', 400);
      }
    }
  }

  if (Object.hasOwn(data, 'durationSec')) {
    if (data.durationSec === null) {
      updateData.durationSec = null;
    } else if (
      !Number.isInteger(Number(data.durationSec)) ||
      Number(data.durationSec) < 1
    ) {
      throw createError('Duration must be a positive integer in seconds', 400);
    } else {
      updateData.durationSec = Number(data.durationSec);
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw createError('Provide at least one valid field to update', 400);
  }

  return prisma.lesson.update({
    where: { id: lessonId },
    data: updateData
  });
}

export async function reorderCreatorLessons(userId, courseId, lessonIds) {
  await ensureApprovedCreator(userId);

  const course = await getOwnedEditableCourse(userId, courseId);

  if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
    throw createError('Provide a non-empty array of lesson IDs', 400);
  }

  if (
    lessonIds.some(id => typeof id !== 'string' || !id.trim()) ||
    new Set(lessonIds).size !== lessonIds.length
  ) {
    throw createError('Lesson IDs must be valid and unique', 400);
  }

  const existingLessons = await prisma.lesson.findMany({
    where: { courseId: course.id },
    select: { id: true }
  });

  const existingIds = new Set(existingLessons.map(lesson => lesson.id));

  if (
    existingIds.size !== lessonIds.length ||
    lessonIds.some(id => !existingIds.has(id))
  ) {
    throw createError(
      'Provide every lesson ID belonging to this course exactly once',
      400
    );
  }

  return prisma.$transaction(async (tx) => {
    for (let index = 0; index < lessonIds.length; index++) {
      await tx.lesson.update({
        where: { id: lessonIds[index] },
        data: { sequence: -(index + 1) }
      });
    }

    for (let index = 0; index < lessonIds.length; index++) {
      await tx.lesson.update({
        where: { id: lessonIds[index] },
        data: { sequence: index + 1 }
      });
    }

    return tx.lesson.findMany({
      where: { courseId: course.id },
      orderBy: { sequence: 'asc' },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        sequence: true
      }
    });
  });
}
