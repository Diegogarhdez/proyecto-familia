-- Extend existing tasks with the values used by the weekly balancing algorithm.
ALTER TABLE "tasks"
ADD COLUMN "timeMinutes" DOUBLE PRECISION NOT NULL DEFAULT 30,
ADD COLUMN "effort" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "weeklyFrequency" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "preferredUserId" TEXT;

CREATE TABLE "task_plans" (
    "id" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" TEXT NOT NULL,
    CONSTRAINT "task_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "task_assignments" (
    "id" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "wasPreferred" BOOLEAN NOT NULL DEFAULT false,
    "planId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "assignedUserId" TEXT NOT NULL,
    CONSTRAINT "task_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "task_plans_familyId_weekStart_key" ON "task_plans"("familyId", "weekStart");
CREATE INDEX "task_plans_familyId_weekStart_idx" ON "task_plans"("familyId", "weekStart");
CREATE UNIQUE INDEX "task_assignments_planId_taskId_key" ON "task_assignments"("planId", "taskId");
CREATE INDEX "task_assignments_planId_assignedUserId_idx" ON "task_assignments"("planId", "assignedUserId");
CREATE INDEX "tasks_familyId_idx" ON "tasks"("familyId");
CREATE INDEX "tasks_preferredUserId_idx" ON "tasks"("preferredUserId");

ALTER TABLE "tasks" ADD CONSTRAINT "tasks_preferredUserId_fkey"
FOREIGN KEY ("preferredUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "task_plans" ADD CONSTRAINT "task_plans_familyId_fkey"
FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_planId_fkey"
FOREIGN KEY ("planId") REFERENCES "task_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_taskId_fkey"
FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_assignedUserId_fkey"
FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
