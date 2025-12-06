/**
 * Modal pour créer une nouvelle action commerciale
 * Intégré avec la table crm_actions de Supabase
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
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
import { devLogger } from '@/utils/devLogger';
import { cn } from '@/lib/utils';

interface NewActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ActionFormData {
  subject: string;
  type: 'call' | 'email' | 'meeting' | 'task';
  third_party_id?: string;
  opportunity_id?: string;
  due_date?: string;
  due_time?: string;
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  notes?: string;
}

interface ThirdParty {
  id: string;
  name: string;
}

interface Opportunity {
  id: string;
  title: string;
  third_party_id: string;
}

const ACTION_TYPES = [
  { value: 'call', label: 'crm.action.types.call', icon: Phone, color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'email', label: 'crm.action.types.email', icon: Mail, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { value: 'meeting', label: 'crm.action.types.meeting', icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'task', label: 'crm.action.types.task', icon: CheckSquare, color: 'text-orange-600 bg-orange-50 border-orange-200' },
] as const;

export const NewActionModal: React.FC<NewActionModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<ThirdParty[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingOpportunities, setLoadingOpportunities] = useState(false);

  const [formData, setFormData] = useState<ActionFormData>({
    subject: '',
    type: 'call',
    third_party_id: '',
    opportunity_id: '',
    due_date: '',
    due_time: '',
    priority: 'medium',
    assigned_to: '',
    notes: '',
  });

  // Charger clients et opportunités
  useEffect(() => {
    if (currentCompany?.id) {
      loadClients();
      loadOpportunities();
    }
  }, [currentCompany?.id]);

  // Filtrer les opportunités selon le client sélectionné
  useEffect(() => {
    if (formData.third_party_id) {
      // Si un client est sélectionné, filtrer les opportunités
      loadOpportunities(formData.third_party_id);
    } else {
      loadOpportunities();
    }
  }, [formData.third_party_id]);

  const loadClients = async () => {
    if (!currentCompany?.id) return;

    setLoadingClients(true);
    try {
      const { data, error } = await supabase
        .from('third_parties')
        .select('id, name')
        .eq('company_id', currentCompany.id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      devLogger.error('Error loading clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const loadOpportunities = async (thirdPartyId?: string) => {
    if (!currentCompany?.id) return;

    setLoadingOpportunities(true);
    try {
      let query = supabase
        .from('crm_opportunities')
        .select('id, title, client_id')
        .eq('company_id', currentCompany.id)
        .eq('status', 'active')
        .order('title', { ascending: true });

      if (thirdPartyId) {
        query = query.eq('client_id', thirdPartyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error) {
      devLogger.error('Error loading opportunities:', error);
    } finally {
      setLoadingOpportunities(false);
    }
  };

  const handleChange = (field: keyof ActionFormData, value: string) => {
    setFormData((prev) => {
      // Convertir "none" en chaîne vide pour les valeurs optionnelles
      const actualValue = value === 'none' ? '' : value;
      const newData = { ...prev, [field]: actualValue };

      // Si on change de client, réinitialiser l'opportunité
      if (field === 'third_party_id') {
        newData.opportunity_id = '';
      }

      return newData;
    });
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      type: 'call',
      third_party_id: '',
      opportunity_id: '',
      due_date: '',
      due_time: '',
      priority: 'medium',
      assigned_to: '',
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCompany?.id) {
      toastError(t('common.errors.noCompany'));
      return;
    }

    if (!formData.subject.trim()) {
      toastError(t('crm.action.validation.subjectRequired'));
      return;
    }

    setLoading(true);

    try {
      // Construire la date/heure complète si fournie
      let dueDateTime = null;
      if (formData.due_date) {
        dueDateTime = formData.due_time
          ? `${formData.due_date}T${formData.due_time}:00`
          : `${formData.due_date}T09:00:00`;
      }

      const { error } = await supabase.from('crm_actions').insert({
        company_id: currentCompany.id,
        third_party_id: formData.third_party_id || null,
        opportunity_id: formData.opportunity_id || null,
        subject: formData.subject.trim(),
        type: formData.type,
        due_date: dueDateTime,
        priority: formData.priority,
        assigned_to: formData.assigned_to || null,
        notes: formData.notes?.trim() || null,
        status: 'pending',
      });

      if (error) throw error;

      toastSuccess(t('crm.action.created'));
      resetForm();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      devLogger.error('Error creating action:', error);
      toastError(t('crm.action.errors.createFailed'));
    } finally {
      setLoading(false);
    }
  };

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
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
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
                <Label htmlFor="third_party_id">{t('crm.action.fields.client')}</Label>
                <Select
                  value={formData.third_party_id}
                  onValueChange={(value) => handleChange('third_party_id', value)}
                  disabled={loadingClients}
                >
                  <SelectTrigger id="third_party_id">
                    <SelectValue placeholder={
                      loadingClients
                        ? t('common.loading')
                        : t('crm.action.placeholders.selectClient')
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>{t('crm.action.noClient')}</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="opportunity_id">{t('crm.action.fields.opportunity')}</Label>
                <Select
                  value={formData.opportunity_id}
                  onValueChange={(value) => handleChange('opportunity_id', value)}
                  disabled={loadingOpportunities || !formData.third_party_id}
                >
                  <SelectTrigger id="opportunity_id">
                    <SelectValue placeholder={
                      loadingOpportunities
                        ? t('common.loading')
                        : !formData.third_party_id
                        ? t('crm.action.selectClientFirst')
                        : t('crm.action.placeholders.selectOpportunity')
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>{t('crm.action.noOpportunity')}</SelectItem>
                    {opportunities.map((opp) => (
                      <SelectItem key={opp.id} value={opp.id}>
                        {opp.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  value={formData.due_date}
                  onChange={(e) => handleChange('due_date', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="due_time">{t('crm.action.fields.dueTime')}</Label>
                <Input
                  id="due_time"
                  type="time"
                  value={formData.due_time}
                  onChange={(e) => handleChange('due_time', e.target.value)}
                  disabled={!formData.due_date}
                />
              </div>

              <div>
                <Label htmlFor="priority">{t('crm.action.fields.priority')}</Label>
                <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value as ActionFormData['priority'])}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('crm.priority.low')}</SelectItem>
                    <SelectItem value="medium">{t('crm.priority.medium')}</SelectItem>
                    <SelectItem value="high">{t('crm.priority.high')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('crm.action.fields.notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder={t('crm.action.placeholders.notes')}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('common.actions.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.actions.saving') : t('common.actions.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
