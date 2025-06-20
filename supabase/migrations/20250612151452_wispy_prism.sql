/*
  # Add support for FEC import

  1. New Tables
    - None

  2. Changes
    - Add `imported_from_fec` column to `journal_entries` table
    - Add `imported_from_fec` column to `accounts` table
    - Add `imported_from_fec` column to `journals` table
    - Add `original_fec_data` column to `journal_entries` table to store original FEC data
    - Add `fec_journal_code` and `fec_entry_num` columns to `journal_entries` table for traceability
*/

-- Add columns to journal_entries table
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS imported_from_fec BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS original_fec_data JSONB,
ADD COLUMN IF NOT EXISTS fec_journal_code TEXT,
ADD COLUMN IF NOT EXISTS fec_entry_num TEXT;

-- Add columns to accounts table
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS imported_from_fec BOOLEAN DEFAULT FALSE;

-- Add columns to journals table
ALTER TABLE journals
ADD COLUMN IF NOT EXISTS imported_from_fec BOOLEAN DEFAULT FALSE;

-- Create index for faster lookup of FEC imported entries
CREATE INDEX IF NOT EXISTS idx_journal_entries_fec_import 
ON journal_entries(fec_journal_code, fec_entry_num) 
WHERE imported_from_fec = TRUE;

-- Create function to check if an entry with the same FEC reference already exists
CREATE OR REPLACE FUNCTION check_fec_entry_exists(
  p_company_id UUID,
  p_fec_journal_code TEXT,
  p_fec_entry_num TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM journal_entries 
    WHERE company_id = p_company_id 
      AND fec_journal_code = p_fec_journal_code 
      AND fec_entry_num = p_fec_entry_num
      AND imported_from_fec = TRUE
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$ LANGUAGE plpgsql;