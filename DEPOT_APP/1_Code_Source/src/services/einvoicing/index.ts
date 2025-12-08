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
 * E-invoicing Service Module
 * French electronic invoicing (EN 16931, Factur-X, UBL, CII)
 * 
 * Main entry point for all e-invoicing functionality
 */

export { EInvoicingService } from './EInvoicingService';

// Core services
export { FormattingService } from './core/FormattingService';
export { ValidationService } from './core/ValidationService';
export { DispatchService } from './core/DispatchService';
export { ArchiveService } from './core/ArchiveService';

// Adapters
export { InvoiceToEN16931Mapper } from './adapters/InvoiceToEN16931Mapper';

// Channel providers
export { ChannelProvider } from './adapters/ChannelProviders/base/ChannelProvider';
export { PPFProvider } from './adapters/ChannelProviders/PPFProvider';

// Inbound processing
export { InboundService } from './inbound/InboundService';

// Utilities
export { FeatureFlagService } from './utils/FeatureFlagService';

// Re-export types
export * from '../../types/einvoicing.types';
