/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
export interface Timesheet {
  id: string;
  company_id: string;
  project_id: string;
  task_id?: string;
  user_id: string;
  date: string;
  hours: number;
  description?: string;
  is_billable: boolean;
  hourly_rate?: number;
  amount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'invoiced';
  approved_by?: string;
  approved_at?: string;
  invoice_id?: string;
  created_at: string;
  updated_at: string;
}
export interface TimesheetWithDetails extends Timesheet {
  project_name?: string;
  task_name?: string;
  user_name?: string;
  user_email?: string;
  approved_by_name?: string;
}
export interface CreateTimesheetInput {
  project_id: string;
  task_id?: string;
  user_id: string;
  date: string;
  hours: number;
  description?: string;
  is_billable?: boolean;
  hourly_rate?: number;
  status?: 'draft' | 'submitted' | 'approved' | 'rejected' | 'invoiced';
}
export interface UpdateTimesheetInput {
  date?: string;
  hours?: number;
  description?: string;
  is_billable?: boolean;
  hourly_rate?: number;
  status?: 'draft' | 'submitted' | 'approved' | 'rejected' | 'invoiced';
  approved_by?: string;
  approved_at?: string;
}
export interface TimesheetFilters {
  project_id?: string;
  task_id?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
  is_billable?: boolean;
}
class TimesheetsService {
  /**
   * Get all timesheets with optional filters
   */
  async getTimesheets(companyId: string, filters?: TimesheetFilters): Promise<TimesheetWithDetails[]> {
    let query = supabase
      .from('timesheets')
      .select(`
        *,
        projects!inner(id, name, company_id),
        project_tasks(id, name),
        users:user_id(id, email),
        approver:approved_by(id, email)
      `)
      .eq('company_id', companyId);
    // Apply filters
    if (filters?.project_id) {
      query = query.eq('project_id', filters.project_id);
    }
    if (filters?.task_id) {
      query = query.eq('task_id', filters.task_id);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters?.date_from) {
      query = query.gte('date', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('date', filters.date_to);
    }
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.is_billable !== undefined) {
      query = query.eq('is_billable', filters.is_billable);
    }
    query = query.order('date', { ascending: false }).order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) {
      logger.error('Timesheets', 'Error fetching timesheets:', error);
      throw error;
    }
    // Transform data with relations
    return (data || []).map(timesheet => ({
      ...timesheet,
      project_name: timesheet.projects?.name,
      task_name: timesheet.project_tasks?.name,
      user_name: timesheet.users?.email,
      user_email: timesheet.users?.email,
      approved_by_name: timesheet.approver?.email
    }));
  }
  /**
   * Get timesheet by ID
   */
  async getTimesheetById(timesheetId: string): Promise<TimesheetWithDetails | null> {
    const { data, error } = await supabase
      .from('timesheets')
      .select(`
        *,
        projects(id, name),
        project_tasks(id, name),
        users:user_id(id, email),
        approver:approved_by(id, email)
      `)
      .eq('id', timesheetId)
      .single();
    if (error) {
      logger.error('Timesheets', 'Error fetching timesheet:', error);
      return null;
    }
    return {
      ...data,
      project_name: data.projects?.name,
      task_name: data.project_tasks?.name,
      user_name: data.users?.email,
      user_email: data.users?.email,
      approved_by_name: data.approver?.email
    };
  }
  /**
   * Get timesheets by project
   */
  async getTimesheetsByProject(projectId: string): Promise<TimesheetWithDetails[]> {
    const { data, error } = await supabase
      .from('timesheets')
      .select(`
        *,
        projects(id, name),
        project_tasks(id, name),
        users:user_id(id, email)
      `)
      .eq('project_id', projectId)
      .order('date', { ascending: false });
    if (error) {
      logger.error('Timesheets', 'Error fetching timesheets by project:', error);
      throw error;
    }
    return (data || []).map(timesheet => ({
      ...timesheet,
      project_name: timesheet.projects?.name,
      task_name: timesheet.project_tasks?.name,
      user_name: timesheet.users?.email,
      user_email: timesheet.users?.email
    }));
  }
  /**
   * Create a new timesheet
   */
  async createTimesheet(companyId: string, timesheetData: CreateTimesheetInput): Promise<Timesheet> {
    const { data, error } = await supabase
      .from('timesheets')
      .insert({
        company_id: companyId,
        ...timesheetData,
        status: timesheetData.status || 'draft',
        is_billable: timesheetData.is_billable !== undefined ? timesheetData.is_billable : true
      })
      .select()
      .single();
    if (error) {
      logger.error('Timesheets', 'Error creating timesheet:', error);
      throw error;
    }
    return data;
  }
  /**
   * Update timesheet
   */
  async updateTimesheet(timesheetId: string, updates: UpdateTimesheetInput): Promise<Timesheet> {
    const { data, error } = await supabase
      .from('timesheets')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', timesheetId)
      .select()
      .single();
    if (error) {
      logger.error('Timesheets', 'Error updating timesheet:', error);
      throw error;
    }
    return data;
  }
  /**
   * Delete timesheet
   */
  async deleteTimesheet(timesheetId: string): Promise<void> {
    const { error } = await supabase
      .from('timesheets')
      .delete()
      .eq('id', timesheetId);
    if (error) {
      logger.error('Timesheets', 'Error deleting timesheet:', error);
      throw error;
    }
  }
  /**
   * Submit timesheet for approval
   */
  async submitTimesheet(timesheetId: string): Promise<Timesheet> {
    return this.updateTimesheet(timesheetId, { status: 'submitted' });
  }
  /**
   * Approve timesheet
   */
  async approveTimesheet(timesheetId: string, approvedBy: string): Promise<Timesheet> {
    return this.updateTimesheet(timesheetId, {
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString()
    });
  }
  /**
   * Reject timesheet
   */
  async rejectTimesheet(timesheetId: string, approvedBy: string): Promise<Timesheet> {
    return this.updateTimesheet(timesheetId, {
      status: 'rejected',
      approved_by: approvedBy,
      approved_at: new Date().toISOString()
    });
  }
  /**
   * Get timesheet statistics
   */
  async getTimesheetStats(companyId: string, filters?: TimesheetFilters): Promise<{
    totalHours: number;
    billableHours: number;
    nonBillableHours: number;
    totalAmount: number;
    entriesCount: number;
    draftCount: number;
    submittedCount: number;
    approvedCount: number;
    rejectedCount: number;
  }> {
    const timesheets = await this.getTimesheets(companyId, filters);
    const stats = {
      totalHours: timesheets.reduce((sum, t) => sum + t.hours, 0),
      billableHours: timesheets.filter(t => t.is_billable).reduce((sum, t) => sum + t.hours, 0),
      nonBillableHours: timesheets.filter(t => !t.is_billable).reduce((sum, t) => sum + t.hours, 0),
      totalAmount: timesheets.reduce((sum, t) => sum + t.amount, 0),
      entriesCount: timesheets.length,
      draftCount: timesheets.filter(t => t.status === 'draft').length,
      submittedCount: timesheets.filter(t => t.status === 'submitted').length,
      approvedCount: timesheets.filter(t => t.status === 'approved').length,
      rejectedCount: timesheets.filter(t => t.status === 'rejected').length
    };
    return stats;
  }
  /**
   * Get weekly timesheets for a user
   */
  async getWeeklyTimesheets(companyId: string, userId: string, weekStart: string): Promise<TimesheetWithDetails[]> {
    // Calculate week end (6 days after start)
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    return this.getTimesheets(companyId, {
      user_id: userId,
      date_from: weekStart,
      date_to: weekEndDate.toISOString().split('T')[0]
    });
  }
}
export const timesheetsService = new TimesheetsService();
export default timesheetsService;