import React, { FC, useState, useEffect } from 'react';
import { useCurrency } from '@/hooks/useCurrency';

interface AmountDisplayProps {
  amount: number;
  currency: string;
  showConverted?: boolean;
  className?: string;
}

export const AmountDisplay: FC<AmountDisplayProps> = ({ 
  amount, 
  currency, 
  showConverted = false, 
  className = '' 
}) => {
  const { formatAmount, formatAmountWithConversion, currentCurrency } = useCurrency();
  const [convertedAmount, setConvertedAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (showConverted && currency !== currentCurrency) {
      setIsLoading(true);
      formatAmountWithConversion(amount, currency)
        .then(setConvertedAmount)
        .finally(() => setIsLoading(false));
    }
  }, [amount, currency, showConverted, currentCurrency, formatAmountWithConversion]);

  const originalAmount = formatAmount(amount, currency);

  if (showConverted && convertedAmount && currency !== currentCurrency) {
    return (
      <span className={className}>
        <span className="font-medium">{originalAmount}</span>
        {isLoading ? (
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
            <span className="animate-spin">⟳</span>
          </span>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
            (≈ {convertedAmount})
          </span>
        )}
      </span>
    );
  }

  return <span className={className}>{originalAmount}</span>;
};
