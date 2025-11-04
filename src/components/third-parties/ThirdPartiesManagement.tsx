import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ThirdPartiesManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des Tiers</CardTitle>
      </CardHeader>
      <CardContent className="text-center p-8">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🚧</span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Cette fonctionnalité est en cours de développement
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-500">
          Bientôt disponible dans une prochaine version
        </div>
      </CardContent>
    </Card>
  );
}
