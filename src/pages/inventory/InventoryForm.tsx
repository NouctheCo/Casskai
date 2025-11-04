import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from 'framer-motion';
import { useLocale } from '@/i18n/i18n';

interface InventoryItem {
  id: string;
  name: string;
  reference: string;
  currentStock: number;
}

// Formulaire article
interface ArticleFormProps {
  reference: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  purchasePrice: string;
  sellingPrice: string;
  initialStock: string;
  minStock: string;
  location: string;
  onReferenceChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onPurchasePriceChange: (value: string) => void;
  onSellingPriceChange: (value: string) => void;
  onInitialStockChange: (value: string) => void;
  onMinStockChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ArticleForm({
  reference,
  name,
  description,
  category,
  unit,
  purchasePrice,
  sellingPrice,
  initialStock,
  minStock,
  location,
  onReferenceChange,
  onNameChange,
  onDescriptionChange,
  onCategoryChange,
  onUnitChange,
  onPurchasePriceChange,
  onSellingPriceChange,
  onInitialStockChange,
  onMinStockChange,
  onLocationChange,
  onSubmit,
  onCancel,
}: ArticleFormProps) {
  const { t } = useLocale();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('inventorypage.nouvel_article', { defaultValue: 'Nouvel Article' })}</CardTitle>
        <CardDescription>{t('inventorypage.ajoutez_un_nouvel_article_votre_stock', { defaultValue: 'Ajoutez un nouvel article à votre stock' })}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="articleReference">{t('inventorypage.rfrence', { defaultValue: 'Référence' })}</Label>
            <Input
              id="articleReference"
              value={reference}
              onChange={(e) => onReferenceChange(e.target.value)}
              placeholder={t('inventorypage.ref001', { defaultValue: 'REF-001' })}
            />
          </div>
          <div>
            <Label htmlFor="articleName">{t('inventorypage.nom_de_larticle', { defaultValue: 'Nom de l\'article' })}</Label>
            <Input
              id="articleName"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={t('inventorypage.ordinateur_portable_dell', { defaultValue: 'Ordinateur portable Dell' })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="articleDescription">{t('inventorypage.description', { defaultValue: 'Description' })}</Label>
          <Textarea
            id="articleDescription"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={2}
            placeholder={`${t('inventorypage.description', { defaultValue: 'Description' })  } détaillée de l'article`}
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label htmlFor="articleCategory">{t('inventorypage.catgorie', { defaultValue: 'Catégorie' })}</Label>
            <select
              id="articleCategory"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white dark:bg-gray-900 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option>{t('inventorypage.matriel_informatique', { defaultValue: 'Matériel informatique' })}</option>
              <option>{t('inventorypage.fournitures_bureau', { defaultValue: 'Fournitures bureau' })}</option>
              <option>{t('inventorypage.marchandises', { defaultValue: 'Marchandises' })}</option>
              <option>{t('inventorypage.matires_premires', { defaultValue: 'Matières premières' })}</option>
            </select>
          </div>
          <div>
            <Label htmlFor="articlePurchasePrice">{t('inventorypage.prix_dachat_', { defaultValue: 'Prix d\'achat (€)' })}</Label>
            <Input
              id="articlePurchasePrice"
              value={purchasePrice}
              onChange={(e) => onPurchasePriceChange(e.target.value)}
              placeholder={t('inventorypage.80000', { defaultValue: '800.00' })}
              type="number"
              step="0.01"
            />
          </div>
          <div>
            <Label htmlFor="articleSellingPrice">{t('inventorypage.prix_de_vente_', { defaultValue: 'Prix de vente (€)' })}</Label>
            <Input
              id="articleSellingPrice"
              value={sellingPrice}
              onChange={(e) => onSellingPriceChange(e.target.value)}
              placeholder={t('inventorypage.120000', { defaultValue: '1200.00' })}
              type="number"
              step="0.01"
            />
          </div>
          <div>
            <Label htmlFor="articleUnit">{t('inventorypage.unit', { defaultValue: 'Unité' })}</Label>
            <select
              id="articleUnit"
              value={unit}
              onChange={(e) => onUnitChange(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white dark:bg-gray-900 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option>{t('inventorypage.pice', { defaultValue: 'Pièce' })}</option>
              <option>{t('inventorypage.kg', { defaultValue: 'Kg' })}</option>
              <option>{t('inventorypage.mtre', { defaultValue: 'Mètre' })}</option>
              <option>{t('inventorypage.litre', { defaultValue: 'Litre' })}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="articleInitialStock">{t('inventorypage.stock_initial', { defaultValue: 'Stock initial' })}</Label>
            <Input
              id="articleInitialStock"
              value={initialStock}
              onChange={(e) => onInitialStockChange(e.target.value)}
              placeholder="10"
              type="number"
            />
          </div>
          <div>
            <Label htmlFor="articleMinStock">{t('inventorypage.stock_minimum', { defaultValue: 'Stock minimum' })}</Label>
            <Input
              id="articleMinStock"
              value={minStock}
              onChange={(e) => onMinStockChange(e.target.value)}
              placeholder="2"
              type="number"
            />
          </div>
          <div>
            <Label htmlFor="articleLocation">{t('inventorypage.emplacement', { defaultValue: 'Emplacement' })}</Label>
            <Input
              id="articleLocation"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder={t('inventorypage.entrept_alle_3', { defaultValue: 'Entrepôt A - Allée 3' })}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onCancel} variant="outline">{t('inventorypage.annuler', { defaultValue: 'Annuler' })}</Button>
          <Button onClick={onSubmit}>{t('inventorypage.ajouter_larticle', { defaultValue: 'Ajouter l\'article' })}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Formulaire mouvement
interface MovementFormProps {
  inventoryItems: InventoryItem[];
  movementItemId: string;
  movementType: 'entry' | 'exit' | 'adjustment' | 'transfer';
  movementQuantity: string;
  movementReason: string;
  onItemIdChange: (value: string) => void;
  onTypeChange: (value: 'entry' | 'exit' | 'adjustment' | 'transfer') => void;
  onQuantityChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function MovementForm({
  inventoryItems,
  movementItemId,
  movementType,
  movementQuantity,
  movementReason,
  onItemIdChange,
  onTypeChange,
  onQuantityChange,
  onReasonChange,
  onSubmit,
  onCancel,
}: MovementFormProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onCancel}
    >
      <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle>Nouveau mouvement de stock</CardTitle>
          <CardDescription>Enregistrer une entrée, sortie ou ajustement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Article *</Label>
            <Select value={movementItemId} onValueChange={onItemIdChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un article" />
              </SelectTrigger>
              <SelectContent>
                {inventoryItems.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} (Stock: {item.currentStock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Type de mouvement *</Label>
            <Select value={movementType} onValueChange={(value) => onTypeChange(value as 'entry' | 'exit' | 'adjustment' | 'transfer')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Entrée</SelectItem>
                <SelectItem value="exit">Sortie</SelectItem>
                <SelectItem value="adjustment">Ajustement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quantité *</Label>
            <Input
              type="number"
              min="1"
              placeholder="Ex: 10"
              value={movementQuantity}
              onChange={(e) => onQuantityChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Motif *</Label>
            <Input
              placeholder="Ex: Réception fournisseur, Vente client..."
              value={movementReason}
              onChange={(e) => onReasonChange(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Annuler
            </Button>
            <Button onClick={onSubmit} className="flex-1">
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Formulaire fournisseur
interface SupplierFormProps {
  supplierName: string;
  supplierEmail: string;
  supplierPhone: string;
  supplierContact: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onContactChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function SupplierForm({
  supplierName,
  supplierEmail,
  supplierPhone,
  supplierContact,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onContactChange,
  onSubmit,
  onCancel,
}: SupplierFormProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onCancel}
    >
      <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle>Nouveau fournisseur</CardTitle>
          <CardDescription>Ajouter un nouveau fournisseur au carnet d'adresses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nom du fournisseur *</Label>
            <Input
              placeholder="Ex: Dell France"
              value={supplierName}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              placeholder="contact@fournisseur.com"
              value={supplierEmail}
              onChange={(e) => onEmailChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input
              placeholder="01 23 45 67 89"
              value={supplierPhone}
              onChange={(e) => onPhoneChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Personne de contact</Label>
            <Input
              placeholder="Nom du contact"
              value={supplierContact}
              onChange={(e) => onContactChange(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Annuler
            </Button>
            <Button onClick={onSubmit} className="flex-1">
              Créer
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
