# 🚀 Déploiement des Correctifs AI - CassKai

Ce document détaille les corrections apportées et les étapes de déploiement.

---

## 📋 Résumé des Problèmes Corrigés

### ✅ 1. Erreur SQL : `column bt.type does not exist`

**Problème** : La fonction trigger `update_bank_account_balance()` référençait une colonne `type` inexistante dans `bank_transactions`.

**Solution** : Fonction SQL corrigée pour utiliser directement les montants signés.

### ✅ 2. Clé OpenAI exposée côté client

**Problème** : Les services IA utilisaient `VITE_OPENAI_API_KEY` depuis le frontend (faille de sécurité).

**Solution** : Migration vers Supabase Edge Functions qui utilisent les secrets Supabase.

---

## 🔧 Étape 1 : Corriger la Fonction SQL

### Exécuter sur Supabase (SQL Editor)

```sql
-- Corriger la fonction update_bank_account_balance
CREATE OR REPLACE FUNCTION public.update_bank_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Recalculate current_balance excluding ignored transactions
  -- Les montants sont déjà signés : positif = crédit, négatif = débit
  UPDATE public.bank_accounts
  SET current_balance = (
    SELECT COALESCE(SUM(bt.amount), 0)
    FROM public.bank_transactions bt
    WHERE bt.bank_account_id = COALESCE(NEW.bank_account_id, OLD.bank_account_id)
      AND (bt.status IS NULL OR bt.status <> 'ignored')
  ),
  last_import = NOW(),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.bank_account_id, OLD.bank_account_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Vérifier que le trigger est bien attaché
DROP TRIGGER IF EXISTS trigger_update_bank_balance ON public.bank_transactions;
CREATE TRIGGER trigger_update_bank_balance
  AFTER INSERT OR DELETE OR UPDATE ON public.bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_account_balance();
```

### ✅ Vérification

Testez l'import bancaire pour confirmer que l'erreur est corrigée.

---

## 🤖 Étape 2 : Déployer les Edge Functions

### Prérequis

1. **Supabase CLI installé** :
   ```bash
   npm install -g supabase
   ```

2. **Lier votre projet** :
   ```bash
   supabase link --project-ref smtdtgrymuzwvctattmx
   ```

3. **Vérifier le secret OpenAI** :
   ```bash
   supabase secrets list
   ```

   Devrait afficher :
   ```
   OPENAI_API_KEY
   ```

   Si absent, configurez-le :
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-votre-clé-ici
   ```

### Déployer les 4 Edge Functions

```bash
# Depuis la racine du projet
cd c:\Users\noutc\Casskai

# Déployer toutes les nouvelles fonctions IA
supabase functions deploy ai-assistant
supabase functions deploy ai-kpi-analysis
supabase functions deploy ai-dashboard-analysis
supabase functions deploy ai-report-analysis
```

### ✅ Vérification

```bash
# Lister les fonctions déployées
supabase functions list

# Devrait afficher :
# - ai-assistant
# - ai-kpi-analysis
# - ai-dashboard-analysis
# - ai-report-analysis
```

---

## 📦 Étape 3 : Déployer le Frontend sur le VPS

### Build local avec les nouvelles modifications

```powershell
# Windows PowerShell
npm run build
```

### Déploiement sur le VPS

```powershell
# Option 1 : Script automatisé (recommandé)
.\deploy-vps.ps1

