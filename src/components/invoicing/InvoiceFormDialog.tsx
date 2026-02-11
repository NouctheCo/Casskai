/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { invoicingService } from '@/services/invoicingService';
import CompanySettingsService from '@/services/companySettingsService';
import { useAutoAccounting } from '@/hooks/useAutoAccounting';
import { articlesService, type ArticleWithRelations } from '@/services/articlesService';
import NewArticleModal from '@/components/inventory/NewArticleModal';
import ClientSelector from '@/components/invoicing/ClientSelector';
import type { InvoiceWithDetails } from '@/types/database/invoices.types';
import type { ThirdParty } from '@/types/third-parties.types';
import type { CompanySettings } from '@/types/company-settings.types';
import { logger } from '@/lib/logger';
import { buildVatRateOptions, getDefaultVatRate, resolveCompanyCountryCode } from '@/utils/vatRateUtils';
import { getCurrentCompanyCurrency } from '@/lib/utils';
import { Plus, Trash2, FileText, Loader2 } from 'lucide-react';
import SmartAutocomplete, { type AutocompleteOption } from '@/components/ui/SmartAutocomplete';

interface InvoiceFormData {
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  description: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
  }>;
  notes: string;
  terms: string;
}

export interface InvoiceFormDialogProps {
  open: boolean;
  onClose: () => void;
  invoice?: InvoiceWithDetails | null;
  onSuccess?: () => void;
}

