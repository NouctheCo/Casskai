# 🔧 Solution au problème des montants à 0 - 08 Décembre 2025

## 📌 Situation actuelle

**Problème** : Les montants débit/crédit sont tous à 0 dans la base après import FEC.

**Votre hypothèse** (très pertinente) : "ne serais-ce pas parce que ces données sont déjà à 0 dans supabase?"

## ✅ Actions effectuées

### 1. Build avec logs de debug
✅ **TERMINÉ** - `npm run build` exécuté avec succès.

Les logs de debug sont maintenant actifs dans le code :
- **Parser** (lignes 564, 571 de `accountingFileParser.ts`) : affiche les montants bruts et parsés
- **Import** (lignes 614-620, 639-645 de `accountingImportService.ts`) : affiche les montants avant insertion SQL

### 2. Script SQL de diagnostic créé
✅ **CRÉÉ** - `CHECK_MONTANTS_SUPABASE.sql`

Ce script SQL vérifie :
1. Le schéma de la table (types des colonnes)
2. Combien de lignes ont des montants à 0 vs non-0
3. Les 10 dernières lignes insérées
4. Les écritures des dernières 24h
5. Les statistiques par compte
6. S'il y a des valeurs NULL
7. Les lignes avec montants > 0
8. Les contraintes et triggers qui pourraient causer le problème

## 🔍 Prochaines étapes de diagnostic

### Étape 1 : Vérifier les données existantes dans Supabase

1. **Allez sur** : https://supabase.com/dashboard
2. **Connectez-vous** à votre projet
3. **Ouvrez** : SQL Editor
4. **Copiez-collez** le contenu de `CHECK_MONTANTS_SUPABASE.sql`
5. **Exécutez** les requêtes une par une
6. **Prenez une capture d'écran** des résultats

**Ce que les résultats vont révéler** :

#### Scénario A : Toutes les lignes ont montants = 0
```
Lignes avec montants à 0: 150
Lignes avec montants non-0: 0
```
→ **Le problème est dans l'import ou dans un trigger qui met tout à 0**

#### Scénario B : Certaines lignes ont des montants
```
Lignes avec montants à 0: 50
Lignes avec montants non-0: 100
```
→ **L'import fonctionne parfois, il y a un problème spécifique à certaines données**

#### Scénario C : Aucune ligne dans la table
```
Total lignes: 0
```
→ **L'import ne s'est jamais produit, ou les données ont été supprimées**

### Étape 2 : Test d'import en LOCAL avec logs

