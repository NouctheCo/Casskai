# 🚀 GUIDE DE DÉPLOIEMENT ULTRA-SIMPLE

**Temps total : 15 minutes**
**Date : 23 janvier 2026**

---

## 📋 LISTE DES FICHIERS À UTILISER (DANS L'ORDRE)

### 🗄️ Pour Supabase (Base de données)

1. **[ETAPE1_NETTOYAGE_UNIQUEMENT.sql](./ETAPE1_NETTOYAGE_UNIQUEMENT.sql)** ← Commencer ici
2. **[ETAPE2_AJOUTER_CONTRAINTES.sql](./ETAPE2_AJOUTER_CONTRAINTES.sql)** ← Puis celui-ci
3. **[CORRECTIONS_RLS_ET_JOURNAUX.sql](./CORRECTIONS_RLS_ET_JOURNAUX.sql)** ← Enfin celui-ci (PARTIE 1 seulement)

### 💻 Pour le code

4. Code déjà modifié localement (TypeScript) ← Rien à faire
5. Déploiement : `.\deploy-vps.ps1` ← Exécuter en dernier

---

## ⚡ ÉTAPES ULTRA-SIMPLES

### ÉTAPE A : Nettoyer la base de données (5 min)

1. Ouvrir https://supabase.com/dashboard
2. Cliquer sur votre projet
3. Aller dans **SQL Editor** (menu gauche)
4. Copier/coller **TOUT** le fichier [ETAPE1_NETTOYAGE_UNIQUEMENT.sql](./ETAPE1_NETTOYAGE_UNIQUEMENT.sql)
5. Cliquer sur **"Run"** (bouton en bas à droite)
6. ✅ Vérifier qu'il n'y a **PAS D'ERREUR** rouge
7. ✅ Vérifier que vous voyez : `ÉTAPE 1 TERMINÉE`

**Si erreur :** Copier le message d'erreur et me le donner.

---

### ÉTAPE B : Ajouter les contraintes (2 min)

1. Rester dans **Supabase SQL Editor**
2. **Effacer** le contenu de l'éditeur
3. Copier/coller **TOUT** le fichier [ETAPE2_AJOUTER_CONTRAINTES.sql](./ETAPE2_AJOUTER_CONTRAINTES.sql)
4. Cliquer sur **"Run"**
5. ✅ Vérifier : Vous voyez `✅ Contrainte FK ... créée avec succès` (2 fois)
6. ✅ Vérifier : Vous voyez `✅ TEST RÉUSSI: La contrainte FK bloque bien`
7. ✅ Vérifier : Vous voyez `ÉTAPE 2 TERMINÉE`

**Si erreur "Il reste X lignes orphelines" :**
→ Retourner à l'ÉTAPE A et ré-exécuter [ETAPE1_NETTOYAGE_UNIQUEMENT.sql](./ETAPE1_NETTOYAGE_UNIQUEMENT.sql)

---

### ÉTAPE C : Corriger les politiques RLS (2 min)

1. Rester dans **Supabase SQL Editor**
2. **Effacer** le contenu de l'éditeur
3. Ouvrir [CORRECTIONS_RLS_ET_JOURNAUX.sql](./CORRECTIONS_RLS_ET_JOURNAUX.sql)
4. Copier **SEULEMENT LA PARTIE 1** (lignes 1 à ~120)
   - Depuis `-- PARTIE 1: CORRIGER LA POLITIQUE RLS`
   - Jusqu'à AVANT `-- PARTIE 2`
5. Coller dans Supabase SQL Editor
6. Cliquer sur **"Run"**
7. ✅ Vérifier : Pas d'erreur rouge

---

### ÉTAPE D : Déployer le code frontend (3 min)

1. Ouvrir **PowerShell** dans `c:\Users\noutc\Casskai`
2. Exécuter :
   ```powershell
   .\deploy-vps.ps1
   ```
3. ✅ Attendre la fin (2-3 minutes)
4. ✅ Vérifier : Vous voyez `✅ Tests de santé : OK`

---

### ÉTAPE E : TESTER (3 min)

1. Ouvrir https://casskai.app dans le navigateur
2. Appuyer sur **F12** pour ouvrir la console
3. Se connecter à l'application
4. Aller dans **Comptabilité → Écritures**
5. Cliquer sur **"Modifier"** une écriture existante
6. Changer un montant (par exemple 100 → 150)
7. Cliquer sur **"Enregistrer"**
8. **Regarder la console** (F12) - Vous devez voir :

```
🔍 Lignes trouvées AVANT suppression: 2
ℹ️ 2 anciennes lignes supprimées (2 trouvées avant)  ← ✅ DOIT ÊTRE > 0 !
🔍 Tentative insertion de 2 NOUVELLES lignes
✅ 2 NOUVELLES lignes insérées avec succès
```

9. **Ré-ouvrir la même écriture** en mode modification
10. ✅ **Vérifier** : Le nombre de lignes est correct (pas de doublons)

**Si vous voyez "0 lignes supprimées" :**
→ L'ÉTAPE C n'a pas fonctionné, recommencez-la.

---

## 🎯 CHECKLIST DE VALIDATION

Cochez au fur et à mesure :

- [ ] ✅ ÉTAPE A terminée sans erreur
- [ ] ✅ ÉTAPE B terminée sans erreur
- [ ] ✅ ÉTAPE C terminée sans erreur
- [ ] ✅ ÉTAPE D : Code déployé avec succès
- [ ] ✅ ÉTAPE E : Test modification → logs montrent "X lignes supprimées" > 0
- [ ] ✅ ÉTAPE E : Pas de doublons visuels dans le formulaire

**Si toutes les cases sont cochées → C'EST BON ! 🎉**

---

## ❌ EN CAS DE PROBLÈME

### Problème : "FK constraint violation" à l'ÉTAPE B

**Solution :**
1. Retourner à l'ÉTAPE A
2. Ré-exécuter [ETAPE1_NETTOYAGE_UNIQUEMENT.sql](./ETAPE1_NETTOYAGE_UNIQUEMENT.sql)
3. Vérifier à la fin que `lignes_orphelines_restantes = 0`
4. Puis retourner à l'ÉTAPE B

### Problème : "0 lignes supprimées" dans les logs console

**Solution :**
1. Vérifier que l'ÉTAPE C est bien exécutée
2. Déconnecter/reconnecter de l'application
3. Vider le cache du navigateur (Ctrl+Shift+Suppr)
4. Re-tester

### Problème : Toujours des doublons après déploiement

**Solution :**
1. Vérifier dans Supabase → SQL Editor :
   ```sql
   SELECT policyname FROM pg_policies
   WHERE tablename = 'journal_entry_lines'
   AND policyname LIKE '%_v2';
   ```
2. Doit retourner 4 lignes avec suffixe `_v2`
3. Si pas de résultat, ré-exécuter l'ÉTAPE C

---

## 📞 BESOIN D'AIDE ?

Envoyez-moi :

1. **Capture d'écran de l'erreur** (si erreur SQL)
2. **Logs de la console** navigateur (F12 → Console → clic droit → Save as)
3. **À quelle étape vous êtes bloqué** (A, B, C, D ou E)

---

## 🎉 C'EST TERMINÉ !

Une fois toutes les étapes validées :

✅ Les écritures ne se dupliquent plus
✅ La base de données est propre et sécurisée
✅ Les performances sont améliorées
✅ Les journaux sont correctement affectés

**Vous pouvez travailler normalement !**

---

**Dernière mise à jour :** 23 janvier 2026, 03:30 UTC
**Temps total :** 15 minutes
**Difficulté :** 🟢 Facile (copier/coller)
