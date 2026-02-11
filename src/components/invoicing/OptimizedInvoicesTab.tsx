import React, { useState, useEffect, useMemo } from 'react';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { buildVatRateOptions, getDefaultVatRate, resolveCompanyCountryCode } from '@/utils/vatRateUtils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { invoicingService } from '@/services/invoicingService';
import CompanySettingsService from '@/services/companySettingsService';
import { useAutoAccounting } from '@/hooks/useAutoAccounting';
import { useInvoiceEmail } from '@/hooks/useInvoiceEmail';
import { InvoicePdfService } from '@/services/invoicePdfService';
import { articlesService, type ArticleWithRelations } from '@/services/articlesService';
import NewArticleModal from '@/components/inventory/NewArticleModal';
import ClientSelector from '@/components/invoicing/ClientSelector';
import type { InvoiceWithDetails } from '@/types/database/invoices.types';
import type { ThirdParty } from '@/types/third-parties.types';
import type { CompanySettings } from '@/types/company-settings.types';
import { logger } from '@/lib/logger';
import { getCurrentCompanyCurrency } from '@/lib/utils';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  Eye,
  FileText,
  Clock,
  Calendar,
  Loader2,
  RefreshCw,
  Copy,
  MoreHorizontal,
  Mail,
  FileX,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
