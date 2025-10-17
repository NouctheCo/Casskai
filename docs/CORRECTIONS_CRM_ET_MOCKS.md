# ❌ Corrections CRM & Données Mockées - À corriger

## Problèmes dans `OpportunitiesKanban.tsx`

### 1. ❌ **Fonction `handleCreateClient` manquante**

**Fichier**: `src/components/crm/OpportunitiesKanban.tsx:550`

**Erreur**:
```typescript
onCreateEntity={handleCreateClient}  // ❌ Cette fonction n'existe pas !
```

**La fonction `handleCreateClient` est utilisée mais JAMAIS définie !**

**Correction à ajouter** (après la ligne 228) :
```typescript
const handleCreateClient = async (clientData: Record<string, any>) => {
  try {
    if (!currentCompany?.id) {
      return { success: false, error: 'Aucune entreprise sélectionnée' };
    }

    const result = await thirdPartiesService.createThirdParty({
      type: 'customer',
      name: clientData.company_name,
      email: clientData.email,
      phone: clientData.phone,
      address: clientData.address,
      city: clientData.city || '',
      postal_code: clientData.postal_code || '',
      country: 'FR'
    });

    if (result) {
      // TODO: Rafraîchir la liste des clients
      // Il faudrait ajouter une fonction pour recharger les clients depuis le parent
      return { success: true, id: result.id };
    }

    return { success: false, error: 'Échec de la création du client' };
  } catch (error) {
    console.error('Error creating client:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
```

---

### 2. ❌ **Fonction `getClientContacts` manquante**

**Fichier**: `src/components/crm/OpportunitiesKanban.tsx:570`

**Erreur**:
```typescript
{getClientContacts(formData.client_id).map((contact) => (  // ❌ Cette fonction n'existe pas !
```

**Correction à ajouter** (après `handleCreateClient`) :
```typescript
const getClientContacts = (clientId: string) => {
  if (!clientId) return [];
  return contacts.filter(contact => contact.client_id === clientId);
};
```

---

## 🔍 Données Mockées trouvées dans le projet

### Fichiers avec données MOCK à remplacer par des vraies données Supabase :

#### 1. 🟡 `src/components/dashboard/AnimatedDashboard.tsx`
**Ligne 42** : `const mockData: DashboardData = {...}`

**Impact**: Moyen - Le dashboard affiche des données mockées

**Action recommandée**:
- Connecter au service dashboard pour récupérer les vraies données
- Utiliser les données de Supabase (invoices, third_parties, journal_entries, etc.)

---

#### 2. 🟢 `src/pages/UserManagementPage.tsx`
**Ligne 656** : `const OLD_MOCK_DATA = [...]`

**Impact**: Faible - Données commentées "OLD_MOCK_DATA"

**Action recommandée**:
- Supprimer les données mockées si elles ne sont plus utilisées

---

#### 3. 🟡 `src/services/openBanking/export/AccountingExportService.ts`
**Ligne ~150** : `const mockData = {...}`

**Impact**: Moyen - Service d'export bancaire retourne des mocks

**Action recommandée**:
- Remplacer par l'intégration réelle avec la banque
- Ou désactiver cette fonctionnalité si pas encore prête

---

#### 4. 🔴 **`src/services/taxService.ts`** (PRIORITÉ HAUTE)
Plusieurs fonctions retournent des données mockées :

**Lignes concernées**:
- `getTaxDashboardData()` → ligne 45 : `const mockData: TaxDashboardData`
- `getTaxDeclarations()` → ligne 120 : `const mockData: TaxDeclaration[]`
- `getTaxCalendar()` → ligne 140 : `const mockData: TaxCalendarEvent[]`
- `getTaxAlerts()` → ligne 160 : `const mockData: TaxAlert[]`
- `getTaxObligations()` → ligne 180 : `const mockData: TaxObligation[]`

**Impact**: Élevé - Tout le module Taxes est en mode mock

**Action recommandée**:
```typescript
// Exemple de correction pour getTaxDashboardData
async getTaxDashboardData(companyId: string): Promise<ServiceResult<TaxDashboardData>> {
  try {
    // ✅ Récupérer les vraies données depuis Supabase
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('company_id', companyId);

    if (invoicesError) throw invoicesError;

    // Calculer la TVA collectée/déductible depuis les factures réelles
    const vatCollected = invoices
      .filter(inv => inv.type === 'sale')
      .reduce((sum, inv) => sum + (inv.total_tax || 0), 0);

    const vatDeductible = invoices
      .filter(inv => inv.type === 'purchase')
      .reduce((sum, inv) => sum + (inv.total_tax || 0), 0);

    const dashboardData: TaxDashboardData = {
      vat_collected: vatCollected,
      vat_deductible: vatDeductible,
      vat_to_pay: vatCollected - vatDeductible,
      // ... autres calculs réels
    };

    return { data: dashboardData };
  } catch (error) {
    console.error('Error fetching tax dashboard data:', error);
    return {
      data: {} as TaxDashboardData,
      error: { message: 'Failed to fetch tax dashboard data' }
    };
  }
}
```

