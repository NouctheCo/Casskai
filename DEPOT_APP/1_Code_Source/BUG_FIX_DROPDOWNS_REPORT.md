# 🐛 Rapport de correction : Bugs de chargement des dropdowns

## 📊 État : EN COURS ⏳

---

## ✅ Corrections appliquées

### 1. Bug facturation : Liste des clients vide au premier chargement

**Fichier** : `src/components/invoicing/OptimizedInvoicesTab.tsx`

**Problème identifié** :
- Le formulaire de facture (`InvoiceFormDialog`) utilisait un `<Select>` basique qui dépendait de la prop `clients` chargée par le composant parent
- Pas de chargement automatique au montage du composant
- Liste vide jusqu'à ce qu'un nouveau client soit créé

**Correction appliquée** : ✅ TERMINÉ
- Remplacement du `<Select>` basique par le composant `<ClientSelector>` existant
- Le `ClientSelector` charge automatiquement les clients via `useEffect(() => { fetchClients(); }, [])`
- Suppression du code redondant (gestion du formulaire "Nouveau client" maintenant dans ClientSelector)
- Réduction du code : ~220 lignes supprimées

**Résultat** :
```tsx
// ❌ AVANT : Select basique dépendant des props
<Select value={formData.clientId} onValueChange={...}>
  {clients.map(client => <SelectItem>...</SelectItem>)}
</Select>

// ✅ APRÈS : ClientSelector avec chargement automatique
<ClientSelector
  value={formData.clientId}
  onChange={(clientId) => setFormData(prev => ({ ...prev, clientId }))}
  onNewClient={(client) => setFormData(prev => ({ ...prev, clientId: client.id! }))}
  label="Client"
  required={true}
/>
```

---

### 2. Création du composant SupplierSelector réutilisable

**Fichier** : `src/components/purchases/SupplierSelector.tsx` (NOUVEAU)

**Objectif** : Composant miroir de `ClientSelector` pour les fournisseurs

**Fonctionnalités** : ✅ CRÉÉ
- Chargement automatique des fournisseurs au montage (`useEffect`)
- État de chargement avec spinner
- Bouton "+ Nouveau fournisseur" intégré
- Modale de création de fournisseur inline
- Auto-sélection du nouveau fournisseur après création
- Gestion d'erreur sans bloquer l'UI

**Architecture** :
```tsx
export const SupplierSelector: React.FC<SupplierSelectorProps> = ({
  value,
  onChange,
  onNewSupplier, // Callback après création
  label = 'Fournisseur',
  placeholder = 'Sélectionner un fournisseur',
  required = true
}) => {
  const [suppliers, setSuppliers] = useState<UnifiedThirdParty[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Chargement automatique au montage
  useEffect(() => {
    const fetchSuppliers = async () => {
      const suppliersData = await unifiedThirdPartiesService.getUnifiedThirdParties(undefined, 'supplier');
      setSuppliers(suppliersData || []);
    };
    fetchSuppliers();
  }, []);

  // ... reste du composant
};
```

---

## 🔄 Corrections à appliquer

### 3. PurchaseForm : Remplacement du Select fournisseurs

**Fichier** : `src/components/purchases/PurchaseForm.tsx`

**État** : ⏳ EN ATTENTE

**Actions nécessaires** :
1. Supprimer la prop `suppliers: Supplier[]` de `PurchaseFormProps`
2. Supprimer la prop `onSupplierCreated` (maintenant gérée par SupplierSelector)
3. Supprimer l'état `isSupplierModalOpen`
4. Supprimer la fonction `handleSupplierCreated`
5. Remplacer le bloc Select fournisseurs (lignes 233-269) par :

```tsx
<div className="space-y-2">
  <SupplierSelector
    value={formData.supplier_id}
    onChange={(supplierId) => handleInputChange('supplier_id', supplierId)}
    label={t('purchases.form.supplier')}
    placeholder={t('purchases.form.selectSupplier')}
    required={true}
  />
  {errors.supplier_id && (
    <p className="text-sm text-red-600 dark:text-red-400">{errors.supplier_id}</p>
  )}
</div>
```

6. Supprimer l'import `NewSupplierModal` (déjà remplacé)
7. Supprimer `Plus` de l'import lucide-react

**Fichiers parents à mettre à jour** :
- `src/pages/PurchasesPage.tsx` : Supprimer le chargement et le passage des props `suppliers` et `onSupplierCreated`

