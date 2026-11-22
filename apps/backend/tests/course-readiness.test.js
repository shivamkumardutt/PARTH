import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getLessonReadinessIssues,
  getCourseSubmissionIssues,
  getCoursePublicationIssues
} from '../src/modules/courses/course-readiness.js';

const validVideoLesson = {
  title: 'Real Numbers', type: 'VIDEO', videoUrl: 'https://cdn.example.com/real-numbers.mp4',
  description: null, resources: []
};

test('video lesson requires a valid HTTPS or HTTP video URL', () => {
  assert.equal(getLessonReadinessIssues(validVideoLesson).length, 0);
  assert.ok(getLessonReadinessIssues({ ...validVideoLesson, videoUrl: 'javascript:alert(1)' }).length > 0);
});

test('PDF lesson requires at least one valid resource', () => {
  assert.ok(getLessonReadinessIssues({ title: 'Notes PDF', type: 'PDF', resources: [] }).length > 0);
  assert.equal(getLessonReadinessIssues({ title: 'Notes PDF', type: 'PDF', resources: [{ fileUrl: 'https://cdn.example.com/notes.pdf' }] }).length, 0);
});

test('article and interactive lessons require description or resource', () => {
  assert.ok(getLessonReadinessIssues({ title: 'Article title', type: 'ARTICLE', resources: [] }).length > 0);
  assert.equal(getLessonReadinessIssues({ title: 'Article title', type: 'ARTICLE', description: 'Read this lesson', resources: [] }).length, 0);
  assert.equal(getLessonReadinessIssues({ title: 'Practice', type: 'INTERACTIVE', resources: [{ fileUrl: 'https://example.com/task' }] }).length, 0);
});

test('course submission requires at least one ready lesson', () => {
  assert.ok(getCourseSubmissionIssues({ title: 'Class 10 Maths', lessons: [] }).length > 0);
  assert.equal(getCourseSubmissionIssues({ title: 'Class 10 Maths', lessons: [validVideoLesson] }).length, 0);
});

test('course publication requires approved course and every lesson approved', () => {
  const course = { status: 'APPROVED', lessons: [{ ...validVideoLesson, status: 'APPROVED' }] };
  assert.equal(getCoursePublicationIssues(course).length, 0);
  assert.ok(getCoursePublicationIssues({ ...course, lessons: [{ ...validVideoLesson, status: 'DRAFT' }] }).length > 0);
  assert.ok(getCoursePublicationIssues({ ...course, lessons: [] }).length > 0);
});
