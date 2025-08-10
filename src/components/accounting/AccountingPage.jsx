import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useToast } from '@/components/ui/use-toast';
import FECImport from '@/components/accounting/FECImport';
import ChartOfAccounts from '@/components/accounting/ChartOfAccounts';
import JournalsManagement from '@/components/accounting/JournalsManagement';
import JournalEntriesList from '@/components/accounting/JournalEntriesList';
import JournalEntryForm from '@/components/accounting/JournalEntryForm';
import SetupWizard from '@/components/accounting/SetupWizard';
import { BookOpen, PlusCircle, FileText, BarChartHorizontalBig, FileArchive, Trash2, AlertTriangle, Save, XCircle, CheckCircle, Settings, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { journalEntryService } from '@/services/journalEntryService';

export default function AccountingPage() {
  const { t } = useLocale();
  const { currentEnterpriseId } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('entries');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null); 
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // ✅ AJOUT: Clé de refresh pour forcer la mise à jour de JournalEntriesList
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entryNumber, setEntryNumber] = useState('ECR-001'); 
  const [entryLabel, setEntryLabel] = useState('');
  const [entryReference, setEntryReference] = useState('');

  const initialLine = { account: '', label: '', debit: '', credit: '' };
  const [entryLines, setEntryLines] = useState([
    { account: '411000', label: 'Facture client X', debit: '1200.00', credit: '' },
    { account: '701000', label: 'Vente de marchandises', debit: '', credit: '1000.00' },
    { account: '445710', label: 'TVA collectée', debit: '', credit: '200.00' },
  ]);

  // ✅ AJOUT: Fonction pour forcer le refresh de JournalEntriesList
  const refreshEntriesList = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleAddLine = () => {
    setEntryLines([...entryLines, { ...initialLine }]);
  };

  const handleRemoveLine = (index) => {
    const newLines = entryLines.filter((_, i) => i !== index);
    setEntryLines(newLines);
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...entryLines];
    newLines[index][field] = value;
    
    if (field === 'debit' && value !== '') {
      newLines[index]['credit'] = '';
    } else if (field === 'credit' && value !== '') {
      newLines[index]['debit'] = '';
    }
    setEntryLines(newLines);
  };

  const calculateTotals = () => {
    let totalDebit = 0;
    let totalCredit = 0;
    entryLines.forEach(line => {
      totalDebit += parseFloat(line.debit) || 0;
      totalCredit += parseFloat(line.credit) || 0;
    });
    return { totalDebit, totalCredit, difference: totalDebit - totalCredit };
  };

  const totals = calculateTotals();

  const handleSaveEntry = () => {
    if (totals.difference !== 0) {
      toast({
        variant: "destructive",
        title: t('accountingPage.saveErrorTitle', { defaultValue: "Erreur d'enregistrement" }),
        description: t('accountingPage.balanceError', { defaultValue: "Le débit et le crédit doivent être équilibrés." }),
      });
      return;
    }
    toast({
      title: t('accountingPage.saveSuccessTitle', { defaultValue: "Écriture enregistrée" }),
      description: t('accountingPage.saveSuccessMessage', { defaultValue: "L'écriture comptable a été enregistrée avec succès (simulation)." }),
      action: <CheckCircle className="text-green-500" />
    });
    setShowEntryForm(false);
    setEditingEntry(null);
    setEntryLines([
      { account: '411000', label: 'Facture client X', debit: '1200.00', credit: '' },
      { account: '701000', label: 'Vente de marchandises', debit: '', credit: '1000.00' },
      { account: '445710', label: 'TVA collectée', debit: '', credit: '200.00' },
    ]);
    setEntryLabel('');
    setEntryReference('');
    setEntryDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleCancelEntry = () => {
    setShowEntryForm(false);
    setEditingEntry(null);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setShowEntryForm(true);
  };

  const handleNewEntry = () => {
    setEditingEntry(null);
    setShowEntryForm(true);
  };

  // ✅ MODIFICATION: Ajouter refreshEntriesList après succès
  const handleSubmitEntry = async (entryData) => {
    try {
      console.log('Entry data:', entryData);
      
      let result;
      if (editingEntry?.id) {
        result = await journalEntryService.updateJournalEntry(editingEntry.id, {
          company_id: currentEnterpriseId,
          ...entryData
        });
      } else {
        result = await journalEntryService.createJournalEntry({
          company_id: currentEnterpriseId,
          ...entryData
        });
      }
      
      toast({
        title: t('success'),
        description: editingEntry?.id ? t('entryUpdatedSuccess', { defaultValue: "Écriture mise à jour avec succès !" }) : t('entryCreatedSuccess', { defaultValue: "Écriture créée avec succès !" }),
        action: <CheckCircle className="text-green-500" />
      });
      setShowEntryForm(false);
      setEditingEntry(null);
      
      // ✅ AJOUT: Forcer la mise à jour de la liste
      refreshEntriesList();
      
    } catch (error) {
      console.error('Error submitting entry:', error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: error.message || t('failedToSubmitEntry', { defaultValue: "Échec de l'enregistrement de l'écriture." }),
      });
      throw error;
    }
  };

  // ✅ MODIFICATION: Ajouter refreshEntriesList après suppression
  const handleDeleteAllEntries = async () => {
    if (!currentEnterpriseId) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('noCompanySelected', { defaultValue: "Aucune entreprise sélectionnée" })
      });
      return;
    }

    setIsDeleting(true);
    try {
      const { success, error } = await journalEntryService.deleteAllJournalEntries(currentEnterpriseId);
      
      if (success) {
        toast({
          title: t('success'),
          description: t('allEntriesDeletedSuccess', { defaultValue: "Toutes les écritures ont été supprimées avec succès" }),
          action: <CheckCircle className="text-green-500" />
        });
        setShowDeleteAllDialog(false);
        
        // ✅ AJOUT: Forcer la mise à jour de la liste
        refreshEntriesList();
        
      } else {
        throw error || new Error("Une erreur est survenue lors de la suppression");
      }
    } catch (error) {
      console.error('Error deleting all entries:', error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: error.message || t('failedToDeleteAllEntries', { defaultValue: "Échec de la suppression des écritures" })
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // ✅ AJOUT: Refresh quand l'entreprise change
  useEffect(() => {
    if (currentEnterpriseId) {
      refreshEntriesList();
    }
  }, [currentEnterpriseId, refreshEntriesList]);

  const sampleAccounts = [
    { value: "101000", label: "101000 - Capital social" },
    { value: "401000", label: "401000 - Fournisseurs" },
    { value: "411000", label: "411000 - Clients" },
    { value: "445660", label: "445660 - TVA déductible sur ABS" },
    { value: "445710", label: "445710 - TVA collectée" },
    { value: "512000", label: "512000 - Banque" },
    { value: "530000", label: "530000 - Caisse" },
    { value: "601000", label: "601000 - Achats stockés - Matières premières" },
    { value: "607000", label: "607000 - Achats de marchandises" },
    { value: "626000", label: "626000 - Frais postaux et de télécommunications" },
    { value: "701000", label: "701000 - Ventes de produits finis" },
    { value: "706000", label: "706000 - Prestations de services" },
    { value: "707000", label: "707000 - Ventes de marchandises" },
  ];

  if (!currentEnterpriseId) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="container mx-auto p-4 md:p-8">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-t-lg p-6">
            <CardTitle className="text-2xl flex items-center">
              <AlertTriangle className="mr-3 h-8 w-8" />
              {t('noCompanySelectedTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="text-lg text-muted-foreground mb-6">{t('noCompanySelectedMessageAccounting')}</p>
            <img alt="{t('accountingpage.illustration_pour_l', { defaultValue: 'Illustration pour l' })}'état sans entreprise sélectionnée" className="mx-auto my-4 h-48 w-auto opacity-75" src="https://images.unsplash.com/photo-1664147388039-ea28efa90756" />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 md:p-8"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 truncate">
              {t('accountingPageTitle', { defaultValue: "Gestion Comptable" })}
            </h1>
            <Button variant="outline" onClick={() => setShowSetupWizard(true)}>
              <Settings className="mr-2 h-4 w-4" />
              {t('setupAssistant')}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 sm:mt-0 justify-center sm:justify-end">
            <TabsList className="grid w-full sm:w-auto grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="entries" className="flex items-center gap-2 truncate">
                <FileText className="h-4 w-4" /> {t('accountingEntries')}
              </TabsTrigger>
              <TabsTrigger value="chart" className="flex items-center gap-2 truncate">
                <BookOpen className="h-4 w-4" /> {t('chartOfAccounts')}
              </TabsTrigger>
              <TabsTrigger value="journals" className="flex items-center gap-2 truncate">
                <BarChartHorizontalBig className="h-4 w-4" /> {t('journals')}
              </TabsTrigger>
              <TabsTrigger value="fec" className="flex items-center gap-2 truncate">
                <FileArchive className="h-4 w-4" /> {t('fec')}
              </TabsTrigger>
            </TabsList>
            <Button 
              variant="destructive" 
              size="icon" 
              onClick={() => setShowDeleteAllDialog(true)}
              title={t('deleteAllEntries', { defaultValue: "Supprimer toutes les écritures" })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="entries">
          {showEntryForm ? (
             <JournalEntryForm 
                onSubmit={handleSubmitEntry}
                onCancel={handleCancelEntry}
                initialData={editingEntry}
             />
          ) : (
            // ✅ MODIFICATION: Ajouter la clé de refresh
            <JournalEntriesList 
              key={refreshKey}
              currentEnterpriseId={currentEnterpriseId}
              onEdit={handleEditEntry}
              onNew={handleNewEntry}
              refreshTrigger={refreshKey}
            />
          )}
        </TabsContent>

        <TabsContent value="chart">
          <ChartOfAccounts currentEnterpriseId={currentEnterpriseId} />
        </TabsContent>

        <TabsContent value="journals">
          <JournalsManagement currentEnterpriseId={currentEnterpriseId} />
        </TabsContent>

        <TabsContent value="fec">
          <FECImport currentEnterpriseId={currentEnterpriseId} />
        </TabsContent>
      </Tabs>
      
      {/* Setup Wizard Dialog */}
      <Dialog 
        open={showSetupWizard} 
        onOpenChange={setShowSetupWizard}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('setupAssistant', { defaultValue: 'Assistant de Configuration' })}</DialogTitle>
          </DialogHeader>
          <SetupWizard 
            currentEnterpriseId={currentEnterpriseId}
            onFinish={() => {
              setShowSetupWizard(false);
              window.location.reload();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete All Entries Dialog */}
      <Dialog
        open={showDeleteAllDialog}
        onOpenChange={setShowDeleteAllDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              {t('deleteAllEntries', { defaultValue: "Supprimer toutes les écritures" })}
            </DialogTitle>
            <DialogDescription>
              {t('deleteAllEntriesConfirmation', { defaultValue: "Êtes-vous sûr de vouloir supprimer TOUTES les écritures comptables ? Cette action est irréversible." })}
            </DialogDescription>
          </DialogHeader>
          
          <Alert variant="destructive" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('warning', { defaultValue: "Attention" })}</AlertTitle>
            <AlertDescription>
              {t('deleteAllEntriesWarning', { defaultValue: "Cette action supprimera définitivement toutes les écritures comptables de cette entreprise. Les données ne pourront pas être récupérées." })}
            </AlertDescription>
          </Alert>
          
          <DialogFooter className="mt-4 gap-2">
            <DialogClose asChild>
              <Button variant="outline">{t('cancel')}</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAllEntries}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('deleting', { defaultValue: "Suppression en cours..." })}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('confirmDeleteAll', { defaultValue: "Oui, tout supprimer" })}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}