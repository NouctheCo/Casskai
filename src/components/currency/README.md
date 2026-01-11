# Composants Multi-Devises

Ce dossier contient tous les composants React pour la gestion des devises dans CassKai.

## 📦 Composants

### CurrencyConverter.tsx
Convertisseur interactif de devises avec les fonctionnalités suivantes:
- Conversion en temps réel entre 12 devises
- Bouton d'inversion rapide
- Affichage du taux de change actuel
- Callback optionnel pour enregistrer les conversions

**Usage**:
```typescript
import { CurrencyConverter } from '@/components/currency/CurrencyConverter';

<CurrencyConverter
  defaultFromCurrency="EUR"
  defaultToCurrency="XOF"
  defaultAmount={1000}
  onConvert={(from, to, fromCurrency, toCurrency, rate) => {
    // Enregistrer la conversion
  }}
/>
```

### ConversionHistory.tsx
Historique complet des conversions avec:
- Table paginée des conversions
- Filtres avancés (devise, date, référence)
- Export CSV
- Statistiques récapitulatives

**Usage**:
```typescript
import { ConversionHistoryComponent } from '@/components/currency/ConversionHistory';

<ConversionHistoryComponent />
```

## 🔗 Dépendances

Ces composants dépendent de:
- `@/hooks/useCompanyCurrency` - Hook pour la devise de l'entreprise
- `@/services/exchangeRateService` - Service de gestion des taux
- `@/contexts/EnterpriseContext` - Contexte de l'entreprise courante
- `@/components/ui/*` - Composants UI (Card, Button, Input, etc.)

## 📚 Documentation Complète

Voir [MULTI-CURRENCY-COMPLETE-GUIDE.md](../../../MULTI-CURRENCY-COMPLETE-GUIDE.md) pour la documentation complète.
