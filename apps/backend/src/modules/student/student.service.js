import { Country, State } from 'country-state-city';
import countries from 'i18n-iso-countries';
export function validateCountryCode(countryCode) {
  if (typeof countryCode !== 'string') {
    return false;
  }

  return countries.isValid(
    countryCode.trim().toUpperCase()
  );
}
export function validateStateCode(stateCode, countryCode) {
  if (
    typeof stateCode !== 'string' ||
    typeof countryCode !== 'string'
  ) {
    return false;
  }

  return Boolean(
    State.getStateByCodeAndCountry(
      stateCode.trim().toUpperCase(),
      countryCode.trim().toUpperCase()
    )
  );
}
import { prisma } from '../../config/database.js';

// ------------------------------------------
// EXISTING: Published course catalog
// ------------------------------------------

export async function getPublishedCourses(page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const where = {
    status: 'APPROVED',
    isPublished: true
  };

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
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
        _count: {
          select: { lessons: true }
        }
      }
    }),
    prisma.course.count({ where })
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

export async function getPublishedCourseById(courseId) {
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      status: 'APPROVED',
      isPublished: true
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      type: true,
      status: true,
      publishedAt: true,
      boardId: true,
      gradeId: true,
      subjectId: true,
      lessons: {
        orderBy: { sequence: 'asc' },
        select: {
          id: true,
          title: true,
          type: true,
          sequence: true,
          videoUrl: true,
          resources: {
            select: {
              id: true,
              title: true,
              resourceType: true,
              fileUrl: true,
              createdAt: true
            }
          }
        }
      }
    }
  });

  if (!course) {
    const error = new Error('Published course not found');
    error.statusCode = 404;
    throw error;
  }

  if (course.type !== 'FREE') {
    const error = new Error(
      'Enrollment or payment is required to access this course'
    );
    error.statusCode = 403;
    throw error;
  }

  return course;
}

// ------------------------------------------
// NEW: Student profile
// ------------------------------------------

export async function getStudentProfile(userId) {
  return prisma.studentProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: {
      educationLevel: true,
      board: true,
      grade: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      }
    }
  });
}

