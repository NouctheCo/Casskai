import React from 'react';
import { AutomationDashboard } from '@/components/automation/AutomationDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, Lock } from 'lucide-react';

export default function AutomationPage() {
  const { currentCompany, user } = useAuth();

  if (!user || !currentCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Lock className="h-12 w-12 text-gray-400 mx-auto" />
              <h2 className="text-xl font-semibold">Accès requis</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Veuillez vous connecter et sélectionner une entreprise pour accéder aux workflows d'automatisation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AutomationDashboard />
    </div>
  );
}