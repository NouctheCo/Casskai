/**
 * CassKai - Validateur d'identifiants d'entreprise
 * SIREN, SIRET, BCE, RCS, NIF, etc.
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
  Briefcase,
  AlertCircle,
  Loader2,
  Info,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  validateBusinessId,
  formatSIREN,
  formatSIRET,
  enrichFromINSEE,
  BUSINESS_ID_FORMATS
} from '@/utils/validation/sirenValidator';

interface ValidationHistory {
  id: string;
  type: string;
  isValid: boolean;
  timestamp: Date;
}

export const BusinessIdValidator: React.FC<{ className?: string }> = ({ className }) => {
  const [businessId, setBusinessId] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('FR');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [enrichedData, setEnrichedData] = useState<any>(null);
  const [history, setHistory] = useState<ValidationHistory[]>([]);

  // Valide l'identifiant
  const validate = async () => {
    if (!businessId.trim()) {
      console.warn('Veuillez saisir un identifiant');
      return;
    }

    setIsValidating(true);
    setResult(null);
    setEnrichedData(null);

    try {
      const validationResult = validateBusinessId(businessId, countryCode);
      setResult(validationResult);

      // Ajouter à l'historique
      addToHistory({
        id: businessId,
        type: validationResult.type || 'Inconnu',
        isValid: validationResult.isValid,
        timestamp: new Date()
      });

      // Si valide et France, enrichir via INSEE
      if (validationResult.isValid && countryCode === 'FR' && validationResult.type === 'SIRET') {
        const enrichment = await enrichFromINSEE(businessId.replace(/\s/g, ''));
        if (enrichment.success && enrichment.data) {
          setEnrichedData(enrichment.data);
        }
      }
    } catch (error) {
      setResult({
        isValid: false,
        error: `Erreur lors de la validation : ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Ajoute à l'historique
  const addToHistory = (entry: ValidationHistory) => {
    setHistory(prev => [entry, ...prev.slice(0, 9)]);
  };

  // Export preuve
  const exportProof = () => {
    console.warn('Export PDF - Fonctionnalité à venir');
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building className="w-5 h-5 text-blue-600" />
          <span>Validateur d'Identifiant d'Entreprise</span>
        </CardTitle>
        <CardDescription>
          Validez SIREN, SIRET, BCE, RCS et autres identifiants professionnels
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Formulaire */}
        <div className="space-y-4">
          {/* Pays */}
          <div className="space-y-2">
            <Label htmlFor="country">Pays</Label>
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FR">France (SIREN/SIRET)</SelectItem>
                <SelectItem value="BE">Belgique (BCE)</SelectItem>
                <SelectItem value="LU">Luxembourg (RCS)</SelectItem>
                <SelectItem value="CI">Côte d'Ivoire (CC)</SelectItem>
                <SelectItem value="SN">Sénégal (NINEA)</SelectItem>
                <SelectItem value="BJ">Bénin (IFU)</SelectItem>
                <SelectItem value="MA">Maroc (ICE)</SelectItem>
                <SelectItem value="DZ">Algérie (NIF)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Identifiant */}
          <div className="space-y-2">
            <Label htmlFor="businessId">Identifiant d'entreprise</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="businessId"
                type="text"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && validate()}
                placeholder={
                  countryCode === 'FR' ? 'Ex: 909672685 ou 90967268500018' :
                  countryCode === 'BE' ? 'Ex: 0123456789' :
                  countryCode === 'LU' ? 'Ex: B123456' :
                  'Identifiant d\'entreprise'
                }
                className="font-mono"
              />
              <Button
                onClick={validate}
                disabled={isValidating || !businessId.trim()}
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

            {/* Formatage */}
            {businessId && result && result.type && (
              <p className="text-xs text-gray-500">
                Formaté : {
                  result.type === 'SIREN' ? formatSIREN(businessId) :
                  result.type === 'SIRET' ? formatSIRET(businessId) :
                  businessId
                }
              </p>
            )}
          </div>

          {/* Information formats */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Formats acceptés pour {countryCode} :</p>
              <ul className="list-disc list-inside space-y-1">
                {Object.values(BUSINESS_ID_FORMATS)
                  .filter(format => {
                    const prefix = Object.keys(BUSINESS_ID_FORMATS).find(key =>
                      BUSINESS_ID_FORMATS[key] === format
                    )?.split('_')[0];
                    return prefix === countryCode;
                  })
                  .map((format, index) => (
                    <li key={index}>
                      <strong>{format.name} :</strong> {format.format} (Ex: {format.example})
                    </li>
                  ))
                }
              </ul>
            </div>
          </div>
        </div>

        {/* Résultats */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 border-t pt-6"
            >
              {/* Statut */}
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
                      ? `✓ ${result.type} valide`
                      : '✗ Identifiant invalide'}
                  </h4>
                  <p className={cn(
                    "text-sm mt-1",
                    result.isValid
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  )}>
                    {result.isValid
                      ? `Format ${result.format} vérifié avec succès`
                      : result.error || 'Identifiant non valide'}
                  </p>
                </div>
              </div>

              {/* Détails */}
              {result.isValid && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Détails</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Type */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Type</p>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        {result.type}
                      </Badge>
                    </div>

                    {/* Format */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Format</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{result.format}</p>
                    </div>

                    {/* SIREN (si SIRET) */}
                    {result.details?.siren && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">SIREN (entreprise)</p>
                        <p className="font-mono font-medium text-gray-900 dark:text-white">
                          {formatSIREN(result.details.siren)}
                        </p>
                      </div>
                    )}

                    {/* NIC (si SIRET) */}
                    {result.details?.nic && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">NIC (établissement)</p>
                        <p className="font-mono font-medium text-gray-900 dark:text-white">
                          {result.details.nic}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Données enrichies INSEE */}
              {enrichedData && (
                <div className="border rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800">
                  <h5 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                    <Building className="w-4 h-4" />
                    <span>Informations entreprise (INSEE)</span>
                    <Badge className={cn(
                      "text-xs",
                      enrichedData.status === 'active'
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    )}>
                      {enrichedData.status === 'active' ? 'Active' : 'Fermée'}
                    </Badge>
                  </h5>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Dénomination</p>
                      <p className="font-medium text-gray-900 dark:text-white">{enrichedData.denomination}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>Adresse</span>
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{enrichedData.address}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                        <Briefcase className="w-3 h-3" />
                        <span>Activité</span>
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{enrichedData.activity}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Forme juridique</p>
                        <Badge variant="secondary">{enrichedData.legalForm}</Badge>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Date de création</span>
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {new Date(enrichedData.creationDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
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
                    <span>Exporter fiche entreprise</span>
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Historique */}
        {history.length > 0 && (
          <div className="border-t pt-6 space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white">Historique</h4>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.map((item, index) => (
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
                        {item.id}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.type} • {item.timestamp.toLocaleString('fr-FR')}
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
            <strong>Note :</strong> La validation algorithmique confirme la validité du format et de la clé de contrôle,
            mais ne garantit pas que l'entreprise existe ou est active. Pour la France, utilisez l'enrichissement INSEE pour obtenir les données officielles.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