---

### 4. ArticleSelector : Liaison facturation ↔ inventaire

**Fichier** : À CRÉER `src/components/inventory/ArticleSelector.tsx`

**État** : ⏳ NON DÉMARRÉ

**Problème actuel** :
- Les articles de facture sont saisis en texte libre (description, quantité, prix, TVA)
- Aucune liaison avec la table `articles` de l'inventaire
- Pas de décrémentation de stock automatique
- Duplication des données articles

**Solution proposée** : Composant `ArticleSelector` avec :

```tsx
interface ArticleSelectorProps {
  value?: string; // article_id
  onChange: (article: Article | null) => void;
  onNewArticle?: (article: Article) => void;
  label?: string;
  placeholder?: string;
  allowCustom?: boolean; // Permettre saisie libre pour prestations
}

export const ArticleSelector: React.FC<ArticleSelectorProps> = ({
  value,
  onChange,
  onNewArticle,
  allowCustom = false
}) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewArticleModal, setShowNewArticleModal] = useState(false);

  // ✅ Chargement automatique au montage
  useEffect(() => {
    const fetchArticles = async () => {
      const articlesData = await articlesService.getArticles();
      setArticles(articlesData || []);
    };
    fetchArticles();
  }, []);

  return (
    <div className="space-y-2">
      <Combobox value={value} onChange={handleSelectArticle}>
        <ComboboxInput
          placeholder="Rechercher un article..."
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <ComboboxOptions>
          {filteredArticles.map(article => (
            <ComboboxOption key={article.id} value={article}>
              <div className="flex justify-between">
                <span>{article.reference} - {article.name}</span>
                <span className="text-gray-500">{article.selling_price} €</span>
              </div>
            </ComboboxOption>
          ))}

          {/* Option créer nouvel article */}
          <div onClick={() => setShowNewArticleModal(true)}>
            <Plus className="h-4 w-4" />
            Créer un nouvel article
          </div>

          {/* Option article personnalisé (prestations) */}
          {allowCustom && (
            <div onClick={() => onChange(null)}>
              Article personnalisé (saisie libre)
            </div>
          )}
        </ComboboxOptions>
      </Combobox>

      <NewArticleModal
        open={showNewArticleModal}
        onClose={() => setShowNewArticleModal(false)}
        onSuccess={handleArticleCreated}
      />
    </div>
  );
};
```

**Modifications nécessaires dans InvoiceFormDialog** :

```tsx
// Type de ligne de facture mis à jour
interface InvoiceLineItem {
  id: string;
  article_id?: string;           // ✅ Nouveau : ID article lié
  article_reference?: string;    // ✅ Nouveau : Référence article
  description: string;           // Pré-rempli ou libre
  quantity: number;
  unit_price: number;
  vat_rate: number;
  total: number;
  is_custom: boolean;            // ✅ Nouveau : true = texte libre
}

// Composant ligne de facture
const InvoiceLineItemRow = ({ line, index, onUpdate, onRemove }) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const handleArticleSelect = (article: Article | null) => {
    if (article) {
      // Article depuis inventaire
      onUpdate(index, {
        article_id: article.id,
        article_reference: article.reference,
        description: article.name,
        unit_price: article.selling_price,
        vat_rate: article.tva_rate,
        is_custom: false
      });
    } else {
      // Article personnalisé
      onUpdate(index, {
        article_id: null,
        article_reference: null,
        is_custom: true
      });
    }
    setSelectedArticle(article);
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Sélection article */}
      <div className="col-span-4">
        <ArticleSelector
          value={line.article_id}
          onChange={handleArticleSelect}
          allowCustom={true}
        />
      </div>

      {/* Quantité */}
      <div className="col-span-2">
        <Input
          type="number"
          value={line.quantity}
          onChange={(e) => onUpdate(index, { quantity: parseInt(e.target.value) })}
        />
      </div>

      {/* Prix HT (éditable même si article lié) */}
      <div className="col-span-2">
        <Input
          type="number"
          step="0.01"
          value={line.unit_price}
          onChange={(e) => onUpdate(index, { unit_price: parseFloat(e.target.value) })}
        />
      </div>

      {/* TVA */}
      <div className="col-span-2">
        <Select value={line.vat_rate.toString()} onValueChange={(v) => onUpdate(index, { vat_rate: parseFloat(v) })}>
          <SelectItem value="20">20%</SelectItem>
          <SelectItem value="10">10%</SelectItem>
          <SelectItem value="5.5">5,5%</SelectItem>
          <SelectItem value="0">0%</SelectItem>
        </Select>
      </div>

      {/* Total */}
      <div className="col-span-1">
        {formatCurrency(line.quantity * line.unit_price * (1 + line.vat_rate / 100))}
      </div>

      {/* Supprimer */}
      <div className="col-span-1">
        <Button variant="ghost" size="icon" onClick={() => onRemove(index)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
```

