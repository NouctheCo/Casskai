import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/utils/logger';
import {
  AlertTriangle, Shield, Download, Users, Building, Calendar,
  CheckCircle, XCircle, ArrowRight, ArrowLeft, Heart, Star,
  Clock, FileText, Archive, Trash2, UserX, Mail
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

import { accountDeletionService } from '@/services/accountDeletionService';

interface DeletionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

type WizardStep = 'welcome' | 'analysis' | 'impact' | 'transfer' | 'export' | 'confirmation' | 'processing' | 'farewell';

export const AccountDeletionWizard: React.FC<DeletionWizardProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [analysis, setAnalysis] = useState<any>(null);
  const [transferPlans, setTransferPlans] = useState<any[]>([]);
  const [exportRequested, setExportRequested] = useState(true);
  const [deletionReason, setDeletionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && currentStep === 'analysis') {
      performAnalysis();
    }
  }, [isOpen, currentStep]);

  const performAnalysis = async () => {
    try {
      const result = await accountDeletionService.analyzeAccountDeletion();
      setAnalysis(result);

      if (result.requiresOwnershipTransfer) {
        setCurrentStep('impact');
      } else {
        setCurrentStep('export');
      }
    } catch (error) {
      logger.error('Erreur analyse:', error)
    }
  };

  const handleNext = () => {
    const stepOrder: WizardStep[] = ['welcome', 'analysis', 'impact', 'transfer', 'export', 'confirmation', 'processing', 'farewell'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepOrder: WizardStep[] = ['welcome', 'analysis', 'impact', 'transfer', 'export', 'confirmation', 'processing', 'farewell'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const processDeletion = async () => {
    setProcessing(true);
    setCurrentStep('processing');

    try {
      const result = await accountDeletionService.requestAccountDeletion({
        reason: deletionReason,
        exportRequested,
        transferPlans
      });

      if (result.success) {
        setCurrentStep('farewell');
      }
    } catch (error) {
      logger.error('Erreur suppression:', error)
    } finally {
      setProcessing(false);
    }
  };

  const renderWelcomeStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <div className="mb-6">
        <UserX className="h-20 w-20 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Suppression de compte
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Nous sommes désolés de vous voir partir. Ce processus vous guidera de manière sécurisée
          dans la suppression de votre compte CassKai.
        </p>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-left">
              <h3 className="font-medium text-blue-900">Suppression sécurisée</h3>
              <p className="text-sm text-blue-700">
                • Période de grâce de 30 jours<br/>
                • Export automatique de vos données<br/>
                • Transfert de propriété assisté<br/>
                • Archivage légal conforme
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button onClick={handleNext} size="lg" className="w-full">
          <ArrowRight className="h-4 w-4 ml-2" />
          Commencer l'analyse
        </Button>
        <Button onClick={onClose} variant="outline" size="lg" className="w-full">
          Annuler
        </Button>
      </div>
    </motion.div>
  );

  const renderAnalysisStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <div>
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Analyse de votre compte
        </h2>
        <p className="text-gray-600">
          Nous analysons l'impact de la suppression sur vos entreprises...
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="flex flex-col items-center">
          <Building className="h-8 w-8 text-gray-400 mb-2" />
          <span>Entreprises</span>
        </div>
        <div className="flex flex-col items-center">
          <Users className="h-8 w-8 text-gray-400 mb-2" />
          <span>Équipes</span>
        </div>
        <div className="flex flex-col items-center">
          <Archive className="h-8 w-8 text-gray-400 mb-2" />
          <span>Données</span>
        </div>
      </div>
    </motion.div>
  );

  const renderImpactStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Impact sur vos entreprises
        </h2>
        <p className="text-gray-600">
          Votre suppression affectera {analysis?.companiesAsSoleOwner?.length || 0} entreprise(s)
        </p>
      </div>

      {analysis?.companiesAsSoleOwner?.map((company: any, index: number) => (
        <Card key={index} className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-amber-900">{company.company_name}</h3>
                <p className="text-sm text-amber-700">
                  Vous êtes le seul propriétaire
                </p>
              </div>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                Transfert requis
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex space-x-3">
        <Button onClick={handleBack} variant="outline" className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Button onClick={handleNext} className="flex-1">
          Gérer les transferts
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );

  const renderExportStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <Download className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Export de vos données
        </h2>
        <p className="text-gray-600">
          Récupérez vos données avant la suppression
        </p>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Export FEC inclus</h3>
              <p className="text-sm text-blue-700">
                • Fichier des Écritures Comptables conforme DGFiP<br/>
                • Toutes vos données comptables<br/>
                • Documents justificatifs<br/>
                • Archive légale complète
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center space-x-3">
        <Checkbox
          id="export-requested"
          checked={exportRequested}
          onCheckedChange={(checked) => setExportRequested(!!checked)}
        />
        <label htmlFor="export-requested" className="text-sm font-medium">
          Je souhaite récupérer mes données (recommandé)
        </label>
      </div>

      <div className="flex space-x-3">
        <Button onClick={handleBack} variant="outline" className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Button onClick={handleNext} className="flex-1">
          Continuer
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );

  const renderConfirmationStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Confirmation finale
        </h2>
        <p className="text-gray-600">
          Cette action sera effective dans 30 jours
        </p>
      </div>

      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <h3 className="font-medium text-red-900 mb-2">Récapitulatif :</h3>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• Suppression programmée le {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</li>
            <li>• {transferPlans.length} transfert(s) de propriété</li>
            <li>• Export des données : {exportRequested ? 'Oui' : 'Non'}</li>
            <li>• Période d'annulation : 30 jours</li>
          </ul>
        </CardContent>
      </Card>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Motif de suppression (optionnel)
        </label>
        <Textarea
          placeholder="Dites-nous pourquoi vous partez (cela nous aide à améliorer CassKai)"
          value={deletionReason}
          onChange={(e) => setDeletionReason(e.target.value)}
          className="min-h-20"
        />
      </div>

      <div className="flex space-x-3">
        <Button onClick={handleBack} variant="outline" className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Button
          onClick={processDeletion}
          variant="destructive"
          className="flex-1"
          disabled={processing}
        >
          {processing ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Confirmer la suppression
        </Button>
      </div>
    </motion.div>
  );

  const renderTransferStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <Users className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Transfert de propriété
        </h2>
        <p className="text-gray-600">
          Choisissez les nouveaux propriétaires pour vos entreprises
        </p>
      </div>

      <div className="space-y-4">
        {analysis?.companiesAsSoleOwner?.map((company: any, index: number) => (
          <Card key={index} className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                {company.company_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Nouveau propriétaire
                </label>
                <Select
                  value={transferPlans.find(t => t.company_id === company.company_id)?.new_owner_id || ''}
                  onValueChange={(value) => {
                    const updatedPlans = [...transferPlans];
                    const existingIndex = updatedPlans.findIndex(t => t.company_id === company.company_id);

                    if (existingIndex >= 0) {
                      updatedPlans[existingIndex].new_owner_id = value;
                      updatedPlans[existingIndex].new_owner_email = 'admin@company.com'; // Remplacer par vraie logique
                    } else {
                      updatedPlans.push({
                        company_id: company.company_id,
                        company_name: company.company_name,
                        new_owner_id: value,
                        new_owner_email: 'admin@company.com'
                      });
                    }

                    setTransferPlans(updatedPlans);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un administrateur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin1">Marie Dupont - Admin principal</SelectItem>
                    <SelectItem value="admin2">Pierre Martin - Admin comptable</SelectItem>
                  </SelectContent>
                </Select>

                <p className="text-xs text-gray-500">
                  Seuls les administrateurs actifs peuvent recevoir la propriété
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900">Important</h3>
              <p className="text-sm text-amber-700">
                Les nouveaux propriétaires recevront un email de notification et
                auront accès complet à l'entreprise. Cette action est irréversible.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex space-x-3">
        <Button onClick={handleBack} variant="outline" className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Button
          onClick={handleNext}
          className="flex-1"
          disabled={analysis?.companiesAsSoleOwner?.length > 0 && transferPlans.length === 0}
        >
          Continuer
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );

  const renderProcessingStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <div>
        <div className="relative">
          <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <CheckCircle className="absolute inset-0 h-8 w-8 text-blue-500 m-auto opacity-20" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Traitement en cours...
        </h2>
        <p className="text-gray-600">
          Nous préparons votre suppression de compte
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm">Analyse terminée</span>
        </div>

        {transferPlans.length > 0 && (
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">Transferts de propriété effectués</span>
          </div>
        )}

        {exportRequested && (
          <div className="flex items-center justify-center space-x-2 text-blue-600">
            <Clock className="h-5 w-5" />
            <span className="text-sm">Génération des exports...</span>
          </div>
        )}

        <div className="flex items-center justify-center space-x-2 text-blue-600">
          <Clock className="h-5 w-5" />
          <span className="text-sm">Programmation de la suppression...</span>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Cette opération peut prendre quelques minutes
      </div>
    </motion.div>
  );

  const renderFarewellStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <div className="space-y-4">
        <Heart className="h-20 w-20 text-red-400 mx-auto" />

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Au revoir et merci ! 👋
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Votre demande de suppression a été enregistrée. Nous espérons vous revoir un jour sur CassKai.
          </p>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>Suppression le : {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <span>Confirmation par email</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span>Annulation possible</span>
            </div>
            <div className="flex items-center space-x-2">
              <Download className="h-4 w-4 text-blue-600" />
              <span>Export en préparation</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Star className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="text-left">
            <h3 className="font-medium text-amber-900">Vous changez d'avis ?</h3>
            <p className="text-sm text-amber-700">
              Vous avez 30 jours pour annuler cette demande. Connectez-vous simplement
              à votre compte et annulez depuis vos paramètres.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button onClick={() => { onComplete?.(); onClose(); }} size="lg" className="w-full">
          <CheckCircle className="h-4 w-4 mr-2" />
          Terminé
        </Button>

        <div className="text-xs text-gray-500">
          Merci d'avoir fait confiance à CassKai pour votre comptabilité ❤️
        </div>
      </div>
    </motion.div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Progress bar */}
          {currentStep !== 'farewell' && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Étape {['welcome', 'analysis', 'impact', 'transfer', 'export', 'confirmation', 'processing'].indexOf(currentStep) + 1} sur 7</span>
                <span>{Math.round(((['welcome', 'analysis', 'impact', 'transfer', 'export', 'confirmation', 'processing'].indexOf(currentStep) + 1) / 7) * 100)}%</span>
              </div>
              <Progress
                value={((['welcome', 'analysis', 'impact', 'transfer', 'export', 'confirmation', 'processing'].indexOf(currentStep) + 1) / 7) * 100}
                className="h-2"
              />
            </div>
          )}

          <AnimatePresence mode="wait">
            {currentStep === 'welcome' && renderWelcomeStep()}
            {currentStep === 'analysis' && renderAnalysisStep()}
            {currentStep === 'impact' && renderImpactStep()}
            {currentStep === 'transfer' && renderTransferStep()}
            {currentStep === 'export' && renderExportStep()}
            {currentStep === 'confirmation' && renderConfirmationStep()}
            {currentStep === 'processing' && renderProcessingStep()}
            {currentStep === 'farewell' && renderFarewellStep()}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};