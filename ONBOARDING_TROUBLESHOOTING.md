# 🚨 PROBLÈME ONBOARDING - Guide de Dépannage

## 📋 Symptôme
Impossible d'accéder à l'onboarding après avoir supprimé une entreprise dans la table `companies`.

## 🔍 Cause Racine
Lorsque vous supprimez une entreprise dans la table `companies`, **l'enregistrement dans `user_companies` reste présent**.

Cela crée un **lien orphelin** :
- `user_companies` pointe vers un `company_id` qui n'existe plus
- `getUserCompanies()` trouve des liens mais ne récupère aucune entreprise valide
- Le système pense que vous n'avez pas d'entreprise (correct)
- **MAIS** le cache localStorage/sessionStorage peut encore avoir des données obsolètes

## ✅ Solution Rapide (3 étapes)

### Étape 1 : Nettoyer le Cache Navigateur
1. Ouvrez la **Console DevTools** (F12)
2. Copiez-collez ce code :

```javascript
// Nettoyer localStorage
['onboarding_current_step', 'onboarding_company_data', 'onboarding_modules', 
 'onboarding_just_completed', 'seen_experience', 'casskai_modules', 
 'casskai_enterprises', 'casskai_enterprises_timestamp'].forEach(key => {
  localStorage.removeItem(key);
  console.log(`✅ Supprimé: ${key}`);
});

// Nettoyer clés user-scoped
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('casskai_') && key.includes('_current_company_id')) {
    localStorage.removeItem(key);
    console.log(`✅ Supprimé: ${key}`);
  }
});

// Vider sessionStorage
sessionStorage.clear();
console.log('🎯 Cache nettoyé !');
```

3. Rechargez la page (F5)

### Étape 2 : Nettoyer la Base de Données
1. Allez dans **Supabase SQL Editor**
2. Exécutez d'abord le diagnostic (`DIAGNOSTIC_ONBOARDING.sql`) :

```sql
-- Vérifier les liens orphelins
SELECT 
  'orphaned_links' as issue,
  uc.id,
  uc.company_id
FROM user_companies uc
WHERE uc.user_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM companies c WHERE c.id = uc.company_id
  );
```

3. Si vous voyez des résultats, exécutez le nettoyage (`CLEANUP_ONBOARDING.sql`) :

```sql
-- Supprimer les liens orphelins
DELETE FROM user_companies
WHERE user_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM companies c WHERE c.id = user_companies.company_id
  );
```

### Étape 3 : Vérifier les Logs
1. Rechargez l'application
2. Ouvrez la Console DevTools
3. Cherchez ces logs :

```
[WARN] getUserCompanies: No company links found for user
→ BON ! Vous devriez être redirigé vers /onboarding

[WARN] getUserCompanies: Found X company link(s): [ids...]
→ PROBLÈME ! Il reste des liens. Retourner à l'Étape 2
```

## 🔧 Améliorations Apportées

J'ai ajouté des **logs de diagnostic** dans `src/lib/company.ts` :

```typescript
// Détecte automatiquement les liens orphelins
if (companies && companies.length < companyIds.length) {
  logger.warn('⚠️ Orphaned links detected!', {
    expected: companyIds.length,
    got: companies.length
  });
}
```

Vous verrez maintenant ces warnings dans la console si le problème persiste.

## 📝 Prévention Future

Pour éviter ce problème à l'avenir, ajoutez une **contrainte CASCADE** dans Supabase :

```sql
-- Dans la table user_companies, modifier la foreign key
ALTER TABLE user_companies
DROP CONSTRAINT IF EXISTS user_companies_company_id_fkey;

ALTER TABLE user_companies
ADD CONSTRAINT user_companies_company_id_fkey
FOREIGN KEY (company_id)
REFERENCES companies(id)
ON DELETE CASCADE;  -- ✅ Supprime automatiquement les liens
```

Ainsi, supprimer une entreprise supprimera automatiquement les enregistrements dans `user_companies`.

## 🧪 Test de Validation

Après avoir suivi les étapes :

1. **Vous devriez voir** :
   - URL : `http://localhost:5173/onboarding`
   - Page d'onboarding s'affiche
   - Console : `[WARN] getUserCompanies: No company links found for user`

2. **Vous NE devriez PAS voir** :
   - Écran de chargement infini
   - `[WARN] getUserCompanies: Found X company link(s)`
   - Erreurs RLS/Policy

## 📞 Support

Si le problème persiste après ces étapes :

1. Exécutez `DIAGNOSTIC_ONBOARDING.sql` complet
2. Partagez les résultats (screenshot des 5 requêtes)
3. Partagez les logs console (filtrez par "getUserCompanies")

---

**Fichiers Créés pour le Dépannage :**
- ✅ `CLEAR_ONBOARDING_CACHE.js` - Script console pour nettoyer localStorage
- ✅ `DIAGNOSTIC_ONBOARDING.sql` - Requêtes de diagnostic Supabase
- ✅ `CLEANUP_ONBOARDING.sql` - Script de nettoyage Supabase
- ✅ `ONBOARDING_TROUBLESHOOTING.md` - Ce guide (vous êtes ici)

**Code Amélioré :**
- ✅ `src/lib/company.ts` - Logs de diagnostic ajoutés
