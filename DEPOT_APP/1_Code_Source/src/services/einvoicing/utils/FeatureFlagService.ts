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
 * Feature Flag Service
 * Manages e-invoicing feature flags for backward compatibility
 */

import { supabase } from '../../../lib/supabase';
import {
  EInvoiceFormat,
  EInvoiceChannel,
  EInvoicingError
} from '../../../types/einvoicing.types';

interface CompanyFeatureFlags {
  company_id: string;
  einvoicing_v1_enabled: boolean;
  formats_enabled: EInvoiceFormat[];
  channels_enabled: EInvoiceChannel[];
  inbound_processing_enabled: boolean;
  archive_enabled: boolean;
  updated_at: string;
}

export class FeatureFlagService {
  private cache: Map<string, CompanyFeatureFlags> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if e-invoicing is enabled for a company
   */
  async isEInvoicingEnabled(companyId: string): Promise<boolean> {
    try {
      console.warn(`🔍 Checking e-invoicing feature flag for company ${companyId}`);

      const flags = await this.getFeatureFlags(companyId);
      const enabled = flags.einvoicing_v1_enabled;

      console.warn(`🏁 E-invoicing ${enabled ? 'enabled' : 'disabled'} for company ${companyId}`);
      return enabled;

    } catch (error) {
      console.error('Error checking e-invoicing feature flag:', error);
      // Default to disabled on error for safety
      return false;
    }
  }

  /**
   * Check if a specific format is enabled
   */
  async isFormatEnabled(companyId: string, format: EInvoiceFormat): Promise<boolean> {
    try {
      const flags = await this.getFeatureFlags(companyId);
      return flags.einvoicing_v1_enabled && flags.formats_enabled.includes(format);
    } catch (error) {
      console.error('Error checking format feature flag:', error);
      return false;
    }
  }

  /**
   * Check if a specific channel is enabled
   */
  async isChannelEnabled(companyId: string, channel: EInvoiceChannel): Promise<boolean> {
    try {
      const flags = await this.getFeatureFlags(companyId);
      return flags.einvoicing_v1_enabled && flags.channels_enabled.includes(channel);
    } catch (error) {
      console.error('Error checking channel feature flag:', error);
      return false;
    }
  }

  /**
   * Check if inbound processing is enabled
   */
  async isInboundProcessingEnabled(companyId: string): Promise<boolean> {
    try {
      const flags = await this.getFeatureFlags(companyId);
      return flags.einvoicing_v1_enabled && flags.inbound_processing_enabled;
    } catch (error) {
      console.error('Error checking inbound processing feature flag:', error);
      return false;
    }
  }

  /**
   * Check if document archiving is enabled
   */
  async isArchiveEnabled(companyId: string): Promise<boolean> {
    try {
      const flags = await this.getFeatureFlags(companyId);
      return flags.einvoicing_v1_enabled && flags.archive_enabled;
    } catch (error) {
      console.error('Error checking archive feature flag:', error);
      return false;
    }
  }

  /**
   * Get all feature flags for a company
   */
  async getFeatureFlags(companyId: string): Promise<CompanyFeatureFlags> {
    try {
      // Check cache first
      const cached = this.getCachedFlags(companyId);
      if (cached) {
        return cached;
      }

      console.warn(`📥 Loading feature flags for company ${companyId}`);

      // Load from database
      const { data, error } = await supabase
        .from('companies')
        .select('id, einvoicing_v1_enabled')
        .eq('id', companyId)
        .single();

      if (error) {
        console.error('Error loading company feature flags:', error);
        throw new EInvoicingError(
          `Failed to load feature flags for company ${companyId}: ${error.message}`,
          'FEATURE_FLAG_LOAD_ERROR',
          { companyId }
        );
      }

      if (!data) {
        throw new EInvoicingError(
          `Company ${companyId} not found`,
          'COMPANY_NOT_FOUND',
          { companyId }
        );
      }

      // Build feature flags object
      const flags: CompanyFeatureFlags = {
        company_id: companyId,
        einvoicing_v1_enabled: data.einvoicing_v1_enabled || false,
        formats_enabled: this.getEnabledFormats(data.einvoicing_v1_enabled),
        channels_enabled: this.getEnabledChannels(data.einvoicing_v1_enabled),
        inbound_processing_enabled: data.einvoicing_v1_enabled || false,
        archive_enabled: data.einvoicing_v1_enabled || false,
        updated_at: new Date().toISOString()
      };

      // Cache the flags
      this.cacheFlags(companyId, flags);

      console.warn(`✅ Feature flags loaded for company ${companyId}:`, {
        einvoicing_enabled: flags.einvoicing_v1_enabled,
        formats: flags.formats_enabled,
        channels: flags.channels_enabled
      });

      return flags;

    } catch (error) {
      console.error('Error getting feature flags:', error);
      
      if (error instanceof EInvoicingError) {
        throw error;
      }
      
      throw new EInvoicingError(
        `Failed to get feature flags: ${(error as Error).message}`,
        'FEATURE_FLAG_ERROR',
        { companyId }
      );
    }
  }

