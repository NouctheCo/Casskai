import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCurrency, useCurrencySelector } from '../hooks/useCurrency';
import { ArrowRightLeft, RefreshCw, TrendingUp, Calculator, AlertCircle, CheckCircle } from 'lucide-react';

// Sélecteur de devise
export const CurrencySelector = ({ 
  value, 
  onChange, 
  label = "Devise",
  disabled = false,
  className = ""
}: {
  value: string;
  onChange: (currency: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}) => {
  const { currencyOptions } = useCurrencySelector();

  return (
    <div className={className}>
      <Label htmlFor="currency-select">{label}</Label>
      <select
        id="currency-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      >
        {currencyOptions.map(option => (
          <option key={option.code} value={option.code}>
            {option.name} ({option.symbol})
          </option>
        ))}
      </select>
    </div>
  );
};

// Affichage de montant avec conversion
export const AmountDisplay = ({ 
  amount, 
  currency, 
  showConverted = false,
  precision = 2,
  className = ""
}: {
  amount: number;
  currency: string;
  showConverted?: boolean;
  precision?: number;
  className?: string;
}) => {
  const { formatAmount, formatAmountWithConversion, baseCurrency } = useCurrency();
  const [convertedAmount, setConvertedAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (showConverted && currency !== baseCurrency.code) {
      setIsLoading(true);
      const currencyObj: any = { code: currency, name: '', symbol: '' };
      const converted = formatAmountWithConversion(amount, currencyObj);
      setConvertedAmount(converted);
      setIsLoading(false);
    }
  }, [amount, currency, showConverted, baseCurrency, formatAmountWithConversion]);

  const originalAmount = formatAmount(amount);

  if (showConverted && currency !== baseCurrency.code) {
    return (
      <div className={className}>
        <span className="font-medium">{originalAmount}</span>
        {isLoading ? (
          <span className="text-sm text-gray-500 ml-2">
            <RefreshCw className="inline h-3 w-3 animate-spin" />
          </span>
        ) : convertedAmount ? (
          <span className="text-sm text-gray-500 ml-2">
            (≈ {convertedAmount})
          </span>
        ) : null}
      </div>
    );
  }

  return <span className={className}>{originalAmount}</span>;
};

