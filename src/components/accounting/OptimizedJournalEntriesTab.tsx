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

import { useToast } from '@/components/ui/use-toast';
import { journalEntriesService } from '@/services/journalEntriesService';
import { useAuth } from '@/contexts/AuthContext';
import { useJournalEntries } from '@/hooks/useJournalEntries';

import {

  Plus,

  Search,

  Edit,

  Trash2,

  Eye,

  FileText,

  ChevronDown,

  ChevronRight,

  CheckCircle,

  AlertCircle,

  Zap,

  RefreshCw

} from 'lucide-react';



function useEntryFormState(entry) {

  const [formData, setFormData] = useState({

    date: new Date().toISOString().split('T')[0],

    reference: '',

    description: '',

    lines: [

      { account: '', description: '', debit: '', credit: '' },

      { account: '', description: '', debit: '', credit: '' }

    ]

  });



  useEffect(() => {

    if (entry) {

      setFormData({

        date: entry.date,

        reference: entry.reference,

        description: entry.description,

        lines: entry.lines || [{ account: '', description: '', debit: '', credit: '' }]

      });

    }

  }, [entry]);



  return { formData, setFormData };

}



function EntryLineForm({ line, index, updateLine, removeLine, canRemove, accounts }) {

  return (

    <motion.div

      initial={{ opacity: 0, y: 10 }}

      animate={{ opacity: 1, y: 0 }}

      className="grid md:grid-cols-5 gap-4 p-4 border rounded-lg"

    >

      <div className="space-y-2">

        <Label>Compte</Label>

        <Select

          value={line.account}

          onValueChange={(value) => updateLine(index, 'account', value)}

        >

          <SelectTrigger>

            <SelectValue placeholder="Sélectionner" />

          </SelectTrigger>

          <SelectContent>

            {accounts.map((account) => (

              <SelectItem key={account.id} value={account.id}>

                {account.account_number} - {account.account_name}

              </SelectItem>

            ))}

          </SelectContent>

        </Select>

      </div>

      <div className="space-y-2">

        <Label>Libellé</Label>

        <Input

          placeholder="Libellé de la ligne"

          value={line.description}

          onChange={(e) => updateLine(index, 'description', e.target.value)}

        />

      </div>

      <div className="space-y-2">

        <Label>Débit</Label>

        <Input

          type="number"

          step="0.01"

          placeholder="0.00"

          value={line.debit}

          onChange={(e) => updateLine(index, 'debit', e.target.value)}

        />

      </div>

      <div className="space-y-2">

        <Label>Crédit</Label>

        <Input

          type="number"

          step="0.01"

          placeholder="0.00"

          value={line.credit}

          onChange={(e) => updateLine(index, 'credit', e.target.value)}

        />

      </div>

      <div className="flex items-end">

        <Button

          variant="outline"

          size="sm"

          onClick={() => removeLine(index)}

          disabled={!canRemove}

        >

          <Trash2 className="w-4 h-4" />

        </Button>

      </div>

    </motion.div>

  );

}



function EntryTotals({ totals }) {

  return (

    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">

      <div className="grid md:grid-cols-3 gap-4 text-sm">

        <div className="flex justify-between">

          <span className="font-medium">Total Débit:</span>

          <span className="font-mono">{totals.totalDebit.toFixed(2)} €</span>

        </div>

        <div className="flex justify-between">

          <span className="font-medium">Total Crédit:</span>

          <span className="font-mono">{totals.totalCredit.toFixed(2)} €</span>

        </div>

        <div className="flex justify-between items-center">

          <span className="font-medium">Équilibre:</span>

          <div className="flex items-center space-x-2">

            {totals.isBalanced ? (

              <CheckCircle className="w-4 h-4 text-green-500" />

            ) : (

              <AlertCircle className="w-4 h-4 text-red-500" />

            )}

            <span className={totals.isBalanced ? 'text-green-600' : 'text-red-600'}>

              {totals.isBalanced ? 'Équilibrée' : 'Non équilibrée'}

            </span>

          </div>

        </div>

      </div>

    </div>

  );

}



