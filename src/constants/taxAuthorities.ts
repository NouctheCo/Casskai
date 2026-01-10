/**
 * Configuration des autorités fiscales par pays
 * Contient les endpoints, authentification, et paramètres spécifiques
 */

import { TaxAuthorityConfig } from '@/types/taxAuthority';

export const TAX_AUTHORITIES: Record<string, TaxAuthorityConfig[]> = {
  FR: [
    {
      id: 'fr-dgi-general',
      authority_name: 'Direction Générale des Impôts (DGI)',
      country_code: 'FR',
      authority_type: 'GENERAL',
      api_base_url: 'https://api.impots.gouv.fr/v2',
      api_protocol: 'REST',
      api_version: '2.0',
      auth_method: 'OAUTH2',
      auth_endpoint: 'https://oauth.impots.gouv.fr/authorize',
      requires_signature: true,
      signature_algorithm: 'RSA-SHA256',
      certificate_required: true,
      supported_formats: ['PDF', 'XML'],
      supported_document_types: ['BALANCE_SHEET', 'INCOME_STATEMENT', 'VAT_RETURN', 'CIR', 'TAX_RETURN'],
      max_submission_size: 52428800, // 50MB
      submission_frequency: 'ANNUALLY',
      submission_endpoint: '/submissions',
      status_check_endpoint: '/submissions/{id}/status',
      acknowledgement_endpoint: '/submissions/{id}/acknowledgement',
      expects_acknowledgement: true,
      acknowledgement_timeout_hours: 48,
      is_active: true,
      documentation_url: 'https://www.impots.gouv.fr/portail/node/9030',
      support_contact_email: 'support@impots.gouv.fr',
      support_phone: '+33 1 41 41 41 41',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  
  SN: [
    {
      id: 'sn-dgid-general',
      authority_name: 'Direction Générale des Impôts et Domaines (DGID)',
      country_code: 'SN',
      authority_type: 'GENERAL',
      api_base_url: 'https://api.dgid.sn/v1',
      api_protocol: 'REST',
      api_version: '1.0',
      auth_method: 'CLIENT_CREDENTIALS',
      auth_endpoint: 'https://api.dgid.sn/oauth/token',
      requires_signature: false,
      certificate_required: false,
      supported_formats: ['PDF', 'XML', 'JSON'],
      supported_document_types: ['BALANCE_SHEET', 'INCOME_STATEMENT', 'VAT_RETURN', 'PAYROLL'],
      max_submission_size: 26214400, // 25MB
      submission_frequency: 'QUARTERLY',
      submission_endpoint: '/declarations/submit',
      status_check_endpoint: '/declarations/{id}',
      acknowledgement_endpoint: '/declarations/{id}/acknowledgement',
      expects_acknowledgement: true,
      acknowledgement_timeout_hours: 72,
      is_active: true,
      documentation_url: 'https://www.impots.sn',
      support_contact_email: 'support@dgid.sn',
      support_phone: '+221 33 849 90 00',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  
  KE: [
    {
      id: 'ke-kra-general',
      authority_name: 'Kenya Revenue Authority (KRA)',
      country_code: 'KE',
      authority_type: 'GENERAL',
      api_base_url: 'https://api.kra.go.ke/v1',
      api_protocol: 'REST',
      api_version: '1.0',
      auth_method: 'API_KEY',
      requires_signature: false,
      certificate_required: false,
      supported_formats: ['JSON', 'XML', 'PDF'],
      supported_document_types: ['CIT_RETURN', 'VAT_RETURN', 'PAYE_RETURN', 'WHT_RETURN'],
      max_submission_size: 52428800, // 50MB
      submission_frequency: 'MONTHLY',
      submission_endpoint: '/filings/submit',
      status_check_endpoint: '/filings/{id}',
      acknowledgement_endpoint: '/filings/{id}/acknowledgement',
      expects_acknowledgement: true,
      acknowledgement_timeout_hours: 24,
      is_active: true,
      documentation_url: 'https://itaxportal.kra.go.ke',
      support_contact_email: 'support@kra.go.ke',
      support_phone: '+254 711 062 222',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  
  NG: [
    {
      id: 'ng-firs-general',
      authority_name: 'Federal Inland Revenue Service (FIRS)',
      country_code: 'NG',
      authority_type: 'GENERAL',
      api_base_url: 'https://api.firs.gov.ng/v1',
      api_protocol: 'REST',
      api_version: '1.0',
      auth_method: 'OAUTH2',
      auth_endpoint: 'https://auth.firs.gov.ng/oauth/authorize',
      requires_signature: true,
      signature_algorithm: 'RSA-SHA256',
      certificate_required: true,
      supported_formats: ['XML', 'PDF', 'JSON'],
      supported_document_types: ['CIT_RETURN', 'VAT_RETURN', 'PAYE_RETURN', 'WHT_RETURN'],
      max_submission_size: 52428800, // 50MB
      submission_frequency: 'MONTHLY',
      submission_endpoint: '/returns/submit',
      status_check_endpoint: '/returns/{id}/status',
      acknowledgement_endpoint: '/returns/{id}/receipt',
      expects_acknowledgement: true,
      acknowledgement_timeout_hours: 48,
      is_active: true,
      documentation_url: 'https://www.firs.gov.ng',
      support_contact_email: 'techsupport@firs.gov.ng',
      support_phone: '+234 1 448 5000',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  
  DZ: [
    {
      id: 'dz-dgid-general',
      authority_name: 'Direction Générale des Impôts (DGI)',
      country_code: 'DZ',
      authority_type: 'GENERAL',
      api_base_url: 'https://api.impots.dz/v1',
      api_protocol: 'REST',
      api_version: '1.0',
      auth_method: 'CLIENT_CREDENTIALS',
      auth_endpoint: 'https://api.impots.dz/oauth/token',
      requires_signature: false,
      certificate_required: false,
      supported_formats: ['XML', 'PDF'],
      supported_document_types: ['BALANCE_SHEET', 'INCOME_STATEMENT', 'VAT_RETURN'],
      max_submission_size: 26214400, // 25MB
      submission_frequency: 'QUARTERLY',
      submission_endpoint: '/declarations/submit',
      status_check_endpoint: '/declarations/{id}',
      acknowledgement_endpoint: '/declarations/{id}/confirmation',
      expects_acknowledgement: true,
      acknowledgement_timeout_hours: 72,
      is_active: true,
      documentation_url: 'https://www.impots.dz',
      support_contact_email: 'support@impots.dz',
      support_phone: '+213 21 74 90 00',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  
  MA: [
    {
      id: 'ma-dgi-general',
      authority_name: 'Direction Générale des Impôts (DGI)',
      country_code: 'MA',
      authority_type: 'GENERAL',
      api_base_url: 'https://www.impots.finances.gov.ma/api/v1',
      api_protocol: 'REST',
      api_version: '1.0',
      auth_method: 'OAUTH2',
      auth_endpoint: 'https://www.impots.finances.gov.ma/oauth/authorize',
      requires_signature: false,
      certificate_required: false,
      supported_formats: ['XML', 'PDF', 'JSON'],
      supported_document_types: ['BALANCE_SHEET', 'INCOME_STATEMENT', 'VAT_RETURN'],
      max_submission_size: 26214400, // 25MB
      submission_frequency: 'QUARTERLY',
      submission_endpoint: '/declarations/submit',
      status_check_endpoint: '/declarations/{id}',
      acknowledgement_endpoint: '/declarations/{id}/confirmation',
      expects_acknowledgement: true,
      acknowledgement_timeout_hours: 48,
      is_active: true,
      documentation_url: 'https://www.impots.finances.gov.ma',
      support_contact_email: 'support@impots.finances.gov.ma',
      support_phone: '+212 5 37 68 90 00',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
};

export const SUPPORTED_COUNTRIES = Object.keys(TAX_AUTHORITIES);

export const getAuthorityByCountryAndType = (
  countryCode: string,
  authorityType?: string
): TaxAuthorityConfig | undefined => {
  const authorities = TAX_AUTHORITIES[countryCode];
  if (!authorities) return undefined;
  
  if (!authorityType) return authorities[0];
  
  return authorities.find(auth => auth.authority_type === authorityType);
};

export const getAuthoritiesByCountry = (countryCode: string): TaxAuthorityConfig[] => {
  return TAX_AUTHORITIES[countryCode] || [];
};
