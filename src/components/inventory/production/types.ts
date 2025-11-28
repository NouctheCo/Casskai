import type { ProductionOrder, ProductionOrderWithComponents } from '@/services/productionOrdersService';

export type ProductionStats = {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  delayed: number;
  totalQuantity: number;
  completionRate: number;
};

export type ProductionKpi = { label: string; value: string | number; subLabel: string };

export type TimelineItem = {
  id: string;
  label: string;
  start?: string;
  expected?: string;
  status: ProductionOrder['status'];
  priority: ProductionOrder['priority'];
};

export type ComponentAlert = {
  order: ProductionOrderWithComponents;
  componentName: string;
  shortfall: number;
  needed: number;
};
