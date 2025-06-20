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