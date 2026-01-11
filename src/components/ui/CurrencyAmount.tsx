/**
 * CassKai - Composant pour afficher les montants avec la devise de l'entreprise
 */

import React from 'react';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { cn } from '@/lib/utils';

interface CurrencyAmountProps {
  amount: number | null | undefined;
  className?: string;
  showSymbol?: boolean;
  compact?: boolean;
  colored?: boolean; // Vert si positif, rouge si négatif
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg font-semibold',
  xl: 'text-2xl font-bold'
};

export const CurrencyAmount: React.FC<CurrencyAmountProps> = ({
  amount,
  className,
  showSymbol = true,
  compact = false,
  colored = false,
  size = 'md'
}) => {
  const { formatAmount } = useCompanyCurrency();

  const value = amount ?? 0;
  const formattedAmount = formatAmount(value, { showSymbol, compact });

  const colorClass = colored
    ? value > 0
      ? 'text-green-600 dark:text-green-400'
      : value < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-600 dark:text-gray-400'
    : '';

  return (
    <span className={cn(sizeClasses[size], colorClass, className)}>
      {formattedAmount}
    </span>
  );
};

/**
 * Composant pour afficher juste le symbole de devise
 */
export const CurrencySymbol: React.FC<{ className?: string }> = ({ className }) => {
  const { symbol } = useCompanyCurrency();
  return <span className={className}>{symbol}</span>;
};

export default CurrencyAmount;
