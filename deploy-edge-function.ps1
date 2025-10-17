# Script de déploiement de l'Edge Function create-company-onboarding
# Ce script déploie la fonction sur Supabase

Write-Host "🚀 Déploiement de l'Edge Function create-company-onboarding..." -ForegroundColor Cyan

# Vérifier que Supabase CLI est installé
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI n'est pas installé. Installation..." -ForegroundColor Red
    Write-Host "Exécutez: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Vérifier que le projet Supabase est lié
Write-Host "📋 Vérification du lien avec le projet Supabase..." -ForegroundColor Yellow
$projectInfo = supabase projects list 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Impossible de lister les projets Supabase." -ForegroundColor Red
    Write-Host "Assurez-vous d'être connecté avec 'supabase login'" -ForegroundColor Yellow
    exit 1
}

# Déployer la fonction
Write-Host "📦 Déploiement de la fonction..." -ForegroundColor Yellow
supabase functions deploy create-company-onboarding --project-ref smtdtgrymuzwvctattmx

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Edge Function déployée avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 URL de la fonction:" -ForegroundColor Cyan
    Write-Host "https://smtdtgrymuzwvctattmx.supabase.co/functions/v1/create-company-onboarding" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ CORS configuré pour: https://casskai.app" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors du déploiement de la fonction" -ForegroundColor Red
    exit 1
}
