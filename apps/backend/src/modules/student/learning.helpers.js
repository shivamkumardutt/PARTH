export function calculateLearningProgress(totalLessons, completedLessons) {
  const total = Math.max(0, Number.isFinite(totalLessons) ? totalLessons : 0);
  const completed = Math.min(total, Math.max(0, Number.isFinite(completedLessons) ? completedLessons : 0));
  return {
    completedLessons: completed,
    totalLessons: total,
    percentage: total ? Math.round((completed / total) * 100) : 0,
  };
}

export function isLearningComplete(totalLessons, completedLessons) {
  return totalLessons > 0 && completedLessons >= totalLessons;
}
