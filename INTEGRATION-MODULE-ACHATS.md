# Intégration Auto-Génération Comptable - Module Achats

## ✅ Code d'Intégration Prêt

### 1. Modifier `src/pages/PurchasesPage.tsx`

#### A. Ajouter l'import du hook (ligne 44, après les autres imports)

```typescript
import { useAutoAccounting } from '@/hooks/useAutoAccounting';
```

#### B. Utiliser le hook dans le composant (ligne 67, après currentEnterprise)

```typescript
const { generateFromPurchase } = useAutoAccounting();
```

#### C. Modifier `handleFormSubmit` pour ajouter l'auto-génération (lignes 295-355)

Remplacer la fonction existante par :

```typescript
const handleFormSubmit = async (formData: PurchaseFormData) => {
  try {
    setFormLoading(true);

    let result;
    if (editingPurchase) {
      result = await purchasesService.updatePurchase(editingPurchase.id, formData);
    } else {
      result = await purchasesService.createPurchase(companyId, formData);
    }


    if (result.error) {
      throw new Error(result.error.message);
    }

    // ✅ NOUVEAU : Générer automatiquement l'écriture comptable pour un nouvel achat
    if (!editingPurchase && result.data && currentEnterprise) {
      try {
        const supplier = suppliers.find(s => s.id === formData.supplier_id);

        await generateFromPurchase({
          id: result.data.id,
          company_id: currentEnterprise.id,
          supplier_id: formData.supplier_id,
          supplier_name: supplier?.name || 'Fournisseur',
          order_number: formData.invoice_number,
          order_date: formData.purchase_date,
          total_excl_tax: formData.amount_ht,
          total_tax: formData.amount_ht * (formData.tva_rate / 100),
          total_incl_tax: formData.amount_ht * (1 + formData.tva_rate / 100),
          items: [{
            account_id: undefined, // Sera mappé automatiquement (607 Achats)
            description: formData.description || 'Achat fournisseur',
            amount_excl_tax: formData.amount_ht,
          }],
        });
      } catch (error) {
        console.warn('Auto-accounting generation failed, but purchase was created:', error);
      }
    }

    if (editingPurchase) {
      toastUpdated('L\'achat');
    } else {
      toastCreated('L\'achat');
    }

    loadPurchasesData();
    setIsFormOpen(false);
    setEditingPurchase(null);

  } catch (error) {
    console.error('Error saving purchase:', error);
    toastError((error instanceof Error ? error.message : 'Une erreur est survenue'));
  } finally {
    setFormLoading(false);
  }
};
```

## 🎯 Résultat

Lors de la création d'un achat (facture fournisseur), l'écriture suivante sera générée automatiquement :

```
Débit   607 Achats              1000,00 €
Débit   44566 TVA déductible      200,00 €
  Crédit  401 Fournisseurs               1200,00 €
```

## 🌍 Support Multi-Référentiels

Le système s'adapte automatiquement :
- **PCG (France)** : 607, 44566, 401
- **SYSCOHADA (Afrique)** : 607, 4431, 401
- **IFRS** : Purchases, VAT Receivable, Payables
- **US GAAP** : COGS, Sales Tax Receivable, Accounts Payable

## ✅ À Faire

1. Copier le code ci-dessus dans `PurchasesPage.tsx`
2. Tester en créant une facture fournisseur
3. Vérifier l'écriture générée dans le module Accounting

---

**Date** : 9 décembre 2025
**Status** : Code prêt à intégrer
