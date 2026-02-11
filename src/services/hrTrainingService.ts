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
 * Service pour la gestion de la formation RH
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getCurrentCompanyCurrency } from '@/lib/utils';
import type {
  TrainingCatalog,
  TrainingSession,
  TrainingEnrollment,
  Certification,
  SkillMatrix,
  TrainingCatalogFormData,
  TrainingSessionFormData,
  EnrollmentFormData,
  CertificationFormData,
  SkillFormData,
  TrainingStats
} from '@/types/hr-training.types';
export class HRTrainingService {
  // =====================================================
  // TRAINING CATALOG
  // =====================================================
  async getTrainingCatalog(companyId: string, filters?: { category?: string; status?: string }) {
    try {
      let query = supabase
        .from('hr_training_catalog')
        .select('*')
        .eq('company_id', companyId)
        .order('title', { ascending: true });
      if (filters?.category) query = query.eq('category', filters.category);
      if (filters?.status) query = query.eq('status', filters.status);
      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('HrTraining', 'Error fetching training catalog:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async createTraining(companyId: string, formData: TrainingCatalogFormData) {
    try {
      const { data, error } = await supabase
        .from('hr_training_catalog')
        .insert({
          ...formData,
          company_id: companyId,
          status: 'active',
          currency: formData.currency || getCurrentCompanyCurrency(),
          provides_certification: formData.provides_certification || false,
          is_mandatory: formData.is_mandatory || false
        })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('HrTraining', 'Error creating training:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  // Alias pour compatibilité avec TrainingTab.tsx
  async createTrainingCatalog(companyId: string, formData: TrainingCatalogFormData) {
    return this.createTraining(companyId, formData);
  }
  async updateTrainingCatalog(trainingId: string, updates: Partial<TrainingCatalog>) {
    return this.updateTraining(trainingId, updates);
  }
  async updateTraining(trainingId: string, updates: Partial<TrainingCatalog>) {
    try {
      const { data, error } = await supabase
        .from('hr_training_catalog')
        .update(updates)
        .eq('id', trainingId)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('HrTraining', 'Error updating training:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  // =====================================================
  // TRAINING SESSIONS
  // =====================================================
  async getSessions(companyId: string, filters?: { training_id?: string; status?: string }) {
    try {
      let query = supabase
        .from('hr_training_sessions')
        .select(`
          *,
          training:hr_training_catalog(title, category, duration_hours),
          trainer:hr_employees!trainer_id(first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('start_date', { ascending: false });
      if (filters?.training_id) query = query.eq('training_id', filters.training_id);
      if (filters?.status) query = query.eq('status', filters.status);
      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('HrTraining', 'Error fetching sessions:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async getUpcomingSessions(companyId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('hr_training_sessions')
        .select(`
          *,
          training:hr_training_catalog(title, category)
        `)
        .eq('company_id', companyId)
        .gte('start_date', today)
        .in('status', ['planned', 'registration_open'])
        .order('start_date', { ascending: true })
        .limit(10);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('HrTraining', 'Error fetching upcoming sessions:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async createSession(companyId: string, formData: TrainingSessionFormData) {
    try {
      const { data, error } = await supabase
        .from('hr_training_sessions')
        .insert({
          ...formData,
          company_id: companyId,
          status: 'planned',
          registered_count: 0,
          attended_count: 0,
          feedback_count: 0,
          timezone: 'Europe/Paris'
        })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('HrTraining', 'Error creating session:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async updateSession(sessionId: string, updates: Partial<TrainingSession>) {
    try {
      const { data, error } = await supabase
        .from('hr_training_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('HrTraining', 'Error updating session:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  // =====================================================
  // ENROLLMENTS
  // =====================================================
  async getEnrollments(companyId: string, filters?: { session_id?: string; employee_id?: string; status?: string }) {
    try {
      let query = supabase
        .from('hr_training_enrollments')
        .select(`
          *,
          session:hr_training_sessions(
            session_name,
            start_date,
            end_date,
            training:hr_training_catalog(title)
          ),
          employee:hr_employees!employee_id(first_name, last_name, position)
        `)
        .eq('company_id', companyId)
        .order('registration_date', { ascending: false });
      if (filters?.session_id) query = query.eq('session_id', filters.session_id);
      if (filters?.employee_id) query = query.eq('employee_id', filters.employee_id);
      if (filters?.status) query = query.eq('status', filters.status);
      const { data, error } = await query;
      if (error) throw error;
      const results = data.map(enrollment => ({
        ...enrollment,
        employee_name: enrollment.employee
          ? `${enrollment.employee.first_name} ${enrollment.employee.last_name}`
          : undefined
      }));
      return { success: true, data: results };
    } catch (error) {
      logger.error('HrTraining', 'Error fetching enrollments:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async enrollEmployee(companyId: string, userId: string, formData: EnrollmentFormData) {
    try {
      // Check if already enrolled
      const { data: existing } = await supabase
        .from('hr_training_enrollments')
        .select('id')
        .eq('session_id', formData.session_id)
        .eq('employee_id', formData.employee_id)
        .single();
      if (existing) {
        return { success: false, error: 'Employé déjà inscrit à cette session' };
      }
      const { data, error } = await supabase
        .from('hr_training_enrollments')
        .insert({
          ...formData,
          company_id: companyId,
          enrolled_by: userId,
          status: formData.status || 'registered',
          registration_date: new Date().toISOString()
        })
        .select(`
          *,
          employee:hr_employees!employee_id(first_name, last_name)
        `)
        .single();
      if (error) throw error;
      // Increment registered_count on session
      await supabase.rpc('increment_session_count', {
        session_id: formData.session_id,
        count_field: 'registered_count'
      });
      const result = {
        ...data,
        employee_name: data.employee
          ? `${data.employee.first_name} ${data.employee.last_name}`
          : undefined
      };
      return { success: true, data: result };
    } catch (error) {
      logger.error('HrTraining', 'Error enrolling employee:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async updateEnrollment(enrollmentId: string, updates: Partial<TrainingEnrollment>) {
    try {
      const { data, error } = await supabase
        .from('hr_training_enrollments')
        .update(updates)
        .eq('id', enrollmentId)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('HrTraining', 'Error updating enrollment:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async completeEnrollment(enrollmentId: string, passed: boolean, score?: number, certificateUrl?: string) {
    try {
      const updates: Partial<TrainingEnrollment> = {
        status: passed ? 'completed' : 'failed',
        completion_date: new Date().toISOString(),
        passed,
        score,
        certificate_url: certificateUrl
      };
      if (certificateUrl) {
        updates.certificate_issued_date = new Date().toISOString().split('T')[0];
      }
      return this.updateEnrollment(enrollmentId, updates);
    } catch (error) {
      logger.error('HrTraining', 'Error completing enrollment:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async submitFeedback(enrollmentId: string, rating: number, feedback: string) {
    return this.updateEnrollment(enrollmentId, { rating, feedback });
  }
  // =====================================================
  // CERTIFICATIONS
  // =====================================================
  async getCertifications(companyId: string, filters?: { employee_id?: string; certification_type?: string }) {
    try {
      let query = supabase
        .from('hr_certifications')
        .select(`
          *,
          employee:hr_employees!employee_id(first_name, last_name, position)
        `)
        .eq('company_id', companyId)
        .order('issue_date', { ascending: false });
      if (filters?.employee_id) query = query.eq('employee_id', filters.employee_id);
      if (filters?.certification_type) query = query.eq('certification_type', filters.certification_type);
      const { data, error } = await query;
      if (error) throw error;
      const results = data.map(cert => ({
        ...cert,
        employee_name: cert.employee
          ? `${cert.employee.first_name} ${cert.employee.last_name}`
          : undefined
      }));
      return { success: true, data: results };
    } catch (error) {
      logger.error('HrTraining', 'Error fetching certifications:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async addCertification(companyId: string, formData: CertificationFormData) {
    try {
      const { data, error } = await supabase
        .from('hr_certifications')
        .insert({
          ...formData,
          company_id: companyId,
          verification_status: 'pending',
          is_active: true
        })
        .select(`
          *,
          employee:hr_employees!employee_id(first_name, last_name)
        `)
        .single();
      if (error) throw error;
      const result = {
        ...data,
        employee_name: data.employee
          ? `${data.employee.first_name} ${data.employee.last_name}`
          : undefined
      };
      return { success: true, data: result };
    } catch (error) {
      logger.error('HrTraining', 'Error adding certification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  // Alias pour compatibilité avec TrainingTab.tsx
  async createCertification(companyId: string, formData: CertificationFormData) {
    return this.addCertification(companyId, formData);
  }
  async updateCertification(certificationId: string, updates: Partial<Certification>) {
    try {
      const { data, error } = await supabase
        .from('hr_certifications')
        .update(updates)
        .eq('id', certificationId)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('HrTraining', 'Error updating certification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  // =====================================================
  // SKILLS MATRIX
  // =====================================================
  async getSkills(companyId: string, filters?: { employee_id?: string; skill_category?: string }) {
    try {
      let query = supabase
        .from('hr_skills_matrix')
        .select(`
          *,
          employee:hr_employees!employee_id(first_name, last_name, position),
          validator:hr_employees!validated_by(first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('skill_name', { ascending: true });
      if (filters?.employee_id) query = query.eq('employee_id', filters.employee_id);
      if (filters?.skill_category) query = query.eq('skill_category', filters.skill_category);
      const { data, error } = await query;
      if (error) throw error;
      const results = data.map(skill => ({
        ...skill,
        employee_name: skill.employee
          ? `${skill.employee.first_name} ${skill.employee.last_name}`
          : undefined,
        validator_name: skill.validator
          ? `${skill.validator.first_name} ${skill.validator.last_name}`
          : undefined
      }));
      return { success: true, data: results };
    } catch (error) {
      logger.error('HrTraining', 'Error fetching skills:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async addSkill(companyId: string, formData: SkillFormData) {
    try {
      const { data, error } = await supabase
        .from('hr_skills_matrix')
        .insert({
          ...formData,
          company_id: companyId,
          self_assessed: true,
          manager_validated: false
        })
        .select(`
          *,
          employee:hr_employees!employee_id(first_name, last_name)
        `)
        .single();
      if (error) throw error;
      const result = {
        ...data,
        employee_name: data.employee
          ? `${data.employee.first_name} ${data.employee.last_name}`
          : undefined
      };
      return { success: true, data: result };
    } catch (error) {
      logger.error('HrTraining', 'Error adding skill:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async validateSkill(skillId: string, validatorId: string) {
    try {
      const { data, error } = await supabase
        .from('hr_skills_matrix')
        .update({
          manager_validated: true,
          validated_by: validatorId,
          validation_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', skillId)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('HrTraining', 'Error validating skill:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async updateSkill(skillId: string, updates: Partial<SkillMatrix>) {
    try {
      const { data, error } = await supabase
        .from('hr_skills_matrix')
        .update(updates)
        .eq('id', skillId)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('HrTraining', 'Error updating skill:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  // =====================================================
  // STATS
  // =====================================================
  async getTrainingStats(companyId: string): Promise<{ success: boolean; data?: TrainingStats; error?: string }> {
    try {
      // Get all data in parallel
      const [catalogResponse, sessionsResponse, enrollmentsResponse, certificationsResponse] = await Promise.all([
        supabase.from('hr_training_catalog').select('id').eq('company_id', companyId).eq('status', 'active'),
        supabase.from('hr_training_sessions').select('id, status, total_cost, average_rating, start_date').eq('company_id', companyId),
        supabase.from('hr_training_enrollments').select('id, status').eq('company_id', companyId),
        supabase.from('hr_certifications').select('id, is_active, expiry_date').eq('company_id', companyId)
      ]);
      const trainings = catalogResponse.data || [];
      const sessions = sessionsResponse.data || [];
      const enrollments = enrollmentsResponse.data || [];
      const certifications = certificationsResponse.data || [];
      // Calculate stats
      const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
      const totalEnrollments = enrollments.length;
      const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;
      const sessionsWithRating = sessions.filter(s => s.average_rating);
      const avgRating = sessionsWithRating.length > 0
        ? sessionsWithRating.reduce((sum, s) => sum + (s.average_rating || 0), 0) / sessionsWithRating.length
        : 0;
      const totalCost = sessions.reduce((sum, s) => sum + (s.total_cost || 0), 0);
      const today = new Date();
      const upcomingSessions = sessions.filter(s => {
        const startDate = new Date(s.start_date);
        return startDate > today && ['planned', 'registration_open'].includes(s.status);
      }).length;
      const activeCerts = certifications.filter(c => {
        if (!c.is_active) return false;
        if (!c.expiry_date) return true;
        return new Date(c.expiry_date) > today;
      }).length;
      const stats: TrainingStats = {
        total_trainings: trainings.length,
        total_sessions: sessions.length,
        total_enrollments: totalEnrollments,
        completion_rate: Math.round(completionRate),
        average_rating: Math.round(avgRating * 10) / 10,
        total_cost: totalCost,
        upcoming_sessions: upcomingSessions,
        active_certifications: activeCerts
      };
      return { success: true, data: stats };
    } catch (error) {
      logger.error('HrTraining', 'Error fetching training stats:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
export const hrTrainingService = new HRTrainingService();