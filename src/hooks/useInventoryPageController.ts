/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useToast } from '@/components/ui/use-toast';
import type { InventoryHeaderProps } from '@/components/inventory/InventoryHeader';
import type { InventoryStatsProps } from '@/components/inventory/InventoryStats';
import type { DashboardTabProps } from '@/components/inventory/DashboardTab';
import type { AlertsTabProps } from '@/components/inventory/AlertsTab';
import type { InventoryDialogsProps, InventoryComponentOption } from '@/components/inventory/InventoryDialogs';
import type { MovementFilters, MovementsTabProps } from '@/components/inventory/MovementsTab';
import type { ProductionTabProps } from '@/components/inventory/ProductionTab';
import type { ProductsTabProps } from '@/components/inventory/ProductsTab';
import type { SuppliersTabProps } from '@/components/inventory/SuppliersTab';
import type { ComponentAlert, ProductionKpi, ProductionStats, TimelineItem } from '@/components/inventory/production/types';
import { useInventory } from '@/hooks/useInventory';
import type { ComputedMetrics } from '@/types/inventory';
import {
  type NewOrderComponentDraft,
  type NewProductionOrderForm,
  type ProductionFilterState,
  productionPriorityLabels,
  productionStatusLabels,
  productionStatusVariant
} from '@/types/production';
import productionOrdersService, { type ProductionOrder, type ProductionOrderComponent, type ProductionOrderWithComponents } from '@/services/productionOrdersService';
import suppliersService, { type Supplier, type SupplierWithStats } from '@/services/suppliersService';
import {
  defaultInventoryAlertSettings,
  type InventoryAlertSettings,
  type InventoryItem,
  type StockMovement
} from '@/services/inventoryService';

const MOVEMENT_FILTERS_DEFAULT: MovementFilters = { type: 'all', product: '', dateFrom: undefined, dateTo: undefined };
const PRODUCTION_FILTERS_DEFAULT: ProductionFilterState = {
  status: 'all',
  priority: 'all',
  search: '',
  showDelayedOnly: false,
  onlyCriticalComponents: false
};
const EMPTY_PRODUCTION_FORM: NewProductionOrderForm = {
  productName: '',
  description: '',
  quantity: '1',
  priority: 'medium',
  startDate: null,
  expectedDate: null,
  responsible: '',
  cost: '0',
  notes: ''
};

const formatDate = (value: Date | null | undefined) => (value ? value.toISOString().split('T')[0] : undefined);

export interface InventoryPageControllerResult {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  headerProps: InventoryHeaderProps;
  statsProps: InventoryStatsProps;
  dashboardProps: DashboardTabProps;
  productsProps: ProductsTabProps;
  movementsProps: MovementsTabProps;
  productionProps: ProductionTabProps;
  suppliersProps: SuppliersTabProps;
  alertsProps: AlertsTabProps;
  dialogsProps: InventoryDialogsProps;
}

