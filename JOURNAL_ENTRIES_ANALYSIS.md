# Revue de la Logique de Création d'Écritures Comptables

## Vue d'ensemble de la logique de création

### 1. Structure des écritures comptables

Les écritures comptables dans le système suivent le principe de la **partie double** :
- Chaque écriture doit avoir au moins **2 lignes** (débit + crédit)
- Le **total débit doit égaler le total crédit** (équilibre obligatoire)
- Chaque ligne contient : compte, montant débit/crédit, description

### 2. Processus de création

#### Validation avant création :
```typescript
// Vérification de l'équilibre (journalEntriesService.ts:474)
private ensureBalanced(items: JournalEntryLineForm[]): void {
  const totalDebit = items.reduce((sum, item) => sum + coerceNumber(item.debitAmount), 0);
  const totalCredit = items.reduce((sum, item) => sum + coerceNumber(item.creditAmount), 0);

  if (Math.abs(totalDebit - totalCredit) > BALANCE_TOLERANCE) {
    throw new Error('Journal entry is not balanced');
  }
}
```

#### Génération automatique du numéro d'écriture :
```typescript
// Format: {CODE_JOURNAL}-{ANNEE}-{SEQUENCE}
// Exemple: VENTES-2024-0001, ACHATS-2024-0005
private async generateEntryNumber(companyId: string, journalId?: string | null): Promise<string | null> {
  const journalCode = await this.fetchJournalCode(journalId);
  const sanitizedPrefix = (journalCode ?? 'JR').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const year = new Date().getFullYear();
  // Recherche du dernier numéro pour incrémentation
}
```

#### Transaction atomique :
```typescript
// Création en 2 étapes avec rollback automatique si échec
const { data: entry, error: entryError } = await supabase
  .from('journal_entries')
  .insert(entryInsert)
  .select('*')
  .single();

const { data: lines, error: linesError } = await supabase
  .from('journal_entry_items')
  .insert(linesInsert)
  .select('*, accounts (id, account_number, name, type, class)');
```

### 3. États des écritures

- **draft** : Brouillon (modifiable)
- **posted** : Comptabilisée (non modifiable)
- **cancelled** : Annulée

## Impact sur les autres modules

### 1. **Rapports Financiers** (reportsService.ts, accountingDataService.ts)

#### Bilan (Balance Sheet)
- **Actif** : Comptes 1-5 (immobilisations, stocks, créances, trésorerie)
- **Passif** : Comptes 1-5 (dettes, capitaux propres)
- **Calcul** : Solde des comptes basé sur les écritures validées

#### Compte de Résultat (Income Statement)
- **Produits** : Comptes 7 (ventes, prestations, autres produits)
- **Charges** : Comptes 6 (achats, services extérieurs, impôts, salaires)
- **Calcul** : Variation des comptes de résultat sur la période

#### Grand Livre (General Ledger)
- **Liste chronologique** de toutes les écritures par compte
- **Solde progressif** pour chaque compte
- **Filtrage** par période, compte, journal

### 2. **Module Ventes** (invoicingService.ts)

#### Impact automatique des factures :
```
Facture client de 1000€ HT :
- Débit 411000 (Clients) : 1000€
- Crédit 701000 (Ventes) : 1000€

Avec TVA 20% :
- Débit 411000 (Clients) : 1200€
- Crédit 701000 (Ventes) : 1000€
- Crédit 445710 (TVA collectée) : 200€
```

#### États des factures :
- **Brouillon** : Pas d'écriture comptable
- **Envoyée** : Écriture automatique créée
- **Payée** : Écriture de règlement créée

### 3. **Module Achats** (purchasesService.ts)

#### Impact automatique des factures fournisseurs :
```
Facture fournisseur de 800€ HT :
- Débit 601000 (Achats) : 800€
- Crédit 401000 (Fournisseurs) : 800€

Avec TVA 20% :
- Débit 601000 (Achats) : 800€
- Débit 445660 (TVA déductible) : 160€
- Crédit 401000 (Fournisseurs) : 960€
```

### 4. **Module Inventaire** (inventoryService.ts)

#### Écritures de variation de stock :
```
Augmentation de stock de 500€ :
- Débit 301000 (Stock matière première) : 500€
- Crédit 601000 (Achats stockés) : 500€

Diminution de stock (consommation) :
- Débit 603000 (Variation stock) : 300€
- Crédit 301000 (Stock) : 300€
```

#### Écritures d'inventaire :
- **Valorisation initiale** : Écriture d'ouverture
- **Ajustements** : Écritures de régularisation
- **Comptage physique** : Écritures de correction

### 5. **Module Banque** (bankingService.ts)

#### Rapprochement bancaire :
```
Paiement client par virement :
- Débit 512000 (Banque) : 1200€
- Crédit 411000 (Clients) : 1200€

Paiement fournisseur :
- Débit 401000 (Fournisseurs) : 960€
- Crédit 512000 (Banque) : 960€
```

### 6. **Module Paie** (hrPayrollService.ts)

#### Écritures de salaire :
```
Salaire mensuel de 3000€ :
- Débit 641000 (Salaires) : 2500€
- Débit 645000 (Charges sociales) : 500€
- Crédit 421000 (Personnel) : 3000€

Prélèvement à la source :
- Débit 421000 (Personnel) : 300€
- Crédit 512000 (Banque) : 300€
```

### 7. **Module TVA** (vatCalculationService.ts)

#### Déclaration de TVA :
- **TVA collectée** (445710) : TVA due aux clients
- **TVA déductible** (445660) : TVA payée aux fournisseurs
- **TVA à décaisser** : Différence à payer à l'administration

#### Écritures de régularisation :
```
Paiement TVA trimestriel :
- Débit 445670 (TVA à décaisser) : 1000€
- Crédit 512000 (Banque) : 1000€
```

## Contrôles et validations

### 1. **Contrôle d'équilibre**
- Vérification débit = crédit avant sauvegarde
- Tolérance de 0.01€ pour les arrondis

### 2. **Contrôle des comptes**
- Validation que les comptes existent
- Vérification des types de comptes appropriés
- Contrôle des classes comptables (1-7)

### 3. **Contrôle des périodes**
- Vérification des dates d'exercice
- Contrôle des périodes de clôture
- Validation des dates futures/interdites

### 4. **Contrôle des autorisations**
- Droits d'accès par utilisateur/rôle
- Validation des entreprises autorisées
- Audit trail des modifications

## Recommandations d'amélioration

### 1. **Automatisation des écritures**
- Création automatique depuis factures/achats
- Templates d'écritures récurrentes
- Intégration avec les autres modules

### 2. **Contrôles renforcés**
- Validation des règles comptables métier
- Contrôle des soldes maximums
- Alertes sur écritures inhabituelles

### 3. **Performance**
- Indexation optimisée des requêtes
- Cache des soldes de comptes
- Pagination pour les gros volumes

### 4. **Audit et traçabilité**
- Historique complet des modifications
- Marquage des écritures automatiques
- Export d'audit pour les contrôleurs</content>
<parameter name="filePath">c:\Users\noutc\Casskai\JOURNAL_ENTRIES_ANALYSIS.md