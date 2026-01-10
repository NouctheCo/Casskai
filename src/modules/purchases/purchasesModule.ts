import { Module } from '@/types/modules.types';
import PurchasesPage from '@/pages/PurchasesPage';

export const purchasesModule: Module = {
  definition: {
    id: 'purchases',
    key: 'purchases',
    name: 'Achats',
    description: 'Gestion des achats et des fournisseurs',
    version: '1.0.0',
    author: 'CassKai Team',
    category: 'business',
    icon: 'ShoppingCart',
    path: '/purchases',
    isPremium: true,
    isCore: false,
    status: 'available',
    config: { settings: {}, defaultValues: {} },
    permissions: [],
    dependencies: ['accounting', 'thirdParties'],
    conflicts: [],
  },
  getRoutes: () => [
    {
      path: '/purchases',
      component: PurchasesPage,
      exact: true,
    },
  ],
};

export default purchasesModule;
