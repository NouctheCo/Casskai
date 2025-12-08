import { Module } from '@/types/modules.types';
import InventoryPage from '@/pages/InventoryPage';

export const inventoryModule: Module = {
  definition: {
    id: 'inventory',
    key: 'inventory',
    name: 'Inventaire',
    description: 'Suivi des stocks et gestion des inventaires',
    version: '1.0.0',
    author: 'CassKai Team',
    category: 'business',
    icon: 'Archive',
    path: '/inventory',
    isPremium: true,
    isCore: false,
    status: 'available',
    config: { settings: {}, defaultValues: {} },
    permissions: [],
    dependencies: [],
    conflicts: [],
  },
  getRoutes: () => [
    {
      path: '/inventory',
      component: InventoryPage,
      exact: true,
    },
  ],
};

export default inventoryModule;