---

#### 5. 🟡 `src/services/thirdPartiesService.ts`
**Ligne 350** : `const mockData: AgingReport[] = []`

**Impact**: Moyen - Rapport d'ancienneté des créances vide

**Action recommandée**:
- Implémenter le calcul réel d'ancienneté des factures impayées

```typescript
async getAgingReport(enterpriseId: string): Promise<ThirdPartyServiceResponse<AgingReport[]>> {
  try {
    // Récupérer les factures impayées
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        third_parties (
          id,
          name,
          code
        )
      `)
      .eq('company_id', enterpriseId)
      .eq('status', 'unpaid')
      .order('due_date', { ascending: false });

    if (error) throw error;

    // Calculer l'ancienneté pour chaque client
    const agingReport: AgingReport[] = [];
    const today = new Date();

    // Grouper par client
    const clientGroups = invoices.reduce((acc, invoice) => {
      const clientId = invoice.third_party_id;
      if (!acc[clientId]) {
        acc[clientId] = {
          client: invoice.third_parties,
          invoices: []
        };
      }
      acc[clientId].invoices.push(invoice);
      return acc;
    }, {});

    // Calculer les tranches d'ancienneté
    Object.values(clientGroups).forEach((group: any) => {
      let current = 0, days_30 = 0, days_60 = 0, days_90 = 0, days_plus = 0;

      group.invoices.forEach((inv: any) => {
        const dueDate = new Date(inv.due_date);
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        const amount = inv.total_amount || 0;

        if (daysOverdue <= 0) current += amount;
        else if (daysOverdue <= 30) days_30 += amount;
        else if (daysOverdue <= 60) days_60 += amount;
        else if (daysOverdue <= 90) days_90 += amount;
        else days_plus += amount;
      });

      agingReport.push({
        client_id: group.client.id,
        client_name: group.client.name,
        client_code: group.client.code,
        current,
        days_1_30: days_30,
        days_31_60: days_60,
        days_61_90: days_90,
        days_over_90: days_plus,
        total: current + days_30 + days_60 + days_90 + days_plus
      });
    });

    return { data: agingReport };
  } catch (error) {
    console.error('Error fetching aging report:', error);
    return {
      data: [],
      error: { message: 'Failed to fetch aging report' }
    };
  }
}
```

---

## 📊 Résumé des corrections

| Fichier | Problème | Priorité | Temps estimé |
|---------|----------|----------|--------------|
| `OpportunitiesKanban.tsx` | Fonction `handleCreateClient` manquante | 🔴 CRITIQUE | 10 min |
| `OpportunitiesKanban.tsx` | Fonction `getClientContacts` manquante | 🔴 CRITIQUE | 5 min |
| `taxService.ts` | 5 fonctions avec données mockées | 🔴 HAUTE | 2-3h |
| `thirdPartiesService.ts` | Rapport ancienneté vide | 🟡 MOYENNE | 1h |
| `AnimatedDashboard.tsx` | Dashboard avec mocks | 🟡 MOYENNE | 1h |
| `AccountingExportService.ts` | Export bancaire mock | 🟢 BASSE | 2h |

---

## ✅ Checklist pour le dev

### Corrections immédiates (CRITIQUE)
- [ ] Ajouter `handleCreateClient` dans OpportunitiesKanban.tsx
- [ ] Ajouter `getClientContacts` dans OpportunitiesKanban.tsx
- [ ] Tester la création d'opportunité avec nouveau client
- [ ] Build + déploiement

### Corrections importantes (HAUTE)
- [ ] Remplacer les mocks dans `taxService.ts` par vraies données Supabase
- [ ] Tester le module Taxes avec données réelles

### Corrections moyennes (MOYENNE)
- [ ] Implémenter `getAgingReport` avec calcul réel
- [ ] Connecter `AnimatedDashboard` aux vraies données

### Corrections optionnelles (BASSE)
- [ ] Finaliser l'intégration bancaire réelle
- [ ] Supprimer les `OLD_MOCK_DATA` inutilisés

---

## 🚨 Ce qui bloque MAINTENANT

**Sans les 2 fonctions manquantes dans OpportunitiesKanban, le CRM va crasher** quand on essaie de :
1. Créer une opportunité avec un nouveau client
2. Sélectionner un contact pour un client

**Temps pour débloquer** : 15 minutes max

---

## Commande pour tester après corrections

```bash
npm run build
```

Si le build réussit :
```bash
powershell -ExecutionPolicy Bypass -File deploy-vps.ps1 -SkipBuild
```

---

**Créé le**: 12 Octobre 2025
**Auteur**: Assistant IA
**Statut**: Corrections urgentes nécessaires
