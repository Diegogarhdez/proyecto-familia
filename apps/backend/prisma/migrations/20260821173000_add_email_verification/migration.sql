ALTER TABLE "users"
ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "verificationCodeHash" TEXT,
ADD COLUMN "verificationCodeExpiresAt" TIMESTAMP(3);