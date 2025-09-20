import { Module } from '@/types/modules.types';
import ThirdPartiesPage from '@/pages/ThirdPartiesPage';

export const thirdPartiesModule: Module = {
  definition: {
    id: 'thirdParties',
    key: 'thirdParties',
    name: 'Tiers',
    description: 'Gestion centralisée de tous vos contacts',
    version: '1.0.0',
    author: 'CassKai Team',
    category: 'business',
    icon: 'UsersRound',
    path: '/third-parties',
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
      path: '/third-parties',
      component: ThirdPartiesPage,
      exact: true,
    },
  ],
};

export default thirdPartiesModule;
