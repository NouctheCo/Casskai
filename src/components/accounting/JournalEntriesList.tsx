// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useJournalEntries, JournalEntryFilters } from '@/hooks/useJournalEntries';
import { useCompanies } from '@/hooks/useCompanies';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, ChevronDown, ChevronUp, ChevronsUpDown, Filter, AlertTriangle, Search, X } from 'lucide-react';
import JournalEntriesListFilterSection from './JournalEntriesListFilterSection';
import JournalEntriesListEntryRow from './JournalEntriesListEntryRow';
import type { JournalEntryFormInitialValues } from '@/types/journalEntries.types';

const ITEMS_PER_PAGE = 20;
const DEFAULT_CURRENCY = 'EUR';
const coerceNumber = (value: unknown) => {
  const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

// MODIFICATION: Ajouter refreshTrigger dans les props
const JournalEntriesList = ({ currentEnterpriseId: propCurrentEnterpriseId, onEdit, onNew, refreshTrigger }) => {
  const { user } = useAuth();
  const { currentCompany } = useCompanies();
  const companyId = propCurrentEnterpriseId || currentCompany?.id;
  const { t } = useLocale();
  const { toast } = useToast();

  // Utiliser le nouveau hook useJournalEntries
  const {
    journalEntries,
    loading,
    error,
    getJournalEntries,
    deleteJournalEntry,
    getAccountsList,
    getJournalsList
  } = useJournalEntries(companyId);

  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [localFilters, setLocalFilters] = useState({
    dateFrom: '', dateTo: '', journalId: 'all', accountId: 'all', reference: '', description: '', 
  });
  const [sortBy, setSortBy] = useState('entry_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [accounts, setAccounts] = useState([]);
  const [journals, setJournals] = useState([]); 

  const [expandedRows, setExpandedRows] = useState({});
  const [entryToDelete, setEntryToDelete] = useState(null); 

  const fetchEntries = useCallback(async (page, filtersToApply: JournalEntryFilters, limit) => {
    if (!companyId) return;
    try {
      const effectiveFilters = { 
        ...filtersToApply, 
        sort_by: sortBy, 
        sort_order: sortOrder,
        page: page,
        limit: limit
      };

      // Only include journalId and accountId if they're not set to 'all'
      if (filtersToApply.journalId === 'all') delete effectiveFilters.journalId;
      if (filtersToApply.accountId === 'all') delete effectiveFilters.accountId;

      const { data, count, error: fetchError } = await getJournalEntries(effectiveFilters);
      if (fetchError) throw new Error(fetchError);
      
      setTotal(count || 0);
      setCurrentPage(page);
      setHasMore((data || []).length === limit);

    } catch (err: any) {
      toast({ variant: 'destructive', title: t('errorFetchingEntries'), description: err?.message || String(err) });
    } finally {
      // setLoading(false); // Managed by useJournalEntries hook
    }
  }, [companyId, sortBy, sortOrder, t, toast, getJournalEntries]);

  // ✅ AJOUT: useEffect pour écouter refreshTrigger
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      const activeFilters: JournalEntryFilters = { sortBy: sortBy, sortOrder: sortOrder };
      if (localFilters.dateFrom || localFilters.dateTo) {
        activeFilters.dateRange = { from: localFilters.dateFrom, to: localFilters.dateTo };
      }
      if (localFilters.journalId && localFilters.journalId !== 'all') activeFilters.journalId = localFilters.journalId;
      if (localFilters.accountId && localFilters.accountId !== 'all') activeFilters.accountId = localFilters.accountId;
      if (localFilters.reference) activeFilters.reference = localFilters.reference;
      if (localFilters.description) activeFilters.description = localFilters.description;
      
      fetchEntries(1, activeFilters, ITEMS_PER_PAGE);
      setExpandedRows({}); // Réinitialiser les lignes étendues
    }
  }, [refreshTrigger, fetchEntries, sortBy, sortOrder, localFilters]);

  useEffect(() => {
    const activeFilters: JournalEntryFilters = { sortBy: sortBy, sortOrder: sortOrder };
    if (localFilters.dateFrom || localFilters.dateTo) {
      activeFilters.dateRange = { from: localFilters.dateFrom, to: localFilters.dateTo };
    }
    if (localFilters.journalId && localFilters.journalId !== 'all') activeFilters.journalId = localFilters.journalId;
    if (localFilters.accountId && localFilters.accountId !== 'all') activeFilters.accountId = localFilters.accountId;
    if (localFilters.reference) activeFilters.reference = localFilters.reference;
    if (localFilters.description) activeFilters.description = localFilters.description;
    fetchEntries(1, activeFilters, ITEMS_PER_PAGE);
  }, [fetchEntries, localFilters, sortBy, sortOrder]);

  const fetchDropdownData = useCallback(async () => {
    if (!companyId) return;
    try {
      const accs = await getAccountsList();
      setAccounts(accs || []);
      const jrnls = await getJournalsList();
      setJournals(jrnls || []);
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('errorFetchingDropdownData'), description: err?.message || String(err) });
    }
  }, [companyId, t, toast, getAccountsList, getJournalsList]);

  useEffect(() => { fetchDropdownData(); }, [fetchDropdownData]);

  const handleFilterChange = (filterName, value) => {
    setLocalFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const applyFilters = () => {
    const activeFilters: JournalEntryFilters = { sortBy: sortBy, sortOrder: sortOrder };
    if (localFilters.dateFrom || localFilters.dateTo) {
      activeFilters.dateRange = { from: localFilters.dateFrom, to: localFilters.dateTo };
    }
    if (localFilters.journalId && localFilters.journalId !== 'all') activeFilters.journalId = localFilters.journalId;
    if (localFilters.accountId && localFilters.accountId !== 'all') activeFilters.accountId = localFilters.accountId;
    if (localFilters.reference) activeFilters.reference = localFilters.reference;
    if (localFilters.description) activeFilters.description = localFilters.description;
    fetchEntries(1, activeFilters, ITEMS_PER_PAGE);
    setExpandedRows({});
  };
  
  const clearFilters = () => {
    setLocalFilters({ dateFrom: '', dateTo: '', journalId: 'all', accountId: 'all', reference: '', description: '' });
    fetchEntries(1, { sortBy: sortBy, sortOrder: sortOrder }, ITEMS_PER_PAGE);
    setExpandedRows({});
  };

  const toggleRowExpansion = (entryId) => {
    setExpandedRows(prev => ({ ...prev, [entryId]: !prev[entryId] }));
  };

  const handleSort = (column: string) => {
    const newSortOrder: 'asc' | 'desc' = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortOrder(newSortOrder);
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortOrder === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />;
  };
  
  // ✅ MODIFICATION: Ajouter refreshTrigger au applyFilters après suppression
  const handleDeleteEntry = async () => {
    if (!entryToDelete) return;
    try {
      await deleteJournalEntry(entryToDelete.id);
      toast({ title: t('success'), description: t('journalEntryDeletedSuccess') });
      setEntryToDelete(null);
      
      // ✅ AMÉLIORATION: Rester sur la page actuelle si possible, sinon page précédente
      const activeFilters: JournalEntryFilters = { sortBy: sortBy, sortOrder: sortOrder };
      if (localFilters.dateFrom || localFilters.dateTo) {
        activeFilters.dateRange = { from: localFilters.dateFrom, to: localFilters.dateTo };
      }
      if (localFilters.journalId && localFilters.journalId !== 'all') activeFilters.journalId = localFilters.journalId;
      if (localFilters.accountId && localFilters.accountId !== 'all') activeFilters.accountId = localFilters.accountId;
      if (localFilters.reference) activeFilters.reference = localFilters.reference;
      if (localFilters.description) activeFilters.description = localFilters.description;
      
      // Si on supprime le dernier élément d'une page > 1, aller à la page précédente
      const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
      const pageToLoad = (journalEntries.length === 1 && currentPage > 1) ? currentPage - 1 : currentPage;
      
      fetchEntries(pageToLoad, activeFilters, ITEMS_PER_PAGE);
      setExpandedRows({});
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('error'), description: err?.message || String(err) || t('failedToDeleteEntry') });
    }
  };
  
  const handleEdit = (entry) => {
    const mappedEntry = {
      id: entry.id,
      entryDate: entry.entry_date ? new Date(entry.entry_date) : new Date(),
      description: entry.description ?? '',
      referenceNumber: entry.reference_number ?? undefined,
      journalId: entry.journal_id ?? '',
      items: (entry.journal_entry_items || []).map((item) => ({
        accountId: item.account_id,
        debitAmount: coerceNumber(item.debit_amount),
        creditAmount: coerceNumber(item.credit_amount),
        description: item.description ?? '',
        currency: item.currency ?? DEFAULT_CURRENCY,
      })),
      status: entry.status ?? 'draft',
      entryNumber: entry.entry_number ?? null,
    };

    if (onEdit) {
      onEdit(mappedEntry);
    }
  };

  const handleDuplicate = (entry) => {
    const duplicatedEntry = {
      entryDate: new Date(),
      description: entry.description
        ? `${entry.description} ${t('copySuffix')}`.trim()
        : t('copySuffix'),
      referenceNumber: entry.reference_number
        ? `${entry.reference_number} ${t('copySuffix')}`.trim()
        : undefined,
      journalId: entry.journal_id ?? '',
      items: (entry.journal_entry_items || []).map((item) => ({
        accountId: item.account_id,
        debitAmount: coerceNumber(item.debit_amount),
        creditAmount: coerceNumber(item.credit_amount),
        description: item.description ?? '',
        currency: item.currency ?? DEFAULT_CURRENCY,
      })),
      status: entry.status ?? 'draft',
      entryNumber: null,
    };

    if (onEdit) {
      onEdit(duplicatedEntry);
    }
  };

  // ✅ CORRECTION: Calcul correct des pages totales
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      const activeFilters: JournalEntryFilters = { sortBy: sortBy, sortOrder: sortOrder };
      if (localFilters.dateFrom || localFilters.dateTo) {
        activeFilters.dateRange = { from: localFilters.dateFrom, to: localFilters.dateTo };
      }
      if (localFilters.journalId && localFilters.journalId !== 'all') activeFilters.journalId = localFilters.journalId;
      if (localFilters.accountId && localFilters.accountId !== 'all') activeFilters.accountId = localFilters.accountId;
      if (localFilters.reference) activeFilters.reference = localFilters.reference;
      if (localFilters.description) activeFilters.description = localFilters.description;
      fetchEntries(pageNumber, activeFilters, ITEMS_PER_PAGE);
    }
  };

  if (error && !loading && journalEntries.length === 0) {
    const errorMessage = error ? String(error) : 'Erreur inconnue';
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t('error')}</AlertTitle>
        <AlertDescription>{t('errorFetchingEntries')}: {errorMessage}</AlertDescription>
      </Alert>
    );
  }
  
  const renderSkeleton = () => (
    Array.from({ length: ITEMS_PER_PAGE / 4 }).map((_, i) => ( 
      <TableRow key={`skeleton-${i}`}>
        <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
        <TableCell className="text-center"><Skeleton className="h-8 w-24 mx-auto" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold">{t('accountingEntriesList')}</h2>
        {onNew && (
            <Button onClick={onNew}>
                <PlusCircle className="mr-2 h-4 w-4" /> {t('newEntry')}
            </Button>
        )}
      </div>

      <JournalEntriesListFilterSection 
        localFilters={localFilters}
        handleFilterChange={handleFilterChange}
        applyFilters={applyFilters}
        clearFilters={clearFilters}
        accounts={accounts}
        journals={journals}
      />

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('entry_date')} className="cursor-pointer hover:bg-muted/80 min-w-[120px]">
                <div className="flex items-center">{t('date')} {getSortIcon('entry_date')}</div>
              </TableHead>
              <TableHead onClick={() => handleSort('journal_id')} className="cursor-pointer hover:bg-muted/80 min-w-[150px]">
                 <div className="flex items-center">{t('journal')} {getSortIcon('journal_id')}</div>
              </TableHead>
              <TableHead onClick={() => handleSort('description')} className="cursor-pointer hover:bg-muted/80 min-w-[250px]">
                <div className="flex items-center">{t('description')} {getSortIcon('description')}</div>
              </TableHead>
              <TableHead onClick={() => handleSort('reference_number')} className="cursor-pointer hover:bg-muted/80 min-w-[150px]">
                <div className="flex items-center">{t('reference')} {getSortIcon('reference_number')}</div>
              </TableHead>
              <TableHead className="text-right min-w-[120px]">{t('debit')}</TableHead>
              <TableHead className="text-right min-w-[120px]">{t('credit')}</TableHead>
              <TableHead className="text-center min-w-[150px] sticky right-0 bg-white dark:bg-gray-900 z-10">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? renderSkeleton() : journalEntries.map(entry => (
              <JournalEntriesListEntryRow 
                key={entry.id}
                entry={entry}
                expanded={!!expandedRows[entry.id]}
                onToggleExpansion={toggleRowExpansion}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onSetEntryToDelete={setEntryToDelete}
                journals={journals}
              />
            ))}
            {!loading && journalEntries.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">{t('noEntriesFound')}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* ✅ AMÉLIORATION: Pagination plus robuste avec protection contre les divisions par zéro */}
      {total > 0 && ( 
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            {t('previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {/* ✅ CORRECTION: Affichage plus robuste de la pagination */}
            Page {currentPage} sur {totalPages} ({total} {total === 1 ? t('entry', { defaultValue: 'écriture' }) : t('entries', { defaultValue: 'écritures' })})
          </span>
          <Button
            variant="outline"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages || loading || !hasMore}
          >
            {t('next')}
          </Button>
        </div>
      )}

      <AlertDialog open={!!entryToDelete} onOpenChange={(isOpen) => !isOpen && setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDeletion')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDeleteEntryMessage', { entryId: entryToDelete?.id.substring(0,8) || '' })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEntryToDelete(null)}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEntry} className={buttonVariants({ variant: "destructive" })}>
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default JournalEntriesList;
