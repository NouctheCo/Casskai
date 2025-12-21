# Corrections Third Parties - Résumé

## Problème
Le code utilise la table `third_parties` (vide) au lieu de :
- **Vue `third_parties_unified`** pour les SELECT
- **Tables `customers` ou `suppliers`** pour les INSERT/UPDATE/DELETE

## ✅ Déjà corrigé
1. ✅ `thirdPartiesService.ts` - tous les SELECT
2. ✅ `invoicingService.ts` - jointures
3. ✅ `quotesService.ts` - jointures
4. ✅ `useSuppliers.ts` - loadSuppliers

## ⚠️ À corriger manuellement

### Fichiers avec INSERT/UPDATE/DELETE
Ces fichiers créent/modifient des tiers. Ils doivent :
- Utiliser `customers` pour les clients (type='customer')
- Utiliser `suppliers` pour les fournisseurs (type='supplier')

**Fichiers concernés :**
1. `src/hooks/useThirdParties.ts` - lignes 143, 177, 210
2. `src/services/thirdPartiesService.ts` - lignes 287, 337, 407
3. `src/components/crm/NewClientModal.tsx` - ligne 111
4. `src/components/third-parties/ImportTab.tsx` - ligne 187
5. `src/services/crmService.ts` - plusieurs CREATE/UPDATE

### Fichiers avec SELECT uniquement
Remplacer `.from('third_parties')` par `.from('third_parties_unified')` et `type` par `party_type` :

1. `src/hooks/useThirdParties.ts` - lignes 81, 234, 254
2. `src/hooks/useSuppliers.ts` - ligne 69 (createSupplier)
3. `src/services/crmService.ts` - tous les SELECT
4. `src/components/crm/NewOpportunityModal.tsx` - ligne 90
5. `src/components/crm/NewActionModal.tsx` - ligne 118
6. `src/components/third-parties/TransactionsTab.tsx` - ligne 89
7. `src/services/invoiceJournalEntryService.ts` - lignes 206, 260
8. `src/services/thirdPartiesAgingReport.ts` - ligne 24

## 🔧 Solution rapide pour tester

Pour faire fonctionner rapidement l'app, je recommande :
1. **Migrer les données** de `customers`+`suppliers` vers `third_parties`
2. **OU** corriger tous les services pour utiliser `customers`/`suppliers`

### Option 1 : Migration SQL (RECOMMANDÉ)
```sql
-- Migrer customers vers third_parties
INSERT INTO third_parties (
  id, company_id, type, code, name, email, phone,
  address_line1, city, postal_code, country, payment_terms,
  is_active, created_at, updated_at
)
SELECT
  id, company_id, 'customer'::text as type, customer_number as code,
  name, email, phone, billing_address_line1, billing_city,
  billing_postal_code, billing_country, payment_terms,
  is_active, created_at, updated_at
FROM customers
ON CONFLICT (id) DO NOTHING;

-- Migrer suppliers vers third_parties
INSERT INTO third_parties (
  id, company_id, type, code, name, email, phone,
  address_line1, city, postal_code, country, payment_terms,
  is_active, created_at, updated_at
)
SELECT
  id, company_id, 'supplier'::text as type, supplier_number as code,
  name, email, phone, billing_address_line1, billing_city,
  billing_postal_code, billing_country, payment_terms,
  is_active, created_at, updated_at
FROM suppliers
ON CONFLICT (id) DO NOTHING;
```

Après cette migration, **TOUT fonctionnera** car `third_parties` aura les données !

### Option 2 : Corriger le code (COMPLEXE)
Modifier tous les services pour router vers `customers` ou `suppliers` selon le type.

## Quelle option préférez-vous ?
