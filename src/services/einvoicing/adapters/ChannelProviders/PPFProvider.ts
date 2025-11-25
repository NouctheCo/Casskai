/**
 * PPF (Chorus Pro) Provider
 * Handles submission to French government's Chorus Pro platform
 * https://chorus-pro.gouv.fr/
 */

import {
  FormattingResult,
  ChannelResponse,
  EInvoicingError
} from '../../../../types/einvoicing.types';
import { ChannelProvider } from './base/ChannelProvider';

interface PPFConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  certificatePath?: string;
  sandbox?: boolean;
}

interface PPFAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PPFSubmissionResponse {
  numeroFluxDepot: string;
  codeRetour: number;
  libelle: string;
  dateDepot: string;
  identifiantFacture?: string;
}

interface PPFStatusResponse {
  numeroFluxDepot: string;
  statut: string;
  codeStatut: number;
  dateTraitement?: string;
  motifRejet?: string;
  identifiantDestinataire?: string;
}

export class PPFProvider extends ChannelProvider {
  declare protected config: PPFConfig;
  private accessToken?: string;
  private tokenExpiresAt?: number;

  constructor(config?: Partial<PPFConfig>) {
    super('PPF', config);

    // Default configuration
    this.config = {
      baseUrl: config?.sandbox 
        ? 'https://sandbox-choruspro.gouv.fr'
        : 'https://choruspro.gouv.fr',
      clientId: config?.clientId || process.env.PPF_CLIENT_ID || '',
      clientSecret: config?.clientSecret || process.env.PPF_CLIENT_SECRET || '',
      certificatePath: config?.certificatePath,
      sandbox: config?.sandbox || process.env.NODE_ENV !== 'production'
    };

    this.validateConfig();
  }

  /**
   * Submit document to Chorus Pro
   */
  async submitDocument(
    formattingResult: FormattingResult,
    documentId: string
  ): Promise<ChannelResponse> {
    try {
      this.logActivity('Starting PPF submission', { documentId, format: formattingResult.format });

      // Validate document
      await this.validateDocumentFormat(formattingResult);
      await this.validateDocumentSize(formattingResult);

      // Ensure we have a valid access token
      await this.ensureValidToken();

      // Prepare submission payload
      const payload = await this.prepareSubmissionPayload(formattingResult, documentId);

      // Submit to Chorus Pro
      const response = await this.retryWithBackoff(
        () => this.performSubmission(payload),
        3,
        1000,
        'PPF submission'
      );

      this.logActivity('PPF submission completed', { 
        documentId, 
        numeroFluxDepot: response.numeroFluxDepot,
        codeRetour: response.codeRetour 
      });

      // Check if submission was successful
      if (response.codeRetour === 0) {
        return this.createChannelResponse(
          true,
          response.numeroFluxDepot,
          response.identifiantFacture,
          undefined,
          response
        );
      } else {
        return this.createChannelResponse(
          false,
          response.numeroFluxDepot,
          undefined,
          [response.libelle || 'Submission failed'],
          response
        );
      }

    } catch (error) {
      this.logActivity('PPF submission failed', { documentId, error: (error as Error).message });
      this.handleApiError(error, 'submitDocument');
    }
  }

  /**
   * Get delivery status from Chorus Pro
   */
  async getDeliveryStatus(messageId: string): Promise<{
    status: string;
    details?: any;
  }> {
    try {
      this.logActivity('Getting PPF delivery status', { messageId });

      await this.ensureValidToken();

      const response = await this.retryWithBackoff(
        () => this.performStatusCheck(messageId),
        2,
        1000,
        'PPF status check'
      );

      // Map Chorus Pro status to standard status
      const standardStatus = this.mapPPFStatusToStandard(response.statut, response.codeStatut);

      this.logActivity('PPF status retrieved', { 
        messageId, 
        status: standardStatus, 
        ppfStatus: response.statut 
      });

      return {
        status: standardStatus,
        details: {
          ppfStatus: response.statut,
          codeStatut: response.codeStatut,
          dateTraitement: response.dateTraitement,
          motifRejet: response.motifRejet,
          identifiantDestinataire: response.identifiantDestinataire,
          raw: response
        }
      };

    } catch (error) {
      this.logActivity('PPF status check failed', { messageId, error: (error as Error).message });
      this.handleApiError(error, 'getDeliveryStatus');
    }
  }

  /**
   * Check if Chorus Pro is available
   */
  async isChannelAvailable(): Promise<boolean> {
    try {
      this.logActivity('Checking PPF availability');

      // Try to get an access token
      await this.ensureValidToken();

      // Perform a simple health check
      const response = await fetch(`${this.config.baseUrl}/api/ping`, {
        method: 'GET',
        headers: await this.prepareAuthHeaders(),
        // fetch timeout is not standard; tests will stub fetch if needed
      });

      const isAvailable = response.ok;
      this.logActivity('PPF availability check completed', { available: isAvailable });

      return isAvailable;

    } catch (error) {
      this.logActivity('PPF availability check failed', { error: (error as Error).message });
      return false;
    }
  }

  /**
   * Cancel document (not supported by Chorus Pro)
   */
  async cancelDocument(messageId: string, reason: string): Promise<boolean> {
    this.logActivity('PPF cancellation attempted', { 
      messageId, 
      reason, 
      note: 'Cancellation not supported by Chorus Pro' 
    });
    
    // Chorus Pro doesn't support document cancellation
    // Once submitted, documents follow their natural lifecycle
    return false;
  }

