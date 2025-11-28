import React from 'react';
// import { EnhancedSettings } from '@/components/settings/EnhancedSettings';
import { UserProfileSettings, CompanySettings, NotificationSettings, ModuleManagementSettings, SubscriptionSettings } from '@/components/settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const navigate = useNavigate();

  const handleRestartTour = () => {
    const restart = (window as unknown as Record<string, unknown>).restartOnboardingTour;
    if (typeof restart === 'function') {
      (restart as () => void)();
      navigate('/dashboard');
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
        </TabsList>
        <TabsContent value="profile"><UserProfileSettings /></TabsContent>
        <TabsContent value="company"><CompanySettings /></TabsContent>
        <TabsContent value="notifications"><NotificationSettings /></TabsContent>
        <TabsContent value="modules"><ModuleManagementSettings /></TabsContent>
        <TabsContent value="subscription"><SubscriptionSettings /></TabsContent>
      </Tabs>
    </div>
  );
}