const EntryFormDialog = ({ open, onClose, entry = null, onSave, accounts }) => {

  const { toast } = useToast();

  const { formData, setFormData } = useEntryFormState(entry);



  const addLine = () => {

    setFormData(prev => ({

      ...prev,

      lines: [...prev.lines, { account: '', description: '', debit: '', credit: '' }]

    }));

  };

  const removeLine = (index) => {

    if (formData.lines.length > 2) {

      setFormData(prev => ({

        ...prev,

        lines: prev.lines.filter((_, i) => i !== index)

      }));

    }

  };

  const updateLine = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => {
        if (i === index) {
          const updatedLine = { ...line, [field]: value };
          
          // Auto-fill description when account is selected
          if (field === 'account' && value) {
            const selectedAccount = accounts.find(account => account.id === value);
            if (selectedAccount && !line.description) {
              updatedLine.description = selectedAccount.account_name;
            }
          }
          
          return updatedLine;
        }
        return line;
      })
    }));
  };

  const calculateTotals = () => {

    const totalDebit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);

    const totalCredit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);

    return { totalDebit, totalCredit, isBalanced: totalDebit === totalCredit };

  };

  const totals = calculateTotals();

  const handleSave = () => {

    if (!totals.isBalanced) {

      toast({

        title: "Écriture non équilibrée",

        description: "Le total des débits doit être égal au total des crédits.",

        variant: "destructive"

      });

      return;

    }

    onSave({

      ...formData,

      id: entry?.id || Date.now(),

      status: 'draft',

      totalDebit: totals.totalDebit,

      totalCredit: totals.totalCredit

    });

    toast({

      title: entry ? "Écriture modifiée" : "Écriture créée",

      description: "L'écriture a été enregistrée avec succès."

    });

    onClose();

  };

  return (

    <Dialog open={open} onOpenChange={onClose}>

      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">

        <DialogHeader>

          <DialogTitle className="flex items-center space-x-2">

            <FileText className="w-5 h-5 text-blue-500" />

            <span>{entry ? 'Modifier l\'écriture' : 'Nouvelle écriture'}</span>

          </DialogTitle>

        </DialogHeader>

        <div className="space-y-6">

          {/* Entry Header */}

          <div className="grid md:grid-cols-3 gap-4">

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

              <Label htmlFor="reference">Référence</Label>

              <Input

                id="reference"

                placeholder="Ex: FAC-001"

                value={formData.reference}

                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}

              />

            </div>

            <div className="space-y-2">

              <Label htmlFor="description">Description</Label>

              <Input

                id="description"

                placeholder="Description de l'écriture"

                value={formData.description}

                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}

              />

            </div>

          </div>

          {/* Entry Lines */}

          <Card>

            <CardHeader>

              <div className="flex items-center justify-between">

                <CardTitle className="text-lg">Lignes d'écriture</CardTitle>

                <Button onClick={addLine} size="sm">

                  <Plus className="w-4 h-4 mr-2" />

                  Ajouter une ligne

                </Button>

              </div>

            </CardHeader>

            <CardContent>

              <div className="space-y-4">

                {formData.lines.map((line, index) => (

                  <EntryLineForm

                    key={index}

                    line={line}

                    index={index}

                    updateLine={updateLine}

                    removeLine={removeLine}

                    canRemove={formData.lines.length > 2}

                    accounts={accounts}

                  />

                ))}

              </div>

              {/* Totals */}

              <EntryTotals totals={totals} />

            </CardContent>

          </Card>

        </div>

        <DialogFooter>

          <Button variant="outline" onClick={onClose}>

            Annuler

          </Button>

          <Button onClick={handleSave} disabled={!totals.isBalanced}>

            <CheckCircle className="w-4 h-4 mr-2" />

            {entry ? 'Modifier' : 'Enregistrer'}

          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>

  );

};



