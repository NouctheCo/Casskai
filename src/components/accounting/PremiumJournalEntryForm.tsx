/**
 * Formulaire premium d'écriture comptable
 * Démontre l'utilisation des hooks UX optimisés (Task #30)
 *
 * Features:
 * - Raccourcis clavier (Ctrl+S, Ctrl+Enter, Esc, Ctrl+Z/Y)
 * - Undo/Redo complet
 * - Autocomplétion intelligente (<100ms)
 * - Validation inline temps réel
 *
 * @module PremiumJournalEntryForm
 */

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useFormShortcuts, ShortcutsHelp } from '@/hooks/useFormShortcuts';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useAccountAutocomplete, useThirdPartyAutocomplete } from '@/hooks/useAutocomplete';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toastSuccess, toastError } from '@/lib/toast-helpers';
import { logger } from '@/lib/logger';
import { Undo2, Redo2, Save, X, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Schema de validation Zod avec traductions
const getJournalEntrySchema = (t: any) => z.object({
  date: z.string().min(1, t('premiumForm.dateRequired')),
  reference: z.string().min(1, t('premiumForm.referenceRequired')),
  accountCode: z.string().min(1, t('premiumForm.accountCodeRequired')),
  thirdPartyId: z.string().optional(),
  label: z.string().min(3, t('premiumForm.labelMin')),
  debit: z.number().min(0, t('premiumForm.debitPositive')).optional(),
  credit: z.number().min(0, t('premiumForm.creditPositive')).optional(),
}).refine(
  (data) => (data.debit && data.debit > 0) || (data.credit && data.credit > 0),
  { message: t('premiumForm.debitOrCreditRequired'), path: ['debit'] }
);

type JournalEntryFormData = z.infer<ReturnType<typeof getJournalEntrySchema>>;

interface PremiumJournalEntryFormProps {
  /**
   * Données initiales (mode édition)
   */
  initialData?: Partial<JournalEntryFormData>;

  /**
   * Callback de sauvegarde
   */
  onSave: (data: JournalEntryFormData) => Promise<void>;

  /**
   * Callback d'annulation
   */
  onCancel: () => void;

  /**
   * Mode lecture seule
   */
  readOnly?: boolean;
}

/**
 * Données mockées pour démo
 */
const MOCK_ACCOUNTS = [
  { code: '411000', label: 'Clients' },
  { code: '401000', label: 'Fournisseurs' },
  { code: '512000', label: 'Banque' },
  { code: '531000', label: 'Caisse' },
  { code: '706000', label: 'Prestations de services' },
  { code: '707000', label: 'Ventes de marchandises' },
  { code: '445710', label: 'TVA collectée' },
  { code: '445660', label: 'TVA déductible' },
  { code: '601000', label: 'Achats de matières premières' },
  { code: '641000', label: 'Rémunérations du personnel' },
];

const MOCK_THIRD_PARTIES = [
  { id: '1', name: 'Société ABC', code: 'ABC001', type: 'client' },
  { id: '2', name: 'Fournisseur XYZ', code: 'XYZ002', type: 'fournisseur' },
  { id: '3', name: 'Client DEF', code: 'DEF003', type: 'client' },
  { id: '4', name: 'Prestataire GHI', code: 'GHI004', type: 'fournisseur' },
];

export function PremiumJournalEntryForm({
  initialData,
  onSave,
  onCancel,
  readOnly = false
}: PremiumJournalEntryFormProps) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm<JournalEntryFormData>({
    resolver: zodResolver(getJournalEntrySchema(t)),
    defaultValues: initialData || {
      date: new Date().toISOString().split('T')[0],
      reference: '',
      accountCode: '',
      thirdPartyId: '',
      label: '',
      debit: undefined,
      credit: undefined
    },
    mode: 'onChange' // Validation temps réel
  });

  const formData = watch();

  // Undo/Redo
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    pushAction
  } = useUndoRedo({
    enableKeyboardShortcuts: false, // Géré par useFormShortcuts
    onUndo: (action) => {
      // Restaurer les valeurs du formulaire
      const previousState = action.previousState as JournalEntryFormData;
      Object.keys(previousState).forEach((key) => {
        setValue(key as keyof JournalEntryFormData, previousState[key as keyof JournalEntryFormData]);
      });
      toastSuccess(t('shortcuts.undone'));
    },
    onRedo: (action) => {
      // Restaurer les valeurs du formulaire
      const nextState = action.nextState as JournalEntryFormData;
      Object.keys(nextState).forEach((key) => {
        setValue(key as keyof JournalEntryFormData, nextState[key as keyof JournalEntryFormData]);
      });
      toastSuccess(t('shortcuts.redone'));
    }
  });

  // Enregistrer les changements dans l'historique undo/redo
  const previousFormDataRef = useState(formData);
  useEffect(() => {
    if (JSON.stringify(formData) !== JSON.stringify(previousFormDataRef[0])) {
      pushAction({
        type: 'update_journal_entry',
        description: 'Modification formulaire',
        previousState: previousFormDataRef[0],
        nextState: formData
      });
      previousFormDataRef[0] = formData;
    }
  }, [formData, pushAction]);

  // Autocomplétion compte comptable
  const accountAutocomplete = useAccountAutocomplete(MOCK_ACCOUNTS);

  // Autocomplétion tiers
  const thirdPartyAutocomplete = useThirdPartyAutocomplete(MOCK_THIRD_PARTIES);

  /**
   * Sauvegarde du formulaire
   */
  const handleSave = useCallback(async () => {
    if (readOnly) return;

    await handleSubmit(
      async (data) => {
        setIsSaving(true);
        try {
          await onSave(data);
          toastSuccess(t('premiumForm.saveSuccess'));
        } catch (error) {
          logger.error('PremiumJournalEntryForm', 'Error saving journal entry:', error);
          toastError(t('premiumForm.saveError'));
        } finally {
          setIsSaving(false);
        }
      },
      (errors) => {
        logger.debug('PremiumJournalEntryForm', 'Validation errors:', errors);
        toastError(t('premiumForm.validationError'));
      }
    )();
  }, [handleSubmit, onSave, readOnly]);

  /**
   * Validation et soumission
   */
  const handleValidate = useCallback(async () => {
    await handleSave();
  }, [handleSave]);

  // Raccourcis clavier
  useFormShortcuts(
    {
      onSave: handleSave,
      onSubmit: handleValidate,
      onCancel,
      onUndo: undo,
      onRedo: redo
    },
    {
      enabled: !readOnly,
      showToast: true,
      toastPrefix: 'Écriture:',
      debug: false
    }
  );

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {t('premiumForm.title')}
            {isDirty && (
              <Badge variant="outline" className="ml-2">
                {t('premiumForm.unsaved')}
              </Badge>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* Undo/Redo buttons */}
            <TooltipProvider>
              <div className="flex items-center gap-1 mr-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={undo}
                      disabled={!canUndo || readOnly}
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('premiumForm.undoTooltip')}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={redo}
                      disabled={!canRedo || readOnly}
                    >
                      <Redo2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('premiumForm.redoTooltip')}</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            {/* Shortcuts help */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('premiumForm.showShortcuts')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Shortcuts help panel */}
        {showShortcutsHelp && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <ShortcutsHelp shortcuts={['SAVE', 'SUBMIT', 'CANCEL', 'UNDO', 'REDO']} />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">
              {t('premiumForm.date')} <span className="text-red-500">{t('premiumForm.required')}</span>
            </Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
              disabled={readOnly}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date.message}</p>
            )}
          </div>

          {/* Référence */}
          <div className="space-y-2">
            <Label htmlFor="reference">
              {t('premiumForm.reference')} <span className="text-red-500">{t('premiumForm.required')}</span>
            </Label>
            <Input
              id="reference"
              {...register('reference')}
              disabled={readOnly}
              placeholder={t('premiumForm.referencePlaceholder')}
              className={errors.reference ? 'border-red-500' : ''}
            />
            {errors.reference && (
              <p className="text-sm text-red-500">{errors.reference.message}</p>
            )}
          </div>
        </div>

        {/* Compte comptable avec autocomplétion */}
        <div className="space-y-2">
          <Label htmlFor="accountCode">
            {t('premiumForm.accountCode')} <span className="text-red-500">{t('premiumForm.required')}</span>
          </Label>
          <div className="relative">
            <Input
              id="accountCode"
              value={accountAutocomplete.query}
              onChange={(e) => accountAutocomplete.setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  accountAutocomplete.highlightNext();
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  accountAutocomplete.highlightPrevious();
                }
                if (e.key === 'Enter' && accountAutocomplete.results.length > 0) {
                  e.preventDefault();
                  accountAutocomplete.selectHighlighted();
                }
              }}
              disabled={readOnly}
              placeholder={t('premiumForm.accountCodePlaceholder')}
              className={errors.accountCode ? 'border-red-500' : ''}
              autoComplete="off"
            />

            {/* Résultats autocomplete */}
            {accountAutocomplete.query && accountAutocomplete.results.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                {accountAutocomplete.results.map((result, index) => (
                  <div
                    key={result.value}
                    onClick={() => {
                      accountAutocomplete.selectOption(result);
                      setValue('accountCode', result.value as string);
                    }}
                    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                      index === accountAutocomplete.highlightedIndex ? 'bg-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.label}</span>
                      {result.score && (
                        <Badge variant="outline" className="text-xs">
                          {t('premiumForm.scorePercent', { score: Math.round(result.score * 100) })}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}

                {accountAutocomplete.searchTime !== undefined && (
                  <div className="px-4 py-1 text-xs text-gray-500 border-t">
                    {t('premiumForm.searchTime', { time: accountAutocomplete.searchTime.toFixed(0) })}
                  </div>
                )}
              </div>
            )}
          </div>
          {errors.accountCode && (
            <p className="text-sm text-red-500">{errors.accountCode.message}</p>
          )}
        </div>

        {/* Tiers avec autocomplétion */}
        <div className="space-y-2">
          <Label htmlFor="thirdPartyId">{t('premiumForm.thirdParty')}</Label>
          <div className="relative">
            <Input
              id="thirdPartyId"
              value={thirdPartyAutocomplete.query}
              onChange={(e) => thirdPartyAutocomplete.setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  thirdPartyAutocomplete.highlightNext();
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  thirdPartyAutocomplete.highlightPrevious();
                }
                if (e.key === 'Enter' && thirdPartyAutocomplete.results.length > 0) {
                  e.preventDefault();
                  thirdPartyAutocomplete.selectHighlighted();
                }
              }}
              disabled={readOnly}
              placeholder={t('premiumForm.thirdPartyPlaceholder')}
              autoComplete="off"
            />

            {/* Résultats autocomplete */}
            {thirdPartyAutocomplete.query && thirdPartyAutocomplete.results.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                {thirdPartyAutocomplete.results.map((result, index) => (
                  <div
                    key={result.value}
                    onClick={() => {
                      thirdPartyAutocomplete.selectOption(result);
                      setValue('thirdPartyId', result.value as string);
                    }}
                    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                      index === thirdPartyAutocomplete.highlightedIndex ? 'bg-gray-100' : ''
                    }`}
                  >
                    {result.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Libellé */}
        <div className="space-y-2">
          <Label htmlFor="label">
            {t('premiumForm.label')} <span className="text-red-500">{t('premiumForm.required')}</span>
          </Label>
          <Input
            id="label"
            {...register('label')}
            disabled={readOnly}
            placeholder={t('premiumForm.labelPlaceholder')}
            className={errors.label ? 'border-red-500' : ''}
          />
          {errors.label && (
            <p className="text-sm text-red-500">{errors.label.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Débit */}
          <div className="space-y-2">
            <Label htmlFor="debit">{t('premiumForm.debit')}</Label>
            <Input
              id="debit"
              type="number"
              step="0.01"
              {...register('debit', { valueAsNumber: true })}
              disabled={readOnly}
              placeholder="0.00"
              className={errors.debit ? 'border-red-500' : ''}
            />
            {errors.debit && (
              <p className="text-sm text-red-500">{errors.debit.message}</p>
            )}
          </div>

          {/* Crédit */}
          <div className="space-y-2">
            <Label htmlFor="credit">{t('premiumForm.credit')}</Label>
            <Input
              id="credit"
              type="number"
              step="0.01"
              {...register('credit', { valueAsNumber: true })}
              disabled={readOnly}
              placeholder="0.00"
              className={errors.credit ? 'border-red-500' : ''}
            />
            {errors.credit && (
              <p className="text-sm text-red-500">{errors.credit.message}</p>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          <X className="h-4 w-4 mr-2" />
          {t('premiumForm.cancel')}
          <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded">Échap</kbd>
        </Button>

        <Button onClick={handleSave} disabled={isSaving || readOnly}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? t('premiumForm.saving') : t('premiumForm.save')}
          <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-primary-foreground/20 rounded">
            Ctrl+S
          </kbd>
        </Button>
      </CardFooter>
    </Card>
  );
}
