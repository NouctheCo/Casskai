/**
 * Types pour le module Performance RH
 */

export type PerformanceCycleType = 'annual' | 'semi_annual' | 'quarterly' | 'continuous';
export type PerformanceCycleStatus = 'draft' | 'active' | 'review_phase' | 'completed' | 'archived';

export type ObjectiveCategory = 'individual' | 'team' | 'company';
export type ObjectiveType = 'okr' | 'smart' | 'kpi' | 'project';
export type ObjectiveStatus = 'not_started' | 'in_progress' | 'at_risk' | 'completed' | 'cancelled' | 'exceeded';

export type ReviewType = 'self' | 'manager' | 'peer' | '360' | 'probation' | 'mid_year' | 'annual';
export type ReviewStatus = 'draft' | 'submitted' | 'under_review' | 'completed' | 'acknowledged';

export type FeedbackType = 'praise' | 'constructive' | 'suggestion' | 'concern' | 'recognition' | 'request';
export type FeedbackCategory = 'communication' | 'teamwork' | 'technical' | 'leadership' | 'attitude' | 'productivity' | 'other';
export type FeedbackVisibility = 'employee_only' | 'manager' | 'both' | 'team';

export interface KeyResult {
  title: string;
  target: number;
  current: number;
  unit: string;
}

export interface PerformanceCycle {
  id: string;
  name: string;
  type: PerformanceCycleType;
  start_date: string;
  end_date: string;
  review_deadline: string;
  status: PerformanceCycleStatus;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface Objective {
  id: string;
  employee_id: string;
  employee_name?: string;
  cycle_id?: string;
  title: string;
  description?: string;
  category?: ObjectiveCategory;
  type?: ObjectiveType;
  objective?: string;
  key_results?: KeyResult[];
  target_value?: number;
  current_value?: number;
  unit?: string;
  weight: number;
  start_date: string;
  due_date: string;
  completion_date?: string;
  status: ObjectiveStatus;
  progress_percentage: number;
  manager_id?: string;
  manager_name?: string;
  parent_objective_id?: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface CompetencyRating {
  rating: number;
  comment?: string;
}

export interface PerformanceReview {
  id: string;
  employee_id: string;
  employee_name?: string;
  cycle_id?: string;
  reviewer_id: string;
  reviewer_name?: string;
  review_type: ReviewType;
  overall_rating?: number;
  technical_skills_rating?: number;
  soft_skills_rating?: number;
  leadership_rating?: number;
  collaboration_rating?: number;
  initiative_rating?: number;
  competencies_ratings?: Record<string, CompetencyRating>;
  strengths?: string;
  areas_for_improvement?: string;
  achievements?: string;
  development_plan?: string;
  manager_comments?: string;
  employee_comments?: string;
  goals_achieved: number;
  goals_total: number;
  goals_notes?: string;
  status: ReviewStatus;
  review_date: string;
  submitted_date?: string;
  completed_date?: string;
  acknowledged_date?: string;
  promotion_recommended: boolean;
  raise_recommended: boolean;
  raise_percentage?: number;
  pip_required: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  employee_id: string;
  employee_name?: string;
  from_employee_id?: string;
  from_employee_name?: string;
  from_manager_id?: string;
  from_manager_name?: string;
  feedback_type: FeedbackType;
  category?: FeedbackCategory;
  content: string;
  is_anonymous: boolean;
  is_private: boolean;
  visibility: FeedbackVisibility;
  feedback_date: string;
  response?: string;
  response_date?: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

// Form data types
export interface ObjectiveFormData {
  employee_id: string;
  cycle_id?: string;
  title: string;
  description?: string;
  category?: ObjectiveCategory;
  type?: ObjectiveType;
  objective?: string;
  key_results?: KeyResult[];
  target_value?: number;
  unit?: string;
  weight?: number;
  start_date: string;
  due_date: string;
  manager_id?: string;
}

export interface ReviewFormData {
  employee_id: string;
  cycle_id?: string;
  reviewer_id: string;
  review_type: ReviewType;
  overall_rating?: number;
  technical_skills_rating?: number;
  soft_skills_rating?: number;
  leadership_rating?: number;
  collaboration_rating?: number;
  initiative_rating?: number;
  competencies_ratings?: Record<string, CompetencyRating>;
  strengths?: string;
  areas_for_improvement?: string;
  achievements?: string;
  development_plan?: string;
  manager_comments?: string;
  goals_achieved?: number;
  goals_total?: number;
  review_date: string;
  promotion_recommended?: boolean;
  raise_recommended?: boolean;
  raise_percentage?: number;
  pip_required?: boolean;
}

export interface FeedbackFormData {
  employee_id: string;
  from_employee_id?: string;
  feedback_type: FeedbackType;
  category?: FeedbackCategory;
  content: string;
  is_anonymous?: boolean;
  is_private?: boolean;
  visibility?: FeedbackVisibility;
  feedback_date?: string;
}
