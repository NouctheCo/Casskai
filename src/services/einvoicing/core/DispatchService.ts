/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */
/**
 * Dispatch Service
 * Handles submission to delivery channels (PPF, PDP providers)
 */
import {
  FormattingResult,
  EInvoiceChannel,
  ChannelResponse,
  EInvoicingError,
  SubmissionError
} from '../../../types/einvoicing.types';
import { ChannelProvider } from '../adapters/ChannelProviders/base/ChannelProvider';
import { PPFProvider } from '../adapters/ChannelProviders/PPFProvider';
import { logger } from '@/lib/logger';
export class DispatchService {
  private providers: Map<string, ChannelProvider> = new Map();
  constructor() {
    // Initialize available channel providers
    this.initializeProviders();
  }
  /**
   * Submit document to specified channel
   */
  async submitDocument(
    formattingResult: FormattingResult,
    channel: EInvoiceChannel,
    documentId: string
  ): Promise<ChannelResponse> {
    try {
      logger.warn('Dispatch', `📤 Submitting document ${documentId} via ${channel}`);
      // Get appropriate provider
      const provider = this.getProvider(channel);
      if (!provider) {
        throw new SubmissionError(`No provider available for channel: ${channel}`, channel);
      }
      // Validate channel availability
      const isAvailable = await provider.isChannelAvailable();
      if (!isAvailable) {
        throw new SubmissionError(`Channel ${channel} is not available`, channel);
      }
      // Submit document
      const response = await provider.submitDocument(formattingResult, documentId);
      logger.warn('Dispatch', `✅ Document ${documentId} submitted successfully via ${channel}:`, response.message_id);
      return response;
    } catch (error) {
      logger.error('Dispatch', `❌ Error submitting document ${documentId} via ${channel}:`, error);
      if (error instanceof SubmissionError) {
        throw error;
      }
      throw new SubmissionError(
        `Failed to submit document via ${channel}: ${(error as Error).message}`,
        channel,
        { documentId, error: (error as Error).message }
      );
    }
  }
  /**
   * Get delivery status for a submitted document
   */
  async getDeliveryStatus(
    messageId: string,
    channel: EInvoiceChannel
  ): Promise<{
    status: string;
    details?: any;
  }> {
    try {
      logger.warn('Dispatch', `🔍 Getting delivery status for message ${messageId} via ${channel}`);
      const provider = this.getProvider(channel);
      if (!provider) {
        throw new SubmissionError(`No provider available for channel: ${channel}`, channel);
      }
      const status = await provider.getDeliveryStatus(messageId);
      logger.warn('Dispatch', `📊 Status for message ${messageId}:`, status.status);
      return status;
    } catch (error) {
      logger.error('Dispatch', `❌ Error getting delivery status for ${messageId}:`, error);
      throw new EInvoicingError(
        `Failed to get delivery status: ${(error as Error).message}`,
        'STATUS_CHECK_ERROR',
        { messageId, channel }
      );
    }
  }
  /**
   * Cancel a submitted document (if supported by channel)
   */
  async cancelDocument(
    messageId: string,
    channel: EInvoiceChannel,
    reason: string
  ): Promise<boolean> {
    try {
      logger.warn('Dispatch', `🚫 Cancelling document ${messageId} via ${channel}: ${reason}`);
      const provider = this.getProvider(channel);
      if (!provider) {
        throw new SubmissionError(`No provider available for channel: ${channel}`, channel);
      }
      const result = await provider.cancelDocument(messageId, reason);
      if (result) {
        logger.warn('Dispatch', `✅ Document ${messageId} cancelled successfully`);
      } else {
        logger.warn('Dispatch', `⚠️ Document ${messageId} could not be cancelled (may not support cancellation)`);
      }
      return result;
    } catch (error) {
      logger.error('Dispatch', `❌ Error cancelling document ${messageId}:`, error);
      throw new EInvoicingError(
        `Failed to cancel document: ${(error as Error).message}`,
        'CANCELLATION_ERROR',
        { messageId, channel, reason }
      );
    }
  }
  /**
   * Test channel connectivity
   */
  async testChannelConnectivity(channel: EInvoiceChannel): Promise<{
    available: boolean;
    latency?: number;
    error?: string;
  }> {
    try {
      logger.warn('Dispatch', `🧪 Testing connectivity for channel ${channel}`);
      const startTime = Date.now();
      const provider = this.getProvider(channel);
      if (!provider) {
        return {
          available: false,
          error: `No provider available for channel: ${channel}`
        };
      }
      const isAvailable = await provider.isChannelAvailable();
      const latency = Date.now() - startTime;
      logger.warn('Dispatch', `📊 Channel ${channel} test result: ${isAvailable ? 'OK' : 'FAILED'} (${latency}ms)`);
      return {
        available: isAvailable,
        latency
      };
    } catch (error) {
      logger.error('Dispatch', `❌ Error testing channel ${channel}:`, error);
      return {
        available: false,
        error: (error as Error).message
      };
    }
  }
  /**
   * Get supported channels
   */
  getSupportedChannels(): EInvoiceChannel[] {
    return Array.from(this.providers.keys()) as EInvoiceChannel[];
  }
  /**
   * Get channel capabilities
   */
  async getChannelCapabilities(channel: EInvoiceChannel): Promise<{
    formats: string[];
    maxFileSize: number;
    supportsCancellation: boolean;
    supportsStatusTracking: boolean;
    features: string[];
  }> {
    const provider = this.getProvider(channel);
    if (!provider) {
      throw new EInvoicingError(`No provider available for channel: ${channel}`, 'PROVIDER_NOT_FOUND');
    }
    return provider.getCapabilities();
  }
  // Private methods
  /**
   * Initialize channel providers
   */
  private initializeProviders(): void {
    try {
      // PPF (Chorus Pro) provider
      const ppfProvider = new PPFProvider();
      this.providers.set('PPF', ppfProvider);
      // TODO: Add PDP providers as they become available
      // Example:
      // const pdpProvider1 = new PDPProvider('PROVIDER_NAME');
      // this.providers.set('PDP:PROVIDER_NAME', pdpProvider1);
      logger.warn('Dispatch', `🔧 Initialized ${this.providers.size} channel providers:`, 
        Array.from(this.providers.keys()).join(', '));
    } catch (error) {
      logger.error('Dispatch', 'Error initializing providers:', error);
      throw new EInvoicingError(
        `Failed to initialize channel providers: ${(error as Error).message}`,
        'PROVIDER_INIT_ERROR'
      );
    }
  }
  /**
   * Get provider for channel
   */
  private getProvider(channel: EInvoiceChannel): ChannelProvider | null {
    // Direct match first
    if (this.providers.has(channel)) {
      return this.providers.get(channel) || null;
    }
    // Handle PDP providers (pattern: PDP:PROVIDER_NAME)
    if (channel.startsWith('PDP:')) {
      // For now, return null as PDP providers are not yet implemented
      // In the future, this would dynamically load the appropriate PDP provider
      logger.warn('Dispatch', `PDP provider not yet implemented for channel: ${channel}`);
      return null;
    }
    return null;
  }
  /**
   * Validate document before submission
   */
  private async validateForSubmission(
    formattingResult: FormattingResult,
    channel: EInvoiceChannel
  ): Promise<boolean> {
    const provider = this.getProvider(channel);
    if (!provider) return false;
    const capabilities = await provider.getCapabilities();
    // Check format support
    if (!capabilities.formats.includes(formattingResult.format)) {
      throw new SubmissionError(
        `Channel ${channel} does not support format ${formattingResult.format}`,
        channel
      );
    }
    // Check file size limits
    const xmlSize = Buffer.from(formattingResult.xml_content, 'utf8').length;
    const pdfSize = formattingResult.pdf_content?.length || 0;
    const totalSize = xmlSize + pdfSize;
    if (totalSize > capabilities.maxFileSize) {
      throw new SubmissionError(
        `Document size (${Math.round(totalSize / 1024)}KB) exceeds channel limit (${Math.round(capabilities.maxFileSize / 1024)}KB)`,
        channel
      );
    }
    return true;
  }
  /**
   * Retry submission with exponential backoff
   */
  private async retrySubmission(
    operation: () => Promise<ChannelResponse>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
  ): Promise<ChannelResponse> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.warn('Dispatch', `🔄 Submission attempt ${attempt}/${maxRetries}`);
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt === maxRetries) {
          throw lastError;
        }
        // Exponential backoff: 1s, 2s, 4s, ...
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
        logger.warn('Dispatch', `⏳ Waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    throw lastError;
  }
  /**
   * Log submission metrics
   */
  private logSubmissionMetrics(
    channel: EInvoiceChannel,
    documentId: string,
    startTime: number,
    success: boolean,
    error?: Error
  ): void {
    const duration = Date.now() - startTime;
    const status = success ? 'SUCCESS' : 'FAILED';
    logger.warn('Dispatch', `📊 Submission metrics - Channel: ${channel}, Document: ${documentId}, Status: ${status}, Duration: ${duration}ms`);
    if (error) {
      logger.warn('Dispatch', `📊 Error details:`, error.message);
    }
    // In production, this would send metrics to a monitoring system
    // Example: await this.metricsService.recordSubmission(channel, documentId, duration, success);
  }
}