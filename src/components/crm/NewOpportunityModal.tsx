/**
 * Modal pour créer une nouvelle opportunité commerciale
 * Intégré avec la table opportunities de Supabase
 */

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toastSuccess, toastError } from '@/lib/toast-helpers';
import { Target, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { getCurrentCompanyCurrency } from '@/lib/utils';
import type { Client, Contact, OpportunityFormData, Opportunity } from '@/types/crm.types';
import SmartAutocomplete, { type AutocompleteOption } from '@/components/ui/SmartAutocomplete';

interface NewOpportunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  clients: Client[];
  contacts: Contact[];
  onCreateOpportunity: (data: OpportunityFormData) => Promise<boolean>;
  onUpdateOpportunity?: (opportunityId: string, data: Partial<OpportunityFormData>) => Promise<boolean>;
  editingOpportunity?: Opportunity | null;
}

export const NewOpportunityModal: React.FC<NewOpportunityModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  clients,
  contacts,
  onCreateOpportunity,
  onUpdateOpportunity,
  editingOpportunity,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const isEditing = !!editingOpportunity;

  // Debug: log props
  React.useEffect(() => {
    if (open) {
      console.log('[NewOpportunityModal] Props received:', {
        clientsCount: clients?.length || 0,
        contactsCount: contacts?.length || 0,
        isEditing: !!editingOpportunity,
        clients,
        contacts
      });
    }
  }, [open, clients, contacts, editingOpportunity]);

  const [formData, setFormData] = useState<OpportunityFormData>({
    title: '',
    description: '',
    client_id: '',
    contact_id: '',
    stage: 'prospecting',
    value: 0,
    probability: 50,
    expected_close_date: '',
    source: '',
    assigned_to: '',
    priority: 'medium',
    tags: [],
    next_action: '',
    next_action_date: ''
  });

  // Initialize form when editing or modal opens
  React.useEffect(() => {
    if (editingOpportunity) {
      setFormData({
        title: editingOpportunity.title || '',
        description: editingOpportunity.description || '',
        client_id: editingOpportunity.client_id || '',
        contact_id: editingOpportunity.contact_id || '',
        stage: editingOpportunity.stage || 'prospecting',
        value: editingOpportunity.value || 0,
        probability: editingOpportunity.probability || 50,
        expected_close_date: editingOpportunity.expected_close_date || '',
        source: editingOpportunity.source || '',
        assigned_to: editingOpportunity.assigned_to || '',
        priority: editingOpportunity.priority || 'medium',
        tags: editingOpportunity.tags || [],
        next_action: editingOpportunity.next_action || '',
        next_action_date: editingOpportunity.next_action_date || ''
      });
    } else {
      resetForm();
    }
  }, [editingOpportunity, open]);

  const stages = useMemo(() => ([
    { key: 'prospecting', label: t('crm.stages.prospecting') },
    { key: 'qualification', label: t('crm.stages.qualification') },
    { key: 'proposal', label: t('crm.stages.proposal') },
    { key: 'negotiation', label: t('crm.stages.negotiation') },
    { key: 'closing', label: t('crm.stages.closing') },
    { key: 'won', label: t('crm.stages.won') },
    { key: 'lost', label: t('crm.stages.lost') }
  ]), [t]);

  const handleChange = <K extends keyof OpportunityFormData>(field: K, value: OpportunityFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      client_id: '',
      contact_id: '',
      stage: 'prospecting',
      value: 0,
      probability: 50,
      expected_close_date: '',
      source: '',
      assigned_to: '',
      priority: 'medium',
      tags: [],
      next_action: '',
      next_action_date: ''
    });
  };

  const calculateWeightedAmount = () => {
    const amount = Number(formData.value) || 0;
    const probability = Number(formData.probability) || 0;
    return (amount * probability) / 100;
  };

  const clientContacts = useMemo(() => {
    if (!formData.client_id) return [];
    return (contacts || []).filter((contact) => contact.client_id === formData.client_id);
  }, [contacts, formData.client_id]);

  // Options autocomplete pour clients
  const clientOptions: AutocompleteOption[] = useMemo(() => {
    return (clients || []).map(client => ({
      value: client.id,
      label: client.company_name || 'Sans nom',
      description: undefined as string | undefined,
      category: 'Client',
      metadata: client
    }));
  }, [clients]);

  // Options autocomplete pour contacts (filtrés par client)
  const contactOptions: AutocompleteOption[] = useMemo(() => {
    return clientContacts.map(contact => ({
      value: contact.id,
      label: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Sans nom',
      description: contact.email || contact.phone || undefined,
      metadata: contact
    }));
  }, [clientContacts]);

  // Options autocomplete pour stages/étapes
  const stageOptions: AutocompleteOption[] = useMemo(() => {
    return stages.map(stage => ({
      value: stage.key,
      label: stage.label,
      description: undefined as string | undefined,
      category: stage.key === 'won' || stage.key === 'lost' ? 'Terminées' : 'En cours'
    }));
  }, [stages]);

  // Options autocomplete pour priorités
  const priorityOptions: AutocompleteOption[] = useMemo(() => [
    { value: 'low', label: t('crm.priority.low'), description: 'Faible priorité', category: 'Priorité' },
    { value: 'medium', label: t('crm.priority.medium'), description: 'Priorité moyenne', category: 'Priorité' },
    { value: 'high', label: t('crm.priority.high'), description: 'Haute priorité', category: 'Priorité' },
  ], [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toastError(t('crm.opportunity.validation.titleRequired'));
      return;
    }

    if (!formData.client_id) {
      toastError(t('crm.opportunity.validation.clientRequired'));
      return;
    }

    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        source: formData.source?.trim() || undefined,
        assigned_to: formData.assigned_to?.trim() || undefined,
        expected_close_date: formData.expected_close_date || ''
      };

      let success = false;

      if (isEditing && editingOpportunity && onUpdateOpportunity) {
        console.log('[NewOpportunityModal] Updating opportunity:', editingOpportunity.id, dataToSubmit);
        success = await onUpdateOpportunity(editingOpportunity.id, dataToSubmit);
        if (success) {
          toastSuccess(t('crm.opportunity.updated') || 'Opportunité mise à jour');
        } else {
          toastError(t('crm.opportunity.errors.updateFailed') || 'Erreur lors de la mise à jour');
        }
      } else {
        console.log('[NewOpportunityModal] Creating new opportunity:', dataToSubmit);
        success = await onCreateOpportunity(dataToSubmit);
        if (success) {
          toastSuccess(t('crm.opportunity.created'));
        } else {
          toastError(t('crm.opportunity.errors.createFailed'));
        }
      }

      if (success) {
        resetForm();
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Error submitting opportunity:', error);
      const errorMsg = isEditing ? t('crm.opportunity.errors.updateFailed') : t('crm.opportunity.errors.createFailed');
      toastError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {isEditing ? t('crm.opportunity.edit') || 'Modifier l\'opportunité' : t('crm.opportunity.new')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">
                {t('crm.opportunity.fields.title')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder={t('crm.opportunity.placeholders.title')}
                required
              />
            </div>

            <div>
              <Label>{t('crm.opportunity.fields.client')} <span className="text-red-500">*</span></Label>
              <SmartAutocomplete
                value={formData.client_id}
                onChange={(value) => handleChange('client_id', value)}
                options={clientOptions}
                placeholder={t('crm.opportunity.placeholders.selectClient')}
                searchPlaceholder="Rechercher un client..."
                groups={true}
                showRecent={true}
                maxRecent={5}
              />
            </div>

            <div>
              <Label>{t('crm.opportunity.fields.contact')}</Label>
              <SmartAutocomplete
                value={formData.contact_id}
                onChange={(value) => handleChange('contact_id', value)}
                options={contactOptions}
                placeholder={t('crm.opportunity.placeholders.selectContact')}
                searchPlaceholder="Rechercher un contact..."
                groups={false}
                showRecent={true}
                maxRecent={3}
                disabled={!formData.client_id || contactOptions.length === 0}
              />
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              {t('crm.opportunity.sections.financial')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">{t('crm.opportunity.fields.amount')}</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.value || ''}
                  onChange={(e) => handleChange('value', Number(e.target.value) || 0)}
                  placeholder={t('crm.opportunity.placeholders.amount')}
                />
              </div>

              <div>
                <Label htmlFor="probability">{t('crm.opportunity.fields.probability')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e) => handleChange('probability', Number(e.target.value) || 0)}
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                </div>
              </div>
            </div>

            {/* Weighted Amount Display */}
            {formData.value && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    {t('crm.opportunity.fields.weightedAmount')}:
                  </span>
                  <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: getCurrentCompanyCurrency(),
                    }).format(calculateWeightedAmount())}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Pipeline Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {t('crm.opportunity.sections.pipeline')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stage">{t('crm.opportunity.fields.stage')}</Label>
                <SmartAutocomplete
                  value={formData.stage}
                  onChange={(value) => handleChange('stage', value as OpportunityFormData['stage'])}
                  options={stageOptions}
                  placeholder="Sélectionner une étape..."
                  searchPlaceholder="Rechercher une étape..."
                  groups={true}
                  showRecent={false}
                />
              </div>

              <div>
                <Label htmlFor="priority">{t('crm.opportunity.fields.priority')}</Label>
                <SmartAutocomplete
                  value={formData.priority}
                  onChange={(value) => handleChange('priority', value as OpportunityFormData['priority'])}
                  options={priorityOptions}
                  placeholder="Sélectionner une priorité..."
                  searchPlaceholder="Rechercher une priorité..."
                  groups={false}
                  showRecent={false}
                />
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t('crm.opportunity.sections.timeline')}
            </h3>

            <div>
              <Label htmlFor="expected_close_date">{t('crm.opportunity.fields.expectedCloseDate')}</Label>
              <Input
                id="expected_close_date"
                type="date"
                value={formData.expected_close_date}
                onChange={(e) => handleChange('expected_close_date', e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('crm.opportunity.fields.notes')}</Label>
            <Textarea
              id="notes"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={t('crm.opportunity.placeholders.notes')}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('common.action.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading 
                ? t('common.action.saving') 
                : isEditing 
                  ? t('common.action.update') || 'Mettre à jour'
                  : t('common.action.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
