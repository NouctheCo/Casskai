# 🎬 SCRIPT EXÉCUTION: Commandes Exactes à Lancer

**Copy-paste ces commandes directement dans votre terminal**

---

## ⚡ OPTION RAPIDE (5 MIN)

```bash
# 1. Redéployer les 3 functions
supabase functions deploy ai-assistant
supabase functions deploy ai-dashboard-analysis
supabase functions deploy ai-kpi-analysis

# 2. Vérifier le déploiement
supabase functions list

# 3. Ouvrir le frontend (dans une nouvelle fenêtre terminal)
npm run dev

# 4. Allez sur http://localhost:5173/dashboard
# 5. Cliquez sur Assistant IA (icône chat)
# 6. Posez une question: "Quelles sont mes factures?"

# 7. Dans un autre terminal, regarder les logs
supabase functions debug ai-assistant --tail
```

---

## 📋 OPTION COMPLÈTE (15 MIN)

### **Étape 1: Vérifier les changements**

```bash
# Vérifier que ai-assistant a la validation du token
grep -A 5 "Validate token is not empty" supabase/functions/ai-assistant/index.ts

# Vérifier que ai-dashboard-analysis utilise maybeSingle
grep "maybeSingle()" supabase/functions/ai-dashboard-analysis/index.ts

# Vérifier que ai-kpi-analysis utilise maybeSingle
grep "maybeSingle()" supabase/functions/ai-kpi-analysis/index.ts
```

**Expected:** Tous les patterns trouvés

---

### **Étape 2: Compiler et vérifier les types**

```bash
# Type checking
npm run type-check

# Expected: No errors
```

---

### **Étape 3: Redéployer (avec vérification)**

```bash
# Terminal 1: Vérifier la connexion Supabase
supabase status

# Terminal 1: Lister les functions existantes
supabase functions list

# Terminal 1: Redéployer ai-assistant
echo "Deploying ai-assistant..."
supabase functions deploy ai-assistant

# Terminal 1: Redéployer ai-dashboard-analysis
echo "Deploying ai-dashboard-analysis..."
supabase functions deploy ai-dashboard-analysis

# Terminal 1: Redéployer ai-kpi-analysis
echo "Deploying ai-kpi-analysis..."
supabase functions deploy ai-kpi-analysis

# Terminal 1: Vérifier tous les statuts
supabase functions list
```

**Expected output:**
```
Name                        Status    URL
ai-assistant               active    https://smtdtgrymuzwvctattmx.supabase.co/functions/v1/ai-assistant
ai-dashboard-analysis      active    https://smtdtgrymuzwvctattmx.supabase.co/functions/v1/ai-dashboard-analysis
ai-kpi-analysis            active    https://smtdtgrymuzwvctattmx.supabase.co/functions/v1/ai-kpi-analysis
```

---

### **Étape 4: Démarrer le dev server**

```bash
# Terminal 2: Lancer le frontend
npm run dev

# Le frontend sera sur: http://localhost:5173
```

---

### **Étape 5: Tester manuellement**

```
1. Ouvrir http://localhost:5173/dashboard dans le browser
2. Cliquez sur l'icône chat (Assistant IA) en bas à droite
3. Posez une question simple:
   "Quelles sont mes 3 plus grandes factures?"
4. Attendez la réponse

Résultat attendu:
"Vos 3 plus grandes factures sont:
1. Facture XXX-001: 5,000€
2. Facture XXX-002: 3,500€
3. Facture XXX-003: 2,800€"
```

---

### **Étape 6: Vérifier les logs**

```bash
# Terminal 3: Regarder les logs en temps réel
supabase functions debug ai-assistant --tail

# Chercher ces logs (SUCCESS):
# [ai-assistant] User authenticated: a1b2c3d4-...
# [ai-assistant] Resolved company_id: eec8ddf3-...
# [getCompanyContext] User access verified
# [getCompanyContext] Successfully built company context
# HTTP 200 OK response
```

---

## 🔧 COMMANDES DE DEBUGGING (SI ERREUR)

### **Vérifier RLS Policy Supabase**

```sql
-- Copier/coller dans Supabase SQL Editor
SELECT * FROM pg_policies
WHERE tablename = 'user_companies'
ORDER BY policyname;

-- Expected result:
-- user_companies_select | SELECT | user_id = auth.uid()
```

---

### **Vérifier que user a une company**

```sql
-- Copier/coller dans Supabase SQL Editor
-- Remplacer USER_ID par le vrai user_id (voir logs)
SELECT * FROM user_companies
WHERE user_id = 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6'
  AND is_active = true;

-- Expected: Au moins 1 row
```

---

### **Vérifier que company existe**

```sql
-- Copier/coller dans Supabase SQL Editor
SELECT * FROM companies
WHERE id = 'eec8ddf3-6481-4089-ba17-1e69dfe6a9cb'
  AND is_active = true
  AND status = 'active';

-- Expected: 1 row
```

---

### **Tester RLS Policy manuellement (via curl)**

