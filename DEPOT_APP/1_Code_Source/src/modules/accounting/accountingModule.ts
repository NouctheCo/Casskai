import { Module } from '@/types/modules.types';
import AccountingPage from '@/pages/AccountingPage';

export const accountingModule: Module = {
  definition: {
    id: 'accounting',
    key: 'accounting',
    name: 'Comptabilité',
    description: 'Gestion complète de votre comptabilité générale',
    version: '1.0.0',
    author: 'CassKai Team',
    category: 'business',
    icon: 'Briefcase',
    path: '/accounting',
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
      path: '/accounting',
      component: AccountingPage,
      exact: true,
    },
  ],
};

export default accountingModule;
