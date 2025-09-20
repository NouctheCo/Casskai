import { Module } from '@/types/modules.types';
import ForecastsPage from '@/pages/ForecastsPage';

export const forecastsModule: Module = {
  definition: {
    id: 'forecasts',
    key: 'forecasts',
    name: 'Prévisions',
    description: 'Analyses prédictives et prévisions financières',
    version: '1.0.0',
    author: 'CassKai Team',
    category: 'business',
    icon: 'Sparkles',
    path: '/forecasts',
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
      path: '/forecasts',
      component: ForecastsPage,
      exact: true,
    },
  ],
};

export default forecastsModule;
