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
 * Service pour la gestion de la performance RH
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type {
  Objective,
  PerformanceReview,
  ObjectiveFormData,
  ReviewFormData,
  FeedbackFormData
} from '@/types/hr-performance.types';
export class HRPerformanceService {
  // =====================================================
  // PERFORMANCE CYCLES
  // =====================================================
  async getCycles(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('hr_performance_cycles')
        .select('*')
        .eq('company_id', companyId)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('HrPerformance', 'Error fetching performance cycles:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async getActiveCycle(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('hr_performance_cycles')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return { success: true, data: data || null };
    } catch (error) {
      logger.error('HrPerformance', 'Error fetching active cycle:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  // =====================================================
  // OBJECTIVES (OKR)
  // =====================================================
  async getObjectives(companyId: string, filters?: { employee_id?: string; cycle_id?: string; status?: string }) {
    try {
      let query = supabase
        .from('hr_objectives')
        .select(`
          *,
          employee:hr_employees!employee_id(first_name, last_name),
          manager:hr_employees!manager_id(first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('due_date', { ascending: true });
      if (filters?.employee_id) query = query.eq('employee_id', filters.employee_id);
      if (filters?.cycle_id) query = query.eq('cycle_id', filters.cycle_id);
      if (filters?.status) query = query.eq('status', filters.status);
      const { data, error } = await query;
      if (error) throw error;
      const results = data.map(obj => ({
        ...obj,
        employee_name: obj.employee ? `${obj.employee.first_name} ${obj.employee.last_name}` : undefined,
        manager_name: obj.manager ? `${obj.manager.first_name} ${obj.manager.last_name}` : undefined
      }));
      return { success: true, data: results };
    } catch (error) {
      logger.error('HrPerformance', 'Error fetching objectives:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async createObjective(companyId: string, formData: ObjectiveFormData) {
    try {
      const { data, error } = await supabase
        .from('hr_objectives')
        .insert({
          ...formData,
          company_id: companyId,
          status: 'not_started',
          progress_percentage: 0,
          current_value: 0
        })
        .select(`
          *,
          employee:hr_employees!employee_id(first_name, last_name)
        `)
        .single();
      if (error) throw error;
      const result = {
        ...data,
        employee_name: data.employee ? `${data.employee.first_name} ${data.employee.last_name}` : undefined
      };
      return { success: true, data: result };
    } catch (error) {
      logger.error('HrPerformance', 'Error creating objective:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async updateObjective(objectiveId: string, updates: Partial<Objective>) {
    try {
      const { data, error } = await supabase
        .from('hr_objectives')
        .update(updates)
        .eq('id', objectiveId)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('HrPerformance', 'Error updating objective:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async updateObjectiveProgress(objectiveId: string, currentValue: number, progressPercentage: number) {
    try {
      // Determine status based on progress
      let status = 'in_progress';
      if (progressPercentage >= 100) status = 'completed';
      else if (progressPercentage >= 110) status = 'exceeded';
      const { data, error } = await supabase
        .from('hr_objectives')
        .update({
          current_value: currentValue,
          progress_percentage: progressPercentage,
          status,
          completion_date: status === 'completed' || status === 'exceeded' ? new Date().toISOString() : null
        })
        .eq('id', objectiveId)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('HrPerformance', 'Error updating objective progress:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  // =====================================================
  // PERFORMANCE REVIEWS
  // =====================================================
  async getReviews(companyId: string, filters?: { employee_id?: string; cycle_id?: string; review_type?: string }) {
    try {
      let query = supabase
        .from('hr_performance_reviews')
        .select(`
          *,
          employee:hr_employees!employee_id(first_name, last_name),
          reviewer:hr_employees!reviewer_id(first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('review_date', { ascending: false });
      if (filters?.employee_id) query = query.eq('employee_id', filters.employee_id);
      if (filters?.cycle_id) query = query.eq('cycle_id', filters.cycle_id);
      if (filters?.review_type) query = query.eq('review_type', filters.review_type);
      const { data, error } = await query;
      if (error) throw error;
      const results = data.map(review => ({
        ...review,
        employee_name: review.employee ? `${review.employee.first_name} ${review.employee.last_name}` : undefined,
        reviewer_name: review.reviewer ? `${review.reviewer.first_name} ${review.reviewer.last_name}` : undefined
      }));
      return { success: true, data: results };
    } catch (error) {
      logger.error('HrPerformance', 'Error fetching reviews:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async createReview(companyId: string, formData: ReviewFormData) {
    try {
      const { data, error } = await supabase
        .from('hr_performance_reviews')
        .insert({
          ...formData,
          company_id: companyId,
          status: 'draft',
          goals_achieved: formData.goals_achieved || 0,
          goals_total: formData.goals_total || 0,
          promotion_recommended: formData.promotion_recommended || false,
          raise_recommended: formData.raise_recommended || false,
          pip_required: formData.pip_required || false
        })
        .select(`
          *,
          employee:hr_employees!employee_id(first_name, last_name),
          reviewer:hr_employees!reviewer_id(first_name, last_name)
        `)
        .single();
      if (error) throw error;
      const result = {
        ...data,
        employee_name: data.employee ? `${data.employee.first_name} ${data.employee.last_name}` : undefined,
        reviewer_name: data.reviewer ? `${data.reviewer.first_name} ${data.reviewer.last_name}` : undefined
      };
      return { success: true, data: result };
    } catch (error) {
      logger.error('HrPerformance', 'Error creating review:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async updateReview(reviewId: string, updates: Partial<PerformanceReview>) {
    try {
      const { data, error } = await supabase
        .from('hr_performance_reviews')
        .update(updates)
        .eq('id', reviewId)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('HrPerformance', 'Error updating review:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async submitReview(reviewId: string) {
    return this.updateReview(reviewId, {
      status: 'submitted',
      submitted_date: new Date().toISOString()
    });
  }
  async completeReview(reviewId: string) {
    return this.updateReview(reviewId, {
      status: 'completed',
      completed_date: new Date().toISOString()
    });
  }
  async acknowledgeReview(reviewId: string, employeeComments?: string) {
    return this.updateReview(reviewId, {
      status: 'acknowledged',
      acknowledged_date: new Date().toISOString(),
      employee_comments: employeeComments
    });
  }
  // =====================================================
  // FEEDBACK
  // =====================================================
  async getFeedback(companyId: string, filters?: { employee_id?: string; feedback_type?: string }) {
    try {
      let query = supabase
        .from('hr_feedback')
        .select(`
          *,
          employee:hr_employees!employee_id(first_name, last_name),
          from_employee:hr_employees!from_employee_id(first_name, last_name),
          from_manager:hr_employees!from_manager_id(first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('feedback_date', { ascending: false });
      if (filters?.employee_id) query = query.eq('employee_id', filters.employee_id);
      if (filters?.feedback_type) query = query.eq('feedback_type', filters.feedback_type);
      const { data, error } = await query;
      if (error) throw error;
      const results = data.map(fb => ({
        ...fb,
        employee_name: fb.employee ? `${fb.employee.first_name} ${fb.employee.last_name}` : undefined,
        from_employee_name: fb.from_employee ? `${fb.from_employee.first_name} ${fb.from_employee.last_name}` : 'Anonyme',
        from_manager_name: fb.from_manager ? `${fb.from_manager.first_name} ${fb.from_manager.last_name}` : undefined
      }));
      return { success: true, data: results };
    } catch (error) {
      logger.error('HrPerformance', 'Error fetching feedback:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async createFeedback(companyId: string, formData: FeedbackFormData) {
    try {
      const { data, error } = await supabase
        .from('hr_feedback')
        .insert({
          ...formData,
          company_id: companyId,
          feedback_date: formData.feedback_date || new Date().toISOString().split('T')[0],
          is_anonymous: formData.is_anonymous || false,
          is_private: formData.is_private || false,
          visibility: formData.visibility || 'manager'
        })
        .select(`
          *,
          employee:hr_employees!employee_id(first_name, last_name)
        `)
        .single();
      if (error) throw error;
      const result = {
        ...data,
        employee_name: data.employee ? `${data.employee.first_name} ${data.employee.last_name}` : undefined
      };
      return { success: true, data: result };
    } catch (error) {
      logger.error('HrPerformance', 'Error creating feedback:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async respondToFeedback(feedbackId: string, response: string) {
    try {
      const { data, error } = await supabase
        .from('hr_feedback')
        .update({
          response,
          response_date: new Date().toISOString()
        })
        .eq('id', feedbackId)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('HrPerformance', 'Error responding to feedback:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
export const hrPerformanceService = new HRPerformanceService();