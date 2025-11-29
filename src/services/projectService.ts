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

/**
 * Service de gestion des projets
 * Gère les projets, tâches, timesheets, ressources et facturation
 */

import { supabase } from '@/lib/supabase';

export interface Project {
  id: string;
  company_id: string;
  name: string;
  code?: string;
  description?: string;
  third_party_id?: string;
  client_name?: string;
  start_date?: string;
  end_date?: string;
  deadline?: string;
  budget_amount: number;
  budget_currency: string;
  hourly_rate: number;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  manager_id?: string;
  manager_name?: string;
  billing_type: 'fixed' | 'hourly' | 'milestone' | 'retainer';
  is_billable: boolean;
  color: string;
  tags?: string[];
  created_at: string;
  updated_at: string;

  // Stats calculées
  total_hours?: number;
  total_amount?: number;
  tasks_count?: number;
  tasks_completed?: number;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  parent_task_id?: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  assigned_to?: string;
  assigned_name?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Timesheet {
  id: string;
  company_id: string;
  project_id: string;
  project_name?: string;
  task_id?: string;
  task_name?: string;
  user_id: string;
  user_name?: string;
  date: string;
  hours: number;
  description?: string;
  is_billable: boolean;
  hourly_rate?: number;
  amount?: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'invoiced';
  approved_by?: string;
  approved_at?: string;
  invoice_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectResource {
  id: string;
  project_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  role?: string;
  allocation_percentage: number;
  start_date?: string;
  end_date?: string;
  hourly_rate?: number;
  created_at: string;
}

export const projectService = {
  // ========== PROJETS ==========

  async getProjects(companyId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        third_parties(name),
        users!projects_manager_id_fkey(full_name)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enrichir avec les stats
    const projectsWithStats = await Promise.all(
      (data || []).map(async (project) => {
        const stats = await this.getProjectStats(project.id);
        return {
          ...project,
          client_name: project.third_parties?.name,
          manager_name: project.users?.full_name,
          ...stats
        };
      })
    );

    return projectsWithStats;
  },

  async getProject(projectId: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        third_parties(name),
        users!projects_manager_id_fkey(full_name)
      `)
      .eq('id', projectId)
      .single();

    if (error) throw error;
    if (!data) return null;

    const stats = await this.getProjectStats(projectId);

    return {
      ...data,
      client_name: data.third_parties?.name,
      manager_name: data.users?.full_name,
      ...stats
    };
  },

  async getProjectStats(projectId: string) {
    // Heures totales
    const { data: timesheets } = await supabase
      .from('timesheets')
      .select('hours, amount')
      .eq('project_id', projectId);

    // Tâches
    const { data: tasks } = await supabase
      .from('project_tasks')
      .select('id, status')
      .eq('project_id', projectId);

    return {
      total_hours: timesheets?.reduce((sum, t) => sum + (t.hours || 0), 0) || 0,
      total_amount: timesheets?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
      tasks_count: tasks?.length || 0,
      tasks_completed: tasks?.filter(t => t.status === 'done').length || 0
    };
  },

  async createProject(companyId: string, data: Partial<Project>): Promise<Project> {
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        company_id: companyId,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return project;
  },

  async updateProject(projectId: string, data: Partial<Project>): Promise<Project> {
    const { data: project, error } = await supabase
      .from('projects')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return project;
  },

  async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  },

  // ========== TÂCHES ==========

  async getTasks(projectId: string): Promise<ProjectTask[]> {
    const { data, error } = await supabase
      .from('project_tasks')
      .select(`
        *,
        users!project_tasks_assigned_to_fkey(full_name)
      `)
      .eq('project_id', projectId)
      .order('sort_order');

    if (error) throw error;

    // Calculer les heures réelles par tâche
    const tasksWithHours = await Promise.all(
      (data || []).map(async (task) => {
        const { data: timesheets } = await supabase
          .from('timesheets')
          .select('hours')
          .eq('task_id', task.id);

        return {
          ...task,
          assigned_name: task.users?.full_name,
          actual_hours: timesheets?.reduce((sum, t) => sum + (t.hours || 0), 0) || 0
        };
      })
    );

    return tasksWithHours;
  },

  async createTask(projectId: string, data: Partial<ProjectTask>): Promise<ProjectTask> {
    const { data: task, error } = await supabase
      .from('project_tasks')
      .insert({
        project_id: projectId,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return task;
  },

  async updateTask(taskId: string, data: Partial<ProjectTask>): Promise<ProjectTask> {
    const { data: task, error } = await supabase
      .from('project_tasks')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return task;
  },

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('project_tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  },

  // ========== TIMESHEETS ==========

  async getTimesheets(companyId: string, filters?: {
    projectId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<Timesheet[]> {
    let query = supabase
      .from('timesheets')
      .select(`
        *,
        projects(name),
        project_tasks(name),
        users(full_name)
      `)
      .eq('company_id', companyId)
      .order('date', { ascending: false });

    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId);
    }
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(t => ({
      ...t,
      project_name: t.projects?.name,
      task_name: t.project_tasks?.name,
      user_name: t.users?.full_name
    }));
  },

  async createTimesheet(companyId: string, data: Partial<Timesheet>): Promise<Timesheet> {
    const { data: timesheet, error } = await supabase
      .from('timesheets')
      .insert({
        company_id: companyId,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return timesheet;
  },

  async updateTimesheet(timesheetId: string, data: Partial<Timesheet>): Promise<Timesheet> {
    const { data: timesheet, error } = await supabase
      .from('timesheets')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', timesheetId)
      .select()
      .single();

    if (error) throw error;
    return timesheet;
  },

  async approveTimesheet(timesheetId: string, userId: string): Promise<Timesheet> {
    const { data, error } = await supabase
      .from('timesheets')
      .update({
        status: 'approved',
        approved_by: userId,
        approved_at: new Date().toISOString()
      })
      .eq('id', timesheetId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async rejectTimesheet(timesheetId: string): Promise<Timesheet> {
    const { data, error } = await supabase
      .from('timesheets')
      .update({ status: 'rejected' })
      .eq('id', timesheetId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ========== RESSOURCES ==========

  async getProjectResources(projectId: string): Promise<ProjectResource[]> {
    const { data, error } = await supabase
      .from('project_resources')
      .select(`
        *,
        users(full_name, email)
      `)
      .eq('project_id', projectId);

    if (error) throw error;

    return (data || []).map(r => ({
      ...r,
      user_name: r.users?.full_name,
      user_email: r.users?.email
    }));
  },

  async addResource(projectId: string, userId: string, data: Partial<ProjectResource>): Promise<ProjectResource> {
    const { data: resource, error } = await supabase
      .from('project_resources')
      .insert({
        project_id: projectId,
        user_id: userId,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return resource;
  },

  async removeResource(resourceId: string): Promise<void> {
    const { error } = await supabase
      .from('project_resources')
      .delete()
      .eq('id', resourceId);

    if (error) throw error;
  },

  // ========== DASHBOARD STATS ==========

  async getDashboardStats(companyId: string) {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, status, budget_amount')
      .eq('company_id', companyId);

    const { data: timesheets } = await supabase
      .from('timesheets')
      .select('hours, amount, status')
      .eq('company_id', companyId);

    const projectIds = (projects || []).map(p => p.id);

    const { data: tasks } = await supabase
      .from('project_tasks')
      .select('status')
      .in('project_id', projectIds);

    const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
    const totalBudget = projects?.reduce((sum, p) => sum + (p.budget_amount || 0), 0) || 0;
    const totalHours = timesheets?.reduce((sum, t) => sum + (t.hours || 0), 0) || 0;
    const billableAmount = timesheets?.filter(t => t.status === 'approved')
      .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    const pendingApproval = timesheets?.filter(t => t.status === 'submitted').length || 0;
    const tasksInProgress = tasks?.filter(t => t.status === 'in_progress').length || 0;
    const tasksDone = tasks?.filter(t => t.status === 'done').length || 0;

    return {
      activeProjects,
      totalProjects: projects?.length || 0,
      totalBudget,
      totalHours,
      billableAmount,
      pendingApproval,
      tasksTotal: tasks?.length || 0,
      tasksInProgress,
      tasksDone
    };
  }
};
