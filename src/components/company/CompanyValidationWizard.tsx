import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CheckCircle, Building,
  Shield, Merge, Eye, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { logger } from '@/lib/logger';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  dataGovernanceService,
  type CompanySearchResult
} from '@/services/dataGovernanceService';
interface CompanyFormData {
  name: string;
  siret: string;
  postal_code: string;
  city: string;
}
interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  duplicates: CompanySearchResult[];
  qualityScore: number;
}
interface CompanyValidationWizardProps {
  isOpen: boolean;
  initialData?: Partial<CompanyFormData>;
  onComplete: (data: CompanyFormData) => void;
  onCancel: () => void;
}
export const CompanyValidationWizard: React.FC<CompanyValidationWizardProps> = ({
  isOpen,
  initialData = {},
  onComplete,
  onCancel
}) => {
  useBodyScrollLock(isOpen);
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    siret: '',
    postal_code: '',
    city: '',
    ...initialData
  });
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: false,
    warnings: [],
    duplicates: [],
    qualityScore: 0
  });
  const [isValidating, setIsValidating] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [selectedMergeTarget, setSelectedMergeTarget] = useState<string | null>(null);
  // Validation en temps réel avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.name.trim()) {
        validateCompanyData();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData]);
  const validateCompanyData = async () => {
    if (!formData.name.trim()) return;
    setIsValidating(true);
    try {
      const result = await dataGovernanceService.validateCompanyData(formData);
      setValidation(result);
      setHasValidated(true);
    } catch (error) {
      logger.error('CompanyValidationWizard', '❌ Erreur validation:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsValidating(false);
    }
  };
  const handleFieldChange = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasValidated(false);
  };
  const handleSubmit = () => {
    if (validation.isValid) {
      onComplete(formData);
    }
  };
  const handleMergeWithExisting = async (targetCompanyId: string) => {
    // En production, implémenter la logique de fusion
    logger.debug('CompanyValidationWizard', 'Fusion avec:', targetCompanyId);
    onCancel(); // Pour l'instant, fermer le wizard
  };
  // Score de qualité avec couleur
  const qualityColor = useMemo(() => {
    if (validation.qualityScore >= 80) return 'text-green-600';
    if (validation.qualityScore >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }, [validation.qualityScore]);
  const _qualityProgressColor = useMemo(() => {
    if (validation.qualityScore >= 80) return 'bg-green-500';
    if (validation.qualityScore >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  }, [validation.qualityScore]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto p-6">
          {/* En-tête */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Building className="h-6 w-6" />
                Validation d'entreprise
              </h2>
              <p className="text-muted-foreground">
                Système de déduplication et validation intelligente
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulaire */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de l'entreprise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l'entreprise *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="Ma Société SARL"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siret">SIRET</Label>
                  <Input
                    id="siret"
                    value={formData.siret}
                    onChange={(e) => handleFieldChange('siret', e.target.value)}
                    placeholder="123 456 789 01234"
                    maxLength={14}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Code postal</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => handleFieldChange('postal_code', e.target.value)}
                      placeholder="75001"
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleFieldChange('city', e.target.value)}
                      placeholder="Paris"
                    />
                  </div>
                </div>
                {/* Score de qualité */}
                {hasValidated && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-gray-50 rounded-lg dark:bg-gray-900/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Score de qualité</span>
                      <span className={`font-bold ${qualityColor}`}>
                        {validation.qualityScore}%
                      </span>
                    </div>
                    <Progress
                      value={validation.qualityScore}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Basé sur la complétude et la validité des informations
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
            {/* Résultats de validation */}
            <div className="space-y-4">
              {/* Status de validation */}
              {isValidating && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      <span className="text-sm">Validation en cours...</span>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Warnings */}
              {hasValidated && validation.warnings.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Avertissements
                    </h3>
                    <div className="space-y-2">
                      {validation.warnings.map((warning, index) => (
                        <Alert key={index}>
                          <AlertDescription className="text-sm">
                            {warning}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Doublons détectés */}
              {hasValidated && validation.duplicates.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Entreprises similaires détectées ({validation.duplicates.length})
                    </h3>
                    <div className="space-y-3">
                      {validation.duplicates.map((duplicate) => (
                        <motion.div
                          key={duplicate.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="border rounded-lg p-3 bg-red-50 dark:bg-red-900/20"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{duplicate.name}</h4>
                            <Badge variant="secondary">
                              {duplicate.similarity_score.toFixed(1)}% similaire
                            </Badge>
                          </div>
                          {duplicate.legal_name && (
                            <p className="text-sm text-muted-foreground mb-1">
                              {duplicate.legal_name}
                            </p>
                          )}
                          {duplicate.siret && (
                            <p className="text-sm text-muted-foreground mb-2">
                              SIRET: {duplicate.siret}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedMergeTarget(duplicate.id)}
                              className="flex-1"
                            >
                              <Merge className="h-4 w-4 mr-2" />
                              Fusionner
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-1"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ignorer
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <Alert className="mt-4">
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Recommandation:</strong> Vérifiez si votre entreprise
                        existe déjà pour éviter les doublons dans le système.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}
              {/* Validation OK */}
              {hasValidated && validation.isValid && validation.duplicates.length === 0 && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <h3 className="font-medium text-green-900">
                          Validation réussie
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-400">
                          Aucun doublon détecté. L'entreprise peut être créée.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
        {/* Actions */}
        <div className="shrink-0 flex justify-end gap-3 p-6 border-t">
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!hasValidated || !validation.isValid || validation.duplicates.length > 0}
              className="min-w-32"
            >
              {validation.duplicates.length > 0 ? (
                'Résoudre les doublons'
              ) : validation.isValid ? (
                'Créer l\'entreprise'
              ) : (
                'Corriger les erreurs'
              )}
            </Button>
          </div>
        {/* Dialog de fusion */}
        <AnimatePresence>
          {selectedMergeTarget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4"
              >
                <h3 className="font-bold mb-4">Confirmer la fusion</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Voulez-vous fusionner cette nouvelle entreprise avec l'existante ?
                  Cette action est irréversible.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedMergeTarget(null)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={() => handleMergeWithExisting(selectedMergeTarget)}
                    className="flex-1"
                  >
                    Confirmer la fusion
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};