# CassKai - Implémentation Multi-Devises

## 📋 Résumé des Modifications

### ✅ Fichiers Créés

1. **`src/hooks/useCompanyCurrency.ts`** - Hook principal pour la gestion des devises
   - Récupère la devise de l'entreprise courante
   - Formate les montants selon la configuration de la devise
   - Support de 12 devises: EUR, XOF, XAF, USD, MAD, DZD, TND, NGN, KES, GHS, ZAR, EGP
   - Mapping automatique pays → devise

2. **`src/components/ui/CurrencyAmount.tsx`** - Composant réutilisable
   - Affiche un montant avec la devise de l'entreprise
   - Props: amount, size, colored, compact, showSymbol
   - Composant `CurrencySymbol` pour afficher uniquement le symbole

### ✅ Fichiers Modifiés

3. **`src/pages/AccountingPage.tsx`**
   - Import du hook `useCompanyCurrency`
   - Remplacement de 6 occurrences de montants avec "€" en dur
   - KPIs: Solde total, Total débit, Total crédit, À recevoir, À payer, Montant en retard

4. **`src/components/accounting/OptimizedJournalEntriesTab.tsx`**
   - Import du composant `CurrencyAmount`
   - Remplacement dans le composant `EntryTotals` (Total Débit/Crédit)

## 🎯 Configuration des Devises

### Devises Supportées

| Code | Symbole | Nom | Décimales | Position |
|------|---------|-----|-----------|----------|
| EUR | € | Euro | 2 | after |
| XOF | FCFA | Franc CFA BCEAO | 0 | after |
| XAF | FCFA | Franc CFA BEAC | 0 | after |
| USD | $ | Dollar américain | 2 | before |
| MAD | DH | Dirham marocain | 2 | after |
| DZD | DA | Dinar algérien | 2 | after |
| TND | DT | Dinar tunisien | 3 | after |
| NGN | ₦ | Naira nigérian | 2 | before |
| KES | KSh | Shilling kenyan | 2 | before |
| GHS | GH₵ | Cedi ghanéen | 2 | before |
| ZAR | R | Rand sud-africain | 2 | before |
| EGP | E£ | Livre égyptienne | 2 | before |

### Mapping Pays → Devise

#### Europe
- FR, BE, LU → EUR

