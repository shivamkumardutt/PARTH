-- CreateTable
CREATE TABLE "EducationLevel" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'IN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationLevel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EducationLevel_code_key" ON "EducationLevel"("code");

-- CreateIndex
CREATE INDEX "EducationLevel_category_sortOrder_idx" ON "EducationLevel"("category", "sortOrder");

-- CreateIndex
CREATE INDEX "EducationLevel_countryCode_isActive_idx" ON "EducationLevel"("countryCode", "isActive");
