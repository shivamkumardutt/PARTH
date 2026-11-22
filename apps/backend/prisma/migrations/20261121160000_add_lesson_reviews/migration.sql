CREATE TABLE "LessonReview" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LessonReview_lessonId_createdAt_idx" ON "LessonReview"("lessonId", "createdAt");
CREATE INDEX "LessonReview_reviewerId_idx" ON "LessonReview"("reviewerId");

ALTER TABLE "LessonReview" ADD CONSTRAINT "LessonReview_lessonId_fkey"
FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LessonReview" ADD CONSTRAINT "LessonReview_reviewerId_fkey"
FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
