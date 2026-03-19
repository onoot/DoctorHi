-- Add price column to units table (PKR), optional decimal
ALTER TABLE units
  ADD COLUMN price DECIMAL(15,2) DEFAULT NULL;

-- You may run this SQL in your DB to add the new column for price.
