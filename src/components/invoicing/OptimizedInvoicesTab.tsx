import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { invoicingService } from '@/services/invoicingService';
import { thirdPartiesService } from '@/services/thirdPartiesService';
import CompanySettingsService from '@/services/companySettingsService';
import { InvoicePdfService } from '@/services/invoicePdfService';
import { EntitySelector, type EntityOption } from '@/components/common/EntitySelector';
import { inventoryItemsService, type InventoryItem } from '@/services/inventoryItemsService';
import type { InvoiceWithDetails } from '@/types/database/invoices.types';
import type { ThirdParty } from '@/types/third-parties.types';
import type { CompanySettings } from '@/types/company-settings.types';
import { 
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  Send,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Euro,
  Calendar,
  User,
  Mail,
  Phone,
  Loader2,
  RefreshCw,
  Copy,
  Receipt,
  MoreHorizontal
} from 'lucide-react';
import { logger } from '@/utils/logger';

// Types locaux
interface InvoiceFormData {
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  description: string;
  items: Array<{
    inventoryItemId?: string;
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
  
  // États
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [clients, setClients] = useState<ThirdParty[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
        logger.warn('No current company available');
        return null;
      }

      const settings = await CompanySettingsService.getCompanySettings(currentCompany.id);
      return settings;
    } catch (error) {
      logger.warn('Could not load company settings:', error);
      // Return default settings if failed
      return {
        generalInfo: { name: '' },
        contact: { address: {}, email: '' },
        accounting: {
          fiscalYear: { startMonth: 1, endMonth: 12 },
          taxRegime: 'real_simplified' as const,
          vatRegime: 'subject' as const,
          defaultVatRate: 20
        },
        business: { 
          employeesCount: 1,
          currency: 'EUR',
          language: 'fr',
          timezone: 'Europe/Paris'
        },
        branding: {
          primaryColor: '#3B82F6',
          secondaryColor: '#6B7280',
          defaultTermsConditions: 'Conditions de paiement : 30 jours net. Paiement par virement ou chèque. Retard de paiement : 3% par mois.'
        },
        documents: {
          templates: {
            invoice: 'default' as const,
            quote: 'default' as const
          },
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
        metadata: {}
      };
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [invoicesData, clientsData, settingsData] = await Promise.all([
        invoicingService.getInvoices(),
        thirdPartiesService.getThirdParties('customer'),
        loadCompanySettings()
      ]);

      setInvoices(invoicesData as unknown as InvoiceWithDetails[]);
      setClients(clientsData);
      setCompanySettings(settingsData);
    } catch (error) {
      logger.error('Error loading data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Filtrage des factures
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchTerm ||
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
    if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      try {
        await invoicingService.deleteInvoice(invoiceId);
        await loadData(); // Recharger les données
        toast({
          title: "Succès",
          description: "Facture supprimée avec succès"
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la facture",
          variant: "destructive"
        });
      }
    }
  };

  const handleViewInvoice = async (invoice: InvoiceWithDetails) => {
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
        vatNumber: companySettings?.generalInfo?.vatNumber || ''
      };

      // Générer une URL de données PDF pour prévisualisation
      const pdfDataUrl = InvoicePdfService.generateInvoicePDFDataUrl(invoice, companyData);
      
      // Ouvrir dans un nouvel onglet pour prévisualisation
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Facture ${invoice.invoice_number} - Aperçu</title>
              <style>
                body { margin: 0; padding: 0; }
                iframe { width: 100%; height: 100vh; border: none; }
              </style>
            </head>
            <body>
              <iframe src="${pdfDataUrl}"></iframe>
            </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        // Fallback si le popup est bloqué
        const link = document.createElement('a');
        link.href = pdfDataUrl;
        link.target = '_blank';
        link.click();
      }
      
