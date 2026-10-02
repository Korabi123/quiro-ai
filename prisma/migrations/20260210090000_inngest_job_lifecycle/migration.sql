-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('IDLE', 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- AlterEnum
ALTER TYPE "MeetingStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "meeting" ADD COLUMN     "jobError" TEXT,
ADD COLUMN     "jobStage" TEXT,
ADD COLUMN     "jobStatus" "JobStatus" NOT NULL DEFAULT 'IDLE';

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "jobEndedAt" TIMESTAMP(3),
ADD COLUMN     "jobError" TEXT,
ADD COLUMN     "jobStage" TEXT,
ADD COLUMN     "jobStartedAt" TIMESTAMP(3),
ADD COLUMN     "jobStatus" "JobStatus" NOT NULL DEFAULT 'IDLE';

-- AlterTable
ALTER TABLE "CodingAttempt" ADD COLUMN     "gradeError" TEXT,
ADD COLUMN     "gradeStage" TEXT,
ADD COLUMN     "gradeStatus" "JobStatus" NOT NULL DEFAULT 'IDLE',
ADD COLUMN     "testError" TEXT,
ADD COLUMN     "testStage" TEXT,
ADD COLUMN     "testStatus" "JobStatus" NOT NULL DEFAULT 'IDLE';

-- CreateIndex
CREATE INDEX "Report_userId_jobStatus_idx" ON "Report"("userId", "jobStatus");

-- CreateIndex
CREATE INDEX "CodingAttempt_userId_testStatus_idx" ON "CodingAttempt"("userId", "testStatus");

-- CreateIndex
CREATE INDEX "CodingAttempt_userId_gradeStatus_idx" ON "CodingAttempt"("userId", "gradeStatus");