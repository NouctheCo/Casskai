import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Building, MapPin, Phone, Mail, Globe, Save, Loader2, Upload } from 'lucide-react';

interface CompanySettings {
  name: string;
  siret: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  currency: string;
  fiscalYear: string;
  accountingMethod: string;
  taxId: string;
  legalForm: string;
  activity: string;
  employees: string;
  description: string;
}

export function CompanySettings() {
  const { user, currentCompany } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<CompanySettings>({
    name: '',
    siret: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'France',
    phone: '',
    email: '',
    website: '',
    logo: '',
    currency: 'EUR',
    fiscalYear: 'calendar',
    accountingMethod: 'accrual',
    taxId: '',
    legalForm: '',
    activity: '',
    employees: '',
    description: ''
  });

  // Charger les paramètres entreprise
  useEffect(() => {
    const loadCompanySettings = async () => {
      if (!currentCompany?.id) return;

      setIsLoading(true);
      try {
        // TODO: Intégrer Supabase pour charger les paramètres entreprise
        // Simulation des données - TODO: Intégrer Supabase
        setSettings({
          name: currentCompany?.name || '',
          siret: (currentCompany as any)?.siret || '',
          address: (currentCompany as any)?.address || '',
          postalCode: (currentCompany as any)?.postal_code || '',
          city: (currentCompany as any)?.city || '',
          country: (currentCompany as any)?.country || 'France',
          phone: (currentCompany as any)?.phone || '',
          email: (currentCompany as any)?.email || '',
          website: (currentCompany as any)?.website || '',
          logo: (currentCompany as any)?.logo || '',
          currency: (currentCompany as any)?.currency || 'EUR',
          fiscalYear: (currentCompany as any)?.fiscal_year || 'calendar',
          accountingMethod: (currentCompany as any)?.accounting_method || 'accrual',
          taxId: (currentCompany as any)?.tax_id || '',
          legalForm: (currentCompany as any)?.legal_form || '',
          activity: (currentCompany as any)?.activity || '',
          employees: (currentCompany as any)?.employees || '',
          description: (currentCompany as any)?.description || ''
        });
      } catch (error) {
        console.error('Erreur chargement paramètres entreprise:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les paramètres entreprise',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCompanySettings();
  }, [currentCompany, toast]);

  const handleSave = async () => {
    if (!currentCompany?.id) return;

    setIsSaving(true);
    try {
      // TODO: Intégrer Supabase pour sauvegarder les paramètres entreprise
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Paramètres sauvegardés',
        description: 'Les paramètres de l\'entreprise ont été mis à jour'
      });
    } catch (error) {
      console.error('Erreur sauvegarde paramètres entreprise:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
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

  return (
    <div className="space-y-6">
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
              <Label htmlFor="companyName">Nom de l'entreprise</Label>
              <Input
                id="companyName"
                value={settings.name}
                onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ma Société SARL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalForm">Forme juridique</Label>
              <Select value={settings.legalForm} onValueChange={(value) => setSettings(prev => ({ ...prev, legalForm: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sarl">SARL</SelectItem>
                  <SelectItem value="sas">SAS</SelectItem>
                  <SelectItem value="sasu">SASU</SelectItem>
                  <SelectItem value="eurl">EURL</SelectItem>
                  <SelectItem value="sa">SA</SelectItem>
                  <SelectItem value="ei">Entreprise Individuelle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siret">SIRET</Label>
              <Input
                id="siret"
                value={settings.siret}
                onChange={(e) => setSettings(prev => ({ ...prev, siret: e.target.value }))}
                placeholder="123 456 789 01234"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">Numéro de TVA</Label>
              <Input
                id="taxId"
                value={settings.taxId}
                onChange={(e) => setSettings(prev => ({ ...prev, taxId: e.target.value }))}
                placeholder="FR 12 345678901"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity">Secteur d'activité</Label>
            <Input
              id="activity"
              value={settings.activity}
              onChange={(e) => setSettings(prev => ({ ...prev, activity: e.target.value }))}
              placeholder="Commerce de détail, Services informatiques..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={settings.description}
              onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez brièvement votre activité..."
              rows={3}
            />
          </div>
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
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={settings.address}
              onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
              placeholder="123 Rue de la Paix"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Code postal</Label>
              <Input
                id="postalCode"
                value={settings.postalCode}
                onChange={(e) => setSettings(prev => ({ ...prev, postalCode: e.target.value }))}
                placeholder="75001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={settings.city}
                onChange={(e) => setSettings(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Paris"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Select value={settings.country} onValueChange={(value) => setSettings(prev => ({ ...prev, country: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="France">France</SelectItem>
                  <SelectItem value="Belgique">Belgique</SelectItem>
                  <SelectItem value="Suisse">Suisse</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
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
                  value={settings.phone}
                  onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
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
                  value={settings.email}
                  onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
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
                value={settings.website}
                onChange={(e) => setSettings(prev => ({ ...prev, website: e.target.value }))}
                className="pl-10"
                placeholder="https://www.monsite.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paramètres comptables */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres comptables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Select value={settings.currency} onValueChange={(value) => setSettings(prev => ({ ...prev, currency: value }))}>
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
              <Label htmlFor="fiscalYear">Exercice fiscal</Label>
              <Select value={settings.fiscalYear} onValueChange={(value) => setSettings(prev => ({ ...prev, fiscalYear: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calendar">Calendrier (Jan-Déc)</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountingMethod">Méthode comptable</Label>
              <Select value={settings.accountingMethod} onValueChange={(value) => setSettings(prev => ({ ...prev, accountingMethod: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accrual">Engagement</SelectItem>
                  <SelectItem value="cash">Trésorerie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employees">Nombre d'employés</Label>
            <Select value={settings.employees} onValueChange={(value) => setSettings(prev => ({ ...prev, employees: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-5">1-5 employés</SelectItem>
                <SelectItem value="6-10">6-10 employés</SelectItem>
                <SelectItem value="11-50">11-50 employés</SelectItem>
                <SelectItem value="51-200">51-200 employés</SelectItem>
                <SelectItem value="200+">Plus de 200 employés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
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
    </div>
  );
}
