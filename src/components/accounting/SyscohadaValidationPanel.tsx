/**
 * Panneau de validation SYSCOHADA
 * Affiche les erreurs de conformité comptable OHADA en temps réel
 *
 * @module SyscohadaValidationPanel
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  RefreshCw,
  Shield,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import {
  syscohadaValidationService,
  type ValidationResult,
  type SyscohadaValidationError,
} from '@/services/syscohadaValidationService';

interface SyscohadaValidationPanelProps {
  companyId: string;
  fiscalYear?: number;
  autoRefresh?: boolean; // Refresh automatique toutes les 5min
  refreshInterval?: number; // En ms (default 300000 = 5min)
  className?: string;
}

export function SyscohadaValidationPanel({
  companyId,
  fiscalYear,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
  className,
}: SyscohadaValidationPanelProps) {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Charger validation
  const loadValidation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await syscohadaValidationService.validateCompany(
        companyId,
        fiscalYear
      );

      setValidation(result);
      setLastChecked(new Date());
    } catch (err) {
      logger.error('SyscohadaValidationPanel', 'Erreur validation SYSCOHADA:', err);
      setError('Impossible de valider la conformité SYSCOHADA');
    } finally {
      setLoading(false);
    }
  }, [companyId, fiscalYear]);

  // Chargement initial
  useEffect(() => {
    loadValidation();
  }, [loadValidation]);

  // Auto-refresh si activé
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadValidation();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadValidation]);

  // Grouper erreurs par sévérité
  const errorsBySeverity = {
    error: validation?.errors.filter((e) => e.severity === 'error') || [],
    warning: validation?.errors.filter((e) => e.severity === 'warning') || [],
    info: validation?.errors.filter((e) => e.severity === 'info') || [],
  };

  // Icône et couleur par sévérité (helpers unused in current implementation but kept for future use)
  // const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
  //   switch (severity) {
  //     case 'error':
  //       return <AlertTriangle className="h-4 w-4" />;
  //     case 'warning':
  //       return <AlertCircle className="h-4 w-4" />;
  //     case 'info':
  //       return <Info className="h-4 w-4" />;
  //   }
  // };

  // const getSeverityColor = (severity: 'error' | 'warning' | 'info') => {
  //   switch (severity) {
  //     case 'error':
  //       return 'text-destructive';
  //     case 'warning':
  //       return 'text-orange-600';
  //     case 'info':
  //       return 'text-blue-600';
  //   }
  // };

  // const getSeverityBadgeVariant = (
  //   severity: 'error' | 'warning' | 'info'
  // ): 'destructive' | 'default' | 'outline' => {
  //   switch (severity) {
  //     case 'error':
  //       return 'destructive';
  //     case 'warning':
  //       return 'default';
  //     case 'info':
  //       return 'outline';
  //   }
  // };

  // Loading skeleton
  if (loading && !validation) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Erreur
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erreur de validation</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Pas de données
  if (!validation) {
    return null;
  }

  // Calcul badge global
  const globalBadge = validation.is_valid ? (
    <Badge variant="default" className="flex items-center gap-1">
      <CheckCircle2 className="h-3 w-3" />
      <span>Conforme SYSCOHADA</span>
    </Badge>
  ) : (
    <Badge variant="destructive" className="flex items-center gap-1">
      <AlertTriangle className="h-3 w-3" />
      <span>Non conforme</span>
    </Badge>
  );

  return (
    <Card className={cn('border-2', className, {
      'border-green-200 bg-green-50/50': validation.is_valid,
      'border-destructive/50 bg-destructive/5': !validation.is_valid,
    })}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Shield className={cn('h-8 w-8', {
              'text-green-600': validation.is_valid,
              'text-destructive': !validation.is_valid,
            })} />
            <div>
              <CardTitle className="flex items-center gap-2">
                Validation SYSCOHADA
                {globalBadge}
              </CardTitle>
              <CardDescription className="mt-1">
                Conformité comptable OHADA (17 pays zone FCFA)
              </CardDescription>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={loadValidation}
            disabled={loading}
            title="Actualiser"
          >
            <RefreshCw className={cn('h-4 w-4', { 'animate-spin': loading })} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Score de conformité */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Score de conformité</span>
            <span className={cn('font-bold', {
              'text-green-600': validation.compliance_score >= 90,
              'text-orange-600': validation.compliance_score >= 70 && validation.compliance_score < 90,
              'text-destructive': validation.compliance_score < 70,
            })}>
              {validation.compliance_score}/100
            </span>
          </div>
          <Progress value={validation.compliance_score} className="h-2" />
        </div>

        {/* Résumé */}
        <div className="grid grid-cols-3 gap-4 py-3 border-y">
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">
              {errorsBySeverity.error.length}
            </div>
            <div className="text-xs text-muted-foreground">Erreurs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {errorsBySeverity.warning.length}
            </div>
            <div className="text-xs text-muted-foreground">Avertissements</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {errorsBySeverity.info.length}
            </div>
            <div className="text-xs text-muted-foreground">Infos</div>
          </div>
        </div>

        {/* Liste des erreurs */}
        {validation.errors.length > 0 ? (
          <Accordion type="multiple" className="w-full">
            {/* Erreurs critiques */}
            {errorsBySeverity.error.length > 0 && (
              <AccordionItem value="errors">
                <AccordionTrigger className="text-destructive hover:text-destructive/80">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-semibold">
                      Erreurs critiques ({errorsBySeverity.error.length})
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {errorsBySeverity.error.map((err, idx) => (
                      <ErrorItem key={idx} error={err} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Avertissements */}
            {errorsBySeverity.warning.length > 0 && (
              <AccordionItem value="warnings">
                <AccordionTrigger className="text-orange-600 hover:text-orange-600/80">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-semibold">
                      Avertissements ({errorsBySeverity.warning.length})
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {errorsBySeverity.warning.map((err, idx) => (
                      <ErrorItem key={idx} error={err} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Informations */}
            {errorsBySeverity.info.length > 0 && (
              <AccordionItem value="info">
                <AccordionTrigger className="text-blue-600 hover:text-blue-600/80">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <span className="font-semibold">
                      Informations ({errorsBySeverity.info.length})
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {errorsBySeverity.info.map((err, idx) => (
                      <ErrorItem key={idx} error={err} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        ) : (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">
              Aucune erreur détectée
            </AlertTitle>
            <AlertDescription className="text-green-700">
              Votre comptabilité est conforme aux normes SYSCOHADA.
            </AlertDescription>
          </Alert>
        )}

        {/* Footer */}
        <div className="pt-4 border-t text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>
              Dernière vérification:{' '}
              {lastChecked
                ? lastChecked.toLocaleString('fr-FR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })
                : 'Jamais'}
            </span>
            {autoRefresh && (
              <Badge variant="outline" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Auto-refresh actif
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Item d'erreur individuel
 */
function ErrorItem({ error }: { error: SyscohadaValidationError }) {
  const icon = error.severity === 'error'
    ? <AlertTriangle className="h-4 w-4" />
    : error.severity === 'warning'
    ? <AlertCircle className="h-4 w-4" />
    : <Info className="h-4 w-4" />;

  const colorClass = error.severity === 'error'
    ? 'text-destructive'
    : error.severity === 'warning'
    ? 'text-orange-600'
    : 'text-blue-600';

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-card">
      <div className="flex items-start gap-2">
        <div className={cn('mt-0.5', colorClass)}>{icon}</div>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium">{error.message}</p>

          {error.affected_account && (
            <p className="text-xs text-muted-foreground">
              Compte affecté: <span className="font-mono">{error.affected_account}</span>
            </p>
          )}

          {error.suggestion && (
            <Alert className="mt-2 py-2">
              <Info className="h-3 w-3" />
              <AlertDescription className="text-xs">
                <strong>Suggestion:</strong> {error.suggestion}
              </AlertDescription>
            </Alert>
          )}

          {error.article_reference && (
            <div className="flex items-center gap-1 mt-2">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Réf. SYSCOHADA: {error.article_reference}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SyscohadaValidationPanel;
