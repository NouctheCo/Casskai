import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { User, Mail, Phone, MapPin, Calendar, Building, Camera, Save, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { AccountDeletionWizard } from '@/components/account/AccountDeletionWizard';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  timezone: string;
  language: string;
  jobTitle: string;
  department: string;
  bio: string;
  website: string;
  linkedin: string;
  twitter: string;
}

export function UserProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeletionWizard, setShowDeletionWizard] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatar: '',
    timezone: 'Europe/Paris',
    language: 'fr',
    jobTitle: '',
    department: '',
    bio: '',
    website: '',
    linkedin: '',
    twitter: ''
  });

  // Charger le profil utilisateur
  const loadUserProfile = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Charger le profil depuis Supabase
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      // Si le profil existe, l'utiliser, sinon utiliser les métadonnées
      if (data) {
        setProfile({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: user.email || '',
          phone: data.phone || '',
          avatar: data.avatar_url || '',
          timezone: data.timezone || 'Europe/Paris',
          language: data.language || 'fr',
          jobTitle: data.job_title || '',
          department: data.department || '',
          bio: data.bio || '',
          website: data.website || '',
          linkedin: data.linkedin || '',
          twitter: data.twitter || ''
        });
      } else {
        // Créer un profil initial depuis les métadonnées utilisateur
        setProfile({
          firstName: user.user_metadata?.first_name || '',
          lastName: user.user_metadata?.last_name || '',
          email: user.email || '',
          phone: user.user_metadata?.phone || '',
          avatar: user.user_metadata?.avatar_url || '',
          timezone: 'Europe/Paris',
          language: 'fr',
          jobTitle: '',
          department: '',
          bio: '',
          website: '',
          linkedin: '',
          twitter: ''
        });
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger votre profil',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Charger le profil utilisateur au montage du composant
  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      // Préparer les données pour Supabase
      const profileData = {
        user_id: user.id,
        email: user.email,
        first_name: profile.firstName.trim(),
        last_name: profile.lastName.trim(),
        phone: profile.phone.trim(),
        avatar_url: profile.avatar,
        timezone: profile.timezone,
        language: profile.language,
        job_title: profile.jobTitle.trim(),
        department: profile.department.trim(),
        bio: profile.bio.trim(),
        website: profile.website.trim(),
        linkedin: profile.linkedin.trim(),
        twitter: profile.twitter.trim()
      };

      console.warn('💾 Données à sauvegarder:', profileData);

      // Sauvegarder dans Supabase - approche explicite insert/update
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let error;
      if (existingProfile) {
        // Update existing profile
        const result = await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new profile
        const result = await supabase
          .from('user_profiles')
          .insert(profileData);
        error = result.error;
      }

      if (error) {
        console.error('Erreur Supabase sauvegarde:', error);
        throw error;
      }

      // Recharger le profil après la sauvegarde pour mettre à jour l'interface
      await loadUserProfile();

      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été sauvegardées avec succès'
      });
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder votre profil',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      // Vérifier la taille du fichier (5MB max)
      if (file.size > 5242880) {
        toast({
          title: 'Fichier trop volumineux',
          description: 'La taille maximale est de 5MB',
          variant: 'destructive'
        });
        return;
      }

      // Upload vers Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Erreur upload Storage:', uploadError);
        throw uploadError;
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Mettre à jour le profil avec la nouvelle URL
      setProfile(prev => ({ ...prev, avatar: publicUrl }));

      // Sauvegarder dans user_profiles
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          avatar_url: publicUrl
        });

      if (updateError) {
        console.error('Erreur mise à jour profil:', updateError);
        throw updateError;
      }

      toast({
        title: 'Avatar mis à jour',
        description: 'Votre photo de profil a été changée'
      });
    } catch (error) {
      console.error('Erreur upload avatar:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger l\'avatar',
        variant: 'destructive'
      });
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
      {/* En-tête avec avatar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil Utilisateur
          </CardTitle>
          <CardDescription>
            Gérez vos informations personnelles et professionnelles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar} alt="Avatar" />
                <AvatarFallback className="text-lg">
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                <Camera className="h-4 w-4 text-primary-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  aria-label="Changer la photo de profil"
                />
              </label>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {profile.firstName} {profile.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">{profile.jobTitle}</p>
              <Badge variant="secondary">{profile.department}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations de base */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de base</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                key={`firstName-${profile.firstName}`}
                id="firstName"
                value={profile.firstName}
                onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Votre prénom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                key={`lastName-${profile.lastName}`}
                id="lastName"
                value={profile.lastName}
                onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Votre nom"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                key={`email-${profile.email}`}
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                className="pl-10"
                placeholder="votre.email@exemple.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                key={`phone-${profile.phone}`}
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                className="pl-10"
                placeholder="+33 6 12 34 56 78"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations professionnelles */}
      <Card>
        <CardHeader>
          <CardTitle>Informations professionnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Poste</Label>
              <Input
                key={`jobTitle-${profile.jobTitle}`}
                id="jobTitle"
                value={profile.jobTitle}
                onChange={(e) => setProfile(prev => ({ ...prev, jobTitle: e.target.value }))}
                placeholder="Directeur Commercial"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Département</Label>
              <Input
                key={`department-${profile.department}`}
                id="department"
                value={profile.department}
                onChange={(e) => setProfile(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Commercial"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biographie</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Quelques mots sur vous..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Préférences */}
      <Card>
        <CardHeader>
          <CardTitle>Préférences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Fuseau horaire</Label>
              <Select value={profile.timezone} onValueChange={(value) => setProfile(prev => ({ ...prev, timezone: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Paris">Europe/Paris (UTC+1)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (UTC+0)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (UTC-5)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo (UTC+9)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Langue</Label>
              <Select value={profile.language} onValueChange={(value) => setProfile(prev => ({ ...prev, language: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Réseaux sociaux */}
      <Card>
        <CardHeader>
          <CardTitle>Réseaux sociaux</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="website">Site web</Label>
            <Input
              id="website"
              value={profile.website}
              onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://votresite.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              value={profile.linkedin}
              onChange={(e) => setProfile(prev => ({ ...prev, linkedin: e.target.value }))}
              placeholder="https://linkedin.com/in/votreprofil"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter</Label>
            <Input
              id="twitter"
              value={profile.twitter}
              onChange={(e) => setProfile(prev => ({ ...prev, twitter: e.target.value }))}
              placeholder="@votrepseudo"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions dangereuses */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Zone de danger
          </CardTitle>
          <CardDescription>
            Ces actions sont irréversibles et peuvent supprimer définitivement vos données.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-medium text-red-900">
                  Supprimer mon compte
                </h3>
                <p className="text-sm text-red-700">
                  Suppression définitive de votre compte avec export de vos données comptables.
                  Cette action inclut une période de grâce de 30 jours.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeletionWizard(true)}
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
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder le profil
            </>
          )}
        </Button>
      </div>

      {/* Wizard de suppression de compte */}
      <AccountDeletionWizard
        isOpen={showDeletionWizard}
        onClose={() => setShowDeletionWizard(false)}
        onComplete={() => {
          toast({
            title: "Demande enregistrée",
            description: "Votre demande de suppression de compte a été enregistrée. Vous recevrez un email de confirmation.",
          });
          setShowDeletionWizard(false);
        }}
      />
    </div>
  );
}
