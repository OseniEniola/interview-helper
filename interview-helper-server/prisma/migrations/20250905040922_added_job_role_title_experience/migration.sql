-- AlterTable
ALTER TABLE "public"."InterviewSession" ADD COLUMN     "experience_level" TEXT,
ADD COLUMN     "interview_title" TEXT NOT NULL DEFAULT 'Untitled Interview',
ADD COLUMN     "job_role" TEXT;
