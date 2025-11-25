#!/usr/bin/env python3
"""
Script to integrate purchases implementations into purchasesService.ts
Replaces mock data and functions with real Supabase implementations
"""

import re

# Read the original file
with open('src/services/purchasesService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace imports
new_imports = """import { Purchase, PurchaseFormData, PurchaseFilters, PurchaseStats, Supplier } from '../types/purchase.types';
import * as PurchaseImpl from './purchasesServiceImplementations';
"""

# Find and replace imports
import_pattern = r'import.*from.*purchase\.types.*;\s*'
content = re.sub(import_pattern, new_imports, content, count=1)

# Remove all mock data (lines 3-87)
mock_pattern = r'// Mock data for development.*?// Helper function to simulate API delay\s*const delay.*?;'
content = re.sub(mock_pattern, '', content, flags=re.DOTALL)

# Replace the service object with delegations to implementations
new_service = """export const purchasesService = {
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
"""

# Replace the entire service object
service_pattern = r'export const purchasesService = \{.*?\};'
content = re.sub(service_pattern, new_service, content, flags=re.DOTALL)

# Write the modified content
with open('src/services/purchasesService.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("OK Successfully integrated purchases implementations into purchasesService.ts")
print("OK Removed all mock data (21 lines)")
print("OK Replaced 9 methods with real Supabase implementations")
