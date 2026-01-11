import React, { useState, useEffect } from 'react';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { supabase } from '@/lib/supabase';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { useTranslation } from 'react-i18next';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { Button } from '@/components/ui/button';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { Input } from '@/components/ui/input';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { Label } from '@/components/ui/label';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  FileText,
  ShoppingCart,
  DollarSign,
  FileDown,
  Search,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { toastSuccess, toastError } from '@/lib/toast-helpers';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { logger } from '@/lib/logger';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
interface Transaction {
  id: string;
  type: 'invoice' | 'payment' | 'credit_note' | 'purchase';
  reference: string;
  date: string;
  due_date?: string;
  third_party_id: string;
  third_party_name: string;
  third_type: 'customer' | 'supplier' | 'both' | 'prospect';
  amount: number;
  paid_amount: number;
  balance: number;
  status: string;
  description?: string;
  days_overdue?: number;
}
interface TransactionsTabProps {
  companyId: string;
}
export const TransactionsTab: React.FC<TransactionsTabProps> = ({ companyId }) => {
  const { t: _t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  // Filtres
  const [selectedThirdParty, setSelectedThirdParty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  // Liste des tiers pour le filtre
  const [thirdParties, setThirdParties] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    if (companyId) {
      loadData();
      loadThirdParties();
    }
  }, [companyId]);
  useEffect(() => {
    applyFilters();
  }, [
    transactions,
    selectedThirdParty,
    selectedType,
    selectedStatus,
    startDate,
    endDate,
    searchText
  ]);
  const loadThirdParties = async () => {
    try {
      // Charger les clients
      const { data: customers, error: custError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (custError) {
        logger.error('TransactionsTab', 'Error loading customers:', custError);
        throw custError;
      }

      // Charger les fournisseurs
      const { data: suppliers, error: suppError } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (suppError) {
        logger.error('TransactionsTab', 'Error loading suppliers:', suppError);
        throw suppError;
      }

      // Combiner les deux listes
      const combined = [
        ...(customers || []),
        ...(suppliers || [])
      ];

      logger.debug('TransactionsTab', `📋 Loaded ${customers?.length || 0} customers and ${suppliers?.length || 0} suppliers`);
      setThirdParties(combined);
    } catch (error) {
      logger.error('TransactionsTab', 'Erreur chargement tiers:', error);
    }
  };
  const loadData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const allTransactions: Transaction[] = [];
      // 1. Charger les factures clients (invoices) avec relation vers customers
      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          invoice_date,
          due_date,
          customer_id,
          client:customers!customer_id(name),
          total_incl_tax,
          paid_amount,
          status
        `)
        .eq('company_id', companyId)
        .eq('invoice_type', 'sale');

      if (invError) {
        logger.error('TransactionsTab', 'Error loading invoices:', invError);
        throw invError;
      }

      logger.debug('TransactionsTab', `📄 Loaded ${invoices?.length || 0} invoices`);

      (invoices || []).forEach((inv: any) => {
        const balance = (inv.total_incl_tax || 0) - (inv.paid_amount || 0);
        const dueDate = inv.due_date ? new Date(inv.due_date) : null;
        const daysOverdue = dueDate && dueDate < today
          ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        allTransactions.push({
          id: inv.id,
          type: 'invoice',
          reference: inv.invoice_number || '',
          date: inv.invoice_date || '',
          due_date: inv.due_date,
          third_party_id: inv.customer_id || '',
          third_party_name: inv.client?.name || 'Inconnu',
          third_type: 'customer',
          amount: inv.total_incl_tax || 0,
          paid_amount: inv.paid_amount || 0,
          balance,
          status: inv.status || 'draft',
          days_overdue: daysOverdue > 0 ? daysOverdue : undefined
        });
      });
      // 2. Charger les achats (purchases) avec relation vers suppliers
      const { data: purchases, error: purchError } = await supabase
        .from('purchases')
        .select(`
          id,
          invoice_number,
          purchase_date,
          due_date,
          supplier_id,
          supplier:suppliers!supplier_id(name),
          total_amount,
          payment_status
        `)
        .eq('company_id', companyId);

      if (purchError) {
        logger.error('TransactionsTab', 'Error loading purchases:', purchError);
        throw purchError;
      }

      logger.debug('TransactionsTab', `🛒 Loaded ${purchases?.length || 0} purchases`);

      (purchases || []).forEach((purch: any) => {
        // Pour purchases: pas de paid_amount, on utilise payment_status
        const balance = purch.payment_status === 'paid' ? 0 : (purch.total_amount || 0);
        const dueDate = purch.due_date ? new Date(purch.due_date) : null;
        const daysOverdue = dueDate && dueDate < today
          ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        allTransactions.push({
          id: purch.id,
          type: 'purchase',
          reference: purch.invoice_number || '',
          date: purch.purchase_date || '',
          due_date: purch.due_date,
          third_party_id: purch.supplier_id || '',
          third_party_name: purch.supplier?.name || 'Inconnu',
          third_type: 'supplier',
          amount: purch.total_amount || 0,
          paid_amount: purch.payment_status === 'paid' ? (purch.total_amount || 0) : 0,
          balance,
          status: purch.payment_status || 'unpaid',
          days_overdue: daysOverdue > 0 ? daysOverdue : undefined
        });
      });
      // 3. Charger les paiements reçus (payments received)
      // Note: payments peuvent être reliés via invoice_id plutôt que directement aux tiers
      const { data: paymentsReceived, error: payRecError } = await supabase
        .from('payments')
        .select(`
          id,
          reference,
          payment_date,
          invoice_id,
          amount,
          payment_method,
          description
        `)
        .eq('company_id', companyId)
        .eq('type', 'received');

      if (payRecError) {
        logger.warn('TransactionsTab', 'Error loading payments received (may not exist):', payRecError);
        // Ne pas throw, continuer avec les autres données
      } else {
        logger.debug('TransactionsTab', `💰 Loaded ${paymentsReceived?.length || 0} payments received`);
        (paymentsReceived || []).forEach((pay: any) => {
          allTransactions.push({
            id: pay.id,
            type: 'payment',
            reference: pay.reference || '',
            date: pay.payment_date || '',
            third_party_id: '', // TODO: récupérer via invoice_id si nécessaire
            third_party_name: 'Paiement reçu',
            third_type: 'customer',
            amount: pay.amount || 0,
            paid_amount: pay.amount || 0,
            balance: 0,
            status: 'paid',
            description: pay.description
          });
        });
      }
      // 4. Charger les paiements émis (payments sent)
      const { data: paymentsSent, error: paySentError } = await supabase
        .from('payments')
        .select(`
          id,
          reference,
          payment_date,
          invoice_id,
          amount,
          payment_method,
          description
        `)
        .eq('company_id', companyId)
        .eq('type', 'sent');

      if (paySentError) {
        logger.warn('TransactionsTab', 'Error loading payments sent (may not exist):', paySentError);
        // Ne pas throw, continuer avec les autres données
      } else {
        logger.debug('TransactionsTab', `💸 Loaded ${paymentsSent?.length || 0} payments sent`);
        (paymentsSent || []).forEach((pay: any) => {
          allTransactions.push({
            id: pay.id,
            type: 'payment',
            reference: pay.reference || '',
            date: pay.payment_date || '',
            third_party_id: '', // TODO: récupérer via invoice_id si nécessaire
            third_party_name: 'Paiement émis',
            third_type: 'supplier',
            amount: pay.amount || 0,
            paid_amount: pay.amount || 0,
            balance: 0,
            status: 'paid',
            description: pay.description
          });
        });
      }
      // Trier par date décroissante
      allTransactions.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      logger.debug('TransactionsTab', `✅ Total transactions loaded: ${allTransactions.length}`);
      setTransactions(allTransactions);
    } catch (error) {
      logger.error('TransactionsTab', 'Erreur chargement transactions:', error);
      toastError('Impossible de charger les transactions');
    } finally {
      setLoading(false);
    }
  };
  const applyFilters = () => {
    let filtered = [...transactions];
    // Filtre par tiers
    if (selectedThirdParty !== 'all') {
      filtered = filtered.filter(t => t.third_party_id === selectedThirdParty);
    }
    // Filtre par type
    if (selectedType !== 'all') {
      filtered = filtered.filter(t => t.type === selectedType);
    }
    // Filtre par statut
    if (selectedStatus === 'unpaid') {
      filtered = filtered.filter(t => t.balance > 0 && t.type !== 'payment');
    } else if (selectedStatus === 'paid') {
      filtered = filtered.filter(t => t.balance === 0 || t.type === 'payment');
    } else if (selectedStatus === 'overdue') {
      filtered = filtered.filter(t => t.days_overdue && t.days_overdue > 0);
    }
    // Filtre par dates
    if (startDate) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(endDate));
    }
    // Filtre par recherche
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(t =>
        t.reference.toLowerCase().includes(search) ||
        t.third_party_name.toLowerCase().includes(search)
      );
    }
    setFilteredTransactions(filtered);
  };
  const calculateTotals = () => {
    const invoicesTotal = transactions
      .filter(t => t.type === 'invoice')
      .reduce((sum, t) => sum + t.amount, 0);
    const purchasesTotal = transactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + t.amount, 0);
    const receivablesTotal = transactions
      .filter(t => t.type === 'invoice')
      .reduce((sum, t) => sum + t.balance, 0);
    const payablesTotal = transactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + t.balance, 0);
    const overdueReceivables = transactions
      .filter(t => t.type === 'invoice' && t.days_overdue && t.days_overdue > 0)
      .reduce((sum, t) => sum + t.balance, 0);
    const overduePayables = transactions
      .filter(t => t.type === 'purchase' && t.days_overdue && t.days_overdue > 0)
      .reduce((sum, t) => sum + t.balance, 0);
    return {
      invoicesTotal,
      purchasesTotal,
      receivablesTotal,
      payablesTotal,
      overdueReceivables,
      overduePayables
    };
  };
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return <FileText className="h-4 w-4" />;
      case 'purchase':
        return <ShoppingCart className="h-4 w-4" />;
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'Facture client';
      case 'purchase':
        return 'Facture fournisseur';
      case 'payment':
        return 'Paiement';
      case 'credit_note':
        return 'Avoir';
      default:
        return type;
    }
  };
  const getStatusBadge = (transaction: Transaction) => {
    if (transaction.type === 'payment') {
      return <Badge variant="default">Payé</Badge>;
    }
    if (transaction.days_overdue && transaction.days_overdue > 0) {
      return <Badge variant="destructive">En retard ({transaction.days_overdue}j)</Badge>;
    }
    if (transaction.balance === 0) {
      return <Badge variant="default">Payé</Badge>;
    }
    if (transaction.balance > 0 && transaction.balance < transaction.amount) {
      return <Badge variant="secondary">Partiel</Badge>;
    }
    return <Badge variant="outline">Impayé</Badge>;
  };
  const handleExport = () => {
    // Export CSV simple
    const csv = [
      ['Type', 'Référence', 'Date', 'Tiers', 'Montant', 'Payé', 'Solde', 'Statut'].join(';'),
      ...filteredTransactions.map(t => [
        getTypeLabel(t.type),
        t.reference,
        t.date,
        t.third_party_name,
        t.amount.toFixed(2),
        t.paid_amount.toFixed(2),
        t.balance.toFixed(2),
        t.days_overdue ? `En retard (${t.days_overdue}j)` : (t.balance === 0 ? 'Payé' : 'Impayé')
      ].join(';'))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toastSuccess('Export réussi');
  };
  const totals = calculateTotals();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des transactions...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Créances totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold"><CurrencyAmount amount={totals.receivablesTotal} /></span>
            </div>
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
              <span className="text-2xl font-bold"><CurrencyAmount amount={totals.payablesTotal} /></span>
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
                <CurrencyAmount amount={totals.overdueReceivables} />
              </span>
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
                <CurrencyAmount amount={totals.overduePayables} />
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total factures clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold"><CurrencyAmount amount={totals.invoicesTotal} /></span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total achats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-purple-600" />
              <span className="text-2xl font-bold"><CurrencyAmount amount={totals.purchasesTotal} /></span>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>Tiers</Label>
              <Select value={selectedThirdParty} onValueChange={setSelectedThirdParty}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les tiers</SelectItem>
                  {thirdParties.map(tp => (
                    <SelectItem key={tp.id} value={tp.id}>
                      {tp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="invoice">Factures clients</SelectItem>
                  <SelectItem value="purchase">Factures fournisseurs</SelectItem>
                  <SelectItem value="payment">Paiements</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="unpaid">Impayé</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                  <SelectItem value="overdue">En retard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date début</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date fin</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Recherche</Label>
              <Input
                placeholder="Référence, tiers..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleExport} variant="outline">
              <FileDown className="h-4 w-4 mr-2" />
              Exporter (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Tableau des transactions */}
      <Card>
        <CardHeader>
          <CardTitle>
            Transactions ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Type</th>
                  <th className="text-left py-3 px-4 font-medium">Référence</th>
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Échéance</th>
                  <th className="text-left py-3 px-4 font-medium">Tiers</th>
                  <th className="text-right py-3 px-4 font-medium">Montant</th>
                  <th className="text-right py-3 px-4 font-medium">Payé</th>
                  <th className="text-right py-3 px-4 font-medium">Solde</th>
                  <th className="text-center py-3 px-4 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-muted-foreground">
                      Aucune transaction trouvée
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(transaction.type)}
                          <span className="text-sm">{getTypeLabel(transaction.type)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-sm">{transaction.reference}</td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(transaction.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {transaction.due_date ? (
                          <div className="flex items-center gap-1">
                            {transaction.days_overdue && transaction.days_overdue > 0 && (
                              <Clock className="h-3 w-3 text-red-600 dark:text-red-400" />
                            )}
                            {new Date(transaction.due_date).toLocaleDateString('fr-FR')}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">{transaction.third_party_name}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        <CurrencyAmount amount={transaction.amount} />
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                        <CurrencyAmount amount={transaction.paid_amount} />
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {transaction.balance > 0 ? (
                          <span className="text-orange-600"><CurrencyAmount amount={transaction.balance} /></span>
                        ) : (
                          <span className="text-green-600">0.00 €</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(transaction)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Totaux des transactions filtrées */}
          {filteredTransactions.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Total montant:</span>
                  <span className="font-bold">
                    {filteredTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)} €
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total payé:</span>
                  <span className="font-bold text-green-600">
                    {filteredTransactions.reduce((sum, t) => sum + t.paid_amount, 0).toFixed(2)} €
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total solde:</span>
                  <span className="font-bold text-orange-600">
                    {filteredTransactions.reduce((sum, t) => sum + t.balance, 0).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
