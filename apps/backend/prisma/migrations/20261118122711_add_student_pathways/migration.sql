-- CreateEnum
CREATE TYPE "StudentPathwayType" AS ENUM ('SCHOOL', 'HIGHER_EDUCATION', 'COMPETITIVE_EXAM', 'GOVERNMENT_EXAM', 'PRIVATE_SECTOR', 'CAREER_SKILLS', 'VOCATIONAL');

-- CreateTable
CREATE TABLE "StudentPathway" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "type" "StudentPathwayType" NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "countryCode" TEXT NOT NULL DEFAULT 'IN',
    "stateCode" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentPathway_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentPathway_studentProfileId_type_idx" ON "StudentPathway"("studentProfileId", "type");

-- CreateIndex
CREATE INDEX "StudentPathway_countryCode_stateCode_idx" ON "StudentPathway"("countryCode", "stateCode");

-- CreateIndex
CREATE INDEX "StudentPathway_status_idx" ON "StudentPathway"("status");

-- AddForeignKey
ALTER TABLE "StudentPathway" ADD CONSTRAINT "StudentPathway_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