// Convertisseur de devise
export const CurrencyConverter = () => {
  const { convertAmount, getExchangeRate, refreshRates, isLoading, error } = useCurrency();
  const [fromCurrency, setFromCurrency] = useState('EUR');
  const [toCurrency, setToCurrency] = useState('XOF');
  const [amount, setAmount] = useState<string>('100');
  const [result, setResult] = useState<string>('');
  const [rate, setRate] = useState<number | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // Convertir automatiquement quand les valeurs changent
  useEffect(() => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0 && fromCurrency && toCurrency) {
      handleConvert();
    }
  }, [amount, fromCurrency, toCurrency]);

  const handleConvert = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setResult('');
      setRate(null);
      return;
    }

    try {
      setIsConverting(true);
      const convertedAmount = await convertAmount(numAmount, fromCurrency, toCurrency);
      setResult(convertedAmount.toString());
      setRate(1);
    } catch (err) {
      console.error('Erreur de conversion:', err);
      setResult('Erreur');
      setRate(null);
    } finally {
      setIsConverting(false);
    }
  };

  // Inverser les devises
  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Actualiser les taux
  const handleRefreshRates = async () => {
    try {
      await refreshRates();
      await handleConvert();
    } catch (err) {
      console.error('Erreur actualisation:', err);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="mr-2 h-5 w-5" />
          Convertisseur de Devises
        </CardTitle>
        <CardDescription>
          Convertir entre les devises supportées en temps réel
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Montant source */}
        <div className="space-y-2">
          <Label htmlFor="amount">Montant</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Entrez un montant"
            min="0"
            step="0.01"
          />
        </div>

        {/* Devise source */}
        <CurrencySelector
          value={fromCurrency}
          onChange={setFromCurrency}
          label="De"
        />

        {/* Bouton d'inversion */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwapCurrencies}
            className="rounded-full"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Devise cible */}
        <CurrencySelector
          value={toCurrency}
          onChange={setToCurrency}
          label="Vers"
        />

        {/* Résultat */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-center">
            {isConverting ? (
              <div className="flex items-center justify-center">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Conversion en cours...
              </div>
            ) : result ? (
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {parseFloat(result).toLocaleString()} {toCurrency}
                </div>
                {rate && (
                  <div className="text-sm text-gray-600 mt-1">
                    Taux : 1 {fromCurrency} = {rate.toFixed(6)} {toCurrency}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">Entrez un montant à convertir</div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleConvert}
            disabled={isConverting || isLoading}
            className="flex-1"
          >
            {isConverting ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Calculator className="mr-2 h-4 w-4" />
            )}
            Convertir
          </Button>
          
          <Button
            variant="outline"
            onClick={handleRefreshRates}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Widget de taux de change
export const ExchangeRateWidget = ({ 
  pairs = [
    { from: 'EUR', to: 'XOF' },
    { from: 'USD', to: 'EUR' },
    { from: 'XOF', to: 'EUR' }
  ]
}: {
  pairs?: Array<{ from: string; to: string }>
}) => {
  const { getExchangeRate, formatAmount } = useCurrency();
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Charger les taux
  useEffect(() => {
    const loadRates = async () => {
      setIsLoading(true);
      const newRates: Record<string, number> = {};
      
      for (const pair of pairs) {
        try {
          const rate = await getExchangeRate(pair.from, pair.to);
          newRates[`${pair.from}_${pair.to}`] = rate;
        } catch (error) {
          console.error(`Erreur taux ${pair.from}/${pair.to}:`, error);
        }
      }
      
      setRates(newRates);
      setLastUpdate(new Date());
      setIsLoading(false);
    };

    loadRates();
    
    // Actualiser toutes les 5 minutes
    const interval = setInterval(loadRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [pairs, getExchangeRate]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center">
            <TrendingUp className="mr-2 h-4 w-4" />
            Taux de Change
          </span>
          {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
        </CardTitle>
        <CardDescription className="text-xs">
          Dernière mise à jour : {lastUpdate.toLocaleTimeString()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {pairs.map((pair) => {
          const key = `${pair.from}_${pair.to}`;
          const rate = rates[key];
          
          return (
            <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">{pair.from}</span>
                <ArrowRightLeft className="h-3 w-3 text-gray-400" />
                <span className="font-medium text-sm">{pair.to}</span>
              </div>
              
              <div className="text-right">
                {rate ? (
                  <div>
                    <span className="font-mono text-sm">{rate.toFixed(4)}</span>
                    <div className="text-xs text-gray-500">
                      1 {pair.from} = {rate.toFixed(4)} {pair.to}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">
                    {isLoading ? 'Chargement...' : 'N/A'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

// Composant d'input avec devise
export const CurrencyInput = ({
  value,
  onChange,
  currency,
  onCurrencyChange,
  label = "Montant",
  placeholder = "0.00",
  disabled = false,
  showCurrencySelector = true,
  className = ""
}: {
  value: string;
  onChange: (value: string) => void;
  currency: string;
  onCurrencyChange?: (currency: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  showCurrencySelector?: boolean;
  className?: string;
}) => {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <div className="flex gap-2 mt-1">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          min="0"
          step="0.01"
          className="flex-1"
        />
        
        {showCurrencySelector && onCurrencyChange ? (
          <div className="w-24">
            <CurrencySelector
              value={currency}
              onChange={onCurrencyChange}
              label=""
              disabled={disabled}
            />
          </div>
        ) : (
          <div className="w-16 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-center text-sm font-medium">
            {currency}
          </div>
        )}
      </div>
    </div>
  );
};