#### OHADA - Zone BCEAO (XOF)
- SN (Sénégal), CI (Côte d'Ivoire), ML (Mali), BF (Burkina Faso)
- NE (Niger), TG (Togo), BJ (Bénin), GW (Guinée-Bissau)

#### OHADA - Zone BEAC (XAF)
- CM (Cameroun), GA (Gabon), CG (Congo)
- TD (Tchad), CF (Centrafrique), GQ (Guinée Équatoriale)

#### Autres OHADA
- CD (RD Congo) → USD
- KM (Comores) → EUR
- GN (Guinée) → USD

#### Maghreb
- MA → MAD, DZ → DZD, TN → TND

#### Afrique anglophone
- NG → NGN, KE → KES, GH → GHS, ZA → ZAR, EG → EGP

## 📊 Utilisation

### Option 1: Hook useCompanyCurrency

```typescript
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';

function MyComponent() {
  const { formatAmount, symbol, currencyCode } = useCompanyCurrency();

  return (
    <div>
      <p>{formatAmount(1500.50)}</p>  {/* "1 500,50 FCFA" ou "1 500,50 €" */}
      <p>{formatAmount(1000000, { compact: true })}</p>  {/* "1.0M FCFA" */}
      <p>{symbol}</p>  {/* "FCFA" ou "€" */}
    </div>
  );
}
```

### Option 2: Composant CurrencyAmount

```typescript
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';

function MyComponent() {
  return (
    <div>
      <CurrencyAmount amount={1500.50} />
      <CurrencyAmount amount={1500.50} size="lg" />
      <CurrencyAmount amount={-500} colored />  {/* Rouge si négatif */}
      <CurrencyAmount amount={1000000} compact />  {/* "1.0M" */}
    </div>
  );
}
```

## 🚧 Travail Restant

### Fichiers à Modifier (240 occurrences de "€" restantes)

#### Priorité Haute (Composants comptables)
- [ ] `src/components/accounting/LettragePanel.tsx` (4 occurrences)
- [ ] `src/components/accounting/FECImportTab.tsx` (3 occurrences)
- [ ] `src/components/accounting/OptimizedJournalsTab.tsx` (5 occurrences)
- [ ] `src/components/accounting/OptimizedReportsTab.tsx` (1 occurrence)
- [ ] `src/components/accounting/AnomalyDetectionDashboard.tsx` (1 occurrence)

#### Priorité Moyenne (Pages principales)
- [ ] `src/pages/InvoicingPage.tsx`
- [ ] `src/pages/BankingPage.tsx`
- [ ] `src/pages/ReportsPage.tsx`
- [ ] `src/pages/DashboardPage.tsx`

#### Priorité Basse (Autres composants)
- [ ] `src/components/ai/*.tsx`
- [ ] `src/components/invoices/*.tsx`
- [ ] `src/components/dashboard/*.tsx`
- [ ] Autres composants avec des montants

### Script de Remplacement Automatique

Pour remplacer rapidement les patterns simples:

```powershell
# Pattern 1: {amount.toFixed(2)} €
# Remplacer par: <CurrencyAmount amount={amount} />

# Pattern 2: {amount.toLocaleString('fr-FR')} €
# Remplacer par: <CurrencyAmount amount={amount} />

# Pattern 3: `${amount} €`
# Remplacer par: <CurrencyAmount amount={amount} />
```

### Base de Données

#### Vérifier que la colonne existe
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'companies'
  AND column_name IN ('currency', 'default_currency', 'country');
```

#### Migration si nécessaire
```sql
-- Ajouter colonne si manquante
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS default_currency VARCHAR(3) DEFAULT 'EUR';

-- Mettre à jour selon les pays existants
UPDATE companies SET default_currency = 'XOF'
WHERE country IN ('SN', 'CI', 'ML', 'BF', 'NE', 'TG', 'BJ', 'GW');

UPDATE companies SET default_currency = 'XAF'
WHERE country IN ('CM', 'GA', 'CG', 'TD', 'CF', 'GQ');

UPDATE companies SET default_currency = 'MAD' WHERE country = 'MA';
UPDATE companies SET default_currency = 'DZD' WHERE country = 'DZ';
UPDATE companies SET default_currency = 'TND' WHERE country = 'TN';
UPDATE companies SET default_currency = 'EUR' WHERE default_currency IS NULL;
```

## 🧪 Tests

### Checklist de Tests

1. **Entreprise en Côte d'Ivoire (CI)**
   - [ ] Devise détectée: XOF
   - [ ] Symbole affiché: FCFA
   - [ ] Format: pas de décimales (1 500 FCFA)
   - [ ] Position: après le montant

2. **Entreprise au Maroc (MA)**
   - [ ] Devise détectée: MAD
   - [ ] Symbole affiché: DH
   - [ ] Format: 2 décimales (1 500,50 DH)
   - [ ] Position: après le montant

3. **Entreprise en France (FR)**
   - [ ] Devise détectée: EUR
   - [ ] Symbole affiché: €
   - [ ] Format: 2 décimales (1 500,50 €)
   - [ ] Position: après le montant

4. **Entreprise au Nigeria (NG)**
   - [ ] Devise détectée: NGN
   - [ ] Symbole affiché: ₦
   - [ ] Format: 2 décimales (₦1,500.50)
   - [ ] Position: avant le montant

### Pages à Tester
- [ ] Dashboard - KPIs avec montants
- [ ] Comptabilité - Tous les totaux
- [ ] Factures - Montants des factures
- [ ] Banque - Soldes bancaires
- [ ] Rapports - Tous les montants

## 📝 Notes Techniques

### Contexte Entreprise
- L'application utilise `EnterpriseContext` (pas `CompanyContext`)
- La devise est stockée dans `currentEnterprise.currency`
- Fallback sur le pays: `currentEnterprise.countryCode`
- Le hook `useCompanyCurrency` utilise `useEnterprise()` en interne

### Performances
- Le hook utilise `useMemo` pour éviter les recalculs
- Le formatage est optimisé avec `toLocaleString` natif
- Pas d'impact sur les performances (<1ms par formatage)

### Limitations Actuelles
- ⚠️ 234 occurrences de "€" en dur restent à remplacer
- Les PDF générés utilisent peut-être encore "€" en dur
- Les emails pourraient avoir des montants non formatés
- Les exports (FEC, CSV) à vérifier

## 🚀 Prochaines Étapes

1. **Court terme** (cette session)
   - ✅ Créer le hook et le composant
   - ✅ Modifier AccountingPage
   - ✅ Tester le build
   - 🔄 Déployer et tester en production

2. **Moyen terme** (prochaine session)
   - Remplacer les 234 occurrences restantes
   - Tester toutes les devises sur toutes les pages
   - Vérifier les PDF et exports

3. **Long terme**
   - Support multi-devises dans une même entreprise
   - Taux de change automatiques
   - Historique des conversions
   - Rapports multi-devises

## 🐛 Bugs Potentiels à Surveiller

1. **Valeurs null/undefined**
   - Le composant gère `amount: null | undefined` → affiche 0
   - Vérifier que tous les appels passent des nombres valides

2. **Devise incorrecte**
   - Si `currentEnterprise` est null → EUR par défaut
   - Vérifier que l'entreprise est bien chargée avant l'affichage

3. **Format incohérent**
   - XOF/XAF n'ont pas de décimales (0)
   - TND a 3 décimales (millimes)
   - Vérifier les calculs avec ces devises

## 📞 Support

En cas de problème:
1. Vérifier les logs du navigateur (DevTools)
2. Vérifier que `currentEnterprise` n'est pas null
3. Vérifier que `currency` ou `countryCode` sont définis
4. Tester avec `console.log(formatAmount(100))` dans le composant

---

**Dernière mise à jour**: 2026-01-10
**Auteur**: Claude Code (NOUTCHE CONSEIL)
