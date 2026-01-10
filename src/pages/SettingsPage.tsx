/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import React from 'react';
// import { EnhancedSettings } from '@/components/settings/EnhancedSettings';
import { UserProfileSettings, CompanySettings, NotificationSettings, ModuleManagementSettings, SubscriptionSettings } from '@/components/settings';
import { EmailConfigurationSettings } from '@/components/settings/EmailConfigurationSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const navigate = useNavigate();

  const handleRestartTour = () => {
    // Méthode 1 : Utiliser l'URL pour forcer le tour (recommandé)
    navigate('/dashboard?tour=start');

    // Méthode 2 : Fallback sur la fonction globale si elle existe
    const restart = (window as unknown as Record<string, unknown>).restartOnboardingTour;
    if (typeof restart === 'function') {
      (restart as () => void)();
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Paramètres</h1>
      <Button variant="outline" onClick={handleRestartTour} className="mb-6">
        🎯 Relancer le guide d'introduction
      </Button>
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="company">Entreprise</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="subscription">Abonnement</TabsTrigger>
          <TabsTrigger value="emails">📧 Emails</TabsTrigger>
          <TabsTrigger value="team">Équipe</TabsTrigger>
        </TabsList>
        <TabsContent value="profile"><UserProfileSettings /></TabsContent>
        <TabsContent value="company"><CompanySettings /></TabsContent>
        <TabsContent value="notifications"><NotificationSettings /></TabsContent>
        <TabsContent value="modules"><ModuleManagementSettings /></TabsContent>
        <TabsContent value="subscription"><SubscriptionSettings /></TabsContent>
        <TabsContent value="emails"><EmailConfigurationSettings /></TabsContent>
        <TabsContent value="team">
          <Button onClick={() => navigate('/team')} className="mt-4">
            Accéder à la gestion d'équipe
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
