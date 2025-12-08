import { Module } from '@/types/modules.types';
import ProjectsPage from '@/pages/ProjectsPage';

export const projectsModule: Module = {
  definition: {
    id: 'projects',
    key: 'projects',
    name: 'Projets',
    description: 'Gestion de projets et suivi des tâches',
    version: '1.0.0',
    author: 'CassKai Team',
    category: 'business',
    icon: 'KanbanSquare',
    path: '/projects',
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
      path: '/projects',
      component: ProjectsPage,
      exact: true,
    },
  ],
};

export default projectsModule;
