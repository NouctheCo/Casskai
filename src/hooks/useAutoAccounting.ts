/**
 * Hook React pour l'intégration automatique comptable
 * Utilisable dans tous les modules (Facturation, Banques, Achats)
 */

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { autoAccountingService } from '@/services/autoAccountingIntegrationService';
import type { InvoiceData, BankTransactionData, PurchaseOrderData } from '@/services/autoAccountingIntegrationService';

export function useAutoAccounting() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Génère automatiquement une écriture depuis une facture
   */
  const generateFromInvoice = async (invoice: InvoiceData) => {
    setIsGenerating(true);
    try {
      const result = await autoAccountingService.generateInvoiceJournalEntry(invoice);

      if (result.success) {
        toast({
          title: "✅ Écriture comptable créée",
          description: `L'écriture a été générée automatiquement et est en brouillon dans le module Accounting (réf: ${result.entryId?.slice(0, 8)}...)`,
        });
        return { success: true, entryId: result.entryId };
      } else {
        toast({
          title: "⚠️ Écriture non créée",
          description: result.error || "Veuillez créer l'écriture manuellement dans le module Accounting",
          variant: "destructive",
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error generating journal entry from invoice:', error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de générer l'écriture automatiquement",
        variant: "destructive",
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Génère automatiquement une écriture depuis une transaction bancaire
   */
  const generateFromBankTransaction = async (transaction: BankTransactionData) => {
    setIsGenerating(true);
    try {
      const result = await autoAccountingService.generateBankTransactionEntry(transaction);

      if (result.success) {
        toast({
          title: "✅ Écriture bancaire créée",
          description: `L'écriture a été générée automatiquement (réf: ${result.entryId?.slice(0, 8)}...)`,
        });
        return { success: true, entryId: result.entryId };
      } else {
        toast({
          title: "⚠️ Écriture non créée",
          description: result.error || "Veuillez créer l'écriture manuellement",
          variant: "destructive",
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error generating journal entry from bank transaction:', error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de générer l'écriture automatiquement",
        variant: "destructive",
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Génère automatiquement une écriture depuis un achat
   */
  const generateFromPurchase = async (purchase: PurchaseOrderData) => {
    setIsGenerating(true);
    try {
      const result = await autoAccountingService.generatePurchaseOrderEntry(purchase);

      if (result.success) {
        toast({
          title: "✅ Écriture d'achat créée",
          description: `L'écriture a été générée automatiquement (réf: ${result.entryId?.slice(0, 8)}...)`,
        });
        return { success: true, entryId: result.entryId };
      } else {
        toast({
          title: "⚠️ Écriture non créée",
          description: result.error || "Veuillez créer l'écriture manuellement",
          variant: "destructive",
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error generating journal entry from purchase:', error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de générer l'écriture automatiquement",
        variant: "destructive",
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateFromInvoice,
    generateFromBankTransaction,
    generateFromPurchase,
    isGenerating,
  };
}
