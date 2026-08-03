-- Add quantity to shopping items
ALTER TABLE "ShoppingItem"
ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;
