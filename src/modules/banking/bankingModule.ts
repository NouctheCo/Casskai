import { Module } from '@/types/modules.types';
import BanksPage from '@/pages/BanksPage';

export const bankingModule: Module = {
  definition: {
    id: 'banking',
    key: 'banking',
    name: 'Banque',
    description: 'Synchronisation et rapprochement bancaire automatisé',
    version: '1.0.0',
    author: 'CassKai Team',
    category: 'business',
    icon: 'Landmark',
    path: '/banks',
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
      path: '/banks',
      component: BanksPage,
      exact: true,
    },
  ],
};

export default bankingModule;