  /**
   * Enable e-invoicing for a company
   */
  async enableEInvoicing(companyId: string): Promise<void> {
    try {
      console.warn(`🟢 Enabling e-invoicing for company ${companyId}`);

      const { error } = await supabase
        .from('companies')
        .update({ 
          einvoicing_v1_enabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', companyId);

      if (error) {
        throw new EInvoicingError(
          `Failed to enable e-invoicing: ${error.message}`,
          'FEATURE_FLAG_UPDATE_ERROR',
          { companyId }
        );
      }

      // Clear cache
      this.clearCache(companyId);

      // Log audit event
      await this.logFeatureFlagChange(companyId, 'enabled', 'einvoicing_v1');

      console.warn(`✅ E-invoicing enabled for company ${companyId}`);

    } catch (error) {
      console.error('Error enabling e-invoicing:', error);
      
      if (error instanceof EInvoicingError) {
        throw error;
      }
      
      throw new EInvoicingError(
        `Failed to enable e-invoicing: ${(error as Error).message}`,
        'FEATURE_FLAG_ENABLE_ERROR',
        { companyId }
      );
    }
  }

  /**
   * Disable e-invoicing for a company
   */
  async disableEInvoicing(companyId: string): Promise<void> {
    try {
      console.warn(`🔴 Disabling e-invoicing for company ${companyId}`);

      const { error } = await supabase
        .from('companies')
        .update({ 
          einvoicing_v1_enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', companyId);

      if (error) {
        throw new EInvoicingError(
          `Failed to disable e-invoicing: ${error.message}`,
          'FEATURE_FLAG_UPDATE_ERROR',
          { companyId }
        );
      }

      // Clear cache
      this.clearCache(companyId);

      // Log audit event
      await this.logFeatureFlagChange(companyId, 'disabled', 'einvoicing_v1');

      console.warn(`✅ E-invoicing disabled for company ${companyId}`);

    } catch (error) {
      console.error('Error disabling e-invoicing:', error);
      
      if (error instanceof EInvoicingError) {
        throw error;
      }
      
      throw new EInvoicingError(
        `Failed to disable e-invoicing: ${(error as Error).message}`,
        'FEATURE_FLAG_DISABLE_ERROR',
        { companyId }
      );
    }
  }

  /**
   * Get feature flag statistics
   */
  async getFeatureFlagStats(): Promise<{
    total_companies: number;
    enabled_companies: number;
    disabled_companies: number;
    adoption_rate: number;
  }> {
    try {
      console.warn('📊 Getting feature flag statistics');

      const { data, error } = await supabase
        .from('companies')
        .select('einvoicing_v1_enabled')
        .not('einvoicing_v1_enabled', 'is', null);

      if (error) {
        throw new EInvoicingError(
          `Failed to get feature flag statistics: ${error.message}`,
          'STATS_ERROR'
        );
      }

      const totalCompanies = data.length;
      const enabledCompanies = data.filter(c => c.einvoicing_v1_enabled).length;
      const disabledCompanies = totalCompanies - enabledCompanies;
      const adoptionRate = totalCompanies > 0 ? (enabledCompanies / totalCompanies) * 100 : 0;

      const stats = {
        total_companies: totalCompanies,
        enabled_companies: enabledCompanies,
        disabled_companies: disabledCompanies,
        adoption_rate: Math.round(adoptionRate * 100) / 100 // Round to 2 decimal places
      };

      console.warn('📊 Feature flag statistics:', stats);
      return stats;

    } catch (error) {
      console.error('Error getting feature flag statistics:', error);
      
      if (error instanceof EInvoicingError) {
        throw error;
      }
      
      throw new EInvoicingError(
        `Failed to get feature flag statistics: ${(error as Error).message}`,
        'STATS_CALCULATION_ERROR'
      );
    }
  }

  /**
   * Clear feature flag cache
   */
  clearCache(companyId?: string): void {
    if (companyId) {
      this.cache.delete(companyId);
      this.cacheExpiry.delete(companyId);
      console.warn(`🗑️ Cleared feature flag cache for company ${companyId}`);
    } else {
      this.cache.clear();
      this.cacheExpiry.clear();
      console.warn('🗑️ Cleared all feature flag cache');
    }
  }

  // Private methods

  private getCachedFlags(companyId: string): CompanyFeatureFlags | null {
    const cached = this.cache.get(companyId);
    const expiry = this.cacheExpiry.get(companyId);

    if (cached && expiry && Date.now() < expiry) {
      console.warn(`📋 Using cached feature flags for company ${companyId}`);
      return cached;
    }

    // Remove expired cache entries
    if (cached) {
      this.cache.delete(companyId);
      this.cacheExpiry.delete(companyId);
    }

    return null;
  }

  private cacheFlags(companyId: string, flags: CompanyFeatureFlags): void {
    this.cache.set(companyId, flags);
    this.cacheExpiry.set(companyId, Date.now() + this.CACHE_TTL_MS);
  }

  private getEnabledFormats(einvoicingEnabled: boolean): EInvoiceFormat[] {
    if (!einvoicingEnabled) {
      return [];
    }

    // Return all supported formats when e-invoicing is enabled
    // This can be made more granular in the future
    return ['FACTURX', 'UBL', 'CII'];
  }

  private getEnabledChannels(einvoicingEnabled: boolean): EInvoiceChannel[] {
    if (!einvoicingEnabled) {
      return [];
    }

    // Return all supported channels when e-invoicing is enabled
    // This can be made more granular in the future
    return ['PPF'];
  }

  private async logFeatureFlagChange(
    companyId: string,
    action: string,
    feature: string
  ): Promise<void> {
    try {
      await supabase.rpc('einv_log_audit', {
        p_entity_type: 'feature_flag',
        p_entity_id: feature,
        p_action: action,
        p_company_id: companyId,
        p_actor_type: 'system',
        p_meta_json: {
          feature_name: feature,
          action,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error logging feature flag change:', error);
    }
  }
}
