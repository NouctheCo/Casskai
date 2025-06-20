/*
  # Add website and contact fields to third_parties

  1. New Columns
    - `website` - Store the third party's website URL
    - `contact_name` - Store the main contact person's name

  2. Changes
    - Added two new columns to the third_parties table
*/

-- Add new columns to third_parties table
ALTER TABLE third_parties 
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS contact_name text;