-- Add quantity to shopping items
ALTER TABLE "ShoppingItem"
ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1 ADD CONSTRAINT "price_max_check" CHECK (price <= 10000);
