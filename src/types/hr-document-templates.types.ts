/**
 * Types pour les templates de documents RH et génération automatique
 */

// =====================================================
// TYPES DE DOCUMENTS
// =====================================================

export type DocumentCategory =
  | 'contract'      // Contrats
  | 'amendment'     // Avenants
  | 'certificate'   // Certificats
  | 'notice'        // Notifications
  | 'letter'        // Courriers
  | 'policy'        // Règlements
  | 'form';         // Formulaires

export type ContractTemplateType =
  | 'cdi'                    // Contrat à Durée Indéterminée
  | 'cdd'                    // Contrat à Durée Déterminée
  | 'stage'                  // Convention de stage
  | 'apprentissage'          // Contrat d'apprentissage
  | 'professionnalisation'   // Contrat de professionnalisation
  | 'interim'                // Contrat intérimaire
  | 'promesse_embauche';     // Promesse d'embauche

export type AmendmentTemplateType =
  | 'avenant_salaire'        // Avenant de salaire
  | 'avenant_poste'          // Changement de poste
  | 'avenant_horaires'       // Modification horaires
  | 'avenant_lieu'           // Changement de lieu
  | 'avenant_temps_partiel'  // Passage temps partiel
  | 'avenant_temps_plein';   // Passage temps plein

export type CertificateTemplateType =
  | 'certificat_travail'     // Certificat de travail
  | 'attestation_employeur'  // Attestation employeur
  | 'attestation_salaire'    // Attestation de salaire
  | 'solde_tout_compte';     // Reçu pour solde de tout compte

export type NoticeTemplateType =
  | 'notification_embauche'  // Notification d'embauche
  | 'notification_rupture'   // Notification de rupture
  | 'avertissement'          // Avertissement
  | 'mise_pied'              // Mise à pied
  | 'licenciement';          // Lettre de licenciement

export type LetterTemplateType =
  | 'lettre_bienvenue'       // Lettre de bienvenue
  | 'lettre_felicitations'   // Lettre de félicitations
  | 'lettre_promotion'       // Lettre de promotion
  | 'lettre_mutation'        // Lettre de mutation
  | 'lettre_demission';      // Lettre de démission

export type DocumentTemplateType =
  | ContractTemplateType
  | AmendmentTemplateType
  | CertificateTemplateType
  | NoticeTemplateType
  | LetterTemplateType;

// =====================================================
// VARIABLES DE TEMPLATE
// =====================================================

