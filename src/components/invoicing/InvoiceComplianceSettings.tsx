/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import {
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  CreditCard,
  Shield,
  Info
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentTermsAuditPanel } from '@/components/invoicing/PaymentTermsAuditPanel';
import { ExtendedPaymentTermsAuditPanel } from '@/components/compliance/ExtendedPaymentTermsAuditPanel';
interface CompanyInvoiceSettings {
  name: string;
  siret: string;
  vat_number: string;
  legal_form: string;
  share_capital: string;
  rcs_city: string;
  rcs_number: string;
  legal_mentions: string;
  default_terms: string;
  vat_note: string;
  main_bank_name: string;
  main_bank_iban: string;
  main_bank_bic: string;
  payment_instructions: string;
}
export function InvoiceComplianceSettings() {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CompanyInvoiceSettings>({
    name: '',
    siret: '',
    vat_number: '',
    legal_form: '',
    share_capital: '',
    rcs_city: '',
    rcs_number: '',
    legal_mentions: '',
    default_terms: '',
    vat_note: '',
    main_bank_name: '',
    main_bank_iban: '',
    main_bank_bic: '',
    payment_instructions: ''
  });
  // Charger les paramètres existants
  useEffect(() => {
    loadSettings();
  }, [currentCompany?.id]);
  const loadSettings = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          name,
          siret,
          vat_number,
          legal_form,
          share_capital,
          rcs_city,
          rcs_number,
          legal_mentions,
          default_terms_conditions,
          vat_regime_note,
          main_bank_name,
          main_bank_iban,
          main_bank_bic,
          payment_instructions
        `)
        .eq('id', currentCompany.id)
        .single();
      if (error) throw error;
      if (data) {
        setSettings({
          name: data.name || '',
          siret: data.siret || '',
          vat_number: data.vat_number || '',
          legal_form: data.legal_form || '',
          share_capital: data.share_capital || '',
          rcs_city: data.rcs_city || '',
          rcs_number: data.rcs_number || '',
          legal_mentions: data.legal_mentions || '',
          default_terms: data.default_terms_conditions || '',
          vat_note: data.vat_regime_note || '',
          main_bank_name: data.main_bank_name || '',
          main_bank_iban: data.main_bank_iban || '',
          main_bank_bic: data.main_bank_bic || '',
          payment_instructions: data.payment_instructions || ''
        });
      }
    } catch (error) {
      logger.error('InvoiceComplianceSettings', 'Error loading settings:', error);
      toast.error(t('invoicing.compliance.loadError', 'Erreur lors du chargement des paramètres'));
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    if (!currentCompany?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          siret: settings.siret,
          vat_number: settings.vat_number,
          legal_form: settings.legal_form,
          share_capital: settings.share_capital,
          rcs_city: settings.rcs_city,
          rcs_number: settings.rcs_number,
          legal_mentions: settings.legal_mentions,
          default_terms_conditions: settings.default_terms,
          vat_regime_note: settings.vat_note,
          main_bank_name: settings.main_bank_name,
          main_bank_iban: settings.main_bank_iban,
          main_bank_bic: settings.main_bank_bic,
          payment_instructions: settings.payment_instructions
        })
        .eq('id', currentCompany.id);
      if (error) throw error;
      toast.success(t('invoicing.compliance.saveSuccess', 'Paramètres de facturation enregistrés'));
    } catch (error) {
      logger.error('InvoiceComplianceSettings', 'Error saving settings:', error);
      toast.error(t('invoicing.compliance.saveError', 'Erreur lors de l\'enregistrement'));
    } finally {
      setSaving(false);
    }
  };
  // Vérifier la conformité
  const checkCompliance = () => {
    const required = [
      settings.siret,
      settings.vat_number,
      settings.legal_form,
      settings.rcs_city,
      settings.main_bank_iban
    ];
    const filled = required.filter(field => field && field.trim().length > 0).length;
    const total = required.length;
    return {
      percentage: Math.round((filled / total) * 100),
      filled,
      total,
      isComplete: filled === total
    };
  };
  const compliance = checkCompliance();
  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading', 'Chargement...')}</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Tabs defaultValue="settings" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Paramètres
        </TabsTrigger>
        <TabsTrigger value="audit" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Audit Conditions
        </TabsTrigger>
        <TabsTrigger value="audit-extended" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Audit Complet
        </TabsTrigger>
      </TabsList>

      <TabsContent value="settings" className="space-y-6">
      {/* Statut de conformité */}
      <Card className={`border-2 ${compliance.isComplete ? 'border-green-200 bg-green-50 dark:bg-green-900/10' : 'border-orange-200 bg-orange-50 dark:bg-orange-900/10'}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {compliance.isComplete ? (
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {compliance.isComplete ? t('invoicing.compliance.compliant', 'Factures conformes ✓') : t('invoicing.compliance.incomplete', 'Configuration incomplète')}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {compliance.isComplete 
                    ? t('invoicing.compliance.completeMessage', 'Toutes les mentions légales obligatoires sont renseignées. Vos factures sont conformes à la législation française.')
                    : t('invoicing.compliance.missingFields', 'Remplissez les {{count}} champs manquants pour assurer la conformité de vos factures.', { count: compliance.total - compliance.filled })
                  }
                </p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('invoicing.compliance.compliance', 'Conformité')}
                    </span>
                    <span className="font-semibold">
                      {t('invoicing.compliance.requiredFields', '{{filled}}/{{total}} champs obligatoires', { filled: compliance.filled, total: compliance.total })}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        compliance.isComplete ? 'bg-green-600' : 'bg-orange-600'
                      }`}
                      style={{ width: `${compliance.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <Badge className={compliance.isComplete ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'}>
              {compliance.percentage}%
            </Badge>
          </div>
        </CardContent>
      </Card>
      {/* Informations légales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            {t('invoicing.compliance.legalInfo', 'Informations Légales')}
          </CardTitle>
          <CardDescription>
            {t('invoicing.compliance.legalInfoDesc', 'Ces informations apparaîtront sur toutes vos factures et sont obligatoires selon la loi française.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siret" className="flex items-center gap-2">
                {t('invoicing.compliance.siret', 'SIRET')} <span className="text-red-500">*</span>
                {settings.siret && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </Label>
              <Input
                id="siret"
                value={settings.siret}
                onChange={(e) => setSettings({ ...settings, siret: e.target.value })}
                placeholder="123 456 789 00012"
                className={!settings.siret ? 'border-orange-300' : ''}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('invoicing.compliance.siretHelp', '14 chiffres (obligatoire sur les factures)')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vat_number" className="flex items-center gap-2">
                {t('invoicing.compliance.vat', 'N° TVA Intracommunautaire')} <span className="text-red-500">*</span>
                {settings.vat_number && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </Label>
              <Input
                id="vat_number"
                value={settings.vat_number}
                onChange={(e) => setSettings({ ...settings, vat_number: e.target.value })}
                placeholder="FR12 345 678 901"
                className={!settings.vat_number ? 'border-orange-300' : ''}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('invoicing.compliance.vatHelp', 'Format FR + 11 chiffres')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="legal_form" className="flex items-center gap-2">
                {t('invoicing.compliance.legalForm', 'Forme juridique')} <span className="text-red-500">*</span>
                {settings.legal_form && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </Label>
              <Input
                id="legal_form"
                value={settings.legal_form}
                onChange={(e) => setSettings({ ...settings, legal_form: e.target.value })}
                placeholder="SAS, SARL, EI..."
                className={!settings.legal_form ? 'border-orange-300' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="share_capital">
                {t('invoicing.compliance.shareCapital', 'Capital social')}
              </Label>
              <Input
                id="share_capital"
                value={settings.share_capital}
                onChange={(e) => setSettings({ ...settings, share_capital: e.target.value })}
                placeholder="10 000 €"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rcs_city" className="flex items-center gap-2">
                {t('invoicing.compliance.rcsCity', 'Ville du RCS')} <span className="text-red-500">*</span>
                {settings.rcs_city && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </Label>
              <Input
                id="rcs_city"
                value={settings.rcs_city}
                onChange={(e) => setSettings({ ...settings, rcs_city: e.target.value })}
                placeholder="Paris, Lyon..."
                className={!settings.rcs_city ? 'border-orange-300' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rcs_number">
                {t('invoicing.compliance.rcsNumber', 'Numéro RCS')}
              </Label>
              <Input
                id="rcs_number"
                value={settings.rcs_number}
                onChange={(e) => setSettings({ ...settings, rcs_number: e.target.value })}
                placeholder="RCS 123 456 789"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="legal_mentions">
              {t('invoicing.compliance.additionalMentions', 'Mentions légales supplémentaires')}
            </Label>
            <Textarea
              id="legal_mentions"
              value={settings.legal_mentions}
              onChange={(e) => setSettings({ ...settings, legal_mentions: e.target.value })}
              placeholder="Ex: Dispensé d'immatriculation au RCS / APE 6202A..."
              rows={3}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('invoicing.compliance.additionalMentionsHelp', 'Autres mentions obligatoires selon votre activité')}
            </p>
          </div>
        </CardContent>
      </Card>
      {/* Coordonnées bancaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-purple-600" />
            {t('invoicing.compliance.bankDetails', 'Coordonnées Bancaires')}
          </CardTitle>
          <CardDescription>
            {t('invoicing.compliance.bankDetailsDesc', 'Ces informations faciliteront le paiement de vos factures par vos clients.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="main_bank_name">
              {t('invoicing.compliance.bankName', 'Nom de la banque')}
            </Label>
            <Input
              id="main_bank_name"
              value={settings.main_bank_name}
              onChange={(e) => setSettings({ ...settings, main_bank_name: e.target.value })}
              placeholder="BNP Paribas, Crédit Agricole..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="main_bank_iban" className="flex items-center gap-2">
              {t('invoicing.compliance.iban', 'IBAN')} <span className="text-red-500">*</span>
              {settings.main_bank_iban && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            </Label>
            <Input
              id="main_bank_iban"
              value={settings.main_bank_iban}
              onChange={(e) => setSettings({ ...settings, main_bank_iban: e.target.value })}
              placeholder="FR76 1234 5678 9012 3456 7890 123"
              className={!settings.main_bank_iban ? 'border-orange-300' : ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="main_bank_bic">
              {t('invoicing.compliance.bic', 'BIC/SWIFT')}
            </Label>
            <Input
              id="main_bank_bic"
              value={settings.main_bank_bic}
              onChange={(e) => setSettings({ ...settings, main_bank_bic: e.target.value })}
              placeholder="BNPAFRPP"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_instructions">
              {t('invoicing.compliance.paymentInstructions', 'Instructions de paiement')}
            </Label>
            <Textarea
              id="payment_instructions"
              value={settings.payment_instructions}
              onChange={(e) => setSettings({ ...settings, payment_instructions: e.target.value })}
              placeholder="Ex: Paiement par virement bancaire sous 30 jours..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
      {/* Conditions générales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            {t('invoicing.compliance.salesTerms', 'Conditions de Vente & TVA')}
          </CardTitle>
          <CardDescription>
            {t('invoicing.compliance.salesTermsDesc', 'Définissez vos conditions générales et informations TVA par défaut.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default_terms">
              {t('invoicing.compliance.defaultTerms', 'Conditions générales de vente (CGV)')}
            </Label>
            <Textarea
              id="default_terms"
              value={settings.default_terms}
              onChange={(e) => setSettings({ ...settings, default_terms: e.target.value })}
              placeholder="Ex: Paiement à 30 jours. Pas d'escompte en cas de paiement anticipé. Pénalités de retard..."
              rows={4}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('invoicing.compliance.defaultTermsHelp', 'Ces conditions apparaîtront au bas de chaque facture')}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vat_note">
              {t('invoicing.compliance.vatNote', 'Note TVA')}
            </Label>
            <Textarea
              id="vat_note"
              value={settings.vat_note}
              onChange={(e) => setSettings({ ...settings, vat_note: e.target.value })}
              placeholder="Ex: TVA non applicable, art. 293 B du CGI / Auto-entrepreneur..."
              rows={2}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('invoicing.compliance.vatNoteHelp', 'Uniquement si vous avez un régime TVA particulier')}
            </p>
          </div>
        </CardContent>
      </Card>
      {/* Informations importantes */}
      <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p className="font-semibold text-gray-900 dark:text-white">
                {t('invoicing.compliance.mandatoryMentions', '📋 Mentions obligatoires sur une facture française')}
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>{t('invoicing.compliance.mandatoryMention1', 'Numéro SIRET de l\'émetteur')}</li>
                <li>{t('invoicing.compliance.mandatoryMention2', 'N° TVA intracommunautaire')}</li>
                <li>{t('invoicing.compliance.mandatoryMention3', 'Forme juridique et capital social')}</li>
                <li>{t('invoicing.compliance.mandatoryMention4', 'Ville du RCS (Registre du Commerce)')}</li>
                <li>{t('invoicing.compliance.mandatoryMention5', 'Coordonnées bancaires (IBAN)')}</li>
              </ul>
              <p className="mt-3 text-blue-700 dark:text-blue-300">
                {t('invoicing.compliance.autoMention', '💡 Ces informations seront automatiquement ajoutées sur tous vos PDF de factures.')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Bouton d'enregistrement */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t('invoicing.compliance.saving', 'Enregistrement...')}
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              {t('invoicing.compliance.save', 'Enregistrer les paramètres')}
            </>
          )}
        </Button>
      </div>
      </TabsContent>

      {/* Onglet Audit Multi-Devise */}
      <TabsContent value="audit">
        <PaymentTermsAuditPanel />
      </TabsContent>

      {/* Onglet Audit Complet (Factures, Devis, Bons, Avoirs) */}
      <TabsContent value="audit-extended">
        {currentCompany?.id && (
          <ExtendedPaymentTermsAuditPanel companyId={currentCompany.id} />
        )}
      </TabsContent>
    </Tabs>
  );
}
