-- Add quantity to shopping items
ALTER TABLE "ShoppingItem"
    ALTER COLUMN "quantity" SET DEFAULT 1,
    ADD CONSTRAINT "quantity_max_check"
        CHECK ("quantity" <= 999);
