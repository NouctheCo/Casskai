import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocale } from "@/contexts/LocaleContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { journalEntryService } from "@/services/journalEntryService";
import { useAuth } from "@/contexts/AuthContext";

// ✅ Composant ligne optimisé avec React.memo
const JournalEntryLine = React.memo(({ 
  item, 
  index, 
  updateItem, 
  removeItem, 
  canRemove,
  localAccounts,
  loading,
  fetchError,
  t 
}) => {
  const handleAccountChange = useCallback((value) => {
    updateItem(item.id, 'account_id', value);
  }, [item.id, updateItem]);

  const handleDescriptionChange = useCallback((e) => {
    updateItem(item.id, 'description', e.target.value);
  }, [item.id, updateItem]);

  const handleDebitChange = useCallback((e) => {
    updateItem(item.id, 'debit_amount', e.target.value);
  }, [item.id, updateItem]);

  const handleCreditChange = useCallback((e) => {
    updateItem(item.id, 'credit_amount', e.target.value);
  }, [item.id, updateItem]);

  const handleRemove = useCallback(() => {
    removeItem(item.id);
  }, [item.id, removeItem]);

  return (
    <tr className="border-b">
      <td className="py-2">
        <Select value={item.account_id} onValueChange={handleAccountChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('allAccounts')} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>{t('common.loading')}</span>
              </div>
            ) : localAccounts.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {fetchError ? 
                  t('journal_entries.error_loading_accounts', { defaultValue: "Erreur lors du chargement des comptes" }) :
                  t('journal_entries.no_accounts_found', { defaultValue: "Aucun compte trouvé" })
                }
              </div>
            ) : (
              localAccounts.map(account => (
                <SelectItem key={account.id} value={account.id}>
                  {account.account_number} - {account.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </td>
      <td className="py-2">
        <Input
          value={item.description}
          onChange={handleDescriptionChange}
          placeholder={t('journal_entries.description')}
        />
      </td>
      <td className="py-2">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.debit_amount || ''}
          onChange={handleDebitChange}
          className="text-right"
        />
      </td>
      <td className="py-2">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.credit_amount || ''}
          onChange={handleCreditChange}
          className="text-right"
        />
      </td>
      <td className="py-2 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={!canRemove}
        >
          {t('journal_entries.remove_item')}
        </Button>
      </td>
    </tr>
  );
});

