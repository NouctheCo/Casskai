// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/contexts/LocaleContext';
import { useToast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Search, 
  BookOpen, 
  Edit, 
  Trash2, 
  Download,
  Upload,
  FileText,
  CheckCircle,
  X,
  Save,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function ChartOfAccountsTab() {
  const { t } = useLocale();
  const { toast } = useToast();

  // États
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // État du formulaire
  const [accountForm, setAccountForm] = useState({
    code: '',
    name: '',
    class: '',
    type: '',
    parentCode: '',
    description: '',
    budgetCategory: '',
    isActive: true
  });

  // Données simulées
  const accountClasses = [
    { value: '1', label: 'Classe 1 - Comptes de capitaux' },
    { value: '2', label: 'Classe 2 - Comptes d\'immobilisations' },
    { value: '3', label: 'Classe 3 - Comptes de stocks' },
    { value: '4', label: 'Classe 4 - Comptes de tiers' },
    { value: '5', label: 'Classe 5 - Comptes financiers' },
    { value: '6', label: 'Classe 6 - Comptes de charges' },
    { value: '7', label: 'Classe 7 - Comptes de produits' },
    { value: '8', label: 'Classe 8 - Comptes spéciaux' }
  ];

  const accountTypes = [
    { value: 'ASSET', label: 'Actif' },
    { value: 'LIABILITY', label: 'Passif' },
    { value: 'EQUITY', label: 'Capitaux propres' },
    { value: 'REVENUE', label: 'Produit' },
    { value: 'EXPENSE', label: 'Charge' }
  ];

  const budgetCategories = [
    { value: '', label: 'Aucune catégorie' },
    { value: 'operating_expenses', label: 'Charges d\'exploitation' },
    { value: 'personnel_costs', label: 'Charges de personnel' },
    { value: 'financial_expenses', label: 'Charges financières' },
    { value: 'operating_revenue', label: 'Produits d\'exploitation' },
    { value: 'financial_revenue', label: 'Produits financiers' },
    { value: 'investments', label: 'Investissements' },
    { value: 'financing', label: 'Financement' }
  ];

  const mockAccounts = [
    {
      id: 1,
      code: '101000',
      name: 'Capital social',
      class: '1',
      type: 'EQUITY',
      parentCode: '10',
      description: 'Capital social de l\'entreprise',
      isActive: true,
      balance: 50000.00
    },
    {
      id: 2,
      code: '401000',
      name: 'Fournisseurs',
      class: '4',
      type: 'LIABILITY',
      parentCode: '40',
      description: 'Dettes fournisseurs',
      isActive: true,
      balance: -15000.00
    },
    {
      id: 3,
      code: '411000',
      name: 'Clients',
      class: '4',
      type: 'ASSET',
      parentCode: '41',
      description: 'Créances clients',
      isActive: true,
      balance: 25000.00
    },
    {
      id: 4,
      code: '445710',
      name: 'TVA collectée',
      class: '4',
      type: 'LIABILITY',
      parentCode: '4457',
      description: 'TVA collectée sur les ventes',
      isActive: true,
      balance: -3000.00
    },
    {
      id: 5,
      code: '512000',
      name: 'Banque',
      class: '5',
      type: 'ASSET',
      parentCode: '51',
      description: 'Compte bancaire principal',
      isActive: true,
      balance: 75000.00
    },
    {
      id: 6,
      code: '601000',
      name: 'Achats stockés - Matières premières',
      class: '6',
      type: 'EXPENSE',
      parentCode: '60',
      description: 'Achats de matières premières',
      isActive: true,
      balance: 12000.00
    },
    {
      id: 7,
      code: '701000',
      name: 'Ventes de produits finis',
      class: '7',
      type: 'REVENUE',
      parentCode: '70',
      description: 'Chiffre d\'affaires produits finis',
      isActive: true,
      balance: -80000.00
    },
    {
      id: 8,
      code: '530000',
      name: 'Caisse',
      class: '5',
      type: 'ASSET',
      parentCode: '53',
      description: 'Caisse espèces',
      isActive: false,
      balance: 0.00
    }
  ];

  // Gestion du formulaire
  const handleFormChange = (field, value) => {
    setAccountForm(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setAccountForm({
      code: '',
      name: '',
      class: '',
      type: '',
      parentCode: '',
      description: '',
      isActive: true
    });
  };

  const handleNewAccount = () => {
    resetForm();
    setEditingAccount(null);
    setShowAccountForm(true);
  };

  const handleEditAccount = (account) => {
    setAccountForm({
      code: account.code,
      name: account.name,
      class: account.class,
      type: account.type,
      parentCode: account.parentCode || '',
      description: account.description || '',
      isActive: account.isActive
    });
    setEditingAccount(account);
    setShowAccountForm(true);
  };

  const handleSaveAccount = async () => {
    // Validation
    if (!accountForm.code || !accountForm.name || !accountForm.class || !accountForm.type) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: "Veuillez remplir tous les champs obligatoires."
      });
      return;
    }

    // Vérification de l'unicité du code
    const existingAccount = mockAccounts.find(acc => 
      acc.code === accountForm.code && acc.id !== editingAccount?.id
    );
    if (existingAccount) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: "Ce numéro de compte existe déjà."
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulation de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: t('success'),
        description: editingAccount 
          ? "Compte modifié avec succès !" 
          : "Compte créé avec succès !",
        action: <CheckCircle className="text-green-500" />
      });
      
      setShowAccountForm(false);
      setEditingAccount(null);
      resetForm();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: "Erreur lors de la sauvegarde du compte."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (account) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le compte ${account.code} - ${account.name} ?`)) {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        toast({
          title: t('success'),
          description: "Compte supprimé avec succès !"
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: t('error'),
          description: "Erreur lors de la suppression du compte."
        });
      }
    }
  };

  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files[0];
      if (file) {
        toast({
          title: "Import en cours",
          description: `Traitement du fichier ${file.name}...`
        });
        // Simulation d'import
        setTimeout(() => {
          toast({
            title: t('success'),
            description: "Plan comptable importé avec succès !",
            action: <CheckCircle className="text-green-500" />
          });
        }, 2000);
      }
    };
    input.click();
  };

  const handleExportCSV = () => {
    toast({
      title: "Export en cours",
      description: "Génération du fichier CSV..."
    });
    
    // Simulation d'export
    setTimeout(() => {
      toast({
        title: t('success'),
        description: "Plan comptable exporté avec succès !"
      });
    }, 1000);
  };

  // Filtrage des données
  const filteredAccounts = mockAccounts.filter(account => {
    const matchesSearch = account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || account.class === selectedClass;
    const matchesType = selectedType === 'all' || account.type === selectedType;
    
    return matchesSearch && matchesClass && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAccounts = filteredAccounts.slice(startIndex, startIndex + itemsPerPage);

  const getTypeLabel = (type) => {
    const typeObj = accountTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  const getClassLabel = (classValue) => {
    const classObj = accountClasses.find(c => c.value === classValue);
    return classObj ? classObj.label : `Classe ${classValue}`;
  };

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t('chartOfAccounts', 'Plan comptable')}
          </CardTitle>
          <CardDescription>
            Gestion complète de votre plan comptable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">{t('search', 'Rechercher')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Rechercher par numéro ou nom de compte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:w-1/2">
              <div>
                <Label>Classe</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les classes</SelectItem>
                    {accountClasses.map(cls => (
                      <SelectItem key={cls.value} value={cls.value}>
                        {cls.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {accountTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2">
              <Button onClick={handleNewAccount} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                {t('newAccount', 'Nouveau compte')}
              </Button>
              <Button variant="outline" onClick={handleImportCSV}>
                <Upload className="mr-2 h-4 w-4" />
                Importer CSV
              </Button>
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Exporter CSV
              </Button>
            </div>
            
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setSelectedClass('all');
              setSelectedType('all');
            }}>
              {t('clearFilters', 'Effacer les filtres')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des comptes */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('accountNumber', 'N° Compte')}</TableHead>
                  <TableHead>{t('accountName', 'Nom du compte')}</TableHead>
                  <TableHead>{t('class', 'Classe')}</TableHead>
                  <TableHead>{t('type', 'Type')}</TableHead>
                  <TableHead className="text-right">{t('balance', 'Solde')}</TableHead>
                  <TableHead>{t('status', 'État')}</TableHead>
                  <TableHead className="text-center">{t('actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {paginatedAccounts.map((account, index) => (
                    <motion.tr
                      key={account.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-mono font-medium">{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          Classe {account.class}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getTypeLabel(account.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-mono ${
                        account.balance > 0 ? 'text-green-600' : 
                        account.balance < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {account.balance.toFixed(2)} €
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.isActive ? 'default' : 'secondary'}>
                          {account.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAccount(account)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive"
                            onClick={() => handleDeleteAccount(account)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredAccounts.length)} sur {filteredAccounts.length} comptes
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog du formulaire de compte */}
      <Dialog open={showAccountForm} onOpenChange={setShowAccountForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Modifier le compte' : 'Nouveau compte comptable'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Numéro de compte *</Label>
                <Input
                  id="code"
                  value={accountForm.code}
                  onChange={(e) => handleFormChange('code', e.target.value)}
                  placeholder="Ex: 411000"
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="parentCode">Compte parent</Label>
                <Input
                  id="parentCode"
                  value={accountForm.parentCode}
                  onChange={(e) => handleFormChange('parentCode', e.target.value)}
                  placeholder="Ex: 41"
                  className="font-mono"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="name">Nom du compte *</Label>
              <Input
                id="name"
                value={accountForm.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Ex: Clients"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="class">Classe *</Label>
                <Select value={accountForm.class} onValueChange={(value) => handleFormChange('class', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountClasses.map(cls => (
                      <SelectItem key={cls.value} value={cls.value}>
                        {cls.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select value={accountForm.type} onValueChange={(value) => handleFormChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
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
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={accountForm.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Description optionnelle du compte"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="budgetCategory">Catégorie budgétaire</Label>
              <Select value={accountForm.budgetCategory} onValueChange={(value) => handleFormChange('budgetCategory', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {budgetCategories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Utilisé pour la consolidation budgétaire et les rapports financiers
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={accountForm.isActive}
                onChange={(e) => handleFormChange('isActive', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive">Compte actif</Label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAccountForm(false)}>
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
              <Button onClick={handleSaveAccount} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editingAccount ? 'Modifier' : 'Créer'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}