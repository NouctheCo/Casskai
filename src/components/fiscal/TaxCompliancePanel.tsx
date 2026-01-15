import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';

import { Progress } from '@/components/ui/progress';

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

  Sparkles,

  Globe,

  Banknote

} from 'lucide-react';

import { useTaxCompliance } from '@/hooks/useTaxCompliance';



interface TaxCompliancePanelProps {

  companyId: string;

  countryCode?: string;

}



export const TaxCompliancePanel: React.FC<TaxCompliancePanelProps> = ({

  companyId,

  countryCode = 'FR'

}) => {

  const { toast } = useToast();
  const { t } = useTranslation();

  const [selectedPeriod, setSelectedPeriod] = useState(new Date().getFullYear().toString());



  const {

    declarations,

    complianceScore,

    loading,

    error,

    integrationStatus,

    countryConfig: _countryConfig,

    countryName,

    currency,

    accountingStandard,

    vatRates,

    corporateTaxRate,

    generateDeclaration,

    calculateVAT,

    calculateCorporateTax,

    exportTaxData,

    downloadDeclarationRegulatoryPdf,

    downloadDeclarationRegulatoryXmlDraft,

    validateCompliance: _validateCompliance,

    syncWithModules,

    autoConfigureObligations,

    getAvailableDeclarations,

    isCompliant,

    clearError

  } = useTaxCompliance(companyId, countryCode);



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



  const handleGenerateDeclaration = async (declarationType: string) => {

    try {

      const period = declarationType.includes('annual') ? selectedPeriod :

                   new Date().toISOString().slice(0, 7);



      await generateDeclaration(declarationType, period);

      toast({

        title: 'Déclaration générée',

        description: `${declarationType} pour ${period} créée avec succès`,

      });

    } catch (_error) {

      // Error is already handled by the hook

    }

  };



  const handleCalculateVAT = async () => {

    try {

      const vatData = await calculateVAT(selectedPeriod);

      if (vatData) {

        toast({

          title: 'TVA calculée',

          description: `Calcul TVA pour ${selectedPeriod} effectué`,

        });

      }

    } catch (_error) {

      // Error is already handled by the hook

    }

  };



  const handleExportTaxData = async (format: 'pdf' | 'excel' | 'csv' = 'pdf') => {

    try {

      const exportData = await exportTaxData(selectedPeriod, format);

      if (exportData) {

        // Créer et télécharger le fichier

        const blob = new Blob([exportData.content], { type: exportData.mimeType });

        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');

        a.href = url;

        a.download = exportData.filename;

        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);

        URL.revokeObjectURL(url);



        toast({

          title: 'Export réussi',

          description: `Données fiscales ${selectedPeriod} exportées en ${format.toUpperCase()}`,

        });

      }

    } catch (_error) {

      // Error is already handled by the hook

    }

  };



  const handleDownloadDeclarationRegulatoryPdf = async (declarationId: string) => {

    try {

      await downloadDeclarationRegulatoryPdf(declarationId);

      toast({

        title: 'Export réglementaire',

        description: 'PDF réglementaire téléchargé',

      });

    } catch (err) {

      toast({

        title: 'Export réglementaire',

        description: err instanceof Error ? err.message : 'Erreur lors de l\'export',

        variant: 'destructive'

      });

    }

  };



  const handleDownloadDeclarationRegulatoryXml = async (declarationId: string) => {

    try {

      await downloadDeclarationRegulatoryXmlDraft(declarationId);

      toast({

        title: 'Export réglementaire',

        description: 'XML draft téléchargé',

      });

    } catch (err) {

      toast({

        title: 'Export réglementaire',

        description: err instanceof Error ? err.message : 'Erreur lors de l\'export',

        variant: 'destructive'

      });

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

    if (type.toLowerCase().includes('vat') || type.toLowerCase().includes('tva')) {

      return <Receipt className="h-4 w-4" />;

    }

    if (type.toLowerCase().includes('corporate') || type.toLowerCase().includes('societe')) {

      return <Building2 className="h-4 w-4" />;

    }

    if (type.toLowerCase().includes('social')) {

      return <TrendingUp className="h-4 w-4" />;

    }

    return <FileText className="h-4 w-4" />;

  };



  const _formatCurrency = (amount: number) => {

    return new Intl.NumberFormat('fr-FR', {

      style: 'currency',

      currency

    }).format(amount);

  };



  const getCountryFlag = (code: string) => {

    const flags: Record<string, string> = {

      FR: '🇫🇷', SN: '🇸🇳', CI: '🇨🇮', MA: '🇲🇦',

      TN: '🇹🇳', CM: '🇨🇲', ML: '🇲🇱', BF: '🇧🇫'

    };

    return flags[code] || '🌍';

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



  const availableDeclarations = getAvailableDeclarations();



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

                <CardTitle className="text-2xl text-blue-900 flex items-center gap-2 dark:text-blue-100">

                  <span className="text-2xl">{getCountryFlag(countryCode)}</span>

                  Conformité Fiscale - {countryName}

                </CardTitle>

                <p className="text-blue-700 mt-1 flex items-center gap-2 dark:text-blue-400">

                  <Globe className="h-4 w-4" />

                  Système adapté aux réglementations de {countryName}

                  <span className="mx-2">•</span>

                  <Banknote className="h-4 w-4" />

                  Devise: {currency}

                  <span className="mx-2">•</span>

                  Norme: {accountingStandard}

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

                  {vatRates && (

                    <div className="flex items-center gap-2 text-sm">

                      <CheckCircle className="h-4 w-4 text-green-500" />

                      <span className="text-green-700 dark:text-green-400">

                        TVA: Taux {vatRates.standard}% (standard)

                        {vatRates.reduced.length > 0 && ` + réduits (${vatRates.reduced.join(', ')}%)`}

                      </span>

                    </div>

                  )}

                  <div className="flex items-center gap-2 text-sm">

                    <CheckCircle className="h-4 w-4 text-green-500" />

                    <span className="text-green-700 dark:text-green-400">

                      IS: Taux {corporateTaxRate}%

                    </span>

                  </div>

                  <div className="flex items-center gap-2 text-sm">

                    <CheckCircle className="h-4 w-4 text-green-500" />

                    <span className="text-green-700 dark:text-green-400">

                      Export: Formats {countryCode === 'FR' ? 'FEC' : 'comptables'} disponibles

                    </span>

                  </div>

                </div>

              </div>

              <div className="space-y-3">

                <h3 className="font-semibold text-blue-900 mb-3 dark:text-blue-100">Actions Rapides</h3>

                <div className="grid grid-cols-2 gap-2">

                  <Button

                    onClick={handleCalculateVAT}

                    variant="outline"

                    size="sm"

                    className="flex items-center gap-2"

                  >

                    <Receipt className="h-4 w-4" />

                    Calc. TVA

                  </Button>

                  <Button

                    onClick={() => calculateCorporateTax(selectedPeriod)}

                    variant="outline"

                    size="sm"

                    className="flex items-center gap-2"

                  >

                    <Building2 className="h-4 w-4" />

                    Calc. IS

                  </Button>

                  <Button

                    onClick={() => handleExportTaxData('pdf')}

                    variant="outline"

                    size="sm"

                    className="flex items-center gap-2"

                  >

                    <Download className="h-4 w-4" />

                    Export

                  </Button>

                  <Button

                    onClick={autoConfigureObligations}

                    variant="outline"

                    size="sm"

                    className="flex items-center gap-2"

                  >

                    <Calculator className="h-4 w-4" />

                    Config

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



      {/* Déclarations disponibles pour le pays */}

      <Card>

        <CardHeader>

          <CardTitle className="flex items-center gap-2">

            <FileText className="h-5 w-5" />

            Déclarations Obligatoires - {countryName}

          </CardTitle>

          <p className="text-sm text-gray-600 dark:text-gray-400">

            Déclarations fiscales requises selon la réglementation de {countryName}

          </p>

        </CardHeader>

        <CardContent>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {availableDeclarations.map((declaration) => (

              <Card key={declaration.id} className="border border-gray-200 dark:border-gray-600">

                <CardHeader className="pb-3">

                  <div className="flex items-center gap-2">

                    {getTypeIcon(declaration.id)}

                    <CardTitle className="text-lg">{declaration.name}</CardTitle>

                  </div>

                </CardHeader>

                <CardContent>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">

                    {declaration.description}

                  </p>

                  <div className="space-y-2">

                    <div className="text-sm">

                      <span className="text-gray-500 dark:text-gray-400">Fréquence:</span>

                      <span className="ml-2 font-medium">

                        {declaration.frequency === 'monthly' ? 'Mensuelle' :

                         declaration.frequency === 'quarterly' ? 'Trimestrielle' :

                         declaration.frequency === 'annual' ? 'Annuelle' : declaration.frequency}

                      </span>

                    </div>

                    <div className="text-sm">

                      <span className="text-gray-500 dark:text-gray-400">Échéance:</span>

                      <span className="ml-2 font-medium">{declaration.deadline}</span>

                    </div>

                  </div>

                  <Button

                    onClick={() => handleGenerateDeclaration(declaration.id)}

                    className="w-full mt-4"

                    disabled={loading}

                  >

                    <Calculator className="h-4 w-4 mr-2" />

                    Générer {declaration.name}

                  </Button>

                </CardContent>

              </Card>

            ))}

          </div>

        </CardContent>

      </Card>



      {/* Statut d'intégration avec les modules */}

      <Card>

        <CardHeader>

          <CardTitle>Intégration Modules</CardTitle>

          <p className="text-sm text-gray-600 dark:text-gray-400">

            Statut de synchronisation avec les autres modules CassKai

          </p>

        </CardHeader>

        <CardContent>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {Object.entries(integrationStatus).map(([moduleKey, status]) => {

              const moduleLabels: Record<string, string> = {

                accounting: t('tax.modules.accounting'),

                invoicing: t('tax.modules.invoicing'),

                banking: t('tax.modules.banking'),

                hr: t('tax.modules.hr')

              };



              const moduleLabel = moduleLabels[moduleKey] || moduleKey;

              const statusLabel = status

                ? t('tax.modules.syncStatus.synced')

                : t('tax.modules.syncStatus.pending');



              return (

                <div

                  key={moduleKey}

                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700"

                >

                  <div className="flex items-center gap-3">

                    {status ? (

                      <CheckCircle className="h-5 w-5 text-green-500" />

                    ) : (

                      <AlertTriangle className="h-5 w-5 text-yellow-500" />

                    )}

                    <div>

                      <span className="font-medium text-gray-900 dark:text-gray-100">

                        {moduleLabel}

                      </span>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">

                        {status

                          ? t(`tax.modules.tooltips.${moduleKey}.synced`)

                          : t(`tax.modules.tooltips.${moduleKey}.pending`)

                        }

                      </p>

                    </div>

                  </div>



                  <div className="flex items-center gap-2">

                    <Badge

                      variant={status ? 'default' : 'secondary'}

                      className={status

                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'

                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'

                      }

                    >

                      {statusLabel}

                    </Badge>



                    {!status && (

                      <Button

                        size="sm"

                        variant="outline"

                        onClick={() => syncWithModules(selectedPeriod)}

                        disabled={loading}

                        className="h-7 px-2"

                      >

                        <Calendar className="h-3 w-3 mr-1" />

                        {t('tax.modules.syncButton')}

                      </Button>

                    )}

                  </div>

                </div>

              );

            })}

          </div>



          {/* Message d'aide si des modules sont en attente */}

          {Object.values(integrationStatus).some(status => !status) && (

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">

              <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">

                <Sparkles className="h-4 w-4" />

                {t('tax.modules.pendingHelp')}

              </p>

            </div>

          )}

        </CardContent>

      </Card>



      {/* Export et rapports */}

      <Card>

        <CardHeader>

          <CardTitle className="flex items-center gap-2">

            <Download className="h-5 w-5" />

            Exports et Rapports

          </CardTitle>

          <p className="text-sm text-gray-600 dark:text-gray-400">

            Exportation des données fiscales selon les standards {countryName.toLowerCase()}

          </p>

        </CardHeader>

        <CardContent>

          <div className="flex flex-wrap gap-2">

            <Button

              onClick={() => handleExportTaxData('pdf')}

              variant="outline"

              size="sm"

              disabled={loading}

            >

              <Download className="h-4 w-4 mr-2" />

              Export PDF

            </Button>

            <Button

              onClick={() => handleExportTaxData('excel')}

              variant="outline"

              size="sm"

              disabled={loading}

            >

              <Download className="h-4 w-4 mr-2" />

              Export Excel

            </Button>

            <Button

              onClick={() => handleExportTaxData('csv')}

              variant="outline"

              size="sm"

              disabled={loading}

            >

              <Download className="h-4 w-4 mr-2" />

              Export CSV

            </Button>

          </div>

        </CardContent>

      </Card>



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

                    {declaration.validationErrors && declaration.validationErrors.length > 0 && (

                      <Badge variant="outline" className="text-red-600 border-red-600 dark:text-red-400">

                        {declaration.validationErrors.length} erreur(s)

                      </Badge>

                    )}

                    <Button

                      size="sm"

                      variant="outline"

                      onClick={() => handleDownloadDeclarationRegulatoryPdf(declaration.id)}

                      disabled={loading}

                      className="h-7 px-2"

                      title="Télécharger PDF réglementaire (brouillon)"

                    >

                      <Download className="h-3 w-3 mr-1" />

                      PDF

                    </Button>

                    <Button

                      size="sm"

                      variant="outline"

                      onClick={() => handleDownloadDeclarationRegulatoryXml(declaration.id)}

                      disabled={loading}

                      className="h-7 px-2"

                      title="Télécharger XML draft"

                    >

                      <Download className="h-3 w-3 mr-1" />

                      XML

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
