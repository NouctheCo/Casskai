# Debug: Security Logs Vides dans Paramètres → Sécurité

**Date**: 2026-01-09
**Statut**: 🔍 **EN COURS DE DEBUG**
**Impact**: 🟠 **BUG MOYEN** - Security Logs vides dans Paramètres mais visibles dans admin/audit-logs

---

## 🐛 Problème Signalé

**Observation** :
- ✅ Page `/admin/audit-logs` → Affiche les logs correctement
- ❌ Page `/settings` (Sécurité) → Security Logs vide

---

## 🔍 Différences Entre les Deux Pages

### 1. Page Admin (admin/audit-logs) ✅

**Fichier**: [src/pages/AuditLogsPage.tsx](src/pages/AuditLogsPage.tsx)

**Requête utilisée** :
```typescript
const data = await auditService.getCompanyLogs(currentCompany.id, options);
```

**Service**: `auditService.getCompanyLogs()` → Table `audit_logs`

### 2. Page Paramètres Sécurité (settings) ❌

**Fichier**: [src/components/security/SecurityLogsDashboard.tsx](src/components/security/SecurityLogsDashboard.tsx)

**Requête utilisée** :
```typescript
const [logsResult, statsResult] = await Promise.all([
  searchSecurityLogs(filters),  // RPC: search_security_logs
  getSecurityStats(companyId, 30) // RPC: get_security_stats
]);
```

**Service**: `securityLogService.searchSecurityLogs()` → RPC `search_security_logs` → Table `security_logs`

---

## 🔑 Cause Probable: Tables Différentes!

### Table 1: audit_logs ✅
- Utilisée par admin/audit-logs
- Contient des données
- Fonctionne correctement

### Table 2: security_logs ❌
- Utilisée par Security Logs Dashboard
- **Probablement vide!**
- RPC `search_security_logs` retourne 0 résultats

**HYPOTHÈSE** : Les logs de sécurité ne sont **pas enregistrés** dans la table `security_logs`.

---

## 🧪 Tests à Effectuer (Instructions pour l'Utilisateur)

### Test 1: Ouvrir la Console du Navigateur

1. Aller sur https://casskai.app/settings
2. Ouvrir DevTools (F12)
3. Aller dans l'onglet **Console**
4. Cliquer sur l'onglet **"Sécurité"** dans les paramètres

**Logs attendus** :
```
[SecurityLogsDashboard] === LOADING SECURITY LOGS ===
{
  companyId: "xxx",
  filters: { companyId: "xxx", startDate: "2026-01-02", endDate: "2026-01-09" },
  severityFilter: "all",
  categoryFilter: "all"
}

[SecurityLogService] >>> CALLING search_security_logs RPC <<<
{
  filters: { companyId: "xxx", startDate: "2026-01-02", endDate: "2026-01-09" },
  params: {
    p_company_id: "xxx",
    p_event_type: null,
    p_severity: null,
    p_user_id: null,
    p_start_date: "2026-01-02",
    p_end_date: "2026-01-09",
    p_limit: 100
  }
}

[SecurityLogService] ✅ RPC search_security_logs SUCCESS:
{
  resultCount: 0,  // ❌ 0 résultats!
  firstResult: undefined
}

[SecurityLogsDashboard] === SECURITY LOGS LOADED ===
{
  logsCount: 0,  // ❌ Vide!
  statsTotal: 0,
  firstLog: undefined,
  stats: { ... }
}
```

**Si vous voyez `resultCount: 0`** → La table `security_logs` est vide!

---

### Test 2: Vérifier la Table security_logs dans Supabase

**Requête SQL** :
```sql
-- Compter les logs dans security_logs
SELECT COUNT(*) as total_security_logs
FROM security_logs;

-- Comparer avec audit_logs
SELECT COUNT(*) as total_audit_logs
FROM audit_logs;

-- Voir les derniers logs de sécurité
SELECT *
FROM security_logs
ORDER BY created_at DESC
LIMIT 10;
```

**Résultats attendus** :
- Si `total_security_logs = 0` → La table est vide! ❌
- Si `total_audit_logs > 0` → Les logs vont ailleurs ✅

