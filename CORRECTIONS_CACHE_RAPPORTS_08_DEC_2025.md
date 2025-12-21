# 🔧 Corrections : Cache, Rapports et Logs - 08 Décembre 2025

## Problèmes identifiés

### ❌ Problème 1 : Cache React - Écritures supprimées toujours visibles
**Symptôme** : Après suppression dans Supabase, les écritures restent visibles en frontend.

**Cause** : Les composants n'appellent pas `refresh()` après import/suppression.

**Fichiers concernés** :
- `src/components/accounting/FECImport.tsx`
- `src/components/accounting/OptimizedJournalEntriesTab.tsx`
- `src/components/accounting/OptimizedJournalsTab.tsx`

### ❌ Problème 2 : Rapports vides après import
**Symptôme** : Les rapports (Bilan, Compte de Résultat) n'affichent pas les données importées.

**Cause** : Les rapports ne filtrent pas sur `status = 'posted'` alors que l'import crée des écritures avec `status = 'draft'`.

**Fichiers concernés** :
- `src/services/reportGenerationService.ts` (lignes 68-83)
- `src/services/dashboardStatsService.ts` (lignes 92-100)

### ❌ Problème 3 : Pas de logs d'activité après import
**Symptôme** : Aucune trace dans `audit_logs` après un import FEC.

**Cause** : Le service d'import ne crée pas d'entrée d'audit.

**Fichier concerné** :
- `src/services/accountingImportService.ts`

---

## ✅ CORRECTION 1 : Rafraîchir après import/suppression

### Fichier : `src/components/accounting/FECImport.tsx`

Ajouter un appel à `refresh()` après un import réussi.

**Trouver la ligne où l'import se termine** (après `toast.success`), et ajouter :

```typescript
// Après l'import réussi
const result = await accountingImportService.importFECFile(file, companyId);

toast({
  title: "Import réussi",
  description: `${result.stats.totalEntries} écritures importées`
});

// ✅ AJOUTER CES LIGNES
// Rafraîchir les données pour forcer le rechargement depuis Supabase
if (onImportComplete) {
  onImportComplete(); // Si le composant parent expose un callback
}

// Si vous avez accès au hook useJournalEntries dans le parent, exposer une prop refresh
// Sinon, forcer un rechargement de la page entière (solution simple)
setTimeout(() => {
  window.location.reload();
}, 1500); // Laisser le temps de voir le toast de succès
```

**Solution alternative (plus propre)** : Passer une fonction `onImportSuccess` en prop :

```typescript
// Dans FECImport.tsx props
interface FECImportProps {
  companyId: string;
  onImportSuccess?: () => void; // ← Nouveau
}

// Après l'import
if (onImportSuccess) {
  onImportSuccess();
}
```

Puis dans le composant parent (`AccountingPage` ou `OptimizedJournalEntriesTab`) :

```typescript
const { refresh } = useJournalEntries(companyId);

return (
  <FECImport
    companyId={companyId}
    onImportSuccess={() => refresh()} // ← Rafraîchir après import
  />
);
```

---

## ✅ CORRECTION 2 : Filtrer les rapports sur status = 'posted'

### Fichier : `src/services/reportGenerationService.ts`

**Ligne 68** - Ajouter le filtre sur le status :

```typescript
// AVANT (ligne 68-83)
const { data: entries, error } = await supabase
  .from('journal_entries')
  .select(`
    id,
    entry_date,
    description,
    journal_entry_lines (
      account_number,
      account_name,
      debit_amount,
      credit_amount
    )
  `)
  .eq('company_id', companyId)
  .gte('entry_date', startDate || startOfYear(new Date()).toISOString().split('T')[0])
  .lte('entry_date', endDate || endOfYear(new Date()).toISOString().split('T')[0]);

// APRÈS (ajouter la ligne suivante)
const { data: entries, error } = await supabase
  .from('journal_entries')
  .select(`
    id,
    entry_date,
    description,
    status,
    journal_entry_lines (
      account_number,
      account_name,
      debit_amount,
      credit_amount
    )
  `)
  .eq('company_id', companyId)
  .eq('status', 'posted') // ✅ AJOUTER CETTE LIGNE
  .gte('entry_date', startDate || startOfYear(new Date()).toISOString().split('T')[0])
  .lte('entry_date', endDate || endOfYear(new Date()).toISOString().split('T')[0]);
```

