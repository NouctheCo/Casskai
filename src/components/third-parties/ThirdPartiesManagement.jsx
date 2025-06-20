import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useLocaleFormatter } from '@/hooks/useLocaleFormatter';
import { thirdPartiesService, useThirdParties } from '@/services/thirdPartiesService';
import { ThirdPartyForm } from '@/components/third-parties/ThirdPartyForm';
import { ThirdPartyListItem } from '@/components/third-parties/ThirdPartyListItem';
import { ThirdPartyDetailView } from '@/components/third-parties/ThirdPartyDetailView';
import { PlusCircle, Search, FileUp, FileDown, ChevronUp, ChevronDown, ChevronsUpDown, Loader2, Users, Building, Filter, X } from 'lucide-react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ThirdPartiesManagement({ type: initialType = 'CLIENT' }) {
  const { t } = useLocale();
  const { currentEnterpriseId } = useAuth();
  const { toast } = useToast();
  const { formatCurrency } = useLocaleFormatter();

  const [activeTab, setActiveTab] = useState(initialType);
  const {
    thirdParties, loading, error, totalCount, page, pageSize, sortBy, sortDirection,
    type, filters,
    setType, updateFilter, refreshThirdParties, updatePage, updatePageSize, updateSort
  } = useThirdParties(currentEnterpriseId, activeTab);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingThirdParty, setEditingThirdParty] = useState(null);
  const [thirdPartyToDelete, setThirdPartyToDelete] = useState(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [viewingThirdParty, setViewingThirdParty] = useState(null);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setType(activeTab);
  }, [activeTab, setType]);

  const handleAddNew = () => {
    setEditingThirdParty(null);
    setIsFormOpen(true);
  };

  const handleEdit = (thirdParty) => {
    setEditingThirdParty(thirdParty);
    setIsFormOpen(true);
  };
  
  const handleViewDetails = (thirdParty) => {
    setViewingThirdParty(thirdParty);
    setIsDetailViewOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!thirdPartyToDelete || !currentEnterpriseId) return;
    try {
      const { error: deleteError } = await thirdPartiesService.deleteThirdParty(thirdPartyToDelete.id, currentEnterpriseId);
      if (deleteError) throw deleteError;
      toast({ title: t('success'), description: t('thirdParties.deleteSuccess') });
      refreshThirdParties();
      // Optionally, re-fetch balance for related items if needed
      if (thirdPartyToDelete.id) {
        thirdPartiesService.getThirdPartyBalance(thirdPartyToDelete.id, currentEnterpriseId).then(({ balance }) => {
          console.log(`Balance for ${thirdPartyToDelete.name} re-calculated: ${balance}`);
        });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: t('error'), description: err.message || t('thirdParties.deleteError') });
    } finally {
      setThirdPartyToDelete(null);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const SortableTableHead = ({ columnKey, children }) => {
    const Icon = sortBy === columnKey ? (sortDirection === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
    return (
      <TableHead onClick={() => updateSort(columnKey)} className="cursor-pointer hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          {children} <Icon className="h-4 w-4" />
        </div>
      </TableHead>
    );
  };
  
  const currentList = useMemo(() => thirdParties, [thirdParties]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && currentEnterpriseId) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvData = e.target.result;
        toast({ title: t('thirdParties.import.processingTitle'), description: t('thirdParties.import.processingDesc') });
        const result = await thirdPartiesService.importThirdPartiesFromCSV(currentEnterpriseId, csvData);
        if (result.errors && result.errors.length > 0) {
          let errorMessages = result.errors.map(err => `Ligne ${err.line || 'N/A'}: ${err.message}`).join(`\n`);
          if (result.errorCount > 5) errorMessages = result.errors.slice(0,5).map(err => `Ligne ${err.line || 'N/A'}: ${err.message}`).join(`\n`) + `\n...et ${result.errorCount - 5} autres erreurs.`;
          toast({ variant: "destructive", title: t('thirdParties.import.errorTitle', { count: result.errorCount }), description: <pre className="whitespace-pre-wrap max-h-60 overflow-auto">{errorMessages}</pre>, duration: 10000 });
        }
        if (result.successCount > 0) {
          toast({ title: t('success'), description: t('thirdParties.import.successDesc', { count: result.successCount }) });
          refreshThirdParties();
        }
      };
      reader.readAsText(file);
    }
    event.target.value = null; // Reset file input
  };
  
  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-2">
          <Button 
            variant={activeTab === 'CLIENT' ? "default" : "outline"} 
            onClick={() => setActiveTab('CLIENT')}
            className="md:hidden"
          >
            <Users className="mr-2 h-4 w-4" /> {t('clients')}
          </Button>
          <Button 
            variant={activeTab === 'SUPPLIER' ? "default" : "outline"} 
            onClick={() => setActiveTab('SUPPLIER')}
            className="md:hidden"
          >
            <Building className="mr-2 h-4 w-4" /> {t('suppliers')}
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t(activeTab === 'CLIENT' ? 'addClient' : 'addSupplier')}
          </Button>
          <Button variant="outline" asChild>
            <label htmlFor="csv-upload" className="cursor-pointer">
              <FileUp className="mr-2 h-4 w-4" /> {t('import')}
              <input type="file" id="csv-upload" accept=".csv" onChange={handleFileUpload} className="hidden"/>
            </label>
          </Button>
          <Button variant="outline" disabled>
            <FileDown className="mr-2 h-4 w-4" /> {t('export')}
          </Button>
        </div>
      </div>

      <Card className="shadow-xl border-none bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder={t('thirdParties.searchPlaceholder', { type: t(activeTab === 'CLIENT' ? 'client' : 'supplier').toLowerCase() })} 
                className="pl-10 w-full bg-background/70 focus:bg-background"
                value={filters.searchTerm}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center w-full md:w-auto">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <Select value={filters.statusFilter} onValueChange={(value) => updateFilter('statusFilter', value)}>
                <SelectTrigger className="w-full md:w-[180px] bg-background/70 focus:bg-background">
                  <SelectValue placeholder={t('thirdParties.filterStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatuses')}</SelectItem>
                  <SelectItem value="active">{t('active')}</SelectItem>
                  <SelectItem value="inactive">{t('inactive')}</SelectItem>
                </SelectContent>
              </Select>
              { (filters.searchTerm || filters.statusFilter !== 'all') && 
                <Button variant="ghost" size="icon" onClick={() => { updateFilter('searchTerm', ''); updateFilter('statusFilter', 'all');}} title={t('clearFilters')}>
                  <X className="h-5 w-5" />
                </Button>
              }
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          )}
          {!loading && error && (
            <div className="text-center py-10 text-destructive">
              <p>{t('thirdParties.errorLoading')}: {error.message}</p>
              <Button onClick={refreshThirdParties} className="mt-4">{t('retry')}</Button>
            </div>
          )}
          {!loading && !error && currentList.length === 0 && (
            <div className="text-center py-10">
              <p className="text-lg text-muted-foreground">{t('thirdParties.noResults', { type: t(activeTab === 'CLIENT' ? 'client' : 'supplier').toLowerCase() })}</p>
              <Button onClick={handleAddNew} className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t(activeTab === 'CLIENT' ? 'addClient' : 'addSupplier')}
              </Button>
            </div>
          )}
          {!loading && !error && currentList.length > 0 && (
            <>
              <div className={isMobile ? "space-y-4" : "overflow-x-auto"}>
                {isMobile ? (
                  currentList.map(tp => (
                    <AlertDialog key={tp.id}>
                      <ThirdPartyListItem thirdParty={tp} onEdit={handleEdit} onDelete={() => setThirdPartyToDelete(tp)} onView={handleViewDetails} formatCurrency={formatCurrency} />
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>{t('confirmDeletion')}</AlertDialogTitle></AlertDialogHeader>
                        <AlertDialogDescription>{t('thirdParties.deleteConfirmation', { name: tp.name })}</AlertDialogDescription>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setThirdPartyToDelete(null)}>{t('cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteConfirm}>{t('delete')}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ))
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableTableHead columnKey="name">{t('thirdParties.name')}</SortableTableHead>
                        <SortableTableHead columnKey="email">{t('thirdParties.email')}</SortableTableHead>
                        <TableHead>{t('thirdParties.phone')}</TableHead>
                        <TableHead>{t('thirdParties.address')}</TableHead>
                        <SortableTableHead columnKey="balance">{t('thirdParties.balance')}</SortableTableHead>
                        <SortableTableHead columnKey="is_active">{t('thirdParties.status')}</SortableTableHead>
                        <TableHead className="text-right">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentList.map(tp => (
                        <AlertDialog key={tp.id}>
                          <ThirdPartyListItem thirdParty={tp} onEdit={handleEdit} onDelete={() => setThirdPartyToDelete(tp)} onView={handleViewDetails} formatCurrency={formatCurrency} />
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>{t('confirmDeletion')}</AlertDialogTitle></AlertDialogHeader>
                            <AlertDialogDescription>{t('thirdParties.deleteConfirmation', { name: tp.name })}</AlertDialogDescription>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setThirdPartyToDelete(null)}>{t('cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteConfirm}>{t('delete')}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  {totalCount > 0 
                    ? t('pagination.showing', { 
                        start: Math.min((page - 1) * pageSize + 1, totalCount), 
                        end: Math.min(page * pageSize, totalCount), 
                        total: totalCount 
                      })
                    : t('pagination.noResults', { defaultValue: 'Aucun résultat' })}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => updatePage(page - 1)} disabled={page <= 1}>{t('previous')}</Button>
                  <Button variant="outline" onClick={() => updatePage(page + 1)} disabled={page >= totalPages}>{t('next')}</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ThirdPartyForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        thirdPartyData={editingThirdParty}
        currentEnterpriseId={currentEnterpriseId}
        type={activeTab}
        onSave={() => {
          refreshThirdParties();
          setIsFormOpen(false);
          setEditingThirdParty(null);
        }}
      />
      
      <ThirdPartyDetailView
        open={isDetailViewOpen}
        onOpenChange={setIsDetailViewOpen}
        thirdParty={viewingThirdParty}
        formatCurrency={formatCurrency}
      />
    </motion.div>
  );
}