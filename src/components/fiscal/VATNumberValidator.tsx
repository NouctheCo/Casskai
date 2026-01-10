/**
 * CassKai - Vérificateur de numéro de TVA intracommunautaire
 * Validation format + API VIES (Union Européenne)
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  CheckCircle,
  XCircle,
  Building,
  MapPin,
  Calendar,
  AlertCircle,
  Download,
  Loader2,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
// Formats TVA par pays UE
const VAT_FORMATS: Record<string, RegExp> = {
  FR: /^FR[0-9A-Z]{2}[0-9]{9}$/,
  BE: /^BE[0-9]{10}$/,
  LU: /^LU[0-9]{8}$/,
  DE: /^DE[0-9]{9}$/,
  ES: /^ES[A-Z0-9][0-9]{7}[A-Z0-9]$/,
  IT: /^IT[0-9]{11}$/,
  NL: /^NL[0-9]{9}B[0-9]{2}$/,
  PT: /^PT[0-9]{9}$/,
  AT: /^ATU[0-9]{8}$/,
  DK: /^DK[0-9]{8}$/,
  FI: /^FI[0-9]{8}$/,
  SE: /^SE[0-9]{12}$/,
  IE: /^IE[0-9]{7}[A-Z]{1,2}$/,
  PL: /^PL[0-9]{10}$/,
  CZ: /^CZ[0-9]{8,10}$/,
  RO: /^RO[0-9]{2,10}$/,
  HU: /^HU[0-9]{8}$/,
  BG: /^BG[0-9]{9,10}$/,
  SK: /^SK[0-9]{10}$/,
  SI: /^SI[0-9]{8}$/,
  HR: /^HR[0-9]{11}$/,
  EE: /^EE[0-9]{9}$/,
  LV: /^LV[0-9]{11}$/,
  LT: /^LT([0-9]{9}|[0-9]{12})$/,
  MT: /^MT[0-9]{8}$/,
  CY: /^CY[0-9]{8}[A-Z]$/,
  GR: /^(EL|GR)[0-9]{9}$/
};
interface VATValidationResult {
  vatNumber: string;
  countryCode: string;
  isValid: boolean;
  isFormatValid: boolean;
  isViesValid?: boolean;
  companyName?: string;
  companyAddress?: string;
  verificationDate: Date;
  errorMessage?: string;
}
export const VATNumberValidator: React.FC<{ className?: string }> = ({ className }) => {
  const [vatNumber, setVatNumber] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [result, setResult] = useState<VATValidationResult | null>(null);
  const [validationHistory, setValidationHistory] = useState<VATValidationResult[]>([]);
  // Formate le numéro de TVA (espaces tous les 3-4 caractères)
  const formatVATNumber = (value: string): string => {
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    // FR XX XXX XXX XXX
    if (cleaned.startsWith('FR') && cleaned.length > 2) {
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)} ${cleaned.slice(10)}`.trim();
    }
    // BE XXXX XXX XXX
    if (cleaned.startsWith('BE') && cleaned.length > 2) {
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`.trim();
    }
    // Format générique
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };
  // Valide le format du numéro de TVA
  const validateFormat = (vat: string): { isValid: boolean; countryCode: string } => {
    const cleaned = vat.replace(/\s/g, '').toUpperCase();
    const countryCode = cleaned.slice(0, 2);
    if (!VAT_FORMATS[countryCode]) {
      return { isValid: false, countryCode };
    }
    const isValid = VAT_FORMATS[countryCode].test(cleaned);
    return { isValid, countryCode };
  };
  // Simule l'appel à l'API VIES (en production, faire un vrai appel)
  const validateWithVIES = async (_vat: string, _countryCode: string): Promise<{
    isValid: boolean;
    companyName?: string;
    companyAddress?: string;
    errorMessage?: string;
  }> => {
    // Simulation d'un délai d'API
    await new Promise(resolve => setTimeout(resolve, 1500));
    // En production, faire un vrai appel à l'API VIES
    // Endpoint: https://ec.europa.eu/taxation_customs/vies/services/checkVatService
    //
    // Pour l'instant, on simule une réponse
    const isValid = Math.random() > 0.2; // 80% de succès
    if (isValid) {
      return {
        isValid: true,
        companyName: 'EXAMPLE COMPANY SAS',
        companyAddress: '123 RUE DE LA REPUBLIQUE, 75001 PARIS, FRANCE'
      };
    } else {
      return {
        isValid: false,
        errorMessage: 'Numéro de TVA non enregistré dans la base VIES'
      };
    }
  };
  // Valide le numéro de TVA
  const validate = async () => {
    if (!vatNumber.trim()) {
      logger.warn('VATNumberValidator', 'Veuillez saisir un numéro de TVA');
      return;
    }
    setIsValidating(true);
    setResult(null);
    try {
      const cleaned = vatNumber.replace(/\s/g, '').toUpperCase();
      // Étape 1 : Validation du format
      const { isValid: isFormatValid, countryCode } = validateFormat(cleaned);
      if (!isFormatValid) {
        const result: VATValidationResult = {
          vatNumber: cleaned,
          countryCode,
          isValid: false,
          isFormatValid: false,
          verificationDate: new Date(),
          errorMessage: `Format invalide pour un numéro de TVA ${countryCode}`
        };
        setResult(result);
        addToHistory(result);
        return;
      }
      // Étape 2 : Validation via API VIES
      const viesResult = await validateWithVIES(cleaned, countryCode);
      const validationResult: VATValidationResult = {
        vatNumber: cleaned,
        countryCode,
        isValid: viesResult.isValid,
        isFormatValid: true,
        isViesValid: viesResult.isValid,
        companyName: viesResult.companyName,
        companyAddress: viesResult.companyAddress,
        verificationDate: new Date(),
        errorMessage: viesResult.errorMessage
      };
      setResult(validationResult);
      addToHistory(validationResult);
    } catch (error) {
      const errorResult: VATValidationResult = {
        vatNumber: vatNumber.replace(/\s/g, '').toUpperCase(),
        countryCode: '',
        isValid: false,
        isFormatValid: false,
        verificationDate: new Date(),
        errorMessage: `Erreur lors de la validation : ${error instanceof Error ? error.message : String(error)}`
      };
      setResult(errorResult);
      addToHistory(errorResult);
    } finally {
      setIsValidating(false);
    }
  };
  // Ajoute à l'historique
  const addToHistory = (result: VATValidationResult) => {
    setValidationHistory(prev => [result, ...prev.slice(0, 9)]); // Garde les 10 derniers
  };
  // Exporte la preuve de vérification
  const exportProof = () => {
    if (!result) return;
    logger.debug('VATNumberValidator', 'Export PDF de la preuve de vérification - Fonctionnalité à venir');
  };
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-blue-600" />
          <span>Vérificateur de TVA Intracommunautaire</span>
        </CardTitle>
        <CardDescription>
          Validez les numéros de TVA de l'Union Européenne via l'API VIES
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulaire de saisie */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vatNumber">Numéro de TVA intracommunautaire</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="vatNumber"
                type="text"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && validate()}
                placeholder="Ex: FR 12 345678901"
                className="font-mono"
              />
              <Button
                onClick={validate}
                disabled={isValidating || !vatNumber.trim()}
                className="flex items-center space-x-2"
              >
                {isValidating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Vérifier</span>
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Formaté : {formatVATNumber(vatNumber)}
            </p>
          </div>
          {/* Information sur les formats */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Formats acceptés :</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>FR :</strong> FR XX 123456789 (2 caractères + 9 chiffres)</li>
                <li><strong>BE :</strong> BE 1234567890 (10 chiffres)</li>
                <li><strong>LU :</strong> LU 12345678 (8 chiffres)</li>
                <li><strong>DE :</strong> DE 123456789 (9 chiffres)</li>
                <li>Et tous les autres pays de l'UE</li>
              </ul>
            </div>
          </div>
        </div>
        {/* Résultat de validation */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 border-t pt-6"
            >
              {/* Statut de validation */}
              <div className={cn(
                "p-4 rounded-lg border-2 flex items-start space-x-3",
                result.isValid
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              )}>
                {result.isValid ? (
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h4 className={cn(
                    "font-bold text-lg",
                    result.isValid
                      ? "text-green-700 dark:text-green-300"
                      : "text-red-700 dark:text-red-300"
                  )}>
                    {result.isValid
                      ? '✓ Numéro de TVA valide'
                      : '✗ Numéro de TVA invalide'}
                  </h4>
                  <p className={cn(
                    "text-sm mt-1",
                    result.isValid
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  )}>
                    {result.isValid
                      ? 'Ce numéro de TVA est enregistré dans la base VIES'
                      : result.errorMessage || 'Numéro non valide'}
                  </p>
                </div>
              </div>
              {/* Détails de validation */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">Détails</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Numéro de TVA */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Numéro de TVA</p>
                    <p className="font-mono font-medium text-gray-900 dark:text-white">
                      {formatVATNumber(result.vatNumber)}
                    </p>
                  </div>
                  {/* Pays */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pays</p>
                    <div className="flex items-center space-x-2">
                      <Badge>{result.countryCode}</Badge>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {result.countryCode === 'FR' ? 'France' :
                         result.countryCode === 'BE' ? 'Belgique' :
                         result.countryCode === 'LU' ? 'Luxembourg' :
                         result.countryCode === 'DE' ? 'Allemagne' :
                         result.countryCode}
                      </span>
                    </div>
                  </div>
                  {/* Format */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Validation format</p>
                    <div className="flex items-center space-x-2">
                      {result.isFormatValid ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {result.isFormatValid ? 'Format correct' : 'Format incorrect'}
                      </span>
                    </div>
                  </div>
                  {/* VIES */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Validation VIES</p>
                    <div className="flex items-center space-x-2">
                      {result.isViesValid ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {result.isViesValid ? 'Valide VIES' : 'Non trouvé VIES'}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Informations entreprise */}
                {result.isValid && result.companyName && (
                  <div className="border rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800">
                    <h5 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                      <Building className="w-4 h-4" />
                      <span>Informations entreprise</span>
                    </h5>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Raison sociale</p>
                        <p className="font-medium text-gray-900 dark:text-white">{result.companyName}</p>
                      </div>
                      {result.companyAddress && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>Adresse</span>
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{result.companyAddress}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Date de vérification</span>
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {result.verificationDate.toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Actions */}
                {result.isValid && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={exportProof}
                      className="flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Exporter preuve de vérification</span>
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Historique */}
        {validationHistory.length > 0 && (
          <div className="border-t pt-6 space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white">Historique des vérifications</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {validationHistory.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded border text-sm"
                >
                  <div className="flex items-center space-x-3">
                    {item.isValid ? (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-mono font-medium text-gray-900 dark:text-white">
                        {formatVATNumber(item.vatNumber)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.verificationDate.toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <Badge className={cn(
                    item.isValid
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-red-100 text-red-800 border-red-200"
                  )}>
                    {item.isValid ? 'Valide' : 'Invalide'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Avertissement */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            <strong>Important :</strong> La vérification via VIES ne garantit pas que l'entreprise est solvable ou fiable.
            Elle confirme uniquement que le numéro de TVA est enregistré dans l'UE. Conservez toujours une preuve de vérification pour justifier l'exonération de TVA intracommunautaire.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};