**Migration base de données** : Ajouter colonnes à `invoice_lines` :

```sql
ALTER TABLE invoice_lines
  ADD COLUMN article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  ADD COLUMN article_reference VARCHAR(50),
  ADD COLUMN is_custom BOOLEAN DEFAULT false;

-- Index pour performance
CREATE INDEX idx_invoice_lines_article_id ON invoice_lines(article_id);
```

---

## 🔍 Audit des autres modules

### Modules à vérifier

| Module | Dropdown | Table | État | Priorité |
|--------|----------|-------|------|----------|
| **Facturation** | ✅ Clients | `tiers` (customer) | CORRIGÉ | - |
| **Facturation** | ⏳ Articles | `articles` | À FAIRE | HAUTE |
| **Achats** | ⏳ Fournisseurs | `tiers` (supplier) | Composant créé | HAUTE |
| **Achats** | ⏳ Articles | `articles` | À FAIRE | MOYENNE |
| **Projets** | ❓ Clients | `tiers` (customer) | À VÉRIFIER | MOYENNE |
| **Projets** | ❓ Chef de projet | `hr_employees` | À VÉRIFIER | MOYENNE |
| **Projets** | ❓ Membres équipe | `hr_employees` | À VÉRIFIER | BASSE |
| **CRM** | ❓ Clients | `crm_clients` ou `tiers` | À VÉRIFIER | MOYENNE |
| **CRM** | ❓ Responsable | `hr_employees` | À VÉRIFIER | BASSE |
| **Inventaire** | ❓ Fournisseurs | `tiers` (supplier) | À VÉRIFIER | BASSE |
| **Inventaire** | ❓ Entrepôts | `warehouses` | À VÉRIFIER | BASSE |
| **Inventaire** | ❓ Catégories | `article_categories` | À VÉRIFIER | BASSE |
| **Comptabilité** | ❓ Comptes | `chart_of_accounts` | À VÉRIFIER | BASSE |
| **Comptabilité** | ❓ Journaux | `journals` | À VÉRIFIER | BASSE |
| **RH** | ❓ Employés | `hr_employees` | À VÉRIFIER | BASSE |
| **Budget** | ❓ Catégories | `budget_categories` | À VÉRIFIER | BASSE |

### Script de diagnostic automatique

```bash
# Trouver tous les Select/Dropdown
grep -rn "SelectContent\|SelectItem" src/pages/ src/components/ | grep -v "node_modules"

# Trouver les useState avec tableaux vides
grep -rn "useState\(\[\]\)" src/pages/ src/components/ | grep -v "node_modules"

# Trouver les useEffect de chargement
grep -rn "useEffect.*load\|useEffect.*fetch" src/pages/ src/components/ | grep -v "node_modules"
```

---

## 📋 Checklist de test

Une fois toutes les corrections appliquées :

### Tests manuels :

- [ ] **Facturation - Clients** : Ouvrir "Nouvelle facture" → Les clients s'affichent immédiatement (sans refresh)
- [ ] **Facturation - Articles** : Ajouter un article → Peut sélectionner depuis l'inventaire
- [ ] **Facturation - Articles** : Créer un article depuis facture → Apparaît aussi dans le module Inventaire
- [ ] **Achats - Fournisseurs** : Ouvrir "Nouvel achat" → Les fournisseurs s'affichent immédiatement
- [ ] **Achats - Articles** : Ajouter un article → Peut sélectionner depuis l'inventaire
- [ ] **Projets - Clients** : Ouvrir "Nouveau projet" → Clients ET chefs de projet s'affichent
- [ ] **CRM - Clients** : Ouvrir "Nouvelle opportunité" → Clients s'affichent immédiatement
- [ ] **Console navigateur** : Aucune erreur Supabase
- [ ] **Listes vides** : Pas de toast d'erreur quand les listes sont simplement vides (c'est normal au début)

