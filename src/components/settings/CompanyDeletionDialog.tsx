import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, Users, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { companyDeletionService } from '@/services/companyDeletionService';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
interface CompanyDeletionDialogProps {
  companyId: string;
  companyName: string;
  onCancel: () => void;
}
export function CompanyDeletionDialog({
  companyId,
  companyName,
  onCancel
}: CompanyDeletionDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState<'confirm' | 'reason' | 'processing'>('confirm');
  const [isLoading, setIsLoading] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [otherOwners, setOtherOwners] = useState<any[]>([]);
  const [requiresApproval, setRequiresApproval] = useState(false);
  // Charger les autres propriétaires
  useEffect(() => {
    loadOtherOwners();
  }, [companyId]);
  const loadOtherOwners = async () => {
    try {
      const { data, error } = await supabase
        .from('user_companies')
        .select(`
          user_id,
          role,
          auth_users:user_id (email)
        `)
        .eq('company_id', companyId)
        .eq('role', 'owner')
        .eq('is_active', true)
        .neq('user_id', user?.id);
      if (error) throw error;
      const owners = data || [];
      setOtherOwners(owners);
      setRequiresApproval(owners.length > 0);
    } catch (error) {
      logger.error('CompanyDeletionDialog', 'Erreur chargement propriétaires:', error);
    }
  };
  const handleRequestDeletion = async () => {
    setIsLoading(true);
    setStep('processing');
    try {
      const result = await companyDeletionService.requestCompanyDeletion(
        companyId,
        deletionReason || undefined,
        true // export FEC par défaut
      );
      if (result.success) {
        if (requiresApproval) {
          toast({
            title: '✅ Demande créée',
            description: `Demande de suppression en attente d'approbation de ${otherOwners.length} propriétaire(s)`,
          });
        } else {
          toast({
            title: '✅ Demande créée',
            description: 'Vous êtes le seul propriétaire. Suppression prévue dans 30 jours.',
          });
        }
        onCancel();
      } else {
        toast({
          title: '❌ Erreur',
          description: result.error || 'Impossible de créer la demande',
          variant: 'destructive'
        });
        setStep('reason');
      }
    } catch (error) {
      toast({
        title: '❌ Erreur',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'destructive'
      });
      setStep('reason');
    } finally {
      setIsLoading(false);
    }
  };
  if (step === 'processing') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-orange-600">Création en cours...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Création de la demande de suppression...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (step === 'reason') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Supprimer "{companyName}"</CardTitle>
            <CardDescription>
              Entreprise: {companyName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {requiresApproval && (
              <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                <Users className="h-4 w-4 text-orange-600" />
                <AlertDescription>
                  <div className="text-sm">
                    <strong>Consensus requis:</strong> {otherOwners.length} propriétaire(s) doit/doivent approuver
                  </div>
                  <div className="text-xs text-orange-700 dark:text-orange-300 mt-2">
                    {otherOwners.map((o) => (
                      <div key={o.user_id}>
                        • {o.auth_users?.email}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">⚠️ Conséquences:</div>
                <ul className="text-sm space-y-1">
                  <li>• Période de grâce: 30 jours (annulable)</li>
                  <li>• Export FEC automatique (spécifications DGFiP) avant suppression</li>
                  <li>• Tous les utilisateurs perdront accès</li>
                  <li>• Données comptables: anonymisation légale</li>
                </ul>
              </AlertDescription>
            </Alert>
            <div>
              <Label htmlFor="reason">Raison de la suppression (optionnel)</Label>
              <Textarea
                id="reason"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="Pourquoi souhaitez-vous supprimer cette entreprise ?"
                rows={3}
                className="mt-2"
              />
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={handleRequestDeletion}
                variant="destructive"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Création...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Confirmer la suppression
                  </>
                )}
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                disabled={isLoading}
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-red-600">Supprimer l'entreprise?</CardTitle>
          <CardDescription>
            Êtes-vous sûr de vouloir demander la suppression de "{companyName}"?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <Clock className="h-4 w-4 mt-0.5 text-orange-600" />
              <div>
                <strong>Période de grâce:</strong> 30 jours
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Vous pouvez annuler à tout moment
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <FileText className="h-4 w-4 mt-0.5 text-blue-600" />
              <div>
                <strong>Export FEC:</strong> Avant suppression
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Conforme aux spécifications DGFiP (validation recommandée via Test Compta Demat)
                </div>
              </div>
            </div>
            {requiresApproval && (
              <div className="flex items-start space-x-2">
                <Users className="h-4 w-4 mt-0.5 text-purple-600" />
                <div>
                  <strong>Approbation:</strong> {otherOwners.length} propriétaire(s)
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Consensus requis
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => setStep('reason')}
              variant="destructive"
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Continuer
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}