import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Archive, PlusCircle, Search, ListFilter, Package, Factory, MinusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/contexts/LocaleContext';
import { motion } from 'framer-motion';

export default function InventoryPage() {
  const { t } = useLocale();
  const [showArticleForm, setShowArticleForm] = useState(false);

  const handleNewArticle = () => {
    setShowArticleForm(true);
  };

  const handleBackToList = () => {
    setShowArticleForm(false);
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('inventory')}</h1>
          <p className="text-muted-foreground">{t('inventorypage.grez_vos_stocks_de_marchandises_et_suivi_de_production', { defaultValue: 'Gérez vos stocks de marchandises et suivi de production.' })}</p>
        </div>
        <div className="flex gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" onClick={handleNewArticle}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('inventorypage.nouvel_article', { defaultValue: 'Nouvel Article' })}
            </Button>
            </motion.div>
             <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button>
                <MinusCircle className="mr-2 h-4 w-4" />
                Sortie de Stock
            </Button>
            </motion.div>
        </div>
      </div>

      {showArticleForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('inventorypage.nouvel_article', { defaultValue: 'Nouvel Article' })}</CardTitle>
            <CardDescription>{t('inventorypage.ajoutez_un_nouvel_article_votre_stock', { defaultValue: 'Ajoutez un nouvel article à votre stock' })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="articleReference" className="text-sm font-medium">{t('inventorypage.rfrence', { defaultValue: 'Référence' })}</label>
                <Input id="articleReference" placeholder={t('inventorypage.ref001', { defaultValue: 'REF-001' })} />
              </div>
              <div>
                <label htmlFor="articleName" className="text-sm font-medium">{t('inventorypage.nom_de_larticle', { defaultValue: 'Nom de l\'article' })}</label>
                <Input id="articleName" placeholder={t('inventorypage.ordinateur_portable_dell', { defaultValue: 'Ordinateur portable Dell' })} />
              </div>
            </div>
            
            <div>
              <label htmlFor="articleDescription" className="text-sm font-medium">{t('inventorypage.description', { defaultValue: 'Description' })}</label>
              <textarea id="articleDescription" className="w-full border rounded-md px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" rows="2" placeholder={t('inventorypage.description', { defaultValue: 'Description' }) + ' détaillée de l\'article'}></textarea>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label htmlFor="articleCategory" className="text-sm font-medium">{t('inventorypage.catgorie', { defaultValue: 'Catégorie' })}</label>
                <select id="articleCategory" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option>{t('inventorypage.matriel_informatique', { defaultValue: 'Matériel informatique' })}</option>
                  <option>{t('inventorypage.fournitures_bureau', { defaultValue: 'Fournitures bureau' })}</option>
                  <option>{t('inventorypage.marchandises', { defaultValue: 'Marchandises' })}</option>
                  <option>{t('inventorypage.matires_premires', { defaultValue: 'Matières premières' })}</option>
                </select>
              </div>
              <div>
                <label htmlFor="articlePurchasePrice" className="text-sm font-medium">{t('inventorypage.prix_dachat_', { defaultValue: 'Prix d\'achat (€)' })}</label>
                <Input id="articlePurchasePrice" placeholder={t('inventorypage.80000', { defaultValue: '800.00' })} type="number" step="0.01" />
              </div>
              <div>
                <label htmlFor="articleSellingPrice" className="text-sm font-medium">{t('inventorypage.prix_de_vente_', { defaultValue: 'Prix de vente (€)' })}</label>
                <Input id="articleSellingPrice" placeholder={t('inventorypage.120000', { defaultValue: '1200.00' })} type="number" step="0.01" />
              </div>
              <div>
                <label htmlFor="articleUnit" className="text-sm font-medium">{t('inventorypage.unit', { defaultValue: 'Unité' })}</label>
                <select id="articleUnit" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option>{t('inventorypage.pice', { defaultValue: 'Pièce' })}</option>
                  <option>{t('inventorypage.kg', { defaultValue: 'Kg' })}</option>
                  <option>{t('inventorypage.mtre', { defaultValue: 'Mètre' })}</option>
                  <option>{t('inventorypage.litre', { defaultValue: 'Litre' })}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="articleInitialStock" className="text-sm font-medium">{t('inventorypage.stock_initial', { defaultValue: 'Stock initial' })}</label>
                <Input id="articleInitialStock" placeholder="10" type="number" />
              </div>
              <div>
                <label htmlFor="articleMinStock" className="text-sm font-medium">{t('inventorypage.stock_minimum', { defaultValue: 'Stock minimum' })}</label>
                <Input id="articleMinStock" placeholder="2" type="number" />
              </div>
              <div>
                <label htmlFor="articleLocation" className="text-sm font-medium">{t('inventorypage.emplacement', { defaultValue: 'Emplacement' })}</label>
                <Input id="articleLocation" placeholder={t('inventorypage.entrept_alle_3', { defaultValue: 'Entrepôt A - Allée 3' })} />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleBackToList} variant="outline">{t('inventorypage.annuler', { defaultValue: 'Annuler' })}</Button>
              <Button>{t('inventorypage.ajouter_larticle', { defaultValue: 'Ajouter l\'article' })}</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
              <CardTitle>{t('inventorypage.articles_en_stock', { defaultValue: 'Articles en Stock' })}</CardTitle>
              <CardDescription>{t('inventorypage.consultez_et_grez_vos_articles_et_mouvements_de_stock', { defaultValue: 'Consultez et gérez vos articles et mouvements de stock.' })}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder={t('inventorypage.rechercher_article', { defaultValue: 'Rechercher article...' })} className="pl-8 w-full md:w-[250px]" />
              </div>
              <Button variant="outline" size="icon"><ListFilter className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Archive className="mx-auto h-16 w-16 text-primary/50" />
            <p className="mt-4 text-lg text-muted-foreground">{t('inventorypage.aucun_article_en_stock', { defaultValue: 'Aucun article en stock' })}</p>
            <p className="text-sm text-muted-foreground mb-4">{t('inventorypage.commencez_par_ajouter_votre_premier_article', { defaultValue: 'Commencez par ajouter votre premier article' })}</p>
            <Button onClick={handleNewArticle}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Premier article
            </Button>
          </div>
        </CardContent>
      </Card>
    )}
       <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Package className="text-orange-500"/>{t('inventorypage.mouvements_de_stock', { defaultValue: 'Mouvements de Stock' })}</CardTitle></CardHeader>
          <CardContent className="h-[150px] flex items-center justify-center">
            <p className="text-muted-foreground">{t('comingSoon')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Factory className="text-lime-500"/>{t('inventorypage.suivi_de_production', { defaultValue: 'Suivi de Production' })}</CardTitle></CardHeader>
          <CardContent className="h-[150px] flex items-center justify-center">
            <p className="text-muted-foreground">{t('comingSoon')}</p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}