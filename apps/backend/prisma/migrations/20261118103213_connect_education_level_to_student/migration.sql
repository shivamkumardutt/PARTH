-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "educationLevelId" TEXT;

-- CreateIndex
CREATE INDEX "StudentProfile_educationLevelId_idx" ON "StudentProfile"("educationLevelId");

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_educationLevelId_fkey" FOREIGN KEY ("educationLevelId") REFERENCES "EducationLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
