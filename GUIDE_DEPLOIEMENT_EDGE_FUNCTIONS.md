# 🚀 Guide de Déploiement - Edge Functions RGPD

**Date:** 2025-12-04
**Environnement:** PRODUCTION Supabase

---

## ⚠️ **PRÉCAUTIONS IMPORTANTES**

Vous travaillez sur **Supabase de PRODUCTION**. Suivez ces étapes avec attention.

---

## 📋 **Fichiers créés**

### 1. Edge Functions ✅
- [supabase/functions/export-user-data/index.ts](c:\Users\noutc\Casskai\supabase\functions\export-user-data\index.ts)
- [supabase/functions/delete-account/index.ts](c:\Users\noutc\Casskai\supabase\functions\delete-account\index.ts)

### 2. Migration SQL ✅
- [supabase/migrations/20251204_create_account_deletion_requests.sql](c:\Users\noutc\Casskai\supabase\migrations\20251204_create_account_deletion_requests.sql)

---

## 🔧 **Étape 1: Créer la table SQL (2 min)**

### Option A: Via Dashboard Supabase (RECOMMANDÉ pour production)

1. Ouvrir le dashboard Supabase: https://supabase.com/dashboard
2. Aller dans **SQL Editor** (menu gauche)
3. Cliquer sur **New Query**
4. Copier-coller le contenu du fichier:
   ```
   c:\Users\noutc\Casskai\supabase\migrations\20251204_create_account_deletion_requests.sql
   ```
5. Cliquer sur **Run** (en bas à droite)
6. Vérifier dans **Table Editor** que la table `account_deletion_requests` est créée

### Option B: Via Supabase CLI

```bash
# Si Supabase CLI est installé et linké au projet
cd c:\Users\noutc\Casskai
supabase db push
```

### ✅ Vérification

```sql
-- Vérifier que la table existe
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'account_deletion_requests'
ORDER BY ordinal_position;

-- Devrait retourner 15 colonnes
```

---

## 🚀 **Étape 2: Déployer les Edge Functions (5 min)**

### Prérequis

```bash
# Vérifier que Supabase CLI est installé
supabase --version
# Si pas installé: npm install -g supabase

# Vérifier que vous êtes connecté
supabase projects list
```

### Si pas encore linké au projet:

```bash
cd c:\Users\noutc\Casskai

# Lier au projet Supabase (vous aurez besoin de la Project ID)
supabase link --project-ref VOTRE_PROJECT_REF
# Exemple: supabase link --project-ref abcdefghijklmnop

# Vous serez invité à saisir votre token d'accès
# Allez sur: https://supabase.com/dashboard/account/tokens
```

### Déployer les Edge Functions:

```bash
cd c:\Users\noutc\Casskai

# Déployer export-user-data
supabase functions deploy export-user-data

# Déployer delete-account
supabase functions deploy delete-account
```

### ✅ Vérification

1. Aller sur Dashboard Supabase
2. Menu **Edge Functions** (menu gauche)
3. Vérifier que vous voyez:
   - ✅ `export-user-data` (Active)
   - ✅ `delete-account` (Active)

---

## 🧪 **Étape 3: Tester les Edge Functions (10 min)**

### Test 1: Export de données

#### Via Dashboard Supabase:
1. Aller dans **Edge Functions** > `export-user-data`
2. Cliquer sur **Invoke** (bouton en haut à droite)
3. Dans l'onglet **Headers**, ajouter:
   ```
   Authorization: Bearer VOTRE_JWT_TOKEN
   ```
   > Pour obtenir votre JWT token:
   > - Ouvrir https://casskai.app
   > - Ouvrir DevTools (F12) > Console
   > - Taper: `localStorage.getItem('supabase.auth.token')`

4. Cliquer sur **Send Request**
5. Vérifier la réponse (doit contenir `"success": true`)

#### Via curl (Windows PowerShell):

```powershell
# Remplacer VOTRE_JWT_TOKEN et VOTRE_PROJECT_URL
$jwt = "VOTRE_JWT_TOKEN"
$url = "https://VOTRE_PROJECT_REF.supabase.co/functions/v1/export-user-data"

$headers = @{
    "Authorization" = "Bearer $jwt"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri $url -Method POST -Headers $headers
```

### Test 2: Demande de suppression

```powershell
$jwt = "VOTRE_JWT_TOKEN"
$url = "https://VOTRE_PROJECT_REF.supabase.co/functions/v1/delete-account"

$body = @{
    reason = "Test de la fonction de suppression"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $jwt"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
```

### ✅ Vérifications après tests

```sql
-- Vérifier les logs RGPD
SELECT
  action,
  operation_status,
  created_at,
  metadata
FROM rgpd_logs
ORDER BY created_at DESC
LIMIT 10;

-- Vérifier les demandes de suppression
SELECT
  user_id,
  status,
  scheduled_deletion_date,
  requested_at
FROM account_deletion_requests
ORDER BY requested_at DESC
LIMIT 10;
```

---

## 📦 **Étape 4: Intégrer dans le frontend (15 min)**

### Modifier `rgpdService.ts` pour utiliser les Edge Functions

