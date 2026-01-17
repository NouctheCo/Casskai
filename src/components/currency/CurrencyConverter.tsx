/**
 * CassKai - Composant de conversion de devises
 * Permet de convertir des montants entre différentes devises
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { exchangeRateService } from '@/services/exchangeRateService';
import { useCompanyCurrency, type CurrencyCode } from '@/hooks/useCompanyCurrency';
import { ArrowRightLeft, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const CURRENCIES: { code: CurrencyCode; name: string; flag: string }[] = [
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'XOF', name: 'Franc CFA BCEAO', flag: '🌍' },
  { code: 'XAF', name: 'Franc CFA BEAC', flag: '🌍' },
  { code: 'USD', name: 'Dollar US', flag: '🇺🇸' },
  { code: 'MAD', name: 'Dirham marocain', flag: '🇲🇦' },
  { code: 'DZD', name: 'Dinar algérien', flag: '🇩🇿' },
  { code: 'TND', name: 'Dinar tunisien', flag: '🇹🇳' },
  { code: 'NGN', name: 'Naira nigérian', flag: '🇳🇬' },
  { code: 'KES', name: 'Shilling kenyan', flag: '🇰🇪' },
  { code: 'GHS', name: 'Cedi ghanéen', flag: '🇬🇭' },
  { code: 'ZAR', name: 'Rand sud-africain', flag: '🇿🇦' },
  { code: 'EGP', name: 'Livre égyptienne', flag: '🇪🇬' }
];

interface CurrencyConverterProps {
  onConvert?: (fromAmount: number, toAmount: number, fromCurrency: CurrencyCode, toCurrency: CurrencyCode, rate: number) => void;
  defaultFromCurrency?: CurrencyCode;
  defaultToCurrency?: CurrencyCode;
  defaultAmount?: number;
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  onConvert,
  defaultFromCurrency,
  defaultToCurrency,
  defaultAmount = 1000
}) => {
  const { currencyCode: companyCurrency } = useCompanyCurrency();
  const { toast } = useToast();

  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>(defaultFromCurrency || companyCurrency);
  const [toCurrency, setToCurrency] = useState<CurrencyCode>(defaultToCurrency || 'USD');
  const [fromAmount, setFromAmount] = useState<string>(defaultAmount.toString());
  const [toAmount, setToAmount] = useState<string>('0');
  const [rate, setRate] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Convertir automatiquement quand les paramètres changent
  useEffect(() => {
    if (fromAmount && !isNaN(parseFloat(fromAmount))) {
      convertCurrency();
    }
  }, [fromCurrency, toCurrency, fromAmount]);

  const convertCurrency = async () => {
    setLoading(true);
    try {
      const amount = parseFloat(fromAmount) || 0;
      const result = await exchangeRateService.convert(amount, fromCurrency, toCurrency);

      setRate(result.rate);
      setToAmount(result.amount.toFixed(2));
      setLastUpdate(new Date());

      if (onConvert) {
        onConvert(amount, result.amount, fromCurrency, toCurrency, result.rate);
      }
    } catch (_error) {
      toast({
        title: 'Erreur de conversion',
        description: 'Impossible de récupérer le taux de change',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount(toAmount);
  };

  const formatRate = (rate: number) => {
    if (rate >= 100) return rate.toFixed(2);
    if (rate >= 1) return rate.toFixed(4);
    return rate.toFixed(6);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5" />
          Convertisseur de Devises
        </CardTitle>
        <CardDescription>
          Convertissez des montants entre différentes devises avec les taux actuels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* De */}
        <div className="space-y-2">
          <Label>De</Label>
          <div className="grid grid-cols-2 gap-4">
            <Select value={fromCurrency} onValueChange={(value) => setFromCurrency(value as CurrencyCode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <span className="flex items-center gap-2">
                      <span>{currency.flag}</span>
                      <span>{currency.code}</span>
                      <span className="text-sm text-gray-500">{currency.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="Montant"
              disabled={loading}
            />
          </div>
        </div>

        {/* Bouton d'inversion */}
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={swapCurrencies}
            disabled={loading}
            className="rounded-full"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Vers */}
        <div className="space-y-2">
          <Label>Vers</Label>
          <div className="grid grid-cols-2 gap-4">
            <Select value={toCurrency} onValueChange={(value) => setToCurrency(value as CurrencyCode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <span className="flex items-center gap-2">
                      <span>{currency.flag}</span>
                      <span>{currency.code}</span>
                      <span className="text-sm text-gray-500">{currency.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={toAmount}
              readOnly
              placeholder="Résultat"
              className="bg-gray-50 dark:bg-gray-900"
            />
          </div>
        </div>

        {/* Informations sur le taux */}
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Taux de change</span>
          </div>
          <Badge variant="secondary">
            1 {fromCurrency} = {formatRate(rate)} {toCurrency}
          </Badge>
        </div>

        {/* Dernière mise à jour */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Mis à jour: {lastUpdate.toLocaleTimeString('fr-FR')}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={convertCurrency}
            disabled={loading}
            className="h-6 px-2"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrencyConverter;
