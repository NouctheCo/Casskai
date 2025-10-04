#!/bin/bash

# Script de configuration sécurisée des secrets Supabase Edge Functions
# Usage: ./scripts/configure-secrets.sh

set -e

echo "🔐 Configuration Sécurisée des Secrets CassKai"
echo "=============================================="
echo ""

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI n'est pas installé${NC}"
    echo ""
    echo "Installation via NPM:"
    echo "  npm install -g supabase"
    echo ""
    echo "Ou via Homebrew (macOS/Linux):"
    echo "  brew install supabase/tap/supabase"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI détecté${NC}"
echo ""

# Vérifier que l'utilisateur est connecté
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vous n'êtes pas connecté à Supabase${NC}"
    echo ""
    echo "Connexion à Supabase..."
    supabase login
    echo ""
fi

echo -e "${GREEN}✅ Authentifié sur Supabase${NC}"
echo ""

# Vérifier que le projet est lié
if [ ! -f ".supabaserc" ]; then
    echo -e "${RED}❌ Projet non lié (.supabaserc manquant)${NC}"
    echo ""
    echo "Veuillez d'abord lier votre projet:"
    echo "  supabase link --project-ref smtdtgrymuzwvctattmx"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Projet lié${NC}"
echo ""

# Fonction pour demander un secret de manière sécurisée
ask_secret() {
    local var_name=$1
    local description=$2
    local example=$3
    local current_value=$4

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$description${NC}"
    echo -e "${YELLOW}Exemple: $example${NC}"

    if [ ! -z "$current_value" ]; then
        echo -e "${GREEN}Valeur actuelle: ${current_value:0:10}...${NC}"
    fi

    echo ""
    read -sp "Entrez la valeur pour $var_name (ou appuyez sur Entrée pour ignorer): " value
    echo ""

    if [ ! -z "$value" ]; then
        echo "Configuration de $var_name..."
        supabase secrets set "$var_name=$value"
        echo -e "${GREEN}✅ $var_name configuré${NC}"
    else
        echo -e "${YELLOW}⏭️  $var_name ignoré${NC}"
    fi
    echo ""
}

# Afficher les secrets actuels
echo -e "${BLUE}📋 Secrets actuellement configurés:${NC}"
supabase secrets list
echo ""

# Avertissement
echo -e "${RED}⚠️  IMPORTANT - SÉCURITÉ${NC}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Ce script va configurer des secrets critiques."
echo "Assurez-vous d'utiliser de NOUVELLES clés générées, pas celles exposées."
echo ""
echo "Étapes à faire AVANT d'exécuter ce script:"
echo "  1. Révoquer l'ancienne clé Stripe dans le Dashboard"
echo "  2. Révoquer l'ancien secret webhook Stripe"
echo "  3. Régénérer la Service Role Key Supabase"
echo ""
read -p "Avez-vous révoqué les anciennes clés? (oui/non): " confirm

if [ "$confirm" != "oui" ]; then
    echo ""
    echo -e "${RED}❌ Configuration annulée${NC}"
    echo "Veuillez d'abord révoquer les anciennes clés."
    echo "Voir: SECURITY_CONFIGURATION_GUIDE.md"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Démarrage de la configuration...${NC}"
echo ""

# Configuration des secrets
ask_secret "STRIPE_SECRET_KEY" \
    "Clé secrète Stripe (Test ou Live)" \
    "sk_test_51..." \
    ""

ask_secret "STRIPE_WEBHOOK_SECRET" \
    "Secret de signature des webhooks Stripe" \
    "whsec_..." \
    ""

ask_secret "SUPABASE_URL" \
    "URL de votre projet Supabase" \
    "https://smtdtgrymuzwvctattmx.supabase.co" \
    ""

ask_secret "SUPABASE_SERVICE_ROLE_KEY" \
    "Clé Service Role de Supabase (attention: accès admin)" \
    "eyJhbG..." \
    ""

# Récapitulatif
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Configuration terminée!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Afficher les secrets configurés
echo "Secrets actuellement configurés:"
supabase secrets list
echo ""

# Prochaines étapes
echo -e "${YELLOW}📝 Prochaines étapes:${NC}"
echo ""
echo "1. Redéployer les Edge Functions:"
echo "   supabase functions deploy stripe-webhook"
echo "   supabase functions deploy create-checkout-session"
echo ""
echo "2. Configurer le webhook Stripe:"
echo "   - URL: https://smtdtgrymuzwvctattmx.supabase.co/functions/v1/stripe-webhook"
echo "   - Événements: checkout.session.completed, customer.subscription.*, invoice.*"
echo ""
echo "3. Tester la configuration:"
echo "   - Tentative de webhook sans signature (doit retourner 401)"
echo "   - Création d'un checkout authentifié (doit réussir)"
echo ""
echo "4. Auditer les accès:"
echo "   - Vérifier les logs Stripe et Supabase"
echo "   - Vérifier qu'aucune transaction suspecte n'a été créée"
echo ""
echo -e "${GREEN}Pour plus de détails, voir: SECURITY_CONFIGURATION_GUIDE.md${NC}"
echo ""
