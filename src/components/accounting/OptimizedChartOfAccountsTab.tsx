import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { 
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Filter,
  Download,
  Upload,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// Account Form Dialog
const AccountFormDialog = ({ open, onClose, account = null, onSave }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    code: account?.code || '',
    name: account?.name || '',
    type: account?.type || 'asset',
    parent: account?.parent || '',
    description: account?.description || ''
  });

  const accountTypes = [
    { value: 'asset', label: 'Actif', color: 'blue' },
    { value: 'liability', label: 'Passif', color: 'red' },
    { value: 'equity', label: 'Capitaux propres', color: 'green' },
    { value: 'revenue', label: 'Produits', color: 'purple' },
    { value: 'expense', label: 'Charges', color: 'orange' }
  ];

  const handleSave = () => {
    if (!formData.code || !formData.name) {
      toast({
        title: "Champs requis",
        description: "Le code et le nom du compte sont obligatoires.",
        variant: "destructive"
      });
      return;
    }

    onSave({
      ...formData,
      id: account?.id || Date.now(),
      balance: account?.balance || 0,
      movements: account?.movements || 0
    });

    toast({
      title: account ? "Compte modifié" : "Compte créé",
      description: "Le compte a été enregistré avec succès."
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <span>{account ? 'Modifier le compte' : 'Nouveau compte'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Code compte *</label>
              <Input
                placeholder="Ex: 411000"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type *</label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nom du compte *</label>
            <Input
              placeholder="Ex: Clients"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Compte parent</label>
            <Select value={formData.parent} onValueChange={(value) => setFormData(prev => ({ ...prev, parent: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Aucun parent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun parent</SelectItem>
                <SelectItem value="41">41 - Clients et comptes rattachés</SelectItem>
                <SelectItem value="40">40 - Fournisseurs et comptes rattachés</SelectItem>
                <SelectItem value="70">70 - Ventes de produits fabriqués</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="Description du compte"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            <CheckCircle className="w-4 h-4 mr-2" />
            {account ? 'Modifier' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Account Row Component
const AccountRow = ({ account, onEdit, onDelete, onView }) => {
  const getTypeColor = (type) => {
    switch (type) {
      case 'asset': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'liability': return 'bg-red-100 text-red-800 border-red-200';
      case 'equity': return 'bg-green-100 text-green-800 border-green-200';
      case 'revenue': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'expense': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeName = (type) => {
    const types = {
      asset: 'Actif',
      liability: 'Passif',
      equity: 'Capitaux propres',
      revenue: 'Produits',
      expense: 'Charges'
    };
    return types[type] || type;
  };

  return (
    <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <TableCell className="font-mono font-medium">{account.code}</TableCell>
      <TableCell className="font-medium">{account.name}</TableCell>
      <TableCell>
        <Badge className={getTypeColor(account.type)}>
          {getTypeName(account.type)}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-mono">
        <span className={account.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
          {account.balance.toFixed(2)} €
        </span>
      </TableCell>
      <TableCell className="text-right">
        <Badge variant="secondary">{account.movements}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => onView(account)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(account)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(account)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default function OptimizedChartOfAccountsTab() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState([
    {
      id: 1,
      code: '101000',
      name: 'Capital social',
      type: 'equity',
      balance: 50000.00,
      movements: 12,
      description: 'Capital social de la société'
    },
    {
      id: 2,
      code: '411000',
      name: 'Clients',
      type: 'asset',
      balance: 15430.50,
      movements: 87,
      description: 'Créances clients'
    },
    {
      id: 3,
      code: '401000',
      name: 'Fournisseurs',
      type: 'liability',
      balance: -8750.25,
      movements: 43,
      description: 'Dettes fournisseurs'
    },
    {
      id: 4,
      code: '701000',
      name: 'Ventes de produits finis',
      type: 'revenue',
      balance: 125430.00,
      movements: 156,
      description: 'Chiffre d\'affaires produits'
    },
    {
      id: 5,
      code: '607000',
      name: 'Achats de marchandises',
      type: 'expense',
      balance: 45670.80,
      movements: 78,
      description: 'Achats pour revente'
    },
    {
      id: 6,
      code: '512000',
      name: 'Banque',
      type: 'asset',
      balance: 25890.40,
      movements: 234,
      description: 'Compte bancaire principal'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.code.includes(searchTerm);
    const matchesType = typeFilter === 'all' || account.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSaveAccount = (accountData) => {
    if (editingAccount) {
      setAccounts(prev => prev.map(account => 
        account.id === editingAccount.id ? { ...accountData, id: editingAccount.id } : account
      ));
    } else {
      setAccounts(prev => [...prev, { ...accountData, id: Date.now() }]);
    }
    setEditingAccount(null);
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setShowAccountForm(true);
  };

  const handleDeleteAccount = (account) => {
    setAccounts(prev => prev.filter(a => a.id !== account.id));
    toast({
      title: "Compte supprimé",
      description: "Le compte a été supprimé avec succès."
    });
  };

  const handleViewAccount = (account) => {
    toast({
      title: "Détails du compte",
      description: `Consultation du compte ${account.code} - ${account.name}`
    });
  };

  const summary = {
    totalAccounts: accounts.length,
    totalAssets: accounts.filter(a => a.type === 'asset').reduce((sum, a) => sum + a.balance, 0),
    totalLiabilities: accounts.filter(a => a.type === 'liability').reduce((sum, a) => sum + Math.abs(a.balance), 0),
    totalEquity: accounts.filter(a => a.type === 'equity').reduce((sum, a) => sum + a.balance, 0)
  };

  const accountsByType = {
    asset: accounts.filter(a => a.type === 'asset').length,
    liability: accounts.filter(a => a.type === 'liability').length,
    equity: accounts.filter(a => a.type === 'equity').length,
    revenue: accounts.filter(a => a.type === 'revenue').length,
    expense: accounts.filter(a => a.type === 'expense').length
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total comptes</p>
                <p className="text-2xl font-bold">{summary.totalAccounts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total actifs</p>
                <p className="text-xl font-bold text-green-600">{summary.totalAssets.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total passifs</p>
                <p className="text-xl font-bold text-red-600">{summary.totalLiabilities.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Capitaux propres</p>
                <p className="text-xl font-bold text-purple-600">{summary.totalEquity.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            <span>Répartition par type</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4">
            {Object.entries(accountsByType).map(([type, count]) => {
              const typeNames = {
                asset: 'Actifs',
                liability: 'Passifs',
                equity: 'Capitaux propres',
                revenue: 'Produits',
                expense: 'Charges'
              };
              
              const colors = {
                asset: 'bg-blue-500',
                liability: 'bg-red-500', 
                equity: 'bg-green-500',
                revenue: 'bg-purple-500',
                expense: 'bg-orange-500'
              };

              return (
                <div key={type} className="text-center">
                  <div className={`w-16 h-16 ${colors[type]} rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-xl`}>
                    {count}
                  </div>
                  <p className="text-sm font-medium">{typeNames[type]}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <span>Plan comptable</span>
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
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="asset">Actifs</SelectItem>
                  <SelectItem value="liability">Passifs</SelectItem>
                  <SelectItem value="equity">Capitaux propres</SelectItem>
                  <SelectItem value="revenue">Produits</SelectItem>
                  <SelectItem value="expense">Charges</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Importer
              </Button>
              
              <Button onClick={() => setShowAccountForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau compte
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom du compte</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Solde</TableHead>
                  <TableHead className="text-right">Mouvements</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    onEdit={handleEditAccount}
                    onDelete={handleDeleteAccount}
                    onView={handleViewAccount}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Account Form Dialog */}
      <AccountFormDialog
        open={showAccountForm}
        onClose={() => {
          setShowAccountForm(false);
          setEditingAccount(null);
        }}
        account={editingAccount}
        onSave={handleSaveAccount}
      />
    </div>
  );
}