/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import { useState, useEffect, useCallback } from 'react';

import { useAuth } from '@/contexts/AuthContext';

import {
  projectsService,
  Project,
  ProjectTask,
  ProjectTimeEntry,
  ProjectMetrics
} from '@/services/projectsService';



interface UseProjectsReturn {

  // Data

  projects: Project[];

  tasks: ProjectTask[];

  timeEntries: ProjectTimeEntry[];

  metrics: ProjectMetrics | null;

  categories: string[];

  managers: string[];



  // Loading states

  loading: boolean;

  projectsLoading: boolean;

  tasksLoading: boolean;

  timeEntriesLoading: boolean;

  metricsLoading: boolean;



  // Error state

  error: string | null;



  // Fetch functions

  fetchProjects: (filters?: { status?: string; category?: string; manager?: string; priority?: string; search?: string }) => Promise<void>;

  fetchProjectTasks: (projectId: string, filters?: { status?: string; assignee?: string; priority?: string }) => Promise<void>;

  fetchTimeEntries: (filters?: { projectId?: string; userId?: string; dateFrom?: string; dateTo?: string; billable?: boolean }) => Promise<void>;

  fetchMetrics: () => Promise<void>;

  fetchCategories: () => Promise<void>;

  fetchManagers: () => Promise<void>;



  // CRUD operations

  createProject: (projectData: Omit<Project, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'profit'>) => Promise<boolean>;

  updateProject: (projectId: string, updates: Partial<Project>) => Promise<boolean>;

  deleteProject: (projectId: string) => Promise<boolean>;



  createTask: (taskData: Omit<ProjectTask, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => Promise<boolean>;

  createTimeEntry: (entryData: Omit<ProjectTimeEntry, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'totalAmount'>) => Promise<boolean>;



  // Utility

  refreshAll: () => Promise<void>;



  // Computed values

  activeProjects: Project[];

  completedProjects: Project[];

  totalBudget: number;

  totalRevenue: number;

  averageProgress: number;

}



export function useProjects(): UseProjectsReturn {

  const { currentCompany } = useAuth();



  // States

  const [projects, setProjects] = useState<Project[]>([]);

  const [tasks, setTasks] = useState<ProjectTask[]>([]);

  const [timeEntries, setTimeEntries] = useState<ProjectTimeEntry[]>([]);

  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);

  const [categories, setCategories] = useState<string[]>([]);

  const [managers, setManagers] = useState<string[]>([]);



  // Loading states

  const [loading, _setLoading] = useState(false);

  const [projectsLoading, setProjectsLoading] = useState(false);

  const [tasksLoading, setTasksLoading] = useState(false);

  const [timeEntriesLoading, setTimeEntriesLoading] = useState(false);

  const [metricsLoading, setMetricsLoading] = useState(false);



  // Error state

  const [error, setError] = useState<string | null>(null);



  // Fetch functions

  const fetchProjects = useCallback(async (filters?: { status?: string; category?: string; manager?: string; priority?: string; search?: string }) => {

    if (!currentCompany?.id) return;



    setProjectsLoading(true);

    setError(null);



    try {

      const response = await projectsService.getProjects(currentCompany.id, filters);



      if (response.success && response.data) {

        setProjects(response.data);

      } else {

        setError(response.error || 'Failed to fetch projects');

      }

    } catch (err) {

      setError(err instanceof Error ? (err as Error).message : 'Unknown error');

    } finally {

      setProjectsLoading(false);

    }

  }, [currentCompany?.id]);



  const fetchProjectTasks = useCallback(async (projectId: string, filters?: { status?: string; assignee?: string; priority?: string }) => {

    if (!currentCompany?.id) return;



    setTasksLoading(true);

    setError(null);



    try {

      const response = await projectsService.getProjectTasks(projectId, filters);



      if (response.success && response.data) {

        setTasks(response.data);

      } else {

        setError(response.error || 'Failed to fetch tasks');

      }

    } catch (err) {

      setError(err instanceof Error ? (err as Error).message : 'Unknown error');

    } finally {

      setTasksLoading(false);

    }

  }, [currentCompany?.id]);



  const fetchTimeEntries = useCallback(async (filters?: { projectId?: string; userId?: string; dateFrom?: string; dateTo?: string; billable?: boolean }) => {

    if (!currentCompany?.id) return;



    setTimeEntriesLoading(true);

    setError(null);



    try {

      const response = await projectsService.getTimeEntries(currentCompany.id, filters);



      if (response.success && response.data) {

        setTimeEntries(response.data);

      } else {

        setError(response.error || 'Failed to fetch time entries');

      }

    } catch (err) {

      setError(err instanceof Error ? (err as Error).message : 'Unknown error');

    } finally {

      setTimeEntriesLoading(false);

    }

  }, [currentCompany?.id]);



  const fetchMetrics = useCallback(async () => {

    if (!currentCompany?.id) return;



    setMetricsLoading(true);

    setError(null);



    try {

      const response = await projectsService.getProjectMetrics(currentCompany.id);



      if (response.success && response.data) {

        setMetrics(response.data);

      } else {

        setError(response.error || 'Failed to fetch project metrics');

      }

    } catch (err) {

      setError(err instanceof Error ? (err as Error).message : 'Unknown error');

    } finally {

      setMetricsLoading(false);

    }

  }, [currentCompany?.id]);



