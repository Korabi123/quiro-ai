-- CreateTable
CREATE TABLE "code_execution" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "testCases" JSONB NOT NULL,
    "problemContent" TEXT,
    "generateHidden" BOOLEAN NOT NULL DEFAULT false,
    "jobStatus" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "jobStage" TEXT,
    "jobError" TEXT,
    "jobEndedAt" TIMESTAMP(3),
    "results" JSONB,
    "summary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "code_execution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "code_execution_userId_createdAt_idx" ON "code_execution"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "code_execution" ADD CONSTRAINT "code_execution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;