**IMPORTANT** : Vous DEVEZ tester en LOCAL (http://localhost:5173) et PAS en production, car le nouveau build avec les logs n'est pas encore déployé.

1. **Stoppez le serveur dev** s'il tourne : `Ctrl+C` dans le terminal
2. **Lancez en mode dev** : `npm run dev`
3. **Attendez** que le serveur démarre (généralement `http://localhost:5173`)
4. **Ouvrez la console** du navigateur : `F12` → Console
5. **Allez dans** : Comptabilité → Importer
6. **Uploadez** votre fichier FEC
7. **Cliquez sur** "Démarrer l'import"

**Logs attendus dans la console** :

```javascript
🔧 Import pour l'entreprise: <UUID>
📄 Fichier: 917938318FEC20241231.txt
📊 Format détecté: FEC
📊 Standard: PCG

[Parser] Headers: ["JournalCode", "JournalLib", "EcritureNum", ...]
[Parser] Column mapping: {debit: 11, credit: 12, ...}

[Parser Line 2] Raw Debit: "0,00" | Raw Credit: "1000,00"
[Parser Line 2] Parsed Debit: 0 | Parsed Credit: 1000

[Parser Line 3] Raw Debit: "3297,36" | Raw Credit: "0,00"
[Parser Line 3] Parsed Debit: 3297.36 | Parsed Credit: 0

[Import] Line 1 - Account 101300: {
  debit: 0,
  credit: 1000,
  debitType: "number",
  creditType: "number"
}

[Import] Sample of lines to insert (first 3): [
  {account: "101300", debit: 0, credit: 1000, desc: "À-nouveaux"},
  {account: "119000", debit: 3297.36, credit: 0, desc: "À-nouveaux"},
  ...
]
```

**Si vous ne voyez PAS ces logs** :
- Le build n'est pas à jour (mais on vient de le faire)
- Le serveur n'utilise pas le nouveau code (redémarrer le serveur)
- L'import ne se lance pas vraiment (erreur silencieuse)

### Étape 3 : Interpréter les logs

#### Cas 1 : Les montants sont parsés correctement mais deviennent 0 avant insertion
```
[Parser Line 2] Parsed Debit: 0 | Parsed Credit: 1000 ✅
[Import] Line 1 - Account 101300: {debit: 0, credit: 0} ❌
```
→ **Problème dans la construction de l'objet entre le parsing et l'insertion**

**Solution** : Vérifier les lignes 623-632 de `accountingImportService.ts`

#### Cas 2 : Les montants sont bien dans l'objet mais deviennent 0 après insertion
```
[Import] Sample: [{debit: 0, credit: 1000, ...}] ✅
// Puis en SQL:
SELECT * FROM journal_entry_lines → credit_amount = 0 ❌
```
→ **Problème dans Supabase (trigger, contrainte, ou RLS policy)**

**Solution** : Regarder les résultats du script SQL (étape 1), notamment la partie triggers

#### Cas 3 : Le parsing retourne 0 au lieu du bon montant
```
[Parser Line 2] Raw Credit: "1000,00" ✅
[Parser Line 2] Parsed Credit: 0 ❌
```
→ **Problème dans la fonction `parseAmount`**

**Solution** : Mais on a déjà testé le parser avec `test-parser.js` et ça fonctionne... 🤔

## 🐛 Hypothèses ordonnées par probabilité

### 1. **TRÈS PROBABLE** : Trigger ou contrainte Supabase
Les montants sont correctement parsés et insérés, mais un trigger les met à 0 après coup.

**Comment vérifier** :
- Exécuter la partie 9 du script SQL (`CHECK_MONTANTS_SUPABASE.sql`)
- Chercher des triggers sur `journal_entry_lines`

**Solution si confirmé** :
```sql
-- Désactiver le trigger problématique
DROP TRIGGER IF EXISTS <nom_du_trigger> ON journal_entry_lines;
```

### 2. **PROBABLE** : L'import n'utilise pas le bon mapping de colonnes
Le parser détecte mal les colonnes `Debit` et `Credit` dans le FEC.

**Comment vérifier** :
- Regarder dans les logs : `[Parser] Column mapping: {debit: ?, credit: ?}`
- Si `debit: -1` ou `credit: -1`, les colonnes ne sont pas trouvées

**Solution si confirmé** :
Ajouter les variantes FEC dans `COLUMN_MAPPINGS` (ligne 365 de `accountingFileParser.ts`) :
```typescript
debit: [
  'Debit', 'DEBIT', 'Débit', 'DÉBIT',
  'Montantdébit', 'MontantDebit', 'MONTANTDEBIT',  // ← Ajouter ça
],
```

### 3. **POSSIBLE** : L'objet `entry` est mal construit
Entre le parsing et l'insertion, les montants sont perdus.

**Comment vérifier** :
- Regarder les logs `[Import] Line X - Account Y: {debit: ?, credit: ?}`
- Si `debit: 0, credit: 0` alors que le parsing a donné d'autres valeurs

**Solution si confirmé** :
Regarder dans `accountingFileParser.ts` comment l'objet `AccountingLine` est construit (autour de la ligne 580-620)

### 4. **PEU PROBABLE** : Problème de typage TypeScript
Les montants sont des strings au lieu de numbers.

**Comment vérifier** :
- Regarder les logs : `debitType: "string"` au lieu de `"number"`

**Solution si confirmé** :
Ligne 627-628 de `accountingImportService.ts` :
```typescript
debit_amount: Number(entry.debit) || 0,
credit_amount: Number(entry.credit) || 0,
```

## 📞 Ce dont j'ai besoin pour continuer

Pour identifier le problème précis, envoyez-moi :

### 1. Résultats SQL Supabase
Exécutez `CHECK_MONTANTS_SUPABASE.sql` et envoyez-moi :
- ✅ Combien de lignes avec montants = 0 vs montants ≠ 0
- ✅ Les 10 dernières lignes insérées (avec leurs montants)
- ✅ S'il y a des triggers sur `journal_entry_lines`

### 2. Logs console de l'import LOCAL
Après avoir lancé `npm run dev` et fait l'import :
- ✅ TOUS les logs commençant par `[Parser]`
- ✅ TOUS les logs commençant par `[Import]`
- ✅ Le message de succès ou erreur final

### 3. Contenu du fichier FEC (premières lignes)
- ✅ La ligne des headers (JournalCode|JournalLib|...)
- ✅ Les 3 premières lignes de données

---

## 🎯 Plan d'action immédiat

1. ✅ **Exécuter** `CHECK_MONTANTS_SUPABASE.sql` dans Supabase SQL Editor
2. ✅ **Lancer** `npm run dev` en local
3. ✅ **Faire un import** avec la console ouverte (F12)
4. ✅ **Copier** tous les logs console
5. ✅ **M'envoyer** les 3 éléments ci-dessus

Avec ces informations, je pourrai identifier le problème en 2 minutes et vous donner la correction exacte ! 🚀

---

**Date** : 08 Décembre 2025
**Status** : 🔍 En attente des résultats de diagnostic
**Build** : ✅ Terminé avec logs de debug actifs
