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

import { supabase } from '../lib/supabase';
import { AgingReport, ThirdPartyServiceResponse } from '../types/third-parties.types';

/**
 * Calculate aging report for third parties (clients/suppliers)
 * Shows outstanding amounts grouped by age (0-30, 31-60, 61-90, 91-120, >120 days)
 */
export async function getAgingReport(enterpriseId: string): Promise<ThirdPartyServiceResponse<AgingReport[]>> {
  try {
    // Fetch all third parties for this company
    const { data: thirdParties, error: tpError } = await supabase
      .from('third_parties')
      .select('id, name')
      .eq('company_id', enterpriseId);

    if (tpError) throw tpError;
    if (!thirdParties || thirdParties.length === 0) {
      return { data: [] };
    }

    // Fetch all unpaid journal entries for these third parties
    // Assuming we need to calculate based on journal entries linked to third parties
    // We'll look at accounts in class 4 (third party accounts)
    const { data: entries, error: entriesError } = await supabase
      .from('journal_entries')
      .select(`
        id,
        account_number,
        debit_amount,
        credit_amount,
        entry_date,
        third_party_id
      `)
      .eq('company_id', enterpriseId)
      .not('third_party_id', 'is', null)
      .order('entry_date', { ascending: true });

    if (entriesError) throw entriesError;

    const now = new Date();
    const agingReports: AgingReport[] = [];

    // Group entries by third_party_id
    const entriesByThirdParty = (entries || []).reduce((acc, entry) => {
      const tpId = entry.third_party_id!;
      if (!acc[tpId]) {
        acc[tpId] = [];
      }
      acc[tpId].push(entry);
      return acc;
    }, {} as Record<string, typeof entries>);

    // Calculate aging for each third party
    for (const thirdParty of thirdParties) {
      const tpEntries = entriesByThirdParty[thirdParty.id] || [];

      if (tpEntries.length === 0) {
        continue; // Skip third parties with no entries
      }

      // Calculate balance for each entry and age
      const buckets = {
        current: 0,           // 0-30 days
        bucket_30: 0,         // 31-60 days
        bucket_60: 0,         // 61-90 days
        bucket_90: 0,         // 91-120 days
        bucket_over_120: 0,   // >120 days
      };

      let totalOutstanding = 0;
      let oldestDate: Date | null = null;

      for (const entry of tpEntries) {
        // Calculate balance: debit - credit for receivables (client), credit - debit for payables (supplier)
        // For accounts starting with 41 (clients): debit increases balance, credit decreases
        // For accounts starting with 40 (suppliers): credit increases balance, debit decreases
        const isClient = entry.account_number.startsWith('41');
        const balance = isClient
          ? (Number(entry.debit_amount) || 0) - (Number(entry.credit_amount) || 0)
          : (Number(entry.credit_amount) || 0) - (Number(entry.debit_amount) || 0);

        if (balance <= 0) {
          continue; // Skip if fully paid or negative
        }

        totalOutstanding += balance;

        // Calculate age in days
        const entryDate = new Date(entry.entry_date);
        if (!oldestDate || entryDate < oldestDate) {
          oldestDate = entryDate;
        }

        const ageInDays = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

        // Distribute into buckets
        if (ageInDays <= 30) {
          buckets.current += balance;
        } else if (ageInDays <= 60) {
          buckets.bucket_30 += balance;
        } else if (ageInDays <= 90) {
          buckets.bucket_60 += balance;
        } else if (ageInDays <= 120) {
          buckets.bucket_90 += balance;
        } else {
          buckets.bucket_over_120 += balance;
        }
      }

      if (totalOutstanding > 0) {
        agingReports.push({
          third_party_id: thirdParty.id,
          third_party_name: thirdParty.name,
          aging_buckets: buckets,
          total_outstanding: totalOutstanding,
          oldest_invoice_date: oldestDate ? oldestDate.toISOString() : undefined,
        });
      }
    }

    // Sort by total outstanding descending
    agingReports.sort((a, b) => b.total_outstanding - a.total_outstanding);

    return { data: agingReports };
  } catch (error) {
    console.error('Error calculating aging report:', error instanceof Error ? error.message : String(error));
    return {
      data: [],
      error: { message: 'Failed to calculate aging report' }
    };
  }
}
