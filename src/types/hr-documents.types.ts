/**
 * Types pour le module Documents RH
 * Gestion complète des documents employés
 */

export type DocumentType =
  | 'contract' // Contrat de travail (CDI, CDD, etc.)
  | 'amendment' // Avenant au contrat
  | 'certificate' // Certificat de travail
  | 'payslip' // Fiche de paie
  | 'id_document' // Pièce d'identité
  | 'diploma' // Diplôme
  | 'certification' // Certification professionnelle
  | 'medical' // Document médical (visite médicale)
  | 'resignation' // Lettre de démission
  | 'termination' // Lettre de licenciement
  | 'warning' // Avertissement
  | 'evaluation' // Document d'évaluation
  | 'other'; // Autre

export type DocumentStatus =
  | 'active' // Document actif et valide
  | 'expired' // Document expiré
  | 'archived' // Archivé
  | 'pending_signature' // En attente de signature
  | 'cancelled'; // Annulé

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  employee_name?: string; // Computed field
  document_type: DocumentType;
  title: string;
  description?: string;
  file_url: string;
  file_name: string;
  file_size?: number; // in bytes
  mime_type?: string;

  // Metadata
  issue_date?: string; // Date d'émission
  expiry_date?: string; // Date d'expiration (pour documents temporaires)
  signed_date?: string; // Date de signature

  // Status
  status: DocumentStatus;

  // Security
  is_confidential: boolean;
  requires_signature: boolean;
  signed_by?: string; // User ID

  // Versioning
  version: number;
  previous_version_id?: string;

  // Audit
  uploaded_by: string; // User ID
  company_id: string;
  created_at: string;
  updated_at: string;

  // Additional metadata
  tags?: string[];
  notes?: string;
}

export interface DocumentFormData {
  employee_id: string;
  document_type: DocumentType;
  title: string;
  description?: string;
  file: File;
  issue_date?: string;
  expiry_date?: string;
  is_confidential: boolean;
  requires_signature: boolean;
  tags?: string[];
  notes?: string;
}

export interface DocumentFilters {
  employee_id?: string;
  document_type?: DocumentType;
  status?: DocumentStatus;
  is_confidential?: boolean;
  search?: string;
  from_date?: string;
  to_date?: string;
}

export interface DocumentStats {
  total_documents: number;
  by_type: Record<DocumentType, number>;
  by_status: Record<DocumentStatus, number>;
  expiring_soon: number; // Documents expirant dans les 30 jours
  pending_signature: number;
  total_size: number; // Total size in bytes
  recent_uploads: number; // Uploads dans les 7 derniers jours
}

// Document template types for contract generation
export interface ContractTemplate {
  id: string;
  name: string;
  type: 'cdi' | 'cdd' | 'interim' | 'stage' | 'apprentissage' | 'freelance';
  content: string; // HTML or markdown template
  variables: string[]; // Variables à remplacer (ex: {{employee_name}})
  company_id: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface GenerateContractData {
  employee_id: string;
  template_id: string;
  variables: Record<string, string | number>;
  start_date: string;
  end_date?: string;
  salary: number;
  position: string;
  department: string;
}
