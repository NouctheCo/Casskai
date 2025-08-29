import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/contexts/LocaleContext';
import { useToast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  BarChartHorizontalBig,
  CheckCircle,
  XCircle,
  X,
  Save,
  Filter,
  FileText,
  CreditCard,
  ShoppingCart,
  Banknote,
  Settings
} from 'lucide-react';

export default function JournalsTab() {
  const { t } = useLocale();
  const { toast } = useToast();

  // États
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [editingJournal, setEditingJournal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // État du formulaire
  const [journalForm, setJournalForm] = useState({
    code: '',
    name: '',
    type: '',
    description: '',
    isActive: true
  });

  // Types de journaux
  const journalTypes = [
    { 
      value: 'sale', 
      label: 'Ventes', 
      icon: ShoppingCart,
      color: 'bg-green-500',
      description: 'Journal des ventes et factures clients'
    },
    { 
      value: 'purchase', 
      label: 'Achats', 
      icon: FileText,
      color: 'bg-blue-500',
      description: 'Journal des achats et factures fournisseurs'
    },
    { 
      value: 'bank', 
      label: 'Banque', 
      icon: CreditCard,
      color: 'bg-purple-500',
      description: 'Journal des opérations bancaires'
    },
    { 
      value: 'cash', 
      label: 'Caisse', 
      icon: Banknote,
      color: 'bg-orange-500',
      description: 'Journal des opérations de caisse'
    },
    { 
      value: 'miscellaneous', 
      label: 'Opérations diverses', 
      icon: Settings,
      color: 'bg-gray-500',
      description: 'Journal pour les autres opérations comptables'
    }
  ];

  // Données simulées
  const mockJournals = [
    {
      id: 1,
      code: 'VTE',
      name: 'Journal des Ventes',
      type: 'sale',
      description: 'Journal principal pour toutes les ventes',
      isActive: true,
      createdAt: '2024-01-01',
      entriesCount: 45,
      lastEntryDate: '2024-01-15'
    },
    {
      id: 2,
      code: 'ACH',
      name: 'Journal des Achats',
      type: 'purchase',
      description: 'Journal pour les achats et factures fournisseurs',
      isActive: true,
      createdAt: '2024-01-01',
      entriesCount: 32,
      lastEntryDate: '2024-01-14'
    },
    {
      id: 3,
      code: 'BQ1',
      name: 'Banque Principale',
      type: 'bank',
      description: 'Compte bancaire principal - Crédit Agricole',
      isActive: true,
      createdAt: '2024-01-01',
      entriesCount: 78,
      lastEntryDate: '2024-01-16'
    },
    {
      id: 4,
      code: 'CAI',
      name: 'Caisse Espèces',
      type: 'cash',
      description: 'Caisse pour les paiements en espèces',
      isActive: true,
      createdAt: '2024-01-01',
      entriesCount: 12,
      lastEntryDate: '2024-01-10'
    },
    {
      id: 5,
      code: 'OD',
      name: 'Opérations Diverses',
      type: 'miscellaneous',
      description: 'Journal pour les écritures diverses et de régularisation',
      isActive: true,
      createdAt: '2024-01-01',
      entriesCount: 23,
      lastEntryDate: '2024-01-12'
    },
    {
      id: 6,
      code: 'BQ2',
      name: 'Banque Secondaire',
      type: 'bank',
      description: 'Compte épargne entreprise',
      isActive: false,
      createdAt: '2024-01-01',
      entriesCount: 5,
      lastEntryDate: '2024-01-05'
    }
  ];

  // Gestion du formulaire
  const handleFormChange = (field, value) => {
    setJournalForm(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setJournalForm({
      code: '',
      name: '',
      type: '',
      description: '',
      isActive: true
    });
  };

  const generateJournalCode = (type) => {
    const typeMap = {
      'sale': 'VTE',
      'purchase': 'ACH',
      'bank': 'BQ',
      'cash': 'CAI',
      'miscellaneous': 'OD'
    };
    
    const baseCode = typeMap[type] || 'JNL';
    const existingSimilar = mockJournals.filter(j => j.code.startsWith(baseCode));
    
    if (existingSimilar.length === 0) {
      return baseCode;
    } else {
      return `${baseCode}${existingSimilar.length + 1}`;
    }
  };

  const handleNewJournal = () => {
    resetForm();
    setEditingJournal(null);
    setShowJournalForm(true);
  };

  const handleEditJournal = (journal) => {
    setJournalForm({
      code: journal.code,
      name: journal.name,
      type: journal.type,
      description: journal.description || '',
      isActive: journal.isActive
    });
    setEditingJournal(journal);
    setShowJournalForm(true);
  };

  const handleSaveJournal = async () => {
    // Validation
    if (!journalForm.code || !journalForm.name || !journalForm.type) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: "Veuillez remplir tous les champs obligatoires."
      });
      return;
    }

    // Vérification de l'unicité du code
    const existingJournal = mockJournals.find(j => 
      j.code === journalForm.code && j.id !== editingJournal?.id
    );
    if (existingJournal) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: "Ce code de journal existe déjà."
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulation de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: t('success'),
        description: editingJournal 
          ? "Journal modifié avec succès !" 
          : "Journal créé avec succès !",
        action: <CheckCircle className="text-green-500" />
      });
      
      setShowJournalForm(false);
      setEditingJournal(null);
      resetForm();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: "Erreur lors de la sauvegarde du journal."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteJournal = async (journal) => {
    if (journal.entriesCount > 0) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: "Impossible de supprimer un journal contenant des écritures."
      });
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer le journal ${journal.code} - ${journal.name} ?`)) {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        toast({
          title: t('success'),
          description: "Journal supprimé avec succès !"
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: t('error'),
          description: "Erreur lors de la suppression du journal."
        });
      }
    }
  };

  const toggleJournalStatus = async (journal) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: t('success'),
        description: `Journal ${journal.isActive ? 'désactivé' : 'activé'} avec succès !`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: "Erreur lors de la modification du statut."
      });
    }
  };

  // Filtrage des données
  const filteredJournals = mockJournals.filter(journal => {
    const matchesSearch = journal.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         journal.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || journal.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && journal.isActive) ||
                         (selectedStatus === 'inactive' && !journal.isActive);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeInfo = (type) => {
    return journalTypes.find(t => t.value === type) || { 
      label: type, 
      icon: Settings, 
      color: 'bg-gray-500' 
    };
  };

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartHorizontalBig className="h-5 w-5" />
            {t('journals', 'Journaux comptables')}
          </CardTitle>
          <CardDescription>
            Configuration et gestion de vos journaux comptables
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
                  placeholder="Rechercher par code ou nom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:w-1/2">
              <div>
                <Label>Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {journalTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Statut</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actifs</SelectItem>
                    <SelectItem value="inactive">Inactifs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <Button onClick={handleNewJournal} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              {t('newJournal', 'Nouveau journal')}
            </Button>
            
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setSelectedType('all');
              setSelectedStatus('all');
            }}>
              {t('clearFilters', 'Effacer les filtres')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des journaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredJournals.map((journal, index) => {
            const typeInfo = getTypeInfo(journal.type);
            const IconComponent = typeInfo.icon;
            
            return (
              <motion.div
                key={journal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`h-full transition-all duration-200 hover:shadow-lg ${
                  !journal.isActive ? 'opacity-60' : ''
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${typeInfo.color} text-white`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{journal.code}</CardTitle>
                          <p className="text-sm text-muted-foreground">{journal.name}</p>
                        </div>
                      </div>
                      <Badge variant={journal.isActive ? 'default' : 'secondary'}>
                        {journal.isActive ? (
                          <><CheckCircle className="mr-1 h-3 w-3" /> Actif</>
                        ) : (
                          <><XCircle className="mr-1 h-3 w-3" /> Inactif</>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        {typeInfo.label}
                      </Badge>
                      {journal.description && (
                        <p className="text-sm text-muted-foreground">
                          {journal.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">{journal.entriesCount}</p>
                        <p className="text-muted-foreground">Écritures</p>
                      </div>
                      <div>
                        <p className="font-medium">
                          {journal.lastEntryDate ? 
                            new Date(journal.lastEntryDate).toLocaleDateString('fr-FR') : 
                            'Aucune'
                          }
                        </p>
                        <p className="text-muted-foreground">Dernière écriture</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditJournal(journal)}
                        className="flex-1"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleJournalStatus(journal)}
                        className={journal.isActive ? 'text-orange-600' : 'text-green-600'}
                      >
                        {journal.isActive ? (
                          <><XCircle className="mr-2 h-4 w-4" /> Désactiver</>
                        ) : (
                          <><CheckCircle className="mr-2 h-4 w-4" /> Activer</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteJournal(journal)}
                        className="text-destructive"
                        disabled={journal.entriesCount > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredJournals.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChartHorizontalBig className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun journal trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
                ? "Aucun journal ne correspond à vos critères de recherche."
                : "Commencez par créer votre premier journal comptable."}
            </p>
            {(!searchTerm && selectedType === 'all' && selectedStatus === 'all') && (
              <Button onClick={handleNewJournal}>
                <Plus className="mr-2 h-4 w-4" />
                Créer un journal
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog du formulaire de journal */}
      <Dialog open={showJournalForm} onOpenChange={setShowJournalForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingJournal ? 'Modifier le journal' : 'Nouveau journal comptable'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Code du journal *</Label>
                <Input
                  id="code"
                  value={journalForm.code}
                  onChange={(e) => handleFormChange('code', e.target.value.toUpperCase())}
                  placeholder="Ex: VTE"
                  className="font-mono uppercase"
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Code unique du journal (max 10 caractères)
                </p>
              </div>
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select 
                  value={journalForm.type} 
                  onValueChange={(value) => {
                    handleFormChange('type', value);
                    // Auto-générer le code si vide
                    if (!journalForm.code) {
                      handleFormChange('code', generateJournalCode(value));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {journalTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          <div>
                            <div>{type.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {type.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="name">Nom du journal *</Label>
              <Input
                id="name"
                value={journalForm.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Ex: Journal des Ventes"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={journalForm.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Description détaillée du journal (optionnel)"
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={journalForm.isActive}
                onChange={(e) => handleFormChange('isActive', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive">Journal actif</Label>
              <p className="text-xs text-muted-foreground">
                Les journaux inactifs n'apparaissent pas dans les sélections d'écriture
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowJournalForm(false)}>
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
              <Button onClick={handleSaveJournal} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editingJournal ? 'Modifier' : 'Créer'}
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