export function useInventoryPageController(): InventoryPageControllerResult {
  const { toast } = useToast();
  const {
    items: inventoryItems,
    movements: stockMovements,
    metrics,
    itemsLoading,
    movementsLoading,
    createMovement,
    deleteItem,
    lowStockItems,
    outOfStockItems,
    totalValue
  } = useInventory();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [productSearch, setProductSearch] = useState('');
  const [movementFilters, setMovementFilters] = useState<MovementFilters>(MOVEMENT_FILTERS_DEFAULT);

  const [suppliers, setSuppliers] = useState<SupplierWithStats[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);

  const [productionOrders, setProductionOrders] = useState<ProductionOrderWithComponents[]>([]);
  const [productionLoading, setProductionLoading] = useState(false);
  const [productionFilters, setProductionFilters] = useState<ProductionFilterState>(PRODUCTION_FILTERS_DEFAULT);
  const [productionForm, setProductionForm] = useState<NewProductionOrderForm>(EMPTY_PRODUCTION_FORM);
  const [productionComponents, setProductionComponents] = useState<NewOrderComponentDraft[]>([]);
  const [productionDialogOpen, setProductionDialogOpen] = useState(false);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrderWithComponents | null>(null);
  const [createOrderLoading, setCreateOrderLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [movementItemId, setMovementItemId] = useState('');
  const [movementType, setMovementType] = useState<'entry' | 'exit' | 'adjustment' | 'transfer'>('entry');
  const [movementQuantity, setMovementQuantity] = useState('');
  const [movementReason, setMovementReason] = useState('');

  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierContact, setSupplierContact] = useState('');

  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertSettings, setAlertSettings] = useState<InventoryAlertSettings>(defaultInventoryAlertSettings);
  const [alertSaving, setAlertSaving] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return inventoryItems;
    const term = productSearch.toLowerCase();
    return inventoryItems.filter((item) => [item.name, item.reference, item.supplierName, item.category]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(term)));
  }, [inventoryItems, productSearch]);

  const computedMetrics = useMemo<ComputedMetrics>(() => ({
    totalItems: inventoryItems.length,
    totalValue,
    lowStockItems: lowStockItems.length,
    outOfStockItems: outOfStockItems.length,
    activeItems: inventoryItems.filter((item) => item.status === 'active').length,
    averageRotation: metrics?.avgStockRotation ?? 0,
    totalMovements: stockMovements.length,
    profitMargin: Number((metrics as unknown as Record<string, number> | null)?.profitMargin ?? 0),
    monthlyTurnover: Number(metrics?.totalValue ?? 0)
  }), [inventoryItems, totalValue, lowStockItems.length, outOfStockItems.length, metrics, stockMovements.length]);

  const componentOptions = useMemo<InventoryComponentOption[]>(() => inventoryItems.map((item) => ({
    value: item.id,
    label: `${item.name} • ${item.reference}`
  })), [inventoryItems]);

  const loadSuppliers = useCallback(async () => {
    try {
      setSuppliersLoading(true);
      const data = await suppliersService.getSuppliers();
      setSuppliers(data);
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Chargement des fournisseurs impossible.' });
    } finally {
      setSuppliersLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const loadProductionOrders = useCallback(async () => {
    try {
      setProductionLoading(true);
      const orders = await productionOrdersService.getProductionOrders();
      setProductionOrders(orders);
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Chargement des ordres impossible.' });
    } finally {
      setProductionLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProductionOrders();
  }, [loadProductionOrders]);

  const filtersActive = useMemo(() => JSON.stringify(productionFilters) !== JSON.stringify(PRODUCTION_FILTERS_DEFAULT), [productionFilters]);

  const filteredOrders = useMemo(() => {
    const term = productionFilters.search.toLowerCase();
    return productionOrders.filter((order) => {
      if (productionFilters.status !== 'all' && order.status !== productionFilters.status) return false;
      if (productionFilters.priority !== 'all' && order.priority !== productionFilters.priority) return false;
      if (term && ![order.product_name, order.description, order.responsible]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(term))) return false;
      if (productionFilters.showDelayedOnly) {
        const expected = order.expected_date ? new Date(order.expected_date) : undefined;
        if (!expected || expected >= new Date() || order.status === 'completed') return false;
      }
      if (productionFilters.onlyCriticalComponents) {
        const hasShortage = order.components?.some((component) => component.shortfall > 0);
        if (!hasShortage) return false;
      }
      return true;
    });
  }, [productionFilters, productionOrders]);

  const productionStats = useMemo<ProductionStats>(() => {
    const counts = productionOrders.reduce((acc, order) => ({
      ...acc,
      [order.status]: acc[order.status] + 1
    }), { pending: 0, in_progress: 0, completed: 0, cancelled: 0 } as Record<ProductionOrder['status'], number>);
    const delayed = productionOrders.filter((order) => {
      const expected = order.expected_date ? new Date(order.expected_date) : undefined;
      return expected && expected < new Date() && order.status !== 'completed';
    }).length;
    const totalQuantity = productionOrders.reduce((sum, order) => sum + Number(order.quantity ?? 0), 0);
    const completionRate = productionOrders.length ? Math.round((counts.completed / productionOrders.length) * 100) : 0;
    return {
      total: productionOrders.length,
      pending: counts.pending,
      inProgress: counts.in_progress,
      completed: counts.completed,
      cancelled: counts.cancelled,
      delayed,
      totalQuantity,
      completionRate
    };
  }, [productionOrders]);

  const productionKpis = useMemo<ProductionKpi[]>(() => ([
    { label: 'Unités planifiées', value: productionStats.totalQuantity, subLabel: 'Volumes à produire' },
    { label: 'Ordres actifs', value: productionStats.pending + productionStats.inProgress, subLabel: 'À surveiller' },
    { label: 'En retard', value: productionStats.delayed, subLabel: 'À prioriser' },
    { label: 'Taux de complétion', value: `${productionStats.completionRate}%`, subLabel: 'Ordres terminés' }
  ]), [productionStats]);

  const productionTimeline = useMemo<TimelineItem[]>(() => productionOrders
    .filter((order) => order.status !== 'cancelled')
    .slice(0, 6)
    .map((order) => ({
      id: order.id,
      label: order.product_name,
      start: order.start_date,
      expected: order.expected_date,
      status: order.status,
      priority: order.priority
    })), [productionOrders]);

  const componentAlerts = useMemo<ComponentAlert[]>(() => {
    const alerts: ComponentAlert[] = [];
    productionOrders.forEach((order) => {
      order.components?.forEach((component) => {
        if (component.shortfall > 0) {
          alerts.push({
            order,
            componentName: component.itemName,
            shortfall: component.shortfall,
            needed: component.needed
          });
        }
      });
    });
    return alerts;
  }, [productionOrders]);

  const handleStockMovement = useCallback(async (itemId: string, type: 'entry' | 'exit' | 'adjustment' | 'transfer', quantity: number, reason: string) => {
    const item = inventoryItems.find((entry) => entry.id === itemId);
    if (!item) return;
    try {
      const success = await createMovement({
        item_id: itemId,
        type,
        quantity: Math.abs(quantity),
        unit_price: item.avgCost || item.purchasePrice,
        reason,
        reference: `MOV-${Date.now()}`,
        location: item.location
      });
      if (success) {
        toast({
          title: 'Mouvement enregistré',
          description: `${type === 'exit' ? 'Sortie' : 'Entrée'} de ${Math.abs(quantity)} ${item.unit.toLowerCase()}(s)`
        });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de créer le mouvement.' });
    }
  }, [createMovement, inventoryItems, toast]);

  const resetMovementForm = () => {
    setMovementItemId('');
    setMovementType('entry');
    setMovementQuantity('');
    setMovementReason('');
  };

  const handleSubmitMovement = useCallback(async () => {
    if (!movementItemId || !movementQuantity || !movementReason) {
      toast({ variant: 'destructive', title: 'Champs requis', description: 'Sélectionnez un article, une quantité et un motif.' });
      return;
    }
    const quantity = Number(movementQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast({ variant: 'destructive', title: 'Quantité invalide', description: 'Saisissez une valeur positive.' });
      return;
    }
    await handleStockMovement(movementItemId, movementType, quantity, movementReason);
    setMovementDialogOpen(false);
    resetMovementForm();
  }, [handleStockMovement, movementItemId, movementQuantity, movementReason, movementType, toast]);

  const handleNewArticle = useCallback(() => {
    toast({ title: 'Prochainement', description: 'La création avancée d’articles arrive bientôt.' });
  }, [toast]);

  const handleNewMovement = useCallback(() => {
    setMovementDialogOpen(true);
  }, []);

  const headerProps = useMemo<InventoryHeaderProps>(() => ({
    title: 'Inventaire',
    description: 'Pilotage intelligent des stocks et de la production',
    badgeLabel: `${inventoryItems.length} articles`,
    newArticleLabel: 'Nouvel article',
    newMovementLabel: 'Nouveau mouvement',
    onNewArticle: handleNewArticle,
    onNewMovement: handleNewMovement
  }), [handleNewArticle, handleNewMovement, inventoryItems.length]);

  const handleDeleteProduct = useCallback(async (id: string) => {
    try {
      const success = await deleteItem(id);
      if (success) toast({ title: 'Article supprimé' });
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Suppression impossible.' });
    }
  }, [deleteItem, toast]);

  const handleEditProduct = useCallback((product: InventoryItem) => {
    toast({ title: product.name, description: 'L’édition détaillée arrive dans une prochaine itération.' });
  }, [toast]);

  const handleViewMovementDetails = useCallback((movement: StockMovement) => {
    toast({
      title: movement.productName,
      description: `${movement.reason || 'Mouvement'} • ${movement.quantity} unités le ${new Date(movement.movement_date).toLocaleDateString()}`
    });
  }, [toast]);

  const resetSupplierForm = () => {
    setSupplierName('');
    setSupplierEmail('');
    setSupplierPhone('');
    setSupplierContact('');
  };

  const handleSubmitSupplier = useCallback(async () => {
    if (!supplierName.trim() || !supplierEmail.trim()) {
      toast({ variant: 'destructive', title: 'Champs requis', description: 'Nom et email sont obligatoires.' });
      return;
    }
    try {
      setSuppliersLoading(true);
      const payload: Omit<Supplier, 'id' | 'company_id' | 'created_at' | 'updated_at'> = {
        name: supplierName.trim(),
        email: supplierEmail.trim(),
        phone: supplierPhone || undefined,
        notes: supplierContact || undefined,
        is_active: true
      };
      await suppliersService.createSupplier(payload);
      toast({ title: 'Fournisseur enregistré' });
      resetSupplierForm();
      setSupplierDialogOpen(false);
      await loadSuppliers();
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Création impossible pour le moment.' });
    } finally {
      setSuppliersLoading(false);
    }
  }, [loadSuppliers, supplierContact, supplierEmail, supplierName, supplierPhone, toast]);

  const handleEditSupplier = useCallback((supplier: SupplierWithStats) => {
    toast({ title: supplier.name, description: 'Edition à implémenter.' });
  }, [toast]);

  const handleDeleteSupplier = useCallback((supplier: SupplierWithStats) => {
    toast({ variant: 'destructive', title: 'Suppression indisponible', description: `Utilisez la console pour retirer ${supplier.name}.` });
  }, [toast]);

  const handleAddComponent = () => setProductionComponents((components) => [...components, { inventoryItemId: '', needed: '0', allocated: '0' }]);
  const handleComponentChange = (index: number, field: keyof NewOrderComponentDraft, value: string) => setProductionComponents((components) => components.map((component, idx) => (idx === index ? { ...component, [field]: value } : component)));
  const handleRemoveComponent = (index: number) => setProductionComponents((components) => components.filter((_, idx) => idx !== index));
  const resetProductionForm = () => {
    setProductionForm(EMPTY_PRODUCTION_FORM);
    setProductionComponents([]);
  };

  const handleCreateProductionOrder = useCallback(async () => {
    if (!productionForm.productName.trim()) {
      toast({ variant: 'destructive', title: 'Nom requis' });
      return;
    }
    const quantity = Number(productionForm.quantity || 0);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast({ variant: 'destructive', title: 'Quantité invalide' });
      return;
    }
    try {
      setCreateOrderLoading(true);
      const payload: Omit<ProductionOrder, 'id' | 'company_id' | 'created_at' | 'updated_at'> = {
        product_name: productionForm.productName.trim(),
        description: productionForm.description || undefined,
        quantity,
        status: 'pending',
        start_date: formatDate(productionForm.startDate) ?? formatDate(new Date()) ?? '',
        expected_date: formatDate(productionForm.expectedDate) ?? formatDate(productionForm.startDate) ?? formatDate(new Date()) ?? '',
        completed_date: undefined,
        priority: productionForm.priority,
        cost: Number(productionForm.cost || 0),
        responsible: productionForm.responsible || '',
        notes: productionForm.notes || ''
      };
      const componentPayload: Array<Omit<ProductionOrderComponent, 'itemName' | 'available'>> = productionComponents
        .filter((component) => component.inventoryItemId)
        .map((component) => ({
          itemId: component.inventoryItemId,
          needed: Number(component.needed || 0),
          allocated: Number(component.allocated || 0),
          reference: '',
          reserved: 0,
          shortfall: 0
        }));
      await productionOrdersService.createProductionOrder(payload, componentPayload);
      toast({ title: 'Ordre créé' });
      resetProductionForm();
      setProductionDialogOpen(false);
      await loadProductionOrders();
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Création impossible.' });
    } finally {
      setCreateOrderLoading(false);
    }
  }, [loadProductionOrders, productionComponents, productionForm, toast]);

  const handleStatusChange = useCallback(async (orderId: string, status: ProductionOrder['status']) => {
    try {
      setActionLoading(true);
      await productionOrdersService.updateProductionOrderStatus(orderId, status);
      await loadProductionOrders();
      toast({ title: 'Statut mis à jour' });
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le statut.' });
    } finally {
      setActionLoading(false);
    }
  }, [loadProductionOrders, toast]);

  const handleViewDetails = useCallback((order: ProductionOrderWithComponents) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
  }, []);

  const handleAlertSettingChange = useCallback(<K extends keyof InventoryAlertSettings>(field: K, value: InventoryAlertSettings[K]) => {
    setAlertSettings((settings) => ({ ...settings, [field]: value }));
  }, []);

  const handleSaveAlertSettings = useCallback(async () => {
    setAlertSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      toast({ title: 'Paramètres enregistrés' });
      setAlertDialogOpen(false);
    } finally {
      setAlertSaving(false);
    }
  }, [toast]);

  const dashboardProps = useMemo<DashboardTabProps>(() => ({
    inventoryItems,
    stockMovements
  }), [inventoryItems, stockMovements]);

  const statsProps = useMemo<InventoryStatsProps>(() => ({
    metrics: computedMetrics,
    alertsCount: outOfStockItems.length,
    lowStockCount: lowStockItems.length
  }), [computedMetrics, lowStockItems.length, outOfStockItems.length]);

  const productsProps: ProductsTabProps = {
    products: inventoryItems,
    filteredProducts,
    searchTerm: productSearch,
    onSearchChange: setProductSearch,
    onEdit: handleEditProduct,
    onDelete: handleDeleteProduct,
    onNewArticle: handleNewArticle,
    loading: itemsLoading
  };

  const movementsProps: MovementsTabProps = {
    movements: stockMovements,
    filteredMovements: stockMovements,
    filters: movementFilters,
    onFilterChange: setMovementFilters,
    onViewDetails: handleViewMovementDetails,
    loading: movementsLoading,
    onNewMovement: handleNewMovement
  };

  const productionProps: ProductionTabProps = {
    filteredOrders,
    filters: productionFilters,
    filtersActive,
    stats: productionStats,
    kpis: productionKpis,
    timeline: productionTimeline,
    componentAlerts,
    loading: productionLoading,
    actionLoading,
    onFilterChange: (patch) => setProductionFilters((prev) => ({ ...prev, ...patch })),
    onResetFilters: () => setProductionFilters(PRODUCTION_FILTERS_DEFAULT),
    onRefresh: loadProductionOrders,
    onNewOrder: () => setProductionDialogOpen(true),
    onViewDetails: handleViewDetails,
    onStatusChange: handleStatusChange
  };

  const suppliersProps: SuppliersTabProps = {
    suppliers,
    loading: suppliersLoading,
    onNewSupplier: () => setSupplierDialogOpen(true),
    onEdit: handleEditSupplier,
    onDelete: handleDeleteSupplier
  };

  const alertsProps: AlertsTabProps = {
    items: inventoryItems,
    alertSettings,
    alertSettingsLoading: false,
    alertSettingsBusy: alertSaving,
    onConfigureAlerts: () => setAlertDialogOpen(true),
    onAlertSettingsChange: handleAlertSettingChange,
    onReplenish: (itemId, quantity) => handleStockMovement(itemId, 'entry', quantity, 'Réapprovisionnement rapide')
  };

  const dialogsProps: InventoryDialogsProps = {
    productionDialog: {
      open: productionDialogOpen,
      onOpenChange: (open) => {
        setProductionDialogOpen(open);
        if (!open) resetProductionForm();
      },
      createOrderLoading,
      form: productionForm,
      components: productionComponents,
      componentOptions,
      hasInventoryItems: inventoryItems.length > 0,
      onFieldChange: (field, value) => setProductionForm((prev) => ({ ...prev, [field]: value })),
      onAddComponent: handleAddComponent,
      onComponentChange: handleComponentChange,
      onRemoveComponent: handleRemoveComponent,
      onSubmit: handleCreateProductionOrder
    },
    orderDetailsDialog: {
      open: orderDetailsOpen,
      onOpenChange: (open) => {
        setOrderDetailsOpen(open);
        if (!open) setSelectedOrder(null);
      },
      order: selectedOrder,
      statusLabels: productionStatusLabels,
      statusVariants: productionStatusVariant,
      priorityLabels: productionPriorityLabels,
      actionLoading,
      onStatusChange: handleStatusChange
    },
    alertDialog: {
      open: alertDialogOpen,
      onOpenChange: setAlertDialogOpen,
      settings: alertSettings,
      busy: alertSaving,
      saving: alertSaving,
      onSettingChange: handleAlertSettingChange,
      onSave: handleSaveAlertSettings
    },
    movementDialog: {
      open: movementDialogOpen,
      onOpenChange: (open) => {
        setMovementDialogOpen(open);
        if (!open) resetMovementForm();
      },
      inventoryItems,
      movementItemId,
      movementType,
      movementQuantity,
      movementReason,
      onItemChange: setMovementItemId,
      onTypeChange: (value) => setMovementType(value),
      onQuantityChange: setMovementQuantity,
      onReasonChange: setMovementReason,
      onSubmit: handleSubmitMovement
    },
    supplierDialog: {
      open: supplierDialogOpen,
      onOpenChange: (open) => {
        setSupplierDialogOpen(open);
        if (!open) resetSupplierForm();
      },
      supplierName,
      supplierEmail,
      supplierPhone,
      supplierContact,
      onNameChange: setSupplierName,
      onEmailChange: setSupplierEmail,
      onPhoneChange: setSupplierPhone,
      onContactChange: setSupplierContact,
      onSubmit: handleSubmitSupplier
    }
  };

  return {
    activeTab,
    setActiveTab,
    headerProps,
    statsProps,
    dashboardProps,
    productsProps,
    movementsProps,
    productionProps,
    suppliersProps,
    alertsProps,
    dialogsProps
  };
}

export default useInventoryPageController;
