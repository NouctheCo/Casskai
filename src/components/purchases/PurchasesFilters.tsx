import React from 'react';
import { PurchaseFilters, Supplier } from '../../types/purchase.types';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar, Download, Filter, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PurchasesFiltersProps {
  filters: PurchaseFilters;
  suppliers: Supplier[];
  onFiltersChange: (filters: PurchaseFilters) => void;
  onExport: () => void;
  onClearFilters: () => void;
  exportLoading: boolean;
}

const PurchasesFilters: React.FC<PurchasesFiltersProps> = ({
  filters,
  suppliers,
  onFiltersChange,
  onExport,
  onClearFilters,
  exportLoading
}) => {
  const { t } = useTranslation();

  const handleFilterChange = (key: keyof PurchaseFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value && value !== 'all');

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <h3 className="font-medium text-gray-900">{t('purchases.filters.title')}</h3>
          </div>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={exportLoading}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {exportLoading ? t('common.exporting') : t('purchases.actions.export')}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="flex items-center gap-2 text-gray-600"
            >
              <X className="w-4 h-4" />
              {t('purchases.filters.clear')}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">{t('purchases.filters.search')}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="search"
                placeholder={t('purchases.filters.searchPlaceholder')}
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Supplier Filter */}
          <div className="space-y-2">
            <Label>{t('purchases.filters.supplier')}</Label>
            <Select
              value={filters.supplier_id || 'all'}
              onValueChange={(value) => handleFilterChange('supplier_id', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('purchases.filters.allSuppliers')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('purchases.filters.allSuppliers')}</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status Filter */}
          <div className="space-y-2">
            <Label>{t('purchases.filters.paymentStatus')}</Label>
            <Select
              value={filters.payment_status || 'all'}
              onValueChange={(value) => handleFilterChange('payment_status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('purchases.filters.allStatuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('purchases.filters.allStatuses')}</SelectItem>
                <SelectItem value="paid">{t('purchases.status.paid')}</SelectItem>
                <SelectItem value="pending">{t('purchases.status.pending')}</SelectItem>
                <SelectItem value="overdue">{t('purchases.status.overdue')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date From */}
          <div className="space-y-2">
            <Label htmlFor="dateFrom">{t('purchases.filters.dateFrom')}</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="dateFrom"
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <Label htmlFor="dateTo">{t('purchases.filters.dateTo')}</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="dateTo"
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{t('purchases.filters.activeFilters')}:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {filters.search && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {t('purchases.filters.search')}: "{filters.search}"
                  </span>
                )}
                {filters.supplier_id && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    {t('purchases.filters.supplier')}: {suppliers.find(s => s.id === filters.supplier_id)?.name}
                  </span>
                )}
                {filters.payment_status && filters.payment_status !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                    {t('purchases.filters.paymentStatus')}: {t(`purchases.status.${filters.payment_status}`)}
                  </span>
                )}
                {filters.date_from && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                    {t('purchases.filters.dateFrom')}: {new Date(filters.date_from).toLocaleDateString('fr-FR')}
                  </span>
                )}
                {filters.date_to && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                    {t('purchases.filters.dateTo')}: {new Date(filters.date_to).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PurchasesFilters;