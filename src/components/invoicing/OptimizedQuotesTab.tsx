import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  FileText,
  Send,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  Euro,
  Calendar
} from 'lucide-react';

// Quote Row Component
const QuoteRow = ({ quote, onEdit, onDelete, onView, onSend, onConvertToInvoice, onCopy }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Accepté</Badge>;
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Envoyé</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Refusé</Badge>;
      case 'expired':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Expiré</Badge>;
      case 'draft':
        return <Badge variant="secondary">Brouillon</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const isExpired = new Date(quote.validUntil) < new Date() && quote.status === 'sent';

  return (
    <TableRow className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isExpired ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}>
      <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
      <TableCell>{quote.clientName}</TableCell>
      <TableCell>{new Date(quote.date).toLocaleDateString('fr-FR')}</TableCell>
      <TableCell>{new Date(quote.validUntil).toLocaleDateString('fr-FR')}</TableCell>
      <TableCell className="text-right font-mono">
        {quote.total.toFixed(2)} €
      </TableCell>
      <TableCell>{getStatusBadge(quote.status)}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => onView(quote)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(quote)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onCopy(quote)}>
            <Copy className="w-4 h-4" />
          </Button>
          {quote.status === 'draft' && (
            <Button variant="ghost" size="sm" onClick={() => onSend(quote)}>
              <Send className="w-4 h-4" />
            </Button>
          )}
          {quote.status === 'accepted' && (
            <Button variant="ghost" size="sm" onClick={() => onConvertToInvoice(quote)}>
              <FileText className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onDelete(quote)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

// Quote Preview Dialog Component
function QuotePreviewDialog({ open, onClose, quote }) {
  if (!quote) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-blue-500" />
            <span>Aperçu du devis {quote.quoteNumber}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* En-tête du devis */}
          <div className="border-b pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Informations client</h3>
                <p className="text-gray-600 dark:text-gray-400">{quote.clientName}</p>
              </div>
              <div className="text-right">
                <h3 className="font-semibold text-lg mb-2">Informations devis</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Numéro:</strong> {quote.quoteNumber}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Date:</strong> {new Date(quote.date).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Valide jusqu'au:</strong> {new Date(quote.validUntil).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>

          {/* Articles du devis */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Articles</h3>
            <div className="border rounded-lg overflow-hidden">
              <div className="p-4">
                {quote.items?.length > 0 ? (
                  quote.items.map((item, index) => (
                    <div key={index} className="flex justify-between py-2 border-b last:border-b-0">
                      <span>{item.description}</span>
                      <span className="font-medium">{item.total.toFixed(2)} €</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">Aucun article</p>
                )}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>{quote.total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Notes</h3>
            <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              {quote.notes || 'Aucune note'}
            </p>
          </div>

          {/* Statut */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Statut:</span>
              <div>
                {quote.status === 'accepted' && <Badge className="bg-green-100 text-green-800 border-green-200">Accepté</Badge>}
                {quote.status === 'sent' && <Badge className="bg-blue-100 text-blue-800 border-blue-200">Envoyé</Badge>}
                {quote.status === 'rejected' && <Badge className="bg-red-100 text-red-800 border-red-200">Refusé</Badge>}
                {quote.status === 'expired' && <Badge className="bg-orange-100 text-orange-800 border-orange-200">Expiré</Badge>}
                {quote.status === 'draft' && <Badge variant="secondary">Brouillon</Badge>}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Quote Form Dialog Component
const QuoteFormDialog = ({ open, onClose, onSave, editingQuote = null }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    clientName: editingQuote?.clientName || '',
    quoteNumber: editingQuote?.quoteNumber || `D-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
    date: editingQuote?.date || new Date().toISOString().split('T')[0],
    validUntil: editingQuote?.validUntil || '',
    description: editingQuote?.description || '',
    amount: editingQuote?.total?.toString() || '',
    notes: editingQuote?.notes || ''
  });

  React.useEffect(() => {
    if (editingQuote) {
      setFormData({
        clientName: editingQuote.clientName || '',
        quoteNumber: editingQuote.quoteNumber || '',
        date: editingQuote.date || new Date().toISOString().split('T')[0],
        validUntil: editingQuote.validUntil || '',
        description: editingQuote.description || '',
        amount: editingQuote.total?.toString() || '',
        notes: editingQuote.notes || ''
      });
    } else {
      // Reset form for new quote
      setFormData({
        clientName: '',
        quoteNumber: `D-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
        date: new Date().toISOString().split('T')[0],
        validUntil: '',
        description: '',
        amount: '',
        notes: ''
      });
    }
  }, [editingQuote]);

  const handleSave = () => {
    if (!formData.clientName || !formData.amount) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }

    const quoteData = {
      ...formData,
      total: parseFloat(formData.amount),
      status: editingQuote?.status || 'draft',
      items: editingQuote?.items || []
    };

    onSave(quoteData);
    
    toast({
      title: editingQuote ? "Devis modifié" : "Devis créé",
      description: `Le devis ${formData.quoteNumber} a été ${editingQuote ? 'modifié' : 'créé'} avec succès.`
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingQuote ? 'Modifier le devis' : 'Nouveau devis'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="clientName">Client *</Label>
            <Input
              id="clientName"
              value={formData.clientName}
              onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
              placeholder="Nom du client"
            />
          </div>
          
          <div>
            <Label htmlFor="quoteNumber">Numéro de devis</Label>
            <Input
              id="quoteNumber"
              value={formData.quoteNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, quoteNumber: e.target.value }))}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="validUntil">Valide jusqu'au</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="amount">Montant *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description du devis..."
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Créer le devis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function OptimizedQuotesTab({ shouldCreateNew = false, onCreateNewCompleted }) {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState([
    {
      id: 1,
      quoteNumber: 'D-2024-001',
      clientId: 'client1',
      clientName: 'ABC Corporation',
      date: '2024-01-10',
      validUntil: '2024-02-10',
      total: 2400.00,
      status: 'accepted',
      items: [
        { description: 'Audit sécurité', quantity: 1, price: 2000, total: 2000 },
        { description: 'Rapport d\'analyse', quantity: 1, price: 400, total: 400 }
      ]
    },
    {
      id: 2,
      quoteNumber: 'D-2024-002',
      clientId: 'client2',
      clientName: 'XYZ Entreprise',
      date: '2024-01-15',
      validUntil: '2024-02-15',
      total: 3600.00,
      status: 'sent',
      items: [
        { description: 'Développement site web', quantity: 1, price: 3000, total: 3000 },
        { description: 'Formation utilisateurs', quantity: 1, price: 600, total: 600 }
      ]
    },
    {
      id: 3,
      quoteNumber: 'D-2024-003',
      clientId: 'client3',
      clientName: 'Tech Solutions',
      date: '2024-01-05',
      validUntil: '2024-01-20',
      total: 1800.00,
      status: 'expired',
      items: [
        { description: 'Consultation technique', quantity: 6, price: 300, total: 1800 }
      ]
    },
    {
      id: 4,
      quoteNumber: 'D-2024-004',
      clientId: 'client1',
      clientName: 'ABC Corporation',
      date: '2024-01-22',
      validUntil: '2024-02-22',
      total: 1200.00,
      status: 'draft',
      items: [
        { description: 'Maintenance préventive', quantity: 1, price: 1000, total: 1000 },
        { description: 'Support technique', quantity: 1, price: 200, total: 200 }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [previewQuote, setPreviewQuote] = useState(null);

  // Ouvrir automatiquement le formulaire si shouldCreateNew est true
  React.useEffect(() => {
    if (shouldCreateNew) {
      setShowQuoteForm(true);
      if (onCreateNewCompleted) {
        onCreateNewCompleted();
      }
    }
  }, [shouldCreateNew, onCreateNewCompleted]);

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEditQuote = (quote) => {
    setEditingQuote(quote);
  };

  const handleDeleteQuote = (quote) => {
    setQuotes(prev => prev.filter(q => q.id !== quote.id));
    toast({
      title: "Devis supprimé",
      description: "Le devis a été supprimé avec succès."
    });
  };

  const handleViewQuote = (quote) => {
    setPreviewQuote(quote);
  };

  const handleSendQuote = (quote) => {
    setQuotes(prev => prev.map(q => 
      q.id === quote.id ? { ...q, status: 'sent' } : q
    ));
    toast({
      title: "Devis envoyé",
      description: `Le devis ${quote.quoteNumber} a été envoyé au client.`
    });
  };

  const handleConvertToInvoice = (quote) => {
    // Générer un numéro de facture unique
    const currentYear = new Date().getFullYear();
    const existingInvoices = JSON.parse(localStorage.getItem('casskai_invoices') || '[]');
    const nextInvoiceNumber = existingInvoices.length + 1;
    const invoiceNumber = `F-${currentYear}-${String(nextInvoiceNumber).padStart(3, '0')}`;

    // Créer la facture à partir du devis
    const newInvoice = {
      id: Date.now(),
      invoiceNumber,
      clientId: quote.clientId,
      clientName: quote.clientName,
      date: new Date().toISOString().split('T')[0], // Date d'aujourd'hui
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 jours
      total: quote.total,
      status: 'draft',
      items: quote.items,
      convertedFromQuote: quote.id,
      quoteNumber: quote.quoteNumber
    };

    // Sauvegarder la facture dans localStorage
    const updatedInvoices = [...existingInvoices, newInvoice];
    localStorage.setItem('casskai_invoices', JSON.stringify(updatedInvoices));

    // Mettre à jour le statut du devis
    setQuotes(prev => prev.map(q =>
      q.id === quote.id ? { ...q, status: 'converted' } : q
    ));

    toast({
      title: "Conversion réussie",
      description: `Le devis ${quote.quoteNumber} a été converti en facture ${invoiceNumber}.`
    });
  };

  const handleCopyQuote = (quote) => {
    const copiedQuote = {
      ...quote,
      id: Date.now(),
      quoteNumber: `${quote.quoteNumber}-COPY`,
      status: 'draft',
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
    };
    setQuotes(prev => [...prev, copiedQuote]);
    toast({
      title: "Devis dupliqué",
      description: `Le devis ${quote.quoteNumber} a été dupliqué avec succès.`
    });
  };

  const handleNewQuote = () => {
    setShowQuoteForm(true);
  };

  const handleSaveQuote = (newQuote) => {
    setQuotes(prev => [...prev, newQuote]);
  };

  const summary = {
    totalQuotes: quotes.length,
    totalAmount: quotes.reduce((sum, quote) => sum + quote.total, 0),
    acceptedQuotes: quotes.filter(q => q.status === 'accepted').length,
    pendingQuotes: quotes.filter(q => q.status === 'sent').length,
    expiredQuotes: quotes.filter(q => q.status === 'expired').length
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total devis</p>
                <p className="text-2xl font-bold">{summary.totalQuotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Euro className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Montant total</p>
                <p className="text-xl font-bold">{summary.totalAmount.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Acceptés</p>
                <p className="text-2xl font-bold">{summary.acceptedQuotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En attente</p>
                <p className="text-2xl font-bold">{summary.pendingQuotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expirés</p>
                <p className="text-2xl font-bold">{summary.expiredQuotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quotes Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <span>Devis</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="accepted">Acceptés</SelectItem>
                  <SelectItem value="sent">Envoyés</SelectItem>
                  <SelectItem value="rejected">Refusés</SelectItem>
                  <SelectItem value="expired">Expirés</SelectItem>
                  <SelectItem value="draft">Brouillons</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={handleNewQuote}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau devis
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Valide jusqu'au</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <QuoteRow
                    key={quote.id}
                    quote={quote}
                    onEdit={handleEditQuote}
                    onDelete={handleDeleteQuote}
                    onView={handleViewQuote}
                    onSend={handleSendQuote}
                    onConvertToInvoice={handleConvertToInvoice}
                    onCopy={handleCopyQuote}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <QuoteFormDialog
        open={showQuoteForm}
        onClose={() => setShowQuoteForm(false)}
        onSave={handleSaveQuote}
      />

      <QuotePreviewDialog
        open={!!previewQuote}
        onClose={() => setPreviewQuote(null)}
        quote={previewQuote}
      />

      <QuoteFormDialog
        open={!!editingQuote}
        onClose={() => setEditingQuote(null)}
        onSave={(updatedQuote) => {
          setQuotes(prev => prev.map(q => 
            q.id === updatedQuote.id ? updatedQuote : q
          ));
          setEditingQuote(null);
        }}
        editingQuote={editingQuote}
      />
    </div>
  );
}