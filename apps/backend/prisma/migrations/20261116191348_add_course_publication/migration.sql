-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CoursePublication" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoursePublication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoursePublication_courseId_createdAt_idx" ON "CoursePublication"("courseId", "createdAt");

-- CreateIndex
CREATE INDEX "CoursePublication_adminId_idx" ON "CoursePublication"("adminId");

-- AddForeignKey
ALTER TABLE "CoursePublication" ADD CONSTRAINT "CoursePublication_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePublication" ADD CONSTRAINT "CoursePublication_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
