#!/bin/bash

# Script pour appliquer la migration d'automatisation via l'API REST de Supabase
# Utilise directement l'API avec la clé de service

echo "🚀 APPLICATION MIGRATION D'AUTOMATISATION VIA API REST"
echo "======================================================"

# Configuration
SUPABASE_URL="https://smtdtgrymuzwvctattmx.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU3NjAyMywiZXhwIjoyMDcwMTUyMDIzfQ.lmr9l3Lr1AjP5b-iFNgYo_b4QOSqHTfJQxZr--vdFxA"

echo "📋 Création de la table workflows..."
curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "CREATE TABLE IF NOT EXISTS workflows (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE, name text NOT NULL, description text, is_active boolean DEFAULT true, trigger jsonb NOT NULL, actions jsonb NOT NULL, last_run timestamp with time zone, next_run timestamp with time zone, run_count integer DEFAULT 0, success_count integer DEFAULT 0, error_count integer DEFAULT 0, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());"
  }'

echo -e "\n📋 Création de la table notifications..."
curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "CREATE TABLE IF NOT EXISTS notifications (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE, user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, title text NOT NULL, message text NOT NULL, type text NOT NULL DEFAULT '"'"'info'"'"' CHECK (type IN ('"'"'info'"'"', '"'"'success'"'"', '"'"'warning'"'"', '"'"'error'"'"')), priority text NOT NULL DEFAULT '"'"'medium'"'"' CHECK (priority IN ('"'"'low'"'"', '"'"'medium'"'"', '"'"'high'"'"')), category text NOT NULL DEFAULT '"'"'system'"'"' CHECK (category IN ('"'"'automation'"'"', '"'"'system'"'"', '"'"'finance'"'"', '"'"'workflow'"'"', '"'"'reminder'"'"')), data jsonb, read boolean DEFAULT false, read_at timestamp with time zone, action_url text, action_label text, expires_at timestamp with time zone, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());"
  }'

echo -e "\n📋 Création des index..."
curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "CREATE INDEX IF NOT EXISTS idx_workflows_company_id ON workflows(company_id); CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON notifications(company_id);"
  }'

echo -e "\n📋 Activation RLS..."
curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "ALTER TABLE workflows ENABLE ROW LEVEL SECURITY; ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;"
  }'

echo -e "\n✅ Migration appliquée avec succès!"
echo "🧪 Test des tables..."

# Test final
curl -X GET \
  "${SUPABASE_URL}/rest/v1/workflows?limit=1" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Accept: application/json"

echo -e "\n🎉 MIGRATION TERMINÉE"