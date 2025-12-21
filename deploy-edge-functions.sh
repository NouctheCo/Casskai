#!/bin/bash

# Script de déploiement des Edge Functions Supabase pour Stripe
# Usage: ./deploy-edge-functions.sh

set -e

echo "========================================"
echo "  Déploiement Edge Functions Stripe"
echo "========================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Vérifier que Supabase CLI est installé
echo -e "${YELLOW}[CHECK] Vérification de Supabase CLI...${NC}"
if ! command -v npx &> /dev/null; then
    echo -e "${RED}[ERROR] npx n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] Supabase CLI disponible${NC}"
echo ""

# Liste des Edge Functions à déployer
functions=(
    "create-checkout-session"
    "stripe-webhook"
    "create-portal-session"
)

# Compteurs
success_count=0
fail_count=0

for func in "${functions[@]}"; do
    echo "========================================"
    echo -e "${YELLOW}[DEPLOY] Déploiement de '$func'...${NC}"

    # Vérifier que le dossier existe
    func_path="supabase/functions/$func"
    if [ ! -d "$func_path" ]; then
        echo -e "${RED}[ERROR] Le dossier '$func_path' n'existe pas${NC}"
        ((fail_count++))
        continue
    fi

    # Déployer la fonction
    if npx supabase functions deploy "$func"; then
        echo -e "${GREEN}[SUCCESS] '$func' déployée avec succès${NC}"
        ((success_count++))
    else
        echo -e "${RED}[ERROR] Échec du déploiement de '$func'${NC}"
        ((fail_count++))
    fi

    echo ""
done

# Résumé
echo "========================================"
echo "  RÉSUMÉ DU DÉPLOIEMENT"
echo "========================================"
echo -e "${GREEN}✅ Succès: $success_count/${#functions[@]}${NC}"

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}❌ Échecs: $fail_count/${#functions[@]}${NC}"
else
    echo -e "${RED}❌ Échecs: $fail_count/${#functions[@]}${NC}"
fi
echo ""

if [ $success_count -eq ${#functions[@]} ]; then
    echo -e "${GREEN}[SUCCESS] Toutes les Edge Functions ont été déployées avec succès!${NC}"
    echo ""
    echo -e "${YELLOW}Prochaines étapes:${NC}"
    echo "1. Configurer les secrets Supabase (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)"
    echo "2. Configurer le webhook dans Stripe Dashboard"
    echo "3. Appliquer la migration SQL pour créer la table subscriptions"
    echo "4. Tester le flux de paiement"
    echo ""
    echo -e "${CYAN}Voir STRIPE_SETUP.md pour plus de détails${NC}"
else
    echo -e "${YELLOW}[WARNING] Certaines fonctions n'ont pas pu être déployées${NC}"
    echo "Vérifiez les erreurs ci-dessus et réessayez"
    exit 1
fi
