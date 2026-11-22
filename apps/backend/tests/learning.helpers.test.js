import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLearningProgress, isLearningComplete } from '../src/modules/student/learning.helpers.js';

test('empty course has zero progress and is not completed', () => {
  assert.deepEqual(calculateLearningProgress(0, 0), {
    completedLessons: 0,
    totalLessons: 0,
    percentage: 0,
  });
  assert.equal(isLearningComplete(0, 0), false);
});

test('progress is calculated from completed lessons', () => {
  assert.deepEqual(calculateLearningProgress(4, 1), {
    completedLessons: 1,
    totalLessons: 4,
    percentage: 25,
  });
});

test('progress rounds to the nearest whole percentage', () => {
  assert.equal(calculateLearningProgress(3, 2).percentage, 67);
});

test('completed count is clamped to total lessons', () => {
  assert.deepEqual(calculateLearningProgress(2, 8), {
    completedLessons: 2,
    totalLessons: 2,
    percentage: 100,
  });
});

test('course completion requires at least one lesson and all lessons complete', () => {
  assert.equal(isLearningComplete(3, 2), false);
  assert.equal(isLearningComplete(3, 3), true);
  assert.equal(isLearningComplete(3, 4), true);
});