### Fichier : `src/services/dashboardStatsService.ts`

**Ligne 92** - Ajouter le filtre sur le status :

```typescript
// AVANT (ligne 92-100)
const { data: lines, error } = await supabase
  .from('journal_entry_lines')
  .select(`
    debit_amount,
    credit_amount,
    chart_of_accounts!inner (
      account_number
    ),
    journal_entries!inner (
      // contenu...
    )
  `)

// APRÈS (ajouter dans la section journal_entries)
const { data: lines, error } = await supabase
  .from('journal_entry_lines')
  .select(`
    debit_amount,
    credit_amount,
    chart_of_accounts!inner (
      account_number
    ),
    journal_entries!inner (
      company_id,
      entry_date,
      status  // ✅ AJOUTER status dans le select
    )
  `)
  .eq('journal_entries.company_id', companyId)
  .eq('journal_entries.status', 'posted') // ✅ AJOUTER CETTE LIGNE
  .gte('journal_entries.entry_date', startDate)
  .lte('journal_entries.entry_date', endDate);
```

**⚠️ ALTERNATIVE** : Si vous voulez que les rapports incluent aussi les brouillons :

Gardez le filtre mais ajoutez une option dans les filtres :

```typescript
export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  companyId: string;
  includeClosedAccounts?: boolean;
  accountType?: string;
  includeDrafts?: boolean; // ✅ NOUVEAU
}

// Dans la requête
if (!filters.includeDrafts) {
  query = query.eq('status', 'posted');
} else {
  query = query.in('status', ['draft', 'posted']);
}
```

---

## ✅ CORRECTION 3 : Ajouter les logs d'audit après import

### Fichier : `src/services/accountingImportService.ts`

Trouver la fin de la fonction `importFECFile` (après le return du résultat), et ajouter le logging AVANT le return :

```typescript
// À la fin de la fonction importFECFile, AVANT le return
async importFECFile(file: File, companyId: string, userId: string) {
  try {
    // ... tout le code d'import existant ...

    const result = {
      success: true,
      stats: {
        totalEntries: entriesCreated,
        totalLines: linesCreated,
        totalDebit: totalDebitAmount,
        totalCredit: totalCreditAmount,
      }
    };

    // ✅ AJOUTER CE CODE ICI (avant le return)
    // Log de l'audit
    try {
      await supabase.from('audit_logs').insert({
        company_id: companyId,
        user_id: userId,
        action: 'fec_import',
        entity_type: 'journal_entries',
        entity_id: null, // Pas d'ID spécifique (multiple entries)
        details: {
          type: 'FEC Import',
          filename: file.name,
          filesize: file.size,
          entries_count: result.stats.totalEntries,
          lines_count: result.stats.totalLines,
          total_debit: result.stats.totalDebit,
          total_credit: result.stats.totalCredit,
          imported_at: new Date().toISOString(),
          status: 'success'
        },
        metadata: {
          import_type: 'fec',
          file_format: 'FEC',
          user_agent: navigator.userAgent
        }
      });
      console.log('✅ Audit log créé pour import FEC');
    } catch (auditError) {
      // Ne pas bloquer l'import si l'audit échoue
      console.warn('⚠️ Échec création audit log:', auditError);
    }

    return result;
  } catch (error) {
    // En cas d'erreur d'import, logger aussi
    try {
      await supabase.from('audit_logs').insert({
        company_id: companyId,
        user_id: userId,
        action: 'fec_import_failed',
        entity_type: 'journal_entries',
        details: {
          type: 'FEC Import Failed',
          filename: file.name,
          error_message: error.message,
          imported_at: new Date().toISOString(),
          status: 'error'
        }
      });
    } catch (auditError) {
      console.warn('⚠️ Échec création audit log d\'erreur:', auditError);
    }

    throw error;
  }
}
```

**⚠️ IMPORTANT** : Vérifier que la fonction `importFECFile` reçoit bien `userId` en paramètre.

Si elle ne le reçoit pas, modifier la signature :

```typescript
// AVANT
async importFECFile(file: File, companyId: string) { ... }

// APRÈS
async importFECFile(file: File, companyId: string, userId: string) { ... }
```

Et dans le composant qui appelle cette fonction :

```typescript
const { user } = useAuth();

// Lors de l'appel
await accountingImportService.importFECFile(file, companyId, user.id);
```

