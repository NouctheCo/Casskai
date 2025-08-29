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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
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
  Phone
} from 'lucide-react';

// Invoice Form Dialog Component
const InvoiceFormDialog = ({ open, onClose, invoice = null, onSave }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    clientId: '',
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: '',
    items: [
      { description: '', quantity: 1, price: 0, total: 0 }
    ],
    tax: 20,
    discount: 0,
    notes: ''
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        clientId: invoice.clientId || '',
        invoiceNumber: invoice.invoiceNumber || '',
        date: invoice.date || new Date().toISOString().split('T')[0],
        dueDate: invoice.dueDate || '',
        description: invoice.description || '',
        items: invoice.items || [{ description: '', quantity: 1, price: 0, total: 0 }],
        tax: invoice.tax || 20,
        discount: invoice.discount || 0,
        notes: invoice.notes || ''
      });
    }
  }, [invoice]);

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, price: 0, total: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Calculate total for this item
      if (field === 'quantity' || field === 'price') {
        newItems[index].total = newItems[index].quantity * newItems[index].price;
      }
      
      return { ...prev, items: newItems };
    });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = subtotal * (formData.discount / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (formData.tax / 100);
    const total = taxableAmount + taxAmount;
    
    return { subtotal, discountAmount, taxAmount, total };
  };

  const totals = calculateTotals();

  const handleSave = () => {
    if (!formData.clientId || !formData.invoiceNumber) {
      toast({
        title: "Champs requis",
        description: "Le client et le numéro de facture sont obligatoires.",
        variant: "destructive"
      });
      return;
    }

    onSave({
      ...formData,
      id: invoice?.id || Date.now(),
      status: invoice?.status || 'draft',
      subtotal: totals.subtotal,
      total: totals.total
    });

    toast({
      title: invoice ? "Facture modifiée" : "Facture créée",
      description: "La facture a été enregistrée avec succès."
    });

    onClose();
  };

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
          {/* Invoice Header */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select value={formData.clientId} onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client1">ABC Corporation</SelectItem>
                    <SelectItem value="client2">XYZ Entreprise</SelectItem>
                    <SelectItem value="client3">Tech Solutions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Numéro de facture *</Label>
                <Input
                  id="invoiceNumber"
                  placeholder="Ex: F-2024-001"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
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

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Articles</CardTitle>
                <Button onClick={addItem} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un article
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid md:grid-cols-5 gap-4 p-4 border rounded-lg"
                  >
                    <div className="md:col-span-2 space-y-2">
                      <Label>Description</Label>
                      <Input
                        placeholder="Description de l'article"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Quantité</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Prix unitaire</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="flex items-end justify-between">
                      <div className="text-right">
                        <Label>Total</Label>
                        <p className="text-lg font-semibold">{item.total.toFixed(2)} €</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={formData.items.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="space-y-2">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Remise (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.discount}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>TVA (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.tax}
                        onChange={(e) => setFormData(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Sous-total:</span>
                      <span>{totals.subtotal.toFixed(2)} €</span>
                    </div>
                    {formData.discount > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Remise ({formData.discount}%):</span>
                        <span>-{totals.discountAmount.toFixed(2)} €</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span>TVA ({formData.tax}%):</span>
                      <span>{totals.taxAmount.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total TTC:</span>
                      <span>{totals.total.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Notes supplémentaires..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            <CheckCircle className="w-4 h-4 mr-2" />
            {invoice ? 'Modifier' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Invoice Row Component
const InvoiceRow = ({ invoice, onEdit, onDelete, onView, onSend }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Payée</Badge>;
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Envoyée</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 border-red-200">En retard</Badge>;
      case 'draft':
        return <Badge variant="secondary">Brouillon</Badge>;
      default:
        return <Badge variant="outline">Inconnue</Badge>;
    }
  };

  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid';

  return (
    <TableRow className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
      <TableCell>{invoice.clientName}</TableCell>
      <TableCell>{new Date(invoice.date).toLocaleDateString('fr-FR')}</TableCell>
      <TableCell>{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</TableCell>
      <TableCell className="text-right font-mono">
        {invoice.total.toFixed(2)} €
      </TableCell>
      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => onView(invoice)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(invoice)}>
            <Edit className="w-4 h-4" />
          </Button>
          {invoice.status === 'draft' && (
            <Button variant="ghost" size="sm" onClick={() => onSend(invoice)}>
              <Send className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onDelete(invoice)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default function OptimizedInvoicesTab({ shouldCreateNew = false, onCreateNewCompleted }) {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState([
    {
      id: 1,
      invoiceNumber: 'F-2024-001',
      clientId: 'client1',
      clientName: 'ABC Corporation',
      date: '2024-01-15',
      dueDate: '2024-02-15',
      total: 1440.00,
      status: 'paid',
      items: [
        { description: 'Consultation', quantity: 8, price: 150, total: 1200 },
        { description: 'Analyse technique', quantity: 1, price: 200, total: 200 }
      ]
    },
    {
      id: 2,
      invoiceNumber: 'F-2024-002',
      clientId: 'client2',
      clientName: 'XYZ Entreprise',
      date: '2024-01-20',
      dueDate: '2024-02-20',
      total: 2880.00,
      status: 'sent',
      items: [
        { description: 'Développement application', quantity: 16, price: 180, total: 2880 }
      ]
    },
    {
      id: 3,
      invoiceNumber: 'F-2024-003',
      clientId: 'client3',
      clientName: 'Tech Solutions',
      date: '2024-01-10',
      dueDate: '2024-01-25',
      total: 960.00,
      status: 'overdue',
      items: [
        { description: 'Formation équipe', quantity: 1, price: 800, total: 800 }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  // Ouvrir automatiquement le formulaire si shouldCreateNew est true
  useEffect(() => {
    if (shouldCreateNew) {
      setShowInvoiceForm(true);
      if (onCreateNewCompleted) {
        onCreateNewCompleted();
      }
    }
  }, [shouldCreateNew, onCreateNewCompleted]);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSaveInvoice = (invoiceData) => {
    if (editingInvoice) {
      setInvoices(prev => prev.map(invoice => 
        invoice.id === editingInvoice.id ? { ...invoiceData, id: editingInvoice.id } : invoice
      ));
    } else {
      setInvoices(prev => [...prev, { ...invoiceData, id: Date.now() }]);
    }
    setEditingInvoice(null);
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setShowInvoiceForm(true);
  };

  const handleDeleteInvoice = (invoice) => {
    setInvoices(prev => prev.filter(i => i.id !== invoice.id));
    toast({
      title: "Facture supprimée",
      description: "La facture a été supprimée avec succès."
    });
  };

  const handleViewInvoice = (invoice) => {
    toast({
      title: "Aperçu de la facture",
      description: `Consultation de la facture ${invoice.invoiceNumber}`
    });
  };

  const handleSendInvoice = (invoice) => {
    setInvoices(prev => prev.map(i => 
      i.id === invoice.id ? { ...i, status: 'sent' } : i
    ));
    toast({
      title: "Facture envoyée",
      description: `La facture ${invoice.invoiceNumber} a été envoyée au client.`
    });
  };

  const summary = {
    totalInvoices: invoices.length,
    totalAmount: invoices.reduce((sum, invoice) => sum + invoice.total, 0),
    paidInvoices: invoices.filter(i => i.status === 'paid').length,
    overdueInvoices: invoices.filter(i => i.status === 'overdue').length
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total factures</p>
                <p className="text-2xl font-bold">{summary.totalInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Euro className="w-5 h-5 text-green-500" />
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Payées</p>
                <p className="text-2xl font-bold">{summary.paidInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En retard</p>
                <p className="text-2xl font-bold">{summary.overdueInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <span>Factures</span>
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
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="paid">Payées</SelectItem>
                  <SelectItem value="sent">Envoyées</SelectItem>
                  <SelectItem value="overdue">En retard</SelectItem>
                  <SelectItem value="draft">Brouillons</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={() => setShowInvoiceForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle facture
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
                  <TableHead>Échéance</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <InvoiceRow
                    key={invoice.id}
                    invoice={invoice}
                    onEdit={handleEditInvoice}
                    onDelete={handleDeleteInvoice}
                    onView={handleViewInvoice}
                    onSend={handleSendInvoice}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Form Dialog */}
      <InvoiceFormDialog
        open={showInvoiceForm}
        onClose={() => {
          setShowInvoiceForm(false);
          setEditingInvoice(null);
        }}
        invoice={editingInvoice}
        onSave={handleSaveInvoice}
      />
    </div>
  );
}