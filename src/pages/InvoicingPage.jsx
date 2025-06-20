import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { DatePicker } from '@/components/ui/date-picker';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Search, ListFilter, FileText, X, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';

export default function InvoicingPage() {
  const { t } = useLocale();
  
  // Utilisation de currentEnterpriseId au lieu de companyId
  const { 
    currentEnterpriseId,
    currentEnterpriseName,
    loadingAccess,
    userCompanies 
  } = useAuth();
  
  const { toast } = useToast();
  const location = useLocation();
  
  // Validation améliorée
  const isValidCompanyId = (id) => {
    const isValid = id && 
      id !== 'undefined' && 
      id !== undefined && 
      typeof id === 'string' && 
      id.trim() !== '';
    
    console.log('🔍 Validation currentEnterpriseId:', { 
      id, 
      type: typeof id, 
      isValid,
      loadingAccess 
    });
    
    return isValid;
  };

  // États existants...
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(addDays(new Date(), 30));
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('30');
  const [invoiceItems, setInvoiceItems] = useState([
    { id: Date.now(), description: '', quantity: 1, unit_price: 0, tax_rate: 20, total: 0 }
  ]);
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [clients, setClients] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Débogage pour diagnostiquer
  useEffect(() => {
    console.log('🔍 Auth state debug:', {
      currentEnterpriseId,
      currentEnterpriseName,
      loadingAccess,
      userCompaniesCount: userCompanies?.length || 0,
      userCompanies: userCompanies
    });
  }, [currentEnterpriseId, loadingAccess, userCompanies, currentEnterpriseName]);

  useEffect(() => {
    // Check if we have a client ID from navigation state
    if (location.state?.selectedClientId && isValidCompanyId(currentEnterpriseId)) {
      setSelectedClientId(location.state.selectedClientId);
      setShowInvoiceForm(true);
    }
  }, [location.state, currentEnterpriseId]);

  // Attendre que les données soient chargées
  useEffect(() => {
    if (!loadingAccess && isValidCompanyId(currentEnterpriseId)) {
      fetchInvoices();
      generateInvoiceNumber();
      fetchClients();
    }
  }, [currentEnterpriseId, loadingAccess]); // Ajout de loadingAccess

  useEffect(() => {
    if (selectedClientId) {
      fetchClientDetails();
    }
  }, [selectedClientId]);

  useEffect(() => {
    if (selectedClient?.default_payment_terms) {
      const terms = selectedClient.default_payment_terms;
      if (terms.includes('30')) {
        setPaymentTerms('30');
        setDueDate(addDays(invoiceDate, 30));
      } else if (terms.includes('60')) {
        setPaymentTerms('60');
        setDueDate(addDays(invoiceDate, 60));
      } else if (terms.includes('15')) {
        setPaymentTerms('15');
        setDueDate(addDays(invoiceDate, 15));
      } else if (terms.includes('45')) {
        setPaymentTerms('45');
        setDueDate(addDays(invoiceDate, 45));
      }
    }
  }, [selectedClient, invoiceDate]);

  useEffect(() => {
    calculateTotals();
  }, [invoiceItems]);

  useEffect(() => {
    if (paymentTerms) {
      setDueDate(addDays(invoiceDate, parseInt(paymentTerms)));
    }
  }, [paymentTerms, invoiceDate]);

  const fetchInvoices = async () => {
    // Utiliser currentEnterpriseId
    if (!isValidCompanyId(currentEnterpriseId)) {
      console.error('Invalid currentEnterpriseId:', currentEnterpriseId);
      return;
    }

    setLoading(true);
    try {
      // CORRECTION: Utilisation de la relation spécifique pour éviter l'ambiguïté
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          third_parties!invoices_client_id_fkey(name)
        `)
        .eq('company_id', currentEnterpriseId)
        .order('issue_date', { ascending: false });
      
      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('invoicingpage.erreur_chargement_factures', { defaultValue: 'Erreur lors du chargement des factures' })
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    if (!isValidCompanyId(currentEnterpriseId)) return;
    
    try {
      const { data, error } = await supabase
        .from('third_parties')
        .select('id, name, email, default_payment_terms, default_currency')
        .eq('company_id', currentEnterpriseId)
        .eq('type', 'CLIENT')
        .eq('is_active', true)
        .order('name');
        
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchClientDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('third_parties')
        .select('*')
        .eq('id', selectedClientId)
        .single();
      
      if (error) throw error;
      setSelectedClient(data);
    } catch (error) {
      console.error('Error fetching client details:', error);
    }
  };

  const generateInvoiceNumber = async () => {
    // Utiliser currentEnterpriseId
    if (!isValidCompanyId(currentEnterpriseId)) {
      console.error('Invalid currentEnterpriseId for invoice number generation:', currentEnterpriseId);
      setInvoiceNumber('FACT-0001');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('company_id', currentEnterpriseId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      let newNumber = 'FACT-0001';
      if (data && data.length > 0) {
        const lastNumber = data[0].invoice_number;
        const numPart = lastNumber.split('-')[1];
        const newNum = parseInt(numPart) + 1;
        newNumber = `FACT-${newNum.toString().padStart(4, '0')}`;
      }
      
      setInvoiceNumber(newNumber);
    } catch (error) {
      console.error('Error generating invoice number:', error);
      setInvoiceNumber('FACT-0001');
    }
  };

  // Gestion des cas où l'entreprise n'est pas sélectionnée
  const handleNewInvoice = () => {
    console.log('🚀 handleNewInvoice called', { 
      currentEnterpriseId, 
      loadingAccess,
      isValid: isValidCompanyId(currentEnterpriseId) 
    });

    // Vérifier si les données sont encore en cours de chargement
    if (loadingAccess) {
      toast({
        title: t('info'),
        description: 'Chargement des données en cours...'
      });
      return;
    }

    // Vérifier s'il y a des entreprises disponibles
    if (!userCompanies || userCompanies.length === 0) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: 'Aucune entreprise disponible. Veuillez contacter l\'administrateur.'
      });
      return;
    }

    // Vérifier si une entreprise est sélectionnée
    if (!isValidCompanyId(currentEnterpriseId)) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: 'Veuillez sélectionner une entreprise avant de créer une facture.'
      });
      return;
    }

    setInvoiceDate(new Date());
    setDueDate(addDays(new Date(), 30));
    setSelectedClientId('');
    setSelectedClient(null);
    setNotes('');
    setPaymentTerms('30');
    setInvoiceItems([
      { id: Date.now(), description: '', quantity: 1, unit_price: 0, tax_rate: 20, total: 0 }
    ]);
    generateInvoiceNumber();
    setShowInvoiceForm(true);
  };

  const handleBackToList = () => {
    setShowInvoiceForm(false);
  };

  const handleAddItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { id: Date.now(), description: '', quantity: 1, unit_price: 0, tax_rate: 20, total: 0 }
    ]);
  };

  const handleRemoveItem = (id) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    const updatedItems = invoiceItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate item total
        if (field === 'quantity' || field === 'unit_price') {
          const quantity = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(item.quantity) || 0;
          const unitPrice = field === 'unit_price' ? parseFloat(value) || 0 : parseFloat(item.unit_price) || 0;
          updatedItem.total = quantity * unitPrice;
        }
        
        return updatedItem;
      }
      return item;
    });
    
    setInvoiceItems(updatedItems);
  };

  const calculateTotals = () => {
    const newSubtotal = invoiceItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    
    const newTaxAmount = invoiceItems.reduce((sum, item) => {
      const itemTotal = parseFloat(item.total) || 0;
      const taxRate = parseFloat(item.tax_rate) || 0;
      return sum + (itemTotal * taxRate / 100);
    }, 0);
    
    setSubtotal(newSubtotal);
    setTaxAmount(newTaxAmount);
    setTotalAmount(newSubtotal + newTaxAmount);
  };

  const handleCreateInvoice = async (e) => {
    // Empêcher le comportement par défaut du formulaire
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    // Vérifier si un client est sélectionné
    if (!selectedClientId) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('invoicingpage.veuillez_slectionner_un_client', { defaultValue: 'Veuillez sélectionner un client' })
      });
      return;
    }

    // Vérifier si les lignes de facture sont remplies
    if (invoiceItems.length === 0 || invoiceItems.some(item => !item.description || !item.quantity || !item.unit_price)) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('invoicingpage.veuillez_remplir_tous_les_champs_des_lignes_de_facture', { defaultValue: 'Veuillez remplir tous les champs des lignes de facture' })
      });
      return;
    }

    // Utiliser currentEnterpriseId
    if (!isValidCompanyId(currentEnterpriseId)) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('invoicingpage.erreur_company_id_invalide', { defaultValue: 'Erreur: ID de société invalide' })
      });
      return;
    }

    // Éviter les soumissions multiples
    if (isSubmitting) {
      console.log('Soumission déjà en cours, ignorée');
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    
    try {
      console.log('Création de la facture...', {
        company_id: currentEnterpriseId,
        client_id: selectedClientId,
        invoice_number: invoiceNumber,
        items: invoiceItems.length
      });

      // 1. Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          company_id: currentEnterpriseId,
          client_id: selectedClientId,
          client_name: selectedClient?.name,
          invoice_number: invoiceNumber,
          issue_date: invoiceDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          status: 'draft',
          currency: selectedClient?.default_currency || 'EUR',
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          amount_paid: 0,
          notes,
          terms: paymentTerms
        })
        .select()
        .single();
      
      if (invoiceError) {
        console.error('Erreur lors de la création de la facture:', invoiceError);
        throw invoiceError;
      }
      
      console.log('Facture créée avec succès:', invoice);
      
      // 2. Create invoice items
      const invoiceItemsToInsert = invoiceItems.map(item => ({
        invoice_id: invoice.id,
        company_id: currentEnterpriseId,
        description: item.description,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        tax_rate: parseFloat(item.tax_rate),
        total_amount: parseFloat(item.total)
      }));
      
      console.log('Création des lignes de facture:', invoiceItemsToInsert);
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItemsToInsert);
      
      if (itemsError) {
        console.error('Erreur lors de la création des lignes de facture:', itemsError);
        throw itemsError;
      }
      
      toast({
        title: t('success'),
        description: t('invoicingpage.facture_cre_avec_succs', { defaultValue: 'Facture créée avec succès' })
      });
      
      setShowInvoiceForm(false);
      fetchInvoices();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: error.message || t('invoicingpage.erreur_lors_de_la_cration_de_la_facture', { defaultValue: 'Erreur lors de la création de la facture' })
      });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  // Affichage d'un loader pendant le chargement des données
  if (loadingAccess) {
    return (
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Chargement des données de l'entreprise...</span>
        </div>
      </motion.div>
    );
  }

  // Message si aucune entreprise
  if (!userCompanies || userCompanies.length === 0) {
    return (
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-lg font-semibold mb-4">Aucune entreprise disponible</h2>
            <p className="text-muted-foreground">
              Vous devez être associé à une entreprise pour créer des factures.
              Veuillez contacter votre administrateur.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('invoicing')}</h1>
          <p className="text-muted-foreground">{t('invoicingpage.grez_vos_factures_clients_et_fournisseurs', { defaultValue: 'Gérez vos factures clients et fournisseurs.' })}</p>
          {/* Affichage de l'entreprise sélectionnée */}
          {currentEnterpriseName && (
            <p className="text-sm text-primary">
              Entreprise: {currentEnterpriseName}
            </p>
          )}
        </div>
        <Button 
          onClick={handleNewInvoice}
          disabled={!isValidCompanyId(currentEnterpriseId) || loadingAccess}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('addInvoice', 'Nouvelle facture')}
        </Button>
      </div>

      {showInvoiceForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('invoicingpage.nouvelle_facture', { defaultValue: 'Nouvelle Facture' })}</CardTitle>
            <CardDescription>{t('invoicingpage.crez_une_nouvelle_facture_client', { defaultValue: 'Créez une nouvelle facture client' })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="invoice-number" className="block text-sm font-medium mb-1">{t('invoicingpage.numro_de_facture', { defaultValue: 'Numéro de facture' })}</label>
                <Input 
                  id="invoice-number" 
                  value={invoiceNumber} 
                  onChange={(e) => setInvoiceNumber(e.target.value)} 
                />
              </div>
              <div>
                <label htmlFor="invoice-date" className="block text-sm font-medium mb-1">{t('invoicingpage.date', { defaultValue: 'Date' })}</label>
                <DatePicker
                  value={invoiceDate}
                  onChange={setInvoiceDate}
                  placeholder={t('invoicingpage.slectionnez_une_date', { defaultValue: 'Sélectionnez une date' })}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="client-select" className="block text-sm font-medium mb-1">{t('invoicingpage.client', { defaultValue: 'Client' })}</label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger id="client-select">
                  <SelectValue placeholder={t('invoicingpage.slectionner_un_client', { defaultValue: 'Sélectionner un client' })} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="payment-terms" className="block text-sm font-medium mb-1">{t('invoicingpage.conditions_de_paiement', { defaultValue: 'Conditions de paiement' })}</label>
                <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('invoicingpage.slectionner_conditions', { defaultValue: 'Sélectionner les conditions' })} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">{t('invoicingpage.15_jours', { defaultValue: '15 jours' })}</SelectItem>
                    <SelectItem value="30">{t('invoicingpage.30_jours', { defaultValue: '30 jours' })}</SelectItem>
                    <SelectItem value="45">{t('invoicingpage.45_jours', { defaultValue: '45 jours' })}</SelectItem>
                    <SelectItem value="60">{t('invoicingpage.60_jours', { defaultValue: '60 jours' })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="due-date" className="block text-sm font-medium mb-1">{t('invoicingpage.date_chance', { defaultValue: 'Date d\'échéance' })}</label>
                <DatePicker
                  value={dueDate}
                  onChange={setDueDate}
                  placeholder={t('invoicingpage.slectionnez_une_date', { defaultValue: 'Sélectionnez une date' })}
                />
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-lg">{t('invoicingpage.lignes_de_facture', { defaultValue: 'Lignes de facture' })}</h3>
                <Button type="button" onClick={handleAddItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> {t('invoicingpage.ajouter_ligne', { defaultValue: 'Ajouter une ligne' })}
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">{t('invoicingpage.description', { defaultValue: 'Description' })}</TableHead>
                      <TableHead className="w-[15%]">{t('invoicingpage.quantit', { defaultValue: 'Quantité' })}</TableHead>
                      <TableHead className="w-[15%]">{t('invoicingpage.prix_unitaire', { defaultValue: 'Prix unitaire' })}</TableHead>
                      <TableHead className="w-[10%]">{t('invoicingpage.tva', { defaultValue: 'TVA (%)' })}</TableHead>
                      <TableHead className="w-[15%] text-right">{t('invoicingpage.total', { defaultValue: 'Total' })}</TableHead>
                      <TableHead className="w-[5%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                            placeholder={t('invoicingpage.description_article', { defaultValue: 'Description de l\'article' })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(item.id, 'unit_price', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.tax_rate.toString()}
                            onValueChange={(value) => handleItemChange(item.id, 'tax_rate', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0%</SelectItem>
                              <SelectItem value="5.5">5.5%</SelectItem>
                              <SelectItem value="10">10%</SelectItem>
                              <SelectItem value="20">20%</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total || 0)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={invoiceItems.length === 1}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>{t('invoicingpage.sous_total', { defaultValue: 'Sous-total' })}</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('invoicingpage.tva', { defaultValue: 'TVA' })}</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>{t('invoicingpage.total', { defaultValue: 'Total' })}</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-1">{t('invoicingpage.notes', { defaultValue: 'Notes' })}</label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('invoicingpage.notes_facture', { defaultValue: 'Notes ou informations supplémentaires pour la facture' })}
                className="min-h-[100px]"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleBackToList} 
                variant="outline" 
                disabled={loading || isSubmitting}
                type="button"
              >
                {t('invoicingpage.annuler', { defaultValue: 'Annuler' })}
              </Button>
              <Button 
                onClick={handleCreateInvoice} 
                disabled={loading || isSubmitting || !selectedClientId}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                type="button"
              >
                {loading || isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('invoicingpage.crer_la_facture', { defaultValue: 'Créer la facture' })
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div>
                <CardTitle>{t('invoicingpage.liste_des_factures', { defaultValue: 'Liste des Factures' })}</CardTitle>
                <CardDescription>{t('invoicingpage.consultez_et_grez_toutes_vos_factures', { defaultValue: 'Consultez et gérez toutes vos factures.' })}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-full md:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder={t('invoicingpage.rechercher_des_factures', { defaultValue: 'Rechercher des factures...' })} className="pl-8 w-full md:w-[250px]" />
                </div>
                <Button variant="outline" size="icon"><ListFilter className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('invoicingpage.numro', { defaultValue: 'Numéro' })}</TableHead>
                      <TableHead>{t('invoicingpage.date', { defaultValue: 'Date' })}</TableHead>
                      <TableHead>{t('invoicingpage.client', { defaultValue: 'Client' })}</TableHead>
                      <TableHead>{t('invoicingpage.chance', { defaultValue: 'Échéance' })}</TableHead>
                      <TableHead>{t('invoicingpage.statut', { defaultValue: 'Statut' })}</TableHead>
                      <TableHead className="text-right">{t('invoicingpage.montant', { defaultValue: 'Montant' })}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{new Date(invoice.issue_date).toLocaleDateString()}</TableCell>
                        <TableCell>{invoice.third_parties?.name || invoice.client_name}</TableCell>
                        <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            invoice.status === 'paid' ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                            invoice.status === 'draft' ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" :
                            invoice.status === 'sent' ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          )}>
                            {invoice.status === 'paid' ? t('invoicingpage.paye', { defaultValue: 'Payée' }) :
                             invoice.status === 'draft' ? t('invoicingpage.brouillon', { defaultValue: 'Brouillon' }) :
                             invoice.status === 'sent' ? t('invoicingpage.envoye', { defaultValue: 'Envoyée' }) :
                             t('invoicingpage.en_retard', { defaultValue: 'En retard' })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(invoice.total_amount)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            {t('invoicingpage.voir', { defaultValue: 'Voir' })}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-16 w-16 text-primary/50" />
                <p className="mt-4 text-lg text-muted-foreground">{t('invoicingpage.aucune_facture_pour_le_moment', { defaultValue: 'Aucune facture pour le moment' })}</p>
                <p className="text-sm text-muted-foreground mb-4">{t('invoicingpage.commencez_par_crer_votre_premire_facture', { defaultValue: 'Commencez par créer votre première facture' })}</p>
                <Button 
                  onClick={handleNewInvoice}
                  disabled={!isValidCompanyId(currentEnterpriseId) || loadingAccess}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('invoicingpage.premire_facture', { defaultValue: 'Première facture' })}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}