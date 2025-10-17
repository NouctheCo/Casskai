/**
 * Base Channel Provider
 * Abstract base class for all e-invoicing delivery channels
 */

import {
  FormattingResult,
  ChannelResponse,
  EInvoiceChannel,
  EInvoicingError
} from '@/types/einvoicing.types';
import { logger } from '@/utils/logger';

export abstract class ChannelProvider {
  protected channelName: EInvoiceChannel;
  protected config: any;

  constructor(channelName: EInvoiceChannel, config: any = {}) {
    this.channelName = channelName;
    this.config = config;
  }

  /**
   * Submit document to the channel
   */
  abstract submitDocument(
    formattingResult: FormattingResult,
    documentId: string
  ): Promise<ChannelResponse>;

  /**
   * Check delivery status of a submitted document
   */
  abstract getDeliveryStatus(messageId: string): Promise<{
    status: string;
    details?: any;
  }>;

  /**
   * Check if channel is available
   */
  abstract isChannelAvailable(): Promise<boolean>;

  /**
   * Cancel a submitted document (if supported)
   */
  abstract cancelDocument(messageId: string, reason: string): Promise<boolean>;

  /**
   * Get channel capabilities
   */
  abstract getCapabilities(): Promise<{
    formats: string[];
    maxFileSize: number;
    supportsCancellation: boolean;
    supportsStatusTracking: boolean;
    features: string[];
  }>;

  /**
   * Validate configuration
   */
  protected validateConfig(): void {
    if (!this.config) {
      throw new EInvoicingError(
        `Configuration missing for channel ${this.channelName}`,
        'CONFIG_MISSING'
      );
    }
  }

  /**
   * Get channel name
   */
  getChannelName(): EInvoiceChannel {
    return this.channelName;
  }

  /**
   * Prepare authentication headers (to be implemented by subclasses)
   */
  protected abstract prepareAuthHeaders(): Promise<Record<string, string>>;

  /**
   * Handle API errors (common error handling logic)
   */
  protected handleApiError(error: any, context: string): never {
    logger.error(`${this.channelName} API error in ${context}:`, error);
    
    let errorMessage = `${this.channelName} API error: ${error.message || 'Unknown error'}`;
    let errorCode = 'API_ERROR';

    // Common HTTP error handling
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          errorMessage = `Bad request: ${data?.message || 'Invalid request format'}`;
          errorCode = 'BAD_REQUEST';
          break;
        case 401:
          errorMessage = 'Authentication failed';
          errorCode = 'AUTH_ERROR';
          break;
        case 403:
          errorMessage = 'Access forbidden';
          errorCode = 'ACCESS_DENIED';
          break;
        case 404:
          errorMessage = 'Resource not found';
          errorCode = 'NOT_FOUND';
          break;
        case 429:
          errorMessage = 'Rate limit exceeded';
          errorCode = 'RATE_LIMIT';
          break;
        case 500:
          errorMessage = 'Internal server error';
          errorCode = 'SERVER_ERROR';
          break;
        case 503:
          errorMessage = 'Service unavailable';
          errorCode = 'SERVICE_UNAVAILABLE';
          break;
        default:
          errorMessage = `HTTP ${status}: ${data?.message || 'Unknown error'}`;
      }
    }

    throw new EInvoicingError(errorMessage, errorCode, {
      channel: this.channelName,
      context,
      originalError: error.message || error.toString()
    });
  }

  /**
   * Retry logic with exponential backoff
   */
  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000,
    context: string = 'operation'
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`${this.channelName}: ${context} attempt ${attempt}/${maxRetries}`);
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }

        // Don't retry certain types of errors
        if (error instanceof EInvoicingError) {
          if (['BAD_REQUEST', 'AUTH_ERROR', 'ACCESS_DENIED'].includes(error.code)) {
            break;
          }
        }

        // Exponential backoff: 1s, 2s, 4s, ...
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
        logger.info(`${this.channelName}: Waiting ${delayMs}ms before retry...`);
        
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    throw lastError;
  }

  /**
   * Log channel activity
   */
  protected logActivity(activity: string, details?: any): void {
    const timestamp = new Date().toISOString();
    logger.info(`[${timestamp}] ${this.channelName}: ${activity}`, details || '')
  }

  /**
   * Validate document format for this channel
   */
  protected async validateDocumentFormat(formattingResult: FormattingResult): Promise<void> {
    const capabilities = await this.getCapabilities();
    
    if (!capabilities.formats.includes(formattingResult.format)) {
      throw new EInvoicingError(
        `Format ${formattingResult.format} not supported by channel ${this.channelName}`,
        'FORMAT_NOT_SUPPORTED',
        {
          supportedFormats: capabilities.formats,
          requestedFormat: formattingResult.format
        }
      );
    }
  }

  /**
   * Check document size limits
   */
  protected async validateDocumentSize(formattingResult: FormattingResult): Promise<void> {
    const capabilities = await this.getCapabilities();
    
    const xmlSize = Buffer.from(formattingResult.xml_content, 'utf8').length;
    const pdfSize = formattingResult.pdf_content?.length || 0;
    const totalSize = xmlSize + pdfSize;

    if (totalSize > capabilities.maxFileSize) {
      throw new EInvoicingError(
        `Document size (${Math.round(totalSize / 1024)}KB) exceeds channel limit (${Math.round(capabilities.maxFileSize / 1024)}KB)`,
        'DOCUMENT_TOO_LARGE',
        {
          documentSize: totalSize,
          maxSize: capabilities.maxFileSize,
          xmlSize,
          pdfSize
        }
      );
    }
  }

  /**
   * Generate unique message ID
   */
  protected generateMessageId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return `${this.channelName}_${timestamp}_${random}`;
  }

  /**
   * Create standardized channel response
   */
  protected createChannelResponse(
    success: boolean,
    messageId?: string,
    trackingId?: string,
    errors?: string[],
    rawResponse?: any
  ): ChannelResponse {
    return {
      success,
      message_id: messageId,
      tracking_id: trackingId,
      errors: errors || [],
      raw_response: rawResponse
    };
  }
}