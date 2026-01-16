/**
 * Formulaire de création/édition de contrats
 * Utilise react-hook-form et les composants UI existants
 */
import React, { useEffect, useMemo, useState } from 'react';
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
import { ContractData, ContractFormData, ContractType } from '../../types/contracts.types';
import { Plus, X, DollarSign, Percent, TrendingUp } from 'lucide-react';
import { logger } from '@/lib/logger';
import { MultiSelect } from '@/components/ui/multi-select';
import { rfaProductGroupsService } from '@/services/rfa/rfaProductGroupsService';
// Schéma de validation Zod
const contractSchema = z.object({
  client_id: z.string().min(1, 'Veuillez sélectionner un client'),
  contract_name: z.string().min(3, 'Le nom du contrat doit contenir au moins 3 caractères'),
  contract_type: z.enum(['progressive', 'fixed_percent', 'fixed_amount']),
  start_date: z.string().min(1, 'La date de début est requise'),
  end_date: z.string().optional(),
  currency: z.string().min(1, 'La devise est requise'),
  conditions: z.string().optional(),
  rfa_base_type: z.enum(['total_client', 'product_groups']).optional(),
  rfa_base_product_groups: z.array(z.string()).optional(),
  rfa_application_type: z.enum(['same_as_base', 'specific_groups', 'total_client']).optional(),
  rfa_application_product_groups: z.array(z.string()).optional(),
  rfa_period_type: z.enum(['contract_period', 'calendar_year', 'custom']).optional(),
  rfa_custom_period_start: z.string().nullable().optional(),
  rfa_custom_period_end: z.string().nullable().optional(),
  rfa_projection_method: z.enum(['linear', 'weighted_average', 'seasonal']).optional(),
  rfa_notes: z.string().nullable().optional(),
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
interface ContractFormProps {
  contract?: ContractData;
  enterpriseId?: string;
  onSubmit: (data: ContractFormData) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
  clients: ClientOption[];
  clientsLoading?: boolean;
}
export const ContractForm: React.FC<ContractFormProps> = ({
  contract,
  enterpriseId,
  onSubmit,
  onCancel,
  loading = false,
  clients,
  clientsLoading = false
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { currencies } = useCurrency();

  const [productGroups, setProductGroups] = useState<Array<{ id: string; name: string; code: string | null }>>([]);
  useEffect(() => {
    const run = async () => {
      if (!enterpriseId) return;
      try {
        const groups = await rfaProductGroupsService.listGroups(enterpriseId);
        setProductGroups(groups.map(g => ({ id: g.id, name: g.name, code: g.code })));
      } catch {
        setProductGroups([]);
      }
    };
    run();
  }, [enterpriseId]);

  const groupOptions = useMemo(() => {
    return productGroups.map(g => ({
      value: g.id,
      label: g.code ? `${g.name} (${g.code})` : g.name
    }));
  }, [productGroups]);

  const form = useForm({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      client_id: contract?.client_id || '',
      contract_name: contract?.contract_name || '',
      contract_type: contract?.contract_type || 'progressive',
      start_date: contract?.start_date || '',
      end_date: contract?.end_date || '',
      currency: contract?.currency || 'EUR',
      conditions: '',
      rfa_base_type: (contract as any)?.rfa_base_type || 'total_client',
      rfa_base_product_groups: (contract as any)?.rfa_base_product_groups || [],
      rfa_application_type: (contract as any)?.rfa_application_type || 'same_as_base',
      rfa_application_product_groups: (contract as any)?.rfa_application_product_groups || [],
      rfa_period_type: (contract as any)?.rfa_period_type || 'contract_period',
      rfa_custom_period_start: (contract as any)?.rfa_custom_period_start || null,
      rfa_custom_period_end: (contract as any)?.rfa_custom_period_end || null,
      rfa_projection_method: (contract as any)?.rfa_projection_method || 'linear',
      rfa_notes: (contract as any)?.rfa_notes || null,
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
  const hasClients = clientOptions.length > 0;
  const isCreateMode = !contract;
  const contractType = form.watch('contract_type');
  const { fields: tierFields, append: appendTier, remove: removeTier } = useFieldArray({
    control: form.control,
    name: 'tiers'
  });
  const handleSubmit = async (data: any) => {
    try {
      // Construire la configuration des remises selon le type
      let discount_config;
      switch (data.contract_type) {
        case 'progressive':
          discount_config = {
            type: 'progressive' as ContractType,
            tiers: data.tiers || []
          };
          break;
        case 'fixed_percent':
          discount_config = {
            type: 'fixed_percent' as ContractType,
            rate: data.fixed_rate || 0.01
          };
          break;
        case 'fixed_amount':
          discount_config = {
            type: 'fixed_amount' as ContractType,
            amount: data.fixed_amount || 10000
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
        rfa_base_type: data.rfa_base_type,
        rfa_base_product_groups: data.rfa_base_product_groups || [],
        rfa_application_type: data.rfa_application_type,
        rfa_application_product_groups: data.rfa_application_product_groups || [],
        rfa_period_type: data.rfa_period_type,
        rfa_custom_period_start: data.rfa_custom_period_start || null,
        rfa_custom_period_end: data.rfa_custom_period_end || null,
        rfa_projection_method: data.rfa_projection_method,
        rfa_notes: data.rfa_notes || null,
        start_date: data.start_date,
        end_date: data.end_date,
        currency: data.currency,
        conditions: data.conditions
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
      <Form form={form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={loading || clientsLoading || (isCreateMode && !hasClients)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={clientsLoading ? 'Chargement...' : 'Sélectionner un client'} />
                          </SelectTrigger>
                          <SelectContent>
                            {clientOptions.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="progressive">
                              <div className="flex items-center">
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Paliers progressifs
                              </div>
                            </SelectItem>
                            <SelectItem value="fixed_percent">
                              <div className="flex items-center">
                                <Percent className="h-4 w-4 mr-2" />
                                Pourcentage fixe
                              </div>
                            </SelectItem>
                            <SelectItem value="fixed_amount">
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-2" />
                                Montant fixe
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
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
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.code} - {currency.symbol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

          {/* RFA avancée */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                {t('contracts.rfaAdvanced.contractForm.sectionTitle', 'RFA avancée (groupes / période)')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rfa_base_type"
                  render={({ field }: { field: ControllerRenderProps<ContractFormData, any> }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.rfaAdvanced.contractForm.baseTypeLabel', 'Base de calcul des paliers')}</FormLabel>
                      <FormControl>
                        <Select value={field.value || 'total_client'} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('contracts.rfaAdvanced.contractForm.choosePlaceholder', t('contracts.rfaAdvanced.imports.choosePlaceholder', 'Choisir'))} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="total_client">{t('contracts.rfaAdvanced.contractForm.baseType.total_client', 'CA total client')}</SelectItem>
                            <SelectItem value="product_groups">{t('contracts.rfaAdvanced.contractForm.baseType.product_groups', 'CA de groupes')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rfa_application_type"
                  render={({ field }: { field: ControllerRenderProps<ContractFormData, any> }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.rfaAdvanced.contractForm.applicationTypeLabel', 'Application de la RFA')}</FormLabel>
                      <FormControl>
                        <Select value={field.value || 'same_as_base'} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('contracts.rfaAdvanced.contractForm.choosePlaceholder', t('contracts.rfaAdvanced.imports.choosePlaceholder', 'Choisir'))} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="same_as_base">{t('contracts.rfaAdvanced.contractForm.applicationType.same_as_base', 'Même périmètre que la base')}</SelectItem>
                            <SelectItem value="specific_groups">{t('contracts.rfaAdvanced.contractForm.applicationType.specific_groups', 'Groupes spécifiques')}</SelectItem>
                            <SelectItem value="total_client">{t('contracts.rfaAdvanced.contractForm.applicationType.total_client', 'CA total client')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {form.watch('rfa_base_type') === 'product_groups' && (
                <FormField
                  control={form.control}
                  name="rfa_base_product_groups"
                  render={({ field }: { field: ControllerRenderProps<ContractFormData, any> }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.rfaAdvanced.contractForm.groupsBaseLabel', 'Groupes (base)')}</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={groupOptions}
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder={t('contracts.rfaAdvanced.contractForm.groupsBasePlaceholder', 'Sélectionner les groupes de base')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch('rfa_application_type') === 'specific_groups' && (
                <FormField
                  control={form.control}
                  name="rfa_application_product_groups"
                  render={({ field }: { field: ControllerRenderProps<ContractFormData, any> }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.rfaAdvanced.contractForm.groupsApplicationLabel', 'Groupes (application)')}</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={groupOptions}
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder={t('contracts.rfaAdvanced.contractForm.groupsApplicationPlaceholder', 'Sélectionner les groupes d’application')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rfa_period_type"
                  render={({ field }: { field: ControllerRenderProps<ContractFormData, any> }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.rfaAdvanced.contractForm.periodTypeLabel', 'Période RFA')}</FormLabel>
                      <FormControl>
                        <Select value={field.value || 'contract_period'} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('contracts.rfaAdvanced.contractForm.choosePlaceholder', t('contracts.rfaAdvanced.imports.choosePlaceholder', 'Choisir'))} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contract_period">{t('contracts.rfaAdvanced.contractForm.periodType.contract_period', 'Période du contrat')}</SelectItem>
                            <SelectItem value="calendar_year">{t('contracts.rfaAdvanced.contractForm.periodType.calendar_year', 'Année civile')}</SelectItem>
                            <SelectItem value="custom">{t('contracts.rfaAdvanced.contractForm.periodType.custom', 'Personnalisée')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rfa_projection_method"
                  render={({ field }: { field: ControllerRenderProps<ContractFormData, any> }) => (
                    <FormItem>
                      <FormLabel>{t('contracts.rfaAdvanced.contractForm.projectionMethodLabel', 'Méthode de projection')}</FormLabel>
                      <FormControl>
                        <Select value={field.value || 'linear'} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('contracts.rfaAdvanced.contractForm.choosePlaceholder', t('contracts.rfaAdvanced.imports.choosePlaceholder', 'Choisir'))} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="linear">{t('contracts.rfaAdvanced.contractForm.projectionMethod.linear', 'Linéaire')}</SelectItem>
                            <SelectItem value="weighted_average">{t('contracts.rfaAdvanced.contractForm.projectionMethod.weighted_average', 'Moyenne pondérée')}</SelectItem>
                            <SelectItem value="seasonal">{t('contracts.rfaAdvanced.contractForm.projectionMethod.seasonal', 'Saisonnier')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {form.watch('rfa_period_type') === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rfa_custom_period_start"
                    render={({ field }: { field: ControllerRenderProps<ContractFormData, any> }) => (
                      <FormItem>
                        <FormLabel>{t('contracts.rfaAdvanced.contractForm.customPeriodStart', 'Début période')}</FormLabel>
                        <FormControl>
                          <Input type="date" value={field.value || ''} onChange={(e) => field.onChange(e.target.value || null)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rfa_custom_period_end"
                    render={({ field }: { field: ControllerRenderProps<ContractFormData, any> }) => (
                      <FormItem>
                        <FormLabel>{t('contracts.rfaAdvanced.contractForm.customPeriodEnd', 'Fin période')}</FormLabel>
                        <FormControl>
                          <Input type="date" value={field.value || ''} onChange={(e) => field.onChange(e.target.value || null)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="rfa_notes"
                render={({ field }: { field: ControllerRenderProps<ContractFormData, any> }) => (
                  <FormItem>
                    <FormLabel>{t('contracts.rfaAdvanced.contractForm.notesLabel', 'Notes RFA')}</FormLabel>
                    <FormControl>
                      <Input
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        placeholder={t('contracts.rfaAdvanced.contractForm.notesPlaceholder', 'Conditions, exclusions, etc.')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
        </form>
      </Form>
    </div>
  );
};