/*
  # Add update_company_module function

  1. New Functions
    - `update_company_module` - RPC function to safely update company modules

  2. Purpose
    - Provides a safe way to update company modules without using SET in a non-volatile function
    - Fixes the error: "SET is not allowed in a non-volatile function"
*/

-- Create function to update company modules
CREATE OR REPLACE FUNCTION update_company_module(
  p_company_id UUID,
  p_module_key TEXT,
  p_is_enabled BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the record exists
  IF EXISTS (
    SELECT 1 FROM company_modules 
    WHERE company_id = p_company_id AND module_key = p_module_key
  ) THEN
    -- Update existing record
    UPDATE company_modules
    SET is_enabled = p_is_enabled, updated_at = now()
    WHERE company_id = p_company_id AND module_key = p_module_key;
  ELSE
    -- Insert new record
    INSERT INTO company_modules (company_id, module_key, is_enabled)
    VALUES (p_company_id, p_module_key, p_is_enabled);
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_company_module TO authenticated;