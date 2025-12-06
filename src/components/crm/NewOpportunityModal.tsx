/**
 * Modal pour créer une nouvelle opportunité commerciale
 * Intégré avec la table opportunities de Supabase
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
import { Target, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { devLogger } from '@/utils/devLogger';

interface NewOpportunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface OpportunityFormData {
  title: string;
  third_party_id: string;
  amount: string;
  probability: string;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  priority: 'low' | 'medium' | 'high';
  expected_close_date?: string;
  notes?: string;
}

interface ThirdParty {
  id: string;
  name: string;
  type: string;
}

export const NewOpportunityModal: React.FC<NewOpportunityModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<ThirdParty[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  const [formData, setFormData] = useState<OpportunityFormData>({
    title: '',
    third_party_id: '',
    amount: '',
    probability: '50',
    stage: 'lead',
    priority: 'medium',
    expected_close_date: '',
    notes: '',
  });

  // Charger la liste des clients/prospects
  useEffect(() => {
    if (currentCompany?.id) {
      loadClients();
    }
  }, [currentCompany?.id]);

  const loadClients = async () => {
    if (!currentCompany?.id) return;

    setLoadingClients(true);
    try {
      const { data, error } = await supabase
        .from('third_parties')
        .select('id, name, client_type')
        .eq('company_id', currentCompany.id)
        .in('client_type', ['customer', 'prospect'])
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) {
        // Only log error, don't show toast for empty data
        devLogger.error('Error loading clients:', error);
      }
      setClients(data || []);
    } catch (error) {
      devLogger.error('Error loading clients:', error);
      // Don't show error toast - empty client list is normal for new companies
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleChange = (field: keyof OpportunityFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      third_party_id: '',
      amount: '',
      probability: '50',
      stage: 'lead',
      priority: 'medium',
      expected_close_date: '',
      notes: '',
    });
  };

  const calculateWeightedAmount = () => {
    const amount = parseFloat(formData.amount) || 0;
    const probability = parseFloat(formData.probability) || 0;
    return (amount * probability) / 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCompany?.id) {
      toastError(t('common.errors.noCompany'));
      return;
    }

    if (!formData.title.trim()) {
      toastError(t('crm.opportunity.validation.titleRequired'));
      return;
    }

    if (!formData.third_party_id) {
      toastError(t('crm.opportunity.validation.clientRequired'));
      return;
    }

    setLoading(true);

    try {
      const amount = parseFloat(formData.amount) || 0;
      const probability = parseFloat(formData.probability) || 0;
      const weightedAmount = calculateWeightedAmount();

      const { error } = await supabase.from('crm_opportunities').insert({
        company_id: currentCompany.id,
        client_id: formData.third_party_id,
        title: formData.title.trim(),
        value: amount,
        probability,
        weighted_amount: weightedAmount,
        stage: formData.stage,
        priority: formData.priority,
        expected_close_date: formData.expected_close_date || null,
        notes: formData.notes?.trim() || null,
        status: 'active',
      });

      if (error) throw error;

      toastSuccess(t('crm.opportunity.created'));
      resetForm();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      devLogger.error('Error creating opportunity:', error);
      toastError(t('crm.opportunity.errors.createFailed'));
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
            {t('crm.opportunity.new')}
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
              <Label htmlFor="third_party_id">
                {t('crm.opportunity.fields.client')} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.third_party_id}
                onValueChange={(value) => handleChange('third_party_id', value)}
                disabled={loadingClients}
              >
                <SelectTrigger id="third_party_id">
                  <SelectValue placeholder={
                    loadingClients
                      ? t('common.loading')
                      : t('crm.opportunity.placeholders.selectClient')
                  } />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} ({t(`crm.client.types.${client.type}`)})
                    </SelectItem>
                  ))}
                  {clients.length === 0 && !loadingClients && (
                    <div className="px-2 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                      {t('crm.opportunity.noClients')}
                    </div>
                  )}
                </SelectContent>
              </Select>
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
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
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
                    onChange={(e) => handleChange('probability', e.target.value)}
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                </div>
              </div>
            </div>

            {/* Weighted Amount Display */}
            {formData.amount && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    {t('crm.opportunity.fields.weightedAmount')}:
                  </span>
                  <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
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
                <Select value={formData.stage} onValueChange={(value) => handleChange('stage', value as OpportunityFormData['stage'])}>
                  <SelectTrigger id="stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">{t('crm.stages.lead')}</SelectItem>
                    <SelectItem value="qualified">{t('crm.stages.qualified')}</SelectItem>
                    <SelectItem value="proposal">{t('crm.stages.proposal')}</SelectItem>
                    <SelectItem value="negotiation">{t('crm.stages.negotiation')}</SelectItem>
                    <SelectItem value="won">{t('crm.stages.won')}</SelectItem>
                    <SelectItem value="lost">{t('crm.stages.lost')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">{t('crm.opportunity.fields.priority')}</Label>
                <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value as OpportunityFormData['priority'])}>
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
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
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
