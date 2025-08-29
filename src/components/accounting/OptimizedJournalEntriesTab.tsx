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
import { 
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  Calendar,
  FileText,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react';

// Entry Form Component
const EntryFormDialog = ({ open, onClose, entry = null, onSave }) => {
  const { toast } = useToast();
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
      lines: prev.lines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      )
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
                  <motion.div
                    key={index}
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
                          <SelectItem value="411000">411000 - Clients</SelectItem>
                          <SelectItem value="701000">701000 - Ventes</SelectItem>
                          <SelectItem value="445710">445710 - TVA collectée</SelectItem>
                          <SelectItem value="512000">512000 - Banque</SelectItem>
                          <SelectItem value="607000">607000 - Achats</SelectItem>
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
                        disabled={formData.lines.length <= 2}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Totals */}
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

// Entry Row Component
const EntryRow = ({ entry, onEdit, onDelete, onView }) => {
  const [expanded, setExpanded] = useState(false);

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
            <Button variant="ghost" size="sm" onClick={() => onView(entry)}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(entry)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(entry)}>
              <Trash2 className="w-4 h-4" />
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
  const [entries, setEntries] = useState([
    {
      id: 1,
      reference: 'VTE-001',
      date: '2024-01-15',
      description: 'Facture client ABC Corp',
      totalDebit: 1200.00,
      totalCredit: 1200.00,
      status: 'validated',
      lines: [
        { account: '411000', description: 'Client ABC Corp', debit: '1200.00', credit: '' },
        { account: '701000', description: 'Vente produits', debit: '', credit: '1000.00' },
        { account: '445710', description: 'TVA collectée 20%', debit: '', credit: '200.00' }
      ]
    },
    {
      id: 2,
      reference: 'ACH-001',
      date: '2024-01-16',
      description: 'Achat matières premières',
      totalDebit: 600.00,
      totalCredit: 600.00,
      status: 'draft',
      lines: [
        { account: '601000', description: 'Matières premières', debit: '500.00', credit: '' },
        { account: '445660', description: 'TVA déductible', debit: '100.00', credit: '' },
        { account: '401000', description: 'Fournisseur XYZ', debit: '', credit: '600.00' }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSaveEntry = (entryData) => {
    if (editingEntry) {
      setEntries(prev => prev.map(entry => 
        entry.id === editingEntry.id ? { ...entryData, id: editingEntry.id } : entry
      ));
    } else {
      setEntries(prev => [...prev, { ...entryData, id: Date.now() }]);
    }
    setEditingEntry(null);
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
    // View entry details logic
    toast({
      title: "Détails de l'écriture",
      description: `Consultation de l'écriture ${entry.reference}`
    });
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
      />
    </div>
  );
}