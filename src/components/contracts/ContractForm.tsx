/**
 * Formulaire de création/édition de contrats
 * Utilise react-hook-form et les composants UI existants
 */
import React, { useEffect, useMemo } from 'react';
import { useForm, useFieldArray, ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
// import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { useToast } from '../ui/use-toast';
import { useCurrency } from '../../hooks/useCurrency';
import { ContractData, ContractFormData, ContractType, DiscountConfig } from '../../types/contracts.types';
import { Plus, X, DollarSign, Percent, TrendingUp } from 'lucide-react';
import { logger } from '@/lib/logger';
import { getCurrentCompanyCurrency } from '@/lib/utils';
import SmartAutocomplete, { type AutocompleteOption } from '@/components/ui/SmartAutocomplete';
// Schéma de validation Zod
const contractSchema = z.object({
  client_id: z.string().min(1, 'Veuillez sélectionner un client'),
  contract_name: z.string().min(3, 'Le nom du contrat doit contenir au moins 3 caractères'),
  contract_type: z.enum(['progressive', 'fixed_percent', 'fixed_amount']),
  start_date: z.string().min(1, 'La date de début est requise'),
  end_date: z.string().optional(),
  currency: z.string().min(1, 'La devise est requise'),
  notes: z.string().optional(),
  // Configuration des remises selon le type
  fixed_rate: z.number().min(0).max(1).optional(),
  fixed_amount: z.number().min(0).optional(),
  tiers: z.array(z.object({
    min: z.number().min(0),
    max: z.number().nullable(),
    rate: z.number().min(0).max(1),
    description: z.string().optional()
  })).optional()
});
interface ClientOption {
  id: string;
  name: string;
}

interface ContractFormValues {
  client_id: string;
  contract_name: string;
  contract_type: ContractType;
  start_date: string;
  end_date: string;
  currency: string;
  notes: string;
  fixed_rate: number;
  fixed_amount: number;
  tiers: Array<{
    id?: string;
    min: number;
    max: number | null;
    rate: number;
    description?: string;
  }>;
}
interface ContractFormProps {
  contract?: ContractData;
  onSubmit: (data: ContractFormData) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
  clients: ClientOption[];
  clientsLoading?: boolean;
}
export const ContractForm: React.FC<ContractFormProps> = ({
  contract,
  onSubmit,
  onCancel,
  loading = false,
  clients,
  clientsLoading = false
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { currencies } = useCurrency();
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      client_id: contract?.client_id || '',
      contract_name: contract?.contract_name || '',
      contract_type: contract?.contract_type || 'progressive',
      start_date: contract?.start_date || '',
      end_date: contract?.end_date || '',
      currency: contract?.currency || getCurrentCompanyCurrency(),
      notes: '',
      fixed_rate: contract?.discount_config.type === 'fixed_percent' ? contract.discount_config.rate : 0.01,
      fixed_amount: contract?.discount_config.type === 'fixed_amount' ? contract.discount_config.amount : 10000,
      tiers: contract?.discount_config.type === 'progressive' ? contract.discount_config.tiers : [
        { min: 0, max: 100000, rate: 0.01, description: '1% jusqu\'à 100k€' },
        { min: 100001, max: 500000, rate: 0.015, description: '1.5% de 100k à 500k€' },
        { min: 500001, max: null, rate: 0.02, description: '2% au-delà de 500k€' }
      ]
    }
  });
  const clientOptions = useMemo(() => {
    if (contract?.client_id && !clients.find((client) => client.id === contract.client_id)) {
      return [
        ...clients,
        {
          id: contract.client_id,
          name: contract.client_name || 'Client existant'
        }
      ];
    }
    return clients;
  }, [clients, contract]);
  useEffect(() => {
    if (!contract && clientOptions.length > 0 && !form.getValues('client_id')) {
      form.setValue('client_id', clientOptions[0].id);
    }
  }, [contract, clientOptions, form]);

  // Valider et corriger la devise par défaut si elle n'existe pas
  useEffect(() => {
    const currentCurrency = form.getValues('currency');
    const currencyExists = currencies.some(c => c.code === currentCurrency);
    
    if (!currencyExists && currencies.length > 0) {
      // Si la devise par défaut n'existe pas, utiliser la première disponible
      logger.warn('ContractForm', `Devise "${currentCurrency}" non trouvée, utilisation de "${currencies[0].code}"`);
      form.setValue('currency', currencies[0].code);
    }
  }, [currencies, form]);
  const hasClients = clientOptions.length > 0;
  const isCreateMode = !contract;
  const contractType = form.watch('contract_type');

  // Options autocomplete pour clients
  const clientAutocompleteOptions: AutocompleteOption[] = useMemo(() => {
    return clientOptions.map(client => ({
      value: client.id,
      label: client.name,
      description: undefined as string | undefined,
      metadata: client
    }));
  }, [clientOptions]);

  // Options autocomplete pour types de contrat
  const contractTypeOptions: AutocompleteOption[] = useMemo(() => [
    { value: 'progressive', label: 'Remise progressive (par paliers)', description: 'Taux varie selon montant', category: 'Types' },
    { value: 'fixed_percent', label: 'Pourcentage fixe', description: 'Taux unique constant', category: 'Types' },
    { value: 'fixed_amount', label: 'Montant fixe', description: 'Montant constant en €', category: 'Types' },
  ], []);

  // Options autocomplete pour devises
  const currencyAutocompleteOptions: AutocompleteOption[] = useMemo(() => {
    return currencies.map(currency => ({
      value: currency.code,
      label: `${currency.code} (${currency.symbol})`,
      description: currency.name,
      metadata: currency
    }));
  }, [currencies]);
  const { fields: tierFields, append: appendTier, remove: removeTier } = useFieldArray({
    control: form.control,
    name: 'tiers'
  });
  const handleSubmit = async (data: ContractFormValues) => {
    try {
      // Valider que les données requises existent
      if (!data.client_id) {
        throw new Error('Le client est requis');
      }
      if (!data.contract_name) {
        throw new Error('Le nom du contrat est requis');
      }
      if (!data.currency) {
        throw new Error('La devise est requise');
      }

      // Construire la configuration des remises selon le type
      let discount_config: DiscountConfig;
      switch (data.contract_type) {
        case 'progressive':
          if (!data.tiers || data.tiers.length === 0) {
            throw new Error('Au moins un palier est requis pour les remises progressives');
          }
          discount_config = {
            type: 'progressive' as ContractType,
            tiers: data.tiers
          };
          break;
        case 'fixed_percent':
          if (data.fixed_rate === undefined || data.fixed_rate === null) {
            throw new Error('Le taux de remise est requis');
          }
          if (data.fixed_rate < 0 || data.fixed_rate > 1) {
            throw new Error('Le taux de remise doit être entre 0% et 100%');
          }
          discount_config = {
            type: 'fixed_percent' as ContractType,
            rate: data.fixed_rate
          };
          break;
        case 'fixed_amount':
          if (data.fixed_amount === undefined || data.fixed_amount === null) {
            throw new Error('Le montant fixe est requis');
          }
          if (data.fixed_amount < 0) {
            throw new Error('Le montant fixe doit être positif');
          }
          discount_config = {
            type: 'fixed_amount' as ContractType,
            amount: data.fixed_amount
          };
          break;
        default:
          throw new Error('Type de contrat invalide');
      }
      const formData: ContractFormData = {
        client_id: data.client_id,
        contract_name: data.contract_name,
        contract_type: data.contract_type,
        discount_config,
        start_date: data.start_date,
        end_date: data.end_date,
        currency: data.currency,
        notes: data.notes
      };
      const success = await onSubmit(formData);
      if (success) {
        toast({
          title: "Succès",
          description: contract ? "Contrat mis à jour avec succès" : "Contrat créé avec succès",
          variant: "default"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'enregistrement';
      logger.error('ContractForm', 'Erreur lors de l\'enregistrement du contrat:', errorMessage);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };
  const addTier = () => {
    const lastTier = tierFields[tierFields.length - 1];
    const newMin = lastTier ? (lastTier.max || 0) + 1 : 0;
    appendTier({
      min: newMin,
      max: newMin + 100000,
      rate: 0.01,
      description: `Nouveau palier`
    });
  };
  return (
    <div className="max-w-4xl mx-auto">
      <Form form={form} onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                {t('contracts.form.general_info', 'Informations générales')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }: { field: ControllerRenderProps<ContractFormData, any> }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.form.client', 'Client')}</FormLabel>
                      <FormControl>
                        <SmartAutocomplete
                          value={field.value}
                          onChange={field.onChange}
                          options={clientAutocompleteOptions}
                          placeholder={clientsLoading ? 'Chargement...' : 'Sélectionner un client'}
                          searchPlaceholder="Rechercher un client..."
                          groups={false}
                          showRecent={true}
                          maxRecent={5}
                          disabled={loading || clientsLoading || (isCreateMode && !hasClients)}
                        />
                      </FormControl>
                      {!clientsLoading && !hasClients && (
                        <p className="text-sm text-muted-foreground">
                          Aucun client actif. Créez un client dans le module CRM avant d'ajouter un contrat.
                        </p>
                      )}
                      {clientsLoading && (
                        <p className="text-sm text-muted-foreground">Chargement des clients...</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contract_name"
                  render={({ field }: { field: ControllerRenderProps<ContractFormData, any> }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.form.name', 'Nom du contrat')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Contrat Commercial 2024" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="contract_type"
                  render={({ field }: { field: ControllerRenderProps<ContractFormData, any> }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.form.type', 'Type de remise')}</FormLabel>
                      <FormControl>
                        <SmartAutocomplete
                          value={field.value}
                          onChange={field.onChange}
                          options={contractTypeOptions}
                          placeholder="Type de remise..."
                          searchPlaceholder="Rechercher (progressive, fixe)..."
                          groups={true}
                          showRecent={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }: { field: ControllerRenderProps<ContractFormData, any> }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.form.start_date', 'Date de début')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }: { field: ControllerRenderProps<ContractFormData, any> }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.form.end_date', 'Date de fin (optionnelle)')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="currency"
                render={({ field }: { field: ControllerRenderProps<ContractFormData, any> }) => (
                  <FormItem>
                    <FormLabel>{t('contracts.form.currency', 'Devise')}</FormLabel>
                    <FormControl>
                      <SmartAutocomplete
                        value={field.value}
                        onChange={field.onChange}
                        options={currencyAutocompleteOptions}
                        placeholder="Devise..."
                        searchPlaceholder="Rechercher (EUR, USD)..."
                        groups={false}
                        showRecent={true}
                        maxRecent={3}
                        className="w-32"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          {/* Configuration des remises */}
          <Card>
            <CardHeader>
              <CardTitle>{t('contracts.form.discount_config', 'Configuration des remises')}</CardTitle>
            </CardHeader>
            <CardContent>
              {contractType === 'progressive' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Paliers de remises</h4>
                    <Button type="button" variant="outline" size="sm" onClick={addTier}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un palier
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {tierFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="p-4 border rounded-lg bg-gray-50 text-gray-900 dark:bg-gray-900/60 dark:text-white border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium">Palier {index + 1}</h5>
                          {tierFields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTier(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <FormField
                            control={form.control}
                            name={`tiers.${index}.min`}
                            render={({ field }: { field: ControllerRenderProps<ContractFormData, any> }) => (
                              <FormItem>
                                <FormLabel>Minimum (€)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`tiers.${index}.max`}
                            render={({ field }: { field: ControllerRenderProps<ContractFormData, any> }) => (
                              <FormItem>
                                <FormLabel>Maximum (€)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                    placeholder="Illimité"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`tiers.${index}.rate`}
                            render={({ field }: { field: ControllerRenderProps<ContractFormData, any> }) => (
                              <FormItem>
                                <FormLabel>Taux (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    value={(field.value * 100).toFixed(2)}
                                    onChange={(e) => field.onChange(Number(e.target.value) / 100)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`tiers.${index}.description`}
                            render={({ field }: { field: ControllerRenderProps<ContractFormData, any> }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Description du palier" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {contractType === 'fixed_percent' && (
                <FormField
                  control={form.control}
                  name="fixed_rate"
                  render={({ field }: { field: ControllerRenderProps<ContractFormData, any> }) => (
                    <FormItem>
                      <FormLabel>Taux de remise (%)</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={((field.value || 0) * 100).toFixed(2)}
                            onChange={(e) => field.onChange(Number(e.target.value) / 100)}
                            className="w-32"
                          />
                          <span className="text-muted-foreground">% du chiffre d'affaires total</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {contractType === 'fixed_amount' && (
                <FormField
                  control={form.control}
                  name="fixed_amount"
                  render={({ field }: { field: ControllerRenderProps<ContractFormData, any> }) => (
                    <FormItem>
                      <FormLabel>Montant de remise fixe</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="w-48"
                          />
                          <span className="text-muted-foreground">{form.watch('currency')}</span>
                          <span className="text-sm text-muted-foreground">indépendant du CA</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>
          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button type="submit" disabled={loading || clientsLoading || (isCreateMode && !hasClients)}>
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('common.saving', 'Enregistrement...')}
                </div>
              ) : (
                t('common.save', 'Enregistrer')
              )}
            </Button>
          </div>
      </Form>
    </div>
  );
};