export async function updateStudentProfile(userId, data) {
  const existingProfile = await prisma.studentProfile.findUnique({
    where: { userId }
  });

  let boardId = existingProfile?.boardId ?? null;
  let gradeId = existingProfile?.gradeId ?? null;
  let educationLevelId = existingProfile?.educationLevelId ?? null;

  // Education level selection
if (Object.hasOwn(data, 'educationLevelCode')) {
  if (
    typeof data.educationLevelCode !== 'string' ||
    !data.educationLevelCode.trim()
  ) {
    const error = new Error('A valid education level is required');
    error.statusCode = 400;
    throw error;
  }

  const educationLevel = await prisma.educationLevel.findFirst({
    where: {
      code: data.educationLevelCode.trim().toUpperCase(),
      countryCode: 'IN',
      isActive: true
    }
  });

  if (!educationLevel) {
    const error = new Error('Selected education level was not found');
    error.statusCode = 404;
    throw error;
  }

  educationLevelId = educationLevel.id;

  // Board and grade apply to school education.
  if (educationLevel.category !== 'SCHOOL') {
    boardId = null;
    gradeId = null;
  }
}

  if (Object.hasOwn(data, 'boardCode')) {
    if (typeof data.boardCode !== 'string' || !data.boardCode.trim()) {
      const error = new Error('A valid education board is required');
      error.statusCode = 400;
      throw error;
    }

    const board = await prisma.board.findFirst({
      where: {
        code: data.boardCode.trim().toUpperCase(),
        isActive: true
      }
    });

    if (!board) {
      const error = new Error('Selected education board was not found');
      error.statusCode = 404;
      throw error;
    }

    if (boardId !== board.id) {
      gradeId = null;
    }

    boardId = board.id;
  }

  if (Object.hasOwn(data, 'gradeLevel')) {
    const level = Number(data.gradeLevel);

    if (!Number.isInteger(level) || level < 1 || level > 12) {
      const error = new Error('Grade must be between 1 and 12');
      error.statusCode = 400;
      throw error;
    }

    if (!boardId) {
      const error = new Error('Select an education board first');
      error.statusCode = 400;
      throw error;
    }

    const grade = await prisma.grade.findUnique({
      where: {
        boardId_level: {
          boardId,
          level
        }
      }
    });

    if (!grade) {
      const error = new Error(
        'Selected grade is not available for this board'
      );
      error.statusCode = 404;
      throw error;
    }

    gradeId = grade.id;
  }

    const updateData = {
    educationLevelId,
    boardId,
    gradeId
  };

  if (Object.hasOwn(data, 'dateOfBirth')) {
    if (data.dateOfBirth === null || data.dateOfBirth === '') {
      updateData.dateOfBirth = null;
    } else {
      const date = new Date(data.dateOfBirth);

      if (Number.isNaN(date.getTime())) {
        const error = new Error('Invalid date of birth');
        error.statusCode = 400;
        throw error;
      }

      updateData.dateOfBirth = date;
    }
  }

  if (Object.hasOwn(data, 'preferredLanguage')) {
    if (
      typeof data.preferredLanguage !== 'string' ||
      !data.preferredLanguage.trim()
    ) {
      const error = new Error('Invalid preferred language');
      error.statusCode = 400;
      throw error;
    }

    updateData.preferredLanguage = data.preferredLanguage.trim();
  }

  return prisma.studentProfile.upsert({
    where: { userId },
    create: {
      userId,
      ...updateData
    },
    update: updateData,
    include: {
      educationLevel: true,
      board: true,
      grade: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      }
    }
  });
}

// ------------------------------------------
// NEW: Education board and grade options
// ------------------------------------------

export async function getStudentOptions() {
  const [educationLevels, boards] = await Promise.all([
    prisma.educationLevel.findMany({
      where: {
        countryCode: 'IN',
        isActive: true
      },
      orderBy: {
        sortOrder: 'asc'
      },
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        description: true,
        sortOrder: true
      }
    }),

    prisma.board.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        grades: {
          orderBy: { level: 'asc' },
          select: {
            id: true,
            name: true,
            level: true
          }
        }
      }
    })
  ]);

  return {
    educationLevels,
    boards
  };
}



// ------------------------------------------
// STUDENT PATHWAYS
// ------------------------------------------

const ALLOWED_PATHWAY_TYPES = [
  'SCHOOL',
  'HIGHER_EDUCATION',
  'COMPETITIVE_EXAM',
  'GOVERNMENT_EXAM',
  'PRIVATE_SECTOR',
  'CAREER_SKILLS',
  'VOCATIONAL',
];

async function getOrCreateStudentProfile(userId) {
  return prisma.studentProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true },
  });
}

function validatePathwayType(type) {
  if (!ALLOWED_PATHWAY_TYPES.includes(type)) {
    const error = new Error('Invalid student pathway type');
    error.statusCode = 400;
    throw error;
  }
}

