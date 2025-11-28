import React, { useState, useEffect, useMemo } from 'react';
import { devLogger } from '@/utils/devLogger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useModules } from '@/hooks/modules.hooks';
import { Settings, Zap, Star, CheckCircle, AlertCircle, Loader2, Save, Info } from 'lucide-react';

/**
 * Composant unifié pour la gestion des modules
 * UTILISE UNIQUEMENT ModulesContext - système unique et cohérent
 */
export function ModuleManagementSettings() {
  const { user } = useAuth();
  const {
    allModules: systemModules,
    isModuleActive,
    activateModule,
    deactivateModule,
    canActivateModule,
    currentPlan,
    isLoading: contextLoading
  } = useModules();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});

  // Calculer les statistiques des modules
  const moduleStats = useMemo(() => {
    const total = systemModules.length;
    const active = systemModules.filter(mod => isModuleActive(mod.key)).length;
    const inactive = total - active;
    const byType = systemModules.reduce((acc, m) => {
      const type = m.category || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, active, inactive, byType };
  }, [systemModules, isModuleActive]);

  const handleModuleToggle = (moduleKey: string) => {
    const currentState = isModuleActive(moduleKey);
    const newState = !currentState;

    setPendingChanges(prev => {
      const updated = { ...prev };

      // Si on toggle vers l'état actuel, supprimer du pending (annulation)
      if (prev.hasOwnProperty(moduleKey)) {
        // Il y avait déjà un changement pending, l'annuler
        delete updated[moduleKey];
      } else {
        // Nouveau changement
        updated[moduleKey] = newState;
      }

      return updated;
    });
  };

  const getEffectiveState = (moduleKey: string): boolean => {
    // Si on a un changement pending, utiliser ça, sinon l'état actuel
    return pendingChanges.hasOwnProperty(moduleKey)
      ? pendingChanges[moduleKey]
      : isModuleActive(moduleKey);
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;

  const handleSaveChanges = async () => {
    if (!user?.id || !hasChanges) return;

    setIsSaving(true);
    try {
      devLogger.info('🔧 Application des changements de modules:', pendingChanges);

      const changeEntries = Object.entries(pendingChanges);
      const results = await Promise.allSettled(
        changeEntries.map(async ([moduleKey, willBeActive]) => {
          try {
            // Vérifier si on peut activer le module avant de tenter
            if (willBeActive) {
              const canActivate = canActivateModule(moduleKey);
              if (!canActivate.canActivate) {
                return {
                  moduleKey,
                  success: false,
                  error: canActivate.reason || "Module non disponible dans votre plan actuel"
                };
              }
            }

            if (willBeActive) {
              await activateModule(moduleKey);
              devLogger.info(`✅ Module ${moduleKey} activé`);
            } else {
              await deactivateModule(moduleKey);
              devLogger.info(`✅ Module ${moduleKey} désactivé`);
            }
            return { moduleKey, success: true };
          } catch (error) {
            devLogger.error(`❌ Erreur module ${moduleKey}:`, error instanceof Error ? error.message : String(error));
            return { moduleKey, success: false, error };
          }
        })
      );

      // Analyser les résultats
      const successful = results.filter(result =>
        result.status === 'fulfilled' && result.value.success
      ).length;

      const failed = results.filter(result =>
        result.status === 'rejected' ||
        (result.status === 'fulfilled' && !result.value.success)
      ).length;

      // Feedback utilisateur
      if (successful > 0) {
        toast({
          title: 'Modules mis à jour',
          description: `${successful} module(s) modifié(s) avec succès${failed > 0 ? `, ${failed} échec(s)` : ''}`,
        });
      }

      if (failed > 0) {
        // Récupérer les détails des erreurs pour chaque module
        const failedModules = results
          .filter(result =>
            result.status === 'rejected' ||
            (result.status === 'fulfilled' && !result.value.success)
          )
          .map(result => {
            if (result.status === 'fulfilled') {
              const module = systemModules.find(m => m.key === result.value.moduleKey);
              const errorReason = result.value.error?.message || result.value.error || 'Erreur inconnue';
              return `${module?.name || result.value.moduleKey}: ${errorReason}`;
            }
            return 'Erreur inconnue';
          });

        toast({
          title: 'Modules non activables',
          description: failedModules.join('. '),
          variant: 'destructive'
        });
      }

      // Nettoyer les changements pending après application réussie
      const successfulKeys = results
        .filter(result => result.status === 'fulfilled' && result.value.success)
        .map(result => (result as any).value.moduleKey);

      setPendingChanges(prev => {
        const updated = { ...prev };
        successfulKeys.forEach(key => delete updated[key]);
        return updated;
      });

    } catch (error) {
      devLogger.error('❌ Erreur globale sauvegarde modules:', error instanceof Error ? error.message : String(error));
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les modifications',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setPendingChanges({});
    toast({
      title: 'Modifications annulées',
      description: 'Tous les changements non sauvegardés ont été annulés',
    });
  };

  const getModuleStatus = (moduleKey: string) => {
    const currentState = isModuleActive(moduleKey);
    const effectiveState = getEffectiveState(moduleKey);
    const hasPendingChange = pendingChanges.hasOwnProperty(moduleKey);

    return {
      currentState,
      effectiveState,
      hasPendingChange
    };
  };

  const getModuleIcon = (status: ReturnType<typeof getModuleStatus>) => {
    if (status.hasPendingChange) {
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
    if (status.effectiveState) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <Info className="h-4 w-4 text-gray-400" />;
  };

  if (contextLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerte système unifié */}
      {hasChanges && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <h4 className="font-semibold text-orange-800 dark:text-orange-200">
                  Changements non sauvegardés
                </h4>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {Object.keys(pendingChanges).length} module(s) modifié(s). Cliquez sur "Sauvegarder" pour appliquer les changements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques des modules */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">S</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{moduleStats.byType.starter || 0}</div>
                <div className="text-sm text-muted-foreground">Starter</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">P</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{moduleStats.byType.pro || 0}</div>
                <div className="text-sm text-muted-foreground">Pro</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">E</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{moduleStats.byType.enterprise || 0}</div>
                <div className="text-sm text-muted-foreground">Enterprise</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{moduleStats.active}</div>
                <div className="text-sm text-muted-foreground">Activés</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des modules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gestion des modules
            <Badge variant="secondary" className="text-xs">
              Système unifié
            </Badge>
          </CardTitle>
          <CardDescription>
            Activez ou désactivez les modules selon vos besoins.
            Un seul système, une seule source de vérité.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {systemModules
            .filter(mod => mod.key !== 'onboarding') // Masquer le module onboarding pour les utilisateurs existants
            .sort((a, b) => {
              const order = { starter: 1, pro: 2, enterprise: 3 };
              const aOrder = order[a.category as keyof typeof order] || 4;
              const bOrder = order[b.category as keyof typeof order] || 4;

              if (aOrder !== bOrder) {
                return aOrder - bOrder;
              }

              return a.name.localeCompare(b.name);
            })
            .map(mod => {
            const status = getModuleStatus(mod.key);
            const isCore = ['dashboard', 'settings', 'users', 'security'].includes(mod.key);

            return (
              <div
                key={mod.key}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  status.hasPendingChange
                    ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950'
                    : status.effectiveState
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                    : 'border-border bg-muted'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    {getModuleIcon(status)}
                    <Star className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`module-${mod.key}`} className="font-medium">
                        {mod.name}
                      </Label>
                      <Badge variant="secondary" className="text-xs">
                        {mod.category.charAt(0).toUpperCase() + mod.category.slice(1)}
                      </Badge>
                      {status.hasPendingChange && (
                        <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 dark:border-orange-600 dark:text-orange-400">
                          Modifié
                        </Badge>
                      )}
                      {isCore && (
                        <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-400">
                          Essentiel
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {mod.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {mod.category}
                      </Badge>
                      <span className={`text-xs px-2 py-1 rounded ${
                        status.effectiveState
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {status.effectiveState ? 'Activé' : 'Désactivé'}
                        {status.hasPendingChange && (
                          <span className="ml-1">
                            ({status.currentState ? 'sera désactivé' : 'sera activé'})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <Switch
                  id={`module-${mod.key}`}
                  checked={status.effectiveState}
                  onCheckedChange={() => handleModuleToggle(mod.key)}
                  disabled={isSaving || isCore}
                />
              </div>
            );
          })}
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button
            onClick={handleSaveChanges}
            disabled={isSaving || !hasChanges}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde en cours...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {hasChanges
                  ? `Sauvegarder (${Object.keys(pendingChanges).length} changement${Object.keys(pendingChanges).length > 1 ? 's' : ''})`
                  : 'Aucun changement'
                }
              </>
            )}
          </Button>
          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleDiscardChanges}
              disabled={isSaving}
            >
              Annuler
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Informations sur les plans d'abonnement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Plans d'abonnement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-xs text-white font-bold">S</span>
              </div>
              <div>
                <h4 className="font-medium">Plan Starter</h4>
                <p className="text-sm text-muted-foreground">
                  Modules essentiels pour débuter : comptabilité, facturation, banque et gestion des clients.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 bg-purple-500 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-xs text-white font-bold">P</span>
              </div>
              <div>
                <h4 className="font-medium">Plan Pro</h4>
                <p className="text-sm text-muted-foreground">
                  Fonctionnalités avancées : rapports, budget, RH et gestion fiscale pour entreprises en croissance.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-xs text-white font-bold">E</span>
              </div>
              <div>
                <h4 className="font-medium">Plan Enterprise</h4>
                <p className="text-sm text-muted-foreground">
                  Solution complète avec CRM, gestion de projets, inventaire et fonctionnalités sur mesure.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
