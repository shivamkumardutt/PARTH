import { prisma } from '../../config/database.js';

export async function applyAsCreator(userId, data) {
  const displayName = data.displayName?.trim();
  const bio = data.bio?.trim() || null;

  if (!displayName || displayName.length < 2) {
    const error = new Error('Display name must contain at least 2 characters');
    error.statusCode = 400;
    throw error;
  }

  if (displayName.length > 80) {
    const error = new Error('Display name cannot exceed 80 characters');
    error.statusCode = 400;
    throw error;
  }

  if (bio && bio.length > 1000) {
    const error = new Error('Bio cannot exceed 1000 characters');
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  if (!user) {
    const error = new Error('User account not found');
    error.statusCode = 404;
    throw error;
  }

  const existingApplication = await prisma.creatorProfile.findUnique({
    where: { userId }
  });

  if (existingApplication) {
    const error = new Error('You have already submitted a creator application');
    error.statusCode = 409;
    throw error;
  }

  return prisma.creatorProfile.create({
    data: {
      userId,
      displayName,
      bio,
      verificationStatus: 'PENDING'
    },
    select: {
      id: true,
      displayName: true,
      bio: true,
      verificationStatus: true,
      createdAt: true
    }
  });
}

export async function getMyCreatorApplication(userId) {
  return prisma.creatorProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      displayName: true,
      bio: true,
      verificationStatus: true,
      createdAt: true,
      updatedAt: true
    }
  });
}
