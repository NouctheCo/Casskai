import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, PlusCircle, Search, ListFilter, FileArchive, Users2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/contexts/LocaleContext';
import { motion } from 'framer-motion';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function PurchasesPage() {
  const { t } = useLocale();
  const { currentEnterpriseId } = useAuth();
  const { toast } = useToast();
  
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [orderDate, setOrderDate] = useState(new Date());
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('BC-0001');

  useEffect(() => {
    if (currentEnterpriseId) {
      fetchSuppliers();
      generateOrderNumber();
    }
  }, [currentEnterpriseId]);

  const fetchSuppliers = async () => {
    if (!currentEnterpriseId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('third_parties')
        .select('id, name, email, default_payment_terms, default_currency')
        .eq('company_id', currentEnterpriseId)
        .eq('type', 'SUPPLIER')
        .eq('is_active', true)
        .order('name');
        
      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('purchasespage.erreur_chargement_fournisseurs', { defaultValue: 'Erreur lors du chargement des fournisseurs' })
      });
    } finally {
      setLoading(false);
    }
  };

  const generateOrderNumber = async () => {
    if (!currentEnterpriseId) return;
    
    try {
      // This is a simplified version - in a real app, you'd query the database
      // to get the last order number and increment it
      setOrderNumber('BC-' + Math.floor(1000 + Math.random() * 9000));
    } catch (error) {
      console.error('Error generating order number:', error);
    }
  };

  const handleNewPurchase = () => {
    setShowPurchaseForm(true);
    setOrderDate(new Date());
    setDeliveryDate(null);
    setSelectedSupplierId('');
    generateOrderNumber();
  };

  const handleBackToList = () => {
    setShowPurchaseForm(false);
  };

  const handleCreatePurchaseOrder = () => {
    if (!selectedSupplierId) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('purchasespage.veuillez_selectionner_un_fournisseur', { defaultValue: 'Veuillez sélectionner un fournisseur' })
      });
      return;
    }
    
    // Here you would implement the actual creation of the purchase order
    toast({
      title: t('success'),
      description: t('purchasespage.bon_de_commande_cree', { defaultValue: 'Bon de commande créé avec succès' })
    });
    setShowPurchaseForm(false);
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
          <h1 className="text-3xl font-bold tracking-tight">{t('purchases')}</h1>
          <p className="text-muted-foreground">{t('purchasespage.grez_vos_fournisseurs_et_le_cycle_dachats', { defaultValue: 'Gérez vos fournisseurs et le cycle d\'achats.' })}</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button onClick={handleNewPurchase}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('purchasespage.nouveau_bon_de_commande', { defaultValue: 'Nouveau Bon de Commande' })}
          </Button>
        </motion.div>
      </div>

      {showPurchaseForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('purchasespage.nouveau_bon_de_commande', { defaultValue: 'Nouveau Bon de Commande' })}</CardTitle>
            <CardDescription>{t('purchasespage.crez_un_nouveau_bon_de_commande_fournisseur', { defaultValue: 'Créez un nouveau bon de commande fournisseur' })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="purchase-order-number" className="text-sm font-medium">{t('purchasespage.numro_bc', { defaultValue: 'Numéro BC' })}</label>
                <Input id="purchase-order-number" value={orderNumber} disabled />
              </div>
              <div>
                <label htmlFor="purchase-order-date" className="text-sm font-medium">{t('purchasespage.date', { defaultValue: 'Date' })}</label>
                <DatePicker
                  value={orderDate}
                  onChange={setOrderDate}
                  placeholder={t('purchasespage.slectionnez_une_date', { defaultValue: 'Sélectionnez une date' })}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="supplier-select" className="text-sm font-medium">{t('purchasespage.fournisseur', { defaultValue: 'Fournisseur' })}</label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger id="supplier-select">
                  <SelectValue placeholder={t('purchasespage.slectionner_un_fournisseur', { defaultValue: 'Sélectionner un fournisseur' })} />
                </SelectTrigger>
                <SelectContent>
                  {loading ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>{t('common.loading', { defaultValue: 'Chargement...' })}</span>
                    </div>
                  ) : suppliers.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      {t('purchasespage.aucun_fournisseur', { defaultValue: 'Aucun fournisseur disponible' })}
                    </div>
                  ) : (
                    suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="delivery-date" className="text-sm font-medium">{t('purchasespage.date', { defaultValue: 'Date' })} de livraison souhaitée</label>
              <DatePicker
                value={deliveryDate}
                onChange={setDeliveryDate}
                placeholder={t('purchasespage.slectionnez_une_date', { defaultValue: 'Sélectionnez une date' })}
              />
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">{t('purchasespage.articles_commands', { defaultValue: 'Articles commandés' })}</h3>
              
              <div className="grid grid-cols-5 gap-2 mb-2 text-sm font-medium">
                <div>{t('purchasespage.articleservice', { defaultValue: 'Article/Service' })}</div>
                <div>{t('purchasespage.quantit', { defaultValue: 'Quantité' })}</div>
                <div>{t('purchasespage.prix_unitaire_ht', { defaultValue: 'Prix unitaire HT' })}</div>
                <div>{t('purchasespage.total_ht', { defaultValue: 'Total HT' })}</div>
                <div>{t('purchasespage.actions', { defaultValue: 'Actions' })}</div>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-2 items-center">
                <Input placeholder={t('purchasespage.description_de_l', { defaultValue: 'Description de l\'article' })} />
                <Input placeholder="1" type="number" />
                <Input placeholder={t('purchasespage.000', { defaultValue: '0,00' })} type="number" step="0.01" />
                <Input placeholder={t('purchasespage.000', { defaultValue: '0,00' })} disabled />
                <Button variant="outline" size="sm">+</Button>
              </div>

              <div className="flex justify-end mt-4">
                <div className="text-right">
                  <div>{t('purchasespage.total_ht', { defaultValue: 'Total HT' })}: {t('purchasespage.000', { defaultValue: '0,00' })} €</div>
                  <div>{t('purchasespage.tva_000_', { defaultValue: 'TVA: 0,00 €' })}</div>
                  <div className="font-bold">{t('purchasespage.total_ttc_000_', { defaultValue: 'Total TTC: 0,00 €' })}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleBackToList} variant="outline">{t('purchasespage.annuler', { defaultValue: 'Annuler' })}</Button>
              <Button onClick={handleCreatePurchaseOrder}>{t('purchasespage.crer_le_bon_de_commande', { defaultValue: 'Créer le bon de commande' })}</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div>
                <CardTitle>Factures {t('purchasespage.fournisseur', { defaultValue: 'Fournisseur' })}s</CardTitle>
                <CardDescription>{t('purchasespage.suivez_vos_factures_dachats_et_rglements', { defaultValue: 'Suivez vos factures d\'achats et règlements.' })}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-full md:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder={t('purchasespage.rechercher_factures', { defaultValue: 'Rechercher factures...' })} className="pl-8 w-full md:w-[250px]" />
                </div>
                <Button variant="outline" size="icon"><ListFilter className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileArchive className="mx-auto h-16 w-16 text-primary/50" />
              <p className="mt-4 text-lg text-muted-foreground">{t('purchasespage.aucune_facture_fournisseur_pour_le_moment', { defaultValue: 'Aucune facture fournisseur pour le moment' })}</p>
              <p className="text-sm text-muted-foreground mb-4">{t('purchasespage.commencez_par_crer_votre_premier_bon_de_commande', { defaultValue: 'Commencez par créer votre premier bon de commande' })}</p>
              <Button onClick={handleNewPurchase}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Premier bon de commande
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

       <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('purchasespage.bons_de_commande_liste', { defaultValue: 'Bons de Commande (Liste)' })}</CardTitle>
          </CardHeader>
          <CardContent className="h-[150px] flex items-center justify-center">
            <ShoppingCart className="mx-auto h-12 w-12 text-primary/30" />
            <p className="ml-4 text-muted-foreground">{t('comingSoon')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gestion des {t('purchasespage.fournisseur', { defaultValue: 'Fournisseur' })}s</CardTitle>
          </CardHeader>
          <CardContent className="h-[150px] flex items-center justify-center">
            <Users2 className="mx-auto h-12 w-12 text-primary/30" />
            <p className="ml-4 text-muted-foreground">{t('comingSoon')}</p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}