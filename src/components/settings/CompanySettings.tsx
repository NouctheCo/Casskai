import { useState, useEffect } from 'react';
import { devLogger } from '@/utils/devLogger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Building, MapPin, Phone, Mail, Globe, Save, Loader2, Trash2, AlertTriangle, Landmark, Upload, Image as ImageIcon } from 'lucide-react';
import { useCountries } from '@/hooks/useReferentials';
import { CompanyDeletionDialog } from './CompanyDeletionDialog';
import { BusinessIdValidator } from '@/components/validation/BusinessIdValidator';
import { ComplianceChecklist } from './ComplianceChecklist';
import { mapRowToSettings, mapSettingsToUpdate, type CompanySettings as CompanySettingsType } from '@/types/company-settings.types';

export function CompanySettings() {
  const { user: _user, currentCompany } = useAuth();
  const { toast } = useToast();
  const { countries, loading: _countriesLoading } = useCountries();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCompanyDeletion, setShowCompanyDeletion] = useState(false);
  const [settings, setSettings] = useState<CompanySettingsType | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Charger les paramètres entreprise
  const loadCompanySettings = async () => {
    if (!currentCompany?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', currentCompany.id)
        .single();

      if (error) throw error;
      if (data) {
        const mappedSettings = mapRowToSettings(data);
        setSettings(mappedSettings);
        devLogger.info('[CompanySettings] Données chargées:', mappedSettings);
      }
    } catch (error) {
      devLogger.error('[CompanySettings] Erreur chargement:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les paramètres entreprise',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompanySettings();
  }, [currentCompany?.id]);

  const handleSave = async () => {
    if (!currentCompany?.id || !settings) return;

    setIsSaving(true);
    try {
      const updateData = {
        ...mapSettingsToUpdate(settings),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', currentCompany.id);

      if (error) throw error;

      toast({
        title: 'Paramètres sauvegardés',
        description: 'Les paramètres de l\'entreprise ont été mis à jour avec succès'
      });

      await loadCompanySettings();
    } catch (error) {
      devLogger.error('[CompanySettings] Erreur sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file || !currentCompany?.id) return;

    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Format invalide',
        description: 'Veuillez sélectionner un fichier image (PNG, JPG, etc.)',
        variant: 'destructive'
      });
      return;
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Fichier trop volumineux',
        description: 'La taille du logo ne doit pas dépasser 2 MB',
        variant: 'destructive'
      });
      return;
    }

    setIsUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentCompany.id}/logo.${fileExt}`;

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      // Mettre à jour la base de données
      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: publicUrl })
        .eq('id', currentCompany.id);

      if (updateError) throw updateError;

      // Mettre à jour l'état local
      setSettings(prev => prev ? ({
        ...prev,
        branding: { ...prev.branding, logoUrl: publicUrl }
      }) : prev);

      toast({
        title: 'Logo mis à jour',
        description: 'Le logo de votre entreprise a été mis à jour avec succès'
      });

      await loadCompanySettings();
    } catch (error) {
      devLogger.error('[CompanySettings] Erreur upload logo:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le logo',
        variant: 'destructive'
      });
    } finally {
      setIsUploadingLogo(false);
      // Réinitialiser l'input pour permettre de réuploader le même fichier
      input.value = '';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Aucune donnée entreprise disponible
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Checklist de conformité légale */}
      <ComplianceChecklist settings={settings} />

      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Informations générales
          </CardTitle>
          <CardDescription>
            Informations de base de votre entreprise
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de l'entreprise *</Label>
              <Input
                id="companyName"
                value={settings.generalInfo.name}
                onChange={(e) => setSettings(prev => prev ? ({
                  ...prev,
                  generalInfo: { ...prev.generalInfo, name: e.target.value }
                }) : prev)}
                placeholder="Ma Société SARL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalForm">Forme juridique *</Label>
              <Select
                value={settings.generalInfo.legalForm || ''}
                onValueChange={(value) => setSettings(prev => prev ? ({
                  ...prev,
                  generalInfo: { ...prev.generalInfo, legalForm: value as any }
                }) : prev)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SARL">SARL</SelectItem>
                  <SelectItem value="SAS">SAS</SelectItem>
                  <SelectItem value="SASU">SASU</SelectItem>
                  <SelectItem value="EURL">EURL</SelectItem>
                  <SelectItem value="SA">SA</SelectItem>
                  <SelectItem value="EI">Entreprise Individuelle</SelectItem>
                  <SelectItem value="Auto-entrepreneur">Auto-entrepreneur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siret">SIRET *</Label>
              <Input
                id="siret"
                value={settings.generalInfo.siret || ''}
                onChange={(e) => setSettings(prev => prev ? ({
                  ...prev,
                  generalInfo: { ...prev.generalInfo, siret: e.target.value }
                }) : prev)}
                placeholder="123 456 789 01234"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatNumber">Numéro de TVA *</Label>
              <Input
                id="vatNumber"
                value={settings.generalInfo.vatNumber || ''}
                onChange={(e) => setSettings(prev => prev ? ({
                  ...prev,
                  generalInfo: { ...prev.generalInfo, vatNumber: e.target.value }
                }) : prev)}
                placeholder="FR 12 345678901"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shareCapital">Capital social (€) *</Label>
              <Input
                id="shareCapital"
                type="number"
                value={settings.generalInfo.shareCapital || ''}
                onChange={(e) => setSettings(prev => prev ? ({
                  ...prev,
                  generalInfo: { ...prev.generalInfo, shareCapital: parseFloat(e.target.value) || undefined }
                }) : prev)}
                placeholder="10000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apeCode">Code APE</Label>
              <Input
                id="apeCode"
                value={settings.generalInfo.apeCode || ''}
                onChange={(e) => setSettings(prev => prev ? ({
                  ...prev,
                  generalInfo: { ...prev.generalInfo, apeCode: e.target.value }
                }) : prev)}
                placeholder="6202A"
              />
            </div>
          </div>

          <BusinessIdValidator />
        </CardContent>
      </Card>

      {/* Adresse */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Adresse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Adresse (rue) *</Label>
            <Input
              id="address"
              value={settings.contact.address.street || ''}
              onChange={(e) => setSettings(prev => prev ? ({
                ...prev,
                contact: { ...prev.contact, address: { ...prev.contact.address, street: e.target.value }}
              }) : prev)}
              placeholder="123 Rue de la Paix"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Code postal *</Label>
              <Input
                id="postalCode"
                value={settings.contact.address.postalCode || ''}
                onChange={(e) => setSettings(prev => prev ? ({
                  ...prev,
                  contact: { ...prev.contact, address: { ...prev.contact.address, postalCode: e.target.value }}
                }) : prev)}
                placeholder="75001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                value={settings.contact.address.city || ''}
                onChange={(e) => setSettings(prev => prev ? ({
                  ...prev,
                  contact: { ...prev.contact, address: { ...prev.contact.address, city: e.target.value }}
                }) : prev)}
                placeholder="Paris"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Pays *</Label>
              <Select
                value={settings.contact.address.country || 'FR'}
                onValueChange={(value) => setSettings(prev => prev ? ({
                  ...prev,
                  contact: { ...prev.contact, address: { ...prev.contact.address, country: value }}
                }) : prev)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(country => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name} ({country.currency_symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="companyPhone"
                  value={settings.contact.phone || ''}
                  onChange={(e) => setSettings(prev => prev ? ({
                    ...prev,
                    contact: { ...prev.contact, phone: e.target.value }
                  }) : prev)}
                  className="pl-10"
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="companyEmail"
                  type="email"
                  value={settings.contact.email || ''}
                  onChange={(e) => setSettings(prev => prev ? ({
                    ...prev,
                    contact: { ...prev.contact, email: e.target.value }
                  }) : prev)}
                  className="pl-10"
                  placeholder="contact@masociete.com"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyWebsite">Site web</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="companyWebsite"
                value={settings.contact.website || ''}
                onChange={(e) => setSettings(prev => prev ? ({
                  ...prev,
                  contact: { ...prev.contact, website: e.target.value }
                }) : prev)}
                className="pl-10"
                placeholder="https://www.monsite.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations bancaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Informations bancaires
          </CardTitle>
          <CardDescription>
            Nécessaires pour les factures et virements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bankName">Nom de la banque</Label>
            <Input
              id="bankName"
              value={settings.accounting.mainBank?.name || ''}
              onChange={(e) => setSettings(prev => prev ? ({
                ...prev,
                accounting: {
                  ...prev.accounting,
                  mainBank: { ...prev.accounting.mainBank, name: e.target.value }
                }
              }) : prev)}
              placeholder="Crédit Mutuel, BNP Paribas..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="iban">IBAN *</Label>
              <Input
                id="iban"
                value={settings.accounting.mainBank?.iban || ''}
                onChange={(e) => setSettings(prev => prev ? ({
                  ...prev,
                  accounting: {
                    ...prev.accounting,
                    mainBank: { ...prev.accounting.mainBank, iban: e.target.value }
                  }
                }) : prev)}
                placeholder="FR76 1234 1234 1234 1234 1234 123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bic">BIC *</Label>
              <Input
                id="bic"
                value={settings.accounting.mainBank?.bic || ''}
                onChange={(e) => setSettings(prev => prev ? ({
                  ...prev,
                  accounting: {
                    ...prev.accounting,
                    mainBank: { ...prev.accounting.mainBank, bic: e.target.value }
                  }
                }) : prev)}
                placeholder="BNPAFRPPXXX"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo de l'entreprise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Logo de l'entreprise
          </CardTitle>
          <CardDescription>
            Logo affiché sur les factures, devis et documents officiels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {/* Preview du logo actuel */}
            {settings?.branding?.logoUrl && (
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex-shrink-0">
                  <img
                    src={settings.branding.logoUrl}
                    alt="Logo actuel"
                    className="w-24 h-24 object-contain border border-gray-300 dark:border-gray-600 rounded bg-white"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Logo actuel</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Ce logo sera affiché sur vos documents
                  </p>
                </div>
              </div>
            )}

            {/* Upload du logo */}
            <div className="space-y-2">
              <Label htmlFor="logo-upload">
                {settings?.branding?.logoUrl ? 'Changer le logo' : 'Ajouter un logo'}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isUploadingLogo}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Upload...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Parcourir
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Formats acceptés : PNG, JPG, GIF. Taille max : 2 MB. Dimensions recommandées : 400x200px
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mentions légales et conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Mentions légales et conditions</CardTitle>
          <CardDescription>
            Textes affichés sur les factures et devis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="legalMentions">Mentions légales</Label>
            <Textarea
              id="legalMentions"
              value={settings.branding.legalMentions || ''}
              onChange={(e) => setSettings(prev => prev ? ({
                ...prev,
                branding: { ...prev.branding, legalMentions: e.target.value }
              }) : prev)}
              placeholder="SAS au capital de 10000€, RCS Paris, SIRET..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="termsConditions">Conditions de paiement par défaut</Label>
            <Textarea
              id="termsConditions"
              value={settings.branding.defaultTermsConditions || ''}
              onChange={(e) => setSettings(prev => prev ? ({
                ...prev,
                branding: { ...prev.branding, defaultTermsConditions: e.target.value }
              }) : prev)}
              placeholder="Paiement à 30 jours. Escompte pour paiement anticipé..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Paramètres comptables */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres comptables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Devise *</Label>
              <Select
                value={settings.business.currency}
                onValueChange={(value) => setSettings(prev => prev ? ({
                  ...prev,
                  business: { ...prev.business, currency: value }
                }) : prev)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CHF">CHF (Fr)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiscalYearStart">Début exercice fiscal</Label>
              <Select
                value={settings.accounting.fiscalYear.startMonth.toString()}
                onValueChange={(value) => setSettings(prev => prev ? ({
                  ...prev,
                  accounting: {
                    ...prev.accounting,
                    fiscalYear: { ...prev.accounting.fiscalYear, startMonth: parseInt(value) }
                  }
                }) : prev)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Janvier</SelectItem>
                  <SelectItem value="4">Avril</SelectItem>
                  <SelectItem value="7">Juillet</SelectItem>
                  <SelectItem value="10">Octobre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions dangereuses */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Zone de danger
          </CardTitle>
          <CardDescription>
            Ces actions sont irréversibles et peuvent supprimer définitivement l'entreprise et ses données.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-medium text-red-900 dark:text-red-300">
                  Supprimer cette entreprise
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400">
                  Suppression définitive de l'entreprise avec consensus des propriétaires.
                  Inclut l'export FEC (spécifications DGFiP) et l'archivage légal des données.
                  Validation recommandée via Test Compta Demat.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowCompanyDeletion(true)}
                className="ml-4 shrink-0"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder les paramètres
            </>
          )}
        </Button>
      </div>

      {/* Company Deletion Dialog */}
      {showCompanyDeletion && (
        <CompanyDeletionDialog
          companyId={currentCompany?.id || ''}
          companyName={settings.generalInfo.name}
          onCancel={() => setShowCompanyDeletion(false)}
        />
      )}
    </div>
  );
}
