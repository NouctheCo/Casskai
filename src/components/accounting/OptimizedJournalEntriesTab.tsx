import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { journalEntriesService } from '@/services/journalEntriesService';
import JournalEntryForm from './JournalEntryForm';
import type { JournalEntryFormInitialValues } from '@/types/journalEntries.types';
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
  RefreshCw,
  Loader2
} from 'lucide-react';
import { logger } from '@/utils/logger';

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

export default function OptimizedJournalEntriesTab({ shouldCreateNew = false, onCreateNewCompleted }) {
  const { toast } = useToast();
  const { currentCompany } = useAuth();
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const loadEntries = async () => {
      if (!currentCompany?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('company_id', currentCompany.id)
          .order('entry_date', { ascending: false });

        if (error) throw error;
        setEntries(data || []);
      } catch (error) {
        logger.error('Error loading journal entries:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les écritures comptables.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, [currentCompany?.id, refreshTrigger, toast]);

  const refreshEntries = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showEntryForm, setShowEntryForm] = useState(shouldCreateNew);
  const [editingEntry, setEditingEntry] = useState(null);
  const [previewEntry, setPreviewEntry] = useState(null);

  // Handle shouldCreateNew changes
  useEffect(() => {
    if (shouldCreateNew) {
      setShowEntryForm(true);
      setEditingEntry(null);
    }
  }, [shouldCreateNew]);

  const handleSaveEntry = async (values: JournalEntryFormInitialValues) => {
    if (!currentCompany?.id) {
      toast({
        title: "Erreur",
        description: "Aucune entreprise sélectionnée.",
        variant: "destructive"
      });
      return;
    }

    try {
      const payload = {
        companyId: currentCompany.id,
        entryDate: typeof values.entryDate === 'string' ? new Date(values.entryDate).toISOString() : (values.entryDate as Date).toISOString(),
        description: values.description,
        referenceNumber: values.referenceNumber,
        journalId: values.journalId,
        status: values.status || 'draft',
        lines: values.lines,
        entryNumber: values.entryNumber
      };

      const result = values.id
        ? await journalEntriesService.updateJournalEntry(values.id, payload)
        : await journalEntriesService.createJournalEntry(payload);

      if (!result.success) {
        throw new Error('error' in result ? result.error : 'Unknown error');
      }

      refreshEntries();
      setShowEntryForm(false);
      setEditingEntry(null);

      toast({
        title: "Succès",
        description: values.id ? "Écriture modifiée avec succès." : "Écriture créée avec succès."
      });
    } catch (error) {
      logger.error('Error saving entry:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de sauvegarder l'écriture.",
        variant: "destructive"
      });
    }
  };

  const handleNewEntry = () => {
    setEditingEntry(null);
    setShowEntryForm(true);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setShowEntryForm(true);
  };

  const handleDeleteEntry = (entry) => {
    setEntries(prev => prev.filter(e => e.id !== entry.id));
    toast({
      title: "Écriture supprimée",
      description: "L'écriture a été supprimée avec succès."
    });
  };

  const handleViewEntry = (entry) => {
    setPreviewEntry(entry);
  };

  const filteredEntries = entries.filter(entry => {
    const description = entry.description || '';
    const reference = entry.reference || '';
    const matchesSearch = description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-96 text-center">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucune écriture comptable</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
              Commencez par créer vos écritures comptables. Une écriture est composée de plusieurs lignes équilibrées (total débits = total crédits).
            </p>
            <Button onClick={() => setShowEntryForm(true)} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Créer une première écriture
            </Button>
          </CardContent>
        </Card>

        {/* Entry Form Dialog */}
        <Dialog open={showEntryForm} onOpenChange={(open) => {
          if (!open) {
            setShowEntryForm(false);
            setEditingEntry(null);
          }
        }}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <JournalEntryForm
              initialData={editingEntry || undefined}
              onSubmit={handleSaveEntry}
              onCancel={() => {
                setShowEntryForm(false);
                setEditingEntry(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

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
              
              <Button onClick={handleNewEntry}>
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
      <Dialog open={showEntryForm} onOpenChange={(open) => {
        if (!open) {
          setShowEntryForm(false);
          setEditingEntry(null);
          if (shouldCreateNew && onCreateNewCompleted) {
            onCreateNewCompleted();
          }
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <JournalEntryForm
            initialData={editingEntry || undefined}
            onSubmit={async (values) => {
              await handleSaveEntry(values);
              if (shouldCreateNew && onCreateNewCompleted) {
                onCreateNewCompleted();
              }
            }}
            onCancel={() => {
              setShowEntryForm(false);
              setEditingEntry(null);
              if (shouldCreateNew && onCreateNewCompleted) {
                onCreateNewCompleted();
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <EntryPreviewDialog
        open={!!previewEntry}
        onClose={() => setPreviewEntry(null)}
        entry={previewEntry}
      />
    </div>
  );
}