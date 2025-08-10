import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/contexts/LocaleContext';
import { useToast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  FileText, 
  Calendar,
  CheckCircle,
  XCircle,
  Save,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

export default function JournalEntriesTab() {
  const { t } = useLocale();
  const { toast } = useToast();

  // États pour les filtres et pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJournal, setSelectedJournal] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // États pour le formulaire d'écriture
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // États du formulaire
  const [entryForm, setEntryForm] = useState({
    number: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    reference: '',
    description: '',
    journal: '',
    lines: [
      { account: '', description: '', debit: '', credit: '' },
      { account: '', description: '', debit: '', credit: '' }
    ]
  });

  // Données simulées
  const mockJournals = [
    { id: 'VTE', name: 'Journal des Ventes', type: 'sale' },
    { id: 'ACH', name: 'Journal des Achats', type: 'purchase' },
    { id: 'BQ1', name: 'Banque Principale', type: 'bank' },
    { id: 'CAI', name: 'Caisse', type: 'cash' },
    { id: 'OD', name: 'Opérations Diverses', type: 'miscellaneous' }
  ];

  const mockAccounts = [
    { code: '101000', name: 'Capital social' },
    { code: '401000', name: 'Fournisseurs' },
    { code: '411000', name: 'Clients' },
    { code: '445710', name: 'TVA collectée' },
    { code: '512000', name: 'Banque' },
    { code: '601000', name: 'Achats stockés' },
    { code: '701000', name: 'Ventes de produits finis' }
  ];

  const mockEntries = [
    {
      id: 1,
      number: 'ECR-001',
      date: '2024-01-15',
      reference: 'FAC-2024-001',
      description: 'Facture client ABC',
      journal: 'VTE',
      totalDebit: 1200.00,
      totalCredit: 1200.00,
      status: 'validated',
      lines: [
        { account: '411000', description: 'Facture client ABC', debit: 1200.00, credit: 0 },
        { account: '701000', description: 'Vente de marchandises', debit: 0, credit: 1000.00 },
        { account: '445710', description: 'TVA collectée', debit: 0, credit: 200.00 }
      ]
    },
    {
      id: 2,
      number: 'ECR-002',
      date: '2024-01-16',
      reference: 'FAC-F-001',
      description: 'Facture fournisseur XYZ',
      journal: 'ACH',
      totalDebit: 600.00,
      totalCredit: 600.00,
      status: 'draft',
      lines: [
        { account: '601000', description: 'Achat matières premières', debit: 500.00, credit: 0 },
        { account: '445660', description: 'TVA déductible', debit: 100.00, credit: 0 },
        { account: '401000', description: 'Fournisseur XYZ', debit: 0, credit: 600.00 }
      ]
    }
  ];

  // Génération automatique du numéro d'écriture
  const generateEntryNumber = () => {
    const lastNumber = mockEntries.length > 0 
      ? Math.max(...mockEntries.map(e => parseInt(e.number.split('-')[1]))) 
      : 0;
    return `ECR-${String(lastNumber + 1).padStart(3, '0')}`;
  };

  // Calcul des totaux
  const calculateTotals = (lines) => {
    const totalDebit = lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
    return { totalDebit, totalCredit, difference: totalDebit - totalCredit };
  };

  // Gestion du formulaire
  const handleFormChange = (field, value) => {
    setEntryForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...entryForm.lines];
    newLines[index][field] = value;
    
    // Si on saisit un débit, vider le crédit et vice versa
    if (field === 'debit' && value !== '') {
      newLines[index]['credit'] = '';
    } else if (field === 'credit' && value !== '') {
      newLines[index]['debit'] = '';
    }
    
    setEntryForm(prev => ({ ...prev, lines: newLines }));
  };

  const addLine = () => {
    setEntryForm(prev => ({
      ...prev,
      lines: [...prev.lines, { account: '', description: '', debit: '', credit: '' }]
    }));
  };

  const removeLine = (index) => {
    if (entryForm.lines.length > 2) {
      const newLines = entryForm.lines.filter((_, i) => i !== index);
      setEntryForm(prev => ({ ...prev, lines: newLines }));
    }
  };

  const handleNewEntry = () => {
    setEntryForm({
      number: generateEntryNumber(),
      date: format(new Date(), 'yyyy-MM-dd'),
      reference: '',
      description: '',
      journal: '',
      lines: [
        { account: '', description: '', debit: '', credit: '' },
        { account: '', description: '', debit: '', credit: '' }
      ]
    });
    setEditingEntry(null);
    setShowEntryForm(true);
  };

  const handleEditEntry = (entry) => {
    setEntryForm({
      number: entry.number,
      date: entry.date,
      reference: entry.reference,
      description: entry.description,
      journal: entry.journal,
      lines: entry.lines.map(line => ({
        account: line.account,
        description: line.description,
        debit: line.debit.toString(),
        credit: line.credit.toString()
      }))
    });
    setEditingEntry(entry);
    setShowEntryForm(true);
  };

  const handleSaveEntry = async () => {
    const totals = calculateTotals(entryForm.lines);
    
    // Validation de l'équilibre
    if (Math.abs(totals.difference) > 0.01) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('balanceError', 'Le débit et le crédit doivent être équilibrés.')
      });
      return;
    }

    // Validation des champs obligatoires
    if (!entryForm.description || !entryForm.journal || entryForm.lines.some(line => !line.account)) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: "Veuillez remplir tous les champs obligatoires."
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulation de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: t('success'),
        description: editingEntry 
          ? "Écriture modifiée avec succès !" 
          : "Écriture créée avec succès !",
        action: <CheckCircle className="text-green-500" />
      });
      
      setShowEntryForm(false);
      setEditingEntry(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: "Erreur lors de la sauvegarde de l'écriture."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrage des données
  const filteredEntries = mockEntries.filter(entry => {
    const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJournal = selectedJournal === 'all' || entry.journal === selectedJournal;
    const matchesDate = (!dateFrom || entry.date >= dateFrom) && (!dateTo || entry.date <= dateTo);
    
    return matchesSearch && matchesJournal && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntries = filteredEntries.slice(startIndex, startIndex + itemsPerPage);

  const currentTotals = calculateTotals(entryForm.lines);

  return (
    <div className="space-y-6">
      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('accountingEntries', 'Écritures comptables')}
          </CardTitle>
          <CardDescription>
            Gestion et suivi de toutes vos écritures comptables
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
                  placeholder="Rechercher par référence, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:w-2/3">
              <div>
                <Label>{t('journal', 'Journal')}</Label>
                <Select value={selectedJournal} onValueChange={setSelectedJournal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les journaux" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les journaux</SelectItem>
                    {mockJournals.map(journal => (
                      <SelectItem key={journal.id} value={journal.id}>
                        {journal.id} - {journal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>{t('dateFrom', 'Date de début')}</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              
              <div>
                <Label>{t('dateTo', 'Date de fin')}</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <Button onClick={handleNewEntry} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              {t('newEntry', 'Nouvelle écriture')}
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setSelectedJournal('all');
                setSelectedAccount('all');
                setDateFrom('');
                setDateTo('');
              }}>
                {t('clearFilters', 'Effacer les filtres')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des écritures */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('numberShort', 'N°')}</TableHead>
                  <TableHead>{t('date', 'Date')}</TableHead>
                  <TableHead>{t('reference', 'Référence')}</TableHead>
                  <TableHead>{t('description', 'Description')}</TableHead>
                  <TableHead>{t('journal', 'Journal')}</TableHead>
                  <TableHead className="text-right">{t('debit', 'Débit')}</TableHead>
                  <TableHead className="text-right">{t('credit', 'Crédit')}</TableHead>
                  <TableHead>{t('status', 'État')}</TableHead>
                  <TableHead className="text-center">{t('actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {paginatedEntries.map((entry, index) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">{entry.number}</TableCell>
                      <TableCell>{format(new Date(entry.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{entry.reference}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.journal}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.totalDebit.toFixed(2)} €
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.totalCredit.toFixed(2)} €
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.status === 'validated' ? 'default' : 'secondary'}>
                          {entry.status === 'validated' ? (
                            <><CheckCircle className="mr-1 h-3 w-3" /> Validée</>
                          ) : (
                            <><XCircle className="mr-1 h-3 w-3" /> Brouillon</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditEntry(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive">
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
                Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredEntries.length)} sur {filteredEntries.length} écritures
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

      {/* Dialog du formulaire d'écriture */}
      <Dialog open={showEntryForm} onOpenChange={setShowEntryForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Modifier l\'écriture' : 'Nouvelle écriture comptable'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* En-tête de l'écriture */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="number">Numéro *</Label>
                <Input
                  id="number"
                  value={entryForm.number}
                  onChange={(e) => handleFormChange('number', e.target.value)}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={entryForm.date}
                  onChange={(e) => handleFormChange('date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="journal">Journal *</Label>
                <Select value={entryForm.journal} onValueChange={(value) => handleFormChange('journal', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un journal" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockJournals.map(journal => (
                      <SelectItem key={journal.id} value={journal.id}>
                        {journal.id} - {journal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reference">Référence</Label>
                <Input
                  id="reference"
                  value={entryForm.reference}
                  onChange={(e) => handleFormChange('reference', e.target.value)}
                  placeholder="FAC-2024-001"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={entryForm.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Description de l'écriture"
              />
            </div>

            {/* Lignes d'écriture */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <Label className="text-lg font-semibold">Lignes d'écriture</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une ligne
                </Button>
              </div>
              
              <div className="space-y-3">
                {entryForm.lines.map((line, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 border rounded-lg"
                  >
                    <div className="md:col-span-3">
                      <Label>Compte *</Label>
                      <Select 
                        value={line.account} 
                        onValueChange={(value) => handleLineChange(index, 'account', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockAccounts.map(account => (
                            <SelectItem key={account.code} value={account.code}>
                              {account.code} - {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-4">
                      <Label>Description</Label>
                      <Input
                        value={line.description}
                        onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                        placeholder="Description de la ligne"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Débit</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.debit}
                        onChange={(e) => handleLineChange(index, 'debit', e.target.value)}
                        placeholder="0.00"
                        className="text-right"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Crédit</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.credit}
                        onChange={(e) => handleLineChange(index, 'credit', e.target.value)}
                        placeholder="0.00"
                        className="text-right"
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLine(index)}
                        disabled={entryForm.lines.length <= 2}
                        className="text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Totaux */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">Total Débit</div>
                  <div className="text-lg font-semibold">{currentTotals.totalDebit.toFixed(2)} €</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Crédit</div>
                  <div className="text-lg font-semibold">{currentTotals.totalCredit.toFixed(2)} €</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Différence</div>
                  <div className={`text-lg font-semibold ${Math.abs(currentTotals.difference) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                    {currentTotals.difference.toFixed(2)} €
                    {Math.abs(currentTotals.difference) < 0.01 ? (
                      <CheckCircle className="inline ml-2 h-4 w-4" />
                    ) : (
                      <XCircle className="inline ml-2 h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowEntryForm(false)}>
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
              <Button onClick={handleSaveEntry} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editingEntry ? 'Modifier' : 'Enregistrer'}
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