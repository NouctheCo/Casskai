/**
 * Panneau de calcul et affichage des RFA (Remises de Fin d'Année)
 * Affiche les KPIs globaux et détails par contrat avec projections
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { rfaCalculationService, ContractRFAData } from '@/services/rfaCalculationService';
import {
  TrendingUp, Calculator, Calendar, FileText,
  DollarSign, Target, Clock, ArrowRight,
  ChevronDown, ChevronUp, RefreshCw,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const RFACalculationsPanel: React.FC = () => {
  const { currentCompany } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contractsData, setContractsData] = useState<ContractRFAData[]>([]);
  const [expandedContract, setExpandedContract] = useState<string | null>(null);
  const [selectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (currentCompany?.id) {
      loadData();
    }
  }, [currentCompany?.id, selectedYear]);

  const loadData = async () => {
    if (!currentCompany?.id) return;

    setLoading(true);
    try {
      const data = await rfaCalculationService.calculateAllContractsRFA(currentCompany.id);
      setContractsData(data);
    } catch (error) {
      console.error('Erreur chargement RFA:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Totaux globaux
  const totals = {
    currentRevenue: contractsData.reduce((sum, c) => sum + c.currentRevenue, 0),
    projectedEndOfYear: contractsData.reduce((sum, c) => sum + c.projectedRevenue.endOfYear, 0),
    rfaCurrent: contractsData.reduce((sum, c) => sum + c.rfa.current, 0),
    rfaProjected: contractsData.reduce((sum, c) => sum + c.rfa.projectedEndOfYear, 0),
    pendingQuotes: contractsData.reduce((sum, c) => sum + c.pendingQuotes.total, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3">Calcul des RFA en cours...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec KPIs globaux */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
              <DollarSign className="h-4 w-4" />
              CA Actuel
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totals.currentRevenue)}</div>
            <div className="text-xs text-blue-200 mt-1">Facturé à date</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-100 text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              CA Projeté Fin {selectedYear}
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totals.projectedEndOfYear)}</div>
            <div className="text-xs text-purple-200 mt-1">Prorata + Devis</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-100 text-sm mb-1">
              <Calculator className="h-4 w-4" />
              RFA à Date
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totals.rfaCurrent)}</div>
            <div className="text-xs text-green-200 mt-1">Sur CA actuel</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-100 text-sm mb-1">
              <Target className="h-4 w-4" />
              RFA Projetée Fin {selectedYear}
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totals.rfaProjected)}</div>
            <div className="text-xs text-orange-200 mt-1">Estimation</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-600 to-gray-700 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-300 text-sm mb-1">
              <FileText className="h-4 w-4" />
              Devis en Attente
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totals.pendingQuotes)}</div>
            <div className="text-xs text-gray-300 mt-1">
              {contractsData.reduce((sum, c) => sum + c.pendingQuotes.count, 0)} devis
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des contrats avec détails */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Détail par Contrat</CardTitle>
          <Button
            onClick={loadData}
            variant="ghost"
            size="sm"
            title="Rafraîchir"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {contractsData.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-300">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun contrat actif avec calcul RFA</p>
            </div>
          ) : (
            <div className="divide-y">
              {contractsData.map((data) => (
                <ContractRFARow
                  key={data.contract.id}
                  data={data}
                  isExpanded={expandedContract === data.contract.id}
                  onToggle={() => setExpandedContract(
                    expandedContract === data.contract.id ? null : data.contract.id
                  )}
                  formatCurrency={formatCurrency}
                  formatPercent={formatPercent}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Légende / Explication */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2 mb-2">
            <Info className="h-4 w-4" />
            Méthodologie de calcul
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• <strong>CA Actuel</strong> : Somme des factures validées depuis le début du contrat</li>
            <li>• <strong>CA Projeté</strong> : CA actuel extrapolé au prorata temporis + devis pondérés par le taux de conversion historique</li>
            <li>• <strong>RFA</strong> : Calculée selon le barème progressif défini dans chaque contrat</li>
            <li>• <strong>Projection Fin d'Année</strong> : Basée sur le rythme de facturation quotidien moyen</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

// Composant pour une ligne de contrat
const ContractRFARow: React.FC<{
  data: ContractRFAData;
  isExpanded: boolean;
  onToggle: () => void;
  formatCurrency: (n: number) => string;
  formatPercent: (n: number) => string;
}> = ({ data, isExpanded, onToggle, formatCurrency, formatPercent }) => {

  return (
    <div>
      {/* Ligne principale */}
      <div
        className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors dark:bg-gray-900/30"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="p-1">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <div>
              <div className="font-medium">{data.contract.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-300">{data.contract.client_name}</div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            {/* Progression */}
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-300 mb-1">Avancement</div>
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(data.periodProgress.percentage, 100)}%` }}
                />
              </div>
              <div className="text-xs mt-1">{formatPercent(data.periodProgress.percentage)}</div>
            </div>

            {/* CA Actuel */}
            <div className="text-center min-w-[100px]">
              <div className="text-xs text-gray-500 dark:text-gray-300">CA Actuel</div>
              <div className="font-semibold">{formatCurrency(data.currentRevenue)}</div>
            </div>

            {/* CA Projeté */}
            <div className="text-center min-w-[100px]">
              <div className="text-xs text-gray-500 dark:text-gray-300">CA Projeté</div>
              <div className="font-semibold text-purple-600">
                {formatCurrency(data.projectedRevenue.endOfYear)}
              </div>
            </div>

            {/* RFA Actuelle */}
            <div className="text-center min-w-[100px]">
              <div className="text-xs text-gray-500 dark:text-gray-300">RFA à Date</div>
              <div className="font-semibold text-green-600">
                {formatCurrency(data.rfa.current)}
              </div>
            </div>

            {/* RFA Projetée */}
            <div className="text-center min-w-[100px]">
              <div className="text-xs text-gray-500 dark:text-gray-300">RFA Projetée</div>
              <div className="font-semibold text-orange-600">
                {formatCurrency(data.rfa.projectedEndOfYear)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Détails étendus */}
      {isExpanded && (
        <div className="px-4 py-4 bg-gray-50 dark:bg-gray-900 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Colonne 1 : Données actuelles */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Chiffre d'Affaires
              </h4>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-300">CA Facturé</span>
                  <span className="font-medium">{formatCurrency(data.invoicedAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-300">CA Encaissé</span>
                  <span className="font-medium">{formatCurrency(data.paidAmount)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-300">Devis en attente</span>
                  <span className="font-medium">{formatCurrency(data.pendingQuotes.total)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 dark:text-gray-500">
                    ({data.pendingQuotes.count} devis × {formatPercent(data.pendingQuotes.conversionRate * 100)} conversion)
                  </span>
                  <span className="text-purple-600">
                    ≈ {formatCurrency(data.pendingQuotes.weightedAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Colonne 2 : Projections */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Projections
              </h4>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-300">Prorata temporis</span>
                  <span className="font-medium">{formatCurrency(data.projectedRevenue.prorata)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-300">+ Devis pondérés</span>
                  <span className="font-medium">{formatCurrency(data.projectedRevenue.withQuotes)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-sm font-medium">Fin d'année {new Date().getFullYear()}</span>
                  <span className="font-bold text-purple-600">
                    {formatCurrency(data.projectedRevenue.endOfYear)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Fin de contrat</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(data.projectedRevenue.endOfContract)}
                  </span>
                </div>
              </div>
            </div>

            {/* Colonne 3 : Barème RFA */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Calcul RFA
              </h4>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 dark:text-gray-300">
                      <th className="text-left pb-2">Tranche</th>
                      <th className="text-right pb-2">Taux</th>
                      <th className="text-right pb-2">RFA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bracketDetails.map((detail, i) => (
                      <tr key={i}>
                        <td className="py-1">{detail.bracket}</td>
                        <td className="text-right">{detail.rate}%</td>
                        <td className="text-right font-medium">{formatCurrency(detail.rfa)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-semibold">
                      <td colSpan={2} className="pt-2">Total RFA</td>
                      <td className="text-right pt-2 text-green-600">
                        {formatCurrency(data.rfa.current)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Comparaison RFA */}
              <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 text-sm">
                <span className="text-orange-700 dark:text-orange-300">RFA projetée fin d'année :</span>
                <span className="font-bold text-orange-600">
                  {formatCurrency(data.rfa.projectedEndOfYear)}
                </span>
              </div>
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-sm">
                <span className="text-blue-700 dark:text-blue-300">RFA projetée fin contrat :</span>
                <span className="font-bold text-blue-600">
                  {formatCurrency(data.rfa.projectedEndOfContract)}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline du contrat */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span className="text-gray-500 dark:text-gray-300">Début:</span>
                <span className="font-medium">
                  {data.contract.start_date.toLocaleDateString('fr-FR')}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300" />
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span className="text-gray-500 dark:text-gray-300">Aujourd'hui:</span>
                <span className="font-medium">
                  {data.periodProgress.daysElapsed} jours écoulés
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300" />
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span className="text-gray-500 dark:text-gray-300">Fin:</span>
                <span className="font-medium">
                  {data.contract.end_date.toLocaleDateString('fr-FR')}
                </span>
                <span className="text-gray-400 dark:text-gray-500">
                  ({data.periodProgress.totalDays - data.periodProgress.daysElapsed} jours restants)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