```bash
# 1. Obtenir un JWT token valide (depuis le frontend console)
# Ouvrir http://localhost:5173
# Ouvrir DevTools (F12)
# Dans Console, exécuter:
# const token = (await supabase.auth.getSession()).data.session.access_token; console.log(token);

# 2. Remplacer TOKEN avec le vrai token
# 3. Lancer la commande curl:

curl -X POST https://smtdtgrymuzwvctattmx.supabase.co/functions/v1/ai-assistant \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Quelles sont mes factures?",
    "context": {
      "companyId": "eec8ddf3-6481-4089-ba17-1e69dfe6a9cb"
    }
  }' \
  | jq

# Expected: HTTP 200 avec réponse JSON (pas 403)
```

---

### **Consulter les logs détaillés**

```bash
# Regarder les logs en temps réel (ne va pas s'arrêter)
supabase functions debug ai-assistant --tail

# Quitter: Ctrl+C

# Chercher les patterns dans les logs:
# [ai-assistant] User authenticated:       ← Auth OK ✅
# [getCompanyContext] User access verified ← RLS OK ✅
# [getCompanyContext] RLS Error:          ← RLS FAIL ❌
# [getCompanyContext] User access denied: ← Access FAIL ❌
```

---

## 📝 SCRIPT BASH COMPLET (copier/coller)

```bash
#!/bin/bash

# Script complet pour fix + test
# Usage: bash fix-ai-assistant.sh

set -e

echo "🚀 CassKai AI Assistant - Complete Fix Script"
echo "=============================================="
echo ""

# 1. Type checking
echo "1️⃣  Checking TypeScript compilation..."
npm run type-check || {
  echo "❌ Type check failed"
  exit 1
}
echo "✅ Type check passed"
echo ""

# 2. Verify changes
echo "2️⃣  Verifying code changes..."
grep -q "Validate token is not empty" supabase/functions/ai-assistant/index.ts && \
grep -q "maybeSingle()" supabase/functions/ai-dashboard-analysis/index.ts && \
grep -q "maybeSingle()" supabase/functions/ai-kpi-analysis/index.ts && \
echo "✅ All changes verified" || {
  echo "❌ Some changes are missing"
  exit 1
}
echo ""

# 3. Deploy functions
echo "3️⃣  Deploying Edge Functions..."
echo "   - Deploying ai-assistant..."
supabase functions deploy ai-assistant || exit 1
echo "   - Deploying ai-dashboard-analysis..."
supabase functions deploy ai-dashboard-analysis || exit 1
echo "   - Deploying ai-kpi-analysis..."
supabase functions deploy ai-kpi-analysis || exit 1
echo "✅ Functions deployed"
echo ""

# 4. Verify deployment
echo "4️⃣  Verifying deployment..."
supabase functions list
echo ""

echo "🎉 All done!"
echo ""
echo "Next steps:"
echo "1. Open: http://localhost:5173/dashboard"
echo "2. Click Assistant IA (chat icon)"
echo "3. Ask: 'Quelles sont mes factures?'"
echo "4. Check logs: supabase functions debug ai-assistant --tail"
echo ""
```

---

## 🔄 SI VOUS DEVEZ ROLLBACK

```bash
# Rollback to previous version
# (en supposant vous avez git)

git checkout HEAD -- supabase/functions/ai-assistant/index.ts
git checkout HEAD -- supabase/functions/ai-dashboard-analysis/index.ts
git checkout HEAD -- supabase/functions/ai-kpi-analysis/index.ts

# Redéployer la version précédente
supabase functions deploy ai-assistant
supabase functions deploy ai-dashboard-analysis
supabase functions deploy ai-kpi-analysis
```

---

## ✅ VERIFICATION FINALE (APRÈS DEPLOYMENT)

```bash
# Checklist finale
echo "✅ Checklist Post-Deployment"
echo "============================"

# 1. Vérifier les logs
echo "1. Checking logs..."
supabase functions debug ai-assistant --tail &
TAIL_PID=$!
sleep 2

# 2. Tester une requête
echo ""
echo "2. Testing from frontend..."
echo "   - Ouvrir http://localhost:5173/dashboard"
echo "   - Cliquer sur Assistant IA"
echo "   - Poser une question"
echo "   - Observer les logs ci-dessus"

# Kill tail
kill $TAIL_PID 2>/dev/null || true
```

---

## 📞 COMMANDES D'AIDE

```bash
# Voir status Supabase
supabase status

# Lister les functions
supabase functions list

# Debugger une fonction (en direct)
supabase functions debug ai-assistant

# Voir les logs avec queue (tail)
supabase functions debug ai-assistant --tail

# Redéployer une specific function
supabase functions deploy ai-assistant

# Accéder à Supabase Dashboard
supabase studio --open
```

---

## 🎯 QUICK START (TL;DR)

```bash
# Copy-paste ceci:
supabase functions deploy ai-assistant && \
supabase functions deploy ai-dashboard-analysis && \
supabase functions deploy ai-kpi-analysis && \
npm run dev

# Puis dans le browser: http://localhost:5173/dashboard
# Cliquez sur Assistant IA et posez une question
```

---

**C'est tout! 🚀**

Consultez `DIAGNOSTIC_AI_ASSISTANT_403.md` si vous avez encore le 403 après ces étapes.
