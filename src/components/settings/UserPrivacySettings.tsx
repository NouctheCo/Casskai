/**
 * CassKai - Composant Privacy & RGPD Settings
 *
 * Permet à l'utilisateur de :
 * - Exporter ses données (Article 15 & 20 RGPD)
 * - Gérer ses consentements
 * - Supprimer son compte (Article 17 RGPD)
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Download,
  Trash2,
  Shield,
  AlertTriangle,
  Clock,
  FileText,
  Eye,
  Users
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  useUserDataExport,
  useAccountDeletion
} from '@/services/rgpdService';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
export function UserPrivacySettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [deletionReason, setDeletionReason] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [consents, setConsents] = useState<any[]>([]);
  const [loadingConsents, setLoadingConsents] = useState(true);
  // Hooks RGPD
  const { exportData, loading: exportLoading, error: exportError, canExport, nextAllowedAt } = useUserDataExport();
  const {
    requestDeletion,
    checkStatus,
    cancelRequest,
    loading: deletionLoading,
    error: deletionError,
    deletionStatus
  } = useAccountDeletion();
  // Charger les consentements et le statut de suppression au montage
  useEffect(() => {
    if (user?.id) {
      loadConsents();
      checkStatus(user.id);
    }
  }, [user?.id]);
  const loadConsents = async () => {
    if (!user?.id) return;
    try {
      setLoadingConsents(true);
      const { data, error } = await supabase
        .from('rgpd_consents')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setConsents(data || []);
    } catch (error) {
      logger.error('UserPrivacySettings', 'Error loading consents:', error);
    } finally {
      setLoadingConsents(false);
    }
  };
  const handleExportData = async () => {
    if (!user?.id) return;
    try {
      const result = await exportData(user.id);
      if (result.success) {
        toast({
          title: '✅ Export réussi',
          description: 'Vos données ont été exportées et téléchargées avec succès.',
        });
      } else {
        toast({
          title: '❌ Erreur d\'export',
          description: result.error || 'Une erreur est survenue lors de l\'export.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '❌ Erreur d\'export',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'destructive'
      });
    }
  };
  const handleRequestDeletion = async () => {
    if (!user?.id) return;
    try {
      const result = await requestDeletion(user.id, deletionReason);
      if (result.success && 'deletion_request' in result && result.deletion_request) {
        toast({
          title: '🕒 Demande enregistrée',
          description: `Votre compte sera supprimé dans ${result.deletion_request.days_until_deletion} jours. Vous pouvez annuler cette demande à tout moment.`,
        });
        setShowDeleteConfirm(false);
        setDeletionReason('');
      } else {
        toast({
          title: '❌ Erreur',
          description: ('error' in result && result.error) || 'Impossible de créer la demande de suppression.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '❌ Erreur',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'destructive'
      });
    }
  };
  const handleCancelDeletion = async () => {
    if (!deletionStatus?.id) return;
    try {
      const result = await cancelRequest(deletionStatus.id);
      if (result.success) {
        toast({
          title: '✅ Demande annulée',
          description: 'Votre demande de suppression a été annulée. Votre compte reste actif.',
        });
      } else {
        toast({
          title: '❌ Erreur',
          description: result.error || 'Impossible d\'annuler la demande.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '❌ Erreur',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'destructive'
      });
    }
  };
  const handleUpdateConsent = async (consentId: string, consentType: string, newValue: boolean) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('rgpd_consents')
        .update({
          consent_given: newValue,
          updated_at: new Date().toISOString(),
          ...(newValue
            ? { granted_at: new Date().toISOString(), revoked_at: null }
            : { revoked_at: new Date().toISOString() }
          )
        })
        .eq('id', consentId);
      if (error) throw error;
      toast({
        title: '✅ Consentement mis à jour',
        description: `Votre préférence pour "${getConsentLabel(consentType)}" a été enregistrée.`,
      });
      // Recharger les consentements
      await loadConsents();
    } catch (_error) {
      toast({
        title: '❌ Erreur',
        description: 'Impossible de mettre à jour le consentement.',
        variant: 'destructive'
      });
    }
  };
  const getConsentLabel = (type: string): string => {
    const labels: Record<string, string> = {
      COOKIES_ESSENTIAL: 'Cookies essentiels',
      COOKIES_ANALYTICS: 'Cookies analytiques',
      COOKIES_MARKETING: 'Cookies marketing',
      DATA_PROCESSING: 'Traitement des données',
      EMAIL_MARKETING: 'Emails marketing',
      THIRD_PARTY_SHARING: 'Partage avec des tiers'
    };
    return labels[type] || type;
  };
  const getConsentDescription = (type: string): string => {
    const descriptions: Record<string, string> = {
      COOKIES_ESSENTIAL: 'Nécessaires au fonctionnement du site (obligatoires)',
      COOKIES_ANALYTICS: 'Nous aident à améliorer nos services',
      COOKIES_MARKETING: 'Personnalisent les publicités que vous voyez',
      DATA_PROCESSING: 'Permet l\'utilisation de vos données pour fournir le service',
      EMAIL_MARKETING: 'Recevoir nos actualités et offres promotionnelles',
      THIRD_PARTY_SHARING: 'Partager des données avec nos partenaires de confiance'
    };
    return descriptions[type] || 'Consentement RGPD';
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold">Confidentialité & RGPD</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez vos données personnelles et vos droits RGPD
          </p>
        </div>
      </div>
      {/* Demande de suppression en cours */}
      {deletionStatus && (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-900/20">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <AlertDescription>
            <div className="space-y-3">
              <div className="font-semibold text-orange-900 dark:text-orange-200">
                ⏳ Votre compte sera supprimé dans {deletionStatus.days_remaining} jour{deletionStatus.days_remaining > 1 ? 's' : ''}
              </div>
              <p className="text-sm text-orange-800 dark:text-orange-300">
                Suppression prévue le {formatDate(deletionStatus.scheduled_deletion_date)}
              </p>
              <Button
                onClick={handleCancelDeletion}
                variant="outline"
                size="sm"
                disabled={deletionLoading}
                className="bg-white dark:bg-gray-800"
              >
                Annuler la suppression
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      {/* Export de données */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Exporter mes données</span>
          </CardTitle>
          <CardDescription>
            Téléchargez une copie complète de toutes vos données personnelles (Articles 15 & 20 RGPD)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600 mt-1" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                L'export inclut :
              </p>
              <ul className="space-y-1 text-blue-800 dark:text-blue-300">
                <li>• Vos informations de profil</li>
                <li>• Vos entreprises et rôles</li>
                <li>• Vos factures et devis (2 dernières années)</li>
                <li>• Vos écritures comptables</li>
                <li>• Vos documents RH (métadonnées)</li>
                <li>• Votre historique d'activité</li>
                <li>• Vos consentements RGPD</li>
              </ul>
            </div>
          </div>
          {!canExport && nextAllowedAt && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Vous avez déjà effectué un export. Prochain export autorisé le{' '}
                {formatDate(nextAllowedAt)}
              </AlertDescription>
            </Alert>
          )}
          <Button
            onClick={handleExportData}
            disabled={exportLoading || !canExport}
            className="w-full"
          >
            {exportLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Exportation en cours...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Télécharger mes données (JSON)
              </>
            )}
          </Button>
          {exportError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{exportError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      {/* Gestion des consentements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Mes consentements</span>
          </CardTitle>
          <CardDescription>
            Gérez vos préférences de confidentialité et vos consentements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingConsents ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : consents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun consentement enregistré
            </div>
          ) : (
            <div className="space-y-4">
              {consents.map((consent) => (
                <div
                  key={consent.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{getConsentLabel(consent.consent_type)}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {getConsentDescription(consent.consent_type)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {consent.consent_given ? (
                        <span>✅ Accordé le {formatDate(consent.granted_at || consent.created_at)}</span>
                      ) : (
                        <span>❌ Révoqué {consent.revoked_at ? `le ${formatDate(consent.revoked_at)}` : ''}</span>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={consent.consent_given}
                    onCheckedChange={(checked) =>
                      handleUpdateConsent(consent.id, consent.consent_type, checked)
                    }
                    disabled={consent.consent_type === 'COOKIES_ESSENTIAL'} // Obligatoires
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Suppression de compte */}
      {!deletionStatus && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              <span>Supprimer mon compte</span>
            </CardTitle>
            <CardDescription>
              Suppression définitive de votre compte et de toutes vos données (Article 17 RGPD)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">⚠️ Cette action est irréversible après 30 jours</div>
                <ul className="text-sm space-y-1">
                  <li>• Période de grâce de 30 jours pour annuler</li>
                  <li>• Toutes vos données seront supprimées</li>
                  <li>• Les données comptables légales seront anonymisées (10 ans)</li>
                  <li>• Vous recevrez un email de confirmation</li>
                </ul>
              </AlertDescription>
            </Alert>
            {!showDeleteConfirm ? (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Demander la suppression de mon compte
              </Button>
            ) : (
              <div className="space-y-4 p-4 border-2 border-red-300 dark:border-red-800 rounded-lg">
                <div className="font-semibold text-red-900 dark:text-red-200">
                  Confirmez la suppression de votre compte
                </div>
                <div>
                  <Label htmlFor="reason">Raison de la suppression (optionnel)</Label>
                  <Textarea
                    id="reason"
                    value={deletionReason}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    placeholder="Pourquoi souhaitez-vous supprimer votre compte ?"
                    rows={3}
                    className="mt-2"
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleRequestDeletion}
                    variant="destructive"
                    disabled={deletionLoading}
                    className="flex-1"
                  >
                    {deletionLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Confirmer la suppression
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletionReason('');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
                {deletionError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{deletionError}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* Liens utiles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Documents légaux</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button variant="outline" asChild className="justify-start">
              <a href="/privacy-policy" target="_blank">
                <Shield className="w-4 h-4 mr-2" />
                Politique de confidentialité
              </a>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <a href="/cookies-policy" target="_blank">
                <FileText className="w-4 h-4 mr-2" />
                Politique des cookies
              </a>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <a href="/terms-of-service" target="_blank">
                <FileText className="w-4 h-4 mr-2" />
                Conditions d'utilisation
              </a>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <a href="/gdpr" target="_blank">
                <Users className="w-4 h-4 mr-2" />
                Page RGPD publique
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Contact DPO */}
      <div className="text-center py-4 text-sm text-gray-600 dark:text-gray-400">
        <p>Des questions sur vos données personnelles ?</p>
        <p className="mt-1">
          Contactez notre Délégué à la Protection des Données (DPO) :{' '}
          <a href="mailto:privacy@casskai.app" className="text-blue-600 hover:underline">
            privacy@casskai.app
          </a>
        </p>
      </div>
    </div>
  );
}