---

## ✅ CORRECTION BONUS : Bouton "Rafraîchir" dans l'interface

Ajouter un bouton visible pour forcer le rechargement des données.

### Fichier : `src/components/accounting/OptimizedJournalEntriesTab.tsx`

Dans le header de la liste des écritures, ajouter un bouton "Rafraîchir" :

```typescript
import { RefreshCw } from 'lucide-react';

// Dans le composant
const { refresh, loading } = useJournalEntries(companyId);
const [isRefreshing, setIsRefreshing] = useState(false);

const handleRefresh = async () => {
  setIsRefreshing(true);
  await refresh();
  setIsRefreshing(false);
  toast({
    title: "Données actualisées",
    description: "Les écritures ont été rechargées depuis la base de données"
  });
};

// Dans le JSX, à côté du bouton "Nouvelle écriture"
<Button
  variant="outline"
  onClick={handleRefresh}
  disabled={isRefreshing || loading}
>
  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
  Rafraîchir
</Button>
```

---

## 📋 Checklist d'implémentation

### Étape 1 : Cache et rafraîchissement
- [ ] Ajouter `onImportSuccess` prop dans `FECImport.tsx`
- [ ] Appeler `refresh()` dans le parent après import
- [ ] Ajouter bouton "Rafraîchir" dans `OptimizedJournalEntriesTab.tsx`

### Étape 2 : Filtres des rapports
- [ ] Ajouter `.eq('status', 'posted')` dans `reportGenerationService.ts` ligne 83
- [ ] Ajouter `.eq('journal_entries.status', 'posted')` dans `dashboardStatsService.ts`
- [ ] Tester les rapports après correction

### Étape 3 : Logs d'audit
- [ ] Vérifier signature de `importFECFile` (ajouter `userId` si nécessaire)
- [ ] Ajouter code d'audit log après import réussi
- [ ] Ajouter code d'audit log en cas d'erreur
- [ ] Vérifier dans Supabase que les logs sont créés

### Étape 4 : Tests
- [ ] Importer un fichier FEC
- [ ] Vérifier que le bouton "Rafraîchir" fonctionne
- [ ] Vérifier que les rapports affichent les données
- [ ] Vérifier qu'une entrée apparaît dans `audit_logs`

---

## 🔍 Vérification SQL après corrections

```sql
-- 1. Vérifier le status des écritures importées
SELECT status, COUNT(*) as count
FROM journal_entries
WHERE company_id = 'VOTRE_COMPANY_ID'
GROUP BY status;

-- Si toutes sont 'draft', les passer en 'posted' manuellement :
UPDATE journal_entries
SET status = 'posted', posted_at = NOW()
WHERE company_id = 'VOTRE_COMPANY_ID'
  AND status = 'draft';

-- 2. Vérifier les logs d'audit
SELECT
  action,
  entity_type,
  details->>'entries_count' as entries,
  details->>'lines_count' as lines,
  created_at
FROM audit_logs
WHERE company_id = 'VOTRE_COMPANY_ID'
  AND action LIKE '%import%'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Vérifier les données des rapports
SELECT
  je.status,
  COUNT(DISTINCT je.id) as entries,
  COUNT(jel.id) as lines,
  SUM(jel.debit_amount) as total_debit,
  SUM(jel.credit_amount) as total_credit
FROM journal_entries je
LEFT JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
WHERE je.company_id = 'VOTRE_COMPANY_ID'
GROUP BY je.status;
```

---

## 💡 Explication du problème de status

**Pourquoi les rapports étaient vides ?**

1. L'import FEC crée les écritures avec `status = 'draft'` (brouillon)
2. Les rapports filtrent sur `status = 'posted'` (validé)
3. Résultat : Aucune écriture ne match le filtre → Rapports vides

**Solutions** :
- **Option A** : Les rapports acceptent aussi les brouillons (remove le filtre)
- **Option B** : L'import valide automatiquement les écritures (`status = 'posted'`)
- **Option C** : Ajouter un bouton "Valider toutes les écritures" dans l'interface

Je recommande **Option B** : Modifier l'import pour créer directement des écritures validées.

---

**Date** : 08 Décembre 2025
**Status** : 📝 Corrections à implémenter
**Priorité** : 🔴 HAUTE (bloque l'utilisation des rapports)
