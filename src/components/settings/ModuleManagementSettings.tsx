import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useModules } from '@/hooks/modules.hooks';
import { Settings, Zap, Star, CheckCircle, AlertCircle, Loader2, Save, Info } from 'lucide-react';

export function ModuleManagementSettings() {
  const { user } = useAuth();
  const { allModules: systemModules, activeModules: _activeModules, isModuleActive, updateModuleConfig, isLoading: contextLoading } = useModules();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [moduleStates, setModuleStates] = useState<Record<string, boolean>>({});

  // Initialiser les états des modules
  useEffect(() => {
    if (systemModules && !contextLoading) {
      const initialStates: Record<string, boolean> = {};
      systemModules.forEach(mod => {
        initialStates[mod.key] = isModuleActive(mod.key);
      });
      setModuleStates(initialStates);
    }
  }, [systemModules, isModuleActive, contextLoading]);

  // Calculer les statistiques des modules
  const moduleStats = useMemo(() => {
    const total = systemModules.length;
    const active = Object.values(moduleStates).filter(Boolean).length;
    const inactive = total - active;
    const premium = systemModules.filter(m => m.isPremium).length;

    return { total, active, inactive, premium };
  }, [systemModules, moduleStates]);

  const handleModuleToggle = (moduleKey: string) => {
    setModuleStates(prev => ({
      ...prev,
      [moduleKey]: !prev[moduleKey]
    }));
  };

  const handleSaveChanges = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const promises = [];
      for (const mod of systemModules) {
        const currentState = isModuleActive(mod.key);
        const newState = moduleStates[mod.key];

        if (currentState !== newState) {
          if (newState) {
            promises.push(updateModuleConfig(mod.key, { enabled: true }));
          } else {
            promises.push(updateModuleConfig(mod.key, { enabled: false }));
          }
        }
      }

      await Promise.all(promises);

      toast({
        title: 'Modules mis à jour',
        description: `${promises.length} module(s) modifié(s) avec succès`,
      });
    } catch (error) {
      console.error('Erreur sauvegarde modules:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les modifications',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getModuleStatus = (moduleKey: string) => {
    const isActive = moduleStates[moduleKey];
    const wasActive = isModuleActive(moduleKey);
    const hasChanged = isActive !== wasActive;

    return { isActive, wasActive, hasChanged };
  };

  const getModuleIcon = (status: { isActive: boolean; hasChanged: boolean }) => {
    if (status.hasChanged) {
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
    if (status.isActive) {
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
      {/* Statistiques des modules */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{moduleStats.total}</div>
                <div className="text-sm text-muted-foreground">Modules totaux</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{moduleStats.active}</div>
                <div className="text-sm text-muted-foreground">Activés</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-2xl font-bold">{moduleStats.inactive}</div>
                <div className="text-sm text-muted-foreground">Désactivés</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{moduleStats.premium}</div>
                <div className="text-sm text-muted-foreground">Premium</div>
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
          </CardTitle>
          <CardDescription>
            Activez ou désactivez les modules selon vos besoins. Les modifications seront appliquées après sauvegarde.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {systemModules.map(mod => {
            const status = getModuleStatus(mod.key);
            const isPremium = mod.isPremium;

            return (
              <div
                key={mod.key}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  status.hasChanged
                    ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950'
                    : status.isActive
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                    : 'border-border bg-muted'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    {getModuleIcon(status)}
                    {isPremium && <Star className="h-4 w-4 text-purple-500 dark:text-purple-400" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`module-${mod.key}`} className="font-medium">
                        {mod.name}
                      </Label>
                      {isPremium && (
                        <Badge variant="secondary" className="text-xs">
                          Premium
                        </Badge>
                      )}
                      {status.hasChanged && (
                        <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 dark:border-orange-600 dark:text-orange-400">
                          Modifié
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
                        status.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {status.isActive ? 'Activé' : 'Désactivé'}
                      </span>
                    </div>
                  </div>
                </div>

                <Switch
                  id={`module-${mod.key}`}
                  checked={moduleStates[mod.key] || false}
                  onCheckedChange={() => handleModuleToggle(mod.key)}
                  disabled={isSaving}
                />
              </div>
            );
          })}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveChanges} disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde en cours...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder les modifications
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Informations sur les modules premium */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Modules Premium
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
              <div>
                <h4 className="font-medium">Fonctionnalités avancées</h4>
                <p className="text-sm text-muted-foreground">
                  Les modules premium offrent des fonctionnalités avancées pour optimiser votre gestion d'entreprise.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h4 className="font-medium">Support prioritaire</h4>
                <p className="text-sm text-muted-foreground">
                  Bénéficiez d'un support technique prioritaire et d'assistance personnalisée.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium">Personnalisation</h4>
                <p className="text-sm text-muted-foreground">
                  Adaptez les modules à vos processus métier spécifiques.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