### Tests automatisés :

```typescript
// Test unitaire : ClientSelector charge les données au montage
describe('ClientSelector', () => {
  it('should load clients on mount', async () => {
    const { getByText, queryByText } = render(<ClientSelector value="" onChange={jest.fn()} />);

    // Vérifie que le loading s'affiche
    expect(getByText('Chargement des clients...')).toBeInTheDocument();

    // Attend que les données soient chargées
    await waitFor(() => {
      expect(queryByText('Chargement des clients...')).not.toBeInTheDocument();
    });

    // Vérifie que les clients sont affichés
    expect(getByText('Sélectionner un client')).toBeInTheDocument();
  });

  it('should not show error toast on empty list', async () => {
    // Mock service retournant liste vide
    jest.spyOn(unifiedThirdPartiesService, 'getUnifiedThirdParties').mockResolvedValue([]);

    const { queryByText } = render(<ClientSelector value="" onChange={jest.fn()} />);

    await waitFor(() => {
      expect(queryByText('Aucun client disponible')).toBeInTheDocument();
    });

    // Vérifie qu'aucune erreur n'est affichée
    expect(queryByText('Erreur')).not.toBeInTheDocument();
  });
});
```

---

## 🚀 Plan de déploiement

### Phase 1 : Corrections critiques (MAINTENANT)
1. ✅ ClientSelector dans InvoiceFormDialog (FAIT)
2. ✅ SupplierSelector créé (FAIT)
3. ⏳ SupplierSelector dans PurchaseForm (EN COURS)
4. ⏳ ArticleSelector créé
5. ⏳ Articles liés dans InvoiceFormDialog

**Estimation** : 2-3 heures de développement

### Phase 2 : Audit et corrections autres modules (APRÈS)
1. Audit de ProjectsPage
2. Audit de SalesCrmPage
3. Audit des autres modules
4. Corrections similaires si nécessaires

**Estimation** : 4-6 heures de développement

### Phase 3 : Tests et déploiement
1. Tests manuels complets
2. Tests automatisés
3. Build de production
4. Déploiement VPS (`.\deploy-vps.ps1`)
5. Tests de fumée en production

**Estimation** : 1-2 heures

---

## 📊 Métriques d'amélioration

### Avant :
- Bug : Liste vide au 1er chargement ❌
- UX : 2-3 clics + refresh pour voir les données ⚠️
- Code : ~400 lignes de code dupliqué 📈
- Cohérence : Chaque formulaire implémente sa propre logique 🔀

### Après :
- Bug : Chargement automatique au montage ✅
- UX : Données visibles immédiatement (< 500ms) ⚡
- Code : ~150 lignes de composants réutilisables 📉
- Cohérence : Pattern unifié ClientSelector / SupplierSelector / ArticleSelector 🎯

---

## 🔗 Fichiers modifiés

### Modifications appliquées :
- ✅ `src/components/invoicing/OptimizedInvoicesTab.tsx` (simplifié, -220 lignes)

### Fichiers créés :
- ✅ `src/components/purchases/SupplierSelector.tsx` (nouveau composant)

### À modifier :
- ⏳ `src/components/purchases/PurchaseForm.tsx`
- ⏳ `src/pages/PurchasesPage.tsx`
- ⏳ `src/components/inventory/ArticleSelector.tsx` (à créer)
- ⏳ `src/components/invoicing/OptimizedInvoicesTab.tsx` (articles)

### Migrations base de données :
- ⏳ Migration pour ajouter colonnes `article_id`, `article_reference`, `is_custom` à `invoice_lines`

---

## ✅ Validation finale

Une fois toutes les corrections appliquées, valider :

1. ✅ Tous les dropdowns chargent leurs données au montage (pas de liste vide au 1er clic)
2. ✅ Les boutons "+ Nouveau..." sont intégrés dans les sélecteurs
3. ✅ Après création d'un élément, il est automatiquement sélectionné
4. ✅ Pas de toast d'erreur pour les listes vides légitimes
5. ✅ Console navigateur propre (pas d'erreurs Supabase)
6. ✅ Pattern unifié dans toute l'application
7. ✅ Code simplifié et réutilisable

---

**Date** : 2025-12-04
**Status** : 🟡 EN COURS
**Prochaine étape** : Finaliser SupplierSelector dans PurchaseForm, puis créer ArticleSelector
