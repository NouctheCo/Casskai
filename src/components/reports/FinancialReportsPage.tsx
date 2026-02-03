/**
 * Page de rapports financiers - Utilise les vraies données Supabase
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  financialReportsService,
  ReportType,
  BalanceSheetData,
  IncomeStatementData,
  TrialBalanceData
} from '@/services/financialReportsService';
import {
  FileText,
  TrendingUp,
  Calculator,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Building2
} from 'lucide-react';
import { format, startOfYear, endOfYear, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SavedReport {
  id: string;
  name: string;
  type: ReportType;
  status: string;
  period_start: string;
  period_end: string;
  data: any;
  generated_at: string;
  created_at: string;
}

const reportTypes = [
  {
    type: 'balance_sheet' as ReportType,
    name: 'Bilan Comptable',
    description: 'Actif, Passif et Capitaux propres',
    icon: Building2,
    color: 'text-blue-500'
  },
  {
    type: 'income_statement' as ReportType,
    name: 'Compte de Résultat',
    description: 'Produits et Charges',
    icon: TrendingUp,
    color: 'text-green-500'
  },
  {
    type: 'trial_balance' as ReportType,
    name: 'Balance Générale',
    description: 'Tous les comptes avec débits et crédits',
    icon: Calculator,
    color: 'text-purple-500'
  }
];

const datePresets = [
  { value: 'current_month', label: 'Mois en cours', start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
  { value: 'last_month', label: 'Mois dernier', start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) },
  { value: 'current_year', label: 'Année en cours', start: startOfYear(new Date()), end: endOfYear(new Date()) },
  { value: 'custom', label: 'Personnalisé', start: null, end: null }
];

export const FinancialReportsPage: React.FC = () => {
  const { toast } = useToast();
  const { currentEnterprise } = useEnterprise();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<ReportType | null>(null);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [datePreset, setDatePreset] = useState('current_year');
  const [dateRange, setDateRange] = useState({
    start: startOfYear(new Date()).toISOString().split('T')[0],
    end: endOfYear(new Date()).toISOString().split('T')[0]
  });

  // Charger les rapports sauvegardés
  const loadSavedReports = async () => {
    if (!currentEnterprise?.id) return;

    setLoading(true);
    const { data, error } = await financialReportsService.getReports(currentEnterprise.id);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les rapports',
        variant: 'destructive'
      });
    } else {
      setSavedReports(data as SavedReport[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSavedReports();
  }, [currentEnterprise?.id]);

  // Générer un nouveau rapport
  const handleGenerateReport = async (type: ReportType) => {
    if (!currentEnterprise?.id || !user?.id) {
      toast({
        title: 'Erreur',
        description: 'Entreprise ou utilisateur non connecté',
        variant: 'destructive'
      });
      return;
    }

    setGenerating(type);

    const result = await financialReportsService.generateAndSaveReport(
      type,
      {
        companyId: currentEnterprise.id,
        startDate: dateRange.start,
        endDate: dateRange.end
      },
      user.id
    );

    setGenerating(null);

    if (result.success) {
      toast({
        title: 'Rapport généré avec succès',
        description: 'Le rapport a été généré et sauvegardé dans l\'historique',
      });
      loadSavedReports();
    } else {
      toast({
        title: 'Erreur',
        description: result.error || 'Impossible de générer le rapport',
        variant: 'destructive'
      });
    }
  };

  // Gérer le changement de période
  const handleDatePresetChange = (value: string) => {
    setDatePreset(value);
    const preset = datePresets.find(p => p.value === value);
    if (preset && preset.start && preset.end) {
      setDateRange({
        start: preset.start.toISOString().split('T')[0],
        end: preset.end.toISOString().split('T')[0]
      });
    }
  };

  // Formater une valeur monétaire
  const formatCurrency = (value: number) => {
    const currency = (currentEnterprise as any)?.default_currency || (typeof window !== 'undefined' ? (localStorage.getItem('casskai_current_company_currency') || 'EUR') : 'EUR');
    const isZero = currency === 'XOF' || currency === 'XAF';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: isZero ? 0 : 2,
      maximumFractionDigits: isZero ? 0 : 2
    }).format(value);
  };

  // Render du bilan
  const renderBalanceSheet = (data: BalanceSheetData) => (
    <div className="space-y-6">
      {/* Équilibre du bilan */}
      <Card className={data.isBalanced ? 'border-green-500' : 'border-red-500'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {data.isBalanced ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            {data.isBalanced ? 'Bilan équilibré' : 'Bilan non équilibré'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-300">Total Actif</p>
              <p className="text-2xl font-bold">{formatCurrency(data.totalAssets)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-300">Total Passif + Capitaux</p>
              <p className="text-2xl font-bold">{formatCurrency(data.totalLiabilitiesAndEquity)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ACTIF */}
        <Card>
          <CardHeader>
            <CardTitle>ACTIF</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Actifs immobilisés */}
            <div>
              <h4 className="font-semibold mb-2">Actifs Immobilisés</h4>
              {data.assets.fixed.length > 0 ? (
                <div className="space-y-1">
                  {data.assets.fixed.slice(0, 5).map((acc, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{acc.account_number} - {acc.account_name}</span>
                      <span className="font-medium">{formatCurrency(Math.abs(acc.closing_balance))}</span>
                    </div>
                  ))}
                  {data.assets.fixed.length > 5 && (
                    <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                      ... et {data.assets.fixed.length - 5} autres comptes
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-300">Aucun actif immobilisé</p>
              )}
            </div>

            {/* Actifs circulants */}
            <div>
              <h4 className="font-semibold mb-2">Actifs Circulants</h4>
              {data.assets.current.length > 0 ? (
                <div className="space-y-1">
                  {data.assets.current.slice(0, 5).map((acc, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{acc.account_number} - {acc.account_name}</span>
                      <span className="font-medium">{formatCurrency(Math.abs(acc.closing_balance))}</span>
                    </div>
                  ))}
                  {data.assets.current.length > 5 && (
                    <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                      ... et {data.assets.current.length - 5} autres comptes
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-300">Aucun actif circulant</p>
              )}
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between font-bold">
                <span>Total Actif</span>
                <span>{formatCurrency(data.assets.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PASSIF + CAPITAUX */}
        <Card>
          <CardHeader>
            <CardTitle>PASSIF & CAPITAUX</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Capitaux propres */}
            <div>
              <h4 className="font-semibold mb-2">Capitaux Propres</h4>
              {data.equity.accounts.length > 0 ? (
                <div className="space-y-1">
                  {data.equity.accounts.slice(0, 5).map((acc, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{acc.account_number} - {acc.account_name}</span>
                      <span className="font-medium">{formatCurrency(Math.abs(acc.closing_balance))}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-300">Aucun capitaux propres</p>
              )}
            </div>

            {/* Dettes */}
            <div>
              <h4 className="font-semibold mb-2">Dettes</h4>
              {data.liabilities.current.length > 0 || data.liabilities.longTerm.length > 0 ? (
                <div className="space-y-1">
                  {[...data.liabilities.longTerm, ...data.liabilities.current].slice(0, 5).map((acc, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{acc.account_number} - {acc.account_name}</span>
                      <span className="font-medium">{formatCurrency(Math.abs(acc.closing_balance))}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-300">Aucune dette</p>
              )}
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between font-bold">
                <span>Total Passif</span>
                <span>{formatCurrency(data.liabilities.total + data.equity.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Render du compte de résultat
  const renderIncomeStatement = (data: IncomeStatementData) => (
    <div className="space-y-6">
      {/* Résultat */}
      <Card className={data.netIncome >= 0 ? 'border-green-500' : 'border-red-500'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className={`h-5 w-5 ${data.netIncome >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            Résultat Net: {formatCurrency(data.netIncome)}
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* PRODUITS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">PRODUITS</CardTitle>
          </CardHeader>
          <CardContent>
            {data.revenue.accounts.length > 0 ? (
              <div className="space-y-1">
                {data.revenue.accounts.map((acc, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{acc.account_number} - {acc.account_name}</span>
                    <span className="font-medium">{formatCurrency(Math.abs(acc.closing_balance))}</span>
                  </div>
                ))}
                <div className="pt-2 border-t mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total Produits</span>
                    <span>{formatCurrency(data.revenue.total)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-300">Aucun produit enregistré</p>
            )}
          </CardContent>
        </Card>

        {/* CHARGES */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">CHARGES</CardTitle>
          </CardHeader>
          <CardContent>
            {data.expenses.accounts.length > 0 ? (
              <div className="space-y-1">
                {data.expenses.accounts.map((acc, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{acc.account_number} - {acc.account_name}</span>
                    <span className="font-medium">{formatCurrency(Math.abs(acc.closing_balance))}</span>
                  </div>
                ))}
                <div className="pt-2 border-t mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total Charges</span>
                    <span>{formatCurrency(data.expenses.total)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-300">Aucune charge enregistrée</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Render de la balance
  const renderTrialBalance = (data: TrialBalanceData) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Balance Générale
          {data.isBalanced ? (
            <Badge variant="outline" className="ml-auto text-green-600">Équilibrée</Badge>
          ) : (
            <Badge variant="outline" className="ml-auto text-red-600 dark:text-red-400">Déséquilibrée</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Compte</th>
                <th className="text-left py-2">Libellé</th>
                <th className="text-right py-2">Débit</th>
                <th className="text-right py-2">Crédit</th>
                <th className="text-right py-2">Solde</th>
              </tr>
            </thead>
            <tbody>
              {data.accounts.filter(acc => acc.debit !== 0 || acc.credit !== 0 || acc.closing_balance !== 0).map((acc, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50 dark:bg-gray-900/30">
                  <td className="py-2">{acc.account_number}</td>
                  <td className="py-2">{acc.account_name}</td>
                  <td className="text-right py-2">{acc.debit !== 0 ? formatCurrency(acc.debit) : '-'}</td>
                  <td className="text-right py-2">{acc.credit !== 0 ? formatCurrency(acc.credit) : '-'}</td>
                  <td className="text-right py-2 font-medium">{formatCurrency(acc.closing_balance)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold border-t-2">
                <td colSpan={2} className="py-2">TOTAUX</td>
                <td className="text-right py-2">{formatCurrency(data.totalDebit)}</td>
                <td className="text-right py-2">{formatCurrency(data.totalCredit)}</td>
                <td className="text-right py-2">{formatCurrency(data.totalDebit - data.totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  if (!currentEnterprise) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <p className="text-gray-600 dark:text-gray-300">Veuillez sélectionner une entreprise pour accéder aux rapports</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold">Rapports Financiers</h1>
        <p className="text-gray-600 dark:text-gray-300">Générez et consultez vos rapports comptables</p>
      </div>

      {/* Sélecteur de période */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Période de référence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Select value={datePreset} onValueChange={handleDatePresetChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {datePresets.map(preset => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div>
              <label htmlFor="financial-start-date" className="text-sm text-gray-600 dark:text-gray-300">Date de début</label>
              <input
                id="financial-start-date"
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full border rounded p-2"
              />
            </div>

            <div>
              <label htmlFor="financial-end-date" className="text-sm text-gray-600 dark:text-gray-300">Date de fin</label>
              <input
                id="financial-end-date"
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full border rounded p-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Générer un rapport</TabsTrigger>
          <TabsTrigger value="history">Historique des rapports</TabsTrigger>
        </TabsList>

        {/* Génération de rapports */}
        <TabsContent value="generate" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {reportTypes.map(reportType => {
              const Icon = reportType.icon;
              const isGenerating = generating === reportType.type;

              return (
                <Card key={reportType.type} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${reportType.color}`} />
                      {reportType.name}
                    </CardTitle>
                    <CardDescription>{reportType.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleGenerateReport(reportType.type)}
                      disabled={isGenerating || !currentEnterprise}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Générer
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Historique */}
        <TabsContent value="history" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-6 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Chargement des rapports...</p>
              </CardContent>
            </Card>
          ) : savedReports.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                <p className="text-gray-600 dark:text-gray-300">Aucun rapport généré pour le moment</p>
                <Button onClick={() => document.querySelector<HTMLButtonElement>('[value="generate"]')?.click()} className="mt-4">
                  Générer votre premier rapport
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {savedReports.map(report => (
                <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedReport(report)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{report.name}</CardTitle>
                      <Badge>{reportTypes.find(t => t.type === report.type)?.name}</Badge>
                    </div>
                    <CardDescription>
                      Généré le {format(new Date(report.generated_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Affichage du rapport sélectionné */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedReport.name}</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setSelectedReport(null)}>
                    Fermer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedReport.type === 'balance_sheet' && renderBalanceSheet(selectedReport.data)}
                {selectedReport.type === 'income_statement' && renderIncomeStatement(selectedReport.data)}
                {selectedReport.type === 'trial_balance' && renderTrialBalance(selectedReport.data)}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