  /**
   * Get PPF capabilities
   */
  async getCapabilities(): Promise<{
    formats: string[];
    maxFileSize: number;
    supportsCancellation: boolean;
    supportsStatusTracking: boolean;
    features: string[];
  }> {
    return {
      formats: ['FACTURX', 'UBL', 'CII'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      supportsCancellation: false,
      supportsStatusTracking: true,
      features: [
        'factur-x_1.0.7',
        'ubl_2.1',
        'cii_d16b',
        'pdf_a3_embedding',
        'government_compliance',
        'audit_trail',
        'status_notifications'
      ]
    };
  }

  // Protected methods

  protected async prepareAuthHeaders(): Promise<Record<string, string>> {
    await this.ensureValidToken();
    
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  protected validateConfig(): void {
    super.validateConfig();
    
    if (!this.config.clientId) {
      throw new EInvoicingError(
        'PPF Client ID is required',
        'CONFIG_MISSING',
        { field: 'clientId' }
      );
    }

    if (!this.config.clientSecret) {
      throw new EInvoicingError(
        'PPF Client Secret is required',
        'CONFIG_MISSING',
        { field: 'clientSecret' }
      );
    }

    if (!this.config.baseUrl) {
      throw new EInvoicingError(
        'PPF Base URL is required',
        'CONFIG_MISSING',
        { field: 'baseUrl' }
      );
    }
  }

  // Private methods

  private async ensureValidToken(): Promise<void> {
    const now = Date.now();
    
    // Check if token is valid (with 5 minute buffer)
    if (this.accessToken && this.tokenExpiresAt && (this.tokenExpiresAt - 300000) > now) {
      return;
    }

    this.logActivity('Refreshing PPF access token');

    try {
      const tokenResponse = await fetch(`${this.config.baseUrl}/api/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          scope: 'facture.depot facture.consultation'
        })
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token request failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
      }

      const tokenData: PPFAuthResponse = await tokenResponse.json();
      
      this.accessToken = tokenData.access_token;
      this.tokenExpiresAt = now + (tokenData.expires_in * 1000);

      this.logActivity('PPF access token refreshed', { 
        expiresIn: tokenData.expires_in,
        expiresAt: new Date(this.tokenExpiresAt).toISOString()
      });

    } catch (error) {
      this.logActivity('PPF token refresh failed', { error: (error as Error).message });
      throw new EInvoicingError(
        `Failed to obtain PPF access token: ${(error as Error).message}`,
        'AUTH_ERROR'
      );
    }
  }

  private async prepareSubmissionPayload(
    formattingResult: FormattingResult,
    documentId: string
  ): Promise<any> {
    // Convert content to base64 for transmission
    const xmlBase64 = Buffer.from(formattingResult.xml_content, 'utf8').toString('base64');
    const pdfBase64 = formattingResult.pdf_content?.toString('base64');

    return {
      numeroFluxDepot: this.generateMessageId(),
      identifiantFacture: documentId,
      typeDocument: this.mapFormatToTypeDocument(formattingResult.format),
      fichierFacture: {
        nomFichier: `facture_${documentId}.xml`,
        contenuFichier: xmlBase64,
        typeMime: 'application/xml'
      },
      ...(pdfBase64 && {
        fichierPDF: {
          nomFichier: `facture_${documentId}.pdf`,
          contenuFichier: pdfBase64,
          typeMime: 'application/pdf'
        }
      }),
      metadata: {
        generated_by: 'CassKai',
        generated_at: new Date().toISOString(),
        document_hash: formattingResult.sha256_xml,
        format_version: formattingResult.metadata?.format_version
      }
    };
  }

  private async performSubmission(payload: any): Promise<PPFSubmissionResponse> {
    const response = await fetch(`${this.config.baseUrl}/api/factures/v1/depot`, {
      method: 'POST',
      headers: await this.prepareAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`PPF submission failed: ${response.status} ${response.statusText} - ${errorData}`);
    }

    return await response.json();
  }

  private async performStatusCheck(messageId: string): Promise<PPFStatusResponse> {
    const response = await fetch(
      `${this.config.baseUrl}/api/factures/v1/consultation/statut/${encodeURIComponent(messageId)}`,
      {
        method: 'GET',
        headers: await this.prepareAuthHeaders()
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`PPF status check failed: ${response.status} ${response.statusText} - ${errorData}`);
    }

    return await response.json();
  }

  private mapFormatToTypeDocument(format: string): string {
    switch (format) {
      case 'FACTURX': return 'FACTUR_X';
      case 'UBL': return 'UBL_INVOICE';
      case 'CII': return 'CII_INVOICE';
      default: return 'FACTUR_X';
    }
  }

  private mapPPFStatusToStandard(ppfStatus: string, codeStatut: number): string {
    // Map Chorus Pro status codes to standard lifecycle status
    switch (ppfStatus?.toUpperCase()) {
      case 'DEPOSE':
      case 'EN_COURS_DE_TRAITEMENT':
        return 'SUBMITTED';
      case 'LIVRE':
      case 'DELIVRE':
        return 'DELIVERED';
      case 'ACCEPTE':
      case 'VALIDE':
        return 'ACCEPTED';
      case 'REJETE':
      case 'REFUSE':
        return 'REJECTED';
      case 'PAYE':
      case 'ACQUITTE':
        return 'PAID';
      default:
        return 'SUBMITTED';
    }
  }
}