const JournalEntryForm = ({ onSubmit, onCancel, initialData = null, journals = [], accounts = [] }) => {
  const { t } = useLocale();
  const { toast } = useToast();
  const { currentEnterpriseId } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [localJournals, setLocalJournals] = useState(journals || []);
  const [localAccounts, setLocalAccounts] = useState(accounts || []);
  const [fetchError, setFetchError] = useState(null);
  
  const formSchema = z.object({
    entry_date: z.date({
      required_error: t('fieldRequired'),
    }),
    description: z.string().min(1, t('fieldRequired')),
    reference_number: z.string().optional(),
    journal_id: z.string().uuid(t('fieldRequired')),
    items: z.array(z.object({
      account_id: z.string().uuid(t('fieldRequired')),
      debit_amount: z.number().min(0),
      credit_amount: z.number().min(0),
      description: z.string().optional(),
      currency: z.string().length(3, t('fieldRequired'))
    })).min(2, t('journal_entries.items_min_required', { defaultValue: "At least two items are required for a valid journal entry" }))
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entry_date: new Date(),
      description: "",
      reference_number: "",
      journal_id: "",
      items: []
    }
  });

  const [items, setItems] = useState([
    { id: Date.now(), account_id: "", debit_amount: 0, credit_amount: 0, description: "", currency: "EUR" }
  ]);

  // ✅ Mémoriser la configuration Supabase
  const isSupabaseConfigured = useMemo(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    return url && key && 
           url !== 'your-supabase-url' && 
           key !== 'your-supabase-anon-key' &&
           url !== 'https://placeholder.supabase.co' &&
           key !== 'placeholder-key';
  }, []);

  // ✅ Mémoriser les valeurs du formulaire
  const formValues = useMemo(() => ({
    entry_date: form.watch('entry_date'),
    journal_id: form.watch('journal_id'),
    reference_number: form.watch('reference_number'),
    description: form.watch('description')
  }), [form]);

  // ✅ Mémoriser les totaux - CLEF ANTI-SCINTILLEMENT
  const totals = useMemo(() => {
    const totalDebit = items.reduce((sum, item) => {
      const debit = typeof item.debit_amount === 'string' ? 
        parseFloat(item.debit_amount) || 0 : 
        item.debit_amount || 0;
      return sum + debit;
    }, 0);
    
    const totalCredit = items.reduce((sum, item) => {
      const credit = typeof item.credit_amount === 'string' ? 
        parseFloat(item.credit_amount) || 0 : 
        item.credit_amount || 0;
      return sum + credit;
    }, 0);
    
    const difference = totalDebit - totalCredit;
    
    return {
      totalDebit,
      totalCredit,
      difference,
      isBalanced: Math.abs(difference) < 0.01
    };
  }, [items]);

  // ✅ Fonctions mémorisées pour éviter les re-créations
  const updateItem = useCallback((id, field, value) => {
    setItems(currentItems => currentItems.map(item => {
      if (item.id !== id) return item;
      
      // Gestion spéciale pour les montants
      if (field === 'debit_amount') {
        const numValue = parseFloat(value) || 0;
        return numValue > 0 
          ? { ...item, debit_amount: numValue, credit_amount: 0 }
          : { ...item, debit_amount: numValue };
      }
      
      if (field === 'credit_amount') {
        const numValue = parseFloat(value) || 0;
        return numValue > 0 
          ? { ...item, credit_amount: numValue, debit_amount: 0 }
          : { ...item, credit_amount: numValue };
      }
      
      return { ...item, [field]: value };
    }));
  }, []);

  const removeItem = useCallback((id) => {
    setItems(currentItems => {
      if (currentItems.length <= 1) return currentItems;
      return currentItems.filter(item => item.id !== id);
    });
  }, []);

  const addItem = useCallback(() => {
    setItems(currentItems => [...currentItems, { 
      id: Date.now() + Math.random(),
      account_id: "", 
      debit_amount: 0, 
      credit_amount: 0, 
      description: "", 
      currency: "EUR" 
    }]);
  }, []);

  // ✅ Stabiliser fetchData
  const fetchData = useCallback(async () => {
    if (!currentEnterpriseId) {
      setFetchError(t('journal_entries.no_enterprise_selected', { defaultValue: "Aucune entreprise sélectionnée" }));
      return;
    }

    if (!isSupabaseConfigured) {
      setFetchError(t('journal_entries.supabase_not_configured', { 
        defaultValue: "Supabase n'est pas configuré. Veuillez configurer vos variables d'environnement." 
      }));
      return;
    }
    
    setLoading(true);
    setFetchError(null);
    
    try {
      if (!journals?.length) {
        try {
          const journalsData = await journalEntryService.getJournalsList(currentEnterpriseId);
          setLocalJournals(journalsData || []);
        } catch (error) {
          console.error("Error fetching journals:", error);
          setLocalJournals([]);
        }
      } else {
        setLocalJournals(journals);
      }
      
      if (!accounts?.length) {
        try {
          const accountsData = await journalEntryService.getAccountsList(currentEnterpriseId);
          setLocalAccounts(accountsData || []);
        } catch (error) {
          console.error("Error fetching accounts:", error);
          setLocalAccounts([]);
        }
      } else {
        setLocalAccounts(accounts);
      }
      
    } catch (error) {
      console.error("Error fetching form data:", error);
      setFetchError(error.message || t('journal_entries.network_error', { 
        defaultValue: "Erreur réseau. Vérifiez votre connexion internet et la configuration Supabase." 
      }));
    } finally {
      setLoading(false);
    }
  }, [currentEnterpriseId, isSupabaseConfigured, t, journals?.length, accounts?.length]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (initialData) {
      const formattedData = {
        entry_date: initialData.entry_date ? new Date(initialData.entry_date) : new Date(),
        description: initialData.description || "",
        reference_number: initialData.reference_number || "",
        journal_id: initialData.journal_id || "",
        items: initialData.items?.map(item => ({
          account_id: item.account_id || "",
          debit_amount: parseFloat(item.debit_amount) || 0,
          credit_amount: parseFloat(item.credit_amount) || 0,
          description: item.description || "",
          currency: item.currency || "EUR"
        })) || []
      };
      
      form.reset(formattedData);
      
      if (formattedData.items.length > 0) {
        setItems(formattedData.items.map((item, index) => ({
          id: Date.now() + index,
          ...item
        })));
      }
    }
  }, [initialData, form]);

  const handleFormSubmit = useCallback(async (data) => {
    try {
      const formData = {
        ...data,
        items: items.map(item => ({
          account_id: item.account_id,
          debit_amount: parseFloat(item.debit_amount) || 0,
          credit_amount: parseFloat(item.credit_amount) || 0,
          description: item.description,
          currency: item.currency
        }))
      };
      
      if (!totals.isBalanced) {
        toast({
          title: t("error"),
          description: t("accountingPage.balanceError"),
          variant: "destructive"
        });
        return;
      }

      await onSubmit(formData);
    } catch (error) {
      toast({
        title: t("error"),
        description: error.message || t("failedToSubmitEntry"),
        variant: "destructive"
      });
    }
  }, [items, totals.isBalanced, onSubmit, toast, t]);

  const retryFetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">{initialData ? t('journal_entries.edit') : t('journal_entries.new')}</h2>
      </div>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{fetchError}</span>
            <Button variant="outline" size="sm" onClick={retryFetch}>
              {t('journal_entries.retry', { defaultValue: "Réessayer" })}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="entry_date" className="block text-sm font-medium mb-1">{t('journal_entries.date')}</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                id="entry_date"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formValues.entry_date ? (
                  format(formValues.entry_date, 'PPP')
                ) : (
                  <span>{t('dateFrom')}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formValues.entry_date}
                onSelect={(date) => form.setValue('entry_date', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div>
          <label htmlFor="journal_id" className="block text-sm font-medium mb-1">{t('journal_entries.journal')}</label>
          <Select 
            value={formValues.journal_id} 
            onValueChange={(value) => form.setValue('journal_id', value)}
          >
            <SelectTrigger id="journal_id">
              <SelectValue placeholder={t('allJournals')} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>{t('common.loading')}</span>
                </div>
              ) : localJournals.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {fetchError ? 
                    t('journal_entries.error_loading_journals', { defaultValue: "Erreur lors du chargement des journaux" }) :
                    t('journal_entries.no_journals_found', { defaultValue: "Aucun journal trouvé" })
                  }
                </div>
              ) : (
                localJournals.map(journal => (
                  <SelectItem key={journal.id} value={journal.id}>
                    {journal.code} - {journal.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <label htmlFor="reference_number" className="block text-sm font-medium mb-1">{t('journal_entries.reference')}</label>
        <Input
          id="reference_number"
          value={formValues.reference_number}
          onChange={(e) => form.setValue('reference_number', e.target.value)}
          placeholder={t('journal_entries.reference')}
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">{t('journal_entries.description')}</label>
        <Textarea
          id="description"
          value={formValues.description}
          onChange={(e) => form.setValue('description', e.target.value)}
          placeholder={t('journal_entries.description')}
        />
      </div>
      
      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-lg">{t('journal_entries.items')}</h3>
          <Button type="button" onClick={addItem} variant="outline" size="sm">
            {t('journal_entries.add_item')}
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">{t('journal_entries.account')}</th>
                <th className="text-left py-2">{t('journal_entries.description')}</th>
                <th className="text-right py-2">{t('journal_entries.debit')}</th>
                <th className="text-right py-2">{t('journal_entries.credit')}</th>
                <th className="text-center py-2">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <JournalEntryLine
                  key={item.id}
                  item={item}
                  updateItem={updateItem}
                  removeItem={removeItem}
                  canRemove={items.length > 1}
                  localAccounts={localAccounts}
                  loading={loading}
                  fetchError={fetchError}
                  t={t}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold border-t">
                <td colSpan="2" className="py-2 text-right">{t('journal_entries.total')}</td>
                <td className="py-2 text-right">{totals.totalDebit.toFixed(2)}</td>
                <td className="py-2 text-right">{totals.totalCredit.toFixed(2)}</td>
                <td></td>
              </tr>
              <tr className={`${totals.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                <td colSpan="2" className="py-2 text-right">{t('journal_entries.difference')}</td>
                <td colSpan="2" className="py-2 text-right font-semibold">
                  {Math.abs(totals.difference).toFixed(2)}
                </td>
                <td className="py-2 text-center text-xs">
                  {totals.isBalanced ? '✓ ' + t('journal_entries.balanced') : '⚠ ' + t('journal_entries.unbalanced')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          {t('journal_entries.cancel')}
        </Button>
        <Button 
          type="button" 
          onClick={() => handleFormSubmit(form.getValues())}
          disabled={!totals.isBalanced || !formValues.journal_id || loading}
        >
          {initialData ? t('journal_entries.update') : t('journal_entries.create')}
        </Button>
      </div>
    </div>
  );
};

export default JournalEntryForm;