---

### Test 3: Vérifier si la RPC Fonctionne

**Test direct de la RPC** (dans Supabase SQL Editor) :
```sql
SELECT * FROM search_security_logs(
  p_company_id := 'votre-company-id',
  p_event_type := NULL,
  p_severity := NULL,
  p_user_id := NULL,
  p_start_date := '2026-01-01'::DATE,
  p_end_date := '2026-01-09'::DATE,
  p_limit := 100
);
```

**Si la RPC retourne 0 lignes** → La table `security_logs` est vide!

---

## 🔧 Solutions Possibles

### Solution 1: Utiliser audit_logs au Lieu de security_logs

Si `security_logs` est vide mais `audit_logs` contient des données, modifier `SecurityLogsDashboard.tsx` pour utiliser `auditService` :

**Fichier**: `src/components/security/SecurityLogsDashboard.tsx`

**AVANT** :
```typescript
const [logsResult, statsResult] = await Promise.all([
  searchSecurityLogs(filters),  // ❌ Table security_logs (vide)
  getSecurityStats(companyId, 30)
]);
```

**APRÈS** :
```typescript
import { auditService } from '@/services/auditService';

// ...

const logsResult = await auditService.getCompanyLogs(companyId, {
  limit: filters.limit || 100,
  start_date: filters.startDate,
  end_date: filters.endDate
});
```

---

### Solution 2: Enregistrer les Logs dans security_logs

Si vous voulez utiliser `security_logs`, il faut enregistrer les événements de sécurité.

**Fichier à modifier** : `src/services/securityLogService.ts`

**Fonction existante** : `logSecurityEvent()` utilise déjà une RPC `log_security_event`.

**Vérifier que cette fonction est appelée** :
```bash
grep -r "logSecurityEvent\|logLogin\|logLogout" src/
```

Si elle n'est **jamais appelée** → Ajouter des appels dans:
- Authentification (login/logout)
- Exports FEC, PDF, Excel
- Modifications comptables sensibles

**Exemple** :
```typescript
// Dans AuthContext.tsx après login
import { logLogin } from '@/services/securityLogService';

const handleLogin = async () => {
  try {
    const result = await signIn(email, password);
    await logLogin(true); // ✅ Log successful login
  } catch (error) {
    await logLogin(false, error.message); // ✅ Log failed login
  }
};
```

---

### Solution 3: Unifier les Deux Tables (Avancé)

Si `audit_logs` et `security_logs` font la même chose, créer une vue unifiée ou migrer les données.

**Migration SQL** :
```sql
-- Copier les audit_logs vers security_logs
INSERT INTO security_logs (
  company_id,
  event_type,
  event_category,
  severity,
  user_email,
  action,
  description,
  success,
  created_at
)
SELECT
  company_id,
  event_type::text,
  CASE
    WHEN event_type IN ('LOGIN', 'LOGOUT') THEN 'authentication'
    WHEN event_type IN ('RGPD_EXPORT') THEN 'export'
    WHEN event_type IN ('DELETE') THEN 'data_modification'
    ELSE 'data_access'
  END,
  security_level::text,
  user_email,
  event_type::text,
  table_name || ' ' || record_id,
  true,
  event_timestamp
FROM audit_logs
WHERE event_timestamp >= NOW() - INTERVAL '30 days';
```

---

## 📊 Diagnostic: Quelle Table Utiliser?

### Cas 1: security_logs est vide → Utiliser audit_logs

**Action** : Modifier `SecurityLogsDashboard.tsx` pour utiliser `auditService.getCompanyLogs()`

**Avantage** : Solution rapide, les données existent déjà

**Inconvénient** : `security_logs` reste inutilisée

### Cas 2: Vous voulez utiliser security_logs → Implémenter les Logs

**Action** : Appeler `logSecurityEvent()` partout dans l'application

**Avantage** : Séparation audit_logs (traçabilité) vs security_logs (sécurité)

**Inconvénient** : Nécessite de modifier de nombreux fichiers

### Cas 3: Fusionner les deux tables → Migration

**Action** : Migrer les données de `audit_logs` vers `security_logs`

