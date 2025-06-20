/*
  # Add foreign key relationship between invoices and third_parties

  1. Changes
    - Add foreign key constraint from invoices.client_id to third_parties.id
    - This will enable Supabase to properly join these tables in queries

  2. Security
    - No RLS changes needed as both tables already have proper policies
*/

-- Add foreign key constraint between invoices.client_id and third_parties.id
DO $$
BEGIN
  -- Check if the foreign key constraint doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'invoices_client_id_fkey' 
    AND table_name = 'invoices'
  ) THEN
    ALTER TABLE invoices 
    ADD CONSTRAINT invoices_client_id_fkey 
    FOREIGN KEY (client_id) REFERENCES third_parties(id) ON DELETE SET NULL;
  END IF;
END $$;