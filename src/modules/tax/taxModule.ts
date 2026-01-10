import { Module } from '@/types/modules.types';
import TaxPage from '@/pages/TaxPage';

export const taxModule: Module = {
  definition: {
    id: 'tax',
    key: 'tax',
    name: 'Fiscalité',
    description: 'Gestion fiscale et préparation des déclarations',
    version: '1.0.0',
    author: 'CassKai Team',
    category: 'business',
    icon: 'Zap',
    path: '/tax',
    isPremium: true,
    isCore: false,
    status: 'available',
    config: { settings: {}, defaultValues: {} },
    permissions: [],
    dependencies: ['accounting'],
    conflicts: [],
  },
  getRoutes: () => [
    {
      path: '/tax',
      component: TaxPage,
      exact: true,
    },
  ],
};

export default taxModule;
