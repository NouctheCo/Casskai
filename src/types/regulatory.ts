/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Types pour le module de documents réglementaires
 */

// ============================================================================
// ÉNUMÉRATIONS
// ============================================================================

/**
 * Standards comptables supportés
 */
export type AccountingStandard = 
  | 'PCG'        // Plan Comptable Général (France)
  | 'SYSCOHADA'  // Système SYSCOHADA (OHADA - 33 pays africains)
  | 'IFRS'       // IFRS for SMEs (Afrique anglophone)
  | 'SCF'        // Système Comptable Financier (Algérie, Tunisie)
  | 'PCM';       // Plan Comptable Marocain (Maroc)

/**
 * Statuts d'un document réglementaire
 */
export type DocumentStatus = 
  | 'draft'      // Brouillon - en cours d'édition
  | 'completed'  // Complété - prêt à être soumis
  | 'submitted'  // Soumis aux autorités
  | 'validated'  // Validé par les autorités
  | 'rejected';  // Rejeté par les autorités

/**
 * Périodes fiscales
 */
export type FiscalPeriod = 
  | 'ANNUAL'     // Annuel
  | 'Q1' | 'Q2' | 'Q3' | 'Q4'  // Trimestriel
  | 'M01' | 'M02' | 'M03' | 'M04' | 'M05' | 'M06'  // Mensuel
  | 'M07' | 'M08' | 'M09' | 'M10' | 'M11' | 'M12';

/**
 * Méthodes de soumission
 */
export type SubmissionMethod = 
  | 'ONLINE'     // Télédéclaration en ligne
  | 'MAIL'       // Courrier postal
  | 'IN_PERSON'  // Dépôt en personne
  | 'MANUAL';    // Saisie manuelle (hors système)

/**
 * Statuts de soumission
 */
export type SubmissionStatus = 
  | 'pending'    // En attente d'envoi
  | 'processing' // En cours de traitement
  | 'accepted'   // Accepté
  | 'rejected'   // Rejeté
  | 'error';     // Erreur lors de la soumission

/**
 * Catégories de documents
 */
export type DocumentCategory =
  | 'financial_statements'    // États financiers
  | 'tax_returns'            // Déclarations fiscales
  | 'social_declarations'    // Déclarations sociales
  | 'statistical_reports'    // Rapports statistiques
  | 'regulatory_filings'     // Dépôts réglementaires
  | 'other';                 // Autre

// ============================================================================
// INTERFACES PRINCIPALES
// ============================================================================

/**
 * Document réglementaire complet
 */
export interface RegulatoryDocument {
  id: string;
  companyId: string;

  // Identification
  documentType: string;
  category?: DocumentCategory;  // Catégorie du document
  fiscalYear: number;
  fiscalPeriod: FiscalPeriod;

  // Localisation
  countryCode: string;
  accountingStandard: AccountingStandard;

  // Données (structure flexible par type de document)
  data: Record<string, any>;

  // Métadonnées
  status: DocumentStatus;
  version: number;

  // Fichiers générés
  pdfUrl?: string;
  xmlUrl?: string;

  // Notes
  notes?: string;
  internalComments?: string;

  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;

  // Soumission
  submittedAt?: string;
  submittedBy?: string;
  validatedAt?: string;
  validatedBy?: string;
}

/**
 * Template de document réglementaire
 */
export interface RegulatoryTemplate {
  id: string;
  
  // Identification
  documentType: string;
  countryCode: string;
  accountingStandard: AccountingStandard;
  
  // Métadonnées
  name: string;
  description?: string;
  category?: DocumentCategory;
  
  // Définition (noms de colonnes SQL corrects)
  formSchema: FormSchema;        // Correspond à form_schema dans SQL
  accountMappings?: AccountMapping; // Correspond à account_mappings dans SQL
  validationRules?: ValidationRules;
  calculationRules?: CalculationRules;

  // Champs additionnels de la DB
  frequency?: string;
  isMandatory?: boolean;
  
  // Versioning
  version: string;
  isActive: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  
  // Audit
  createdAt: string;
  updatedAt: string;
}

/**
 * Soumission d'un document
 */
export interface RegulatorySubmission {
  id: string;
  documentId: string;
  companyId: string;
  
  // Détails de soumission
  submissionMethod: SubmissionMethod;
  authorityName: string;
  authorityReference?: string;
  authorityUrl?: string;
  
  // Statut
  submissionStatus: SubmissionStatus;
  responseData?: Record<string, any>;
  errorMessage?: string;
  
  // Fichiers
  submissionFileUrl?: string;
  receiptFileUrl?: string;
  
  // Dates
  submittedAt: string;
  acknowledgedAt?: string;
  processedAt?: string;
  
  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

/**
 * Historique de modifications
 */
export interface DocumentHistory {
  id: string;
  documentId: string;
  
  // Snapshot
  dataSnapshot: Record<string, any>;
  statusBefore?: DocumentStatus;
  statusAfter?: DocumentStatus;
  
  // Type de modification
  changeType: 'created' | 'updated' | 'submitted' | 'validated' | 'rejected';
  changeDescription?: string;
  
