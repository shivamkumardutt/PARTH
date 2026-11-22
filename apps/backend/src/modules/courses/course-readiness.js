const LESSON_TYPES = new Set(['VIDEO', 'ARTICLE', 'PDF', 'INTERACTIVE', 'LIVE']);

export function isHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getLessonReadinessIssues(lesson) {
  const issues = [];
  if (!lesson || typeof lesson.title !== 'string' || lesson.title.trim().length < 3) {
    issues.push('Lesson title must contain at least 3 characters.');
  }
  if (!lesson || !LESSON_TYPES.has(lesson.type)) {
    issues.push('Lesson type is invalid.');
    return issues;
  }

  const resources = Array.isArray(lesson.resources) ? lesson.resources : [];
  const validResources = resources.filter(resource => isHttpUrl(resource.fileUrl));
  const invalidResources = resources.length - validResources.length;
  if (invalidResources > 0) issues.push('One or more lesson resource URLs are invalid.');

  if (lesson.type === 'VIDEO' && !isHttpUrl(lesson.videoUrl)) {
    issues.push('A valid HTTP or HTTPS video URL is required for video lessons.');
  }
  if (lesson.type === 'LIVE' && !isHttpUrl(lesson.videoUrl)) {
    issues.push('A valid HTTP or HTTPS meeting/stream URL is required for live lessons.');
  }
  if (lesson.type === 'PDF' && validResources.length === 0) {
    issues.push('At least one valid resource is required for PDF lessons.');
  }
  if (lesson.type === 'ARTICLE' && !(lesson.description || '').trim() && validResources.length === 0) {
    issues.push('Article lessons need a description or at least one valid resource.');
  }
  if (lesson.type === 'INTERACTIVE' && !(lesson.description || '').trim() && validResources.length === 0) {
    issues.push('Interactive lessons need instructions or at least one valid resource.');
  }

  return issues;
}

export function getCourseSubmissionIssues(course) {
  const issues = [];
  if (!course || typeof course.title !== 'string' || course.title.trim().length < 3) {
    issues.push('Course title must contain at least 3 characters.');
  }
  const lessons = Array.isArray(course?.lessons) ? course.lessons : [];
  if (lessons.length === 0) {
    issues.push('Add at least one lesson before submitting the course.');
    return issues;
  }
  lessons.forEach((lesson, index) => {
    for (const issue of getLessonReadinessIssues(lesson)) {
      issues.push(`Lesson ${index + 1} (${lesson.title || 'Untitled'}): ${issue}`);
    }
  });
  return issues;
}

export function getCoursePublicationIssues(course) {
  const issues = [];
  if (!course) return ['Course not found.'];
  if (course.status !== 'APPROVED') issues.push('Only approved courses can be published.');
  const lessons = Array.isArray(course.lessons) ? course.lessons : [];
  if (lessons.length === 0) issues.push('A course must contain at least one lesson before publishing.');
  lessons.forEach((lesson, index) => {
    if (lesson.status !== 'APPROVED') {
      issues.push(`Lesson ${index + 1} (${lesson.title || 'Untitled'}) has not been approved.`);
    }
    for (const issue of getLessonReadinessIssues(lesson)) {
      issues.push(`Lesson ${index + 1} (${lesson.title || 'Untitled'}): ${issue}`);
    }
  });
  return issues;
}
