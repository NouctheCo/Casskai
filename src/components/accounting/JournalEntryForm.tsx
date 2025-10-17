
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';

import { useLocale } from '@/contexts/LocaleContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, AlertCircle, Loader2, PlusCircle, Trash2 } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { journalEntriesService } from '@/services/journalEntriesService';
import { EntitySelector, type EntityOption, type EntityFormField } from '../common/EntitySelector';
import type {
  JournalEntryFormInitialValues,
  JournalEntryFormValues,
  JournalEntryLineForm,
  MinimalJournal,
  MinimalAccount,
} from '@/types/journalEntries.types';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';

const DEFAULT_CURRENCY = 'EUR';
const BALANCE_TOLERANCE = 0.01;

const DEFAULT_LINE: JournalEntryLineForm = {
  accountId: '',
  debitAmount: 0,
  creditAmount: 0,
  description: '',
  currency: DEFAULT_CURRENCY,
};

const ensureMinimumLines = (lines: JournalEntryLineForm[]): JournalEntryLineForm[] => {
  if (lines.length >= 2) {
    return lines;
  }
  const missing = 2 - lines.length;
  return [...lines, ...Array.from({ length: missing }, () => ({ ...DEFAULT_LINE }))];
};

const coerceNumber = (value: unknown): number => {
  const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapInitialData = (initialData?: JournalEntryFormInitialValues): JournalEntryFormValues => {
  if (!initialData) {
    return {
      entryDate: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      referenceNumber: '',
      journalId: '',
      lines: ensureMinimumLines([{ ...DEFAULT_LINE }, { ...DEFAULT_LINE }]),
    };
  }

  const entryDate = typeof initialData.entryDate === 'string'
    ? initialData.entryDate
    : format(new Date(initialData.entryDate || new Date()), 'yyyy-MM-dd');

  const lines = ensureMinimumLines(
    initialData.lines?.map((item) => ({
      accountId: item.accountId,
      debitAmount: coerceNumber(item.debitAmount),
      creditAmount: coerceNumber(item.creditAmount),
      description: item.description ?? '',
      currency: item.currency ?? DEFAULT_CURRENCY,
    })) ?? [{ ...DEFAULT_LINE }, { ...DEFAULT_LINE }],
  );

  return {
    entryDate,
    description: initialData.description ?? '',
    referenceNumber: initialData.referenceNumber ?? '',
    journalId: initialData.journalId ?? '',
    lines,
  };
};

const createSchema = (t: ReturnType<typeof useLocale>['t']) => {
  const lineSchema = z.object({
    accountId: z.string({ required_error: t('fieldRequired') }).uuid(t('fieldRequired')),
    debitAmount: z.number().min(0),
    creditAmount: z.number().min(0),
    description: z.string().optional(),
    currency: z.string().length(3, t('fieldRequired')),
  });

  return z.object({
    entryDate: z.string({ required_error: t('fieldRequired') }),
    description: z.string().min(1, t('fieldRequired')),
    referenceNumber: z.string().optional(),
    journalId: z.string({ required_error: t('fieldRequired') }).uuid(t('fieldRequired')),
    lines: z
      .array(lineSchema)
      .min(2, t('journal_entries.lines_min_required', {
        defaultValue: 'At least two lines are required for a valid journal entry',
      })),
  });
};

interface JournalEntryFormProps {
  initialData?: JournalEntryFormInitialValues;
  onSubmit: (values: JournalEntryFormInitialValues) => Promise<void> | void;
  onCancel: () => void;
}

const JournalEntryForm: React.FC<JournalEntryFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { t } = useLocale();
  const { toast } = useToast();
  const { currentCompany } = useAuth();
  const currentCompanyId = currentCompany?.id ?? null;

  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [localJournals, setLocalJournals] = useState<MinimalJournal[]>([]);
  const [localAccounts, setLocalAccounts] = useState<MinimalAccount[]>([]);

  const isSupabaseConfigured = useMemo(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    return Boolean(
      url &&
      key &&
      url !== 'your-supabase-url' &&
      key !== 'your-supabase-anon-key' &&
      url !== 'https://placeholder.supabase.co' &&
      key !== 'placeholder-key',
    );
  }, []);

  const schema = useMemo(() => createSchema(t), [t]);

  const form = useForm<JournalEntryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: mapInitialData(initialData),
    mode: 'onChange',
  });

  const { control, handleSubmit, reset, watch, setValue } = form;
  const { fields, append, remove, replace } = useFieldArray({ control, name: 'lines' });

  const watchedLines = watch('lines') ?? [];

  const totals = useMemo(() => {
    return watchedLines.reduce(
      (acc, line) => {
        acc.debit += coerceNumber(line.debitAmount);
        acc.credit += coerceNumber(line.creditAmount);
        return acc;
      },
      { debit: 0, credit: 0 },
    );
  }, [watchedLines]);

  const isBalanced = Math.abs(totals.debit - totals.credit) < BALANCE_TOLERANCE;

  const fetchDropdownData = useCallback(async () => {
    if (!currentCompanyId) {
      setFetchError(t('journal_entries.no_enterprise_selected', {
        defaultValue: 'Aucune entreprise sélectionnée',
      }));
      return;
    }

    if (!isSupabaseConfigured) {
      setFetchError(t('journal_entries.supabase_not_configured', {
        defaultValue: "Supabase n'est pas configuré. Veuillez définir vos variables d'environnement.",
      }));
      return;
    }

    setLoadingDropdowns(true);
    try {
      const [journals, accounts] = await Promise.all([
        journalEntriesService.getJournalsList(currentCompanyId),
        journalEntriesService.getAccountsList(currentCompanyId),
      ]);

      setLocalJournals(journals ?? []);
      setLocalAccounts(accounts ?? []);
      setFetchError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setFetchError(
        message ||
          t('journal_entries.network_error', {
            defaultValue: 'Erreur réseau. Vérifiez votre connexion et la configuration Supabase.',
          }),
      );
    } finally {
      setLoadingDropdowns(false);
    }
  }, [currentCompanyId, isSupabaseConfigured, t]);

  // Données pour EntitySelector - comptes comptables
  const accountCreateFormFields: EntityFormField[] = [
    {
      name: 'account_number',
      label: t('accounting.accountForm.accountNumber'),
      type: 'text',
      required: true,
      placeholder: t('accounting.accountForm.accountNumberPlaceholder')
    },
    {
      name: 'name',
      label: t('accounting.accountForm.accountName'),
      type: 'text',
      required: true,
      placeholder: t('accounting.accountForm.accountNamePlaceholder')
    },
    {
      name: 'type',
      label: t('accounting.accountForm.accountType'),
      type: 'select',
      required: true,
      options: [
        { value: 'asset', label: t('accounting.accountTypes.asset') },
        { value: 'liability', label: t('accounting.accountTypes.liability') },
        { value: 'equity', label: t('accounting.accountTypes.equity') },
        { value: 'income', label: t('accounting.accountTypes.income') },
        { value: 'expense', label: t('accounting.accountTypes.expense') }
      ]
    }
  ];

  const accountOptions: EntityOption[] = localAccounts.map(account => ({
    id: account.id,
    label: `${account.account_number} - ${account.name}`,
    sublabel: account.type || undefined
  }));

  const handleCreateAccount = async (accountData: Record<string, any>) => {
    try {
      if (!currentCompanyId) {
        throw new Error('No current company selected');
      }

      // Simulation de création de compte comptable
      // Dans un vrai système, cela ferait appel au service de comptes
      const newAccount = {
        id: `account_${Date.now()}`,
        account_number: accountData.account_number,
        name: accountData.name,
        type: accountData.type,
        class: accountData.type, // Utiliser le même type pour la classe
        is_active: true,
        company_id: currentCompanyId,
        created_at: new Date().toISOString()
      };

      // Ajouter le nouveau compte à la liste (simulation)
      setLocalAccounts(prev => [...prev, newAccount]);

      toast({
        title: t('accounting.accountCreated'),
        description: t('accounting.accountCreatedDescription', { name: accountData.name }),
        variant: "default"
      });

      return { success: true, id: newAccount.id };
    } catch (error) {
      logger.error('Error creating account:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  useEffect(() => {
    const mapped = mapInitialData(initialData);
    reset(mapped);
    replace(mapped.lines);
  }, [initialData, reset, replace]);

  const handleAddLine = useCallback(() => {
    append({ ...DEFAULT_LINE });
  }, [append]);

  const handleRemoveLine = useCallback(
    (index: number) => {
      if (fields.length <= 2) {
        return;
      }
      remove(index);
    },
    [fields.length, remove],
  );

  const handleDebitChange = useCallback(
    (index: number, value: string) => {
      const parsed = coerceNumber(value);
      setValue(`lines.${index}.debitAmount`, parsed, { shouldDirty: true, shouldValidate: true });
      if (parsed > 0) {
        setValue(`lines.${index}.creditAmount`, 0, { shouldDirty: true, shouldValidate: true });
      }
    },
    [setValue],
  );

  const handleCreditChange = useCallback(
    (index: number, value: string) => {
      const parsed = coerceNumber(value);
      setValue(`lines.${index}.creditAmount`, parsed, { shouldDirty: true, shouldValidate: true });
      if (parsed > 0) {
        setValue(`lines.${index}.debitAmount`, 0, { shouldDirty: true, shouldValidate: true });
      }
    },
    [setValue],
  );

  const onSubmitHandler = useCallback(
    async (values: JournalEntryFormValues) => {
      if (!isBalanced) {
        toast({
          variant: 'destructive',
          title: t('error'),
          description: t('accountingPage.balanceError', {
            defaultValue: 'Le débit et le crédit doivent être équilibrés.',
          }),
        });
        return;
      }

      setSubmitting(true);
      try {
        const normalizedLines = values.lines.map((item) => ({
          accountId: item.accountId,
          debitAmount: coerceNumber(item.debitAmount),
          creditAmount: coerceNumber(item.creditAmount),
          description: item.description ?? '',
          currency: item.currency ?? DEFAULT_CURRENCY,
        }));

        await onSubmit({
          id: initialData?.id,
          status: initialData?.status,
          entryNumber: initialData?.entryNumber,
          entryDate: values.entryDate,
          description: values.description,
          referenceNumber: values.referenceNumber,
          journalId: values.journalId,
          lines: normalizedLines,
        });

        if (!initialData?.id) {
          const resetValues = mapInitialData();
          reset(resetValues);
          replace(resetValues.lines);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        toast({
          variant: 'destructive',
          title: t('error'),
          description: message || t('failedToSubmitEntry', {
            defaultValue: "Échec de l'enregistrement de l'écriture.",
          }),
        });
      } finally {
        setSubmitting(false);
      }
    },
    [initialData, isBalanced, onSubmit, replace, reset, t, toast],
  );

  const retryFetch = useCallback(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  return (
    <FormProvider {...form}>
      <form className="space-y-6" onSubmit={handleSubmit(onSubmitHandler)}>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">
            {initialData?.id ? t('journal_entries.edit') : t('journal_entries.new')}
          </h2>
        </div>

        {fetchError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{fetchError}</span>
              <Button variant="outline" size="sm" onClick={retryFetch}>
                {t('journal_entries.retry', { defaultValue: 'Réessayer' })}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="entryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('journal_entries.date')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full flex items-center justify-between',
                          !field.value && 'text-muted-foreground',
                        )}
                        type="button"
                      >
                        {field.value ? format(new Date(field.value), 'dd/MM/yyyy') : t('journal_entries.selectDate')}
                        <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))}
                      initialFocus
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="journalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('journal_entries.journal')}</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value)}
                  value={field.value}
                  disabled={loadingDropdowns || localJournals.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('journal_entries.selectJournal')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {loadingDropdowns ? (
                      <div className="flex items-center justify-center p-4 text-sm">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.loading')}
                      </div>
                    ) : localJournals.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        {t('journal_entries.no_journals_found', { defaultValue: 'Aucun journal trouvé' })}
                      </div>
                    ) : (
                      localJournals.map((journal) => (
                        <SelectItem key={journal.id} value={journal.id}>
                          {(journal.code ?? t('journal_entries.no_code', { defaultValue: 'Sans code' }))} - {journal.name ?? t('journal_entries.untitledJournal', { defaultValue: 'Journal' })}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="referenceNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('journal_entries.reference')}</FormLabel>
              <FormControl>
                <Input placeholder={t('journal_entries.reference')} {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('journal_entries.description')}</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder={t('journal_entries.description')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-lg">{t('journal_entries.lines')}</h3>
            <Button type="button" onClick={handleAddLine} variant="outline" size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('journal_entries.add_line')}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 w-1/4">{t('journal_entries.account')}</th>
                  <th className="text-left py-2 w-1/4">{t('journal_entries.description')}</th>
                  <th className="text-right py-2 w-1/6">{t('journal_entries.debit')}</th>
                  <th className="text-right py-2 w-1/6">{t('journal_entries.credit')}</th>
                  <th className="text-center py-2 w-[120px]">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((fieldItem, index) => {
                  const item = watchedLines[index] ?? DEFAULT_LINE;
                  return (
                    <tr className="border-b" key={fieldItem.id}>
                      <td className="py-2 pr-2 align-top">
                        <EntitySelector
                          options={accountOptions}
                          value={item.accountId}
                          onChange={(value) => setValue(`lines.${index}.accountId`, value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })}
                          onCreateEntity={handleCreateAccount}
                          createFormFields={accountCreateFormFields}
                          entityName={t('accounting.accountEntity.entityName')}
                          entityNamePlural={t('accounting.accountEntity.entityNamePlural')}
                          placeholder={t('allAccounts')}
                          canCreate={true}
                        />
                      </td>
                      <td className="py-2 pr-2 align-top">
                        <Input
                          value={item.description ?? ''}
                          onChange={(event) =>
                            setValue(`lines.${index}.description`, event.target.value, {
                              shouldDirty: true,
                            })
                          }
                          placeholder={t('journal_entries.description')}
                        />
                      </td>
                      <td className="py-2 pr-2 align-top">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.debitAmount ?? ''}
                          onChange={(event) => handleDebitChange(index, event.target.value)}
                          className="text-right"
                        />
                      </td>
                      <td className="py-2 pr-2 align-top">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.creditAmount ?? ''}
                          onChange={(event) => handleCreditChange(index, event.target.value)}
                          className="text-right"
                        />
                      </td>
                      <td className="py-2 text-center align-top">
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => handleRemoveLine(index)}
                          disabled={fields.length <= 2}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('journal_entries.remove_line')}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-bold border-t">
                  <td colSpan={2} className="py-2 text-right">
                    {t('journal_entries.total')}
                  </td>
                  <td className="py-2 text-right">{totals.debit.toFixed(2)}</td>
                  <td className="py-2 text-right">{totals.credit.toFixed(2)}</td>
                  <td />
                </tr>
                <tr className={cn('font-semibold', isBalanced ? 'text-green-600' : 'text-red-600')}>
                  <td colSpan={2} className="py-2 text-right">
                    {t('journal_entries.difference')}
                  </td>
                  <td colSpan={2} className="py-2 text-right">
                    {Math.abs(totals.debit - totals.credit).toFixed(2)}
                  </td>
                  <td className="py-2 text-center text-xs">
                    {isBalanced
                      ? `✓ ${t('journal_entries.balanced')}`
                      : `✗ ${t('journal_entries.unbalanced')}`}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('journal_entries.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={submitting || !isBalanced || watchedLines.some((item) => !(item?.accountId))}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.saving', { defaultValue: 'Enregistrement...' })}
              </>
            ) : initialData?.id ? (
              t('journal_entries.update')
            ) : (
              t('journal_entries.create')
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default JournalEntryForm;