  // Utilisateur
  changedBy?: string;
  changedAt: string;
}

// ============================================================================
// SCHÉMAS DE FORMULAIRES
// ============================================================================

/**
 * Schéma complet d'un formulaire
 */
export interface FormSchema {
  version: string;
  sections: FormSection[];
  calculations?: Calculation[];
  validations?: Validation[];
}

/**
 * Section d'un formulaire
 */
export interface FormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  fields: FormField[];
  subsections?: FormSection[];
  conditions?: DisplayCondition[]; // Conditions d'affichage
}

/**
 * Champ de formulaire
 */
export interface FormField {
  id: string;
  name?: string;  // Optionnel pour les seed data (peut être déduit de l'id)
  label: string;
  type: FieldType;
  description?: string;
  placeholder?: string;

  // Validation
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  validationMessage?: string;

  // Options (pour select, radio, checkbox)
  options?: FieldOption[];

  // Valeur par défaut
  defaultValue?: any;

  // Calcul automatique
  calculated?: boolean;
  calculationFormula?: string;
  computed?: boolean;           // Champ calculé automatiquement
  formula?: string;              // Formule de calcul
  computationFormula?: string;   // Alias pour formula

  // Mapping comptable
  accountMapping?: AccountMappingRule;

  // Auto-remplissage
  autoFill?: AutoFillConfig | boolean;

  // Affichage
  order?: number;  // Optionnel pour les seed data (peut être déduit de la position)
  width?: 'full' | 'half' | 'third' | 'quarter';
  readonly?: boolean;
  readOnly?: boolean;       // Alias pour readonly (compatibilité)
  editable?: boolean;       // Indique si le champ est éditable
  hidden?: boolean;
  conditions?: DisplayCondition[];

  // Formatage
  format?: string; // Ex: "currency", "percentage", "date"
  decimals?: number;
  suffix?: string;
  prefix?: string;
}

/**
 * Types de champs
 */
export type FieldType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'file'
  | 'table'
  | 'computed';

/**
 * Option de champ (pour select, radio, etc.)
 */
export interface FieldOption {
  value: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
}

/**
 * Condition d'affichage
 */
export interface DisplayCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'isEmpty' | 'isNotEmpty';
  value?: any;
}

/**
 * Configuration d'auto-remplissage
 */
export interface AutoFillConfig {
  source: 'accounts' | 'computed' | 'otherField';
  accounts?: string[];      // Numéros de comptes (wildcards acceptés: "401*")
  operation?: 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN';
  debitCredit?: 'DEBIT' | 'CREDIT' | 'NET';
  fromField?: string;       // Si source = 'otherField'
  formula?: string;         // Si source = 'computed'
}

/**
 * Règle de calcul
 */
export interface Calculation {
  targetField: string;
  formula: string;
  dependencies: string[]; // Liste des champs nécessaires
  description?: string;
}

/**
 * Règle de validation
 */
export interface Validation {
  id: string;
  type: 'field' | 'cross' | 'global';
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  fields?: string[]; // Champs impliqués
}

// ============================================================================
// MAPPING COMPTABLE
// ============================================================================

/**
 * Mappage comptes comptables → champs de formulaire
 */
export interface AccountMapping {
  [fieldId: string]: AccountMappingRule;
}

/**
 * Règle de mappage pour un champ
 */
export interface AccountMappingRule {
  accounts?: string[];          // Liste de comptes (wildcards acceptés)
  accountRange?: string;        // Range de comptes (ex: "401-409")
  operation: 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN';
  debitCredit?: 'DEBIT' | 'CREDIT' | 'NET';
  filters?: {
    startDate?: string;
    endDate?: string;
    journalType?: string[];
    status?: string[];
  };
  transform?: string;           // Formule de transformation (ex: "value * 0.2" pour TVA)
}

/**
 * Règles de validation
 */
export interface ValidationRules {
  required?: string[];          // Champs obligatoires
  numeric?: string[];           // Champs numériques
  positive?: string[];          // Valeurs positives uniquement
  balanceChecks?: BalanceCheck[]; // Vérifications d'équilibre
  crossValidations?: CrossValidation[]; // Validations croisées
}

/**
 * Vérification d'équilibre comptable
 */
export interface BalanceCheck {
  leftFields: string[];
  rightFields: string[];
  message: string;
  tolerance?: number; // Tolérance en valeur absolue
}

/**
 * Validation croisée entre champs
 */
export interface CrossValidation {
  condition: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Règles de calcul automatique
 */
export interface CalculationRules {
  [fieldId: string]: CalculationRule;
}

/**
 * Règle de calcul pour un champ
 */
export interface CalculationRule {
  formula: string;
  dependencies: string[];
  description?: string;
}

// ============================================================================
// CONFIGURATION PAR PAYS
// ============================================================================

/**
 * Configuration d'un pays
 */
export interface CountryConfig {
  code: string;
  name: string;
  nameEn: string;
  flag: string;
  
  // Standard comptable
  accountingStandard: AccountingStandard;
  alternativeStandards?: AccountingStandard[];
  