// Types locaux
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
interface OptimizedInvoicesTabProps {
  shouldCreateNew?: boolean;
  onCreateNewCompleted?: () => void;
}
// Composant principal
const OptimizedInvoicesTab: React.FC<OptimizedInvoicesTabProps> = ({ shouldCreateNew, onCreateNewCompleted }) => {
  const { toast } = useToast();
  const { currentCompany } = useAuth();
  const { sendInvoiceByEmail, isSending } = useInvoiceEmail();
  const { ConfirmDialog: ConfirmDialogComponent, confirm: confirmDialog } = useConfirmDialog();
  // États
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [clients, setClients] = useState<ThirdParty[]>([]);
  const [articles, setArticles] = useState<ArticleWithRelations[]>([]);
  const [, setSuppliers] = useState<Array<{id: string; name: string}>>([]);
  const [, setWarehouses] = useState<Array<{id: string; name: string}>>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  // Chargement initial des données
  useEffect(() => {
    loadData();
  }, []);
  // Handle shouldCreateNew prop
  useEffect(() => {
    if (shouldCreateNew) {
      setShowForm(true);
      setEditingInvoice(null);
    }
  }, [shouldCreateNew]);
  const loadCompanySettings = async (): Promise<CompanySettings | null> => {
    try {
      if (!currentCompany?.id) {
        logger.warn('OptimizedInvoicesTab', 'No current company available');
        return null;
      }
      const settings = await CompanySettingsService.getCompanySettings(currentCompany.id);
      return settings;
    } catch (error) {
      logger.warn('OptimizedInvoicesTab', 'Could not load company settings:', error);
      // Return default settings if failed
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
          defaultTermsConditions: 'Conditions de paiement : 30 jours net. Paiement par virement ou chèque. Retard de paiement : 3% par mois.'
        },
        documents: {
          templates: {
            invoice: 'default' as const,
            quote: 'default' as const
          },
          headers: null,
          footers: null,
          numbering: {
            invoicePrefix: 'FAC',
            quotePrefix: 'DEV',
            format: 'YYYY-{number}',
            counters: {
              invoice: 1,
              quote: 1
            }
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
  const loadData = async () => {
    setLoading(true);
    try {
      logger.info('OptimizedInvoicesTab', '🔄 Loading data for company:', currentCompany?.id);

      const [invoicesData, clientsData, settingsData, articlesData, suppliersData, warehousesData] = await Promise.all([
        invoicingService.getInvoices(),
        supabase.from('customers').select('*').eq('company_id', currentCompany!.id).order('name'),
        loadCompanySettings(),
        articlesService.getArticles(currentCompany!.id, { is_active: true }),
        supabase.from('suppliers').select('*').eq('company_id', currentCompany!.id).order('name'),
        supabase.from('warehouses').select('id, name').eq('company_id', currentCompany!.id)
      ]);

      logger.info('OptimizedInvoicesTab', '✅ Articles loaded:', articlesData.length);

      setInvoices(invoicesData as unknown as InvoiceWithDetails[]);
      setClients((clientsData.data || []) as ThirdParty[]);
      setCompanySettings(settingsData);
      setArticles(articlesData || []);
      setSuppliers((suppliersData.data || []).map((s: any) => ({ id: s.id, name: s.name || s.company_name || 'Sans nom' })));
      setWarehouses(warehousesData.data || []);
    } catch (error) {
      // Logger l'erreur en console mais ne pas alerter l'utilisateur
      // Une base vide n'est pas une erreur, c'est un état normal pour un nouveau compte
      logger.warn('OptimizedInvoicesTab', 'No data loaded (this is normal for empty database):', error instanceof Error ? error.message : String(error));
      // Initialiser avec des tableaux vides
      setInvoices([]);
      setClients([]);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };
  // Filtrage des factures
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchTerm ||
      (invoice.invoice_number as string).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.client as { name?: string })?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  // Actions
  const handleNewInvoice = () => {
    setEditingInvoice(null);
    setShowForm(true);
    if (onCreateNewCompleted) {
      onCreateNewCompleted();
    }
  };
  const handleEditInvoice = (invoice: InvoiceWithDetails) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };
  const handleDeleteInvoice = async (invoiceId: string) => {
    const confirmed = await confirmDialog({
      title: 'Confirmer la suppression',
      description: 'Êtes-vous sûr de vouloir supprimer cette facture ?',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'destructive'
    });
    if (confirmed) {
      try {
        await invoicingService.deleteInvoice(invoiceId);
        await loadData(); // Recharger les données
        toast({
          title: "Succès",
          description: "Facture supprimée avec succès"
        });
      } catch (_error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la facture",
          variant: "destructive"
        });
      }
    }
  };
  const handleViewInvoice = async (invoice: InvoiceWithDetails) => {
    logger.debug('OptimizedInvoicesTab', '=== START handleViewInvoice ===');
    logger.debug('OptimizedInvoicesTab', '1. Invoice:', invoice);

    try {
      // Récupérer la facture complète avec les items et le client
      const { data: fullInvoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:customers!customer_id(*),
          invoice_items(*)
        `)
        .eq('id', invoice.id)
        .single();

      logger.debug('OptimizedInvoicesTab', '2. Full invoice:', fullInvoice);
      logger.debug('OptimizedInvoicesTab', '3. Error:', error);

      if (error) {
        logger.error('OptimizedInvoicesTab', 'Error fetching full invoice:', error);
        throw new Error(`Erreur lors de la récupération de la facture: ${error.message}`);
      }

      if (!fullInvoice) {
        throw new Error('Facture introuvable');
      }

      logger.debug('OptimizedInvoicesTab', '3b. Invoice items count:', fullInvoice.invoice_items?.length || 0);
      logger.debug('OptimizedInvoicesTab', '3c. Client:', fullInvoice.client);

      // Récupérer les données de l'entreprise depuis la DB
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', fullInvoice.company_id)
        .single();

      logger.debug('OptimizedInvoicesTab', '4. Company:', company);
      logger.debug('OptimizedInvoicesTab', '4b. Company error:', companyError);

      // Préparer les données de l'entreprise
      const companyData = {
        name: company?.name || companySettings?.generalInfo?.name || 'Votre Entreprise',
        address: company?.address || companySettings?.contact?.address?.street || '',
        city: company?.city || companySettings?.contact?.address?.city || '',
        postalCode: company?.postal_code || companySettings?.contact?.address?.postalCode || '',
        phone: company?.phone || companySettings?.contact?.phone || '',
        email: company?.email || companySettings?.contact?.email || '',
        website: company?.website || companySettings?.contact?.website || '',
        siret: company?.siret || companySettings?.generalInfo?.siret || '',
        vatNumber: company?.vat_number || companySettings?.generalInfo?.vatNumber || '',
        logo: company?.logo_url || companySettings?.branding?.logoUrl || '',
        legalMentions: companySettings?.branding?.legalMentions || '',
        defaultTerms: companySettings?.branding?.defaultTermsConditions || '',
        shareCapital: company?.share_capital || companySettings?.generalInfo?.shareCapital || '',
        mainBankName: companySettings?.accounting?.mainBank?.name || '',
        mainBankIban: companySettings?.accounting?.mainBank?.iban || '',
        mainBankBic: companySettings?.accounting?.mainBank?.bic || '',
        currency: company?.currency || companySettings?.business?.currency || getCurrentCompanyCurrency()
      };

      logger.debug('OptimizedInvoicesTab', '5. Company data prepared:', companyData);

      // Générer le PDF
      logger.debug('OptimizedInvoicesTab', '6. Generating PDF...');
      const pdfDoc = InvoicePdfService.generateInvoicePDF(fullInvoice as InvoiceWithDetails, companyData);
      logger.debug('OptimizedInvoicesTab', '7. PDF generated:', pdfDoc);

      // Convertir en Blob et créer une URL
      const pdfBlob = pdfDoc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      logger.debug('OptimizedInvoicesTab', '8. PDF URL created:', pdfUrl);

      // Ouvrir dans un nouvel onglet
      const newWindow = window.open(pdfUrl, '_blank');
      logger.debug('OptimizedInvoicesTab', '9. Window opened:', newWindow ? 'Success' : 'Blocked');

      if (!newWindow) {
        // Fallback si le popup est bloqué
        logger.debug('OptimizedInvoicesTab', '10. Using fallback download');
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `Facture-${fullInvoice.invoice_number}.pdf`;
        link.click();
      }

      toast({
        title: "Aperçu ouvert",
        description: `Aperçu de la facture ${fullInvoice.invoice_number} dans un nouvel onglet`
      });

      logger.debug('OptimizedInvoicesTab', '=== END handleViewInvoice ===');
    } catch (err) {
      logger.error('OptimizedInvoicesTab', 'handleViewInvoice ERROR:', err);
      logger.error('OptimizedInvoicesTab', 'Error viewing PDF:', err instanceof Error ? err.message : String(err));
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible d'afficher l'aperçu",
        variant: "destructive"
      });
    }
  };
  const handleDownloadInvoice = async (invoice: InvoiceWithDetails) => {
    try {
      logger.info('OptimizedInvoicesTab', 'Downloading invoice PDF for:', invoice.id);

      // Récupérer la facture complète avec les items et le client
      const { data: fullInvoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:customers!customer_id(*),
          invoice_items(*)
        `)
        .eq('id', invoice.id)
        .single();

      if (error) {
        logger.error('OptimizedInvoicesTab', 'Error fetching full invoice:', error);
        throw new Error(`Erreur lors de la récupération de la facture: ${error.message}`);
      }

      if (!fullInvoice) {
        throw new Error('Facture introuvable');
      }

      logger.info('OptimizedInvoicesTab', 'Full invoice loaded for download:', {
        id: fullInvoice.id,
        invoice_number: fullInvoice.invoice_number,
        items_count: fullInvoice.invoice_items?.length || 0
      });

      // Préparer les données de l'entreprise
      const companyData = {
        name: companySettings?.generalInfo?.name || 'Votre Entreprise',
        address: companySettings?.contact?.address?.street || '',
        city: companySettings?.contact?.address?.city || '',
        postalCode: companySettings?.contact?.address?.postalCode || '',
        phone: companySettings?.contact?.phone || '',
        email: companySettings?.contact?.email || '',
        website: companySettings?.contact?.website || '',
        siret: companySettings?.generalInfo?.siret || '',
        vatNumber: companySettings?.generalInfo?.vatNumber || '',
        logo: companySettings?.branding?.logoUrl || '',
        legalMentions: companySettings?.branding?.legalMentions || '',
        defaultTerms: companySettings?.branding?.defaultTermsConditions || '',
        shareCapital: companySettings?.generalInfo?.shareCapital || '',
        mainBankName: companySettings?.accounting?.mainBank?.name || '',
        mainBankIban: companySettings?.accounting?.mainBank?.iban || '',
        mainBankBic: companySettings?.accounting?.mainBank?.bic || '',
        currency: companySettings?.business?.currency || getCurrentCompanyCurrency()
      };

      // Générer et télécharger le PDF
      InvoicePdfService.downloadInvoicePDF(fullInvoice as InvoiceWithDetails, companyData);
      toast({
        title: "PDF généré",
        description: `Facture ${fullInvoice.invoice_number} téléchargée avec succès`
      });
    } catch (error) {
      logger.error('OptimizedInvoicesTab', 'Error generating PDF:', error instanceof Error ? error.message : String(error));
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de générer le PDF",
        variant: "destructive"
      });
    }
  };
  const handleSendEmail = async (invoice: InvoiceWithDetails) => {
    const email = invoice.client?.email;
    if (!email) {
      toast({
        title: "Email manquant",
        description: "Ce client n'a pas d'adresse email configurée",
        variant: "destructive"
      });
      return;
    }
    const confirmed = await confirmDialog({
      title: 'Envoyer la facture',
      description: `Envoyer la facture ${invoice.invoice_number} à ${email} ?`,
      confirmText: 'Envoyer',
      cancelText: 'Annuler',
      variant: 'default'
    });
    if (confirmed) {
      await sendInvoiceByEmail(invoice.id as string);
      // Recharger les données pour mettre à jour le statut si nécessaire
      await loadData();
    }
  };
  const handleBulkExport = async () => {
    if (filteredInvoices.length === 0) return;
    try {
      // Préparer les données de l'entreprise
      const companyData = {
        name: companySettings?.generalInfo?.name || 'Votre Entreprise',
        address: companySettings?.contact?.address?.street || '',
        city: companySettings?.contact?.address?.city || '',
        postalCode: companySettings?.contact?.address?.postalCode || '',
        phone: companySettings?.contact?.phone || '',
        email: companySettings?.contact?.email || '',
        website: companySettings?.contact?.website || '',
        siret: companySettings?.generalInfo?.siret || '',
        vatNumber: companySettings?.generalInfo?.vatNumber || '',
        logo: companySettings?.branding?.logoUrl || '',
        legalMentions: companySettings?.branding?.legalMentions || '',
        defaultTerms: companySettings?.branding?.defaultTermsConditions || '',
        shareCapital: companySettings?.generalInfo?.shareCapital || '',
        mainBankName: companySettings?.accounting?.mainBank?.name || '',
        mainBankIban: companySettings?.accounting?.mainBank?.iban || '',
        mainBankBic: companySettings?.accounting?.mainBank?.bic || '',
        currency: companySettings?.business?.currency || getCurrentCompanyCurrency()
      };
      // Générer un PDF pour chaque facture filtrée
      filteredInvoices.forEach((invoice, index) => {
        setTimeout(() => {
          InvoicePdfService.downloadInvoicePDF(invoice, companyData);
        }, index * 500); // Délai de 500ms entre chaque téléchargement pour éviter les problèmes de navigateur
      });
      toast({
        title: "Export en cours",
        description: `${filteredInvoices.length} facture(s) en cours d'exportation...`
      });
    } catch (error) {
      logger.error('OptimizedInvoicesTab', 'Error during bulk export:', error instanceof Error ? error.message : String(error));
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les factures",
        variant: "destructive"
      });
    }
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: getCurrentCompanyCurrency()
    }).format(amount);
  };
  const handleDuplicateInvoice = async (invoice: InvoiceWithDetails) => {
    try {
      const duplicatedInvoice = await invoicingService.duplicateInvoice(invoice.id as string);
      await loadData(); // Refresh data
      toast({
        title: "Facture dupliquée",
        description: `Nouvelle facture créée: ${duplicatedInvoice.invoice_number}`
      });
    } catch (error) {
      logger.error('OptimizedInvoicesTab', 'Error duplicating invoice:', error instanceof Error ? error.message : String(error));
      toast({
        title: "Erreur",
        description: "Impossible de dupliquer la facture.",
        variant: "destructive"
      });
    }
  };
  const handleCancelInvoice = async (invoice: InvoiceWithDetails) => {
    // Vérifications préalables
    if (invoice.type === 'credit_note' || invoice.invoice_type === 'credit_note') {
      toast({
        title: "Impossible",
        description: "Impossible d'annuler un avoir",
        variant: "destructive"
      });
      return;
    }

    if (invoice.status === 'cancelled') {
      toast({
        title: "Déjà annulée",
        description: "Cette facture est déjà annulée",
        variant: "destructive"
      });
      return;
    }

    const confirmed = await confirmDialog({
      title: 'Annuler la facture',
      description: `Voulez-vous créer un avoir pour annuler la facture ${invoice.invoice_number} ?`,
      confirmText: 'Créer un avoir',
      cancelText: 'Annuler',
      variant: 'destructive'
    });
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      const creditNote = await invoicingService.createCreditNote(invoice.id as string);
      toast({
        title: "Avoir créé",
        description: `Avoir ${creditNote.invoice_number} créé avec succès`
      });
      await loadData(); // Refresh data
    } catch (error) {
      logger.error('OptimizedInvoicesTab', 'Error creating credit note:', error instanceof Error ? error.message : String(error));
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer l'avoir",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 flex items-center space-x-1 w-fit">
            <CheckCircle className="w-3 h-3" />
            <span>Payée</span>
          </Badge>
        );
      case 'sent':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 flex items-center space-x-1 w-fit">
            <FileText className="w-3 h-3" />
            <span>Envoyée</span>
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="secondary" className="flex items-center space-x-1 w-fit">
            <FileText className="w-3 h-3" />
            <span>Brouillon</span>
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 flex items-center space-x-1 w-fit">
            <AlertCircle className="w-3 h-3" />
            <span>En retard</span>
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 flex items-center space-x-1 w-fit">
            <FileText className="w-3 h-3" />
            <span>Annulée</span>
          </Badge>
        );
      default:
        return <Badge variant="outline" className="w-fit">Inconnue</Badge>;
    }
  };
  // Gestion de la création d'articles depuis le formulaire de facture
  const handleOpenArticleModal = (_index: number) => {
    setShowArticleModal(true);
  };
  const handleArticleCreated = async (_articleId: string) => {
    // Recharger les articles
    try {
      const articlesData = await articlesService.getArticles(currentCompany!.id, { is_active: true });
      setArticles(articlesData || []);
      logger.info('OptimizedInvoicesTab', '✅ Articles reloaded after creation:', articlesData.length);
      toast({
        title: "Article créé",
        description: "L'article a été créé avec succès et est maintenant disponible dans la liste"
      });
    } catch (error) {
      logger.error('OptimizedInvoicesTab', 'Error reloading articles:', error);
    }
    // Note: La sélection automatique est gérée par InvoiceFormDialog
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement des factures...</span>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Factures</h2>
          <p className="text-sm text-gray-500 dark:text-gray-300">Gérez vos factures clients</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleBulkExport}
                  variant="outline"
                  size="sm"
                  disabled={filteredInvoices.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter PDF
                </Button>
              </TooltipTrigger>
              {filteredInvoices.length === 0 && (
                <TooltipContent>
                  <p>Créez d'abord une facture pour exporter en PDF</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <Button onClick={handleNewInvoice} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle facture
          </Button>
        </div>
      </div>
      {/* Filtres et recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <Input
                placeholder="Rechercher par numéro ou client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillons</SelectItem>
                <SelectItem value="sent">Envoyées</SelectItem>
                <SelectItem value="paid">Payées</SelectItem>
                <SelectItem value="overdue">En retard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      {/* Tableau des factures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Liste des factures</span>
            <span className="text-sm font-normal text-gray-500 dark:text-gray-300">
              {filteredInvoices.length} facture(s)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredInvoices.length > 0 ? (
            <div className="overflow-y-auto max-h-[60vh] rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white dark:bg-slate-950">
                  <TableRow>
                    <TableHead className="bg-slate-50 dark:bg-slate-900">Numéro</TableHead>
                    <TableHead className="bg-slate-50 dark:bg-slate-900">Client</TableHead>
                    <TableHead className="bg-slate-50 dark:bg-slate-900">Date</TableHead>
                    <TableHead className="bg-slate-50 dark:bg-slate-900">Échéance</TableHead>
                    <TableHead className="bg-slate-50 dark:bg-slate-900">Montant</TableHead>
                    <TableHead className="bg-slate-50 dark:bg-slate-900">Statut</TableHead>
                    <TableHead className="bg-slate-50 dark:bg-slate-900 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id as string} className="hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-900/30">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <span>{String(invoice.invoice_number ?? '')}</span>
                          {(invoice.type === 'credit_note' || invoice.invoice_type === 'credit_note') && (
                            <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400">
                              Avoir
                            </Badge>
                          )}
                          {invoice.status === 'cancelled' && (
                            <Badge variant="secondary" className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                              Annulée
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{(invoice.client as { name?: string })?.name || 'Client supprimé'}</p>
                          {(invoice.client as { email?: string })?.email && (
                            <p className="text-xs text-gray-500 dark:text-gray-300">{(invoice.client as { email?: string })?.email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span>
                            {invoice.invoice_date
                              ? new Date(String(invoice.invoice_date)).toLocaleDateString('fr-FR')
                              : '-'
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {invoice.due_date ? (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span>{new Date(invoice.due_date as any).toLocaleDateString('fr-FR')}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{formatCurrency(invoice.total_incl_tax as number)}</p>
                          {(invoice.paid_amount as number) > 0 && (
                            <p className="text-xs text-green-600">
                              Payé: {formatCurrency(invoice.paid_amount as number)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status as string)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                            title="Aperçu PDF"
                          >
                            <Eye className="w-4 h-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoice(invoice)}
                            title="Télécharger en PDF"
                          >
                            <Download className="w-4 h-4 text-blue-500" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendEmail(invoice)} disabled={isSending}>
                                <Mail className="w-4 h-4 mr-2" />
                                Envoyer par email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateInvoice(invoice)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Dupliquer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {(invoice.type !== 'credit_note' && invoice.invoice_type !== 'credit_note' && invoice.status !== 'cancelled') && (
                                <DropdownMenuItem onClick={() => handleCancelInvoice(invoice)} className="text-orange-600 focus:text-orange-600 dark:text-orange-400">
                                  <FileX className="w-4 h-4 mr-2" />
                                  Annuler (créer un avoir)
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDeleteInvoice(invoice.id as string)}
                                className="text-red-600 focus:text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucune facture trouvée
              </h3>
              <p className="text-gray-500 dark:text-gray-300 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucune facture ne correspond à vos critères'
                  : 'Commencez par créer votre première facture'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={handleNewInvoice} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer ma première facture
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Dialog de création/modification */}
      <InvoiceFormDialog
        open={showForm}
        onClose={() => {
          setShowForm(false);
          if (onCreateNewCompleted) {
            onCreateNewCompleted();
          }
        }}
        invoice={editingInvoice}
        clients={clients}
        companySettings={companySettings}
        onSuccess={loadData}
        articles={articles}
        handleOpenArticleModal={handleOpenArticleModal}
      />
      {/* Modal de création d'article */}
      <NewArticleModal
        isOpen={showArticleModal}
        onClose={() => {
          setShowArticleModal(false);
        }}
        onSuccess={handleArticleCreated}
      />
      <ConfirmDialogComponent />
    </div>
  );
};
// Composant du formulaire de facture
interface InvoiceFormDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: InvoiceWithDetails | null;
  clients: ThirdParty[];
  companySettings: CompanySettings | null;
  onSuccess: () => void;
  articles: ArticleWithRelations[];
  handleOpenArticleModal: (index: number) => void;
}
const InvoiceFormDialog: React.FC<InvoiceFormDialogProps> = ({
  open,
  onClose,
  invoice,
  clients,
  companySettings,
  onSuccess,
  articles,
  handleOpenArticleModal
}) => {
  const { toast } = useToast();
  const { currentCompany } = useAuth();
  const { generateFromInvoice, isGenerating } = useAutoAccounting();
  const [loading, setLoading] = useState(false);
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
  // Initialiser le formulaire
  useEffect(() => {
    if (open && !invoice) {
      // Nouvelle facture - générer le numéro
      generateInvoiceNumber();
      // Reset form with company default terms
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
      // Modification - pré-remplir
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
  }, [open, invoice, defaultTaxRate, companySettings]);
  const generateInvoiceNumber = async () => {
    try {
      const number = await invoicingService.generateInvoiceNumber();
      setFormData(prev => ({ ...prev, invoiceNumber: number }));
    } catch (error) {
      logger.error('OptimizedInvoicesTab', 'Error generating invoice number:', error instanceof Error ? error.message : String(error));
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
      // Recalculer le total de la ligne
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

    logger.info('OptimizedInvoicesTab', '🎯 Article selected:', {
      id: article.id,
      name: article.name,
      selling_price: article.selling_price,
      tva_rate: article.tva_rate
    });

    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        description: article.name,
        unitPrice: article.selling_price,
        quantity: 1,
        taxRate: article.tva_rate || defaultTaxRate, // TVA depuis l'article ou taux par défaut du pays
      };
      // Recalculer le total
      const totalHT = newItems[index].quantity * newItems[index].unitPrice;
      const totalTTC = totalHT * (1 + newItems[index].taxRate / 100);
      newItems[index].total = totalTTC;
      return { ...prev, items: newItems };
    });
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
        // Création
        const createdInvoice = await invoicingService.createInvoice(invoiceData, items);
        // ✅ NOUVEAU : Générer automatiquement l'écriture comptable
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
                account_id: undefined as string | undefined, // Sera mappé automatiquement selon le type
                description: item.description,
                subtotal_excl_tax: item.quantity * item.unitPrice,
                tax_amount: (item.quantity * item.unitPrice) * (item.taxRate / 100),
              })),
            });
          } catch (error) {
            logger.warn('OptimizedInvoicesTab', 'Auto-accounting generation failed, but invoice was created:', error);
          }
        }
        toast({
          title: "Succès",
          description: "Facture créée avec succès"
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      logger.error('OptimizedInvoicesTab', 'Error saving invoice:', error instanceof Error ? error.message : String(error));
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
  return (
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
                  // Le nouveau client sera automatiquement disponible après rechargement
                  logger.debug('OptimizedInvoicesTab', 'Nouveau client créé:', newClient);
                }}
              />
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Numéro de facture *</Label>
                <Input
                  id="invoiceNumber"
                  placeholder="Ex: FAC-2024-001"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
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
                        <Select value={item.description && articles.some(a => a.id === item.description) ? item.description : '__manual__'} onValueChange={(value) => {
                          if (value === '__new__') {
                            handleOpenArticleModal(index);
                          } else if (value === '__manual__') {
                            // Ne rien faire, laisser l'utilisateur saisir dans l'input
                          } else {
                            handleSelectArticle(index, value);
                          }
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un article" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__manual__">✏️ Saisie manuelle</SelectItem>
                            {articles.length > 0 && <SelectItem value="__new__">➕ Créer un nouvel article</SelectItem>}
                            {articles.length > 0 && <div className="border-t my-1"></div>}
                            {articles.map((article) => (
                              <SelectItem key={article.id} value={article.id}>
                                {article.reference} - {article.name} (<CurrencyAmount amount={article.selling_price} />)
                              </SelectItem>
                            ))}
                            {articles.length === 0 && (
                              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                                Aucun article en stock. Créez-en un depuis l'Inventaire.
                              </div>
                            )}
                          </SelectContent>
                        </Select>
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
                      />
                    </div>
                    <div className="col-span-2">
                      <Select 
                        value={item.taxRate.toString()} 
                        onValueChange={(value) => updateItem(index, 'taxRate', parseFloat(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(new Set([...vatRateOptions, item.taxRate]))
                            .sort((a, b) => a - b)
                            .map((rate) => (
                              <SelectItem key={rate} value={rate.toString()}>
                                {rate}%
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
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
  );
};
export default OptimizedInvoicesTab;

