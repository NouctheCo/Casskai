import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserProfileSettings } from './UserProfileSettings';
import { CompanySettings } from './CompanySettings';
import { NotificationSettings } from './NotificationSettings';
import { ModuleManagementSettings } from './ModuleManagementSettings';
import SubscriptionSettings from './SubscriptionSettings';
import { StripeIntegrationTest } from '../StripeIntegrationTest';
import { UserCog, Building, Bell, Settings, CreditCard, TestTube } from 'lucide-react';

export function EnhancedSettings() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez votre profil, votre entreprise et vos préférences d'application
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Entreprise
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Abonnement
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Modules
          </TabsTrigger>
          <TabsTrigger value="dev" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Dev
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <UserProfileSettings />
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <CompanySettings />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <SubscriptionSettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="modules" className="space-y-6">
          <ModuleManagementSettings />
        </TabsContent>

        <TabsContent value="dev" className="space-y-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Outils de développement</h2>
              <p className="text-muted-foreground">
                Testez les intégrations et fonctionnalités en développement
              </p>
            </div>
            <StripeIntegrationTest />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