  // Documents disponibles
  availableDocuments: DocumentTypeConfig[];
  
  // Autorités
  taxAuthority: AuthorityConfig;
  accountingAuthority?: AuthorityConfig;
  socialAuthority?: AuthorityConfig;
  
  // Calendrier fiscal
  fiscalYearEnd?: string; // Format: "MM-DD" (ex: "12-31")
  taxFilingDeadlines?: TaxDeadline[];
  
  // Formats
  dateFormat: string;
  currencyCode: string;
  currencySymbol: string;
  
  // Télédéclaration
  onlineFilingAvailable: boolean;
  onlineFilingUrl?: string;
}

/**
 * Configuration d'un type de document
 */
export interface DocumentTypeConfig {
  id: string;
  name: string;
  nameEn: string;
  category: DocumentCategory;
  frequency: 'annual' | 'quarterly' | 'monthly' | 'ondemand';
  mandatory: boolean;
  filingDeadline?: string;
  templateId?: string;
}

/**
 * Configuration d'une autorité
 */
export interface AuthorityConfig {
  name: string;
  nameEn: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  onlinePortal?: string;
}

/**
 * Échéance fiscale
 */
export interface TaxDeadline {
  documentType: string;
  frequency: 'annual' | 'quarterly' | 'monthly';
  deadline: string; // Format: "MM-DD" ou "DD" pour mensuel
  description?: string;
}

// ============================================================================
// FILTRES ET RECHERCHE
// ============================================================================

/**
 * Filtres de recherche de documents
 */
export interface DocumentFilters {
  countryCode?: string;
  accountingStandard?: AccountingStandard;
  documentType?: string;
  fiscalYear?: number;
  fiscalPeriod?: FiscalPeriod;
  status?: DocumentStatus;
  category?: DocumentCategory;
  searchQuery?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Options de tri
 */
export interface SortOptions {
  field: 'createdAt' | 'updatedAt' | 'fiscalYear' | 'status' | 'documentType';
  direction: 'asc' | 'desc';
}

/**
 * Résultat de recherche paginé
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// EXPORT ET GÉNÉRATION
// ============================================================================

/**
 * Options d'export PDF
 */
export interface PdfExportOptions {
  format: 'A4' | 'LETTER';
  orientation: 'portrait' | 'landscape';
  includeHeader: boolean;
  includeFooter: boolean;
  includeSignature: boolean;
  watermark?: string;
  companyLogo?: boolean;
}

/**
 * Options d'export XML
 */
export interface XmlExportOptions {
  format: 'EDI-TDFC' | 'XBRL' | 'custom';
  version: string;
  encoding: 'UTF-8' | 'ISO-8859-1';
  includeSchema: boolean;
}

/**
 * Résultat de génération de document
 */
export interface GenerationResult {
  success: boolean;
  documentId?: string;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
  data?: Record<string, any>;
}

/**
 * Erreur de validation
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error';
}

/**
 * Avertissement de validation
 */
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  severity: 'warning' | 'info';
}

// ============================================================================
// STATISTIQUES ET RAPPORTS
// ============================================================================

/**
 * Statistiques des documents
 */
export interface DocumentStatistics {
  total: number;
  totalDocuments?: number; // Alias pour total
  byStatus: Record<DocumentStatus, number>;
  byType: Record<string, number>;
  byCountry: Record<string, number>;
  byStandard?: Record<string, number>; // Groupement par standard comptable
  byCategory?: Record<string, number>; // Groupement par catégorie
  upcomingDeadlines: UpcomingDeadline[];
  recentActivity: DocumentActivity[];
  // Aliases pour byStatus (pour compatibilité)
  draft?: number;
  completed?: number;
  submitted?: number;
  validated?: number;
  rejected?: number;
}

/**
 * Échéance à venir
 */
export interface UpcomingDeadline {
  documentId?: string; // ID du document concerné
  documentType: string;
  documentName: string;
  country?: string; // Pays concerné
  deadline: string;
  daysUntilDeadline: number;
  status: 'not_started' | 'in_progress' | 'ready';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description?: string; // Description de l'échéance
  fiscalYear?: number; // Année fiscale concernée
}

/**
 * Activité récente
 */
export interface DocumentActivity {
  id: string;
  documentId: string;
  documentType: string;
  actionType: 'created' | 'updated' | 'submitted' | 'validated';
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Type guard pour vérifier si c'est un document valide
 */
export function isRegulatoryDocument(obj: any): obj is RegulatoryDocument {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.companyId === 'string' &&
    typeof obj.documentType === 'string' &&
    typeof obj.fiscalYear === 'number' &&
    typeof obj.data === 'object'
  );
}

/**
 * Type guard pour vérifier le statut
 */
export function isValidStatus(status: string): status is DocumentStatus {
  return ['draft', 'completed', 'submitted', 'validated', 'rejected'].includes(status);
}

/**
 * Type guard pour vérifier le standard comptable
 */
export function isValidAccountingStandard(standard: string): standard is AccountingStandard {
  return ['PCG', 'SYSCOHADA', 'IFRS', 'SCF', 'PCM'].includes(standard);
}
