import { 
  SecuritySettings, 
  PrivacySettings, 
  SecurityIncident, 
  AuditLog, 
  GDPRRequest,
  CookieConsent,
  ComplianceReport,
  DataProcessingActivity,
  DATA_RETENTION_PERIODS,
  GDPR_RESPONSE_TIMES 
} from '@/types/security.types';

class SecurityService {
  constructor() {
    this.initializeSecurityStorage();
  }

  private initializeSecurityStorage() {
    // Initialize security settings if not exists
    if (!localStorage.getItem('casskai_security_settings')) {
      const defaultSettings: Partial<SecuritySettings> = {
        id: 'security-default',
        companyId: 'comp-1',
        twoFactorRequired: false,
        sessionTimeout: 480, // 8 hours
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          preventReuse: 5,
          maxAge: 90
        },
        ipWhitelist: [],
        allowedCountries: ['FR', 'BE', 'ES', 'US', 'CA', 'BJ', 'CI', 'BF', 'ML', 'SN', 'TG'],
        dataRetentionDays: DATA_RETENTION_PERIODS.USER_DATA,
        auditLogEnabled: true,
        encryptionLevel: 'high',
        backupEncrypted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('casskai_security_settings', JSON.stringify(defaultSettings));
    }

    // Initialize privacy settings
    if (!localStorage.getItem('casskai_privacy_settings')) {
      const defaultPrivacy: Partial<PrivacySettings> = {
        id: 'privacy-default',
        userId: 'user-1',
        companyId: 'comp-1',
        dataProcessingConsent: false,
        marketingConsent: false,
        analyticsConsent: false,
        thirdPartySharing: false,
        dataExportRequested: false,
        dataDeletionRequested: false,
        consentHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('casskai_privacy_settings', JSON.stringify(defaultPrivacy));
    }

    // Initialize audit logs
    if (!localStorage.getItem('casskai_audit_logs')) {
      localStorage.setItem('casskai_audit_logs', JSON.stringify([]));
    }

    // Initialize GDPR requests
    if (!localStorage.getItem('casskai_gdpr_requests')) {
      localStorage.setItem('casskai_gdpr_requests', JSON.stringify([]));
    }

    // Initialize security incidents
    if (!localStorage.getItem('casskai_security_incidents')) {
      localStorage.setItem('casskai_security_incidents', JSON.stringify([]));
    }

    // Initialize cookie consents
    if (!localStorage.getItem('casskai_cookie_consents')) {
      localStorage.setItem('casskai_cookie_consents', JSON.stringify([]));
    }
  }

  // Security Settings Management
  async getSecuritySettings(companyId: string): Promise<SecuritySettings | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const settings = JSON.parse(localStorage.getItem('casskai_security_settings') || 'null');
        resolve(settings?.companyId === companyId ? settings : null);
      }, 100);
    });
  }

  async updateSecuritySettings(settings: Partial<SecuritySettings>): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const currentSettings = JSON.parse(localStorage.getItem('casskai_security_settings') || '{}');
        const updatedSettings = {
          ...currentSettings,
          ...settings,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('casskai_security_settings', JSON.stringify(updatedSettings));
        this.logSecurityEvent('security_settings_updated', 'security_settings', settings);
        resolve();
      }, 200);
    });
  }

  // Privacy Settings Management
  async getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const settings = JSON.parse(localStorage.getItem('casskai_privacy_settings') || 'null');
        resolve(settings?.userId === userId ? settings : null);
      }, 100);
    });
  }

  async updatePrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const currentSettings = JSON.parse(localStorage.getItem('casskai_privacy_settings') || '{}');
        const updatedSettings = {
          ...currentSettings,
          ...settings,
          userId,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('casskai_privacy_settings', JSON.stringify(updatedSettings));
        this.logSecurityEvent('privacy_settings_updated', 'privacy_settings', settings, userId);
        resolve();
      }, 200);
    });
  }

  // Consent Management
  async recordConsent(
    userId: string, 
    consentType: 'data_processing' | 'marketing' | 'analytics' | 'third_party',
    granted: boolean,
    legalBasis: string,
    purpose: string
  ): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const settings = JSON.parse(localStorage.getItem('casskai_privacy_settings') || '{}');
        const consentRecord = {
          id: `consent-${Date.now()}`,
          consentType,
          granted,
          timestamp: new Date().toISOString(),
          ipAddress: '192.168.1.100', // Mock IP
          userAgent: navigator.userAgent,
          legalBasis,
          purpose
        };

        settings.consentHistory = settings.consentHistory || [];
        settings.consentHistory.push(consentRecord);
        settings[`${consentType}Consent`] = granted;
        settings.updatedAt = new Date().toISOString();

        localStorage.setItem('casskai_privacy_settings', JSON.stringify(settings));
        this.logSecurityEvent('consent_recorded', 'consent', { consentType, granted }, userId);
        resolve();
      }, 150);
    });
  }

  // GDPR Request Management
  async createGDPRRequest(
    userId: string,
    companyId: string,
    type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection',
    requestDetails: string
  ): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const requests = JSON.parse(localStorage.getItem('casskai_gdpr_requests') || '[]');
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + GDPR_RESPONSE_TIMES.ACCESS_REQUEST);

        const newRequest: GDPRRequest = {
          id: `gdpr-${Date.now()}`,
          userId,
          companyId,
          type,
          status: 'pending',
          requestDetails,
          requestedAt: new Date().toISOString(),
          dueDate: dueDate.toISOString()
        };

        requests.push(newRequest);
        localStorage.setItem('casskai_gdpr_requests', JSON.stringify(requests));
        this.logSecurityEvent('gdpr_request_created', 'gdpr_request', { type, requestId: newRequest.id }, userId);
        resolve(newRequest.id);
      }, 200);
    });
  }

  async getGDPRRequests(companyId: string): Promise<GDPRRequest[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const requests = JSON.parse(localStorage.getItem('casskai_gdpr_requests') || '[]');
        const companyRequests = requests.filter((req: GDPRRequest) => req.companyId === companyId);
        resolve(companyRequests);
      }, 100);
    });
  }

  async processGDPRRequest(requestId: string, processedBy: string, responseData?: any): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const requests = JSON.parse(localStorage.getItem('casskai_gdpr_requests') || '[]');
        const requestIndex = requests.findIndex((req: GDPRRequest) => req.id === requestId);
        
        if (requestIndex !== -1) {
          requests[requestIndex].status = 'completed';
          requests[requestIndex].processedBy = processedBy;
          requests[requestIndex].responseData = responseData;
          requests[requestIndex].completedAt = new Date().toISOString();
          
          localStorage.setItem('casskai_gdpr_requests', JSON.stringify(requests));
          this.logSecurityEvent('gdpr_request_processed', 'gdpr_request', { requestId }, processedBy);
        }
        resolve();
      }, 200);
    });
  }

  // Audit Logging
  async logSecurityEvent(
    action: string,
    resource: string,
    details: Record<string, any>,
    userId: string = 'system',
    riskLevel: 'low' | 'medium' | 'high' = 'low'
  ): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const logs = JSON.parse(localStorage.getItem('casskai_audit_logs') || '[]');
        
        const logEntry: AuditLog = {
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          companyId: 'comp-1',
          action,
          resource,
          resourceId: details.id || details.requestId,
          details,
          ipAddress: '192.168.1.100', // Mock IP
          userAgent: navigator.userAgent,
          outcome: 'success',
          riskLevel,
          timestamp: new Date().toISOString()
        };

        logs.unshift(logEntry);
        
        // Keep only the last 10000 logs to prevent storage bloat
        if (logs.length > 10000) {
          logs.splice(10000);
        }

        localStorage.setItem('casskai_audit_logs', JSON.stringify(logs));
        resolve();
      }, 50);
    });
  }

  async getAuditLogs(companyId: string, limit: number = 1000): Promise<AuditLog[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const logs = JSON.parse(localStorage.getItem('casskai_audit_logs') || '[]');
        const companyLogs = logs
          .filter((log: AuditLog) => log.companyId === companyId)
          .slice(0, limit);
        resolve(companyLogs);
      }, 100);
    });
  }

  // Security Incident Management
  async createSecurityIncident(incident: Omit<SecurityIncident, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const incidents = JSON.parse(localStorage.getItem('casskai_security_incidents') || '[]');
        
        const newIncident: SecurityIncident = {
          ...incident,
          id: `incident-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        incidents.push(newIncident);
        localStorage.setItem('casskai_security_incidents', JSON.stringify(incidents));
        this.logSecurityEvent('security_incident_created', 'security_incident', 
          { type: incident.type, severity: incident.severity }, incident.reporter, 'high');
        resolve(newIncident.id);
      }, 200);
    });
  }

  async getSecurityIncidents(companyId: string): Promise<SecurityIncident[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const incidents = JSON.parse(localStorage.getItem('casskai_security_incidents') || '[]');
        const companyIncidents = incidents.filter((inc: SecurityIncident) => inc.companyId === companyId);
        resolve(companyIncidents);
      }, 100);
    });
  }

  // Cookie Consent Management
  async recordCookieConsent(consent: Omit<CookieConsent, 'id' | 'consentDate' | 'expiryDate'>): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const consents = JSON.parse(localStorage.getItem('casskai_cookie_consents') || '[]');
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year expiry

        const newConsent: CookieConsent = {
          ...consent,
          id: `cookie-${Date.now()}`,
          consentDate: new Date().toISOString(),
          expiryDate: expiryDate.toISOString()
        };

        consents.push(newConsent);
        localStorage.setItem('casskai_cookie_consents', JSON.stringify(consents));
        resolve();
      }, 100);
    });
  }

  async getCookieConsent(sessionId: string): Promise<CookieConsent | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const consents = JSON.parse(localStorage.getItem('casskai_cookie_consents') || '[]');
        const consent = consents.find((c: CookieConsent) => c.sessionId === sessionId);
        
        // Check if consent is still valid
        if (consent && new Date(consent.expiryDate) > new Date()) {
          resolve(consent);
        } else {
          resolve(null);
        }
      }, 50);
    });
  }

  // Data Export (GDPR Article 20)
  async exportUserData(userId: string): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock data export - in real implementation, this would collect data from all systems
        const userData = {
          personalData: {
            userId,
            exportDate: new Date().toISOString(),
            dataSubject: {
              id: userId,
              email: 'user@example.com',
              name: 'John Doe',
              registrationDate: '2024-01-01T00:00:00Z'
            }
          },
          accountingData: {
            invoices: [],
            transactions: [],
            reports: []
          },
          auditLogs: JSON.parse(localStorage.getItem('casskai_audit_logs') || '[]')
            .filter((log: AuditLog) => log.userId === userId),
          privacySettings: JSON.parse(localStorage.getItem('casskai_privacy_settings') || '{}'),
          consentHistory: JSON.parse(localStorage.getItem('casskai_privacy_settings') || '{}').consentHistory || []
        };

        this.logSecurityEvent('data_export_completed', 'user_data', { userId }, userId);
        resolve(userData);
      }, 1000);
    });
  }

  // Data Deletion (GDPR Article 17)
  async deleteUserData(userId: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mark for deletion rather than immediate deletion for compliance
        const privacySettings = JSON.parse(localStorage.getItem('casskai_privacy_settings') || '{}');
        privacySettings.dataDeletionRequested = true;
        privacySettings.dataDeletionRequestedAt = new Date().toISOString();
        privacySettings.updatedAt = new Date().toISOString();
        
        localStorage.setItem('casskai_privacy_settings', JSON.stringify(privacySettings));
        this.logSecurityEvent('data_deletion_requested', 'user_data', { userId }, userId, 'medium');
        resolve();
      }, 200);
    });
  }

  // Password Validation
  validatePassword(password: string, policy: SecuritySettings['passwordPolicy']): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Security Compliance Report
  async generateComplianceReport(companyId: string): Promise<ComplianceReport> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const settings = JSON.parse(localStorage.getItem('casskai_security_settings') || '{}');
        const incidents = JSON.parse(localStorage.getItem('casskai_security_incidents') || '[]');
        const gdprRequests = JSON.parse(localStorage.getItem('casskai_gdpr_requests') || '[]');

        const findings = [];
        let score = 100;

        // Check 2FA
        if (!settings.twoFactorRequired) {
          findings.push({
            id: 'finding-2fa',
            category: 'security',
            severity: 'warning',
            title: 'Two-Factor Authentication Not Required',
            description: 'Two-factor authentication is not mandatory for users',
            recommendation: 'Enable mandatory 2FA for all users',
            status: 'open'
          });
          score -= 10;
        }

        // Check encryption level
        if (settings.encryptionLevel !== 'maximum') {
          findings.push({
            id: 'finding-encryption',
            category: 'security',
            severity: 'info',
            title: 'Encryption Level Can Be Improved',
            description: 'Current encryption level is not set to maximum',
            recommendation: 'Consider upgrading to maximum encryption level',
            status: 'open'
          });
          score -= 5;
        }

        // Check incident response
        const openIncidents = incidents.filter((inc: SecurityIncident) => inc.status === 'open').length;
        if (openIncidents > 0) {
          findings.push({
            id: 'finding-incidents',
            category: 'security',
            severity: 'critical',
            title: 'Open Security Incidents',
            description: `${openIncidents} security incidents are still open`,
            recommendation: 'Investigate and resolve all open security incidents',
            status: 'open'
          });
          score -= 20;
        }

        const report: ComplianceReport = {
          id: `report-${Date.now()}`,
          companyId,
          reportType: 'gdpr_compliance',
          period: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          },
          findings,
          recommendations: [
            'Implement regular security training for all users',
            'Conduct quarterly security assessments',
            'Review and update privacy policies annually',
            'Establish incident response procedures'
          ],
          overallScore: Math.max(0, score),
          status: 'final',
          generatedAt: new Date().toISOString(),
          generatedBy: 'system'
        };

        this.logSecurityEvent('compliance_report_generated', 'compliance_report', { reportId: report.id });
        resolve(report);
      }, 500);
    });
  }
}

export const securityService = new SecurityService();
export default securityService;