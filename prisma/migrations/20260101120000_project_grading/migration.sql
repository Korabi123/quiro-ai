-- CreateEnum
CREATE TYPE "GradeRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "FindingSeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL,
    "githubId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT,
    "defaultBranch" TEXT NOT NULL DEFAULT 'main',
    "isFork" BOOLEAN NOT NULL DEFAULT false,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "pushedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "status" "GradeRunStatus" NOT NULL DEFAULT 'PENDING',
    "stage" TEXT,
    "overallScore" INTEGER,
    "letterGrade" TEXT,
    "summary" TEXT,
    "grade" JSONB,
    "analysis" JSONB,
    "error" TEXT,
    "durationMs" INTEGER,
    "llmCalls" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "GradeRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeFinding" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" "FindingSeverity" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "fix" TEXT,
    "path" TEXT,
    "line" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeFinding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Repository_userId_idx" ON "Repository"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_userId_githubId_key" ON "Repository"("userId", "githubId");

-- CreateIndex
CREATE INDEX "GradeRun_userId_createdAt_idx" ON "GradeRun"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GradeRun_status_idx" ON "GradeRun"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GradeRun_repositoryId_commitSha_key" ON "GradeRun"("repositoryId", "commitSha");

-- CreateIndex
CREATE INDEX "GradeFinding_runId_idx" ON "GradeFinding"("runId");

-- CreateIndex
CREATE INDEX "GradeFinding_severity_idx" ON "GradeFinding"("severity");

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeRun" ADD CONSTRAINT "GradeRun_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeRun" ADD CONSTRAINT "GradeRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeFinding" ADD CONSTRAINT "GradeFinding_runId_fkey" FOREIGN KEY ("runId") REFERENCES "GradeRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

