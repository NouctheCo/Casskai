// Security and GDPR compliance types

export interface SecuritySettings {
  id: string;
  companyId: string;
  twoFactorRequired: boolean;
  sessionTimeout: number; // minutes
  passwordPolicy: PasswordPolicy;
  ipWhitelist: string[];
  allowedCountries: string[];
  dataRetentionDays: number;
  auditLogEnabled: boolean;
  encryptionLevel: 'standard' | 'high' | 'maximum';
  backupEncrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number; // last N passwords
  maxAge: number; // days
}

export interface PrivacySettings {
  id: string;
  userId: string;
  companyId: string;
  dataProcessingConsent: boolean;
  marketingConsent: boolean;
  analyticsConsent: boolean;
  thirdPartySharing: boolean;
  dataExportRequested: boolean;
  dataExportRequestedAt?: string;
  dataDeletionRequested: boolean;
  dataDeletionRequestedAt?: string;
  consentHistory: ConsentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface ConsentRecord {
  id: string;
  consentType: 'data_processing' | 'marketing' | 'analytics' | 'third_party';
  granted: boolean;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  legalBasis: string;
  purpose: string;
}

export interface DataSubject {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyId?: string;
  dataCategories: DataCategory[];
  lastActivity: string;
  retentionPeriod: number;
  status: 'active' | 'inactive' | 'deletion_requested' | 'deleted';
}

export type DataCategory = 
  | 'personal_data'
  | 'financial_data'
  | 'authentication_data'
  | 'usage_data'
  | 'communication_data'
  | 'technical_data';

export interface DataProcessingActivity {
  id: string;
  companyId: string;
  name: string;
  description: string;
  purpose: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  dataCategories: DataCategory[];
  dataSubjects: string[];
  recipients: string[];
  retentionPeriod: number;
  internationalTransfers: boolean;
  transferCountries: string[];
  safeguards: string[];
  automatedDecisionMaking: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityIncident {
  id: string;
  companyId: string;
  type: 'data_breach' | 'unauthorized_access' | 'system_compromise' | 'malware' | 'phishing' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  title: string;
  description: string;
  affectedUsers: number;
  dataTypesAffected: DataCategory[];
  containmentActions: string[];
  notificationRequired: boolean;
  authoritiesNotified: boolean;
  usersNotified: boolean;
  reportedAt: string;
  resolvedAt?: string;
  reporter: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  companyId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  outcome: 'success' | 'failure' | 'error';
  riskLevel: 'low' | 'medium' | 'high';
  timestamp: string;
}

export interface GDPRRequest {
  id: string;
  userId: string;
  companyId: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestDetails: string;
  responseData?: Record<string, unknown>;
  processedBy?: string;
  requestedAt: string;
  completedAt?: string;
  dueDate: string;
}

export interface CookieConsent {
  id: string;
  userId?: string;
  sessionId: string;
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  consentDate: string;
  expiryDate: string;
  ipAddress: string;
  userAgent: string;
  website: string;
}

export interface ComplianceReport {
  id: string;
  companyId: string;
  reportType: 'gdpr_compliance' | 'security_assessment' | 'data_audit' | 'breach_report';
  period: {
    startDate: string;
    endDate: string;
  };
  findings: ComplianceFinding[];
  recommendations: string[];
  overallScore: number;
  status: 'draft' | 'final' | 'submitted';
  generatedAt: string;
  generatedBy: string;
}

export interface ComplianceFinding {
  id: string;
  category: 'data_protection' | 'security' | 'consent' | 'retention' | 'access_control';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  status: 'open' | 'acknowledged' | 'resolved';
}

// Constants
export const DATA_RETENTION_PERIODS = {
  FINANCIAL_RECORDS: 2555, // 7 years in days
  USER_DATA: 1095, // 3 years in days  
  AUDIT_LOGS: 2190, // 6 years in days
  MARKETING_DATA: 730, // 2 years in days
  SESSION_DATA: 30, // 30 days
  ANALYTICS_DATA: 365 // 1 year in days
} as const;

export const GDPR_RESPONSE_TIMES = {
  ACCESS_REQUEST: 30, // days
  ERASURE_REQUEST: 30, // days
  RECTIFICATION_REQUEST: 30, // days
  DATA_BREACH_AUTHORITY: 3, // days (72 hours)
  DATA_BREACH_INDIVIDUALS: 30 // days
} as const;

export const SUPPORTED_COUNTRIES = [
  'FR', 'BE', 'DE', 'ES', 'IT', 'NL', 'AT', 'PT', 'IE', 'LU', // EU
  'BJ', 'CI', 'BF', 'ML', 'SN', 'TG', 'NE', 'GW', // West Africa
  'CM', 'CF', 'TD', 'CG', 'GQ', 'GA', // Central Africa
  'US', 'CA', 'GB', 'CH', 'NO', 'IS' // Other
] as const;

export const SECURITY_FRAMEWORKS = [
  'ISO27001',
  'NIST',
  'SOC2',
  'GDPR',
  'CCPA',
  'HIPAA'
] as const;
