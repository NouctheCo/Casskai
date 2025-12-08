import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, CheckCircle, AlertCircle, Info } from 'lucide-react';
import {
  detectChartOfAccounts,
  requiresSYSCOHADA,
  OHADA_COUNTRIES,
  type ChartDetectionResult
} from '@/services/chartDetectionService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 🌍 COMPOSANT DÉTECTION PLAN COMPTABLE
 * 
 * Affiche automatiquement le plan comptable recommandé selon le pays
 * À intégrer dans CompanyValidationWizard ou formulaire création entreprise
 */

interface ChartDetectionBannerProps {
  countryCode: string;
  companySize?: 'micro' | 'small' | 'medium' | 'large';
  industry?: string;
  onChartSelected?: (chartCode: 'SYSCOHADA' | 'PCG') => void;
}

export const ChartDetectionBanner: React.FC<ChartDetectionBannerProps> = ({
  countryCode,
  companySize,
  industry,
  onChartSelected
}) => {
  const { t } = useTranslation();
  const [detection, setDetection] = useState<ChartDetectionResult | null>(null);

  useEffect(() => {
    if (countryCode && countryCode.length === 2) {
      const result = detectChartOfAccounts(countryCode, companySize, industry);
      setDetection(result);
      
      // Auto-sélection si confidence HIGH
      if (result.confidence === 'HIGH' && onChartSelected) {
        onChartSelected(result.recommended.standard as 'SYSCOHADA' | 'PCG');
      }
    }
    // onChartSelected est stable (défini par le parent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode, companySize, industry]);

  if (!detection) return null;

  const isOHADA = detection.zone === 'OHADA';
  const isMandatory = requiresSYSCOHADA(countryCode);

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {t('accounting.chartDetection.title', 'Plan comptable détecté')}
              {detection.confidence === 'HIGH' && (
                <Badge variant="default" className="ml-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t('accounting.chartDetection.confidence.high', 'Recommandé')}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {detection.countryName} ({countryCode.toUpperCase()})
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Plan recommandé */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-base">
                {detection.recommended.standard}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {detection.recommended.standard === 'SYSCOHADA' 
                  ? t('accounting.syscohada.fullName', 'Système Comptable OHADA')
                  : t('accounting.pcg.fullName', 'Plan Comptable Général')
                }
              </p>
            </div>
            {isMandatory && (
              <Badge variant="destructive">
                {t('accounting.chartDetection.mandatory', 'Obligatoire')}
              </Badge>
            )}
          </div>
        </div>

        {/* Alert SYSCOHADA */}
        {isOHADA && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {t('accounting.syscohada.alert.title', 'Pays membre de l\'OHADA')}
            </AlertTitle>
            <AlertDescription>
              {t('accounting.syscohada.alert.description',
                'Le SYSCOHADA révisé 2017 est le plan comptable légal dans les 17 pays membres de l\'Organisation pour l\'Harmonisation en Afrique du Droit des Affaires (OHADA).'
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Reasoning */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>{detection.reasoning}</p>
        </div>

        {/* Liste pays OHADA */}
        {isOHADA && (
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('accounting.syscohada.memberCountries', 'Voir tous les pays membres de l\'OHADA')} ({OHADA_COUNTRIES.length})
            </summary>
            <div className="mt-2 flex flex-wrap gap-2">
              {OHADA_COUNTRIES.map(code => (
                <Badge key={code} variant="outline" className="text-xs">
                  {code}
                </Badge>
              ))}
            </div>
          </details>
        )}

        {/* Alternatives */}
        {detection.alternatives.length > 0 && (
          <div>
            <h5 className="text-sm font-medium mb-2">
              {t('accounting.chartDetection.alternatives', 'Plans alternatifs')}
            </h5>
            <div className="space-y-2">
              {detection.alternatives.map((alt, idx) => (
                <div
                  key={idx}
                  className="border border-border rounded-lg p-3 text-sm bg-muted/50"
                >
                  <span className="font-medium">{alt.standard}</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('accounting.chartDetection.alternativeNote', 
                      'Peut être utilisé pour les multinationales ou cas spécifiques'
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Boutons action */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onChartSelected?.(detection.recommended.standard as 'SYSCOHADA' | 'PCG')}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
          >
            {t('accounting.chartDetection.useRecommended', 'Utiliser ce plan')}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * 🎯 EXEMPLE INTÉGRATION DANS FORMULAIRE ENTREPRISE
 */
export const ExampleCompanyFormWithChart: React.FC = () => {
  const [countryCode, setCountryCode] = useState('');
  const [selectedChart, setSelectedChart] = useState<'SYSCOHADA' | 'PCG' | null>(null);

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          Pays de l'entreprise
        </label>
        <select
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          aria-label="Sélection du pays de l'entreprise"
          className="w-full px-3 py-2 border border-border rounded-md"
        >
          <option value="">Sélectionnez un pays</option>
          <option value="FR">France</option>
          <option value="SN">Sénégal</option>
          <option value="CI">Côte d'Ivoire</option>
          <option value="CM">Cameroun</option>
          <option value="BJ">Bénin</option>
          <option value="MA">Maroc</option>
          <option value="TN">Tunisie</option>
        </select>
      </div>

      {countryCode && (
        <ChartDetectionBanner
          countryCode={countryCode}
          companySize="small"
          onChartSelected={setSelectedChart}
        />
      )}

      {selectedChart && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Plan comptable configuré</AlertTitle>
          <AlertDescription>
            Votre entreprise utilisera le plan <strong>{selectedChart}</strong>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ChartDetectionBanner;
