// components/CurrencySelector.tsx
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '../hooks/useCurrency';

interface CurrencySelectorProps {
  value?: string;
  onValueChange: (currency: string) => void;
  showAfricanOnly?: boolean;
}

export function CurrencySelector({ value, onValueChange, showAfricanOnly = false }: CurrencySelectorProps) {
  const { currencies, africanCurrencies } = useCurrency();
  const currenciesToShow = showAfricanOnly ? africanCurrencies : currencies;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Sélectionner une devise" />
      </SelectTrigger>
      <SelectContent>
        {currenciesToShow.map(currency => (
          <SelectItem key={currency.code} value={currency.code}>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">{currency.symbol}</span>
              <span>{currency.name}</span>
              <span className="text-gray-500">({currency.code})</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Exemple d'utilisation dans un composant
export function AmountDisplay({ amount, currency }: { amount: number; currency: string }) {
  const { formatAmount } = useCurrency();
  
  return (
    <span className="font-mono text-lg">
      {formatAmount(amount, currency)}
    </span>
  );
}
