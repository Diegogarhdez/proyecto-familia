-- Normalize existing addresses before enforcing case-insensitive uniqueness.
UPDATE "users"
SET "email" = LOWER(BTRIM("email"));

CREATE UNIQUE INDEX "users_email_lower_key"
ON "users" (LOWER("email"));