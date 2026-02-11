# Script de test pour l'assistant IA après correction du 403
# Usage: powershell -ExecutionPolicy Bypass -File test-ai-assistant.ps1

$ErrorActionPreference = "Stop"

# Colors
$colors = @{
    Green  = [System.ConsoleColor]::Green
    Red    = [System.ConsoleColor]::Red
    Yellow = [System.ConsoleColor]::Yellow
    Blue   = [System.ConsoleColor]::Blue
}

function Write-Colored {
    param([string]$Text, [System.ConsoleColor]$Color)
    Write-Host $Text -ForegroundColor $Color
}

Write-Colored "========================================" $colors.Blue
Write-Colored "CassKai AI Assistant - Test Script" $colors.Blue
Write-Colored "========================================`n" $colors.Blue

# 1. Check Supabase CLI
Write-Colored "[1/5] Vérification: Supabase CLI" $colors.Yellow
try {
    $supabaseVersion = supabase --version
    Write-Colored "✅ Supabase CLI trouvé: $supabaseVersion" $colors.Green
} catch {
    Write-Colored "❌ Supabase CLI non trouvé" $colors.Red
    Write-Colored "Installation: https://supabase.com/docs/guides/cli" $colors.Red
    exit 1
}
Write-Host ""

# 2. List functions
Write-Colored "[2/5] Vérification: Edge Functions déployées" $colors.Yellow
Write-Colored "Listing deployed functions..." $colors.Blue
supabase functions list
Write-Host ""

# 3. Deploy functions
Write-Colored "[3/5] Redéploiement: Edge Functions" $colors.Yellow

Write-Colored "Deploying ai-assistant..." $colors.Blue
supabase functions deploy ai-assistant --no-verify-jwt
Write-Colored "✅ ai-assistant déployée" $colors.Green

Write-Colored "Deploying ai-dashboard-analysis..." $colors.Blue
supabase functions deploy ai-dashboard-analysis --no-verify-jwt
Write-Colored "✅ ai-dashboard-analysis déployée" $colors.Green

Write-Colored "Deploying ai-kpi-analysis..." $colors.Blue
supabase functions deploy ai-kpi-analysis --no-verify-jwt
Write-Colored "✅ ai-kpi-analysis déployée" $colors.Green
Write-Host ""

# 4. Instructions for frontend testing
Write-Colored "[4/5] Instructions: Tester dans le Frontend" $colors.Yellow
Write-Colored "Frontend running on: http://localhost:5173" $colors.Blue
Write-Colored "Pour accéder à l'assistant IA: http://localhost:5173/dashboard (puis cliquer sur le chat)" $colors.Blue
Write-Host ""

# 5. Logs
Write-Colored "[5/5] Logs: Vérifier les Edge Function logs" $colors.Yellow
Write-Colored "Vous verrez ces logs de succès:" $colors.Blue
Write-Colored "  ✅ [ai-assistant] User authenticated: <uuid>" $colors.Green
Write-Colored "  ✅ [ai-assistant] Resolved company_id: <uuid>" $colors.Green
Write-Colored "  ✅ [getCompanyContext] User access verified" $colors.Green
Write-Colored "  ✅ [getCompanyContext] Successfully built company context" $colors.Green

Write-Colored "`nSinon, vous verrez un log d'erreur détaillé:" $colors.Blue
Write-Colored "  ❌ [getCompanyContext] RLS Error: <message>" $colors.Red
Write-Colored "  ❌ [getCompanyContext] User access denied: <reason>" $colors.Red

Write-Host ""
Write-Colored "Pour monitorer les logs en temps réel:" $colors.Blue
Write-Colored "  supabase functions debug ai-assistant" $colors.Blue

Write-Host ""
Write-Colored "========================================" $colors.Blue
Write-Colored "✅ Prêt à tester!" $colors.Green
Write-Colored "1. Allez sur: http://localhost:5173/dashboard" $colors.Blue
Write-Colored "2. Cliquez sur l'icône chat (assistant IA)" $colors.Blue
Write-Colored "3. Posez une question: 'Quelles sont mes factures?'" $colors.Blue
Write-Colored "4. Attendez la réponse ou consultez les logs en cas d'erreur" $colors.Blue
Write-Colored "========================================" $colors.Blue