  const fetchCategories = useCallback(async () => {

    if (!currentCompany?.id) return;



    try {

      const response = await projectsService.getCategories(currentCompany.id);



      if (response.success && response.data) {

        setCategories(response.data);

      }

    } catch (err) {

      console.warn('Failed to fetch categories:', err);

    }

  }, [currentCompany?.id]);



  const fetchManagers = useCallback(async () => {

    if (!currentCompany?.id) return;



    try {

      const response = await projectsService.getManagers(currentCompany.id);



      if (response.success && response.data) {

        setManagers(response.data);

      }

    } catch (err) {

      console.warn('Failed to fetch managers:', err);

    }

  }, [currentCompany?.id]);



  // CRUD operations

  const createProject = useCallback(async (projectData: Omit<Project, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'profit'>): Promise<boolean> => {

    if (!currentCompany?.id) return false;



    try {

      const response = await projectsService.createProject(currentCompany.id, projectData);



      if (response.success) {

        await fetchProjects();

        await fetchMetrics();

        await fetchCategories();

        await fetchManagers();

        return true;

      } else {

        setError(response.error || 'Failed to create project');

        return false;

      }

    } catch (err) {

      setError(err instanceof Error ? (err as Error).message : 'Unknown error');

      return false;

    }

  }, [currentCompany?.id, fetchProjects, fetchMetrics, fetchCategories, fetchManagers]);



  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>): Promise<boolean> => {

    try {

      const response = await projectsService.updateProject(projectId, updates);



      if (response.success) {

        await fetchProjects();

        await fetchMetrics();

        return true;

      } else {

        setError(response.error || 'Failed to update project');

        return false;

      }

    } catch (err) {

      setError(err instanceof Error ? (err as Error).message : 'Unknown error');

      return false;

    }

  }, [fetchProjects, fetchMetrics]);



  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {

    try {

      const response = await projectsService.deleteProject(projectId);



      if (response.success) {

        await fetchProjects();

        await fetchMetrics();

        return true;

      } else {

        setError(response.error || 'Failed to delete project');

        return false;

      }

    } catch (err) {

      setError(err instanceof Error ? (err as Error).message : 'Unknown error');

      return false;

    }

  }, [fetchProjects, fetchMetrics]);



  const createTask = useCallback(async (taskData: Omit<ProjectTask, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Promise<boolean> => {

    if (!currentCompany?.id) return false;



    try {

      const response = await projectsService.createTask(currentCompany.id, taskData);



      if (response.success) {

        await fetchProjectTasks(taskData.project_id);

        return true;

      } else {

        setError(response.error || 'Failed to create task');

        return false;

      }

    } catch (err) {

      setError(err instanceof Error ? (err as Error).message : 'Unknown error');

      return false;

    }

  }, [currentCompany?.id, fetchProjectTasks]);



  const createTimeEntry = useCallback(async (entryData: Omit<ProjectTimeEntry, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'totalAmount'>): Promise<boolean> => {

    if (!currentCompany?.id) return false;



    try {

      const response = await projectsService.createTimeEntry(currentCompany.id, entryData);



      if (response.success) {

        await fetchTimeEntries();

        await fetchMetrics();

        return true;

      } else {

        setError(response.error || 'Failed to create time entry');

        return false;

      }

    } catch (err) {

      setError(err instanceof Error ? (err as Error).message : 'Unknown error');

      return false;

    }

  }, [currentCompany?.id, fetchTimeEntries, fetchMetrics]);



  // Utility function to refresh all data

  const refreshAll = useCallback(async () => {

    await Promise.all([

      fetchProjects(),

      fetchMetrics(),

      fetchCategories(),

      fetchManagers()

    ]);

  }, [fetchProjects, fetchMetrics, fetchCategories, fetchManagers]);



  // Computed values

  const activeProjects = projects.filter(project => project.status === 'in_progress');

  const completedProjects = projects.filter(project => project.status === 'completed');

  const totalBudget = projects.reduce((sum, project) => sum + (project.budget || 0), 0);

  const totalRevenue = projects.reduce((sum, project) => sum + (project.revenue || 0), 0);

  const averageProgress = projects.length > 0 ? projects.reduce((sum, project) => sum + (project.progress || 0), 0) / projects.length : 0;



  // Initial data load

  useEffect(() => {

    if (currentCompany?.id) {

      fetchMetrics();

      fetchProjects();

      fetchCategories();

      fetchManagers();

    }

  }, [currentCompany?.id, fetchMetrics, fetchProjects, fetchCategories, fetchManagers]);



  return {

    // Data

    projects,

    tasks,

    timeEntries,

    metrics,

    categories,

    managers,



    // Loading states

    loading,

    projectsLoading,

    tasksLoading,

    timeEntriesLoading,

    metricsLoading,



    // Error

    error,



    // Fetch functions

    fetchProjects,

    fetchProjectTasks,

    fetchTimeEntries,

    fetchMetrics,

    fetchCategories,

    fetchManagers,



    // CRUD

    createProject,

    updateProject,

    deleteProject,

    createTask,

    createTimeEntry,



    // Utility

    refreshAll,



    // Computed values

    activeProjects,

    completedProjects,

    totalBudget,

    totalRevenue,

    averageProgress

  };

}
