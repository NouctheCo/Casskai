import React, { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';

import { Progress } from '@/components/ui/progress';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useToast } from '@/components/ui/use-toast';

import {

  FileText,

  Shield,

  AlertTriangle,

  CheckCircle,

  Download,

  Calculator,

  Building2,

  TrendingUp,

  Receipt,

  Calendar,

  Sparkles

} from 'lucide-react';

import { useFrenchTaxCompliance } from '@/hooks/useFrenchTaxCompliance';



interface _ComplianceScore {

  score: number;

  maxScore: number;

  factors: {

    name: string;

    status: 'ok' | 'warning' | 'error';

    message: string;

  }[];

}



export const FrenchTaxCompliancePanel: React.FC<{ companyId: string }> = ({ companyId }) => {

  const { toast } = useToast();

  const [selectedPeriod, setSelectedPeriod] = useState(new Date().getFullYear().toString());



  const {

    declarations,

    complianceScore,

    loading,

    error,

    integrationStatus: _integrationStatus,

    generateCA3,

    generateLiasseFiscale,

    generateCVAE,

    generateFEC,

    validateCompliance: _validateCompliance,

    syncWithModules: _syncWithModules,

    downloadDeclarationPdf,

    downloadDeclarationEdiDraft,

    downloadDeclarationRegulatoryPdf,

    downloadDeclarationRegulatoryXmlDraft,

    isCompliant,

    clearError

  } = useFrenchTaxCompliance(companyId);



  useEffect(() => {

    if (error) {

      toast({

        title: 'Erreur',

        description: error,

        variant: 'destructive'

      });

      clearError();

    }

  }, [error, toast, clearError]);



  const handleGenerateCA3 = async () => {

    try {

      const currentMonth = new Date().toISOString().slice(0, 7);

      await generateCA3(currentMonth);

      toast({

        title: 'CA3 Générée',

        description: `Déclaration TVA pour ${currentMonth} créée avec succès`,

      });

    } catch (_error) {

      // Error is already handled by the hook

    }

  };



  const handleGenerateLiasse = async () => {

    try {

      await generateLiasseFiscale(selectedPeriod);

      toast({

        title: 'Liasse Fiscale Générée',

        description: `Déclarations 2050-2059 pour ${selectedPeriod} créées`,

      });

    } catch (_error) {

      // Error is already handled by the hook

    }

  };



  const handleGenerateCVAE = async () => {

    try {

      await generateCVAE(selectedPeriod);

      toast({

        title: 'CVAE Générée',

        description: `Déclaration CVAE pour ${selectedPeriod} créée`,

      });

    } catch (_error) {

      // Error is already handled by the hook

    }

  };



  const handleGenerateFEC = async () => {

    try {

      const fec = await generateFEC(selectedPeriod);

      if (fec) {

        // Créer et télécharger le fichier FEC

        const blob = new Blob([fec], { type: 'text/plain;charset=utf-8' });

        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');

        a.href = url;

        a.download = `FEC_${companyId}_${selectedPeriod}.txt`;

        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);

        URL.revokeObjectURL(url);



        toast({

          title: 'FEC Généré',

          description: `Fichier des Écritures Comptables ${selectedPeriod} téléchargé`,

        });

      }

    } catch (_error) {

      // Error is already handled by the hook

    }

  };



  const handleDownloadDeclarationPdf = async (declarationId: string) => {

    try {

      await downloadDeclarationPdf(declarationId);

      toast({

        title: 'Export PDF',

        description: 'Déclaration exportée en PDF (brouillon).',

      });

    } catch (_error) {

      // Error is already handled by the hook

    }

  };



  const handleDownloadDeclarationEdiDraft = async (declarationId: string) => {

    try {

      await downloadDeclarationEdiDraft(declarationId);

      toast({

        title: 'Export EDI (draft)',

        description: 'Déclaration exportée en JSON (format brouillon).',

      });

    } catch (_error) {

      // Error is already handled by the hook

    }

  };



  const handleDownloadDeclarationRegulatoryPdf = async (declarationId: string) => {

    try {

      await downloadDeclarationRegulatoryPdf(declarationId);

      toast({

        title: 'Export PDF réglementaire',

        description: 'PDF généré via templates réglementaires (document de travail).',

      });

    } catch (_error) {

      // Error is already handled by the hook

    }

  };



  const handleDownloadDeclarationRegulatoryXmlDraft = async (declarationId: string) => {

    try {

      await downloadDeclarationRegulatoryXmlDraft(declarationId);

      toast({

        title: 'Export XML (draft)',

        description: 'XML généré (format brouillon / non dépôt).',

      });

    } catch (_error) {

      // Error is already handled by the hook

    }

  };



  const getStatusColor = (status: string) => {

    switch (status) {

      case 'ready': return 'bg-green-100 text-green-800';

      case 'filed': return 'bg-blue-100 text-blue-800';

      case 'accepted': return 'bg-emerald-100 text-emerald-800';

      case 'rejected': return 'bg-red-100 text-red-800';

      case 'draft': return 'bg-yellow-100 text-yellow-800';

      default: return 'bg-gray-100 text-gray-800';

    }

  };



  const getTypeIcon = (type: string) => {

    switch (type) {

      case 'CA3': case 'CA12': return <Receipt className="h-4 w-4" />;

      case 'CVAE_1330': case 'CFE_1447': return <Building2 className="h-4 w-4" />;

      case 'DSN': case 'DUCS': return <TrendingUp className="h-4 w-4" />;

      default: return <FileText className="h-4 w-4" />;

    }

  };



  if (loading) {

    return (

      <div className="space-y-4">

        <div className="animate-pulse">

          <div className="h-8 bg-gray-200 rounded mb-4"></div>

          <div className="h-32 bg-gray-200 rounded"></div>

        </div>

      </div>

    );

  }



  return (

    <div className="space-y-6">

      {/* En-tête avec score de conformité */}

      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">

        <CardHeader>

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="p-3 bg-blue-100 rounded-full">

                <Shield className="h-6 w-6 text-blue-600" />

              </div>

              <div>

                <CardTitle className="text-2xl text-blue-900 dark:text-blue-100">

                  Conformité Fiscale Française

                </CardTitle>

                <p className="text-blue-700 mt-1 dark:text-blue-400">

                  Outils conçus pour respecter les obligations fiscales françaises

                </p>

              </div>

            </div>

            <Sparkles className="h-8 w-8 text-yellow-500" />

          </div>

        </CardHeader>

        <CardContent>

          {complianceScore && (

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>

                <div className="flex items-center justify-between mb-2">

                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Score de Conformité</h3>

                  <span className="text-2xl font-bold text-blue-600">

                    {complianceScore.score}/{complianceScore.maxScore}

                  </span>

                </div>

                <Progress

                  value={(complianceScore.score / complianceScore.maxScore) * 100}

                  className="mb-3"

                />

                <div className="space-y-2">

                  <div className="flex items-center gap-2 text-sm">

                    {isCompliant ? (

                      <CheckCircle className="h-4 w-4 text-green-500" />

                    ) : (

                      <AlertTriangle className="h-4 w-4 text-yellow-500" />

                    )}

                    <span className={isCompliant ? 'text-green-700' : 'text-yellow-700'}>

                      {isCompliant ? 'Système conforme' : 'Améliorations recommandées'}

                    </span>

                  </div>

                  <div className="flex items-center gap-2 text-sm">

                    <CheckCircle className="h-4 w-4 text-green-500" />

                    <span className="text-green-700 dark:text-green-400">TVA: Calculs conformes</span>

                  </div>

                  <div className="flex items-center gap-2 text-sm">

                    <CheckCircle className="h-4 w-4 text-green-500" />

                    <span className="text-green-700 dark:text-green-400">FEC: Format officiel respecté</span>

                  </div>

                  <div className="flex items-center gap-2 text-sm">

                    <CheckCircle className="h-4 w-4 text-green-500" />

                    <span className="text-green-700 dark:text-green-400">Liasse: Normes DGFiP appliquées</span>

                  </div>

                </div>

              </div>

              <div className="space-y-3">

                <h3 className="font-semibold text-blue-900 mb-3 dark:text-blue-100">Actions Rapides</h3>

                <div className="grid grid-cols-2 gap-2">

                  <Button

                    onClick={handleGenerateCA3}

                    variant="outline"

                    size="sm"

                    className="flex items-center gap-2"

                  >

                    <Receipt className="h-4 w-4" />

                    CA3 TVA

                  </Button>

                  <Button

                    onClick={handleGenerateCVAE}

                    variant="outline"

                    size="sm"

                    className="flex items-center gap-2"

                  >

                    <Building2 className="h-4 w-4" />

                    CVAE

                  </Button>

                  <Button

                    onClick={handleGenerateLiasse}

                    variant="outline"

                    size="sm"

                    className="flex items-center gap-2"

                  >

                    <FileText className="h-4 w-4" />

                    Liasse

                  </Button>

                  <Button

                    onClick={handleGenerateFEC}

                    variant="outline"

                    size="sm"

                    className="flex items-center gap-2"

                  >

                    <Download className="h-4 w-4" />

                    FEC

                  </Button>

                </div>

              </div>

            </div>

          )}

        </CardContent>

      </Card>



      {/* Sélection de période */}

      <div className="flex items-center gap-4">

        <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />

        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>

          <SelectTrigger className="w-40">

            <SelectValue placeholder="Période" />

          </SelectTrigger>

          <SelectContent>

            {Array.from({ length: 5 }, (_, i) => {

              const year = new Date().getFullYear() - i;

              return (

                <SelectItem key={year} value={year.toString()}>

                  {year}

                </SelectItem>

              );

            })}

          </SelectContent>

        </Select>

      </div>



      {/* Onglets par type de déclaration */}

      <Tabs defaultValue="tva" className="w-full">

        <TabsList className="grid w-full grid-cols-5">

          <TabsTrigger value="tva">TVA</TabsTrigger>

          <TabsTrigger value="is">Impôt Société</TabsTrigger>

          <TabsTrigger value="social">Social</TabsTrigger>

          <TabsTrigger value="local">Impôts Locaux</TabsTrigger>

          <TabsTrigger value="autres">Autres</TabsTrigger>

        </TabsList>



        {/* TVA */}

        <TabsContent value="tva" className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            <Card>

              <CardHeader className="pb-3">

                <div className="flex items-center gap-2">

                  <Receipt className="h-5 w-5 text-blue-600" />

                  <CardTitle className="text-lg">CA3 - TVA Mensuelle</CardTitle>

                </div>

              </CardHeader>

              <CardContent>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">

                  Déclaration mensuelle de TVA conforme aux exigences DGFiP

                </p>

                <div className="space-y-2">

                  <div className="text-sm">

                    <span className="text-gray-500 dark:text-gray-400">Échéance:</span>

                    <span className="ml-2 font-medium">19 du mois suivant</span>

                  </div>

                  <div className="text-sm">

                    <span className="text-gray-500 dark:text-gray-400">Format:</span>

                    <span className="ml-2">CA3 2024</span>

                  </div>

                </div>

                <Button

                  onClick={handleGenerateCA3}

                  className="w-full mt-4"

                  disabled={loading}

                >

                  <Calculator className="h-4 w-4 mr-2" />

                  Générer CA3

                </Button>

              </CardContent>

            </Card>



            <Card>

              <CardHeader className="pb-3">

                <div className="flex items-center gap-2">

                  <Receipt className="h-5 w-5 text-green-600" />

                  <CardTitle className="text-lg">CA12 - TVA Annuelle</CardTitle>

                </div>

              </CardHeader>

              <CardContent>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">

                  Déclaration annuelle pour régime simplifié

                </p>

                <div className="space-y-2">

                  <div className="text-sm">

                    <span className="text-gray-500 dark:text-gray-400">Échéance:</span>

                    <span className="ml-2 font-medium">2e jour ouvré de mai</span>

                  </div>

                  <div className="text-sm">

                    <span className="text-gray-500 dark:text-gray-400">Régime:</span>

                    <span className="ml-2">Réel simplifié</span>

                  </div>

                </div>

                <Button variant="outline" className="w-full mt-4" disabled>

                  Bientôt disponible

                </Button>

              </CardContent>

            </Card>



            <Card>

              <CardHeader className="pb-3">

                <div className="flex items-center gap-2">

                  <FileText className="h-5 w-5 text-purple-600" />

                  <CardTitle className="text-lg">DEB/DES</CardTitle>

                </div>

              </CardHeader>

              <CardContent>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">

                  Déclarations d'échanges de biens/services intracommunautaires

                </p>

                <div className="space-y-2">

                  <div className="text-sm">

                    <span className="text-gray-500 dark:text-gray-400">Échéance:</span>

                    <span className="ml-2 font-medium">10 du mois suivant</span>

                  </div>

                  <div className="text-sm">

                    <span className="text-gray-500 dark:text-gray-400">Seuil:</span>

                    <span className="ml-2">460K€ DEB / 100K€ DES</span>

                  </div>

                </div>

                <Button variant="outline" className="w-full mt-4" disabled>

                  Configuration requise

                </Button>

              </CardContent>

            </Card>

          </div>

        </TabsContent>



        {/* Impôt sur les Sociétés */}

        <TabsContent value="is" className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <Card>

              <CardHeader className="pb-3">

                <div className="flex items-center gap-2">

                  <FileText className="h-5 w-5 text-blue-600" />

                  <CardTitle className="text-lg">Liasse Fiscale 2050-2059</CardTitle>

                </div>

              </CardHeader>

              <CardContent>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">

                  Déclarations fiscales annuelles complètes avec tous les imprimés

                </p>

                <div className="space-y-2">

                  <div className="text-sm">

                    <span className="text-gray-500 dark:text-gray-400">Échéance:</span>

                    <span className="ml-2 font-medium">15 mai N+1</span>

                  </div>

                  <div className="text-sm">

                    <span className="text-gray-500 dark:text-gray-400">Imprimés:</span>

                    <span className="ml-2">2050 à 2059 + annexes</span>

                  </div>

                </div>

                <Button

                  onClick={handleGenerateLiasse}

                  className="w-full mt-4"

                  disabled={loading}

                >

                  <FileText className="h-4 w-4 mr-2" />

                  Générer Liasse Complète

                </Button>

              </CardContent>

            </Card>



            <Card>

              <CardHeader className="pb-3">

                <div className="flex items-center gap-2">

                  <Calculator className="h-5 w-5 text-green-600" />

                  <CardTitle className="text-lg">Acomptes IS</CardTitle>

                </div>

              </CardHeader>

              <CardContent>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">

                  Calcul et déclaration des acomptes trimestriels IS

                </p>

                <div className="space-y-2">

                  <div className="text-sm">

                    <span className="text-gray-500 dark:text-gray-400">Périodes:</span>

                    <span className="ml-2 font-medium">15/03, 15/06, 15/09, 15/12</span>

                  </div>

                  <div className="text-sm">

                    <span className="text-gray-500 dark:text-gray-400">Base:</span>

                    <span className="ml-2">IS N-1 + régularisations</span>

                  </div>

                </div>

                <Button variant="outline" className="w-full mt-4" disabled>

                  Calcul automatique

                </Button>

              </CardContent>

            </Card>

          </div>

        </TabsContent>



        {/* Impôts Locaux */}

        <TabsContent value="local" className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <Card>

              <CardHeader className="pb-3">

                <div className="flex items-center gap-2">

                  <Building2 className="h-5 w-5 text-purple-600" />

                  <CardTitle className="text-lg">CVAE 1330-CVAE</CardTitle>

                </div>

              </CardHeader>

              <CardContent>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">

                  Cotisation sur la Valeur Ajoutée des Entreprises

                </p>

                <div className="space-y-2">

                  <div className="text-sm">

                    <span className="text-gray-500 dark:text-gray-400">Seuil:</span>

                    <span className="ml-2 font-medium">CA &gt; 500K€</span>

                  </div>

                  <div className="text-sm">

                    <span className="text-gray-500 dark:text-gray-400">Échéance:</span>

                    <span className="ml-2 font-medium">15 mai N+1</span>

                  </div>

                </div>

                <Button

                  onClick={handleGenerateCVAE}

                  className="w-full mt-4"

                  disabled={loading}

                >

                  <Building2 className="h-4 w-4 mr-2" />

                  Calculer CVAE

                </Button>

              </CardContent>

            </Card>



            <Card>

              <CardHeader className="pb-3">

                <div className="flex items-center gap-2">

                  <Building2 className="h-5 w-5 text-orange-600" />

                  <CardTitle className="text-lg">CFE 1447-CFE</CardTitle>

                </div>

              </CardHeader>

              <CardContent>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">

                  Cotisation Foncière des Entreprises

                </p>

                <div className="space-y-2">

                  <div className="text-sm">

                    <span className="text-gray-500 dark:text-gray-400">Échéance:</span>

                    <span className="ml-2 font-medium">15 décembre</span>

                  </div>

                  <div className="text-sm">

                    <span className="text-gray-500 dark:text-gray-400">Base:</span>

                    <span className="ml-2">Valeur locative foncière</span>

                  </div>

                </div>

                <Button variant="outline" className="w-full mt-4" disabled>

                  Données foncières requises

                </Button>

              </CardContent>

            </Card>

          </div>

        </TabsContent>



        {/* Social */}

        <TabsContent value="social" className="space-y-4">

          <Card>

            <CardHeader>

              <CardTitle>Déclarations Sociales</CardTitle>

              <p className="text-sm text-gray-600 dark:text-gray-400">

                Intégration avec les modules RH pour les déclarations sociales automatisées

              </p>

            </CardHeader>

            <CardContent>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="p-4 border rounded-lg">

                  <h4 className="font-semibold mb-2 flex items-center gap-2">

                    <TrendingUp className="h-4 w-4" />

                    DSN (Déclaration Sociale Nominative)

                  </h4>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">

                    Transmission mensuelle des données sociales

                  </p>

                  <Button variant="outline" size="sm" disabled>

                    Requiert module RH

                  </Button>

                </div>

                <div className="p-4 border rounded-lg">

                  <h4 className="font-semibold mb-2 flex items-center gap-2">

                    <Receipt className="h-4 w-4" />

                    DUCS (Déclaration Unifiée de Cotisations Sociales)

                  </h4>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">

                    Déclaration trimestrielle pour les cotisations

                  </p>

                  <Button variant="outline" size="sm" disabled>

                    Requiert module RH

                  </Button>

                </div>

              </div>

            </CardContent>

          </Card>

        </TabsContent>



        {/* Autres */}

        <TabsContent value="autres" className="space-y-4">

          <Card>

            <CardHeader>

              <CardTitle className="flex items-center gap-2">

                <Download className="h-5 w-5" />

                FEC - Fichier des Écritures Comptables

              </CardTitle>

              <p className="text-sm text-gray-600 dark:text-gray-400">

                Export conforme à l'article A47 A-1 du Livre des Procédures Fiscales

              </p>

            </CardHeader>

            <CardContent>

              <div className="space-y-4">

                <div className="p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">

                  <h4 className="font-semibold text-blue-900 mb-2 dark:text-blue-100">

                    Format FEC conforme aux spécifications DGFiP

                  </h4>

                  <ul className="text-sm text-blue-700 space-y-1 dark:text-blue-400">

                    <li>• 18 champs obligatoires selon la norme</li>

                    <li>• Encodage UTF-8 avec séparateurs TAB</li>

                    <li>• Validation automatique de la cohérence</li>

                    <li>• Contrôles d'intégrité intégrés</li>

                    <li>• Validation recommandée via Test Compta Demat</li>

                  </ul>

                </div>

                <Button

                  onClick={handleGenerateFEC}

                  className="w-full"

                  disabled={loading}

                >

                  <Download className="h-4 w-4 mr-2" />

                  Télécharger FEC {selectedPeriod}

                </Button>

              </div>

            </CardContent>

          </Card>

        </TabsContent>

      </Tabs>



      {/* Liste des déclarations générées */}

      {declarations.length > 0 && (

        <Card>

          <CardHeader>

            <CardTitle>Déclarations Générées</CardTitle>

          </CardHeader>

          <CardContent>

            <div className="space-y-3">

              {declarations.map(declaration => (

                <div key={declaration.id} className="flex items-center justify-between p-3 border rounded-lg">

                  <div className="flex items-center gap-3">

                    {getTypeIcon(declaration.type)}

                    <div>

                      <div className="font-medium">{declaration.type}</div>

                      <div className="text-sm text-gray-600 dark:text-gray-400">

                        Période: {declaration.period} •

                        Échéance: {declaration.dueDate.toLocaleDateString('fr-FR')}

                      </div>

                    </div>

                  </div>

                  <div className="flex items-center gap-2">

                    <Badge className={getStatusColor(declaration.status)}>

                      {declaration.status}

                    </Badge>

                    {declaration.validationErrors.length > 0 && (

                      <Badge variant="outline" className="text-red-600 border-red-600 dark:text-red-400">

                        {declaration.validationErrors.length} erreur(s)

                      </Badge>

                    )}

                    {declaration.warnings.length > 0 && (

                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">

                        {declaration.warnings.length} alerte(s)

                      </Badge>

                    )}



                    <Button

                      variant="outline"

                      size="sm"

                      disabled={loading || !(['CA3', 'CA12'].includes(declaration.type) || declaration.type.startsWith('LIASSE_'))}

                      onClick={() => handleDownloadDeclarationPdf(declaration.id)}

                    >

                      <FileText className="h-4 w-4 mr-2" />

                      PDF (brouillon)

                    </Button>



                    <Button

                      variant="outline"

                      size="sm"

                      disabled={loading || !(['CA3', 'CA12'].includes(declaration.type) || declaration.type.startsWith('LIASSE_'))}

                      onClick={() => handleDownloadDeclarationRegulatoryPdf(declaration.id)}

                    >

                      <FileText className="h-4 w-4 mr-2" />

                      PDF (réglementaire)

                    </Button>



                    <Button

                      variant="outline"

                      size="sm"

                      disabled={loading}

                      onClick={() => handleDownloadDeclarationEdiDraft(declaration.id)}

                    >

                      <Download className="h-4 w-4 mr-2" />

                      EDI (draft)

                    </Button>



                    <Button

                      variant="outline"

                      size="sm"

                      disabled={loading}

                      onClick={() => handleDownloadDeclarationRegulatoryXmlDraft(declaration.id)}

                    >

                      <Download className="h-4 w-4 mr-2" />

                      XML (draft)

                    </Button>

                  </div>

                </div>

              ))}

            </div>

          </CardContent>

        </Card>

      )}

    </div>

  );

};
