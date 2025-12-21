# 🚀 Guide de déploiement - Suppression de compte et d'entreprise

## 📋 Vue d'ensemble

Ce guide montre comment déployer les nouveaux systèmes de suppression de compte et d'entreprise.

### Ce qui a été implémenté :
- ✅ **Suppression de compte** : Améliorations sur le système existant (30 jours de délai de grâce)
- ✅ **Suppression d'entreprise** : Nouveau système avec consensus des propriétaires
- ✅ **Approbations** : Gestion des approbations multiples des propriétaires
- ✅ **Edge Functions** : 3 nouvelles Edge Functions déployées
- ✅ **Export FEC** : Automatisé avant suppression d'entreprise
- ✅ **UI Frontend** : Composant de suppression d'entreprise avec workflow complet

---

## 🔧 Étape 1 : Créer les tables Supabase

### 1.1 Exécuter la migration SQL

Connectez-vous à votre projet Supabase et exécutez le SQL depuis le fichier :

```
supabase/migrations/20251217_create_deletion_requests_tables.sql
```

Cette migration crée :
- `account_deletion_requests` - Demandes de suppression de compte
- `company_deletion_requests` - Demandes de suppression d'entreprise
- `company_deletion_approvals` - Approbations des propriétaires
- Fonctions RLS et de contrôle d'accès

**Étapes:**
1. Allez à [Supabase Console](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez à `SQL Editor`
4. Créez une nouvelle requête
5. Copiez/collez le contenu de la migration
6. Cliquez sur "Run"

### 1.2 Vérifier la création

Exécutez ce script pour vérifier :

```bash
cd c:\Users\noutc\Casskai
$env:SUPABASE_SERVICE_KEY='votre-clé-service'; node scripts/check-supabase-deletion-tables.cjs
```

Résultat attendu :
```
✅ account_deletion_requests: ✅ OUI
✅ company_deletion_requests: ✅ OUI
✅ company_deletion_approvals: ✅ OUI
✅ rgpd_logs: ✅ OUI
```

---

## 🔌 Étape 2 : Déployer les Edge Functions

### 2.1 Déployer delete-company

```bash
cd c:\Users\noutc\Casskai
supabase functions deploy delete-company
```

Vérifier le déploiement :
```bash
supabase functions logs delete-company --follow
```

### 2.2 Déployer approve-company-deletion

```bash
supabase functions deploy approve-company-deletion
```

Vérifier :
```bash
supabase functions logs approve-company-deletion --follow
```

### 2.3 Vérifier la Edge Function delete-account (existante)

```bash
supabase functions list
```

Vous devriez voir :
- ✅ `delete-account` (existante)
- ✅ `delete-company` (nouvelle)
- ✅ `approve-company-deletion` (nouvelle)

---

## 🧪 Étape 3 : Tester en développement

### 3.1 Lancer l'application

```bash
cd c:\Users\noutc\Casskai
npm run dev
```

### 3.2 Test suppression d'entreprise (seul propriétaire)

1. Connectez-vous
2. Allez dans `Settings` > `Entreprise`
3. Scroll vers le bas, cliquez sur "Supprimer"
4. Vérifiez :
   - Dialog montre "Suppression d'entreprise"
   - Indique "Seul propriétaire - Demande approuvée"
   - Export FEC sera généré

### 3.3 Test suppression d'entreprise (consensus requis)

1. Créez une entreprise de test
2. Invitez un autre propriétaire
3. Allez dans Settings > Entreprise
4. Cliquez sur "Supprimer"
5. Vérifiez :
   - Dialog montre les propriétaires à approuver
   - Le status indique "En attente d'approbation"

### 3.4 Test approbation

1. Connectez-vous avec le deuxième propriétaire
2. Allez dans [Dashboard](http://localhost:5173/dashboard)
3. Cherchez la section "Approbations en attente"
4. Cliquez pour approuver ou rejeter
5. Vérifiez l'évolution du statut

---

## 📊 Vérifier l'état Supabase

### Requête pour voir les demandes de suppression :

```sql
-- Suppression de compte en attente
SELECT id, user_id, status, scheduled_deletion_date, created_at
FROM account_deletion_requests
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Suppression d'entreprise en attente
SELECT id, company_id, requested_by, status, required_approvals, received_approvals
FROM company_deletion_requests
WHERE status IN ('pending', 'approval_pending', 'approved')
ORDER BY created_at DESC;

-- Approbations reçues
SELECT dra.*, d.company_id, d.status
FROM company_deletion_approvals dra
JOIN company_deletion_requests d ON dra.deletion_request_id = d.id
WHERE d.status = 'approval_pending'
ORDER BY dra.created_at DESC;
```

---

## 🔐 Sécurité & Permissions

Les tables ont les politiques RLS (Row Level Security) :

| Table | Accès |
|-------|-------|
| `account_deletion_requests` | Chaque utilisateur voit ses propres demandes |
| `company_deletion_requests` | Propriétaires + approvers autorisés |
| `company_deletion_approvals` | Approvers + demandeur |

---

## 📝 Fichiers modifiés

### Backend/Supabase
- `supabase/migrations/20251217_create_deletion_requests_tables.sql` - **NOUVEAU**
- `supabase/functions/delete-company/index.ts` - **NOUVEAU**
- `supabase/functions/approve-company-deletion/index.ts` - **NOUVEAU**
- `supabase/functions/delete-account/index.ts` - Existant (compatible)

### Frontend
- `src/services/companyDeletionService.ts` - **NOUVEAU**
- `src/hooks/useCompanyDeletion.ts` - **NOUVEAU**
- `src/components/settings/CompanyDeletionDialog.tsx` - **NOUVEAU**
- `src/components/settings/CompanySettings.tsx` - **MODIFIÉ** (import + UI)
- `src/components/settings/UserPrivacySettings.tsx` - Existant (compatible)

---

## 🐛 Dépannage

### Erreur: "Table account_deletion_requests n'existe pas"
**Solution:** Exécutez la migration SQL dans Supabase Console

### Erreur: "Authorization header manquant"
**Solution:** Vérifiez que le token JWT est envoyé avec le header `Authorization: Bearer <token>`

### Erreur: "Table company_deletion_approvals n'existe pas"
**Solution:** Vérifiez que la migration s'est exécutée correctement

### Edge Function retourne 404
**Solution:** Vérifiez le déploiement avec `supabase functions list`

---

## ✨ Prochaines étapes

1. **Export FEC** - Implémenter la génération automatique
2. **Notifications email** - Ajouter les emails d'approbation
3. **Webhook de suppression** - Exécuter la suppression réelle après 30 jours
4. **Historique** - Logger toutes les opérations dans `rgpd_logs`

---

## 📚 Références

- [RGPD Article 17 - Droit à l'effacement](https://www.cnil.fr/)
- [Documentation Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
