/**
 * Types pour le module Formation RH
 */

export type TrainingCategory =
  | 'technical' | 'soft_skills' | 'leadership' | 'compliance'
  | 'product' | 'sales' | 'management' | 'safety'
  | 'language' | 'certification' | 'other';

export type TrainingFormat = 'online' | 'in_person' | 'hybrid' | 'self_paced' | 'webinar';
export type TrainingLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type TrainingStatus = 'draft' | 'active' | 'inactive' | 'archived';

export type SessionStatus =
  | 'planned' | 'registration_open' | 'registration_closed'
  | 'in_progress' | 'completed' | 'cancelled' | 'postponed';

export type EnrollmentStatus =
  | 'registered' | 'confirmed' | 'attended' | 'completed'
  | 'failed' | 'cancelled' | 'no_show' | 'in_progress';

export type ReimbursementStatus = 'not_applicable' | 'pending' | 'approved' | 'paid';

export type CertificationType =
  | 'professional' | 'technical' | 'language' | 'safety'
  | 'compliance' | 'academic' | 'industry' | 'internal' | 'other';

export type CertificationVerificationStatus = 'pending' | 'verified' | 'expired' | 'revoked';

export type SkillCategory =
  | 'technical' | 'soft_skills' | 'language' | 'tool'
  | 'methodology' | 'domain_knowledge' | 'leadership' | 'other';

export type ProficiencyLevel = 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';

export interface TrainingCatalog {
  id: string;
  title: string;
  description?: string;
  category?: TrainingCategory;
  provider?: string;
  format?: TrainingFormat;
  duration_hours: number;
  max_participants?: number;
  cost_per_participant?: number;
  currency: string;
  prerequisites?: string;
  required_level?: TrainingLevel;
  provides_certification: boolean;
  certification_name?: string;
  certification_validity_months?: number;
  objectives?: string[] | string;
  program?: string;
  materials_url?: string;
  status: TrainingStatus;
  is_mandatory: boolean;
  is_internal?: boolean;
  is_certified?: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingSession {
  id: string;
  training_id: string;
  training?: TrainingCatalog;
  session_name: string;
  description?: string;
  trainer_name?: string;
  trainer_id?: string;
  trainer_email?: string;
  trainer?: { first_name: string; last_name: string };
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  timezone: string;
  location?: string;
  meeting_link?: string;
  max_participants?: number;
  registered_count: number;
  attended_count: number;
  total_cost?: number;
  budget_code?: string;
  status: SessionStatus;
  registration_deadline?: string;
  is_virtual?: boolean;
  notes?: string;
  average_rating?: number;
  feedback_count: number;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingEnrollment {
  id: string;
  session_id: string;
  session?: TrainingSession;
  employee_id: string;
  employee_name?: string;
  enrolled_by?: string;
  status: EnrollmentStatus;
  registration_date: string;
  attendance_date?: string;
  completion_date?: string;
  passed?: boolean;
  score?: number;
  certificate_url?: string;
  certificate_issued_date?: string;
  rating?: number;
  feedback?: string;
  cost?: number;
  reimbursement_status?: ReimbursementStatus;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface Certification {
  id: string;
  employee_id: string;
  employee_name?: string;
  certification_name: string;
  issuing_organization: string;
  certification_type?: CertificationType;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
  verification_url?: string;
  description?: string;
  skills_acquired?: string;
  verification_status: CertificationVerificationStatus;
  training_enrollment_id?: string;
  certificate_url?: string;
  is_active: boolean;
  requires_renewal?: boolean;
  renewal_period_months?: number;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface SkillMatrix {
  id: string;
  employee_id: string;
  employee_name?: string;
  skill_name: string;
  skill_category?: SkillCategory;
  proficiency_level: ProficiencyLevel;
  proficiency_score?: number;
  self_assessed: boolean;
  manager_validated: boolean;
  validated_by?: string;
  validator_name?: string;
  validation_date?: string;
  years_of_experience?: number;
  last_used_date?: string;
  certifications?: string[];
  projects?: string[];
  target_level?: ProficiencyLevel;
  development_plan?: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

// Form data types
export interface TrainingCatalogFormData {
  title: string;
  description?: string;
  category?: TrainingCategory;
  provider?: string;
  format?: TrainingFormat;
  duration_hours: number;
  max_participants?: number;
  cost_per_participant?: number;
  currency?: string;
  prerequisites?: string;
  required_level?: TrainingLevel;
  provides_certification?: boolean;
  certification_name?: string;
  certification_validity_months?: number;
  objectives?: string[];
  program?: string;
  materials_url?: string;
  is_mandatory?: boolean;
}

export interface TrainingSessionFormData {
  training_id: string;
  session_name: string;
  trainer_name?: string;
  trainer_id?: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  meeting_link?: string;
  max_participants?: number;
  total_cost?: number;
  budget_code?: string;
}

export interface EnrollmentFormData {
  session_id: string;
  employee_id: string;
  status?: EnrollmentStatus;
}

export interface CertificationFormData {
  employee_id: string;
  certification_name: string;
  issuing_organization: string;
  certification_type?: CertificationType;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
  certificate_url?: string;
}

export interface SkillFormData {
  employee_id: string;
  skill_name: string;
  skill_category?: SkillCategory;
  proficiency_level: ProficiencyLevel;
  proficiency_score?: number;
  years_of_experience?: number;
  last_used_date?: string;
  target_level?: ProficiencyLevel;
  development_plan?: string;
}

export interface TrainingStats {
  total_trainings: number;
  total_sessions: number;
  total_enrollments: number;
  completion_rate: number;
  average_rating: number;
  total_cost: number;
  upcoming_sessions: number;
  active_certifications: number;
}
