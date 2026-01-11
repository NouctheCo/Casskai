/**
 * CassKai - Historique des conversions de devises
 * Affiche l'historique complet des conversions effectuées
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { exchangeRateService, type ConversionHistory } from '@/services/exchangeRateService';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { History, Search, Download, Calendar, ArrowRightLeft } from 'lucide-react';
import { formatCurrency, type CurrencyCode } from '@/hooks/useCompanyCurrency';

export const ConversionHistoryComponent: React.FC = () => {
  const { currentEnterprise } = useEnterprise();
  const [history, setHistory] = useState<ConversionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCurrency, setFilterCurrency] = useState<CurrencyCode | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (currentEnterprise?.id) {
      loadHistory();
    }
  }, [currentEnterprise?.id, filterCurrency, startDate, endDate]);

  const loadHistory = async () => {
    if (!currentEnterprise?.id) return;

    setLoading(true);
    try {
      const filters: any = {};

      if (filterCurrency !== 'all') {
        filters.fromCurrency = filterCurrency;
      }
      if (startDate) {
        filters.startDate = startDate;
      }
      if (endDate) {
        filters.endDate = endDate;
      }

      const data = await exchangeRateService.getConversionHistory(currentEnterprise.id, filters);
      setHistory(data);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter((item) => {
    if (!searchTerm) return true;
    return (
      item.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.from_currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.to_currency.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const exportToCSV = () => {
    const headers = ['Date', 'De', 'Montant', 'Vers', 'Montant', 'Taux', 'Référence'];
    const rows = filteredHistory.map((item) => [
      item.date,
      item.from_currency,
      item.from_amount,
      item.to_currency,
      item.to_amount,
      item.rate,
      item.reference || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5" />
            <CardTitle>Historique des Conversions</CardTitle>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={exportToCSV} disabled={filteredHistory.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterCurrency} onValueChange={(value) => setFilterCurrency(value as CurrencyCode | 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les devises" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les devises</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
              <SelectItem value="XOF">XOF - Franc CFA</SelectItem>
              <SelectItem value="XAF">XAF - Franc CFA</SelectItem>
              <SelectItem value="USD">USD - Dollar</SelectItem>
              <SelectItem value="MAD">MAD - Dirham</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>De</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-center">
                  <ArrowRightLeft className="w-4 h-4 mx-auto" />
                </TableHead>
                <TableHead>Vers</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-right">Taux</TableHead>
                <TableHead>Référence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Aucune conversion trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(item.date).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.from_currency}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(item.from_amount, item.from_currency as CurrencyCode)}
                    </TableCell>
                    <TableCell className="text-center">
                      <ArrowRightLeft className="w-4 h-4 mx-auto text-gray-400" />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.to_currency}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(item.to_amount, item.to_currency as CurrencyCode)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-gray-600">
                      {item.rate.toFixed(6)}
                    </TableCell>
                    <TableCell>
                      {item.reference && (
                        <Badge variant="secondary" className="text-xs">
                          {item.reference}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Statistiques */}
        {filteredHistory.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-gray-500">Total conversions</p>
              <p className="text-2xl font-bold">{filteredHistory.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Devises différentes</p>
              <p className="text-2xl font-bold">
                {new Set(filteredHistory.flatMap((h) => [h.from_currency, h.to_currency])).size}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Période</p>
              <p className="text-sm font-medium">
                {filteredHistory.length > 0 &&
                  `${new Date(filteredHistory[filteredHistory.length - 1].date).toLocaleDateString('fr-FR')} - ${new Date(filteredHistory[0].date).toLocaleDateString('fr-FR')}`}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversionHistoryComponent;
