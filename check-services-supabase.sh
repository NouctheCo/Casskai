#!/bin/bash

# Script de vérification des services critiques et leur utilisation de Supabase
# CassKai - Diagnostic des services

echo "🔍 Vérification des services critiques CassKai"
echo "=============================================="
echo ""

SERVICES=(
  "journalEntriesService.ts"
  "invoicingService.ts"
  "crmService.ts"
  "hrService.ts"
  "purchasesService.ts"
  "projectsService.ts"
  "chartOfAccountsService.ts"
  "reportsService.ts"
)

echo "📊 Services à vérifier:"
for service in "${SERVICES[@]}"; do
  echo "  - $service"
done
echo ""

echo "🔎 Analyse de l'utilisation de Supabase..."
echo "=============================================="
echo ""

for service in "${SERVICES[@]}"; do
  SERVICE_PATH="src/services/$service"

  if [ ! -f "$SERVICE_PATH" ]; then
    echo "❌ $service - FICHIER NON TROUVÉ"
    continue
  fi

  echo "📄 $service"
  echo "-------------------------------------------"

  # Vérifier l'import de supabase
  SUPABASE_IMPORT=$(grep -c "from.*supabase" "$SERVICE_PATH" || echo "0")
  if [ "$SUPABASE_IMPORT" -gt 0 ]; then
    echo "  ✅ Import Supabase: OUI"
  else
    echo "  ❌ Import Supabase: NON"
  fi

  # Compter les opérations CRUD
  SELECT_COUNT=$(grep -c "\.select(" "$SERVICE_PATH" || echo "0")
  INSERT_COUNT=$(grep -c "\.insert(" "$SERVICE_PATH" || echo "0")
  UPDATE_COUNT=$(grep -c "\.update(" "$SERVICE_PATH" || echo "0")
  DELETE_COUNT=$(grep -c "\.delete(" "$SERVICE_PATH" || echo "0")

  echo "  📊 Opérations Supabase:"
  echo "     - SELECT: $SELECT_COUNT"
  echo "     - INSERT: $INSERT_COUNT"
  echo "     - UPDATE: $UPDATE_COUNT"
  echo "     - DELETE: $DELETE_COUNT"

  TOTAL_OPS=$((SELECT_COUNT + INSERT_COUNT + UPDATE_COUNT + DELETE_COUNT))

  if [ "$TOTAL_OPS" -eq 0 ]; then
    echo "  ⚠️  AUCUNE opération Supabase détectée!"
  else
    echo "  ✅ Total: $TOTAL_OPS opérations"
  fi

  # Vérifier l'utilisation d'auditService
  AUDIT_IMPORT=$(grep -c "auditService" "$SERVICE_PATH" || echo "0")
  if [ "$AUDIT_IMPORT" -gt 0 ]; then
    echo "  ✅ Audit logging: IMPLÉMENTÉ"
  else
    echo "  ❌ Audit logging: NON IMPLÉMENTÉ"
  fi

  echo ""
done

echo ""
echo "=============================================="
echo "✅ Vérification terminée"
echo ""
echo "💡 Prochaines étapes:"
echo "  1. Exécuter le diagnostic de connectivité: npm run diagnostic"
echo "  2. Implémenter l'audit logging dans les services manquants"
echo "  3. Tester chaque module manuellement dans l'interface"
