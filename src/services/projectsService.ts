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
// Service Projets moderne intégré avec Supabase
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
export interface Project {
  id: string;
  name: string;
  description?: string;
  client: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  progress: number;
  manager: string;
  team: string[];
  category: string;
  lastActivity?: string;
  totalHours?: number;
  billableHours?: number;
  hourlyRate?: number;
  revenue?: number;
  profit?: number;
  company_id: string;
  created_at: string;
  updated_at: string;
}
export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  progress: number;
  dependencies?: string[];
  tags?: string[];
  company_id: string;
  created_at: string;
  updated_at: string;
}
export interface ProjectTimeEntry {
  id: string;
  project_id: string;
  task_id?: string;
  user_id: string;
  user_name?: string;
  description: string;
  date: string;
  hours: number;
  hourlyRate?: number;
  totalAmount?: number;
  billable: boolean;
  approved: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
}
export interface ProjectMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBudget: number;
  totalSpent: number;
  totalRevenue: number;
  totalProfit: number;
  averageProgress: number;
  projectsByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  projectsByCategory: Array<{
    category: string;
    count: number;
    budget: number;
    revenue: number;
  }>;
  topPerformers: Array<{
    manager: string;
    projectCount: number;
    totalRevenue: number;
    avgProfit: number;
  }>;
  monthlyStats: Array<{
    month: string;
    projects: number;
    revenue: number;
    profit: number;
  }>;
}
export interface ProjectsServiceResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
}
export class ProjectsService {
  private static instance: ProjectsService;
  private constructor() {}
  static getInstance(): ProjectsService {
    if (!this.instance) {
      this.instance = new ProjectsService();
    }
    return this.instance;
  }
  // PROJECTS
  async getProjects(companyId: string, filters?: {
    status?: string;
    category?: string;
    manager?: string;
    priority?: string;
    search?: string;
  }): Promise<ProjectsServiceResponse<Project[]>> {
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .eq('company_id', companyId);
      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.manager) {
        query = query.eq('manager', filters.manager);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,client.ilike.%${filters.search}%`);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) {
        logger.error('Projects', 'Error fetching projects:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }
      // Calculate computed fields
      const enrichedProjects = (data || []).map(project => {
        const profit = (project.revenue || 0) - (project.spent || 0);
        const progressPercentage = Math.min(100, Math.max(0, project.progress || 0));
        return {
          ...project,
          profit,
          progress: progressPercentage
        };
      });
      return {
        success: true,
        data: enrichedProjects as Project[]
      };
    } catch (error) {
      logger.error('Projects', 'Error in getProjects:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  async createProject(companyId: string, projectData: Omit<Project, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'profit'>): Promise<ProjectsServiceResponse<Project>> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          company_id: companyId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) {
        logger.error('Projects', 'Error creating project:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }
      return {
        success: true,
        data: data as Project
      };
    } catch (error) {
      logger.error('Projects', 'Error in createProject:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  async updateProject(projectId: string, updates: Partial<Project>): Promise<ProjectsServiceResponse<Project>> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single();
      if (error) {
        logger.error('Projects', 'Error updating project:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }
      return {
        success: true,
        data: data as Project
      };
    } catch (error) {
      logger.error('Projects', 'Error in updateProject:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  async deleteProject(projectId: string): Promise<ProjectsServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      if (error) {
        logger.error('Projects', 'Error deleting project:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }
      return {
        success: true,
        data: true
      };
    } catch (error) {
      logger.error('Projects', 'Error in deleteProject:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  // PROJECT TASKS
  async getProjectTasks(projectId: string, filters?: {
    status?: string;
    assignee?: string;
    priority?: string;
  }): Promise<ProjectsServiceResponse<ProjectTask[]>> {
    try {
      let query = supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId);
      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.assignee) {
        query = query.eq('assignee', filters.assignee);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) {
        logger.error('Projects', 'Error fetching project tasks:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }
      return {
        success: true,
        data: data as ProjectTask[]
      };
    } catch (error) {
      logger.error('Projects', 'Error in getProjectTasks:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  async createTask(companyId: string, taskData: Omit<ProjectTask, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Promise<ProjectsServiceResponse<ProjectTask>> {
    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .insert({
          ...taskData,
          company_id: companyId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) {
        logger.error('Projects', 'Error creating task:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }
      return {
        success: true,
        data: data as ProjectTask
      };
    } catch (error) {
      logger.error('Projects', 'Error in createTask:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  // TIME TRACKING
  async getTimeEntries(companyId: string, filters?: {
    projectId?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    billable?: boolean;
  }): Promise<ProjectsServiceResponse<ProjectTimeEntry[]>> {
    try {
      let query = supabase
        .from('project_time_entries')
        .select('*')
        .eq('company_id', companyId);
      // Apply filters
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.dateFrom) {
        query = query.gte('entry_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('entry_date', filters.dateTo);
      }
      if (filters?.billable !== undefined) {
        query = query.eq('billable', filters.billable);
      }
      const { data, error } = await query.order('entry_date', { ascending: false });
      if (error) {
        logger.error('Projects', 'Error fetching time entries:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }
      // Enrich with calculated total amount
      const enrichedEntries = (data || []).map(entry => ({
        ...entry,
        totalAmount: (entry.hours || 0) * (entry.hourlyRate || 0)
      }));
      return {
        success: true,
        data: enrichedEntries as ProjectTimeEntry[]
      };
    } catch (error) {
      logger.error('Projects', 'Error in getTimeEntries:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  async createTimeEntry(companyId: string, entryData: Omit<ProjectTimeEntry, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'totalAmount'>): Promise<ProjectsServiceResponse<ProjectTimeEntry>> {
    try {
      const totalAmount = (entryData.hours || 0) * (entryData.hourlyRate || 0);
      const { data, error } = await supabase
        .from('project_time_entries')
        .insert({
          ...entryData,
          totalAmount,
          company_id: companyId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) {
        logger.error('Projects', 'Error creating time entry:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }
      return {
        success: true,
        data: data as ProjectTimeEntry
      };
    } catch (error) {
      logger.error('Projects', 'Error in createTimeEntry:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  // METRICS & ANALYTICS
  async getProjectMetrics(companyId: string): Promise<ProjectsServiceResponse<ProjectMetrics>> {
    try {
      // Execute parallel queries
      const [projectsResult, timeEntriesResult] = await Promise.all([
        supabase.from('projects').select('status, category, manager, budget, spent, revenue, progress').eq('company_id', companyId),
        supabase.from('project_time_entries').select('hours, totalAmount, billable').eq('company_id', companyId).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);
      if (projectsResult.error || timeEntriesResult.error) {
        throw new Error('Error fetching project metrics data');
      }
      const projects = projectsResult.data || [];
      const _timeEntries = timeEntriesResult.data || [];
      // Calculate basic metrics
      const totalProjects = projects.length;
      const activeProjects = projects.filter(p => p.status === 'in_progress').length;
      const completedProjects = projects.filter(p => p.status === 'completed').length;
      const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
      const totalSpent = projects.reduce((sum, p) => sum + (p.spent || 0), 0);
      const totalRevenue = projects.reduce((sum, p) => sum + (p.revenue || 0), 0);
      const totalProfit = totalRevenue - totalSpent;
      const averageProgress = projects.length > 0 ? projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length : 0;
      // Projects by status
      const statusCount = projects.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const projectsByStatus = Object.entries(statusCount).map(([status, count]) => ({
        status,
        count,
        percentage: (count / totalProjects) * 100
      }));
      // Projects by category
      const categoryStats = projects.reduce((acc, p) => {
        const category = p.category || 'Non assigné';
        if (!acc[category]) {
          acc[category] = { count: 0, budget: 0, revenue: 0 };
        }
        acc[category].count += 1;
        acc[category].budget += p.budget || 0;
        acc[category].revenue += p.revenue || 0;
        return acc;
      }, {} as Record<string, { count: number; budget: number; revenue: number }>);
      const projectsByCategory = Object.entries(categoryStats).map(([category, stats]) => ({
        category,
        ...stats
      }));
      // Top performers
      const managerStats = projects.reduce((acc, p) => {
        const manager = p.manager || 'Non assigné';
        if (!acc[manager]) {
          acc[manager] = { projectCount: 0, totalRevenue: 0, totalProfit: 0 };
        }
        acc[manager].projectCount += 1;
        acc[manager].totalRevenue += p.revenue || 0;
        acc[manager].totalProfit += (p.revenue || 0) - (p.spent || 0);
        return acc;
      }, {} as Record<string, { projectCount: number; totalRevenue: number; totalProfit: number }>);
      const topPerformers = Object.entries(managerStats)
        .map(([manager, stats]) => ({
          manager,
          projectCount: stats.projectCount,
          totalRevenue: stats.totalRevenue,
          avgProfit: stats.totalProfit / stats.projectCount
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);
      // Monthly stats (simplified for now)
      const monthlyStats = [
        { month: 'Mars', projects: activeProjects, revenue: totalRevenue * 0.3, profit: totalProfit * 0.25 },
        { month: 'Février', projects: Math.floor(activeProjects * 0.8), revenue: totalRevenue * 0.25, profit: totalProfit * 0.3 },
        { month: 'Janvier', projects: Math.floor(activeProjects * 0.6), revenue: totalRevenue * 0.2, profit: totalProfit * 0.2 }
      ];
      const metrics: ProjectMetrics = {
        totalProjects,
        activeProjects,
        completedProjects,
        totalBudget,
        totalSpent,
        totalRevenue,
        totalProfit,
        averageProgress,
        projectsByStatus,
        projectsByCategory,
        topPerformers,
        monthlyStats
      };
      return {
        success: true,
        data: metrics
      };
    } catch (error) {
      logger.error('Projects', 'Error in getProjectMetrics:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  // CATEGORIES & MANAGERS
  async getCategories(companyId: string): Promise<ProjectsServiceResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('category')
        .eq('company_id', companyId)
        .not('category', 'is', null);
      if (error) {
        logger.error('Projects', 'Error fetching categories:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }
      const categories = [...new Set((data || []).map(item => item.category))].filter(Boolean);
      return {
        success: true,
        data: categories
      };
    } catch (error) {
      logger.error('Projects', 'Error in getCategories:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  async getManagers(companyId: string): Promise<ProjectsServiceResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('manager')
        .eq('company_id', companyId)
        .not('manager', 'is', null);
      if (error) {
        logger.error('Projects', 'Error fetching managers:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }
      const managers = [...new Set((data || []).map(item => item.manager))].filter(Boolean);
      return {
        success: true,
        data: managers
      };
    } catch (error) {
      logger.error('Projects', 'Error in getManagers:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
// Export singleton instance
export const projectsService = ProjectsService.getInstance();