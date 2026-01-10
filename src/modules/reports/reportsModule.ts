import { Module } from '@/types/modules.types';
import ReportsPage from '@/pages/ReportsPage';

export const reportsModule: Module = {
  definition: {
    id: 'reports',
    key: 'reports',
    name: 'Rapports',
    description: 'Génération de rapports financiers détaillés',
    version: '1.0.0',
    author: 'CassKai Team',
    category: 'business',
    icon: 'BarChart3',
    path: '/reports',
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
      path: '/reports',
      component: ReportsPage,
      exact: true,
    },
  ],
};

export default reportsModule;