export interface TemplateVariable {
  name: string;                    // Nom de la variable (ex: employee_name)
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'list';
  label: string;                   // Label affiché à l'utilisateur
  description?: string;            // Description de la variable
  required?: boolean;              // Variable obligatoire
  default_value?: any;             // Valeur par défaut
  validation?: {                   // Règles de validation
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

// =====================================================
// DOCUMENT TEMPLATE
// =====================================================

export interface DocumentTemplate {
  id: string;
  company_id: string;

  // Template info
  name: string;
  description?: string;
  category: DocumentCategory;
  template_type: DocumentTemplateType;

  // Content
  content: string;                  // HTML/Markdown avec {{variables}}
  variables: TemplateVariable[];    // Variables disponibles

  // Settings
  is_active: boolean;
  is_default: boolean;
  requires_signature: boolean;
  auto_archive: boolean;

  // Metadata
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentTemplateFormData {
  name: string;
  description?: string;
  category: DocumentCategory;
  template_type: DocumentTemplateType;
  content: string;
  variables: TemplateVariable[];
  is_active?: boolean;
  is_default?: boolean;
  requires_signature?: boolean;
  auto_archive?: boolean;
}

// =====================================================
// GENERATED DOCUMENT
// =====================================================

export type GeneratedDocumentStatus =
  | 'draft'       // Brouillon
  | 'generated'   // Généré
  | 'sent'        // Envoyé
  | 'signed'      // Signé
  | 'archived';   // Archivé

export type SignatureStatus =
  | 'pending'     // En attente
  | 'signed'      // Signé
  | 'declined';   // Refusé

export interface GeneratedDocument {
  id: string;
  company_id: string;

  // Source
  template_id?: string;
  employee_id: string;
  employee_name?: string;           // Enriched

  // Document info
  document_name: string;
  document_type: DocumentTemplateType;
  generated_content: string;        // HTML final généré
  variables_data?: Record<string, any>;

  // Files
  pdf_url?: string;
  original_url?: string;

  // Status
  status: GeneratedDocumentStatus;

  // Signature
  requires_signature: boolean;
  signature_status?: SignatureStatus;
  signed_date?: string;
  signed_by?: string;
  signature_data?: {
    signature_image?: string;
    signature_type?: 'drawn' | 'typed' | 'electronic';
    ip_address?: string;
    user_agent?: string;
  };

  // Archive
  is_archived: boolean;
  archived_date?: string;
  archived_by?: string;
  archive_reference?: string;

  // Metadata
  generated_by?: string;
  generated_at: string;
  sent_date?: string;
  created_at: string;
  updated_at: string;
}

export interface GenerateDocumentRequest {
  template_id: string;
  employee_id: string;
  document_name?: string;           // Si non fourni, généré auto
  variables_data: Record<string, any>;
  auto_send?: boolean;
  auto_archive_on_sign?: boolean;
}

// =====================================================
// DOCUMENT ARCHIVE
// =====================================================

export type ArchiveType =
  | 'contract'
  | 'amendment'
  | 'termination'
  | 'certificate'
  | 'letter'
  | 'other';

export interface DocumentArchive {
  id: string;
  company_id: string;

  // Document reference
  document_id?: string;
  employee_id: string;
  employee_name?: string;           // Enriched

  // Archive info
  archive_reference: string;        // Ex: 2025-001
  archive_type: ArchiveType;
  document_name: string;
  document_date: string;

  // Storage
  storage_url: string;
  storage_path: string;
  file_size_bytes?: number;
  checksum?: string;

  // Legal retention
  retention_years: number;
  retention_until: string;          // Calculé automatiquement
  can_be_destroyed: boolean;        // Calculé automatiquement

  // Metadata
  archived_by?: string;
  archived_at: string;
  notes?: string;
  tags?: string[];

  created_at: string;
  updated_at: string;
}

// =====================================================
// STANDARD VARIABLES (utilisées dans tous les templates)
// =====================================================

export const STANDARD_VARIABLES: TemplateVariable[] = [
  // Entreprise
  { name: 'company_name', type: 'string', label: 'Nom de l\'entreprise', required: true },
  { name: 'company_address', type: 'string', label: 'Adresse de l\'entreprise' },
  { name: 'company_siret', type: 'string', label: 'SIRET' },
  { name: 'company_phone', type: 'string', label: 'Téléphone' },
  { name: 'company_email', type: 'string', label: 'Email' },

  // Employé
  { name: 'employee_title', type: 'string', label: 'Civilité', validation: { options: ['M.', 'Mme'] } },
  { name: 'employee_first_name', type: 'string', label: 'Prénom', required: true },
  { name: 'employee_last_name', type: 'string', label: 'Nom', required: true },
  { name: 'employee_full_name', type: 'string', label: 'Nom complet', required: true },
  { name: 'employee_address', type: 'string', label: 'Adresse' },
  { name: 'employee_birth_date', type: 'date', label: 'Date de naissance' },
  { name: 'employee_birth_place', type: 'string', label: 'Lieu de naissance' },
  { name: 'employee_social_security', type: 'string', label: 'N° Sécurité sociale' },

  // Poste
  { name: 'position', type: 'string', label: 'Poste', required: true },
  { name: 'department', type: 'string', label: 'Département' },
  { name: 'start_date', type: 'date', label: 'Date de début', required: true },
  { name: 'end_date', type: 'date', label: 'Date de fin' },

  // Rémunération
  { name: 'salary', type: 'currency', label: 'Salaire brut', required: true },
  { name: 'salary_net', type: 'currency', label: 'Salaire net estimé' },
  { name: 'salary_period', type: 'string', label: 'Période', validation: { options: ['mensuel', 'horaire', 'annuel'] } },

  // Temps de travail
  { name: 'work_hours_weekly', type: 'number', label: 'Heures hebdo', default_value: 35 },
  { name: 'work_schedule', type: 'string', label: 'Horaires' },

  // Dates et signatures
  { name: 'current_date', type: 'date', label: 'Date du jour', default_value: 'today' },
  { name: 'signature_place', type: 'string', label: 'Lieu de signature' }
];

// =====================================================
// HELPER TYPES
// =====================================================

export interface DocumentPreview {
  html: string;
  variables_used: string[];
  missing_variables: string[];
}

export interface ArchiveStats {
  total_documents: number;
  by_type: Record<ArchiveType, number>;
  total_size_mb: number;
  expiring_soon: number;            // Documents expirant dans < 1 an
  can_be_destroyed: number;
}
