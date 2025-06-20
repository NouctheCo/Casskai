/*
  # Add website and contact fields to third_parties

  1. Changes
    - Add `website` column to `third_parties` table
    - Add `contact_name` column to `third_parties` table
*/

-- Add new columns to third_parties table
ALTER TABLE third_parties 
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS contact_name text;