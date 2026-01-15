import React, { useState, useEffect } from 'react';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  FileDown,
  Clock
} from 'lucide-react';
import { toastSuccess, toastError } from '@/lib/toast-helpers';
import { logger } from '@/lib/logger';
interface AgingBucket {
  label: string;
  min: number;
  max: number | null;
  receivables: number;
  payables: number;
  count: number;
}
interface AgingAnalysisTabProps {
  companyId: string;
}
const AGING_BUCKETS = [
  { label: 'Non échu', min: -Infinity, max: 0 },
  { label: '0-30 jours', min: 0, max: 30 },
  { label: '31-60 jours', min: 31, max: 60 },
  { label: '61-90 jours', min: 61, max: 90 },
  { label: '> 90 jours', min: 91, max: null }
];
export const AgingAnalysisTab: React.FC<AgingAnalysisTabProps> = ({ companyId }) => {
  const { t: _t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [buckets, setBuckets] = useState<AgingBucket[]>([]);
  const [viewMode, setViewMode] = useState<'both' | 'receivables' | 'payables'>('both');
  const [totalReceivables, setTotalReceivables] = useState(0);
  const [totalPayables, setTotalPayables] = useState(0);
  const [overdueReceivables, setOverdueReceivables] = useState(0);
  const [overduePayables, setOverduePayables] = useState(0);
  useEffect(() => {
    if (companyId) {
      loadAgingData();
    }
  }, [companyId]);
  const loadAgingData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      // Charger les factures clients impayées
      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('id, invoice_date, due_date, total_incl_tax, paid_amount, status')
        .eq('company_id', companyId)
        .eq('invoice_type', 'invoice')
        .neq('status', 'paid');
      if (invError) throw invError;
      // Charger les achats impayés (purchases n'a pas paid_amount, on utilise payment_status)
      const { data: purchases, error: purchError } = await supabase
        .from('purchases')
        .select('id, purchase_date, due_date, total_amount, payment_status')
        .eq('company_id', companyId)
        .neq('payment_status', 'paid');
      if (purchError) {
        logger.error('AgingAnalysisTab', 'Error loading purchases:', purchError);
        throw purchError;
      }
      logger.debug('AgingAnalysisTab', `📊 Loaded ${invoices?.length || 0} unpaid invoices and ${purchases?.length || 0} unpaid purchases`);
      // Calculer les buckets
      const calculatedBuckets: AgingBucket[] = AGING_BUCKETS.map(bucket => {
        // Factures dans ce bucket
        const invoicesInBucket = (invoices || []).filter(inv => {
          const balance = (inv.total_incl_tax || 0) - (inv.paid_amount || 0);
          if (balance <= 0) return false;
          if (!inv.due_date) return bucket.min === -Infinity;
          const dueDate = new Date(inv.due_date);
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          if (bucket.max === null) return daysOverdue >= bucket.min;
          if (bucket.min === -Infinity) return daysOverdue < 0;
          return daysOverdue >= bucket.min && daysOverdue <= bucket.max;
        });
        // Achats dans ce bucket
        const purchasesInBucket = (purchases || []).filter(purch => {
          // Pour purchases: si payment_status != 'paid', le montant entier est dû
          const balance = purch.payment_status === 'paid' ? 0 : (purch.total_amount || 0);
          if (balance <= 0) return false;
          if (!purch.due_date) return bucket.min === -Infinity;
          const dueDate = new Date(purch.due_date);
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          if (bucket.max === null) return daysOverdue >= bucket.min;
          if (bucket.min === -Infinity) return daysOverdue < 0;
          return daysOverdue >= bucket.min && daysOverdue <= bucket.max;
        });
        const receivables = invoicesInBucket.reduce(
          (sum, inv) => sum + ((inv.total_incl_tax || 0) - (inv.paid_amount || 0)),
          0
        );
        const payables = purchasesInBucket.reduce(
          (sum, purch) => sum + (purch.payment_status === 'paid' ? 0 : (purch.total_amount || 0)),
          0
        );
        return {
          label: bucket.label,
          min: bucket.min,
          max: bucket.max,
          receivables,
          payables,
          count: invoicesInBucket.length + purchasesInBucket.length
        };
      });
      setBuckets(calculatedBuckets);
      // Calculer les totaux
      const totalRec = calculatedBuckets.reduce((sum, b) => sum + b.receivables, 0);
      const totalPay = calculatedBuckets.reduce((sum, b) => sum + b.payables, 0);
      // Overdue = tout sauf "Non échu"
      const overdueRec = calculatedBuckets
        .filter(b => b.min !== -Infinity)
        .reduce((sum, b) => sum + b.receivables, 0);
      const overduePay = calculatedBuckets
        .filter(b => b.min !== -Infinity)
        .reduce((sum, b) => sum + b.payables, 0);
      setTotalReceivables(totalRec);
      setTotalPayables(totalPay);
      setOverdueReceivables(overdueRec);
      setOverduePayables(overduePay);
    } catch (error) {
      logger.error('AgingAnalysisTab', 'Erreur chargement analyse ancienneté:', error);
      toastError('Impossible de charger l\'analyse d\'ancienneté');
    } finally {
      setLoading(false);
    }
  };
  const handleExport = () => {
    const csv = [
      ['Tranche d\'ancienneté', 'Créances (€)', 'Dettes (€)', 'Total (€)'].join(';'),
      ...buckets.map(bucket => [
        bucket.label,
        bucket.receivables.toFixed(2),
        bucket.payables.toFixed(2),
        (bucket.receivables + bucket.payables).toFixed(2)
      ].join(';'))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analyse_anciennete_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toastSuccess('Export réussi');
  };
  const getPercentage = (amount: number, total: number) => {
    if (total === 0) return 0;
    return (amount / total) * 100;
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de l'analyse...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Créances totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold"><CurrencyAmount amount={totalReceivables} /></span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Créances échues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">
                <CurrencyAmount amount={overdueReceivables} />
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalReceivables > 0
                ? `${((overdueReceivables / totalReceivables) * 100).toFixed(1)}% du total`
                : '0%'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dettes totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-2xl font-bold"><CurrencyAmount amount={totalPayables} /></span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dettes échues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                <CurrencyAmount amount={overduePayables} />
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalPayables > 0
                ? `${((overduePayables / totalPayables) * 100).toFixed(1)}% du total`
                : '0%'}
            </p>
          </CardContent>
        </Card>
      </div>
      {/* Filtres et actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Analyse par ancienneté
            </CardTitle>
            <div className="flex items-center gap-4">
              <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Créances et Dettes</SelectItem>
                  <SelectItem value="receivables">Créances uniquement</SelectItem>
                  <SelectItem value="payables">Dettes uniquement</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExport} variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Tranche d'ancienneté</th>
                  {(viewMode === 'both' || viewMode === 'receivables') && (
                    <>
                      <th className="text-right py-3 px-4 font-medium">Créances (€)</th>
                      <th className="text-left py-3 px-4 font-medium w-1/4">% Créances</th>
                    </>
                  )}
                  {(viewMode === 'both' || viewMode === 'payables') && (
                    <>
                      <th className="text-right py-3 px-4 font-medium">Dettes (€)</th>
                      <th className="text-left py-3 px-4 font-medium w-1/4">% Dettes</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {buckets.map((bucket, index) => {
                  const isOverdue = bucket.min !== -Infinity;
                  const recPercentage = getPercentage(bucket.receivables, totalReceivables);
                  const payPercentage = getPercentage(bucket.payables, totalPayables);
                  return (
                    <tr
                      key={index}
                      className={`border-b ${
                        isOverdue && (bucket.receivables > 0 || bucket.payables > 0)
                          ? 'bg-red-50 dark:bg-red-950/20'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {isOverdue && (bucket.receivables > 0 || bucket.payables > 0) && (
                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                          <span className="font-medium">{bucket.label}</span>
                        </div>
                      </td>
                      {(viewMode === 'both' || viewMode === 'receivables') && (
                        <>
                          <td className="py-3 px-4 text-right font-medium">
                            {bucket.receivables > 0 ? (
                              <span className={isOverdue ? 'text-red-600' : ''}>
                                <CurrencyAmount amount={bucket.receivables} />
                              </span>
                            ) : (
                              <span className="text-muted-foreground">0.00 €</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <Progress value={recPercentage} className="h-2" />
                              <span className="text-xs text-muted-foreground">
                                {recPercentage.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </>
                      )}
                      {(viewMode === 'both' || viewMode === 'payables') && (
                        <>
                          <td className="py-3 px-4 text-right font-medium">
                            {bucket.payables > 0 ? (
                              <span className={isOverdue ? 'text-red-600' : ''}>
                                <CurrencyAmount amount={bucket.payables} />
                              </span>
                            ) : (
                              <span className="text-muted-foreground">0.00 €</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <Progress value={payPercentage} className="h-2" />
                              <span className="text-xs text-muted-foreground">
                                {payPercentage.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2">
                <tr className="font-bold">
                  <td className="py-3 px-4">TOTAL</td>
                  {(viewMode === 'both' || viewMode === 'receivables') && (
                    <>
                      <td className="py-3 px-4 text-right"><CurrencyAmount amount={totalReceivables} /></td>
                      <td className="py-3 px-4">100%</td>
                    </>
                  )}
                  {(viewMode === 'both' || viewMode === 'payables') && (
                    <>
                      <td className="py-3 px-4 text-right"><CurrencyAmount amount={totalPayables} /></td>
                      <td className="py-3 px-4">100%</td>
                    </>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
      {/* Légende */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Légende</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Non échu</Badge>
              <span className="text-muted-foreground">
                Factures dont l'échéance n'est pas encore dépassée
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">0-30 jours</Badge>
              <span className="text-muted-foreground">
                Factures en retard de 0 à 30 jours
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">31-60 jours</Badge>
              <span className="text-muted-foreground">
                Factures en retard de 31 à 60 jours
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">61-90 jours</Badge>
              <span className="text-muted-foreground">
                Factures en retard de 61 à 90 jours
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">&gt; 90 jours</Badge>
              <span className="text-muted-foreground">
                Factures en retard de plus de 90 jours (à recouvrer en priorité)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
