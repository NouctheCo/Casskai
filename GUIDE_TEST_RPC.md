# 🧪 Guide de Test - Fonction RPC `create_company_with_defaults`

## 🚀 Test Rapide (3 minutes)

### Étape 1 : Ouvrir Supabase SQL Editor

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet CassKai
3. Cliquez sur **SQL Editor** dans le menu de gauche
4. Créez une nouvelle requête

### Étape 2 : Récupérer votre User ID

Copiez-collez cette requête dans le SQL Editor :

```sql
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
```

Cliquez sur **Run** et **copiez l'UUID** d'un utilisateur (première colonne).

Exemple : `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### Étape 3 : Tester la Création d'Entreprise

Copiez cette requête et **remplacez `VOTRE-USER-ID-ICI`** par l'UUID copié :

```sql
SELECT create_company_with_defaults('{
  "name": "Ma Première Société Test",
  "owner_id": "VOTRE-USER-ID-ICI",
  "country": "FR",
  "email": "test@example.com"
}'::jsonb);
```

Cliquez sur **Run**. Vous devriez voir :

```json
{
  "success": true,
  "company_id": "uuid-de-la-nouvelle-entreprise",
  "message": "Company created successfully with default data",
  "data": {
    "company": { ... },
    "journals_created": 6,
    "user_linked": true,
    "onboarding_created": false
  }
}
```

### Étape 4 : Vérifier les Données Créées

```sql
-- Voir l'entreprise
SELECT id, name, country, default_currency, created_at
FROM companies
WHERE name = 'Ma Première Société Test';

-- Voir les journaux créés
SELECT j.name, j.code, j.type
FROM journals j
JOIN companies c ON c.id = j.company_id
WHERE c.name = 'Ma Première Société Test'
ORDER BY j.code;
```

Vous devriez voir **6 journaux** :
- ACH - Journal d'achats
- AN - Journal à nouveaux
- BNQ - Journal de banque
- CAI - Journal de caisse
- OD - Journal d'opérations diverses
- VEN - Journal de ventes

---

## ✅ Résultat Attendu

### Si tout fonctionne :
- ✅ `"success": true`
- ✅ `"company_id"` contient un UUID
- ✅ `"journals_created": 6` (pour FR)
- ✅ `"user_linked": true`

### Si erreur :
- ❌ `"success": false`
- ❌ `"error"` contient le message d'erreur

---

## 🔧 Résolution de Problèmes

### Erreur : "Missing owner_id or auth.uid()"

**Cause** : Vous n'avez pas remplacé `VOTRE-USER-ID-ICI`

**Solution** : Assurez-vous de copier un UUID valide depuis `auth.users`

### Erreur : "Company name is required"

**Cause** : Le champ `name` est vide

**Solution** : Vérifiez que `"name": "Ma Société"` est bien présent

### La requête ne retourne rien

**Cause** : Erreur de syntaxe SQL

**Solution** : Vérifiez que vous avez bien copié toute la requête avec les accolades `{...}`

---

## 🧹 Nettoyage

Pour supprimer les entreprises de test :

```sql
-- ATTENTION: Supprime TOUTES les entreprises dont le nom contient "Test"
DELETE FROM companies WHERE name LIKE '%Test%';
```

---

## 📁 Fichiers Disponibles

- **Test simple** : [scripts/test-company-creation-simple.sql](scripts/test-company-creation-simple.sql)
- **Test complet** : [scripts/test-company-creation-rpc.sql](scripts/test-company-creation-rpc.sql)
- **Documentation** : [RAPPORT_FONCTION_RPC_CREATE_COMPANY.md](RAPPORT_FONCTION_RPC_CREATE_COMPANY.md)

---

## 💡 Exemple Complet Prêt à l'Emploi

Remplacez juste `VOTRE-USER-ID-ICI` :

```sql
-- 1. Récupérer un user_id
SELECT id FROM auth.users LIMIT 1;

-- 2. Créer une entreprise (remplacez l'UUID)
SELECT create_company_with_defaults('{
  "name": "ACME Corp",
  "owner_id": "VOTRE-USER-ID-ICI",
  "country": "FR",
  "default_currency": "EUR",
  "email": "contact@acme.fr",
  "phone": "+33 1 23 45 67 89",
  "sector": "Services",
  "company_size": "10-50"
}'::jsonb);

-- 3. Vérifier
SELECT
  c.name,
  c.country,
  COUNT(j.id) as nb_journaux
FROM companies c
LEFT JOIN journals j ON j.company_id = c.id
WHERE c.name = 'ACME Corp'
GROUP BY c.id, c.name, c.country;
```

**Résultat attendu** : `nb_journaux = 6`

---

## ✨ Prochaine Étape

Une fois le test réussi, vous pouvez utiliser cette fonction dans votre code frontend :

```typescript
const { data } = await supabase.rpc('create_company_with_defaults', {
  p_payload: {
    name: companyName,
    country: 'FR',
    email: companyEmail,
    // ... autres champs
  },
});

if (data.success) {
  console.log('Entreprise créée:', data.company_id);
  router.push('/dashboard');
}
```

---

**Date** : 2025-01-17
**Version** : 1.0
