-- Add quantity to shopping items
ALTER TABLE "ShoppingItem"
ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1 CHECK ("quantity" < 1000);