// Entry Preview Dialog Component

const EntryPreviewDialog = ({ open, onClose, entry }) => {

  if (!entry) return null;



  const getStatusBadge = (status) => {

    switch (status) {

      case 'validated':

        return <Badge className="bg-green-100 text-green-800 border-green-200">Validée</Badge>;

      case 'draft':

        return <Badge variant="secondary">Brouillon</Badge>;

      case 'pending':

        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>;

      default:

        return <Badge variant="outline">Inconnue</Badge>;

    }

  };



  return (

    <Dialog open={open} onOpenChange={onClose}>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">

        <DialogHeader>

          <DialogTitle className="flex items-center space-x-3">

            <FileText className="w-5 h-5 text-blue-500" />

            <span>Détails de l'écriture - {entry.reference}</span>

          </DialogTitle>

        </DialogHeader>



        <div className="space-y-6">

          {/* Entry Header */}

          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">

            <div>

              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Référence</Label>

              <p className="text-lg font-semibold">{entry.reference}</p>

            </div>

            <div>

              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Statut</Label>

              <div className="mt-1">{getStatusBadge(entry.status)}</div>

            </div>

          </div>



          {/* Entry Details */}

          <div className="grid grid-cols-2 gap-6">

            <div className="space-y-4">

              <div>

                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date</Label>

                <p className="text-base">{new Date(entry.date).toLocaleDateString('fr-FR')}</p>

              </div>

            </div>



            <div className="space-y-4">

              <div>

                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</Label>

                <p className="text-base">{entry.description}</p>

              </div>

            </div>

          </div>



          {/* Entry Lines */}

          <div className="space-y-4">

            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Lignes d'écriture</h3>

            <div className="rounded-md border">

              <Table>

                <TableHeader>

                  <TableRow>

                    <TableHead>Compte</TableHead>

                    <TableHead>Libellé</TableHead>

                    <TableHead className="text-right">Débit</TableHead>

                    <TableHead className="text-right">Crédit</TableHead>

                  </TableRow>

                </TableHeader>

                <TableBody>

                  {entry.lines?.map((line, index) => (

                    <TableRow key={index}>

                      <TableCell className="font-mono">{line.account}</TableCell>

                      <TableCell>{line.description}</TableCell>

                      <TableCell className="text-right font-mono">

                        {line.debit ? `${parseFloat(line.debit).toFixed(2)} €` : ''}

                      </TableCell>

                      <TableCell className="text-right font-mono">

                        {line.credit ? `${parseFloat(line.credit).toFixed(2)} €` : ''}

                      </TableCell>

                    </TableRow>

                  ))}

                </TableBody>

              </Table>

            </div>

          </div>



          {/* Totals */}

          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">

            <div className="text-center">

              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Débit</Label>

              <p className="text-xl font-bold text-red-600">{entry.totalDebit?.toFixed(2)} €</p>

            </div>

            <div className="text-center">

              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Crédit</Label>

              <p className="text-xl font-bold text-green-600">{entry.totalCredit?.toFixed(2)} €</p>

            </div>

          </div>



          {/* Balance Status */}

          <div className="text-center">

            {entry.totalDebit === entry.totalCredit ? (

              <div className="flex items-center justify-center space-x-2 text-green-600">

                <CheckCircle className="w-5 h-5" />

                <span className="font-medium">Écriture équilibrée</span>

              </div>

            ) : (

              <div className="flex items-center justify-center space-x-2 text-red-600">

                <AlertCircle className="w-5 h-5" />

                <span className="font-medium">Écriture non équilibrée</span>

              </div>

            )}

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

};



// Entry Row Component

const EntryRow = ({ entry, onEdit, onDelete, onView }) => {

  const [expanded, setExpanded] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  // Simuler un contrôle RBAC (à remplacer par vrai hook/context)

  const userCanEdit = true; // TODO: remplacer par vrai contrôle

  const userCanDelete = true;

  const userCanView = true;



  const getStatusBadge = (status) => {

    switch (status) {

      case 'validated':

        return <Badge className="bg-green-100 text-green-800 border-green-200">Validée</Badge>;

      case 'draft':

        return <Badge variant="secondary">Brouillon</Badge>;

      case 'pending':

        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>;

      default:

        return <Badge variant="outline">Inconnue</Badge>;

    }

  };



  return (

    <>

      <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800/50">

        <TableCell>

          <Button

            variant="ghost"

            size="sm"

            onClick={() => setExpanded(!expanded)}

          >

            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}

          </Button>

        </TableCell>

        <TableCell className="font-medium">{entry.reference}</TableCell>

        <TableCell>{new Date(entry.date).toLocaleDateString('fr-FR')}</TableCell>

        <TableCell className="max-w-xs truncate">{entry.description}</TableCell>

        <TableCell className="text-right font-mono">

          {entry.totalDebit?.toFixed(2)} €

        </TableCell>

        <TableCell className="text-right font-mono">

          {entry.totalCredit?.toFixed(2)} €

        </TableCell>

        <TableCell>{getStatusBadge(entry.status)}</TableCell>

        <TableCell>

          <div className="flex items-center space-x-2">

            <Button variant="ghost" size="sm" onClick={() => userCanView && onView(entry)} disabled={!userCanView}>

              <Eye className="w-4 h-4" />

            </Button>

            <Button variant="ghost" size="sm" onClick={() => userCanEdit && onEdit(entry)} disabled={!userCanEdit}>

              <Edit className="w-4 h-4" />

            </Button>

            <Button variant="ghost" size="sm" onClick={async () => {

              if (!userCanDelete) return;

              setIsDeleting(true);

              await new Promise(r => setTimeout(r, 600)); // Simule async

              onDelete(entry);

              setIsDeleting(false);

            }} disabled={!userCanDelete || isDeleting}>

              {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}

            </Button>

          </div>

        </TableCell>

      </TableRow>

      {expanded && entry.lines && (

        <TableRow>

          <TableCell colSpan={8} className="bg-gray-50 dark:bg-gray-800/30">

            <div className="p-4 space-y-2">

              <h4 className="font-medium text-sm">Détail des lignes:</h4>

              {entry.lines.map((line, index) => (

                <div key={index} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">

                  <span>{line.account} - {line.description}</span>

                  <span>

                    {line.debit && `D: ${parseFloat(line.debit).toFixed(2)}€`}

                    {line.credit && `C: ${parseFloat(line.credit).toFixed(2)}€`}

                  </span>

                </div>

              ))}

            </div>

          </TableCell>

        </TableRow>

      )}

    </>

  );

};