const InvoiceFormDialog: React.FC<InvoiceFormDialogProps> = ({
  open,
  onClose,
  invoice = null,
  onSuccess
}) => {
  const { toast } = useToast();
  const { currentCompany } = useAuth();
  const { generateFromInvoice, isGenerating } = useAutoAccounting();

  // Data states
  const [clients, setClients] = useState<ThirdParty[]>([]);
  const [articles, setArticles] = useState<ArticleWithRelations[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // UI states
  const [loading, setLoading] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);

  const countryCode = useMemo(
    () => resolveCompanyCountryCode({ currentCompany, companySettings }),
    [currentCompany, companySettings]
  );
  const vatRateOptions = useMemo(
    () => buildVatRateOptions(countryCode, companySettings?.accounting?.defaultVatRate),
    [countryCode, companySettings?.accounting?.defaultVatRate]
  );
  const defaultTaxRate = useMemo(
    () => getDefaultVatRate(countryCode, companySettings?.accounting?.defaultVatRate),
    [countryCode, companySettings?.accounting?.defaultVatRate]
  );

  // Convert articles to autocomplete options
  const articleOptions: AutocompleteOption[] = useMemo(() => {
    const options: AutocompleteOption[] = [
      {
        value: '__manual__',
        label: '✏️ Saisie manuelle',
        description: 'Entrer manuellement les détails',
        category: 'Actions'
      }
    ];

    if (articles.length > 0) {
      options.push({
        value: '__new__',
        label: '+ Créer un nouvel article',
        description: 'Ajouter au catalogue',
        category: 'Actions'
      });

      articles.forEach(article => {
        options.push({
          value: article.id,
          label: `${article.reference} - ${article.name}`,
          description: `Prix: ${article.selling_price?.toFixed(2) || '0.00'} ${getCurrentCompanyCurrency()}`,
          category: article.category || 'Articles',
          metadata: article
        });
      });
    }

    return options;
  }, [articles]);

  // Convert VAT rates to autocomplete options
  const vatRateAutocompleteOptions: AutocompleteOption[] = useMemo(() => {
    return Array.from(new Set(vatRateOptions))
      .sort((a, b) => a - b)
      .map(rate => ({
        value: rate.toString(),
        label: `${rate}%`,
        description: rate === defaultTaxRate ? 'Taux par défaut' : undefined,
        category: rate === 0 ? 'Exonéré' : rate < 10 ? 'Taux réduit' : 'Taux normal'
      }));
  }, [vatRateOptions, defaultTaxRate]);

  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: '',
    invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: defaultTaxRate, total: 0 }],
    notes: '',
    terms: ''
  });

  // Load data when dialog opens
  useEffect(() => {
    if (open && currentCompany?.id) {
      loadData();
    }
  }, [open, currentCompany?.id]);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const [clientsData, settingsData, articlesData] = await Promise.all([
        supabase.from('customers').select('*').eq('company_id', currentCompany!.id).order('name'),
        loadCompanySettings(),
        articlesService.getArticles(currentCompany!.id, { is_active: true })
      ]);

      setClients((clientsData.data || []) as ThirdParty[]);
      setCompanySettings(settingsData);
      setArticles(articlesData || []);
    } catch (error) {
      logger.warn('InvoiceFormDialog', 'Error loading data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const loadCompanySettings = async (): Promise<CompanySettings | null> => {
    try {
      if (!currentCompany?.id) return null;
      return await CompanySettingsService.getCompanySettings(currentCompany.id);
    } catch (error) {
      logger.warn('InvoiceFormDialog', 'Could not load company settings:', error);
      return {
        generalInfo: {
          name: '',
          commercialName: null,
          legalForm: null,
          siret: null,
          vatNumber: null,
          shareCapital: null
        },
        contact: {
          address: {
            street: null,
            postalCode: null,
            city: null,
            country: null
          },
          correspondenceAddress: null,
          phone: null,
          email: null,
          website: null
        },
        accounting: {
          fiscalYear: { startMonth: 1, endMonth: 12 },
          taxRegime: 'real_simplified' as const,
          vatRegime: 'subject' as const,
          defaultVatRate: 20
        },
        business: {
          sector: null,
          employeesCount: 1,
          annualRevenue: null,
          currency: getCurrentCompanyCurrency(),
          language: 'fr',
          timezone: 'Europe/Paris'
        },
        branding: {
          logoUrl: null,
          primaryColor: '#3B82F6',
          secondaryColor: '#6B7280',
          emailSignature: null,
          legalMentions: null,
          defaultTermsConditions: 'Conditions de paiement : 30 jours net.'
        },
        documents: {
          templates: { invoice: 'default' as const, quote: 'default' as const },
          headers: null,
          footers: null,
          numbering: {
            invoicePrefix: 'FAC',
            quotePrefix: 'DEV',
            format: 'YYYY-{number}',
            counters: { invoice: 1, quote: 1 }
          }
        },
        ceo: null,
        metadata: {
          settingsCompletedAt: null,
          onboardingCompletedAt: null
        }
      };
    }
  };

  // Initialize form when dialog opens
  useEffect(() => {
    if (open && !invoice) {
      generateInvoiceNumber();
      const defaultTerms = companySettings?.branding?.defaultTermsConditions || '';
      setFormData({
        clientId: '',
        invoiceNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        description: '',
        items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: defaultTaxRate, total: 0 }],
        notes: '',
        terms: defaultTerms
      });
    } else if (open && invoice) {
      setFormData({
        clientId: (invoice.customer_id as string) || '',
        invoiceNumber: invoice.invoice_number as string,
        issueDate: invoice.invoice_date as string,
        dueDate: (invoice.due_date as string) || '',
        description: (invoice.notes as string) || '',
        items: invoice.invoice_lines?.map(line => ({
          description: line.description as string,
          quantity: line.quantity as number,
          unitPrice: line.unit_price as number,
          taxRate: (line.tax_rate as number) || defaultTaxRate,
          total: (line.line_total_ht as number) || 0
        })) || [{ description: '', quantity: 1, unitPrice: 0, taxRate: defaultTaxRate, total: 0 }],
        notes: (invoice.notes as string) || '',
        terms: ''
      });
    }
  }, [open, invoice, companySettings, defaultTaxRate]);

  const generateInvoiceNumber = async () => {
    try {
      const number = await invoicingService.generateInvoiceNumber();
      setFormData(prev => ({ ...prev, invoiceNumber: number }));
    } catch (error) {
      logger.error('InvoiceFormDialog', 'Error generating invoice number:', error);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, taxRate: defaultTaxRate, total: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
        const quantity = newItems[index].quantity;
        const unitPrice = newItems[index].unitPrice;
        const taxRate = newItems[index].taxRate;
        const totalHT = quantity * unitPrice;
        const totalTTC = totalHT * (1 + taxRate / 100);
        newItems[index].total = totalTTC;
      }
      return { ...prev, items: newItems };
    });
  };

  const handleSelectArticle = (index: number, articleId: string) => {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        description: article.name,
        unitPrice: article.selling_price,
        quantity: 1,
        taxRate: article.tva_rate || defaultTaxRate,
      };
      const totalHT = newItems[index].quantity * newItems[index].unitPrice;
      const totalTTC = totalHT * (1 + newItems[index].taxRate / 100);
      newItems[index].total = totalTTC;
      return { ...prev, items: newItems };
    });
  };

  const handleOpenArticleModal = () => {
    setShowArticleModal(true);
  };

  const handleArticleCreated = async () => {
    try {
      const articlesData = await articlesService.getArticles(currentCompany!.id, { is_active: true });
      setArticles(articlesData || []);
      toast({
        title: "Article créé",
        description: "L'article a été créé avec succès"
      });
    } catch (error) {
      logger.error('InvoiceFormDialog', 'Error reloading articles:', error);
    }
  };

  const calculateTotals = () => {
    const totalHT = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalTVA = formData.items.reduce((sum, item) => {
      const itemHT = item.quantity * item.unitPrice;
      return sum + (itemHT * item.taxRate / 100);
    }, 0);
    const totalTTC = totalHT + totalTVA;
    return { totalHT, totalTVA, totalTTC };
  };

  const handleSave = async () => {
    if (!formData.clientId || !formData.invoiceNumber) {
      toast({
        title: "Champs requis",
        description: "Le client et le numéro de facture sont obligatoires.",
        variant: "destructive"
      });
      return;
    }

    if (formData.items.some(item => !item.description || item.quantity <= 0 || item.unitPrice <= 0)) {
      toast({
        title: "Articles invalides",
        description: "Tous les articles doivent avoir une description, une quantité et un prix valides.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const computedTotals = calculateTotals();
      const invoiceData = {
        customer_id: formData.clientId,
        invoice_number: formData.invoiceNumber,
        invoice_date: formData.issueDate,
        due_date: formData.dueDate,
        currency: getCurrentCompanyCurrency(),
        notes: formData.notes
      };

      const items = formData.items.map((item, index) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_percent: 0,
        tax_rate: item.taxRate,
        line_order: index + 1
      }));

      if (invoice && invoice.id) {
        // Update existing invoice
        const invoiceId = String(invoice.id);
        await invoicingService.updateInvoice(invoiceId, invoiceData, items);

        toast({
          title: "Succès",
          description: "Facture mise à jour avec succès"
        });
      } else {
        // Create new invoice
        const createdInvoice = await invoicingService.createInvoice(invoiceData, items);

        if (createdInvoice && currentCompany?.id) {
          try {
            const client = clients.find(c => c.id === formData.clientId);
            await generateFromInvoice({
              id: createdInvoice.id as string,
              company_id: currentCompany.id,
              third_party_id: formData.clientId,
              third_party_name: client?.name || 'Client',
              invoice_number: formData.invoiceNumber,
              type: 'sale',
              invoice_date: formData.issueDate,
              subtotal_excl_tax: computedTotals.totalHT,
              total_tax_amount: computedTotals.totalTVA,
              total_incl_tax: computedTotals.totalTTC,
              lines: formData.items.map(item => ({
                account_id: undefined as string | undefined,
                description: item.description,
                subtotal_excl_tax: item.quantity * item.unitPrice,
                tax_amount: (item.quantity * item.unitPrice) * (item.taxRate / 100),
              })),
            });
          } catch (error) {
            logger.warn('InvoiceFormDialog', 'Auto-accounting generation failed:', error);
          }
        }
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      logger.error('InvoiceFormDialog', 'Error saving invoice:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la facture",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  if (dataLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Chargement...</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <span>{invoice ? 'Modifier la facture' : 'Nouvelle facture'}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* En-tête de facture */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <ClientSelector
                  value={formData.clientId}
                  onChange={(clientId) => setFormData(prev => ({ ...prev, clientId }))}
                  label="Client"
                  placeholder="Sélectionner un client"
                  required
                  onNewClient={(newClient) => {
                    logger.debug('InvoiceFormDialog', 'Nouveau client créé:', newClient);
                  }}
                />
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Numéro de facture *</Label>
                  <Input
                    id="invoiceNumber"
                    placeholder="Ex: FAC-2024-001"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    aria-required="true"
                    aria-invalid={!formData.invoiceNumber}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Date d'émission</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                    aria-label="Date d'émission de la facture"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Date d'échéance</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Articles */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Articles</CardTitle>
                  <Button onClick={addItem} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* En-têtes de colonnes */}
                <div className="grid grid-cols-12 gap-4 items-center px-4 pb-2 mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                  <div className="col-span-4">Description</div>
                  <div className="col-span-2 text-center">Quantité</div>
                  <div className="col-span-2 text-center">Prix HT</div>
                  <div className="col-span-2 text-center">TVA</div>
                  <div className="col-span-1 text-center">Total</div>
                  <div className="col-span-1"></div>
                </div>

                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-center p-4 border rounded-lg">
                      <div className="col-span-4">
                        <div className="space-y-2">
                          <SmartAutocomplete
                            value={item.description && articles.some(a => a.id === item.description) ? item.description : '__manual__'}
                            onChange={(value) => {
                              if (value === '__new__') {
                                handleOpenArticleModal();
                              } else if (value === '__manual__') {
                                // Keep manual input
                              } else {
                                handleSelectArticle(index, value);
                              }
                            }}
                            options={articleOptions}
                            placeholder="Sélectionner un article"
                            searchPlaceholder="Rechercher un article..."
                            emptyMessage={articles.length === 0 ? 'Aucun article en stock' : 'Aucun résultat'}
                            groups={true}
                            showRecent={true}
                            maxRecent={5}
                          />
                          <Input
                            placeholder="Description du produit/service"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qté"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                          aria-label={`Quantité pour l'article ${index + 1}`}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Prix HT"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          aria-label={`Prix unitaire HT pour l'article ${index + 1}`}
                        />
                      </div>
                      <div className="col-span-2">
                        <SmartAutocomplete
                          value={item.taxRate.toString()}
                          onChange={(value) => updateItem(index, 'taxRate', parseFloat(value))}
                          options={vatRateAutocompleteOptions}
                          placeholder="TVA"
                          searchPlaceholder="Rechercher un taux..."
                          groups={true}
                          showRecent={false}
                        />
                        <Input
                          type="number"
                          placeholder="Taux manuel (%)"
                          min="0"
                          step="0.01"
                          value={item.taxRate}
                          onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                          className="mt-2"
                        />
                      </div>
                      <div className="col-span-1">
                        <div className="text-sm font-medium">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: getCurrentCompanyCurrency() }).format(item.total)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Button
                          onClick={() => removeItem(index)}
                          variant="ghost"
                          size="sm"
                          disabled={formData.items.length === 1}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totaux */}
                <div className="border-t pt-4 mt-6">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total HT:</span>
                        <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: getCurrentCompanyCurrency() }).format(totals.totalHT)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>TVA:</span>
                        <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: getCurrentCompanyCurrency() }).format(totals.totalTVA)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total TTC:</span>
                        <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: getCurrentCompanyCurrency() }).format(totals.totalTTC)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes et conditions */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Notes internes..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms">Conditions</Label>
                <Textarea
                  id="terms"
                  placeholder="Conditions de paiement..."
                  value={formData.terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                  rows={4}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading || isGenerating}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={loading || isGenerating}>
              {(loading || isGenerating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {invoice ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de création d'article */}
      <NewArticleModal
        isOpen={showArticleModal}
        onClose={() => setShowArticleModal(false)}
        onSuccess={handleArticleCreated}
      />
    </>
  );
};

export default InvoiceFormDialog;
