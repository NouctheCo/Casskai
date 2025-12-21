import { FC } from 'react';
import type { ProductionOrder, ProductionOrderWithComponents } from '@/services/productionOrdersService';
import type { ProductionFilterState } from '@/types/production';
import ProductionSummary from './production/ProductionSummary';
import ProductionFiltersCard from './production/ProductionFiltersCard';
import ProductionOrdersPanel from './production/ProductionOrdersPanel';
import ProductionSidebar from './production/ProductionSidebar';
import type { ComponentAlert, ProductionKpi, ProductionStats, TimelineItem } from './production/types';

export interface ProductionTabProps {
  filteredOrders: ProductionOrderWithComponents[];
  filters: ProductionFilterState;
  filtersActive: boolean;
  stats: ProductionStats;
  kpis: ProductionKpi[];
  timeline: TimelineItem[];
  componentAlerts: ComponentAlert[];
  loading: boolean;
  actionLoading: boolean;
  onFilterChange: (patch: Partial<ProductionFilterState>) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  onNewOrder: () => void;
  onViewDetails: (order: ProductionOrderWithComponents) => void;
  onStatusChange: (orderId: string, status: ProductionOrder['status']) => void;
}

const ProductionTab: FC<ProductionTabProps> = ({ filteredOrders, filters, filtersActive, stats, kpis, timeline, componentAlerts, loading, actionLoading, onFilterChange, onResetFilters, onRefresh, onNewOrder, onViewDetails, onStatusChange }) => (
  <div className="space-y-6">
    <ProductionSummary stats={stats} kpis={kpis} />
    <ProductionFiltersCard
      filters={filters}
      filtersActive={filtersActive}
      loading={loading}
      onFilterChange={onFilterChange}
      onResetFilters={onResetFilters}
      onRefresh={onRefresh}
      onNewOrder={onNewOrder}
    />
    <div className="grid gap-6 xl:grid-cols-3">
      <ProductionOrdersPanel
        orders={filteredOrders}
        loading={loading}
        statusFilter={filters.status}
        actionLoading={actionLoading}
        onStatusChange={onStatusChange}
        onViewDetails={onViewDetails}
      />
      <ProductionSidebar alerts={componentAlerts} timeline={timeline} onViewDetails={onViewDetails} />
    </div>
  </div>
);

export default ProductionTab;
