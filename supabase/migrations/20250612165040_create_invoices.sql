-- Créer la table invoices manquante
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID, -- Sera lié à third_parties
  invoice_number TEXT,
  amount DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);