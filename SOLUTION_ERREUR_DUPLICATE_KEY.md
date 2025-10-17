# 🔧 Solution - Erreur "duplicate key value violates unique constraint"

## ❌ Erreur Rencontrée

```json
{
  "error": "duplicate key value violates unique constraint \"journals_company_id_code_key\"",
  "success": false
}
```

## 🎯 Cause

Vous avez essayé de créer plusieurs entreprises avec le même `owner_id`, et la fonction a tenté de créer des journaux avec les mêmes codes (VEN, ACH, BNQ, etc.) pour la même entreprise.

## ✅ Solution Appliquée

J'ai corrigé la fonction RPC avec **2 améliorations majeures** :

### 1️⃣ Détection des Entreprises Existantes

La fonction vérifie maintenant si une entreprise avec le même nom existe déjà pour l'utilisateur :

```sql
-- Si entreprise existe déjà, retour avec message clair
{
  "success": false,
  "error": "Company already exists",
  "existing_company_id": "uuid-de-lentreprise-existante",
  "hint": "Use a different company name or update the existing company"
}
```

### 2️⃣ Protection Contre les Doublons

Ajout de `ON CONFLICT DO NOTHING` pour éviter les erreurs :

```sql
-- Les journaux ne sont créés que s'ils n'existent pas déjà
INSERT INTO journals (...) VALUES (...)
ON CONFLICT (company_id, code) DO NOTHING;
```

---

## 🧹 Nettoyage Recommandé

### Étape 1 : Supprimer les Entreprises de Test

Utilisez le fichier [scripts/cleanup-test-companies.sql](scripts/cleanup-test-companies.sql) :

```sql
-- 1. Voir ce qui va être supprimé
SELECT id, name, created_at
FROM companies
WHERE name LIKE '%Test%'
ORDER BY created_at DESC;

-- 2. Supprimer
DELETE FROM companies WHERE name LIKE '%Test%';
```

### Étape 2 : Tester à Nouveau

```sql
-- Remplacez VOTRE-USER-ID par votre UUID
SELECT create_company_with_defaults('{
  "name": "Nouvelle Entreprise Test",
  "owner_id": "VOTRE-USER-ID",
  "country": "FR"
}'::jsonb);
```

**Résultat attendu** :
```json
{
  "success": true,
  "company_id": "nouveau-uuid",
  "data": {
    "journals_created": 6,
    "is_default_company": true
  }
}
```

---

## 🔄 Nouvelle Version - Fonctionnalités

### ✅ Gestion Intelligente des Doublons

| Cas | Comportement |
|-----|--------------|
| **Nom unique** | ✅ Création normale |
| **Nom existe déjà** | ❌ Retourne l'ID existant + message |
| **Journaux existent** | ⚠️ Ignore les doublons, continue |
| **Erreur inattendue** | ❌ Rollback + message détaillé |

### ✅ Gestion is_default Automatique

Quand vous créez une nouvelle entreprise :

1. Toutes les anciennes entreprises de l'utilisateur → `is_default = false`
2. La nouvelle entreprise → `is_default = true`

Ainsi, l'utilisateur a toujours **UNE SEULE** entreprise par défaut.

---

## 🧪 Scénarios de Test

### Test 1 : Première Création (OK)

```sql
SELECT create_company_with_defaults('{
  "name": "ACME Corp",
  "owner_id": "votre-user-id",
  "country": "FR"
}'::jsonb);
```

**Résultat** : ✅ `"success": true`, 6 journaux créés

### Test 2 : Même Nom (Détecté)

```sql
SELECT create_company_with_defaults('{
  "name": "ACME Corp",
  "owner_id": "votre-user-id",
  "country": "FR"
}'::jsonb);
```

**Résultat** : ❌ `"error": "Company already exists"`

### Test 3 : Nom Différent (OK)

```sql
SELECT create_company_with_defaults('{
  "name": "ACME Corp 2",
  "owner_id": "votre-user-id",
  "country": "FR"
}'::jsonb);
```

**Résultat** : ✅ `"success": true`, nouvelle entreprise créée

---

## 📋 Checklist de Vérification

Après nettoyage et correction :

- [ ] Les entreprises de test sont supprimées
- [ ] La nouvelle fonction RPC est déployée (v2.0)
- [ ] Test de création réussit sans erreur
- [ ] Vérification : 6 journaux créés pour FR
- [ ] Vérification : `is_default = true` pour la nouvelle entreprise

---

## 🚀 Commandes Rapides

```sql
-- 1. NETTOYER
DELETE FROM companies WHERE name LIKE '%Test%';

-- 2. TESTER (remplacer USER-ID)
SELECT create_company_with_defaults('{
  "name": "Ma Société",
  "owner_id": "USER-ID",
  "country": "FR",
  "email": "contact@example.com"
}'::jsonb);

-- 3. VÉRIFIER
SELECT
  c.name,
  c.country,
  COUNT(j.id) as nb_journaux,
  uc.is_default
FROM companies c
LEFT JOIN journals j ON j.company_id = c.id
LEFT JOIN user_companies uc ON uc.company_id = c.id
WHERE c.name = 'Ma Société'
GROUP BY c.id, c.name, c.country, uc.is_default;
```

**Résultat attendu** : `nb_journaux = 6`, `is_default = true`

---

## 💡 Utilisation dans le Code Frontend

La nouvelle version est **encore plus simple** à utiliser :

```typescript
const { data } = await supabase.rpc('create_company_with_defaults', {
  p_payload: {
    name: companyName,
    country: 'FR',
    email: companyEmail,
  },
});

if (data.success) {
  console.log('Entreprise créée:', data.company_id);
  console.log('Journaux:', data.data.journals_created);
  router.push('/dashboard');
} else if (data.error === 'Company already exists') {
  // Entreprise existe déjà
  console.warn('Entreprise déjà créée:', data.existing_company_id);
  toast.error('Cette entreprise existe déjà');
} else {
  // Autre erreur
  console.error('Erreur:', data.message);
  toast.error(data.message);
}
```

---

## 📊 Améliorations Apportées

| Version | Problème | Solution |
|---------|----------|----------|
| **v1.0** | ❌ Erreur duplicate key | Aucune gestion |
| **v2.0** | ✅ Détection doublons | `ON CONFLICT DO NOTHING` |
| **v2.0** | ✅ Nom existe déjà | Vérification préalable |
| **v2.0** | ✅ is_default multiple | Mise à jour automatique |
| **v2.0** | ✅ Erreurs claires | Gestion unique_violation |

---

## 📁 Fichiers Utiles

- 🧹 **Nettoyage** : [scripts/cleanup-test-companies.sql](scripts/cleanup-test-companies.sql)
- 📖 **Guide test** : [GUIDE_TEST_RPC.md](GUIDE_TEST_RPC.md)
- 📚 **Documentation** : [RAPPORT_FONCTION_RPC_CREATE_COMPANY.md](RAPPORT_FONCTION_RPC_CREATE_COMPANY.md)

---

**Statut** : ✅ **Corrigé et Déployé**
**Version** : 2.0
**Date** : 2025-01-17
