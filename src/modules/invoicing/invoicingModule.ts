import { Module } from '@/types/modules.types';
import InvoicingPage from '@/pages/InvoicingPage';

export const invoicingModule: Module = {
  definition: {
    id: 'invoicing',
    key: 'invoicing',
    name: 'Facturation',
    description: 'Création et gestion de vos factures clients',
    version: '1.0.0',
    author: 'CassKai Team',
    category: 'business',
    icon: 'FileText',
    path: '/invoicing',
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
      path: '/invoicing',
      component: InvoicingPage,
      exact: true,
    },
  ],
};

export default invoicingModule;
