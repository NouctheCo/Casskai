// @ts-nocheck
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
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  Euro,
  Calendar,
  Building,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Banknote
} from 'lucide-react';

// Payment Row Component
const PaymentRow = ({ payment, onEdit, onDelete, onView }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Reçu</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Échoué</Badge>;
      case 'refunded':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Remboursé</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const getMethodBadge = (method) => {
    switch (method) {
      case 'card':
        return <Badge variant="outline" className="flex items-center space-x-1">
          <CreditCard className="w-3 h-3" />
          <span>Carte</span>
        </Badge>;
      case 'bank_transfer':
        return <Badge variant="outline" className="flex items-center space-x-1">
          <Building className="w-3 h-3" />
          <span>Virement</span>
        </Badge>;
      case 'cash':
        return <Badge variant="outline" className="flex items-center space-x-1">
          <Banknote className="w-3 h-3" />
          <span>Espèces</span>
        </Badge>;
      case 'check':
        return <Badge variant="outline" className="flex items-center space-x-1">
          <FileText className="w-3 h-3" />
          <span>Chèque</span>
        </Badge>;            
      default:
        return <Badge variant="outline">Autre</Badge>;
    }
  };

  const getTypeIcon = (type) => {
    return type === 'income' 
      ? <ArrowDownLeft className="w-4 h-4 text-green-500" />
      : <ArrowUpRight className="w-4 h-4 text-red-500" />;
  };

  return (
    <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <TableCell>
        <div className="flex items-center space-x-2">
          {getTypeIcon(payment.type)}
          <span className="font-medium">{payment.reference}</span>
        </div>
      </TableCell>
      <TableCell>{payment.clientName}</TableCell>
      <TableCell>{new Date(payment.date).toLocaleDateString('fr-FR')}</TableCell>
      <TableCell className="text-right font-mono">
        <span className={payment.type === 'income' ? 'text-green-600' : 'text-red-600'}>
          {payment.type === 'income' ? '+' : '-'}{payment.amount.toFixed(2)} €
        </span>
      </TableCell>
      <TableCell>{getMethodBadge(payment.method)}</TableCell>
      <TableCell>{getStatusBadge(payment.status)}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => onView(payment)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(payment)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(payment)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

// Payment Form Dialog Component
const PaymentFormDialog = ({ open, onClose, onSave }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    reference: `REF-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
    clientName: '',
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    method: 'card',
    type: 'income',
    description: ''
  });

  const handleSave = () => {
    if (!formData.clientName || !formData.amount) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }

    const newPayment = {
      id: Date.now(),
      reference: formData.reference,
      clientName: formData.clientName,
      invoiceNumber: formData.invoiceNumber,
      date: formData.date,
      amount: parseFloat(formData.amount),
      method: formData.method,
      type: formData.type,
      status: 'completed',
      description: formData.description,
      clientId: 'client' + Date.now()
    };

    onSave(newPayment);
    
    toast({
      title: "Paiement enregistré",
      description: `Le paiement ${formData.reference} a été enregistré avec succès.`
    });

    onClose();
    
    // Reset form
    setFormData({
      reference: `REF-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      clientName: '',
      invoiceNumber: '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      method: 'card',
      type: 'income',
      description: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau paiement</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="reference">Référence</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
            />
          </div>

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
            <Label htmlFor="invoiceNumber">Numéro de facture</Label>
            <Input
              id="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              placeholder="F-2024-001"
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="method">Méthode</Label>
              <Select value={formData.method} onValueChange={(value) => setFormData(prev => ({ ...prev, method: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Carte bancaire</SelectItem>
                  <SelectItem value="bank_transfer">Virement</SelectItem>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="check">Chèque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Recette</SelectItem>
                  <SelectItem value="expense">Dépense</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description du paiement..."
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Enregistrer le paiement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function OptimizedPaymentsTab({ shouldCreateNew = false, onCreateNewCompleted }) {
  const { toast } = useToast();
  const [payments, setPayments] = useState([
    {
      id: 1,
      reference: 'PAY-2024-001',
      clientId: 'client1',
      clientName: 'ABC Corporation',
      invoiceNumber: 'F-2024-001',
      date: '2024-01-16',
      amount: 1440.00,
      method: 'bank_transfer',
      status: 'completed',
      type: 'income',
      description: 'Paiement facture F-2024-001'
    },
    {
      id: 2,
      reference: 'PAY-2024-002',
      clientId: 'client2',
      clientName: 'XYZ Entreprise',
      invoiceNumber: 'F-2024-002',
      date: '2024-01-22',
      amount: 2880.00,
      method: 'card',
      status: 'completed',
      type: 'income',
      description: 'Paiement facture F-2024-002'
    },
    {
      id: 3,
      reference: 'PAY-2024-003',
      clientId: 'client3',
      clientName: 'Tech Solutions',
      invoiceNumber: 'F-2024-003',
      date: '2024-01-25',
      amount: 960.00,
      method: 'bank_transfer',
      status: 'pending',
      type: 'income',
      description: 'Paiement facture F-2024-003'
    },
    {
      id: 4,
      reference: 'REF-2024-001',
      clientId: 'client1',
      clientName: 'ABC Corporation',
      invoiceNumber: 'F-2024-001',
      date: '2024-01-28',
      amount: 200.00,
      method: 'bank_transfer',
      status: 'completed',
      type: 'expense',
      description: 'Remboursement partiel F-2024-001'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Ouvrir automatiquement le formulaire si shouldCreateNew est true
  React.useEffect(() => {
    if (shouldCreateNew) {
      setShowPaymentForm(true);
      if (onCreateNewCompleted) {
        onCreateNewCompleted();
      }
    }
  }, [shouldCreateNew, onCreateNewCompleted]);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesType = typeFilter === 'all' || payment.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleEditPayment = (payment) => {
    toast({
      title: "Édition du paiement",
      description: `Ouverture de l'éditeur pour le paiement ${payment.reference}`
    });
  };

  const handleDeletePayment = (payment) => {
    setPayments(prev => prev.filter(p => p.id !== payment.id));
    toast({
      title: "Paiement supprimé",
      description: "Le paiement a été supprimé avec succès."
    });
  };

  const handleViewPayment = (payment) => {
    toast({
      title: "Détails du paiement",
      description: `Consultation du paiement ${payment.reference}`
    });
  };

  const handleNewPayment = () => {
    setShowPaymentForm(true);
  };

  const handleSavePayment = (newPayment) => {
    setPayments(prev => [...prev, newPayment]);
  };

  const handleExportPayments = () => {
    toast({
      title: "Export en cours",
      description: "Génération du fichier d'export des paiements..."
    });
  };

  const summary = {
    totalPayments: payments.length,
    totalIncome: payments.filter(p => p.type === 'income' && p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
    totalExpenses: payments.filter(p => p.type === 'expense' && p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
    pendingPayments: payments.filter(p => p.status === 'pending').length,
    completedPayments: payments.filter(p => p.status === 'completed').length
  };

  const netIncome = summary.totalIncome - summary.totalExpenses;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total paiements</p>
                <p className="text-2xl font-bold">{summary.totalPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ArrowDownLeft className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Encaissements</p>
                <p className="text-xl font-bold text-green-600">{summary.totalIncome.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ArrowUpRight className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Décaissements</p>
                <p className="text-xl font-bold text-red-600">{summary.totalExpenses.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Euro className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Résultat net</p>
                <p className={`text-xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netIncome.toFixed(2)} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En attente</p>
                <p className="text-2xl font-bold">{summary.pendingPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-blue-500" />
            <span>Répartition par moyen de paiement</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { method: 'Virement bancaire', count: payments.filter(p => p.method === 'bank_transfer').length, color: 'blue' },
              { method: 'Carte bancaire', count: payments.filter(p => p.method === 'card').length, color: 'green' },
              { method: 'Espèces', count: payments.filter(p => p.method === 'cash').length, color: 'purple' },
              { method: 'Chèque', count: payments.filter(p => p.method === 'check').length, color: 'orange' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 ${
                  item.color === 'blue' ? 'bg-blue-500' :
                  item.color === 'green' ? 'bg-green-500' :
                  item.color === 'purple' ? 'bg-purple-500' :
                  'bg-orange-500'
                } rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-xl`}>
                  {item.count}
                </div>
                <p className="text-sm font-medium">{item.method}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-blue-500" />
              <span>Paiements</span>
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
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="income">Recettes</SelectItem>
                  <SelectItem value="expense">Dépenses</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="completed">Reçus</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="failed">Échoués</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={handleExportPayments}>
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              
              <Button onClick={handleNewPayment}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau paiement
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Moyen</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <PaymentRow
                    key={payment.id}
                    payment={payment}
                    onEdit={handleEditPayment}
                    onDelete={handleDeletePayment}
                    onView={handleViewPayment}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PaymentFormDialog
        open={showPaymentForm}
        onClose={() => setShowPaymentForm(false)}
        onSave={handleSavePayment}
      />
    </div>
  );
}