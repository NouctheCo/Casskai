# 🚨 Instructions de débogage IMMÉDIAT

## Problème identifié

Vous avez **3 problèmes** :

### 1. ❌ Session invalide (Refresh Token)
Votre session Supabase est corrompue, d'où la redirection vers onboarding.

### 2. ❌ RLS policy sur audit_logs
Les logs d'audit ne peuvent pas être insérés, mais ce n'est pas critique.

### 3. ❌ Pas de logs d'import FEC
Vous n'avez pas fait d'import, donc pas de logs `[Parser]` ou `[Import]`.

## ✅ Solution MAINTENANT

### Étape 1 : Vider le cache (OBLIGATOIRE)

**Option A - Dans la console du navigateur** :
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

**Option B - Page de clear** :
1. Aller sur `http://localhost:5173/clear-cache.html`
2. Cliquer sur "Clear All"

**Option C - Manuellement** :
1. F12 → Application → Storage
2. Clear storage → Clear site data
3. F5 pour recharger

### Étape 2 : Se reconnecter

1. Allez sur `http://localhost:5173/login`
2. Connectez-vous avec vos identifiants
3. Vous devriez arriver sur le dashboard (plus d'onboarding !)

### Étape 3 : Faire l'import FEC avec logs

1. **Ouvrez la console** (F12 → Console)
2. Allez dans **Comptabilité → Importer**
3. **Uploadez votre fichier FEC**
4. **Attendez** de voir les logs s'afficher
5. **Copiez TOUS les logs** qui commencent par :
   - `[Parser]`
   - `[Import]`
   - `🔧 Import pour l'entreprise:`

### Logs attendus

Vous devriez voir :

```
🔧 Import pour l'entreprise: <UUID>
📄 Fichier: votre-fichier.txt
📊 Format détecté: FEC
📊 Standard: PCG

[Parser] Headers: ["JournalCode", "JournalLib", ...]
[Parser] Column mapping: {debit: 11, credit: 12, ...}
[Parser Line 2] Raw Debit: "0,00" | Raw Credit: "1000,00"
[Parser Line 2] Parsed Debit: 0 | Parsed Credit: 1000
[Import] Line 1 - Account 101300: {debit: 0, credit: 1000, debitType: "number", creditType: "number"}
[Import] Sample of lines to insert (first 3): [{account: "101300", debit: 0, credit: 1000, ...}]
```

### Si vous ne voyez PAS ces logs

Cela signifie que le build n'est pas à jour. Dans ce cas :

```bash
npm run dev
```

Puis recommencez l'import.

## 🔍 Ce que les logs vont révéler

Les logs vont nous dire **exactement** où le problème se situe :

### Scénario 1 : Les montants sont bien parsés
```
[Parser Line 2] Raw Debit: "0,00" | Raw Credit: "1000,00"
[Parser Line 2] Parsed Debit: 0 | Parsed Credit: 1000  ✅
[Import] Line 1 - Account 101300: {debit: 0, credit: 1000}  ✅
```
→ **Le problème est dans l'insertion Supabase**

### Scénario 2 : Les montants deviennent 0 après parsing
```
[Parser Line 2] Raw Debit: "0,00" | Raw Credit: "1000,00"
[Parser Line 2] Parsed Debit: 0 | Parsed Credit: 0  ❌
```
→ **Le problème est dans le parser**

### Scénario 3 : Les montants sont perdus lors de la construction
```
[Parser Line 2] Parsed Debit: 0 | Parsed Credit: 1000  ✅
[Import] Line 1 - Account 101300: {debit: 0, credit: 0}  ❌
```
→ **Le problème est dans la construction de l'objet**

## 🐛 Problème bonus : RLS audit_logs

Si vous voulez corriger l'erreur RLS sur `audit_logs`, ajoutez cette migration :

```sql
-- Permettre l'insertion dans audit_logs
CREATE POLICY "Users can insert their own audit logs"
ON audit_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

Mais ce n'est **PAS prioritaire** pour l'import FEC.

## 📞 Après avoir fait l'import

**Envoyez-moi** :
1. ✅ Les logs console complets de l'import
2. ✅ Une capture d'écran de la table `journal_entry_lines` dans Supabase
3. ✅ Le message de succès ou d'erreur affiché dans l'interface

Avec ces informations, je pourrai identifier le problème en 2 minutes !

---

**IMPORTANT** : Ne pas oublier de vider le cache avant de tester !
