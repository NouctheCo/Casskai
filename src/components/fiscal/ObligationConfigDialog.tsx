/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { TaxObligation, TaxObligationFormData } from '../../types/tax.types';
import { Calendar, Bell, RefreshCw, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { toastSuccess, toastError } from '@/lib/toast-helpers';

interface ObligationConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obligation?: TaxObligation | null;
  onSave: (data: TaxObligationFormData) => Promise<void>;
  taxTypes?: Array<{ id: string; name: string }>;
}

const DEFAULT_TAX_TYPES = [
  { id: 'tva', name: 'TVA' },
  { id: 'is', name: 'IS (Impôt sur les Sociétés)' },
  { id: 'ir', name: 'IR (Impôt sur le Revenu)' },
  { id: 'cfe', name: 'CFE (Cotisation Foncière des Entreprises)' },
  { id: 'cvae', name: 'CVAE (Cotisation sur la Valeur Ajoutée)' },
  { id: 'liasse', name: 'Liasse Fiscale' },
  { id: 'redressement', name: 'Redressement Fiscal' },
  { id: 'echeancier', name: 'Échéancier' },
  { id: 'penalites', name: 'Pénalités' },
  { id: 'taxe_apprentissage', name: 'Taxe d\'Apprentissage' },
  { id: 'formation_pro', name: 'Formation Professionnelle' },
];

