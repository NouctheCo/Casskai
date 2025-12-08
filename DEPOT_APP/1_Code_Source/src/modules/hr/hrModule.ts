import { Module } from '@/types/modules.types';
import HumanResourcesPage from '@/pages/HumanResourcesPage';

export const hrModule: Module = {
  definition: {
    id: 'humanResources',
    key: 'hr',
    name: 'Ressources Humaines',
    description: 'Gestion RH complète et paie',
    version: '1.0.0',
    author: 'CassKai Team',
    category: 'business',
    icon: 'Users2',
    path: '/hr',
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
      path: '/hr',
      component: HumanResourcesPage,
      exact: true,
    },
  ],
};

export default hrModule;
