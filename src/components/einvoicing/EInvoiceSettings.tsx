/**
 * E-invoice Settings Component
 * Configuration and settings for e-invoicing module
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { 
  Settings, 
  Shield, 
  Archive, 
  FileText,
  CheckCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Download,
  Trash2
} from 'lucide-react';

interface EInvoiceSettingsProps {
  companyId: string;
  capabilities: {
    enabled: boolean;
    formats: string[];
    channels: string[];
    features: string[];
  } | null;
  isEnabled: boolean;
  onDisable: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const EInvoiceSettings: React.FC<EInvoiceSettingsProps> = ({
  companyId,
  capabilities,
  isEnabled,
  onDisable,
  onRefresh
}) => {
  const [isDisabling, setIsDisabling] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  const handleDisable = async () => {
    setIsDisabling(true);
    try {
      await onDisable();
      setShowDisableConfirm(false);
      await onRefresh();
    } catch (error) {
      console.error('Error disabling e-invoicing:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsDisabling(false);
    }
  };

  if (!capabilities) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Chargement des paramètres...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Module Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration du module
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Facturation électronique</h4>
              <p className="text-sm text-muted-foreground">
                Module de conformité EN 16931 avec transmission Chorus Pro
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={isEnabled ? "default" : "secondary"}
                className={isEnabled ? "bg-green-100 text-green-800" : ""}
              >
                {isEnabled ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Activé
                  </>
                ) : (
                  "Désactivé"
                )}
              </Badge>
            </div>
          </div>

          {isEnabled && (
            <div className="space-y-4">
              <Separator />
              
              {/* Capabilities */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h5 className="font-medium mb-2">Formats supportés</h5>
                  <div className="space-y-1">
                    {capabilities.formats.map((format) => (
                      <Badge key={format} variant="outline" className="mr-2">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-2">Canaux disponibles</h5>
                  <div className="space-y-1">
                    {capabilities.channels.map((channel) => (
                      <Badge key={channel} variant="outline" className="mr-2">
                        {channel === 'PPF' ? 'Chorus Pro' : channel}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-2">Fonctionnalités</h5>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      {capabilities.features.length} fonctionnalités actives
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Disable Module */}
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <h5 className="font-medium text-red-800">Désactiver le module</h5>
                  <p className="text-sm text-red-600">
                    Cette action désactivera complètement la facturation électronique.
                    Les documents existants resteront archivés.
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDisableConfirm(true)}
                  disabled={isDisabling}
                >
                  Désactiver
                </Button>
              </div>

              {showDisableConfirm && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p>
                        Êtes-vous sûr de vouloir désactiver la facturation électronique ?
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDisable}
                          disabled={isDisabling}
                        >
                          {isDisabling ? 'Désactivation...' : 'Confirmer'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDisableConfirm(false)}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Conformité et sécurité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-medium">EN 16931 Compliant</h5>
                <p className="text-sm text-muted-foreground">
                  Validation automatique selon la norme européenne
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-medium">Factur-X 1.0.7</h5>
                <p className="text-sm text-muted-foreground">
                  Format Franco-Allemand officiel
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Archive className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-medium">Archivage légal 10 ans</h5>
                <p className="text-sm text-muted-foreground">
                  Conservation sécurisée conforme à la réglementation
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-medium">Transmission sécurisée</h5>
                <p className="text-sm text-muted-foreground">
                  Chiffrement TLS et authentification certifiée
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-blue-800 mb-2">
              Obligation légale française
            </h5>
            <p className="text-sm text-blue-700 mb-3">
              La facturation électronique devient obligatoire pour toutes les entreprises 
              françaises de manière progressive entre 2024 et 2026.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://www.economie.gouv.fr/entreprises/facturation-electronique-obligatoire"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                En savoir plus
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      {isEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Gestion des données
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start">
                <Download className="h-4 w-4 mr-2" />
                Exporter tous les documents
              </Button>
              <Button variant="outline" className="justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Générer un rapport d'audit
              </Button>
            </div>

            <Separator />

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Conservation des données</p>
                  <p className="text-sm">
                    Tous les documents électroniques sont conservés de manière sécurisée 
                    pendant 10 ans conformément à la réglementation française. Les données 
                    ne peuvent pas être supprimées avant cette échéance.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Support and Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Support et documentation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="font-medium">Ressources utiles</h5>
              <div className="space-y-1 text-sm">
                <a 
                  href="#" 
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" />
                  Guide d'utilisation
                </a>
                <a 
                  href="#" 
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Documentation API
                </a>
                <a 
                  href="#" 
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Shield className="h-3 w-3" />
                  Conformité EN 16931
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-medium">Assistance technique</h5>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  Email: support@casskai.com
                </p>
                <p className="text-muted-foreground">
                  Téléphone: +33 1 XX XX XX XX
                </p>
                <p className="text-muted-foreground">
                  Horaires: 9h-18h, lundi-vendredi
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};