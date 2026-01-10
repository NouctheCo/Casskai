/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
export interface ProjectResource {
  id: string;
  project_id: string;
  user_id: string;
  role?: string;
  allocation_percentage: number;
  start_date?: string;
  end_date?: string;
  hourly_rate?: number;
  created_at: string;
}
export interface ProjectResourceWithDetails extends ProjectResource {
  project_name?: string;
  user_name?: string;
  user_email?: string;
}
export interface CreateResourceInput {
  project_id: string;
  user_id: string;
  role?: string;
  allocation_percentage?: number;
  start_date?: string;
  end_date?: string;
  hourly_rate?: number;
}
export interface UpdateResourceInput {
  role?: string;
  allocation_percentage?: number;
  start_date?: string;
  end_date?: string;
  hourly_rate?: number;
}
export interface ResourceFilters {
  project_id?: string;
  user_id?: string;
}
class ProjectResourcesService {
  /**
   * Get all resources with optional filters
   */
  async getResources(companyId: string, filters?: ResourceFilters): Promise<ProjectResourceWithDetails[]> {
    let query = supabase
      .from('project_resources')
      .select(`
        *,
        projects!inner(id, name, company_id),
        users:user_id(id, email)
      `)
      .eq('projects.company_id', companyId);
    // Apply filters
    if (filters?.project_id) {
      query = query.eq('project_id', filters.project_id);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) {
      logger.error('ProjectResources', 'Error fetching resources:', error);
      throw error;
    }
    // Transform data with relations
    return (data || []).map(resource => ({
      ...resource,
      project_name: resource.projects?.name,
      user_name: resource.users?.email,
      user_email: resource.users?.email
    }));
  }
  /**
   * Get resource by ID
   */
  async getResourceById(resourceId: string): Promise<ProjectResourceWithDetails | null> {
    const { data, error } = await supabase
      .from('project_resources')
      .select(`
        *,
        projects(id, name),
        users:user_id(id, email)
      `)
      .eq('id', resourceId)
      .single();
    if (error) {
      logger.error('ProjectResources', 'Error fetching resource:', error);
      return null;
    }
    return {
      ...data,
      project_name: data.projects?.name,
      user_name: data.users?.email,
      user_email: data.users?.email
    };
  }
  /**
   * Get resources by project
   */
  async getResourcesByProject(projectId: string): Promise<ProjectResourceWithDetails[]> {
    const { data, error } = await supabase
      .from('project_resources')
      .select(`
        *,
        projects(id, name),
        users:user_id(id, email)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) {
      logger.error('ProjectResources', 'Error fetching resources by project:', error);
      throw error;
    }
    return (data || []).map(resource => ({
      ...resource,
      project_name: resource.projects?.name,
      user_name: resource.users?.email,
      user_email: resource.users?.email
    }));
  }
  /**
   * Get resources by user
   */
  async getResourcesByUser(userId: string): Promise<ProjectResourceWithDetails[]> {
    const { data, error } = await supabase
      .from('project_resources')
      .select(`
        *,
        projects(id, name),
        users:user_id(id, email)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      logger.error('ProjectResources', 'Error fetching resources by user:', error);
      throw error;
    }
    return (data || []).map(resource => ({
      ...resource,
      project_name: resource.projects?.name,
      user_name: resource.users?.email,
      user_email: resource.users?.email
    }));
  }
  /**
   * Create a new resource allocation
   */
  async createResource(resourceData: CreateResourceInput): Promise<ProjectResource> {
    const { data, error } = await supabase
      .from('project_resources')
      .insert({
        ...resourceData,
        allocation_percentage: resourceData.allocation_percentage || 100
      })
      .select()
      .single();
    if (error) {
      logger.error('ProjectResources', 'Error creating resource:', error);
      throw error;
    }
    return data;
  }
  /**
   * Update resource allocation
   */
  async updateResource(resourceId: string, updates: UpdateResourceInput): Promise<ProjectResource> {
    const { data, error } = await supabase
      .from('project_resources')
      .update(updates)
      .eq('id', resourceId)
      .select()
      .single();
    if (error) {
      logger.error('ProjectResources', 'Error updating resource:', error);
      throw error;
    }
    return data;
  }
  /**
   * Delete resource allocation
   */
  async deleteResource(resourceId: string): Promise<void> {
    const { error } = await supabase
      .from('project_resources')
      .delete()
      .eq('id', resourceId);
    if (error) {
      logger.error('ProjectResources', 'Error deleting resource:', error);
      throw error;
    }
  }
  /**
   * Get resource statistics for a company
   */
  async getResourceStats(companyId: string): Promise<{
    totalResources: number;
    activeProjects: number;
    totalHourlyRate: number;
    averageAllocation: number;
  }> {
    const resources = await this.getResources(companyId);
    const uniqueUsers = new Set(resources.map(r => r.user_id));
    const uniqueProjects = new Set(resources.map(r => r.project_id));
    const stats = {
      totalResources: uniqueUsers.size,
      activeProjects: uniqueProjects.size,
      totalHourlyRate: resources.reduce((sum, r) => sum + (r.hourly_rate || 0), 0),
      averageAllocation: resources.length > 0
        ? resources.reduce((sum, r) => sum + r.allocation_percentage, 0) / resources.length
        : 0
    };
    return stats;
  }
  /**
   * Get resource availability (projects they're allocated to)
   */
  async getResourceAvailability(userId: string): Promise<{
    totalAllocation: number;
    availableCapacity: number;
    projects: Array<{ project_id: string; project_name: string; allocation: number }>;
  }> {
    const resources = await this.getResourcesByUser(userId);
    const totalAllocation = resources.reduce((sum, r) => sum + r.allocation_percentage, 0);
    return {
      totalAllocation,
      availableCapacity: Math.max(0, 100 - totalAllocation),
      projects: resources.map(r => ({
        project_id: r.project_id,
        project_name: r.project_name || 'Projet inconnu',
        allocation: r.allocation_percentage
      }))
    };
  }
  /**
   * Check if user can be allocated to a project (capacity check)
   */
  async canAllocateUser(userId: string, requestedAllocation: number): Promise<boolean> {
    const availability = await this.getResourceAvailability(userId);
    return availability.availableCapacity >= requestedAllocation;
  }
}
export const projectResourcesService = new ProjectResourcesService();
export default projectResourcesService;