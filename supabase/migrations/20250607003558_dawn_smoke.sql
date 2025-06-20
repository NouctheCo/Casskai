-- Add new columns to third_parties table
ALTER TABLE third_parties 
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS contact_name text;