      toast({
        title: "Aperçu ouvert",
        description: `Aperçu de la facture ${invoice.invoice_number} dans un nouvel onglet`
      });
    } catch (error) {
      logger.error('Error viewing PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'afficher l'aperçu",
        variant: "destructive"
      });
    }
  };

  const handleDownloadInvoice = async (invoice: InvoiceWithDetails) => {
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
        vatNumber: companySettings?.generalInfo?.vatNumber || ''
      };

      // Générer et télécharger le PDF
      InvoicePdfService.downloadInvoicePDF(invoice, companyData);
      
      toast({
        title: "PDF généré",
        description: `Facture ${invoice.invoice_number} téléchargée avec succès`
      });
    } catch (error) {
      logger.error('Error generating PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive"
      });
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
        vatNumber: companySettings?.generalInfo?.vatNumber || ''
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
      logger.error('Error during bulk export:', error);
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
      currency: 'EUR'
    }).format(amount);
  };
  
  const handleDuplicateInvoice = async (invoice: InvoiceWithDetails) => {
    try {
      const duplicatedInvoice = await invoicingService.duplicateInvoice(invoice.id);
      await loadData(); // Refresh data
      toast({
        title: "Facture dupliquée",
        description: `Nouvelle facture créée: ${duplicatedInvoice.invoice_number}`
      });
    } catch (error) {
      logger.error('Error duplicating invoice:', error);
      toast({
        title: "Erreur",
        description: "Impossible de dupliquer la facture.",
        variant: "destructive"
      });
    }
  };
  
  const handleCreateCreditNote = async (invoice: InvoiceWithDetails) => {
    if (confirm(`Êtes-vous sûr de vouloir créer un avoir pour la facture ${invoice.invoice_number} ?`)) {
      try {
        const creditNote = await invoicingService.createCreditNote(invoice.id);
        await loadData(); // Refresh data
        toast({
          title: "Avoir créé",
          description: `Avoir créé: ${creditNote.invoice_number}`
        });
      } catch (error) {
        logger.error('Error creating credit note:', error);
        toast({
          title: "Erreur",
          description: "Impossible de créer l'avoir.",
          variant: "destructive"
        });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
      sent: { label: 'Envoyée', color: 'bg-blue-100 text-blue-800' },
      paid: { label: 'Payée', color: 'bg-green-100 text-green-800' },
      overdue: { label: 'En retard', color: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Annulée', color: 'bg-gray-100 text-gray-500' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge className={config.color}>{config.label}</Badge>;
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
          <p className="text-sm text-gray-500">Gérez vos factures clients</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button 
            onClick={handleBulkExport} 
            variant="outline" 
            size="sm"
            disabled={filteredInvoices.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter PDF
          </Button>
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
            <span className="text-sm font-normal text-gray-500">
              {filteredInvoices.length} facture(s)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <span>{invoice.invoice_number}</span>
                          {invoice.invoice_type === 'credit_note' && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                              Avoir
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{invoice.client?.name || 'Client supprimé'}</p>
                          {invoice.client?.email && (
                            <p className="text-xs text-gray-500">{invoice.client.email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{new Date(invoice.invoice_date).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {invoice.due_date ? (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{new Date(invoice.due_date).toLocaleDateString('fr-FR')}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{formatCurrency(invoice.total_amount)}</p>
                          {invoice.paid_amount > 0 && (
                            <p className="text-xs text-green-600">
                              Payé: {formatCurrency(invoice.paid_amount)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status)}
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
                              
                              <DropdownMenuItem onClick={() => handleDuplicateInvoice(invoice)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Dupliquer
                              </DropdownMenuItem>
                              
                              {invoice.status === 'paid' && invoice.invoice_type === 'sale' && (
                                <DropdownMenuItem onClick={() => handleCreateCreditNote(invoice)}>
                                  <Receipt className="w-4 h-4 mr-2" />
                                  Créer un avoir
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem 
                                onClick={() => handleDeleteInvoice(invoice.id)}
                                className="text-red-600 focus:text-red-600"
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
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucune facture trouvée
              </h3>
              <p className="text-gray-500 mb-6">
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
        companyId={'current-company'}
        companySettings={companySettings}
        onSuccess={loadData}
      />
    </div>
  );
};

// Composant du formulaire de facture
interface InvoiceFormDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: InvoiceWithDetails | null;
  clients: ThirdParty[];
  companyId: string;
  companySettings: CompanySettings | null;
  onSuccess: () => void;
}

const InvoiceFormDialog: React.FC<InvoiceFormDialogProps> = ({
  open,
  onClose,
  invoice,
  clients,
  companyId,
  companySettings,
  onSuccess
}) => {
  const { toast } = useToast();
  const { currentCompany } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    payment_terms: 30
  });
  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: '',
    invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 20, total: 0 }],
    notes: '',
    terms: ''
  });

  // Charger les articles d'inventaire
  useEffect(() => {
    const loadInventoryItems = async () => {
      if (!currentCompany?.id) return;

      const result = await inventoryItemsService.getItems(currentCompany.id);
      if (result.success) {
        setInventoryItems(result.data);
      } else {
        logger.error('Error loading inventory items:', (result as { success: false; error: string }).error);
      }
    };

    if (open) {
      loadInventoryItems();
    }
  }, [open, currentCompany?.id]);

  // Initialiser le formulaire
  useEffect(() => {
    if (open && !invoice) {
      // Nouvelle facture - générer le numéro
      generateInvoiceNumber();
      // Reset form with company default terms
      const defaultTerms = companySettings?.branding?.defaultTermsConditions || '';
      const defaultTaxRate = companySettings?.accounting?.defaultVatRate || 20;

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
        clientId: invoice.third_party_id || '',
        invoiceNumber: invoice.invoice_number,
        issueDate: invoice.invoice_date,
        dueDate: invoice.due_date || '',
        description: invoice.notes || '',
        items: invoice.invoice_lines?.map(line => ({
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unit_price,
          taxRate: line.tax_rate || 20,
          total: line.line_total_ht || 0
        })) || [{ description: '', quantity: 1, unitPrice: 0, taxRate: 20, total: 0 }],
        notes: invoice.notes || '',
        terms: ''
      });
    }
  }, [open, invoice]);

  const generateInvoiceNumber = async () => {
    try {
      const number = await invoicingService.generateInvoiceNumber();
      setFormData(prev => ({ ...prev, invoiceNumber: number }));
    } catch (error) {
      logger.error('Error generating invoice number:', error)
    }
  };

  const addItem = () => {
    const defaultTaxRate = companySettings?.accounting?.defaultVatRate || 20;
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

  // Préparer les options pour EntitySelector
  const inventoryItemOptions: EntityOption[] = inventoryItems.map(item => ({
    id: item.id,
    label: item.name,
    sublabel: `${item.code} - ${item.sale_price.toFixed(2)}€ HT (TVA ${item.sale_tax_rate}%)`,
    metadata: item
  }));

  // Handler pour la sélection d'un article
  const handleSelectInventoryItem = (index: number, itemId: string) => {
    const selectedItem = inventoryItems.find(item => item.id === itemId);
    if (!selectedItem) return;

    setFormData(prev => {
      const newItems = [...prev.items];
      const quantity = newItems[index].quantity || 1;
      const unitPrice = selectedItem.sale_price;
      const taxRate = selectedItem.sale_tax_rate;
      const totalHT = quantity * unitPrice;
      const totalTTC = totalHT * (1 + taxRate / 100);

      newItems[index] = {
        ...newItems[index],
        inventoryItemId: selectedItem.id,
        description: selectedItem.name,
        unitPrice,
        taxRate,
        total: totalTTC
      };
      return { ...prev, items: newItems };
    });
  };

  // Handler pour la création d'un nouvel article
  const handleCreateInventoryItem = async (data: Record<string, any>) => {
    if (!currentCompany?.id) {
      return { success: false, error: 'Aucune entreprise sélectionnée' };
    }

    const result = await inventoryItemsService.createItem(currentCompany.id, {
      reference: data.reference,
      name: data.name,
      category: data.category || 'Autre',
      unit: data.unit || 'Pièce',
      purchase_price: data.purchase_price || 0,
      selling_price: data.selling_price,
      current_stock: data.current_stock || 0,
      min_stock: data.min_stock || 0,
      max_stock: data.max_stock || 100,
      sale_tax_rate: data.sale_tax_rate || companySettings?.accounting?.defaultVatRate || 20
    });

    if (result.success) {
      // Rafraîchir la liste des articles
      const updatedItems = await inventoryItemsService.getItems(currentCompany.id);
      if (updatedItems.success) {
        setInventoryItems(updatedItems.data);
      }
      return { success: true, id: result.data.id };
    }

    return { success: false, error: (result as { success: false; error: string }).error };
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

  const handleCreateClient = async () => {
    if (!newClientData.name || !newClientData.email) {
      toast({
        title: "Champs requis",
        description: "Le nom et l'email du client sont obligatoires.",
        variant: "destructive"
      });
      return;
    }

    try {
      const newClient = await thirdPartiesService.createThirdParty({
        type: 'customer',
        name: newClientData.name,
        email: newClientData.email,
        phone: newClientData.phone,
        address: newClientData.address,
        city: newClientData.city,
        postal_code: newClientData.postal_code,
        payment_terms: newClientData.payment_terms,
        country: 'FR'
      });

      // Refresh clients list
      const updatedClients = await thirdPartiesService.getThirdParties('customer');
      // Update parent component's clients list
      clients.splice(0, clients.length, ...updatedClients);
      
      // Select the new client
      setFormData(prev => ({ ...prev, clientId: newClient.id }));
      
      // Close new client form
      setShowNewClientForm(false);
      setNewClientData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postal_code: '',
        payment_terms: 30
      });
      
      toast({
        title: "Client créé",
        description: `${newClient.name} a été ajouté avec succès.`
      });
    } catch (error) {
      logger.error('Error creating client:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le client.",
        variant: "destructive"
      });
    }
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
      const totals = calculateTotals();
      
      const invoiceData = {
        third_party_id: formData.clientId,
        invoice_number: formData.invoiceNumber,
        issue_date: formData.issueDate,
        due_date: formData.dueDate,
        currency: 'EUR',
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

      if (invoice) {
        // For now, we'll show a message that editing is not implemented
        toast({
          title: "Fonction non implémentée",
          description: "La modification de facture sera implémentée prochainement.",
          variant: "destructive"
        });
        return;
      } else {
        // Création
        await invoicingService.createInvoice(invoiceData, items);
        toast({
          title: "Succès",
          description: "Facture créée avec succès"
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      logger.error('Error saving invoice:', error);
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="client">Client *</Label>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowNewClientForm(true)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Nouveau client
                  </Button>
                </div>
                <Select 
                  value={formData.clientId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{client.name}</span>
                          {client.primary_email && <span className="text-xs text-gray-500">{client.primary_email}</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Formulaire de nouveau client */}
                {showNewClientForm && (
                  <Card className="mt-4 border-blue-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Nouveau client</CardTitle>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowNewClientForm(false)}
                        >
                          ×
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="newClientName">Nom *</Label>
                          <Input
                            id="newClientName"
                            placeholder="Nom du client"
                            value={newClientData.name}
                            onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="newClientEmail">Email *</Label>
                          <Input
                            id="newClientEmail"
                            type="email"
                            placeholder="client@exemple.fr"
                            value={newClientData.email}
                            onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="newClientPhone">Téléphone</Label>
                          <Input
                            id="newClientPhone"
                            placeholder="+33 1 23 45 67 89"
                            value={newClientData.phone}
                            onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="newClientPaymentTerms">Délai de paiement (jours)</Label>
                          <Input
                            id="newClientPaymentTerms"
                            type="number"
                            placeholder="30"
                            value={newClientData.payment_terms}
                            onChange={(e) => setNewClientData(prev => ({ ...prev, payment_terms: parseInt(e.target.value) || 30 }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="newClientAddress">Adresse</Label>
                        <Input
                          id="newClientAddress"
                          placeholder="123 Rue de la Paix"
                          value={newClientData.address}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, address: e.target.value }))}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="newClientCity">Ville</Label>
                          <Input
                            id="newClientCity"
                            placeholder="Paris"
                            value={newClientData.city}
                            onChange={(e) => setNewClientData(prev => ({ ...prev, city: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="newClientPostalCode">Code postal</Label>
                          <Input
                            id="newClientPostalCode"
                            placeholder="75001"
                            value={newClientData.postal_code}
                            onChange={(e) => setNewClientData(prev => ({ ...prev, postal_code: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowNewClientForm(false)}
                        >
                          Annuler
                        </Button>
                        <Button 
                          type="button"
                          size="sm" 
                          onClick={handleCreateClient}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Créer client
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              
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
              {/* Titres de colonnes */}
              <div className="grid grid-cols-12 gap-4 px-4 pb-2 text-sm font-medium text-gray-500">
                <div className="col-span-4">Article / Désignation</div>
                <div className="col-span-2">Quantité</div>
                <div className="col-span-2">Prix HT (€)</div>
                <div className="col-span-2">TVA</div>
                <div className="col-span-1">Total TTC</div>
                <div className="col-span-1">Actions</div>
              </div>

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-start p-4 border rounded-lg">
                    <div className="col-span-4">
                      <EntitySelector
                        options={inventoryItemOptions}
                        value={item.inventoryItemId || ''}
                        onChange={(value) => handleSelectInventoryItem(index, value)}
                        entityName="un article"
                        entityNamePlural="des articles"
                        placeholder="Sélectionner un article"
                        searchPlaceholder="Rechercher un article..."
                        emptyMessage="Aucun article trouvé"
                        canCreate={true}
                        createFormFields={[
                          {
                            name: 'reference',
                            label: 'Référence',
                            type: 'text',
                            required: true,
                            placeholder: 'REF-001'
                          },
                          {
                            name: 'name',
                            label: "Nom de l'article",
                            type: 'text',
                            required: true,
                            placeholder: 'Ordinateur portable'
                          },
                          {
                            name: 'category',
                            label: 'Catégorie',
                            type: 'select',
                            options: [
                              { value: 'Matériel informatique', label: 'Matériel informatique' },
                              { value: 'Logiciels', label: 'Logiciels' },
                              { value: 'Services', label: 'Services' },
                              { value: 'Fournitures', label: 'Fournitures' },
                              { value: 'Autre', label: 'Autre' }
                            ]
                          },
                          {
                            name: 'unit',
                            label: 'Unité',
                            type: 'select',
                            required: true,
                            options: [
                              { value: 'Pièce', label: 'Pièce' },
                              { value: 'Heure', label: 'Heure' },
                              { value: 'Jour', label: 'Jour' },
                              { value: 'Mois', label: 'Mois' },
                              { value: 'Kg', label: 'Kg' },
                              { value: 'Litre', label: 'Litre' }
                            ],
                            defaultValue: 'Pièce'
                          },
                          {
                            name: 'purchase_price',
                            label: "Prix d'achat (€)",
                            type: 'number',
                            placeholder: '100.00'
                          },
                          {
                            name: 'selling_price',
                            label: 'Prix de vente HT (€)',
                            type: 'number',
                            required: true,
                            placeholder: '150.00'
                          },
                          {
                            name: 'sale_tax_rate',
                            label: 'Taux de TVA (%)',
                            type: 'select',
                            required: false,
                            options: [
                              { value: '0', label: '0% - Exonéré' },
                              { value: '5.5', label: '5.5% - Taux réduit' },
                              { value: '10', label: '10% - Taux intermédiaire' },
                              { value: '20', label: '20% - Taux normal' }
                            ],
                            defaultValue: '20'
                          }
                        ]}
                        onCreateEntity={handleCreateInventoryItem}
                      />
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
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="5.5">5.5%</SelectItem>
                          <SelectItem value="10">10%</SelectItem>
                          <SelectItem value="20">20%</SelectItem>
                          {companySettings?.accounting?.defaultVatRate && 
                           ![0, 5.5, 10, 20].includes(companySettings.accounting.defaultVatRate) && (
                            <SelectItem value={companySettings.accounting.defaultVatRate.toString()}>
                              {companySettings.accounting.defaultVatRate}% (par défaut)
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1">
                      <div className="text-sm font-medium">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.total)}
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
                      <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totals.totalHT)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>TVA:</span>
                      <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totals.totalTVA)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total TTC:</span>
                      <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totals.totalTTC)}</span>
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
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {invoice ? 'Modifier' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OptimizedInvoicesTab;