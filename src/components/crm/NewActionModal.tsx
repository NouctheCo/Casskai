/**
 * Modal pour créer une nouvelle action commerciale
 * Intégré avec la table crm_actions de Supabase
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
import { Calendar, Phone, Mail, Users, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Client, Contact, Opportunity, CommercialActionFormData } from '@/types/crm.types';
import SmartAutocomplete, { type AutocompleteOption } from '@/components/ui/SmartAutocomplete';

interface NewActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  clients: Client[];
  contacts: Contact[];
  opportunities: Opportunity[];
  onCreateAction: (data: CommercialActionFormData) => Promise<boolean>;
}

const ACTION_TYPES = [
  { value: 'call', label: 'crm.action.types.call', icon: Phone, color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'email', label: 'crm.action.types.email', icon: Mail, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { value: 'meeting', label: 'crm.action.types.meeting', icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'other', label: 'crm.action.types.other', icon: CheckSquare, color: 'text-orange-600 bg-orange-50 border-orange-200' },
] as const;

export const NewActionModal: React.FC<NewActionModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  clients,
  contacts,
  opportunities,
  onCreateAction,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  // Debug: log props
  React.useEffect(() => {
    if (open) {
      console.log('[NewActionModal] Props received:', {
        clientsCount: clients?.length || 0,
        contactsCount: contacts?.length || 0,
        opportunitiesCount: opportunities?.length || 0,
        clients,
        contacts,
        opportunities
      });
    }
  }, [open, clients, contacts, opportunities]);

  const [formData, setFormData] = useState<CommercialActionFormData>({
    title: '',
    type: 'call',
    status: 'planned',
    client_id: '',
    contact_id: '',
    opportunity_id: '',
    due_date: '',
    priority: 'medium',
    assigned_to: '',
    description: '',
  });
  const handleChange = <K extends keyof CommercialActionFormData>(field: K, value: CommercialActionFormData[K]) => {
    setFormData((prev) => {
      // Convertir "none" en chaîne vide pour les valeurs optionnelles
      const actualValue = value === 'none' ? '' : value;
      const newData = { ...prev, [field]: actualValue as CommercialActionFormData[K] };

      // Si on change de client, réinitialiser l'opportunité
      if (field === 'client_id') {
        newData.opportunity_id = '';
        newData.contact_id = '';
      }

      return newData;
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'call',
      status: 'planned',
      client_id: '',
      contact_id: '',
      opportunity_id: '',
      due_date: '',
      priority: 'medium',
      assigned_to: '',
      description: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      toastError(t('crm.action.validation.subjectRequired'));
      return;
    }

    setLoading(true);

    try {
      const success = await onCreateAction({
        ...formData,
        title: formData.title?.trim() || '',
        description: formData.description?.trim() || undefined,
        assigned_to: formData.assigned_to?.trim() || undefined,
        due_date: formData.due_date || undefined,
        client_id: formData.client_id || undefined,
        contact_id: formData.contact_id || undefined,
        opportunity_id: formData.opportunity_id || undefined
      });

      if (success) {
        toastSuccess(t('crm.action.created'));
        resetForm();
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toastError(t('crm.action.errors.createFailed'));
      }
    } catch (error) {
      console.error('Error creating action:', error);
      toastError(t('crm.action.errors.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const clientContacts = useMemo(() => {
    if (!formData.client_id) return [];
    return (contacts || []).filter((contact) => contact.client_id === formData.client_id);
  }, [contacts, formData.client_id]);

  const clientOpportunities = useMemo(() => {
    if (!formData.client_id) return [];
    return (opportunities || []).filter((opp) => opp.client_id === formData.client_id);
  }, [opportunities, formData.client_id]);

  // Options autocomplete pour clients (avec option "Aucun")
  const clientOptions: AutocompleteOption[] = useMemo(() => {
    const options: AutocompleteOption[] = [
      { value: 'none', label: t('crm.action.noClient'), description: 'Aucun client associé', category: 'Aucun' }
    ];
    (clients || []).forEach(client => {
      options.push({
        value: client.id,
        label: client.company_name || 'Sans nom',
        description: undefined as string | undefined,
        category: 'Client',
        metadata: client
      });
    });
    return options;
  }, [clients, t]);

  // Options autocomplete pour contacts (filtrés par client, avec option "Aucun")
  const contactOptions: AutocompleteOption[] = useMemo(() => {
    const options: AutocompleteOption[] = [
      { value: 'none', label: t('crm.action.noContact'), description: 'Aucun contact associé', category: 'Aucun' }
    ];
    clientContacts.forEach(contact => {
      options.push({
        value: contact.id,
        label: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Sans nom',
        description: contact.email || contact.phone || undefined,
        metadata: contact
      });
    });
    return options;
  }, [clientContacts, t]);

  // Options autocomplete pour opportunités (filtrées par client, avec option "Aucun")
  const opportunityOptions: AutocompleteOption[] = useMemo(() => {
    const options: AutocompleteOption[] = [
      { value: 'none', label: t('crm.action.noOpportunity'), description: 'Aucune opportunité associée', category: 'Aucun' }
    ];
    clientOpportunities.forEach(opp => {
      options.push({
        value: opp.id,
        label: opp.title,
        description: opp.value ? `${opp.value} €` : undefined,
        category: opp.stage || 'Opportunité',
        metadata: opp
      });
    });
    return options;
  }, [clientOpportunities, t]);

  // Options autocomplete pour statuts d'action
  const statusOptions: AutocompleteOption[] = useMemo(() => [
    { value: 'planned', label: t('crm.actionStatus.planned'), description: 'À faire', category: 'Statut' },
    { value: 'in_progress', label: t('crm.actionStatus.inProgress'), description: 'En cours', category: 'Statut' },
    { value: 'completed', label: t('crm.actionStatus.completed'), description: 'Terminée', category: 'Statut' },
    { value: 'cancelled', label: t('crm.actionStatus.cancelled'), description: 'Annulée', category: 'Statut' },
  ], [t]);

  // Options autocomplete pour priorités
  const priorityOptions: AutocompleteOption[] = useMemo(() => [
    { value: 'low', label: t('crm.priority.low'), description: 'Faible priorité', category: 'Priorité' },
    { value: 'medium', label: t('crm.priority.medium'), description: 'Priorité moyenne', category: 'Priorité' },
    { value: 'high', label: t('crm.priority.high'), description: 'Haute priorité', category: 'Priorité' },
  ], [t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('crm.action.new')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">
                {t('crm.action.fields.subject')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subject"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder={t('crm.action.placeholders.subject')}
                required
              />
            </div>

            {/* Action Type Selector */}
            <div>
              <Label>{t('crm.action.fields.type')}</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {ACTION_TYPES.map((actionType) => {
                  const Icon = actionType.icon;
                  const isSelected = formData.type === actionType.value;

                  return (
                    <button
                      key={actionType.value}
                      type="button"
                      onClick={() => handleChange('type', actionType.value)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
                        isSelected
                          ? actionType.color
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium">
                        {t(actionType.label)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Relations */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('crm.action.sections.relations')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{t('crm.action.fields.client')}</Label>
                <SmartAutocomplete
                  value={formData.client_id || 'none'}
                  onChange={(value) => handleChange('client_id', value)}
                  options={clientOptions}
                  placeholder={t('crm.action.placeholders.selectClient')}
                  searchPlaceholder="Rechercher un client..."
                  groups={true}
                  showRecent={true}
                  maxRecent={5}
                />
              </div>

              <div>
                <Label htmlFor="contact_id">{t('crm.action.fields.contact')}</Label>
                <SmartAutocomplete
                  value={formData.contact_id || 'none'}
                  onChange={(value) => handleChange('contact_id', value)}
                  options={contactOptions}
                  placeholder={t('crm.action.placeholders.selectContact')}
                  searchPlaceholder="Rechercher un contact..."
                  groups={false}
                  showRecent={true}
                  maxRecent={3}
                  disabled={!formData.client_id}
                />
              </div>

              <div>
                <Label htmlFor="opportunity_id">{t('crm.action.fields.opportunity')}</Label>
                <SmartAutocomplete
                  value={formData.opportunity_id || 'none'}
                  onChange={(value) => handleChange('opportunity_id', value)}
                  options={opportunityOptions}
                  placeholder={
                    !formData.client_id
                      ? t('crm.action.selectClientFirst')
                      : t('crm.action.placeholders.selectOpportunity')
                  }
                  searchPlaceholder="Rechercher une opportunité..."
                  groups={true}
                  showRecent={true}
                  maxRecent={3}
                  disabled={!formData.client_id}
                />
              </div>
            </div>
          </div>

          {/* Schedule & Priority */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('crm.action.sections.schedule')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="due_date">{t('crm.action.fields.dueDate')}</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date || ''}
                  onChange={(e) => handleChange('due_date', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="status">{t('crm.action.fields.status')}</Label>
                <SmartAutocomplete
                  value={formData.status}
                  onChange={(value) => handleChange('status', value as CommercialActionFormData['status'])}
                  options={statusOptions}
                  placeholder="Sélectionner un statut..."
                  searchPlaceholder="Rechercher un statut..."
                  groups={false}
                  showRecent={false}
                />
              </div>

              <div>
                <Label htmlFor="priority">{t('crm.action.fields.priority')}</Label>
                <SmartAutocomplete
                  value={formData.priority}
                  onChange={(value) => handleChange('priority', value as CommercialActionFormData['priority'])}
                  options={priorityOptions}
                  placeholder="Sélectionner une priorité..."
                  searchPlaceholder="Rechercher une priorité..."
                  groups={false}
                  showRecent={false}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('crm.action.fields.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder={t('crm.action.placeholders.notes')}
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
              {loading ? t('common.action.saving') : t('common.action.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
