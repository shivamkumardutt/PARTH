import { calculateLearningProgress, isLearningComplete } from './learning.helpers.js';
import { prisma } from '../../config/database.js';

function httpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const publishedCourseWhere = {
  status: 'APPROVED',
  isPublished: true,
};

function summarizeEnrollment(enrollment) {
  const lessons = enrollment.course.lessons || [];
  const completedLessonIds = new Set(
    (enrollment.progress || []).map((item) => item.lessonId)
  );
  const completedLessons = lessons.filter((lesson) =>
    completedLessonIds.has(lesson.id)
  ).length;
  const totalLessons = lessons.length;

  return {
    id: enrollment.id,
    status: enrollment.status,
    enrolledAt: enrollment.enrolledAt,
    completedAt: enrollment.completedAt,
    course: {
      id: enrollment.course.id,
      title: enrollment.course.title,
      slug: enrollment.course.slug,
      description: enrollment.course.description,
      type: enrollment.course.type,
      publishedAt: enrollment.course.publishedAt,
      totalLessons,
    },
    progress: calculateLearningProgress(totalLessons, completedLessons),
  };
}

export async function enrollStudentInCourse(userId, courseId) {
  if (typeof courseId !== 'string' || !courseId.trim()) {
    throw httpError('A valid course ID is required', 400);
  }

  const course = await prisma.course.findFirst({
    where: { id: courseId, ...publishedCourseWhere },
    select: { id: true, type: true },
  });

  if (!course) {
    throw httpError('Published course not found', 404);
  }

  // Payment verification is not integrated yet. Never grant paid access here.
  if (course.type !== 'FREE') {
    throw httpError(
      'This course requires verified payment. Paid-course enrollment is not available yet.',
      402
    );
  }

  // Enrollment is idempotent: retrying the request must never downgrade a
  // completed course back to ACTIVE or clear its completion timestamp.
  const enrollment = await prisma.courseEnrollment.upsert({
    where: {
      studentId_courseId: { studentId: userId, courseId: course.id },
    },
    create: {
      studentId: userId,
      courseId: course.id,
      status: 'ACTIVE',
    },
    update: {},
    select: {
      id: true,
      studentId: true,
      courseId: true,
      status: true,
      enrolledAt: true,
      completedAt: true,
    },
  });

  // A previously cancelled enrollment can be reactivated deliberately. Keep
  // existing lesson progress so a student does not lose work on re-enrollment.
  if (enrollment.status === 'CANCELLED') {
    return prisma.courseEnrollment.update({
      where: { id: enrollment.id },
      data: { status: 'ACTIVE', completedAt: null },
      select: {
        id: true,
        studentId: true,
        courseId: true,
        status: true,
        enrolledAt: true,
        completedAt: true,
      },
    });
  }

  return enrollment;
}

export async function getStudentLearning(userId) {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: {
      studentId: userId,
      status: { not: 'CANCELLED' },
    },
    orderBy: { enrolledAt: 'desc' },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          type: true,
          publishedAt: true,
          lessons: {
            where: { status: 'APPROVED' },
            select: { id: true },
          },
        },
      },
      progress: {
        where: { completedAt: { not: null } },
        select: { lessonId: true },
      },
    },
  });

  return enrollments.map(summarizeEnrollment);
}

export async function getStudentLearningCourse(userId, enrollmentId) {
  const enrollment = await prisma.courseEnrollment.findFirst({
    where: {
      id: enrollmentId,
      studentId: userId,
      status: { not: 'CANCELLED' },
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          type: true,
          lessons: {
            where: { status: 'APPROVED' },
            orderBy: { sequence: 'asc' },
            select: {
              id: true,
              title: true,
              description: true,
              type: true,
              sequence: true,
              videoUrl: true,
              durationSec: true,
              resources: {
                select: {
                  id: true,
                  title: true,
                  resourceType: true,
                  fileUrl: true,
                },
              },
            },
          },
        },
      },
      progress: {
        select: { lessonId: true, completedAt: true },
      },
    },
  });

  if (!enrollment) {
    throw httpError('Enrolled course not found', 404);
  }

  const completed = new Map(
    enrollment.progress.map((item) => [item.lessonId, item.completedAt])
  );
  const lessons = enrollment.course.lessons.map((lesson) => ({
    ...lesson,
    completedAt: completed.get(lesson.id) || null,
    isCompleted: Boolean(completed.get(lesson.id)),
  }));
  const completedLessons = lessons.filter((lesson) => lesson.isCompleted).length;
  const totalLessons = lessons.length;

  return {
    enrollment: {
      id: enrollment.id,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
    },
    course: {
      ...enrollment.course,
      lessons,
    },
    progress: calculateLearningProgress(totalLessons, completedLessons),
  };
}

export async function setLessonCompletion(userId, enrollmentId, lessonId, completed) {
  if (typeof completed !== 'boolean') {
    throw httpError('completed must be a boolean', 400);
  }

  return prisma.$transaction(async (tx) => {
    const enrollment = await tx.courseEnrollment.findFirst({
      where: {
        id: enrollmentId,
        studentId: userId,
        status: { not: 'CANCELLED' },
      },
      select: { id: true, courseId: true },
    });

    if (!enrollment) {
      throw httpError('Enrolled course not found', 404);
    }

    const lesson = await tx.lesson.findFirst({
      where: {
        id: lessonId,
        courseId: enrollment.courseId,
        status: 'APPROVED',
      },
      select: { id: true },
    });

    if (!lesson) {
      throw httpError('Published lesson not found in this course', 404);
    }

    await tx.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: { enrollmentId, lessonId },
      },
      create: {
        enrollmentId,
        lessonId,
        completedAt: completed ? new Date() : null,
      },
      update: {
        completedAt: completed ? new Date() : null,
      },
    });

    const [totalLessons, completedLessons] = await Promise.all([
      tx.lesson.count({
        where: { courseId: enrollment.courseId, status: 'APPROVED' },
      }),
      tx.lessonProgress.count({
        where: {
          enrollmentId,
          completedAt: { not: null },
          lesson: { status: 'APPROVED' },
        },
      }),
    ]);

    const isCourseCompleted = isLearningComplete(totalLessons, completedLessons);

    await tx.courseEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: isCourseCompleted ? 'COMPLETED' : 'ACTIVE',
        completedAt: isCourseCompleted ? new Date() : null,
      },
    });

    return {
      lessonId,
      isCompleted: completed,
      progress: calculateLearningProgress(totalLessons, completedLessons),
      enrollmentStatus: isCourseCompleted ? 'COMPLETED' : 'ACTIVE',
    };
  });
}
