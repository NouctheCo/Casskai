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

import { Purchase, PurchaseFormData, PurchaseFilters, PurchaseStats, Supplier } from '../types/purchase.types';
import * as PurchaseImpl from './purchasesServiceImplementations';

export const purchasesService = {
  // Get all purchases with filters
  async getPurchases(companyId: string, filters: PurchaseFilters = {}): Promise<{ data: Purchase[]; error?: any }> {
    return PurchaseImpl.getPurchases(companyId, filters);
  },

  // Get purchase by ID
  async getPurchaseById(id: string): Promise<{ data: Purchase | null; error?: any }> {
    return PurchaseImpl.getPurchaseById(id);
  },

  // Create new purchase
  async createPurchase(companyId: string, purchaseData: PurchaseFormData): Promise<{ data: Purchase | null; error?: any }> {
    return PurchaseImpl.createPurchase(companyId, purchaseData);
  },

  // Update purchase
  async updatePurchase(id: string, purchaseData: Partial<PurchaseFormData>): Promise<{ data: Purchase | null; error?: any }> {
    return PurchaseImpl.updatePurchase(id, purchaseData);
  },

  // Delete purchase
  async deletePurchase(id: string): Promise<{ data: boolean; error?: any }> {
    return PurchaseImpl.deletePurchase(id);
  },

  // Mark purchase as paid
  async markAsPaid(id: string, paymentDate?: string): Promise<{ data: Purchase | null; error?: any }> {
    return PurchaseImpl.markAsPaid(id, paymentDate);
  },

  // Get purchase statistics
  async getPurchaseStats(companyId: string): Promise<{ data: PurchaseStats; error?: any }> {
    return PurchaseImpl.getPurchaseStats(companyId);
  },

  // Get suppliers
  async getSuppliers(companyId: string): Promise<{ data: Supplier[]; error?: any }> {
    return PurchaseImpl.getSuppliers(companyId);
  },

  // Export purchases to CSV
  async exportToCsv(companyId: string, filters: PurchaseFilters = {}): Promise<{ data: string; error?: any }> {
    return PurchaseImpl.exportToCsv(companyId, filters);
  }
};