**Avantage** : Table unique, plus simple

**Inconvénient** : Risque de perte de données si mal fait

---

## 🎯 Recommandation

### Option Recommandée: Utiliser audit_logs (Solution Rapide)

**Raison** : Les données existent déjà, pas besoin de réécrire du code.

**Modification à faire** :
1. Créer un adaptateur qui transforme `audit_logs` au format `SecurityLog`
2. Modifier `SecurityLogsDashboard.tsx` pour utiliser cet adaptateur
3. Garder `security_logs` pour de futurs logs spécifiques à la sécurité

**Code à ajouter** : `src/services/securityLogAdapter.ts`
```typescript
import { auditService, type AuditLogEntry } from '@/services/auditService';
import type { SecurityLog } from '@/services/securityLogService';

export async function getSecurityLogsFromAudit(
  companyId: string,
  options: {
    limit?: number;
    start_date?: string;
    end_date?: string;
  }
): Promise<SecurityLog[]> {
  const auditLogs = await auditService.getCompanyLogs(companyId, options);

  return auditLogs.map(log => ({
    id: log.id,
    company_id: log.company_id,
    event_type: mapEventType(log.event_type),
    event_category: mapCategory(log.event_type),
    severity: mapSeverity(log.security_level),
    user_email: log.user_email,
    action: log.event_type,
    description: `${log.table_name} ${log.record_id}`,
    resource_type: log.table_name,
    resource_id: log.record_id,
    success: true,
    created_at: log.event_timestamp,
    metadata: { old_values: log.old_values, new_values: log.new_values }
  }));
}

function mapEventType(auditType: string): string {
  const map: Record<string, string> = {
    'LOGIN': 'login',
    'LOGOUT': 'logout',
    'DELETE': 'delete',
    'CREATE': 'modification',
    'UPDATE': 'modification',
    'VIEW': 'access',
    'RGPD_EXPORT': 'export'
  };
  return map[auditType] || 'access';
}

function mapCategory(auditType: string): string {
  const map: Record<string, string> = {
    'LOGIN': 'authentication',
    'LOGOUT': 'authentication',
    'RGPD_EXPORT': 'export',
    'DELETE': 'data_modification',
    'CREATE': 'data_modification',
    'UPDATE': 'data_modification',
    'VIEW': 'data_access'
  };
  return map[auditType] || 'data_access';
}

function mapSeverity(securityLevel: string): string {
  const map: Record<string, string> = {
    'low': 'info',
    'standard': 'info',
    'high': 'warning',
    'critical': 'critical'
  };
  return map[securityLevel] || 'info';
}
```

---

## 📚 Fichiers Modifiés (Debug)

- [src/components/security/SecurityLogsDashboard.tsx](src/components/security/SecurityLogsDashboard.tsx) - Lignes 84-106 (ajout logs debug)
- [src/services/securityLogService.ts](src/services/securityLogService.ts) - Lignes 286-325, 335-358 (ajout logs debug)

---

## 🚀 Déploiement

✅ **Build production** : Succès (Vite 7.1.7)
✅ **Déployé sur** : https://casskai.app
✅ **Date** : 2026-01-09

---

## 📋 Actions Suivantes pour l'Utilisateur

### Étape 1: Tester et Copier les Logs

1. Aller sur https://casskai.app/settings
2. Ouvrir DevTools (F12) → Console
3. Cliquer sur "Sécurité"
4. **Copier TOUS les logs** de la console ici

### Étape 2: Vérifier la Base de Données

Exécuter dans Supabase SQL Editor:
```sql
SELECT COUNT(*) as total FROM security_logs;
SELECT COUNT(*) as total FROM audit_logs;
```

**Envoyer les résultats** ici

### Étape 3: Décider de la Solution

En fonction des résultats:
- Si `security_logs` est vide → **Solution 1** (utiliser audit_logs)
- Si vous voulez séparer les logs → **Solution 2** (implémenter logging)
- Si vous voulez unifier → **Solution 3** (migration)

---

**Prochaine étape** : Attendons vos logs de console et les résultats SQL pour déterminer la meilleure solution! 🔍
