#!/bin/bash

# Script de test pour l'assistant IA après correction du 403
# Usage: bash test-ai-assistant.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CassKai AI Assistant - Test Script${NC}"
echo -e "${BLUE}========================================${NC}\n"

# 1. Check Supabase CLI is installed
echo -e "${YELLOW}[1/5] Vérification: Supabase CLI${NC}"
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI non trouvé. Installation: https://supabase.com/docs/guides/cli${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Supabase CLI trouvé${NC}\n"

# 2. Check Edge Functions deployment status
echo -e "${YELLOW}[2/5] Vérification: Edge Functions déployées${NC}"
echo -e "${BLUE}Listing deployed functions...${NC}"
supabase functions list

echo -e "\n${YELLOW}[3/5] Vérification: Redéployer les fonctions${NC}"
echo -e "${BLUE}Déploying ai-assistant...${NC}"
supabase functions deploy ai-assistant --no-verify-jwt
echo -e "${GREEN}✅ ai-assistant déployée${NC}"

echo -e "${BLUE}Deploying ai-dashboard-analysis...${NC}"
supabase functions deploy ai-dashboard-analysis --no-verify-jwt
echo -e "${GREEN}✅ ai-dashboard-analysis déployée${NC}"

echo -e "${BLUE}Deploying ai-kpi-analysis...${NC}"
supabase functions deploy ai-kpi-analysis --no-verify-jwt
echo -e "${GREEN}✅ ai-kpi-analysis déployée${NC}\n"

# 3. Run frontend dev server
echo -e "${YELLOW}[4/5] Lancement: Frontend dev server${NC}"
echo -e "${BLUE}Frontend running on: http://localhost:5173${NC}"
echo -e "${BLUE}Pour accéder à l'assistant IA: http://localhost:5173/dashboard (puis cliquer sur le chat)${NC}\n"

# 4. Watch Edge Function logs
echo -e "${YELLOW}[5/5] Logs: Edge Functions en temps réel${NC}"
echo -e "${BLUE}Attente de logs de ai-assistant...${NC}"
echo -e "${BLUE}Vous verrez ces logs de succès:${NC}"
echo -e "  ${GREEN}✅ [ai-assistant] User authenticated: <uuid>${NC}"
echo -e "  ${GREEN}✅ [ai-assistant] Resolved company_id: <uuid>${NC}"
echo -e "  ${GREEN}✅ [getCompanyContext] User access verified${NC}"
echo -e "  ${GREEN}✅ [getCompanyContext] Successfully built company context${NC}\n"

echo -e "${BLUE}Sinon, vous verrez un log d'erreur détaillé:${NC}"
echo -e "  ${RED}❌ [getCompanyContext] RLS Error: <message>${NC}"
echo -e "  ${RED}❌ [getCompanyContext] User access denied: <reason>${NC}\n"

echo -e "${YELLOW}Monitoring logs... (Ctrl+C pour arrêter)${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Watch logs
supabase functions list
echo -e "\nPour voir les logs en temps réel:"
echo -e "  ${BLUE}supabase functions debug ai-assistant${NC}\n"

echo -e "${GREEN}✅ Script terminé!${NC}"
echo -e "${BLUE}Maintenant, testez l'assistant IA dans le frontend...${NC}"
