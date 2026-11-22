import { getCoursePublicationIssues } from '../courses/course-readiness.js';
import { prisma } from '../../config/database.js';

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function listCourses({
  page = 1,
  limit = 10,
  search = ''
}) {
  const where = {
    status: 'PENDING_REVIEW'
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      {
        creator: {
          name: { contains: search, mode: 'insensitive' }
        }
      }
    ];
  }

  const skip = (page - 1) * limit;

  const [courses, total] = await prisma.$transaction([
    prisma.course.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            creatorProfile: {
              select: {
                displayName: true
              }
            }
          }
        },
        boardId: true,
        gradeId: true,
        subjectId: true,
        _count: {
          select: {
            lessons: true
          }
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

export async function getCourseForReview(courseId) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
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
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          creatorProfile: true
        }
      },
      lessons: {
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
          resources: true,
          reviews: {
            orderBy: { createdAt: 'desc' },
            select: { id: true, decision: true, reason: true, createdAt: true, reviewer: { select: { id: true, name: true } } }
          }
        }
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          decision: true,
          reason: true,
          createdAt: true,
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      createdAt: true,
      updatedAt: true
    }
  });

  if (!course) {
    throw createError('Course not found', 404);
  }

  return course;
}

export async function reviewCourse(courseId, adminId, decision, reason = null) {
  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    throw createError('Decision must be APPROVED or REJECTED', 400);
  }

  if (decision === 'REJECTED' && !reason?.trim()) {
    throw createError('A rejection reason is required', 400);
  }

  return prisma.$transaction(async tx => {
    const course = await tx.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        status: true,
        lessons: {
          orderBy: { sequence: 'asc' },
          select: {
            id: true, title: true, description: true, type: true,
            status: true, videoUrl: true, resources: { select: { fileUrl: true } }
          }
        }
      }
    });

    if (!course) {
      throw createError('Course not found', 404);
    }

    if (course.status !== 'PENDING_REVIEW') {
      throw createError(
        'Only courses pending review can be approved or rejected',
        409
      );
    }

    if (decision === 'APPROVED') {
      const unapproved = course.lessons.filter(lesson => lesson.status !== 'APPROVED');
      if (unapproved.length > 0) {
        throw createError(
          `Approve all lessons before approving this course. ${unapproved.length} lesson(s) remain unapproved.`,
          409
        );
      }
      const readinessIssues = getCoursePublicationIssues({
        ...course,
        status: 'APPROVED'
      });
      if (readinessIssues.length > 0) {
        throw createError(`Course is not ready for approval: ${readinessIssues.join(' ')}`, 400);
      }
    }

    const updated = await tx.course.updateMany({
      where: {
        id: courseId,
        status: 'PENDING_REVIEW'
      },
      data: {
        status: decision
      }
    });

    if (updated.count !== 1) {
      throw createError(
        'Course review was already processed. Refresh and try again.',
        409
      );
    }

    if (decision === 'REJECTED') {
      await tx.lesson.updateMany({
        where: { courseId },
        data: { status: 'REJECTED' }
      });
    }

    const review = await tx.courseReview.create({
      data: {
        courseId,
        reviewerId: adminId,
        decision,
        reason: decision === 'REJECTED' ? reason.trim() : null
      },
      select: {
        id: true,
        courseId: true,
        reviewerId: true,
        decision: true,
        reason: true,
        createdAt: true
      }
    });

    return {
      course: {
        id: course.id,
        title: course.title,
        status: decision
      },
      review
    };
  });
}

