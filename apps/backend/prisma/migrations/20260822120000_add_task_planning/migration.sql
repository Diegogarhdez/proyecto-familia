-- Extend existing tasks with the values used by the weekly balancing algorithm.
ALTER TABLE "tasks"
ADD COLUMN IF NOT EXISTS "timeMinutes" DOUBLE PRECISION NOT NULL DEFAULT 30,
ADD COLUMN IF NOT EXISTS "effort" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "weeklyFrequency" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "preferredUserId" TEXT;

CREATE TABLE IF NOT EXISTS "task_plans" (
    "id" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" TEXT NOT NULL,
    CONSTRAINT "task_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "task_assignments" (
    "id" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "wasPreferred" BOOLEAN NOT NULL DEFAULT false,
    "planId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "assignedUserId" TEXT NOT NULL,
    CONSTRAINT "task_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "task_plans_familyId_weekStart_key" ON "task_plans"("familyId", "weekStart");
CREATE INDEX IF NOT EXISTS "task_plans_familyId_weekStart_idx" ON "task_plans"("familyId", "weekStart");
CREATE UNIQUE INDEX IF NOT EXISTS "task_assignments_planId_taskId_key" ON "task_assignments"("planId", "taskId");
CREATE INDEX IF NOT EXISTS "task_assignments_planId_assignedUserId_idx" ON "task_assignments"("planId", "assignedUserId");
CREATE INDEX IF NOT EXISTS "tasks_familyId_idx" ON "tasks"("familyId");
CREATE INDEX IF NOT EXISTS "tasks_preferredUserId_idx" ON "tasks"("preferredUserId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_preferredUserId_fkey') THEN
    ALTER TABLE "tasks" ADD CONSTRAINT "tasks_preferredUserId_fkey"
    FOREIGN KEY ("preferredUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_plans_familyId_fkey') THEN
    ALTER TABLE "task_plans" ADD CONSTRAINT "task_plans_familyId_fkey"
    FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_assignments_planId_fkey') THEN
    ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "task_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_assignments_taskId_fkey') THEN
    ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_assignments_assignedUserId_fkey') THEN
    ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_assignedUserId_fkey"
    FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
