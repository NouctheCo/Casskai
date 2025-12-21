/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

import { supabase } from '@/lib/supabase';

export interface ProjectTask {
  id: string;
  project_id: string;
  parent_task_id?: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  estimated_hours?: number;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  assigned_to?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectTaskWithDetails extends ProjectTask {
  project_name?: string;
  assigned_to_name?: string;
}

export interface CreateTaskInput {
  project_id: string;
  parent_task_id?: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  estimated_hours?: number;
  status?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  progress?: number;
  assigned_to?: string;
  sort_order?: number;
}

export interface UpdateTaskInput {
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  estimated_hours?: number;
  status?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  progress?: number;
  assigned_to?: string;
  sort_order?: number;
}

export interface TaskFilters {
  project_id?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  search?: string;
}

class ProjectTasksService {
  /**
   * Get all tasks with optional filters
   */
  async getTasks(companyId: string, filters?: TaskFilters): Promise<ProjectTaskWithDetails[]> {
    let query = supabase
      .from('project_tasks')
      .select(`
        *,
        projects!inner(id, name, company_id),
        users:assigned_to(id, email)
      `)
      .eq('projects.company_id', companyId);

    // Apply filters
    if (filters?.project_id) {
      query = query.eq('project_id', filters.project_id);
    }
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    query = query.order('sort_order', { ascending: true }).order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }

    // Transform data with relations
    return (data || []).map(task => ({
      ...task,
      project_name: task.projects?.name,
      assigned_to_name: task.users?.email
    }));
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId: string): Promise<ProjectTaskWithDetails | null> {
    const { data, error } = await supabase
      .from('project_tasks')
      .select(`
        *,
        projects(id, name),
        users:assigned_to(id, email)
      `)
      .eq('id', taskId)
      .single();

    if (error) {
      console.error('Error fetching task:', error);
      return null;
    }

    return {
      ...data,
      project_name: data.projects?.name,
      assigned_to_name: data.users?.email
    };
  }

  /**
   * Get tasks by project
   */
  async getTasksByProject(projectId: string): Promise<ProjectTaskWithDetails[]> {
    const { data, error } = await supabase
      .from('project_tasks')
      .select(`
        *,
        projects(id, name),
        users:assigned_to(id, email)
      `)
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks by project:', error);
      throw error;
    }

    return (data || []).map(task => ({
      ...task,
      project_name: task.projects?.name,
      assigned_to_name: task.users?.email
    }));
  }

  /**
   * Create a new task
   */
  async createTask(taskData: CreateTaskInput): Promise<ProjectTask> {
    const { data, error } = await supabase
      .from('project_tasks')
      .insert({
        ...taskData,
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        progress: taskData.progress || 0,
        sort_order: taskData.sort_order || 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update task
   */
  async updateTask(taskId: string, updates: UpdateTaskInput): Promise<ProjectTask> {
    const { data, error } = await supabase
      .from('project_tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('project_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: ProjectTask['status']): Promise<ProjectTask> {
    // Auto-update progress based on status
    let progress = undefined;
    if (status === 'done') progress = 100;
    if (status === 'in_progress' && progress === 0) progress = 10;
    if (status === 'cancelled') progress = 0;

    return this.updateTask(taskId, { status, ...(progress !== undefined && { progress }) });
  }

  /**
   * Update task progress
   */
  async updateTaskProgress(taskId: string, progress: number): Promise<ProjectTask> {
    // Auto-update status based on progress
    let status: ProjectTask['status'] | undefined = undefined;
    if (progress === 100) status = 'done';
    else if (progress > 0 && progress < 100) status = 'in_progress';

    return this.updateTask(taskId, { progress, ...(status && { status }) });
  }

  /**
   * Reorder tasks
   */
  async reorderTasks(taskIds: string[]): Promise<void> {
    const updates = taskIds.map((id, index) => ({
      id,
      sort_order: index
    }));

    for (const update of updates) {
      await supabase
        .from('project_tasks')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);
    }
  }

  /**
   * Get task statistics for a project
   */
  async getTaskStats(projectId: string): Promise<{
    total: number;
    todo: number;
    in_progress: number;
    review: number;
    done: number;
    cancelled: number;
    completionRate: number;
  }> {
    const tasks = await this.getTasksByProject(projectId);

    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      done: tasks.filter(t => t.status === 'done').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
      completionRate: tasks.length > 0 ? (tasks.filter(t => t.status === 'done').length / tasks.length) * 100 : 0
    };

    return stats;
  }
}

export const projectTasksService = new ProjectTasksService();
export default projectTasksService;
