/**
 * CassKai - Simulateur de Prêt Professionnel
 * Calcul de mensualités et tableau d'amortissement
 */
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  TrendingDown,
  Download,
  Calendar,
  DollarSign,
  Percent,
  BarChart3,
  FileText,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { cn, formatCurrency } from '@/lib/utils';
import { logger } from '@/lib/logger';
interface AmortizationLine {
  period: number;
  date: Date;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}
interface LoanSimulationResult {
  loanAmount: number;
  annualRate: number;
  durationMonths: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  amortizationSchedule: AmortizationLine[];
}
const LoanSimulator: React.FC = () => {
  // Paramètres du prêt
  const [loanAmount, setLoanAmount] = useState<number>(100000);
  const [annualRate, setAnnualRate] = useState<number>(3.5);
  const [durationYears, setDurationYears] = useState<number>(7);
  const [amortizationType, setAmortizationType] = useState<'constant' | 'declining'>('constant');
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  // Calcul du prêt
  const loanResult = useMemo((): LoanSimulationResult | null => {
    if (loanAmount <= 0 || annualRate < 0 || durationYears <= 0) {
      return null;
    }
    const durationMonths = durationYears * 12;
    const monthlyRate = annualRate / 100 / 12;
    const startDateObj = new Date(startDate);
    let monthlyPayment: number;
    const amortizationSchedule: AmortizationLine[] = [];
    if (amortizationType === 'constant') {
      // Mensualités constantes (annuités)
      monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, durationMonths)) /
                      (Math.pow(1 + monthlyRate, durationMonths) - 1);
      let remainingBalance = loanAmount;
      for (let i = 1; i <= durationMonths; i++) {
        const interest = remainingBalance * monthlyRate;
        const principal = monthlyPayment - interest;
        remainingBalance = Math.max(0, remainingBalance - principal);
        const paymentDate = new Date(startDateObj);
        paymentDate.setMonth(paymentDate.getMonth() + i);
        amortizationSchedule.push({
          period: i,
          date: paymentDate,
          payment: monthlyPayment,
          principal,
          interest,
          remainingBalance
        });
      }
    } else {
      // Amortissement constant (capital constant)
      const constantPrincipal = loanAmount / durationMonths;
      let remainingBalance = loanAmount;
      for (let i = 1; i <= durationMonths; i++) {
        const interest = remainingBalance * monthlyRate;
        const payment = constantPrincipal + interest;
        remainingBalance = Math.max(0, remainingBalance - constantPrincipal);
        const paymentDate = new Date(startDateObj);
        paymentDate.setMonth(paymentDate.getMonth() + i);
        amortizationSchedule.push({
          period: i,
          date: paymentDate,
          payment,
          principal: constantPrincipal,
          interest,
          remainingBalance
        });
      }
      // Mensualité moyenne
      monthlyPayment = amortizationSchedule.reduce((sum, line) => sum + line.payment, 0) / durationMonths;
    }
    const totalPayment = amortizationSchedule.reduce((sum, line) => sum + line.payment, 0);
    const totalInterest = totalPayment - loanAmount;
    return {
      loanAmount,
      annualRate,
      durationMonths,
      monthlyPayment,
      totalPayment,
      totalInterest,
      amortizationSchedule
    };
  }, [loanAmount, annualRate, durationYears, amortizationType, startDate]);
  // Export PDF (placeholder)
  const exportToPDF = () => {
    logger.debug('LoanSimulator', 'Export PDF - Fonctionnalité à venir');
  };
  // Export Excel (placeholder)
  const exportToExcel = () => {
    logger.debug('LoanSimulator', 'Export Excel - Fonctionnalité à venir');
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <Calculator className="w-8 h-8 text-purple-600" />
            <span>Simulateur de Prêt Professionnel</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Calculez vos mensualités et visualisez votre tableau d'amortissement
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportToPDF} className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </Button>
          <Button variant="outline" onClick={exportToExcel} className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Excel</span>
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORMULAIRE */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Paramètres du prêt</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Montant */}
            <div className="space-y-2">
              <Label htmlFor="loanAmount" className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4" />
                <span>Montant emprunté (€)</span>
              </Label>
              <Input
                id="loanAmount"
                type="number"
                min="1000"
                step="1000"
                value={loanAmount || ''}
                onChange={(e) => setLoanAmount(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 100000"
              />
            </div>
            {/* Taux d'intérêt */}
            <div className="space-y-2">
              <Label htmlFor="annualRate" className="flex items-center space-x-1">
                <Percent className="w-4 h-4" />
                <span>Taux annuel (%)</span>
              </Label>
              <Input
                id="annualRate"
                type="number"
                min="0"
                max="20"
                step="0.1"
                value={annualRate || ''}
                onChange={(e) => setAnnualRate(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 3.5"
              />
            </div>
            {/* Durée */}
            <div className="space-y-2">
              <Label htmlFor="durationYears" className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Durée (années)</span>
              </Label>
              <Input
                id="durationYears"
                type="number"
                min="1"
                max="30"
                step="1"
                value={durationYears || ''}
                onChange={(e) => setDurationYears(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 7"
              />
              <p className="text-xs text-gray-500">
                Soit {durationYears * 12} mensualités
              </p>
            </div>
            {/* Type d'amortissement */}
            <div className="space-y-2">
              <Label htmlFor="amortizationType">Type d'amortissement</Label>
              <Select
                value={amortizationType}
                onValueChange={(value: any) => setAmortizationType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="constant">Mensualités constantes (annuités)</SelectItem>
                  <SelectItem value="declining">Amortissement constant</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {amortizationType === 'constant'
                  ? 'Mensualités identiques chaque mois'
                  : 'Capital constant, mensualités décroissantes'}
              </p>
            </div>
            {/* Date de début */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            {/* Information */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Les calculs sont indicatifs. Consultez votre banque pour une simulation personnalisée incluant les frais de dossier et l'assurance emprunteur.
              </p>
            </div>
          </CardContent>
        </Card>
        {/* RÉSULTATS */}
        <div className="lg:col-span-2 space-y-6">
          {!loanResult ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center space-y-4 py-12">
                <Calculator className="w-16 h-16 text-gray-300 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">
                    Remplissez les paramètres
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Les résultats apparaîtront ici
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Résumé */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Résumé du prêt</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Mensualité */}
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                        {amortizationType === 'constant' ? 'Mensualité' : 'Mensualité moyenne'}
                      </p>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                        {formatCurrency(loanResult.monthlyPayment)}
                      </p>
                    </div>
                    {/* Coût total */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Coût total</p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {formatCurrency(loanResult.totalPayment)}
                      </p>
                    </div>
                    {/* Intérêts totaux */}
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">Intérêts totaux</p>
                      <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                        {formatCurrency(loanResult.totalInterest)}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {((loanResult.totalInterest / loanResult.loanAmount) * 100).toFixed(1)}% du capital
                      </p>
                    </div>
                    {/* Durée */}
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">Durée</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {durationYears} ans
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {loanResult.durationMonths} mois
                      </p>
                    </div>
                  </div>
                  {/* Graphique simple (texte) */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Répartition Capital / Intérêts
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Capital</span>
                          <span className="font-medium">{formatCurrency(loanResult.loanAmount)}</span>
                        </div>
                        <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{
                              width: `${(loanResult.loanAmount / loanResult.totalPayment) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Intérêts</span>
                          <span className="font-medium">{formatCurrency(loanResult.totalInterest)}</span>
                        </div>
                        <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                          <div
                            className="h-full bg-red-500"
                            style={{
                              width: `${(loanResult.totalInterest / loanResult.totalPayment) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Tableau d'amortissement */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingDown className="w-5 h-5" />
                      <span>Tableau d'amortissement</span>
                      <Badge variant="secondary">{loanResult.amortizationSchedule.length} lignes</Badge>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                        <tr>
                          <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-300">Mois</th>
                          <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-300">Date</th>
                          <th className="text-right p-3 font-medium text-gray-700 dark:text-gray-300">Mensualité</th>
                          <th className="text-right p-3 font-medium text-gray-700 dark:text-gray-300">Capital</th>
                          <th className="text-right p-3 font-medium text-gray-700 dark:text-gray-300">Intérêts</th>
                          <th className="text-right p-3 font-medium text-gray-700 dark:text-gray-300">Reste dû</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {loanResult.amortizationSchedule.map((line, index) => (
                          <tr
                            key={index}
                            className={cn(
                              "hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                              index % 12 === 0 && index > 0 && "border-t-2 border-purple-200 dark:border-purple-800"
                            )}
                          >
                            <td className="p-3 text-gray-900 dark:text-white font-medium">
                              {line.period}
                              {line.period % 12 === 0 && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Année {line.period / 12}
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 text-gray-600 dark:text-gray-400">
                              {line.date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                            </td>
                            <td className="p-3 text-right font-medium text-gray-900 dark:text-white">
                              {formatCurrency(line.payment)}
                            </td>
                            <td className="p-3 text-right text-green-600 dark:text-green-400">
                              {formatCurrency(line.principal)}
                            </td>
                            <td className="p-3 text-right text-red-600 dark:text-red-400">
                              {formatCurrency(line.interest)}
                            </td>
                            <td className="p-3 text-right font-medium text-gray-900 dark:text-white">
                              {formatCurrency(line.remainingBalance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 dark:bg-gray-800 border-t-2 font-bold">
                        <tr>
                          <td className="p-3 text-gray-900 dark:text-white" colSpan={2}>TOTAL</td>
                          <td className="p-3 text-right text-gray-900 dark:text-white">
                            {formatCurrency(loanResult.totalPayment)}
                          </td>
                          <td className="p-3 text-right text-green-600 dark:text-green-400">
                            {formatCurrency(loanResult.loanAmount)}
                          </td>
                          <td className="p-3 text-right text-red-600 dark:text-red-400">
                            {formatCurrency(loanResult.totalInterest)}
                          </td>
                          <td className="p-3 text-right text-gray-900 dark:text-white">-</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
export default LoanSimulator;