// GET all pathways
export async function getStudentPathways(userId) {
  const profile = await getOrCreateStudentProfile(userId);

  return prisma.studentPathway.findMany({
    where: {
      studentProfileId: profile.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// ADD pathway
export async function createStudentPathway(userId, data) {
  const { type, title, countryCode, stateCode, details } = data;
    

  validatePathwayType(type);

  if (typeof title !== 'string' || !title.trim()) {
    const error = new Error('Pathway title is required');
    error.statusCode = 400;
    throw error;
  }

  if (
    countryCode !== undefined &&
    !validateCountryCode(countryCode)
    ) {
    const error = new Error('Invalid country code');
    error.statusCode = 400;
    throw error;
    }

  if (
    stateCode !== undefined &&
    stateCode !== null &&
    (typeof stateCode !== 'string' || !stateCode.trim())
  ) {
    const error = new Error('Invalid state code');
    error.statusCode = 400;
    throw error;
  }

  if (
    details !== undefined &&
    details !== null &&
    (typeof details !== 'object' || Array.isArray(details))
  ) {
    const error = new Error('Details must be a JSON object');
    error.statusCode = 400;
    throw error;
  }

  const profile = await getOrCreateStudentProfile(userId);

  return prisma.studentPathway.create({
    data: {
      studentProfileId: profile.id,
      type,
      title: title.trim(),
      countryCode: countryCode
        ? countryCode.trim().toUpperCase()
        : 'IN',
        stateCode: stateCode || null,
        details: details ?? undefined,
        },
      });
    }

// UPDATE pathway
export async function updateStudentPathway(userId, pathwayId, data) {
  const profile = await getOrCreateStudentProfile(userId);

  const existing = await prisma.studentPathway.findFirst({
    where: {
      id: pathwayId,
      studentProfileId: profile.id,
    },
  });

  if (!existing) {
    const error = new Error('Student pathway not found');
    error.statusCode = 404;
    throw error;
  }

  const updateData = {};

  if (Object.hasOwn(data, 'type')) {
    validatePathwayType(data.type);
    updateData.type = data.type;
  }

  if (Object.hasOwn(data, 'title')) {
    if (typeof data.title !== 'string' || !data.title.trim()) {
      const error = new Error('Invalid pathway title');
      error.statusCode = 400;
      throw error;
    }
    updateData.title = data.title.trim();
  }

  if (Object.hasOwn(data, 'status')) {
    if (!['ACTIVE', 'INACTIVE', 'COMPLETED'].includes(data.status)) {
      const error = new Error('Invalid pathway status');
      error.statusCode = 400;
      throw error;
    }
    updateData.status = data.status;
  }

    if (
      Object.hasOwn(data, 'countryCode') ||
      Object.hasOwn(data, 'stateCode')
    ) {
      const rawCountryCode = Object.hasOwn(data, 'countryCode')
      ? data.countryCode
      : existing.countryCode;

      if (!validateCountryCode(rawCountryCode)) {
      const error = new Error('Invalid country code');
      error.statusCode = 400;
      throw error;
    }

    const nextCountryCode = rawCountryCode.trim().toUpperCase();

    const nextStateCode = Object.hasOwn(data, 'stateCode')
      ? data.stateCode
      : existing.stateCode;

    if (
      nextStateCode !== null &&
      nextStateCode !== undefined &&
      !validateStateCode(nextStateCode, nextCountryCode)
    ) {
      const error = new Error(
        'State does not belong to the selected country'
      );
      error.statusCode = 400;
      throw error;
    }

    updateData.countryCode = nextCountryCode;

    updateData.stateCode = nextStateCode
      ? nextStateCode.trim().toUpperCase()
      : null;
  }

  if (Object.hasOwn(data, 'details')) {
    if (data.details !== null &&
        (typeof data.details !== 'object' || Array.isArray(data.details))) {
      const error = new Error('Details must be a JSON object');
      error.statusCode = 400;
      throw error;
    }
    updateData.details = data.details;
  }

  return prisma.studentPathway.update({
    where: { id: pathwayId },
    data: updateData,
  });
}

// DELETE pathway
export async function deleteStudentPathway(userId, pathwayId) {
  const profile = await getOrCreateStudentProfile(userId);

  const result = await prisma.studentPathway.deleteMany({
    where: {
      id: pathwayId,
      studentProfileId: profile.id,
    },
  });

  if (result.count === 0) {
    const error = new Error('Student pathway not found');
    error.statusCode = 404;
    throw error;
  }

  return { deleted: true };
}


// ------------------------------------------
// STUDENT PATHWAY CONTROLLERS
// ------------------------------------------

