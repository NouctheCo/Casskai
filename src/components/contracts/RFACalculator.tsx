/**

 * Calculateur et simulateur RFA avec visualisations

 * Réutilise les composants graphiques existants de l'application

 */



import React, { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

import { Button } from '../ui/button';

import { Input } from '../ui/input';

import { Label } from '../ui/label';

import { Badge } from '../ui/badge';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

import { useToast } from '../ui/use-toast';

import { useCurrency } from '../../hooks/useCurrency';

import { useRFASimulation } from '../../hooks/useContracts';

import { contractsService } from '../../services/contractsService';

import { AmountDisplay } from '../currency/AmountDisplay';

import {

  ContractData,

  TurnoverScenario,

  SimulationResult,

  RFATierBreakdown

} from '../../types/contracts.types';

import {

  Calculator,

  TrendingUp,

  BarChart3,

  Target,

  Play,

  Download,

  Info

} from 'lucide-react';

import {

  ResponsiveContainer,

  BarChart,

  Bar,

  XAxis,

  YAxis,

  CartesianGrid,

  Tooltip,

  // LineChart,

  // Line,

  PieChart,

  Pie,

  Cell,

  Legend

} from 'recharts';



interface RFACalculatorProps {

  contract: ContractData;

  onClose?: () => void;

}



export const RFACalculator: React.FC<RFACalculatorProps> = ({ contract, onClose }) => {

  const { t } = useTranslation();

  const { toast } = useToast();

  const { formatAmount } = useCurrency();

  

  const [turnoverAmount, setTurnoverAmount] = useState<number>(100000);

  const [calculationResult, setCalculationResult] = useState<{

    amount: number;

    details: any;

  } | null>(null);

  

  // Simulation states

  const [scenarios, setScenarios] = useState<TurnoverScenario[]>([

    { name: 'Pessimiste', amount: 80000 },

    { name: 'Réaliste', amount: 150000 },

    { name: 'Optimiste', amount: 250000 }

  ]);

  

  const { results: simulationResults, loading: simulationLoading, runSimulation } = useRFASimulation(contract.id);



  // Calcul direct RFA

  const calculateRFA = (amount: number) => {
    // Simple calculation based on discount config
    const discountRate = contract.discount_config?.rate || 0;
    const calculatedAmount = amount * (discountRate / 100);
    const result = {
      amount: calculatedAmount,
      details: {
        breakdown: {
          baseAmount: amount,
          discountRate,
          finalAmount: calculatedAmount
        }
      }
    };

    setCalculationResult(result);

  };



  // Lancer la simulation

  const handleRunSimulation = async () => {

    await runSimulation(scenarios);

    toast({

      title: "Simulation terminée",

      description: `${scenarios.length} scénarios calculés avec succès`,

      variant: "default"

    });

  };



  // Mise à jour automatique du calcul

  useEffect(() => {

    if (turnoverAmount > 0) {

      calculateRFA(turnoverAmount);

    }

  }, [turnoverAmount, contract]);



  // Composant d'affichage des détails de calcul

  const CalculationBreakdown: React.FC<{ breakdown?: RFATierBreakdown[] }> = ({ breakdown }) => {

    if (!breakdown || breakdown.length === 0) return null;



    return (

      <div className="space-y-3">

        <h4 className="font-medium text-sm">Détail du calcul par paliers :</h4>

        <div className="space-y-2">

          {breakdown.map((tier, index) => (

            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-900/30">

              <div className="flex-1">

                <div className="flex items-center space-x-2">

                  <Badge variant="outline" className="text-xs">

                    Palier {tier.tier_index + 1}

                  </Badge>

                  <span className="text-sm">

                    {formatAmount(tier.tier_min)} - {tier.tier_max ? formatAmount(tier.tier_max) : '∞'}

                  </span>

                </div>

                <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">

                  {formatAmount(tier.tier_amount)} × {(tier.tier_rate * 100).toFixed(1)}%

                </div>

              </div>

              <div className="text-right">

                <div className="font-medium">

                  <AmountDisplay amount={tier.rfa_amount} currency={contract.currency} />

                </div>

              </div>

            </div>

          ))}

        </div>

        <div className="border-t pt-2">

          <div className="flex justify-between items-center font-semibold">

            <span>Total RFA :</span>

            <AmountDisplay 

              amount={breakdown.reduce((sum, tier) => sum + tier.rfa_amount, 0)} 

              currency={contract.currency} 

            />

          </div>

        </div>

      </div>

    );

  };



  // Graphique de comparaison des scénarios

  const ScenarioChart: React.FC<{ results: SimulationResult[] }> = ({ results }) => {

    const chartData = results.map(result => ({

      scenario: result.scenario_name,

      ca: result.turnover_amount,

      rfa: result.rfa_amount,

      taux: (result.effective_rate * 100).toFixed(2)

    }));



    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];



    return (

      <div className="space-y-6">

        {/* Graphique en barres */}

        <Card>

          <CardHeader>

            <CardTitle className="text-lg">Comparaison des scénarios</CardTitle>

          </CardHeader>

          <CardContent>

            <ResponsiveContainer width="100%" height={300}>

              <BarChart data={chartData}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="scenario" />

                <YAxis />

                <Tooltip 

                  formatter={(value: any, name: string) => [

                    name === 'ca' || name === 'rfa' ? formatAmount(value) : `${value}%`,

                    name === 'ca' ? 'CA' : name === 'rfa' ? 'RFA' : 'Taux'

                  ]}

                />

                <Bar dataKey="ca" fill="#8884d8" name="Chiffre d'affaires" />

                <Bar dataKey="rfa" fill="#82ca9d" name="RFA" />

              </BarChart>

            </ResponsiveContainer>

          </CardContent>

        </Card>



        {/* Graphique circulaire de répartition */}

        <Card>

          <CardHeader>

            <CardTitle className="text-lg">Répartition RFA par scénario</CardTitle>

          </CardHeader>

          <CardContent>

            <ResponsiveContainer width="100%" height={300}>

              <PieChart>

                <Pie

                  data={chartData}

                  cx="50%"

                  cy="50%"

                  labelLine={false}

                  label={({ scenario, rfa }) => `${scenario}: ${formatAmount(rfa)}`}

                  outerRadius={80}

                  fill="#8884d8"

                  dataKey="rfa"

                >

                  {chartData.map((entry, index) => (

                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />

                  ))}

                </Pie>

                <Tooltip formatter={(value: any) => formatAmount(value)} />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          </CardContent>

        </Card>

      </div>

    );

  };



  return (

    <div className="max-w-6xl mx-auto space-y-6">

      {/* En-tête */}

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold flex items-center">

            <Calculator className="h-6 w-6 mr-2" />

            {t('contracts.calculator.title', 'Calculateur RFA')}

          </h2>

          <p className="text-gray-600 dark:text-gray-300 mt-1">

            {contract.contract_name} - {contract.client_name}

          </p>

        </div>

        {onClose && (

          <Button variant="outline" onClick={onClose}>

            Fermer

          </Button>

        )}

      </div>



      <Tabs defaultValue="calculator" className="w-full">

        <TabsList className="grid w-full grid-cols-2">

          <TabsTrigger value="calculator" className="flex items-center">

            <Calculator className="h-4 w-4 mr-2" />

            {t('contracts.calculator.single', 'Calcul simple')}

          </TabsTrigger>

          <TabsTrigger value="simulation" className="flex items-center">

            <BarChart3 className="h-4 w-4 mr-2" />

            {t('contracts.calculator.simulation', 'Simulation scénarios')}

          </TabsTrigger>

        </TabsList>



        {/* Onglet Calcul simple */}

        <TabsContent value="calculator" className="space-y-6">

          <div className="grid gap-6 md:grid-cols-2">

            {/* Configuration du contrat */}

            <Card>

              <CardHeader>

                <CardTitle className="flex items-center">

                  <Info className="h-5 w-5 mr-2" />

                  Configuration du contrat

                </CardTitle>

              </CardHeader>

              <CardContent className="space-y-4">

                <div>

                  <Label className="text-sm font-medium">Type de remise</Label>

                  <Badge variant="outline" className="ml-2">

                    {contract.contract_type === 'progressive' && 'Paliers progressifs'}

                    {contract.contract_type === 'fixed_percent' && 'Pourcentage fixe'}

                    {contract.contract_type === 'fixed_amount' && 'Montant fixe'}

                  </Badge>

                </div>



                {contract.discount_config.type === 'progressive' && contract.discount_config.tiers && (

                  <div>

                    <Label className="text-sm font-medium">Paliers configurés :</Label>

                    <div className="mt-2 space-y-2">

                      {contract.discount_config.tiers.map((tier, index) => (

                        <div key={index} className="text-sm p-2 bg-gray-50 rounded dark:bg-gray-900/30">

                          {formatAmount(tier.min)} - {tier.max ? formatAmount(tier.max) : '∞'} 

                          <span className="font-medium ml-2">→ {(tier.rate * 100).toFixed(1)}%</span>

                        </div>

                      ))}

                    </div>

                  </div>

                )}



                {contract.discount_config.type === 'fixed_percent' && (

                  <div>

                    <Label className="text-sm font-medium">Taux fixe :</Label>

                    <div className="text-lg font-semibold text-blue-600">

                      {((contract.discount_config.rate || 0) * 100).toFixed(2)}%

                    </div>

                  </div>

                )}



                {contract.discount_config.type === 'fixed_amount' && (

                  <div>

                    <Label className="text-sm font-medium">Montant fixe :</Label>

                    <div className="text-lg font-semibold text-blue-600">

                      <AmountDisplay amount={contract.discount_config.amount || 0} currency={contract.currency} />

                    </div>

                  </div>

                )}

              </CardContent>

            </Card>



            {/* Saisie du CA et calcul */}

            <Card>

              <CardHeader>

                <CardTitle className="flex items-center">

                  <Target className="h-5 w-5 mr-2" />

                  Calcul RFA

                </CardTitle>

              </CardHeader>

              <CardContent className="space-y-4">

                <div>

                  <Label htmlFor="turnover">Chiffre d'affaires ({contract.currency})</Label>

                  <Input

                    id="turnover"

                    type="number"

                    min="0"

                    step="1000"

                    value={turnoverAmount}

                    onChange={(e) => setTurnoverAmount(Number(e.target.value))}

                    className="text-lg"

                  />

                </div>



                {calculationResult && (

                  <div className="space-y-4">

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20">

                      <div className="flex items-center justify-between">

                        <span className="font-medium">RFA calculée :</span>

                        <span className="text-2xl font-bold text-blue-600">

                          <AmountDisplay amount={calculationResult.amount} currency={contract.currency} />

                        </span>

                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">

                        Taux effectif : {((calculationResult.amount / turnoverAmount) * 100).toFixed(2)}%

                      </div>

                    </div>



                    {/* Détail du calcul pour les paliers progressifs */}

                    {calculationResult.details.breakdown && (

                      <CalculationBreakdown breakdown={calculationResult.details.breakdown} />

                    )}

                  </div>

                )}

              </CardContent>

            </Card>

          </div>

        </TabsContent>



        {/* Onglet Simulation */}

        <TabsContent value="simulation" className="space-y-6">

          <div className="grid gap-6 lg:grid-cols-3">

            {/* Configuration des scénarios */}

            <Card className="lg:col-span-1">

              <CardHeader>

                <CardTitle className="flex items-center">

                  <TrendingUp className="h-5 w-5 mr-2" />

                  Scénarios à simuler

                </CardTitle>

              </CardHeader>

              <CardContent className="space-y-4">

                {scenarios.map((scenario, index) => (

                  <div key={index} className="space-y-2">

                    <Label className="text-sm">{scenario.name}</Label>

                    <Input

                      type="number"

                      min="0"

                      step="1000"

                      value={scenario.amount}

                      onChange={(e) => {

                        const newScenarios = [...scenarios];

                        newScenarios[index].amount = Number(e.target.value);

                        setScenarios(newScenarios);

                      }}

                    />

                  </div>

                ))}



                <Button 

                  onClick={handleRunSimulation} 

                  disabled={simulationLoading}

                  className="w-full mt-4"

                >

                  {simulationLoading ? (

                    <div className="flex items-center">

                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>

                      Simulation...

                    </div>

                  ) : (

                    <>

                      <Play className="h-4 w-4 mr-2" />

                      Lancer la simulation

                    </>

                  )}

                </Button>

              </CardContent>

            </Card>



            {/* Résultats de simulation */}

            <div className="lg:col-span-2">

              {simulationResults.length > 0 ? (

                <div className="space-y-6">

                  {/* Tableau des résultats */}

                  <Card>

                    <CardHeader>

                      <CardTitle className="flex items-center justify-between">

                        Résultats de simulation

                        <Button variant="outline" size="sm">

                          <Download className="h-4 w-4 mr-2" />

                          Exporter

                        </Button>

                      </CardTitle>

                    </CardHeader>

                    <CardContent>

                      <div className="space-y-3">

                        {simulationResults.map((result, index) => (

                          <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 dark:bg-gray-900/30">

                            <div className="flex items-center justify-between">

                              <div className="flex items-center space-x-3">

                                <Badge variant={

                                  result.scenario_name === 'Pessimiste' ? 'destructive' :

                                  result.scenario_name === 'Optimiste' ? 'default' : 'secondary'

                                }>

                                  {result.scenario_name}

                                </Badge>

                                <div className="text-sm text-gray-600 dark:text-gray-300">

                                  CA: <AmountDisplay amount={result.turnover_amount} currency={contract.currency} />

                                </div>

                              </div>

                              <div className="text-right">

                                <div className="font-semibold text-lg">

                                  <AmountDisplay amount={result.rfa_amount} currency={contract.currency} />

                                </div>

                                <div className="text-sm text-gray-500 dark:text-gray-300">

                                  {(result.effective_rate * 100).toFixed(2)}%

                                </div>

                              </div>

                            </div>

                          </div>

                        ))}

                      </div>

                    </CardContent>

                  </Card>



                  {/* Graphiques */}

                  <ScenarioChart results={simulationResults} />

                </div>

              ) : (

                <Card>

                  <CardContent className="py-12 text-center">

                    <BarChart3 className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />

                    <p className="text-gray-500 dark:text-gray-300">

                      Cliquez sur "Lancer la simulation" pour voir les résultats

                    </p>

                  </CardContent>

                </Card>

              )}

            </div>

          </div>

        </TabsContent>

      </Tabs>

    </div>

  );

};