export async function publishCourse(courseId, adminId) {
  return prisma.$transaction(async tx => {
    const course = await tx.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        status: true,
        isPublished: true,
        lessons: {
          orderBy: { sequence: 'asc' },
          select: {
            id: true, title: true, description: true, type: true,
            status: true, videoUrl: true, resources: { select: { fileUrl: true } }
          }
        }
      }
    });

    if (!course) {
      throw createError('Course not found', 404);
    }

    if (course.status !== 'APPROVED') {
      throw createError(
        'Only approved courses can be published',
        409
      );
    }

    const readinessIssues = getCoursePublicationIssues(course);
    if (readinessIssues.length > 0) {
      throw createError(
        `Course cannot be published: ${readinessIssues.join(' ')}`,
        409
      );
    }

    if (course.isPublished) {
      throw createError('Course is already published', 409);
    }

    const now = new Date();

    const updated = await tx.course.updateMany({
      where: {
        id: courseId,
        status: 'APPROVED',
        isPublished: false
      },
      data: {
        isPublished: true,
        publishedAt: now
      }
    });

    if (updated.count !== 1) {
      throw createError(
        'Course publication state changed. Refresh and try again.',
        409
      );
    }

    const history = await tx.coursePublication.create({
      data: {
        courseId,
        adminId,
        action: 'PUBLISHED'
      }
    });

    return {
      course: {
        id: course.id,
        title: course.title,
        status: course.status,
        isPublished: true,
        publishedAt: now
      },
      history
    };
  });
}

export async function unpublishCourse(courseId, adminId) {
  return prisma.$transaction(async tx => {
    const course = await tx.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        status: true,
        isPublished: true
      }
    });

    if (!course) {
      throw createError('Course not found', 404);
    }

    if (!course.isPublished) {
      throw createError('Course is not currently published', 409);
    }

    const updated = await tx.course.updateMany({
      where: {
        id: courseId,
        isPublished: true
      },
      data: {
        isPublished: false,
        publishedAt: null
      }
    });

    if (updated.count !== 1) {
      throw createError(
        'Course publication state changed. Refresh and try again.',
        409
      );
    }

    const history = await tx.coursePublication.create({
      data: {
        courseId,
        adminId,
        action: 'UNPUBLISHED'
      }
    });

    return {
      course: {
        id: course.id,
        title: course.title,
        status: course.status,
        isPublished: false,
        publishedAt: null
      },
      history
    };
  });
}

export async function getCoursePublicationHistory(courseId) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      status: true,
      isPublished: true,
      publishedAt: true,
      publicationHistory: {
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          action: true,
          createdAt: true,
          admin: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  });

  if (!course) {
    throw createError('Course not found', 404);
  }

  return course;
}

export async function reviewLesson(lessonId, adminId, decision, reason = null) {
  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    throw createError('Decision must be APPROVED or REJECTED', 400);
  }
  if (decision === 'REJECTED' && !reason?.trim()) {
    throw createError('A rejection reason is required', 400);
  }

  return prisma.$transaction(async tx => {
    const lesson = await tx.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: { select: { id: true, title: true, status: true, isPublished: true } },
        resources: { select: { fileUrl: true } }
      }
    });
    if (!lesson) throw createError('Lesson not found', 404);
    if (lesson.course.status !== 'PENDING_REVIEW' || lesson.course.isPublished) {
      throw createError('Only lessons in an unpublished course pending review can be reviewed', 409);
    }
    if (lesson.status !== 'PENDING_REVIEW') {
      throw createError('Only lessons pending review can be approved or rejected', 409);
    }

    if (decision === 'APPROVED') {
      const issues = getCoursePublicationIssues({
        status: 'APPROVED',
        lessons: [{ ...lesson, status: 'APPROVED' }]
      }).filter(issue => !issue.startsWith('Only approved courses'));
      if (issues.length > 0) {
        throw createError(`Lesson is not ready for approval: ${issues.join(' ')}`, 400);
      }
    }

    const updated = await tx.lesson.updateMany({
      where: { id: lessonId, status: 'PENDING_REVIEW' },
      data: { status: decision }
    });
    if (updated.count !== 1) throw createError('Lesson review state changed. Refresh and try again.', 409);

    await tx.lessonReview.create({
      data: {
        lessonId,
        reviewerId: adminId,
        decision,
        reason: decision === 'REJECTED' ? reason.trim() : null
      }
    });

    if (decision === 'REJECTED') {
      await tx.lesson.updateMany({
        where: { courseId: lesson.course.id },
        data: { status: 'REJECTED' }
      });
      await tx.course.update({
        where: { id: lesson.course.id },
        data: { status: 'REJECTED' }
      });
    }

    return {
      lesson: { id: lesson.id, title: lesson.title, status: decision },
      course: {
        id: lesson.course.id,
        title: lesson.course.title,
        status: decision === 'REJECTED' ? 'REJECTED' : lesson.course.status
      }
    };
  });
}
