-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('applicant', 'hr', 'dean', 'vpaa', 'admin');

-- CreateEnum
CREATE TYPE "HiringTrack" AS ENUM ('faculty', 'administrative');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('permanent', 'temporary', 'cos');

-- CreateEnum
CREATE TYPE "VacancyStatus" AS ENUM ('draft', 'pending_hr_review', 'returned', 'awaiting_vpaa_endorsement', 'awaiting_president_approval', 'awaiting_board_confirmation', 'published', 'closed');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('submitted', 'under_review', 'deficient', 'qualified', 'psc_screened', 'shortlisted', 'psb_evaluated', 'crrc_scheduled', 'crrc_evaluated', 'appointed', 'not_selected');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('pds', 'work_experience_sheet', 'transcript_of_records', 'certification', 'eligibility', 'other');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'verified', 'flagged');

-- CreateEnum
CREATE TYPE "PscOutcome" AS ENUM ('attended', 'no_contact', 'already_employed', 'withdrew', 'other');

-- CreateTable
CREATE TABLE "colleges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "collegeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qs_templates" (
    "id" TEXT NOT NULL,
    "positionTitle" TEXT NOT NULL,
    "salaryGrade" INTEGER NOT NULL,
    "track" "HiringTrack" NOT NULL,
    "education" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "training" TEXT NOT NULL,
    "eligibility" TEXT NOT NULL,
    "competencies" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qs_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_ranks" (
    "id" TEXT NOT NULL,
    "track" "HiringTrack" NOT NULL,
    "sequenceNo" INTEGER NOT NULL,
    "qsTemplateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_ranks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacancies" (
    "id" TEXT NOT NULL,
    "positionTitle" TEXT NOT NULL,
    "plantillaItemNo" TEXT,
    "salaryGrade" INTEGER NOT NULL,
    "monthlySalary" DECIMAL(10,2),
    "placeOfAssignment" TEXT NOT NULL,
    "track" "HiringTrack" NOT NULL,
    "appointmentType" "AppointmentType" NOT NULL DEFAULT 'permanent',
    "slots" INTEGER NOT NULL DEFAULT 1,
    "qsTemplateId" TEXT,
    "collegeId" TEXT,
    "status" "VacancyStatus" NOT NULL DEFAULT 'draft',
    "createdByRole" "UserRole" NOT NULL,
    "createdById" TEXT NOT NULL,
    "hrReviewedById" TEXT,
    "hrReviewNotes" TEXT,
    "hrReviewedAt" TIMESTAMP(3),
    "vpaaEndorsedById" TEXT,
    "vpaaEndorsedAt" TIMESTAMP(3),
    "presidentApprovedAt" TIMESTAMP(3),
    "boardConfirmedAt" TIMESTAMP(3),
    "approvalDocumentRef" TEXT,
    "publicationChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "postingDate" TIMESTAMP(3),
    "closingDate" TIMESTAMP(3),
    "validityMonths" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "vacancyId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'submitted',
    "qsMatchScore" DOUBLE PRECISION,
    "pscScore" DOUBLE PRECISION,
    "pscOutcome" "PscOutcome",
    "pscOutcomeNote" TEXT,
    "psbScore" DOUBLE PRECISION,
    "teachingDemoConducted" BOOLEAN NOT NULL DEFAULT false,
    "teachingDemoScore" DOUBLE PRECISION,
    "crrcScore" DOUBLE PRECISION,
    "mastersDeadline" TIMESTAMP(3),
    "mastersCompleted" BOOLEAN,
    "decisionNotes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "parsedData" JSONB,
    "parsingConfidence" DOUBLE PRECISION,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "colleges_name_key" ON "colleges"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "qs_templates_positionTitle_salaryGrade_key" ON "qs_templates"("positionTitle", "salaryGrade");

-- CreateIndex
CREATE UNIQUE INDEX "career_ranks_qsTemplateId_key" ON "career_ranks"("qsTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "applications_applicantId_vacancyId_key" ON "applications"("applicantId", "vacancyId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "colleges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_ranks" ADD CONSTRAINT "career_ranks_qsTemplateId_fkey" FOREIGN KEY ("qsTemplateId") REFERENCES "qs_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_qsTemplateId_fkey" FOREIGN KEY ("qsTemplateId") REFERENCES "qs_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "colleges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_hrReviewedById_fkey" FOREIGN KEY ("hrReviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_vpaaEndorsedById_fkey" FOREIGN KEY ("vpaaEndorsedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "vacancies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
