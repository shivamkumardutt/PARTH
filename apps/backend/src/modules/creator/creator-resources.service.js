import { prisma } from '../../config/database.js';

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const allowedTypes = [
  'PDF',
  'NOTES',
  'WORKSHEET',
  'DOCUMENT',
  'LINK'
];

function validateResourceUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError('Resource URL is required', 400);
  }

  try {
    const url = new URL(value.trim());

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol');
    }

    return url.toString();
  } catch {
    throw createError('Please provide a valid HTTP or HTTPS resource URL', 400);
  }
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

async function getOwnedLesson(userId, lessonId) {
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
    throw createError(
      'Resources can only be changed in draft or rejected courses',
      400
    );
  }

  return lesson;
}

async function getOwnedResource(userId, resourceId) {
  const resource = await prisma.resource.findFirst({
    where: {
      id: resourceId,
      lesson: {
        course: {
          creatorId: userId
        }
      }
    },
    include: {
      lesson: {
        include: {
          course: {
            select: {
              status: true
            }
          }
        }
      }
    }
  });

  if (!resource) {
    throw createError('Resource not found', 404);
  }

  if (!['DRAFT', 'REJECTED'].includes(resource.lesson.course.status)) {
    throw createError(
      'Resources can only be changed in draft or rejected courses',
      400
    );
  }

  return resource;
}

export async function createCreatorResource(userId, lessonId, data) {
  await ensureApprovedCreator(userId);

  const lesson = await getOwnedLesson(userId, lessonId);

  const title = typeof data.title === 'string'
    ? data.title.trim()
    : '';

  if (title.length < 2 || title.length > 150) {
    throw createError(
      'Resource title must be between 2 and 150 characters',
      400
    );
  }

  if (!allowedTypes.includes(data.resourceType)) {
    throw createError('Invalid resource type', 400);
  }

  const fileUrl = validateResourceUrl(data.fileUrl);

  return prisma.resource.create({
    data: {
      lessonId: lesson.id,
      title,
      resourceType: data.resourceType,
      fileUrl
    }
  });
}

export async function getCreatorResources(userId, lessonId) {
  await ensureApprovedCreator(userId);

  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      course: {
        creatorId: userId
      }
    },
    select: {
      id: true
    }
  });

  if (!lesson) {
    throw createError('Lesson not found', 404);
  }

  return prisma.resource.findMany({
    where: {
      lessonId: lesson.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function updateCreatorResource(userId, resourceId, data) {
  await ensureApprovedCreator(userId);

  const resource = await getOwnedResource(userId, resourceId);
  const updateData = {};

  if (Object.prototype.hasOwnProperty.call(data, 'title')) {
    const title = typeof data.title === 'string'
      ? data.title.trim()
      : '';

    if (title.length < 2 || title.length > 150) {
      throw createError(
        'Resource title must be between 2 and 150 characters',
        400
      );
    }

    updateData.title = title;
  }

  if (Object.prototype.hasOwnProperty.call(data, 'resourceType')) {
    if (!allowedTypes.includes(data.resourceType)) {
      throw createError('Invalid resource type', 400);
    }

    updateData.resourceType = data.resourceType;
  }

  if (Object.prototype.hasOwnProperty.call(data, 'fileUrl')) {
    updateData.fileUrl = validateResourceUrl(data.fileUrl);
  }

  if (Object.keys(updateData).length === 0) {
    throw createError('Provide at least one field to update', 400);
  }

  return prisma.resource.update({
    where: {
      id: resource.id
    },
    data: updateData
  });
}

export async function deleteCreatorResource(userId, resourceId) {
  await ensureApprovedCreator(userId);

  const resource = await getOwnedResource(userId, resourceId);

  return prisma.resource.delete({
    where: {
      id: resource.id
    }
  });
}