export const ObligationConfigDialog: React.FC<ObligationConfigDialogProps> = ({
  open,
  onOpenChange,
  obligation = null,
  onSave,
  taxTypes = DEFAULT_TAX_TYPES,
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');

  const [formData, setFormData] = useState<TaxObligationFormData>({
    tax_type_id: '',
    frequency: 'monthly',
    due_day: 15,
    advance_notice_days: 7,
    auto_generate: false,
    requires_approval: true,
    email_notifications: false,
    notification_emails: [],
  });

  // Reset form when dialog opens/closes or obligation changes
  useEffect(() => {
    if (open && obligation) {
      setFormData({
        tax_type_id: obligation.tax_type_id,
        frequency: obligation.frequency,
        due_day: obligation.due_day,
        advance_notice_days: obligation.advance_notice_days,
        auto_generate: obligation.auto_generate,
        requires_approval: obligation.requires_approval,
        email_notifications: obligation.email_notifications,
        notification_emails: obligation.notification_emails || [],
      });
      setNotificationEmails(obligation.notification_emails || []);
    } else if (open && !obligation) {
      setFormData({
        tax_type_id: '',
        frequency: 'monthly',
        due_day: 15,
        advance_notice_days: 7,
        auto_generate: false,
        requires_approval: true,
        email_notifications: false,
        notification_emails: [],
      });
      setNotificationEmails([]);
    }
  }, [open, obligation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tax_type_id) {
      toastError(t('tax.obligations.errors.selectTaxType', 'Veuillez sélectionner un type d\'obligation'));
      return;
    }

    if (formData.due_day < 1 || formData.due_day > 31) {
      toastError(t('tax.obligations.errors.invalidDueDay', 'Le jour d\'échéance doit être entre 1 et 31'));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        notification_emails: notificationEmails,
      });
      toastSuccess(
        obligation 
          ? t('tax.obligations.success.updated', 'Obligation mise à jour avec succès')
          : t('tax.obligations.success.created', 'Obligation créée avec succès')
      );
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving obligation:', error);
      toastError(t('tax.obligations.errors.saveFailed', 'Erreur lors de la sauvegarde de l\'obligation'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEmail = () => {
    const trimmedEmail = emailInput.trim();
    if (trimmedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      if (!notificationEmails.includes(trimmedEmail)) {
        setNotificationEmails([...notificationEmails, trimmedEmail]);
        setEmailInput('');
      } else {
        toastError(t('tax.obligations.errors.emailExists', 'Cet email existe déjà'));
      }
    } else {
      toastError(t('tax.obligations.errors.invalidEmail', 'Email invalide'));
    }
  };

  const handleRemoveEmail = (email: string) => {
    setNotificationEmails(notificationEmails.filter(e => e !== email));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {obligation 
              ? t('tax.obligations.edit', 'Modifier l\'obligation fiscale')
              : t('tax.obligations.create', 'Créer une nouvelle obligation fiscale')
            }
          </DialogTitle>
          <DialogDescription>
            {t('tax.obligations.configDesc', 'Configurez les obligations fiscales pour suivre automatiquement vos échéances TVA, IS, CFE, CVAE, etc.')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tax Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="tax_type_id" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {t('tax.obligations.taxType', 'Type d\'obligation')} *
            </Label>
            <Select
              value={formData.tax_type_id}
              onValueChange={(value) => setFormData({ ...formData, tax_type_id: value })}
            >
              <SelectTrigger id="tax_type_id">
                <SelectValue placeholder={t('tax.obligations.selectTaxType', 'Sélectionner un type')} />
              </SelectTrigger>
              <SelectContent>
                {taxTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label htmlFor="frequency" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              {t('tax.obligations.frequency', 'Fréquence')} *
            </Label>
            <Select
              value={formData.frequency}
              onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
            >
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">{t('tax.obligations.frequencyTypes.monthly', 'Mensuelle')}</SelectItem>
                <SelectItem value="quarterly">{t('tax.obligations.frequencyTypes.quarterly', 'Trimestrielle')}</SelectItem>
                <SelectItem value="annual">{t('tax.obligations.frequencyTypes.annual', 'Annuelle')}</SelectItem>
                <SelectItem value="one_time">{t('tax.obligations.frequencyTypes.oneTime', 'Ponctuelle')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Day */}
          <div className="space-y-2">
            <Label htmlFor="due_day" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('tax.obligations.dueDay', 'Jour d\'échéance')} *
            </Label>
            <Input
              id="due_day"
              type="number"
              min="1"
              max="31"
              value={formData.due_day}
              onChange={(e) => setFormData({ ...formData, due_day: parseInt(e.target.value) || 1 })}
              placeholder="15"
            />
            <p className="text-xs text-gray-500">
              {t('tax.obligations.dueDayHelp', 'Jour du mois où l\'obligation est due (1-31)')}
            </p>
          </div>

          {/* Advance Notice */}
          <div className="space-y-2">
            <Label htmlFor="advance_notice_days" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {t('tax.obligations.advanceNotice', 'Préavis (jours)')} *
            </Label>
            <Input
              id="advance_notice_days"
              type="number"
              min="0"
              max="90"
              value={formData.advance_notice_days}
              onChange={(e) => setFormData({ ...formData, advance_notice_days: parseInt(e.target.value) || 0 })}
              placeholder="7"
            />
            <p className="text-xs text-gray-500">
              {t('tax.obligations.advanceNoticeHelp', 'Nombre de jours avant l\'échéance pour recevoir une alerte')}
            </p>
          </div>

          {/* Options Switches */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto_generate">
                  {t('tax.obligations.autoGenerate', 'Génération automatique')}
                </Label>
                <p className="text-xs text-gray-500">
                  {t('tax.obligations.autoGenerateHelp', 'Créer automatiquement les déclarations à venir')}
                </p>
              </div>
              <Switch
                id="auto_generate"
                checked={formData.auto_generate}
                onCheckedChange={(checked) => setFormData({ ...formData, auto_generate: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requires_approval">
                  {t('tax.obligations.requiresApproval', 'Approbation requise')}
                </Label>
                <p className="text-xs text-gray-500">
                  {t('tax.obligations.requiresApprovalHelp', 'Les déclarations doivent être approuvées avant soumission')}
                </p>
              </div>
              <Switch
                id="requires_approval"
                checked={formData.requires_approval}
                onCheckedChange={(checked) => setFormData({ ...formData, requires_approval: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_notifications">
                  {t('tax.obligations.emailNotifications', 'Notifications email')}
                </Label>
                <p className="text-xs text-gray-500">
                  {t('tax.obligations.emailNotificationsHelp', 'Recevoir des notifications par email')}
                </p>
              </div>
              <Switch
                id="email_notifications"
                checked={formData.email_notifications}
                onCheckedChange={(checked) => setFormData({ ...formData, email_notifications: checked })}
              />
            </div>
          </div>

          {/* Email Notifications Section */}
          {formData.email_notifications && (
            <div className="space-y-3 border-t pt-4">
              <Label>{t('tax.obligations.notificationEmails', 'Emails de notification')}</Label>
              
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
                  placeholder="exemple@entreprise.fr"
                />
                <Button type="button" onClick={handleAddEmail} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {notificationEmails.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {notificationEmails.map((email) => (
                    <Badge key={email} variant="secondary" className="flex items-center gap-2">
                      {email}
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="hover:text-red-500"
                        title={t('common.delete', 'Supprimer')}
                        aria-label={t('common.delete', 'Supprimer')}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSubmitting ? t('common.saving', 'Enregistrement...') : t('common.save', 'Enregistrer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
