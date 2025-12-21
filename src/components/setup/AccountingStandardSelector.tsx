import React from 'react';
import { Select } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Info } from 'lucide-react';

interface AccountingStandardSelectorProps {
  country: string;
  selectedStandard?: string;
  onStandardChange: (standard: string) => void;
}

export const AccountingStandardSelector: React.FC<AccountingStandardSelectorProps> = ({
  country,
  selectedStandard,
  onStandardChange
}) => {
  const getRecommendedStandard = (countryCode: string): string => {
    const SYSCOHADA_COUNTRIES = ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW', 'CM', 'CF', 'TD', 'CG', 'GA', 'GQ', 'GN'];
    return SYSCOHADA_COUNTRIES.includes(countryCode) ? 'SYSCOHADA' : 'PCG';
  };

  const getStandardInfo = (standard: string) => {
    const info = {
      'PCG': {
        name: 'Plan Comptable Général (PCG)',
        description: 'Standard comptable français utilisé en France et dans plusieurs pays francophones',
        countries: 'France, Belgique (partiellement), Luxembourg',
        accountsCount: '30+ comptes essentiels'
      },
      'SYSCOHADA': {
        name: 'Système Comptable OHADA',
        description: 'Standard utilisé dans les pays membres de l\'OHADA (Organisation pour l\'Harmonisation en Afrique du Droit des Affaires)',
        countries: 'Côte d\'Ivoire, Sénégal, Mali, Burkina Faso, Bénin, Togo, Niger, Guinée-Bissau, Cameroun, RCA, Tchad, Congo, Gabon, Guinée équatoriale, Guinée',
        accountsCount: '25+ comptes essentiels'
      },
      'IFRS': {
        name: 'International Financial Reporting Standards',
        description: 'Normes comptables internationales utilisées principalement par les grandes entreprises',
        countries: 'Union Européenne, Canada, Australie, et 140+ pays',
        accountsCount: 'Plan personnalisable'
      },
      'US_GAAP': {
        name: 'US Generally Accepted Accounting Principles',
        description: 'Standards comptables américains',
        countries: 'États-Unis',
        accountsCount: 'Plan personnalisable'
      }
    };
    return info[standard as keyof typeof info];
  };

  const recommendedStandard = getRecommendedStandard(country);
  const currentStandard = selectedStandard || recommendedStandard;
  const standardInfo = getStandardInfo(currentStandard);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Standard comptable
        </CardTitle>
        <CardDescription>
          Choisissez le référentiel comptable adapté à votre pays et secteur d'activité
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Standard comptable
            {currentStandard === recommendedStandard && (
              <Badge variant="secondary" className="ml-2">
                Recommandé pour {country}
              </Badge>
            )}
          </label>
          <Select 
            value={currentStandard}
            onValueChange={onStandardChange}
          >
            <option value="PCG">Plan Comptable Général (PCG)</option>
            <option value="SYSCOHADA">Système Comptable OHADA</option>
            <option value="IFRS">IFRS (International)</option>
            <option value="US_GAAP">US GAAP (États-Unis)</option>
          </Select>
        </div>

        {standardInfo && (
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="pt-4">
              <h4 className="font-medium text-slate-900 mb-2">{standardInfo.name}</h4>
              <p className="text-sm text-slate-600 mb-3">{standardInfo.description}</p>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-slate-700">Pays concernés : </span>
                  <span className="text-slate-600">{standardInfo.countries}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Comptes créés : </span>
                  <span className="text-slate-600">{standardInfo.accountsCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStandard !== recommendedStandard && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-900/20">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="text-amber-800 font-medium">Standard non recommandé</p>
                <p className="text-amber-700">
                  Pour le pays sélectionné ({country}), nous recommandons le standard <strong>{recommendedStandard}</strong>.
                  Vous pouvez néanmoins utiliser {currentStandard} si cela correspond mieux à vos besoins.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-slate-500 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20">
          <div className="flex items-start gap-2">
            <Info className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800 mb-1">À savoir</p>
              <p className="text-blue-700 dark:text-blue-400">
                Le plan comptable sera automatiquement créé avec les comptes essentiels du standard choisi. 
                Vous pourrez toujours ajouter, modifier ou désactiver des comptes par la suite, 
                et importer un fichier FEC pour récupérer votre plan comptable existant.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountingStandardSelector;
