-- CreateTable
CREATE TABLE "crrc_evaluations" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "kra1TeachingEffectiveness" DOUBLE PRECISION,
    "kra1CurriculumMaterials" DOUBLE PRECISION,
    "kra1SpecialProjects" DOUBLE PRECISION,
    "kra1Total" DOUBLE PRECISION,
    "kra2ResearchOutputs" DOUBLE PRECISION,
    "kra2Inventions" DOUBLE PRECISION,
    "kra2CreativeWorks" DOUBLE PRECISION,
    "kra2Total" DOUBLE PRECISION,
    "kra3ServiceToInstitution" DOUBLE PRECISION,
    "kra3ServiceToCommunity" DOUBLE PRECISION,
    "kra3QualityOfService" DOUBLE PRECISION,
    "kra3Bonus" DOUBLE PRECISION,
    "kra3Total" DOUBLE PRECISION,
    "kra4ProfessionalOrgs" DOUBLE PRECISION,
    "kra4ContinuingDevelopment" DOUBLE PRECISION,
    "kra4AwardsRecognition" DOUBLE PRECISION,
    "kra4NewHireBonus" DOUBLE PRECISION,
    "kra4Total" DOUBLE PRECISION,
    "finalWeightedScore" DOUBLE PRECISION,
    "recommendedSubRanks" INTEGER,
    "evaluatedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crrc_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crrc_evaluations_applicationId_key" ON "crrc_evaluations"("applicationId");

-- AddForeignKey
ALTER TABLE "crrc_evaluations" ADD CONSTRAINT "crrc_evaluations_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crrc_evaluations" ADD CONSTRAINT "crrc_evaluations_evaluatedById_fkey" FOREIGN KEY ("evaluatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
