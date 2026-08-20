-- CreateTable
CREATE TABLE "ideas_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" TEXT NOT NULL,

    CONSTRAINT "ideas_plans_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ideas_plans" ADD CONSTRAINT "ideas_plans_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
