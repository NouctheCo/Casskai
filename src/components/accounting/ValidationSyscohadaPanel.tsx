/**
 * Composant de validation conformité SYSCOHADA/OHADA
 * Affiche résultat validation avec score de conformité et liste des erreurs
 *
 * @module ValidationSyscohadaPanel
 */

import { useState } from 'react';
import { CheckCircle2, Loader2, AlertTriangle, AlertCircle, Sparkles, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { toastSuccess, toastError } from '@/lib/toast-helpers';
import { logger } from '@/lib/logger';
import {
  syscohadaValidationService,
  type ValidationResult
} from '@/services/syscohadaValidationService';

export function ValidationSyscohadaPanel() {
  const { currentEnterprise } = useEnterprise();
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const handleValidate = async () => {
    if (!currentEnterprise) {
      toastError('Aucune entreprise sélectionnée');
      return;
    }

    setIsValidating(true);

    try {
      const validationResult = await syscohadaValidationService.validateCompany(
        currentEnterprise.id
      );

      setResult(validationResult);

      if (validationResult.is_valid) {
        toastSuccess(`✅ Conformité SYSCOHADA validée (${validationResult.compliance_score}%)`);
      } else {
        toastError(
          `❌ Non conforme : ${validationResult.total_errors} erreur(s), ${validationResult.total_warnings} avertissement(s)`
        );
      }
    } catch (error) {
      logger.error('ValidationSyscohadaPanel', 'Erreur validation SYSCOHADA:', error);
      toastError('Impossible de valider la conformité SYSCOHADA');
    } finally {
      setIsValidating(false);
    }
  };

  // Helper function for score color (unused in current implementation but kept for future use)
  // const getScoreColor = (score: number) => {
  //   if (score >= 90) return 'text-green-600';
  //   if (score >= 75) return 'text-blue-600';
  //   if (score >= 60) return 'text-yellow-600';
  //   return 'text-red-600';
  // };

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (score >= 90) return 'default';
    if (score >= 75) return 'secondary';
    return 'destructive';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Validation SYSCOHADA
            </CardTitle>
            <CardDescription>
              Vérification conformité comptable OHADA (17 pays africains)
            </CardDescription>
          </div>

          <Button
            onClick={handleValidate}
            disabled={isValidating}
            className="gap-2"
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validation en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Lancer validation
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!result && !isValidating && (
          <div className="text-center py-8 text-muted-foreground">
            <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              Cliquez sur "Lancer validation" pour vérifier la conformité SYSCOHADA
            </p>
            <p className="text-xs mt-2">
              Validations : Plan comptable 8 classes • HAO (classe 8) • TAFIRE • Balances
            </p>
          </div>
        )}

        {isValidating && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Validation en cours...
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Vérification plan comptable, HAO, TAFIRE, balances...
            </p>
          </div>
        )}

        {result && !isValidating && (
          <div className="space-y-6">
            {/* Score de conformité */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.is_valid ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">
                    {result.is_valid ? 'Conforme SYSCOHADA' : 'Non conforme'}
                  </span>
                </div>

                <Badge variant={getScoreBadgeVariant(result.compliance_score)}>
                  Score : {result.compliance_score}%
                </Badge>
              </div>

              <Progress value={result.compliance_score} className="h-2" />

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {result.total_errors} erreur{result.total_errors > 1 ? 's' : ''} • {' '}
                  {result.total_warnings} avertissement{result.total_warnings > 1 ? 's' : ''}
                </span>
                <span className="text-xs">
                  Validé le {new Date(result.checked_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>

            <Separator />

            {/* Résumé rapide */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      {result.errors.filter(e => e.severity === 'info').length} validations OK
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-900">
                      {result.total_errors} erreur{result.total_errors > 1 ? 's' : ''} critique{result.total_errors > 1 ? 's' : ''}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Liste des erreurs et avertissements */}
            {result.errors.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">
                  Détail des validations ({result.errors.length})
                </h4>

                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {result.errors.map((error, index) => (
                      <Alert
                        key={index}
                        variant={error.severity === 'error' ? 'destructive' : 'default'}
                        className={
                          error.severity === 'warning'
                            ? 'border-yellow-200 bg-yellow-50/50'
                            : error.severity === 'info'
                            ? 'border-blue-200 bg-blue-50/50'
                            : ''
                        }
                      >
                        <div className="flex items-start gap-2">
                          {error.severity === 'error' ? (
                            <AlertCircle className="h-4 w-4 mt-0.5" />
                          ) : error.severity === 'warning' ? (
                            <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-600" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                          )}

                          <div className="flex-1 space-y-1">
                            <AlertTitle className="text-sm flex items-center gap-2">
                              <Badge variant="outline" className="text-xs font-mono">
                                {error.code}
                              </Badge>
                              {error.affected_account && (
                                <span className="text-xs text-muted-foreground font-normal">
                                  Compte {error.affected_account}
                                </span>
                              )}
                            </AlertTitle>

                            <AlertDescription className="text-sm">
                              {error.message}
                            </AlertDescription>

                            {error.suggestion && (
                              <div className="mt-2 pt-2 border-t border-border/50">
                                <p className="text-xs text-muted-foreground flex items-start gap-1">
                                  <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <span>
                                    <strong>Suggestion :</strong> {error.suggestion}
                                  </span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleValidate}
                className="gap-2"
              >
                <Sparkles className="h-3 w-3" />
                Re-valider
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // TODO: Générer rapport PDF
                  toastSuccess('Export rapport PDF (à implémenter)');
                }}
                className="gap-2"
              >
                <FileCheck className="h-3 w-3" />
                Exporter PDF
              </Button>
            </div>
          </div>
        )}

        {/* Informations SYSCOHADA */}
        <div className="mt-6 pt-6 border-t">
          <details className="space-y-2">
            <summary className="text-sm font-medium cursor-pointer hover:text-primary">
              ℹ️ À propos de la validation SYSCOHADA
            </summary>

            <div className="text-xs text-muted-foreground space-y-2 pl-5">
              <p>
                <strong>SYSCOHADA</strong> = Système Comptable OHADA (17 pays africains)
              </p>

              <p>
                <strong>Validations effectuées :</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Plan comptable conforme (8 classes : 1-8)</li>
                <li>Séparation HAO (Hors Activités Ordinaires - classe 8)</li>
                <li>Cohérence TAFIRE (Tableau Financier des Ressources et Emplois)</li>
                <li>Équilibre balances (Débit = Crédit)</li>
                <li>Présence comptes obligatoires (Capital, Résultat, Clients, etc.)</li>
              </ul>

              <p className="pt-2">
                <strong>Score de conformité :</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>90-100% : Excellent (conforme OHADA)</li>
                <li>75-89% : Bon (quelques ajustements recommandés)</li>
                <li>60-74% : Moyen (corrections nécessaires)</li>
                <li>&lt;60% : Faible (non conforme, corrections urgentes)</li>
              </ul>
            </div>
          </details>
        </div>
      </CardContent>
    </Card>
  );
}