export default function OptimizedJournalEntriesTab() {

  const { toast } = useToast();

  const { currentCompany } = useAuth();
  const { createJournalEntry, loading: hookLoading, error: hookError, getAccountsList } = useJournalEntries(currentCompany?.id || '');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);

  // Charger les écritures réelles depuis Supabase
  useEffect(() => {
    loadEntries();
    loadAccounts();
  }, [currentCompany?.id]);

  const loadAccounts = async () => {
    if (!currentCompany?.id) return;

    try {
      const accountsList = await getAccountsList();
      setAccounts(accountsList);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadEntries = async () => {
    if (!currentCompany?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await journalEntriesService.getJournalEntries(currentCompany.id, {
        limit: 100,
        sortBy: 'entry_date',
        sortOrder: 'desc'
      });

      if (result.success && result.data) {
        // Transformer les données Supabase en format UI
        const transformedEntries = result.data.data.map(entry => ({
          id: entry.id,
          reference: entry.entry_number || entry.reference_number || 'N/A',
          date: entry.entry_date,
          description: entry.description || '',
          totalDebit: (entry.journal_entry_lines || []).reduce((sum, item) => sum + (Number(item.debit_amount) || 0), 0),
          totalCredit: (entry.journal_entry_lines || []).reduce((sum, item) => sum + (Number(item.credit_amount) || 0), 0),
          status: entry.status === 'posted' ? 'validated' : 'draft',
          lines: (entry.journal_entry_lines || []).map(item => ({
            account: item.chart_of_accounts?.account_number || '',
            description: item.description || '',
            debit: item.debit_amount?.toString() || '',
            credit: item.credit_amount?.toString() || ''
          }))
        }));
        setEntries(transformedEntries);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les écritures",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock data commenté - remplacé par vraies données
  /*const [entries, setEntries] = useState([
    {
      id: 1,
      reference: 'VTE-001',
      date: '2024-01-15',
      description: 'Facture client ABC Corp',
      totalDebit: 1200.00,
      totalCredit: 1200.00,
      status: 'validated',
      lines: []
    },
    {
      id: 2,
      reference: 'ACH-001',
      date: '2024-01-16',
      description: 'Achat matières premières',
      totalDebit: 600.00,
      totalCredit: 600.00,
      status: 'draft',
      lines: []
    }
  ]);*/



  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

  const [showEntryForm, setShowEntryForm] = useState(false);

  const [editingEntry, setEditingEntry] = useState(null);

  const [previewEntry, setPreviewEntry] = useState(null);



  const filteredEntries = entries.filter(entry => {

    const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||

                         entry.reference.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;

    return matchesSearch && matchesStatus;

  });



  const handleSaveEntry = async (entryData) => {
    console.log('[OptimizedJournalEntriesTab] handleSaveEntry called with:', entryData);

    if (!currentCompany?.id) {
      toast({
        title: "Erreur",
        description: "Aucune entreprise sélectionnée",
        variant: "destructive"
      });
      return;
    }

    try {
      // Convertir les données du formulaire au format attendu par le hook
      const journalEntryData = {
        date: entryData.date,
        description: entryData.description,
        reference: entryData.reference,
        items: entryData.lines.map(line => ({
          account_id: line.account, // Maintenant line.account contient déjà l'UUID
          description: line.description,
          debit_amount: parseFloat(line.debit) || 0,
          credit_amount: parseFloat(line.credit) || 0
        }))
      };

      console.log('[OptimizedJournalEntriesTab] Calling createJournalEntry with:', journalEntryData);

      const result = await createJournalEntry(journalEntryData);

      if (result) {
        console.log('[OptimizedJournalEntriesTab] Entry created successfully:', result);
        toast({
          title: "Écriture créée",
          description: "L'écriture a été enregistrée avec succès en base de données."
        });

        // Recharger les données depuis Supabase
        await loadEntries();

        setShowEntryForm(false);
        setEditingEntry(null);
      } else {
        throw new Error('Échec de la création de l\'écriture');
      }
    } catch (error) {
      console.error('[OptimizedJournalEntriesTab] Error creating entry:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer l'écriture",
        variant: "destructive"
      });
    }
  };



  const handleEditEntry = (entry) => {

    setEditingEntry(entry);

    setShowEntryForm(true);

  };



  const handleDeleteEntry = async (entry) => {
    // Confirmation
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette écriture ? Cette action est irréversible.')) {
      return;
    }

    if (!currentCompany?.id) {
      toast({
        title: "Erreur",
        description: "Aucune entreprise sélectionnée",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🗑️ Début suppression écriture:', entry.id);

      // ✅ SUPPRESSION RÉELLE EN BASE DE DONNÉES
      const result = await journalEntriesService.deleteJournalEntry(entry.id, currentCompany.id);

      if (result.success) {
        toast({
          title: "Écriture supprimée",
          description: "L'écriture a été supprimée définitivement de la base de données."
        });

        // ✅ RECHARGER LA LISTE DEPUIS LA BASE (pas juste filtrer localement)
        await loadEntries();

        console.log('✅ Écriture supprimée et liste rechargée');
      } else {
        throw new Error('Échec de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      toast({
        title: "Erreur de suppression",
        description: error instanceof Error ? error.message : "Impossible de supprimer l'écriture",
        variant: "destructive"
      });
    }
  };



  const handleViewEntry = (entry) => {

    setPreviewEntry(entry);

  };



  const summary = {

    totalEntries: entries.length,

    totalDebit: entries.reduce((sum, entry) => sum + entry.totalDebit, 0),

    totalCredit: entries.reduce((sum, entry) => sum + entry.totalCredit, 0),

    validatedEntries: entries.filter(e => e.status === 'validated').length

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

                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total écritures</p>

                <p className="text-2xl font-bold">{summary.totalEntries}</p>

              </div>

            </div>

          </CardContent>

        </Card>

        

        <Card>

          <CardContent className="p-4">

            <div className="flex items-center space-x-2">

              <CheckCircle className="w-5 h-5 text-green-500" />

              <div>

                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Validées</p>

                <p className="text-2xl font-bold">{summary.validatedEntries}</p>

              </div>

            </div>

          </CardContent>

        </Card>

        

        <Card>

          <CardContent className="p-4">

            <div className="flex items-center space-x-2">

              <Zap className="w-5 h-5 text-purple-500" />

              <div>

                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total débits</p>

                <p className="text-xl font-bold">{summary.totalDebit.toFixed(2)} €</p>

              </div>

            </div>

          </CardContent>

        </Card>

        

        <Card>

          <CardContent className="p-4">

            <div className="flex items-center space-x-2">

              <Zap className="w-5 h-5 text-orange-500" />

              <div>

                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total crédits</p>

                <p className="text-xl font-bold">{summary.totalCredit.toFixed(2)} €</p>

              </div>

            </div>

          </CardContent>

        </Card>

      </div>



      {/* Actions and Filters */}

      <Card>

        <CardHeader>

          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">

            <CardTitle className="flex items-center space-x-2">

              <FileText className="w-5 h-5 text-blue-500" />

              <span>Écritures comptables</span>

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

                  <SelectItem value="validated">Validées</SelectItem>

                  <SelectItem value="draft">Brouillons</SelectItem>

                  <SelectItem value="pending">En attente</SelectItem>

                </SelectContent>

              </Select>

              

              <Button onClick={() => setShowEntryForm(true)}>

                <Plus className="w-4 h-4 mr-2" />

                Nouvelle écriture

              </Button>

            </div>

          </div>

        </CardHeader>

        

        <CardContent>

          <div className="rounded-md border">

            <Table>

              <TableHeader>

                <TableRow>

                  <TableHead className="w-12"></TableHead>

                  <TableHead>Référence</TableHead>

                  <TableHead>Date</TableHead>

                  <TableHead>Description</TableHead>

                  <TableHead className="text-right">Débit</TableHead>

                  <TableHead className="text-right">Crédit</TableHead>

                  <TableHead>Statut</TableHead>

                  <TableHead className="text-right">Actions</TableHead>

                </TableRow>

              </TableHeader>

              <TableBody>

                {filteredEntries.map((entry) => (

                  <EntryRow

                    key={entry.id}

                    entry={entry}

                    onEdit={handleEditEntry}

                    onDelete={handleDeleteEntry}

                    onView={handleViewEntry}

                  />

                ))}

              </TableBody>

            </Table>

          </div>

        </CardContent>

      </Card>



      {/* Entry Form Dialog */}

      <EntryFormDialog

        open={showEntryForm}

        onClose={() => {

          setShowEntryForm(false);

          setEditingEntry(null);

        }}

        entry={editingEntry}

        onSave={handleSaveEntry}

        accounts={accounts}

      />



      <EntryPreviewDialog

        open={!!previewEntry}

        onClose={() => setPreviewEntry(null)}

        entry={previewEntry}

      />

    </div>

  );

}
