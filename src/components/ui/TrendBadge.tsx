/**
 * Composant TrendBadge - Affichage cohérent des variations
 * Utilise les utilitaires trendCalculations
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { calculateTrend, formatTrend, getTrendColor } from '@/utils/trendCalculations';

interface TrendBadgeProps {
  current: number;
  previous: number;
  inverse?: boolean; // Si true, rouge = bon, vert = mauvais (ex: dépenses)
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TrendBadge: React.FC<TrendBadgeProps> = ({
  current,
  previous,
  inverse = false,
  showIcon = true,
  size = 'md',
  className = ''
}) => {
  const trend = calculateTrend(current, previous);
  const formatted = formatTrend(trend);
  const colorClass = getTrendColor(trend, inverse);

  // Classes de taille
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  // Choix de l'icône
  const Icon = trend === null || trend === 0
    ? Minus
    : trend > 0
      ? TrendingUp
      : TrendingDown;

  return (
    <span className={`inline-flex items-center gap-1 ${colorClass} ${sizeClasses[size]} font-medium ${className}`}>
      {showIcon && <Icon className={iconSizeClasses[size]} />}
      {formatted}
    </span>
  );
};

/**
 * Version simplifiée pour affichage inline
 */
interface TrendTextProps {
  current: number;
  previous: number;
  inverse?: boolean;
  prefix?: string; // Ex: "vs mois dernier"
}

export const TrendText: React.FC<TrendTextProps> = ({
  current,
  previous,
  inverse = false,
  prefix = ''
}) => {
  const trend = calculateTrend(current, previous);
  const formatted = formatTrend(trend);
  const colorClass = getTrendColor(trend, inverse);

  if (trend === null) {
    return <span className="text-gray-400 text-xs">-</span>;
  }

  return (
    <span className={`${colorClass} text-xs font-medium`}>
      {formatted} {prefix}
    </span>
  );
};

/**
 * Badge avec valeur et tendance combinées
 */
interface MetricWithTrendProps {
  label: string;
  current: number;
  previous: number;
  formatValue?: (value: number) => string;
  inverse?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

export const MetricWithTrend: React.FC<MetricWithTrendProps> = ({
  label,
  current,
  previous,
  formatValue = (v) => v.toLocaleString(),
  inverse = false,
  icon: Icon
}) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-4 h-4 text-gray-500" />}
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatValue(current)}
        </span>
        <TrendBadge current={current} previous={previous} inverse={inverse} size="sm" />
      </div>
    </div>
  );
};