# Option 2 : Commande manuelle
scp -r dist/* user@89.116.111.88:/var/www/casskai.app/
```

---

## 🧪 Étape 4 : Tests

### Test 1 : Import Bancaire

1. Allez sur **Banque** → **Import**
2. Importez un fichier CSV/QIF/OFX
3. ✅ **Attendu** : Import réussi sans erreur `bt.type`

### Test 2 : Assistant IA

1. Ouvrez le **Chat IA**
2. Posez une question : "Comment créer une facture ?"
3. ✅ **Attendu** : Réponse de l'IA (via Edge Function)
4. ❌ **Erreur** : Si vous voyez `Incorrect API key`, la clé n'est pas configurée

### Test 3 : Analyse Dashboard (Production uniquement)

1. Allez sur le **Dashboard**
2. Cliquez sur **Analyser avec l'IA**
3. ✅ **Attendu** : Analyse complète générée

---

## 🔍 Diagnostic des Erreurs

### Erreur : "Incorrect API key"

**Cause** : Le secret `OPENAI_API_KEY` n'est pas configuré ou est invalide.

**Solution** :
```bash
supabase secrets set OPENAI_API_KEY=sk-votre-vraie-clé
```

### Erreur : "column bt.type does not exist"

**Cause** : Le SQL n'a pas été exécuté.

**Solution** : Exécutez le SQL de l'Étape 1.

### Erreur : "Edge Function not found"

**Cause** : Les Edge Functions ne sont pas déployées.

**Solution** :
```bash
supabase functions deploy ai-kpi-analysis
supabase functions deploy ai-dashboard-analysis
supabase functions deploy ai-report-analysis
```

### Voir les logs d'une Edge Function

```bash
supabase functions logs ai-assistant --tail
supabase functions logs ai-kpi-analysis --tail
```

---

## 📊 Architecture Déployée

### Avant (Insécurisé)
```
Frontend → VITE_OPENAI_API_KEY → OpenAI API
          ❌ Clé exposée dans le navigateur
```

### Après (Sécurisé)
```
Frontend → Supabase Edge Function → OpenAI API
                     ↑
          Secrets Supabase (sécurisés)
          ✅ Clé jamais exposée
```

---

## 📁 Fichiers Modifiés

### Nouveaux fichiers

- ✅ `supabase/functions/ai-kpi-analysis/index.ts`
- ✅ `supabase/functions/ai-dashboard-analysis/index.ts`
- ✅ `supabase/functions/ai-report-analysis/index.ts`
- ✅ `src/config/ai.config.ts`

### Fichiers modifiés

- ✅ `src/services/aiService.ts` - Utilise Edge Function `ai-assistant`
- ✅ `src/services/aiAnalysisService.ts` - Utilise Edge Function en production
- ✅ `src/services/aiDashboardAnalysisService.ts` - Utilise Edge Function en production
- ✅ `src/services/aiReportAnalysisService.ts` - Utilise Edge Function en production
- ✅ `supabase/functions/README.md` - Documentation mise à jour

---

## 🎯 Comportement Final

### En Production (`casskai.app`)

| Service | Comportement |
|---------|--------------|
| Assistant IA | ✅ Utilise Edge Function `ai-assistant` |
| Analyse KPI | ✅ Utilise Edge Function `ai-kpi-analysis` |
| Analyse Dashboard | ✅ Utilise Edge Function `ai-dashboard-analysis` |
| Analyse Rapports | ✅ Utilise Edge Function `ai-report-analysis` |

### En Développement (`localhost`)

| Service | Comportement |
|---------|--------------|
| Assistant IA | ✅ Utilise Edge Function locale |
| Analyse KPI | 🔧 Appel OpenAI direct (si `VITE_OPENAI_API_KEY` configurée) |
| Analyse Dashboard | 🔧 Appel OpenAI direct (si `VITE_OPENAI_API_KEY` configurée) |
| Analyse Rapports | 🔧 Appel OpenAI direct (si `VITE_OPENAI_API_KEY` configurée) |

---

## ✅ Checklist de Déploiement

- [ ] SQL exécuté sur Supabase (fonction `update_bank_account_balance`)
- [ ] Secret `OPENAI_API_KEY` configuré dans Supabase
- [ ] Edge Functions déployées (4 fonctions)
- [ ] Frontend buildé et déployé sur VPS
- [ ] Test import bancaire réussi
- [ ] Test assistant IA réussi
- [ ] Test analyse Dashboard (si en production)

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. **Vérifier les logs Supabase** :
   ```bash
   supabase functions logs ai-assistant --tail
   ```

2. **Vérifier les secrets** :
   ```bash
   supabase secrets list
   ```

3. **Tester une Edge Function manuellement** :
   ```bash
   curl -i --location --request POST 'https://smtdtgrymuzwvctattmx.supabase.co/functions/v1/ai-assistant' \
     --header 'Authorization: Bearer YOUR_ANON_KEY' \
     --header 'Content-Type: application/json' \
     --data '{"query":"Test","company_id":"uuid","context_type":"general"}'
   ```

---

## 📝 Notes

- Les services d'analyse utilisent `gpt-4o-mini` (économique) et `gpt-4o` (performant)
- Toutes les interactions IA sont loggées dans la table `ai_interactions`
- Les Edge Functions vérifient automatiquement l'accès utilisateur via `user_companies`
- La clé OpenAI reste dans Supabase Secrets, jamais exposée au frontend

---

**Date** : 2025-12-21
**Version** : 1.0.0
**Auteur** : Claude Code
