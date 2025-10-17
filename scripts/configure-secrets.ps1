# Script de configuration sécurisée des secrets Supabase Edge Functions (Windows)
# Usage: .\scripts\configure-secrets.ps1

param(
    [switch]$SkipConfirm = $false
)

Write-Host "🔐 Configuration Sécurisée des Secrets CassKai" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Supabase CLI est installé
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "✅ Supabase CLI détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI n'est pas installé" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installation via NPM:" -ForegroundColor Yellow
    Write-Host "  npm install -g supabase" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou via Scoop (Windows):" -ForegroundColor Yellow
    Write-Host "  scoop bucket add supabase https://github.com/supabase/scoop-bucket.git" -ForegroundColor White
    Write-Host "  scoop install supabase" -ForegroundColor White
    Write-Host ""
    exit 1
}
Write-Host ""

# Vérifier que l'utilisateur est connecté
Write-Host "Vérification de l'authentification Supabase..." -ForegroundColor Blue
$projectsCheck = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Vous n'êtes pas connecté à Supabase" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Connexion à Supabase..." -ForegroundColor Blue
    supabase login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Échec de la connexion" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Authentifié sur Supabase" -ForegroundColor Green
Write-Host ""

# Vérifier que le projet est lié
if (-not (Test-Path ".supabaserc")) {
    Write-Host "❌ Projet non lié (.supabaserc manquant)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Veuillez d'abord lier votre projet:" -ForegroundColor Yellow
    Write-Host "  supabase link --project-ref smtdtgrymuzwvctattmx" -ForegroundColor White
    Write-Host ""
    exit 1
}
Write-Host "✅ Projet lié" -ForegroundColor Green
Write-Host ""

# Fonction pour demander un secret
function Ask-Secret {
    param(
        [string]$VarName,
        [string]$Description,
        [string]$Example,
        [string]$CurrentValue = ""
    )

    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host $Description -ForegroundColor Blue
    Write-Host "Exemple: $Example" -ForegroundColor Yellow

    if ($CurrentValue) {
        $masked = $CurrentValue.Substring(0, [Math]::Min(10, $CurrentValue.Length)) + "..."
        Write-Host "Valeur actuelle: $masked" -ForegroundColor Green
    }

    Write-Host ""
    $secure = Read-Host "Entrez la valeur pour $VarName (ou laissez vide pour ignorer)" -AsSecureString

    # Convertir SecureString en texte brut
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $value = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

    if ($value) {
        Write-Host "Configuration de $VarName..." -ForegroundColor Blue
        $setCommand = "supabase secrets set `"$VarName=$value`""
        Invoke-Expression $setCommand

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $VarName configuré" -ForegroundColor Green
        } else {
            Write-Host "❌ Échec de la configuration de $VarName" -ForegroundColor Red
        }
    } else {
        Write-Host "⏭️  $VarName ignoré" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Afficher les secrets actuels
Write-Host "📋 Secrets actuellement configurés:" -ForegroundColor Blue
supabase secrets list
Write-Host ""

# Avertissement
if (-not $SkipConfirm) {
    Write-Host "⚠️  IMPORTANT - SÉCURITÉ" -ForegroundColor Red
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host ""
    Write-Host "Ce script va configurer des secrets critiques." -ForegroundColor Yellow
    Write-Host "Assurez-vous d'utiliser de NOUVELLES clés générées, pas celles exposées." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Étapes à faire AVANT d'exécuter ce script:" -ForegroundColor White
    Write-Host "  1. Révoquer l'ancienne clé Stripe dans le Dashboard" -ForegroundColor White
    Write-Host "  2. Révoquer l'ancien secret webhook Stripe" -ForegroundColor White
    Write-Host "  3. Régénérer la Service Role Key Supabase" -ForegroundColor White
    Write-Host ""

    $confirm = Read-Host "Avez-vous révoqué les anciennes clés? (oui/non)"

    if ($confirm -ne "oui") {
        Write-Host ""
        Write-Host "❌ Configuration annulée" -ForegroundColor Red
        Write-Host "Veuillez d'abord révoquer les anciennes clés." -ForegroundColor Yellow
        Write-Host "Voir: SECURITY_CONFIGURATION_GUIDE.md" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Démarrage de la configuration..." -ForegroundColor Green
Write-Host ""

# Configuration des secrets
Ask-Secret -VarName "STRIPE_SECRET_KEY" `
    -Description "Clé secrète Stripe (Test ou Live)" `
    -Example "sk_test_51..."

Ask-Secret -VarName "STRIPE_WEBHOOK_SECRET" `
    -Description "Secret de signature des webhooks Stripe" `
    -Example "whsec_..."

Ask-Secret -VarName "SUPABASE_URL" `
    -Description "URL de votre projet Supabase" `
    -Example "https://smtdtgrymuzwvctattmx.supabase.co"

Ask-Secret -VarName "SUPABASE_SERVICE_ROLE_KEY" `
    -Description "Clé Service Role de Supabase (attention: accès admin)" `
    -Example "eyJhbG..."

# Récapitulatif
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "✅ Configuration terminée!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""

# Afficher les secrets configurés
Write-Host "Secrets actuellement configurés:" -ForegroundColor Blue
supabase secrets list
Write-Host ""

# Prochaines étapes
Write-Host "📝 Prochaines étapes:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Redéployer les Edge Functions:" -ForegroundColor White
Write-Host "   supabase functions deploy stripe-webhook" -ForegroundColor Gray
Write-Host "   supabase functions deploy create-checkout-session" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configurer le webhook Stripe:" -ForegroundColor White
Write-Host "   - URL: https://smtdtgrymuzwvctattmx.supabase.co/functions/v1/stripe-webhook" -ForegroundColor Gray
Write-Host "   - Événements: checkout.session.completed, customer.subscription.*, invoice.*" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Tester la configuration:" -ForegroundColor White
Write-Host "   - Tentative de webhook sans signature (doit retourner 401)" -ForegroundColor Gray
Write-Host "   - Création d'un checkout authentifié (doit réussir)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Auditer les accès:" -ForegroundColor White
Write-Host "   - Vérifier les logs Stripe et Supabase" -ForegroundColor Gray
Write-Host "   - Vérifier qu'aucune transaction suspecte n'a été créée" -ForegroundColor Gray
Write-Host ""
Write-Host "Pour plus de détails, voir: SECURITY_CONFIGURATION_GUIDE.md" -ForegroundColor Green
Write-Host ""
