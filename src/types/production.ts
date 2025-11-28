import type { ProductionOrder } from '@/services/productionOrdersService';

export type NewProductionOrderForm = {
  productName: string;
  description: string;
  quantity: string;
  priority: ProductionOrder['priority'];
  startDate: Date | null;
  expectedDate: Date | null;
  responsible: string;
  cost: string;
  notes: string;
};

export type NewOrderComponentDraft = {
  inventoryItemId: string;
  needed: string;
  allocated: string;
};

export type ProductionFilterState = {
  status: 'all' | ProductionOrder['status'];
  priority: 'all' | ProductionOrder['priority'];
  search: string;
  showDelayedOnly: boolean;
  onlyCriticalComponents: boolean;
};

export const productionStatusLabels: Record<ProductionOrder['status'], string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé'
};

export const productionStatusVariant: Record<ProductionOrder['status'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'outline',
  in_progress: 'default',
  completed: 'secondary',
  cancelled: 'destructive'
};

export const productionPriorityLabels: Record<ProductionOrder['priority'], string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute'
};