```typescript
// Dans src/services/rgpdService.ts

/**
 * Export des données utilisateur via Edge Function
 */
export async function exportUserDataViaEdge(userId: string): Promise<UserDataExport> {
  try {
    const { data, error } = await supabase.functions.invoke('export-user-data', {
      body: {} // Pas besoin de body, le JWT identifie l'utilisateur
    });

    if (error) {
      throw new Error(error.message || 'Erreur lors de l\'export des données');
    }

    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de l\'export des données');
    }

    return data.data;
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw error;
  }
}

/**
 * Demande de suppression de compte via Edge Function
 */
export async function requestAccountDeletionViaEdge(
  userId: string,
  reason?: string,
  ownershipTransfers?: Array<{ company_id: string; new_owner_id: string }>
): Promise<{ success: boolean; deletion_request: any }> {
  try {
    const { data, error } = await supabase.functions.invoke('delete-account', {
      body: {
        reason,
        ownership_transfers: ownershipTransfers
      }
    });

    if (error) {
      throw new Error(error.message || 'Erreur lors de la demande de suppression');
    }

    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de la demande de suppression');
    }

    return data;
  } catch (error) {
    console.error('Error requesting account deletion:', error);
    throw error;
  }
}
```

### Mettre à jour les hooks React

```typescript
// Dans src/services/rgpdService.ts

export function useUserDataExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await exportUserDataViaEdge(user.id); // ← MODIFIER

      // Télécharger le fichier
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `casskai-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { exportData, loading, error };
}
```

---

## 🧪 **Étape 5: Test end-to-end (5 min)**

1. **Se connecter sur https://casskai.app**
2. **Aller dans Settings > Privacy** (quand l'onglet sera créé)
3. **Cliquer sur "Exporter mes données"**
4. **Vérifier:**
   - ✅ Un fichier JSON est téléchargé
   - ✅ Le fichier contient toutes les données (profil, entreprises, factures, etc.)
   - ✅ Un log est créé dans `rgpd_logs` (operation_status = 'success')

5. **Tester la demande de suppression:**
   - Cliquer sur "Supprimer mon compte"
   - ✅ Message: "Suppression prévue dans 30 jours"
   - ✅ Une entrée est créée dans `account_deletion_requests`

---

## 📊 **Monitoring et Logs**

### Vérifier les logs Edge Functions

```bash
# Voir les logs en temps réel
supabase functions logs export-user-data --follow
supabase functions logs delete-account --follow
```

### Dashboard Supabase:
1. Menu **Edge Functions**
2. Cliquer sur une fonction
3. Onglet **Logs** (en haut)

### Vérifier les logs RGPD en SQL:

```sql
-- Stats des exports
SELECT
  DATE(created_at) as date,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE operation_status = 'success') as success,
  COUNT(*) FILTER (WHERE operation_status = 'failed') as failed
FROM rgpd_logs
WHERE action = 'EXPORT_DATA'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Stats des suppressions
SELECT
  DATE(created_at) as date,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE operation_status = 'success') as success,
  COUNT(*) FILTER (WHERE operation_status = 'failed') as failed
FROM rgpd_logs
WHERE action = 'DELETE_ACCOUNT'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🛡️ **Sécurité et Rate Limiting**

### Rate Limiting implémenté:
- ✅ **Export:** 1 export par 24h par utilisateur
- ⚠️ **Delete:** Pas de limite (mais période de grâce de 30 jours)

### Vérifier le rate limiting:

```sql
-- Derniers exports par utilisateur
SELECT
  user_id,
  COUNT(*) as export_count,
  MAX(created_at) as last_export,
  EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) / 3600 as hours_since_last
FROM rgpd_logs
WHERE action = 'EXPORT_DATA'
  AND operation_status = 'success'
GROUP BY user_id
HAVING EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) / 3600 < 24;
```

---

## ✅ **Checklist de déploiement**

- [ ] Table `account_deletion_requests` créée en production
- [ ] Edge Function `export-user-data` déployée et active
- [ ] Edge Function `delete-account` déployée et active
- [ ] Tests export réussis (status 200 + fichier JSON généré)
- [ ] Tests delete réussis (status 200 + entrée dans account_deletion_requests)
- [ ] Logs RGPD visibles dans la table `rgpd_logs`
- [ ] Frontend intégré avec les nouvelles Edge Functions
- [ ] Test end-to-end sur https://casskai.app

---

## 🆘 **Troubleshooting**

### Erreur: "Table account_deletion_requests does not exist"
**Solution:** Exécuter la migration SQL (Étape 1)

### Erreur: "Authorization header missing"
**Solution:** Vérifier que le JWT token est bien passé dans le header

### Erreur: "Rate limit exceeded"
**Solution:** Attendre 24h ou supprimer l'entrée de test dans `rgpd_logs`

### Erreur: "Ownership transfer required"
**Solution:** Fournir `ownership_transfers` dans le body si l'utilisateur possède des entreprises

### Edge Function ne se déploie pas
```bash
# Vérifier les erreurs de syntaxe
supabase functions serve export-user-data

# Forcer le redéploiement
supabase functions deploy export-user-data --no-verify-jwt
```

---

## 📞 **Support**

Si vous rencontrez des problèmes:
1. Vérifier les logs Edge Functions (Dashboard > Edge Functions > Logs)
2. Vérifier les logs SQL (`rgpd_logs` table)
3. Tester avec curl/Postman avant d'intégrer au frontend

---

**Prochaine étape:** Créer l'onglet "Privacy & RGPD" dans SettingsPage.tsx
