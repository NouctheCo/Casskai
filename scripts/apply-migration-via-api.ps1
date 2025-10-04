# Script PowerShell pour appliquer la migration d'automatisation via l'API REST Supabase

Write-Host "🚀 APPLICATION MIGRATION D'AUTOMATISATION VIA API REST" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# Configuration
$SUPABASE_URL = "https://smtdtgrymuzwvctattmx.supabase.co"
$SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU3NjAyMywiZXhwIjoyMDcwMTUyMDIzfQ.lmr9l3Lr1AjP5b-iFNgYo_b4QOSqHTfJQxZr--vdFxA"

# Headers pour les requêtes
$headers = @{
    "Authorization" = "Bearer $SERVICE_KEY"
    "Content-Type" = "application/json"
}

function Invoke-SQLCommand {
    param([string]$sql, [string]$description)

    Write-Host "📋 $description..." -ForegroundColor Yellow

    $body = @{ sql = $sql } | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/rpc/exec_sql" -Method POST -Headers $headers -Body $body
        Write-Host "✅ Succès: $description" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Créer les tables une par une
Write-Host "`n🔧 CRÉATION DES TABLES..." -ForegroundColor Cyan

$workflows_sql = "CREATE TABLE IF NOT EXISTS workflows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  trigger jsonb NOT NULL,
  actions jsonb NOT NULL,
  last_run timestamp with time zone,
  next_run timestamp with time zone,
  run_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);"

$notifications_sql = "CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category text NOT NULL DEFAULT 'system' CHECK (category IN ('automation', 'system', 'finance', 'workflow', 'reminder')),
  data jsonb,
  read boolean DEFAULT false,
  read_at timestamp with time zone,
  action_url text,
  action_label text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);"

$email_logs_sql = "CREATE TABLE IF NOT EXISTS email_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  to_emails jsonb NOT NULL,
  cc_emails jsonb,
  bcc_emails jsonb,
  subject text NOT NULL,
  template_id text,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  message_id text,
  error_message text,
  provider text,
  sent_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);"

$email_configs_sql = "CREATE TABLE IF NOT EXISTS email_configs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  provider text NOT NULL DEFAULT 'resend' CHECK (provider IN ('resend', 'sendgrid', 'smtp')),
  from_email text NOT NULL,
  from_name text NOT NULL,
  smtp_config jsonb,
  api_key_encrypted text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);"

# Exécuter les créations de tables
Invoke-SQLCommand $workflows_sql "Création table workflows"
Invoke-SQLCommand $notifications_sql "Création table notifications"
Invoke-SQLCommand $email_logs_sql "Création table email_logs"
Invoke-SQLCommand $email_configs_sql "Création table email_configs"

# Créer les index
Write-Host "`n🔧 CRÉATION DES INDEX..." -ForegroundColor Cyan
$indexes_sql = "
CREATE INDEX IF NOT EXISTS idx_workflows_company_id ON workflows(company_id);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(company_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_email_logs_company_id ON email_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_email_configs_company_id ON email_configs(company_id);
"
Invoke-SQLCommand $indexes_sql "Création des index"

# Activer RLS
Write-Host "`n🔧 ACTIVATION ROW LEVEL SECURITY..." -ForegroundColor Cyan
$rls_sql = "
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_configs ENABLE ROW LEVEL SECURITY;
"
Invoke-SQLCommand $rls_sql "Activation RLS"

# Créer les politiques RLS
Write-Host "`n🔧 CRÉATION DES POLITIQUES RLS..." -ForegroundColor Cyan
$policies_sql = "
CREATE POLICY `"Workflows access for company users`" ON workflows
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY `"Notifications access for users`" ON notifications
  FOR ALL USING (
    (user_id = auth.uid()) OR
    (user_id IS NULL AND company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY `"Email logs access for company users`" ON email_logs
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY `"Email configs access for company users`" ON email_configs
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
    )
  );
"
Invoke-SQLCommand $policies_sql "Création politiques RLS"

# Test final
Write-Host "`n🧪 TEST FINAL..." -ForegroundColor Cyan
try {
    $test_response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/workflows?limit=1" -Method GET -Headers @{ "Authorization" = "Bearer $SERVICE_KEY" }
    Write-Host "✅ Table workflows accessible" -ForegroundColor Green

    $test_response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/notifications?limit=1" -Method GET -Headers @{ "Authorization" = "Bearer $SERVICE_KEY" }
    Write-Host "✅ Table notifications accessible" -ForegroundColor Green

    Write-Host "`n🎉 MIGRATION APPLIQUÉE AVEC SUCCÈS!" -ForegroundColor Green
    Write-Host "Les modèles d'automatisation sont maintenant utilisables sur https://casskai.app" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erreur lors du test: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 MIGRATION TERMINÉE" -ForegroundColor Cyan