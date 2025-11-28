import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InventoryHeader from '@/components/inventory/InventoryHeader';
import InventoryStats from '@/components/inventory/InventoryStats';
import DashboardTab from '@/components/inventory/DashboardTab';
import ProductsTab from '@/components/inventory/ProductsTab';
import MovementsTab from '@/components/inventory/MovementsTab';
import ProductionTab from '@/components/inventory/ProductionTab';
import SuppliersTab from '@/components/inventory/SuppliersTab';
import AlertsTab from '@/components/inventory/AlertsTab';
import InventoryDialogs from '@/components/inventory/InventoryDialogs';
import { useInventoryPageController } from '@/hooks/useInventoryPageController';

export default function InventoryPage() {
  const {
    activeTab,
    setActiveTab,
    dashboardProps,
    productsProps,
    movementsProps,
    productionProps,
    suppliersProps,
    alertsProps,
    headerProps,
    statsProps,
    dialogsProps
  } = useInventoryPageController();

  return (
    <div className="space-y-6">
      <InventoryHeader {...headerProps} />

      <InventoryStats {...statsProps} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="movements">Mouvements</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardTab {...dashboardProps} />
        </TabsContent>

        <TabsContent value="products">
          <ProductsTab {...productsProps} />
        </TabsContent>

        <TabsContent value="movements">
          <MovementsTab {...movementsProps} />
        </TabsContent>

        <TabsContent value="production">
          <ProductionTab {...productionProps} />
        </TabsContent>

        <TabsContent value="suppliers">
          <SuppliersTab {...suppliersProps} />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsTab {...alertsProps} />
        </TabsContent>
      </Tabs>

      <InventoryDialogs {...dialogsProps} />
    </div>
  );
}
