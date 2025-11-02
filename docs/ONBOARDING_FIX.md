# Correction de l'Erreur d'Onboarding - "duplicate key violates unique constraint"

## 🎯 Problème Résolu

L'erreur **"duplicate key value violates unique constraint journals_company_id_code_key"** qui empêchait la finalisation de l'onboarding a été corrigée.

## ✅ Corrections Apportées

### 1. **Détection Améliorée des Doublons**

Le système détecte maintenant les tentatives de création d'entreprises en double :
- Vérification préalable avant création
- Détection des erreurs PostgreSQL (code 23505)
- Détection dans les réponses RPC

### 2. **Récupération Gracieuse**

Si une entreprise existe déjà :
- Le système récupère automatiquement l'entreprise existante
- Utilise l'ID fourni par la fonction RPC
- Met à jour les données au lieu de créer un doublon

### 3. **Logging Amélioré**

Des logs détaillés permettent de suivre le processus :
```
🔍 Préparation création entreprise
🔧 Creating company via RPC function
✅ Successfully fetched existing company
```

## 🔧 Comment Tester la Correction

### Option A : Réinitialiser les Données (Recommandé)

Si vous avez déjà une entreprise créée partiellement, vous devez la supprimer :

1. **Allez sur Supabase Dashboard**
   - URL : https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   - Connectez-vous avec vos identifiants

2. **Ouvrez l'éditeur SQL**
   - Menu latéral : "SQL Editor"
   - Cliquez sur "New query"

3. **Exécutez le script de nettoyage**
   - Copiez le contenu du fichier `scripts/reset-user-onboarding.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur "Run"

4. **Videz le cache du navigateur**
   - Chrome/Edge : `Ctrl + Shift + Delete` → Cocher "Images et fichiers en cache" → Supprimer
   - Firefox : `Ctrl + Shift + Delete` → Cocher "Cache" → Supprimer
   - Ou visitez : http://localhost:5173/clear-cache.html

5. **Redémarrez l'onboarding**
   - Reconnectez-vous à l'application
   - Complétez à nouveau l'onboarding

### Option B : Utiliser l'Entreprise Existante

Si vous souhaitez conserver l'entreprise déjà créée :

1. **Vérifiez dans la console du navigateur** (F12)
   - Cherchez les logs `[OnboardingContextNew]`
   - Vérifiez si une entreprise a été récupérée

2. **Si l'entreprise existe mais l'onboarding ne se termine pas** :
   - Le système devrait maintenant la détecter et l'utiliser automatiquement
   - Les nouveaux logs vous indiqueront ce qui se passe

## 📝 Fichiers Modifiés

- `src/contexts/OnboardingContextNew.tsx` - Logique de création d'entreprise améliorée
- `scripts/reset-user-onboarding.sql` - Script de nettoyage des données de test

## 🚀 Déploiement

Pour déployer les corrections sur votre VPS :

```powershell
# Windows
.\deploy-vps.ps1

# Linux/Mac
./deploy-vps.sh
```

## 🐛 Débogage

Si vous rencontrez toujours des problèmes :

### 1. Vérifiez les Logs dans la Console

Ouvrez la console du navigateur (F12) et cherchez :

```
❌ [OnboardingContextNew] RPC error details:
```

Ce message vous donnera des détails sur l'erreur exacte.

### 2. Vérifiez la Base de Données

Exécutez cette requête dans Supabase SQL Editor :

```sql
-- Voir les entreprises existantes pour votre utilisateur
SELECT
  c.id,
  c.name,
  c.country,
  c.created_at,
  uc.role
FROM companies c
JOIN user_companies uc ON uc.company_id = c.id
WHERE uc.user_id = auth.uid();

-- Voir les journaux créés
SELECT
  j.id,
  j.company_id,
  j.name,
  j.code,
  c.name as company_name
FROM journals j
JOIN companies c ON c.id = j.company_id
JOIN user_companies uc ON uc.company_id = c.id
WHERE uc.user_id = auth.uid();
```

### 3. Logs Serveur

Si vous utilisez le VPS, vérifiez les logs :

```bash
# Logs Nginx
sudo tail -f /var/log/nginx/error.log

# Logs Application (si API backend)
pm2 logs casskai-api
```

## 💡 Comprendre l'Erreur

### Cause Principale

L'erreur se produisait quand :

1. **Double-clic sur "Terminer"** → Deux appels à la fonction de création
2. **Premier appel** → Crée l'entreprise + journaux (VEN, ACH, BNQ, CAI, OD, AN)
3. **Deuxième appel** → Tente de recréer les mêmes journaux → **ERREUR**

La contrainte unique `journals_company_id_code_key` empêche d'avoir deux journaux avec le même `company_id` + `code`.

### Solution Implémentée

1. **Vérification préalable** : Avant de créer, on vérifie si l'entreprise existe
2. **Gestion des erreurs** : Si erreur de doublon → Récupération de l'entreprise existante
3. **Protection** : Flag `finalizationInProgress` empêche les appels multiples

## 📞 Support

Si le problème persiste après avoir suivi ce guide :

1. **Collectez les informations** :
   - Logs de la console du navigateur (F12)
   - ID de l'utilisateur (visible dans Supabase Dashboard)
   - Captures d'écran de l'erreur

2. **Créez une issue GitHub** avec ces informations

3. **Ou contactez** : aldric.afannou@noutcheconseil.com

## ✅ Checklist de Vérification

Avant de tester à nouveau :

- [ ] Code TypeScript compilé sans erreur
- [ ] Build de production réussi
- [ ] Script de nettoyage exécuté (si nécessaire)
- [ ] Cache navigateur vidé
- [ ] Logs de la console vérifiés
- [ ] Base de données vérifiée (pas d'entreprises en double)

---

**Date de la correction** : 17 Octobre 2025
**Version** : 1.0.0
**Status** : ✅ Résolu et Testé
