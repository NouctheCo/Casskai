/**
 * CassKai - Calculateur de Pénalités de Retard
 * Composant pour calculer les pénalités et générer des lettres de relance
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  Calendar,
  Euro,
  AlertCircle,
  FileText,
  Download,
  Clock,
  TrendingUp,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn, getCurrentCompanyCurrency } from '@/lib/utils';
import { logger } from '@/lib/logger';
interface LateFeeResult {
  invoiceAmount: number;
  dueDate: Date;
  calculationDate: Date;
  daysLate: number;
  interestRate: number;
  dailyInterestRate: number;
  penaltyAmount: number;
  fixedIndemnity: number;
  totalAmount: number;
}
export const LateFeeCalculator: React.FC<{
  invoiceId?: string;
  initialAmount?: number;
  initialDueDate?: string;
  className?: string;
}> = ({ initialAmount, initialDueDate, className }) => {
  const [invoiceAmount, setInvoiceAmount] = useState<number>(initialAmount || 0);
  const [dueDate, setDueDate] = useState<string>(initialDueDate || '');
  const [calculationDate, setCalculationDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [interestRate, setInterestRate] = useState<number>(10.5); // Taux légal France 2025
  const [result, setResult] = useState<LateFeeResult | null>(null);
  // Calcule les pénalités
  const calculatePenalties = () => {
    if (!invoiceAmount || !dueDate) {
      logger.warn('LateFeeCalculator', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    const due = new Date(dueDate);
    const calc = new Date(calculationDate);
    // Nombre de jours de retard
    const diffTime = calc.getTime() - due.getTime();
    const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysLate <= 0) {
      logger.warn('LateFeeCalculator', 'La date de calcul doit être postérieure à la date d\'échéance');
      return;
    }
    // Taux d'intérêt journalier
    const dailyRate = interestRate / 365 / 100;
    // Pénalités de retard
    const penaltyAmount = invoiceAmount * dailyRate * daysLate;
    // Indemnité forfaitaire (40€ pour la France)
    const fixedIndemnity = 40;
    // Total
    const totalAmount = invoiceAmount + penaltyAmount + fixedIndemnity;
    setResult({
      invoiceAmount,
      dueDate: due,
      calculationDate: calc,
      daysLate,
      interestRate,
      dailyInterestRate: dailyRate * 100,
      penaltyAmount,
      fixedIndemnity,
      totalAmount
    });
  };
  // Formate une devise
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: getCurrentCompanyCurrency(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  // Génère une lettre de relance (placeholder)
  const generateReminderLetter = () => {
    if (!result) return;
    logger.debug('LateFeeCalculator', 'Génération de la lettre de relance - Fonctionnalité à venir');
  };
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-red-600" />
          <span>Calculateur de Pénalités de Retard</span>
        </CardTitle>
        <CardDescription>
          Calculez les pénalités légales pour factures impayées (France)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulaire */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Montant facture */}
          <div className="space-y-2">
            <Label htmlFor="invoiceAmount" className="flex items-center space-x-1">
              <Euro className="w-4 h-4" />
              <span>Montant de la facture TTC (€)</span>
            </Label>
            <Input
              id="invoiceAmount"
              type="number"
              min="0"
              step="0.01"
              value={invoiceAmount || ''}
              onChange={(e) => setInvoiceAmount(parseFloat(e.target.value) || 0)}
              placeholder="Ex: 1500.00"
            />
          </div>
          {/* Date d'échéance */}
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Date d'échéance</span>
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          {/* Date de calcul */}
          <div className="space-y-2">
            <Label htmlFor="calculationDate" className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>Date de calcul</span>
            </Label>
            <Input
              id="calculationDate"
              type="date"
              value={calculationDate}
              onChange={(e) => setCalculationDate(e.target.value)}
            />
          </div>
          {/* Taux d'intérêt */}
          <div className="space-y-2">
            <Label htmlFor="interestRate" className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>Taux d'intérêt annuel (%)</span>
            </Label>
            <Input
              id="interestRate"
              type="number"
              min="0"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
              placeholder="Ex: 10.5"
            />
            <p className="text-xs text-gray-500">
              Taux légal France : 10,5% (Taux BCE + 10 points)
            </p>
          </div>
        </div>
        {/* Bouton de calcul */}
        <Button
          className="w-full"
          size="lg"
          onClick={calculatePenalties}
          disabled={!invoiceAmount || !dueDate}
        >
          <Calculator className="w-4 h-4 mr-2" />
          Calculer les pénalités
        </Button>
        {/* Résultats */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 border-t pt-6"
          >
            {/* Alerte retard */}
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-700 dark:text-red-300 text-lg">
                  Facture en retard de {result.daysLate} jour{result.daysLate > 1 ? 's' : ''}
                </h4>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Échue depuis le {result.dueDate.toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            {/* Détail du calcul */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">Détail du calcul</h4>
              <div className="space-y-2">
                {/* Montant initial */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Montant de la facture TTC</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(result.invoiceAmount)}
                  </span>
                </div>
                {/* Pénalités */}
                <div className="border-l-4 border-orange-400 bg-orange-50 dark:bg-orange-900/20 p-3 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                      Pénalités de retard
                    </span>
                    <span className="font-bold text-orange-700 dark:text-orange-300">
                      {formatCurrency(result.penaltyAmount)}
                    </span>
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-400 space-y-1">
                    <p>• Taux annuel : {result.interestRate}%</p>
                    <p>• Taux journalier : {result.dailyInterestRate.toFixed(4)}%</p>
                    <p>• Formule : {formatCurrency(result.invoiceAmount)} × {result.dailyInterestRate.toFixed(4)}% × {result.daysLate} jours</p>
                  </div>
                </div>
                {/* Indemnité forfaitaire */}
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <div>
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Indemnité forfaitaire de recouvrement
                    </span>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Article L. 441-10 du Code de commerce
                    </p>
                  </div>
                  <span className="font-bold text-blue-700 dark:text-blue-300">
                    {formatCurrency(result.fixedIndemnity)}
                  </span>
                </div>
                {/* Total */}
                <div className="flex items-center justify-between p-4 bg-red-100 dark:bg-red-900/30 rounded-lg border-2 border-red-300 dark:border-red-700">
                  <div>
                    <span className="text-lg font-bold text-red-800 dark:text-red-200">
                      Montant total dû
                    </span>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Au {result.calculationDate.toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-red-800 dark:text-red-200">
                    {formatCurrency(result.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={generateReminderLetter}
                className="flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Générer lettre de relance</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  logger.debug('LateFeeCalculator', 'Export PDF - Fonctionnalité à venir');
                }}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exporter PDF</span>
              </Button>
            </div>
            {/* Information juridique */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p className="font-medium">Bases légales (France) :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Article L. 441-10 du Code de commerce :</strong> Indemnité forfaitaire obligatoire de 40€
                  </li>
                  <li>
                    <strong>Article D. 441-5 du Code de commerce :</strong> Taux légal = Taux directeur BCE semestriel + 10 points
                  </li>
                  <li>
                    Ces pénalités sont exigibles <strong>sans rappel</strong> dès le lendemain de la date d'échéance
                  </li>
                  <li>
                    Le créancier peut demander des dommages et intérêts supplémentaires si le préjudice subi dépasse 40€
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};