import { Module } from '@/types/modules.types';
import ContractsPage from '@/pages/ContractsPage';

export const contractsModule: Module = {
  definition: {
    id: 'contracts',
    key: 'contracts',
    name: 'Contrats',
    description: 'Gestion des contrats et documents légaux',
    version: '1.0.0',
    author: 'CassKai Team',
    category: 'business',
    icon: 'FileText',
    path: '/contracts',
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
      path: '/contracts',
      component: ContractsPage,
      exact: true,
    },
  ],
};

export default contractsModule;
