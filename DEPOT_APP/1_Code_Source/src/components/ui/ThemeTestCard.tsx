import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Users, BarChart3, Settings } from 'lucide-react';

/**
 * Composant de test pour vérifier la compatibilité des thèmes
 * Utilise tous les éléments critiques de l'UI
 */
export const ThemeTestCard: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card avec navigation style */}
        <Card className="border border-gray-200 dark:border-gray-600 dark:border-gray-700">
          <CardHeader className="border-b border-gray-200 dark:border-gray-600 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg dark:bg-blue-900/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-gray-900 dark:text-gray-100 dark:text-white">Test Thème</CardTitle>
                <p className="text-xs text-gray-500 dark:text-gray-300">Vérification UI/UX</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-4 space-y-3">
            {/* Boutons de navigation */}
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 dark:bg-gray-900/30"
            >
              <Users className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-300" />
              <div className="flex-1 text-left">
                <div className="font-medium">Navigation Item</div>
                <div className="text-xs text-gray-500 dark:text-gray-300">Description test</div>
              </div>
              <Badge className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                Test
              </Badge>
            </Button>

            {/* Bouton actif */}
            <Button
              variant="ghost"
              className="w-full justify-start bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500 dark:border-blue-400"
            >
              <BarChart3 className="mr-3 h-4 w-4 text-blue-600 dark:text-blue-400" />
              <div className="flex-1 text-left">
                <div className="font-medium">Item Actif</div>
                <div className="text-xs text-blue-500 dark:text-blue-400">État sélectionné</div>
              </div>
              <Badge className="ml-2 text-xs bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700">
                Actif
              </Badge>
            </Button>

            {/* Séparateur */}
            <div className="py-3">
              <div className="flex items-center gap-2 px-3">
                <Settings className="h-4 w-4 text-gray-400 dark:text-gray-500 dark:text-gray-300" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wider">
                  Catégorie Test
                </span>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-600 dark:border-gray-700"></div>
              </div>
            </div>

            {/* Badge variations */}
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                Blue
              </Badge>
              <Badge className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700">
                Green
              </Badge>
              <Badge className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                Purple
              </Badge>
              <Badge className="bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700">
                Orange
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Status card */}
        <Card className="border border-gray-200 dark:border-gray-600 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-300">
                <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
                <span>Système opérationnel</span>
              </div>
              
              <div className="p-3 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                <p className="font-medium text-sm text-blue-900 dark:text-blue-200">Information</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">Thème adaptatif fonctionnel</p>
              </div>
              
              <div className="p-3 rounded-lg border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                <p className="font-medium text-sm text-green-900 dark:text-green-200">Succès</p>
                <p className="text-sm text-green-700 dark:text-green-300">Dark mode configuré</p>
              </div>
              
              <div className="p-3 rounded-lg border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20">
                <p className="font-medium text-sm text-orange-900 dark:text-orange-200">Attention</p>
                <p className="text-sm text-orange-700 dark:text-orange-300">Vérifier les contrastes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThemeTestCard;
