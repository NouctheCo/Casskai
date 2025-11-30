// components/MarketSelector.tsx
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface MarketSelectorProps {
  value?: string;
  onValueChange: (marketId: string) => void;
  showRegions?: boolean;
}

export function MarketSelector({ value, onValueChange, showRegions = true }: MarketSelectorProps) {
  const markets: any[] = [];  // MarketService not available, use empty array

  const getRegionLabel = (region: string) => {
    const labels = {
      'europe': '🇪🇺 Europe',
      'africa': '🌍 Afrique',
      'americas': '🌎 Amériques'
    };
    return labels[region as keyof typeof labels] || region;
  };

  const getRegionColor = (region: string) => {
    const colors = {
      'europe': 'bg-blue-100 text-blue-800',
      'africa': 'bg-green-100 text-green-800',
      'americas': 'bg-orange-100 text-orange-800'
    };
    return colors[region as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (showRegions) {
    const regions = ['europe', 'africa', 'americas'] as const;
    
    return (
      <div className="space-y-4">
        {regions.map(region => {
          const regionMarkets: any[] = [];  // marketService not available
          if (regionMarkets.length === 0) return null;

          return (
            <div key={region}>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getRegionColor(region)}>
                  {getRegionLabel(region)}
                </Badge>
                <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  {regionMarkets.length} {regionMarkets.length > 1 ? 'pays' : 'pays'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
                {regionMarkets.map(market => (
                  <div
                    key={market.id}
                    onClick={() => onValueChange(market.id)}
                    className={`
                      p-3 border rounded-lg cursor-pointer transition-colors
                      ${value === market.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="font-medium">{market.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                      {market.defaultCurrency} • {market.accountingStandard}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      À partir de {market.pricing.starter} {market.pricing.currency}/mois
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Sélectionner un marché" />
      </SelectTrigger>
      <SelectContent>
        {markets.map(market => (
          <SelectItem key={market.id} value={market.id}>
            <div className="flex items-center gap-2">
              <span>{market.name}</span>
              <Badge variant="outline" className="text-xs">
                {market.defaultCurrency}
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
