/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Service de valorisation des stocks - Méthodes avancées
 *
 * Implémente 3 méthodes de valorisation conformes normes comptables internationales:
 * - CMP (Coût Moyen Pondéré) - Weighted Average Cost
 * - FIFO (First In First Out) - Premier Entré Premier Sorti
 * - LIFO (Last In First Out) - Dernier Entré Premier Sorti
 *
 * @priority P2-2 - Méthodes valorisation avancées
 * @compliance IAS 2, PCG, SYSCOHADA
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Méthodes de valorisation des stocks supportées
 *
 * - **CMP**: Coût Moyen Pondéré (recommandé par défaut)
 *   - Simple, conforme toutes normes (PCG, SYSCOHADA, IFRS, SCF)
 *   - Lisse les variations de prix
 *
 * - **FIFO**: First In First Out
 *   - Reflète flux physique réel (stock frais valorisé à prix récents)
 *   - Préféré pour produits périssables
 *   - Conforme IFRS/IAS 2, PCG, SYSCOHADA
 *
 * - **LIFO**: Last In First Out
 *   - Valorise stock ancien à prix anciens
 *   - ⚠️ INTERDIT en IFRS (IAS 2), autorisé PCG/SYSCOHADA avec restrictions
 *   - Rarement utilisé en pratique (désavantage fiscal)
 */
export type ValuationMethod = 'CMP' | 'FIFO' | 'LIFO';

/**
 * Mouvement de stock avec prix unitaire et date
 */
export interface StockMovement {
  id: string;
  movement_date: string;
  type: 'entry' | 'exit' | 'adjustment' | 'transfer';
  quantity: number;
  unit_price: number;
  total_value: number;
  product_id: string;
  warehouse_id: string;
  company_id: string;
}

/**
 * Lot de stock pour calculs FIFO/LIFO
 * Représente une "couche" de stock acquise à un prix donné
 */
export interface StockBatch {
  date: string;
  quantity: number;
  unit_price: number;
  remaining_quantity: number; // Quantité restante dans ce lot
}

/**
 * Résultat de valorisation d'une sortie de stock
 */
export interface ValuationResult {
  quantity: number;
  total_value: number;
  unit_cost: number; // Coût unitaire moyen de la sortie
  method: ValuationMethod;
  details?: {
    batches_consumed?: StockBatch[]; // Lots consommés (FIFO/LIFO)
    weighted_average?: number; // CMP calculé
  };
}

/**
 * État du stock pour un produit/entrepôt
 */
export interface StockState {
  product_id: string;
  warehouse_id: string;
  current_quantity: number;
  current_value: number;
  unit_cost: number;
  batches: StockBatch[]; // Historique des lots (pour FIFO/LIFO)
  last_updated: string;
}

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

export class InventoryValuationService {

  // ==========================================================================
  // MÉTHODE 1: CMP (COÛT MOYEN PONDÉRÉ)
  // ==========================================================================

  /**
   * Calcule le coût moyen pondéré (Weighted Average Cost)
   *
   * Formule: CMP = (Valeur stock initial + Valeur entrées) / (Qté initiale + Qté entrées)
   *
   * Mise à jour à chaque entrée:
   * - Stock N-1: 100 unités @ 10€ = 1000€
   * - Entrée N: 50 unités @ 12€ = 600€
   * - Nouveau CMP: (1000 + 600) / (100 + 50) = 10.67€
   *
   * @param stockState État actuel du stock
   * @param movement Mouvement à valoriser
   * @returns Résultat de valorisation avec CMP mis à jour
   */
  static async calculateWeightedAverage(
    stockState: StockState,
    movement: StockMovement
  ): Promise<ValuationResult> {
    try {
      if (movement.type === 'entry') {
        // ENTRÉE: Mise à jour du CMP
        const oldValue = stockState.current_quantity * stockState.unit_cost;
        const newValue = movement.quantity * movement.unit_price;
        const totalQuantity = stockState.current_quantity + movement.quantity;
        const totalValue = oldValue + newValue;

        const newCMP = totalQuantity > 0 ? totalValue / totalQuantity : 0;

        return {
          quantity: movement.quantity,
          total_value: newValue,
          unit_cost: newCMP,
          method: 'CMP',
          details: {
            weighted_average: newCMP
          }
        };
      } else {
        // SORTIE: Valoriser à CMP actuel
        const valuationCost = stockState.unit_cost;
        const totalValue = movement.quantity * valuationCost;

        return {
          quantity: movement.quantity,
          total_value: totalValue,
          unit_cost: valuationCost,
          method: 'CMP',
          details: {
            weighted_average: stockState.unit_cost
          }
        };
      }
    } catch (error) {
      logger.error('InventoryValuation', 'Erreur calcul CMP:', error);
      throw new Error('Impossible de calculer le coût moyen pondéré');
    }
  }

  // ==========================================================================
  // MÉTHODE 2: FIFO (FIRST IN FIRST OUT)
  // ==========================================================================

  /**
   * Valorise une sortie selon méthode FIFO
   *
   * Principe: Les premières unités entrées sont les premières sorties
   *
   * Exemple:
   * - Lot 1: 100 unités @ 10€ (01/01)
   * - Lot 2: 50 unités @ 12€ (15/01)
   * - Sortie: 120 unités (20/01)
   *
   * Valorisation:
   * - 100 unités du Lot 1 @ 10€ = 1000€
   * - 20 unités du Lot 2 @ 12€ = 240€
   * - Total: 1240€, CMP sortie = 10.33€
   *
   * @param stockState État actuel (avec historique lots)
   * @param exitQuantity Quantité à sortir
   * @returns Résultat valorisation FIFO
   */
  static async calculateFIFO(
    stockState: StockState,
    exitQuantity: number
  ): Promise<ValuationResult> {
    try {
      if (exitQuantity <= 0) {
        throw new Error('Quantité de sortie doit être positive');
      }

      if (exitQuantity > stockState.current_quantity) {
        throw new Error('Stock insuffisant pour cette sortie');
      }

      // Trier les lots par date croissante (plus anciens en premier)
      const sortedBatches = [...stockState.batches].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      let remainingToExit = exitQuantity;
      let totalValue = 0;
      const consumedBatches: StockBatch[] = [];

      // Consommer les lots dans l'ordre FIFO
      for (const batch of sortedBatches) {
        if (remainingToExit <= 0) break;

        const qtyFromThisBatch = Math.min(remainingToExit, batch.remaining_quantity);
        const valueFromThisBatch = qtyFromThisBatch * batch.unit_price;

        totalValue += valueFromThisBatch;
        remainingToExit -= qtyFromThisBatch;

        consumedBatches.push({
          ...batch,
          quantity: qtyFromThisBatch,
          remaining_quantity: batch.remaining_quantity - qtyFromThisBatch
        });
      }

      if (remainingToExit > 0) {
        throw new Error('Erreur calcul FIFO: lots insuffisants pour couvrir sortie');
      }

      const avgUnitCost = totalValue / exitQuantity;

      return {
        quantity: exitQuantity,
        total_value: totalValue,
        unit_cost: avgUnitCost,
        method: 'FIFO',
        details: {
          batches_consumed: consumedBatches
        }
      };
    } catch (error) {
      logger.error('InventoryValuation', 'Erreur calcul FIFO:', error);
      throw error;
    }
  }

  // ==========================================================================
  // MÉTHODE 3: LIFO (LAST IN FIRST OUT)
  // ==========================================================================

  /**
   * Valorise une sortie selon méthode LIFO
   *
   * Principe: Les dernières unités entrées sont les premières sorties
   *
   * ⚠️ ATTENTION: LIFO est INTERDIT en IFRS (IAS 2)
   * - Autorisé en PCG et SYSCOHADA mais peu utilisé
   * - Désavantage fiscal (valorise stock ancien = prix bas = profit élevé)
   *
   * Exemple:
   * - Lot 1: 100 unités @ 10€ (01/01)
   * - Lot 2: 50 unités @ 12€ (15/01)
   * - Sortie: 120 unités (20/01)
   *
   * Valorisation LIFO:
   * - 50 unités du Lot 2 @ 12€ = 600€
   * - 70 unités du Lot 1 @ 10€ = 700€
   * - Total: 1300€, CMP sortie = 10.83€
   *
   * @param stockState État actuel (avec historique lots)
   * @param exitQuantity Quantité à sortir
   * @returns Résultat valorisation LIFO
   */
  static async calculateLIFO(
    stockState: StockState,
    exitQuantity: number
  ): Promise<ValuationResult> {
    try {
      if (exitQuantity <= 0) {
        throw new Error('Quantité de sortie doit être positive');
      }

      if (exitQuantity > stockState.current_quantity) {
        throw new Error('Stock insuffisant pour cette sortie');
      }

      // ⚠️ Avertissement IFRS
      logger.warn('InventoryValuation', 'LIFO utilisé: méthode INTERDITE en IFRS (IAS 2)');

      // Trier les lots par date décroissante (plus récents en premier)
      const sortedBatches = [...stockState.batches].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      let remainingToExit = exitQuantity;
      let totalValue = 0;
      const consumedBatches: StockBatch[] = [];

      // Consommer les lots dans l'ordre LIFO (inverse FIFO)
      for (const batch of sortedBatches) {
        if (remainingToExit <= 0) break;

        const qtyFromThisBatch = Math.min(remainingToExit, batch.remaining_quantity);
        const valueFromThisBatch = qtyFromThisBatch * batch.unit_price;

        totalValue += valueFromThisBatch;
        remainingToExit -= qtyFromThisBatch;

        consumedBatches.push({
          ...batch,
          quantity: qtyFromThisBatch,
          remaining_quantity: batch.remaining_quantity - qtyFromThisBatch
        });
      }

      if (remainingToExit > 0) {
        throw new Error('Erreur calcul LIFO: lots insuffisants pour couvrir sortie');
      }

      const avgUnitCost = totalValue / exitQuantity;

      return {
        quantity: exitQuantity,
        total_value: totalValue,
        unit_cost: avgUnitCost,
        method: 'LIFO',
        details: {
          batches_consumed: consumedBatches
        }
      };
    } catch (error) {
      logger.error('InventoryValuation', 'Erreur calcul LIFO:', error);
      throw error;
    }
  }

  // ==========================================================================
  // MÉTHODE GÉNÉRIQUE: SÉLECTION AUTOMATIQUE
  // ==========================================================================

  /**
   * Valorise un mouvement de stock selon la méthode configurée
   *
   * @param productId ID du produit
   * @param warehouseId ID de l'entrepôt
   * @param companyId ID de l'entreprise
   * @param movement Mouvement à valoriser
   * @param method Méthode de valorisation (défaut: CMP)
   * @returns Résultat de valorisation
   */
  static async valuateMovement(
    productId: string,
    warehouseId: string,
    companyId: string,
    movement: StockMovement,
    method: ValuationMethod = 'CMP'
  ): Promise<ValuationResult> {
    try {
      // Récupérer l'état actuel du stock
      const stockState = await this.getStockState(productId, warehouseId, companyId, method);

      // Sélectionner la méthode de valorisation
      switch (method) {
        case 'CMP':
          return await this.calculateWeightedAverage(stockState, movement);

        case 'FIFO':
          if (movement.type === 'entry') {
            // Pour FIFO, entrée = ajout d'un nouveau lot
            return await this.addBatchFIFO(stockState, movement);
          } else {
            return await this.calculateFIFO(stockState, movement.quantity);
          }

        case 'LIFO':
          if (movement.type === 'entry') {
            // Pour LIFO, entrée = ajout d'un nouveau lot
            return await this.addBatchLIFO(stockState, movement);
          } else {
            return await this.calculateLIFO(stockState, movement.quantity);
          }

        default:
          throw new Error(`Méthode de valorisation inconnue: ${method}`);
      }
    } catch (error) {
      logger.error('InventoryValuation', 'Erreur valorisation mouvement:', error);
      throw error;
    }
  }

  // ==========================================================================
  // HELPERS: GESTION ÉTAT DU STOCK
  // ==========================================================================

  /**
   * Récupère l'état actuel du stock pour un produit/entrepôt
   */
  private static async getStockState(
    productId: string,
    warehouseId: string,
    companyId: string,
    method: ValuationMethod
  ): Promise<StockState> {
    try {
      // Récupérer l'item d'inventaire
      const { data: item, error: itemError } = await supabase
        .from('inventory_items')
        .select('id, current_stock, unit_cost, avg_cost, total_value')
        .eq('product_id', productId)
        .eq('warehouse_id', warehouseId)
        .eq('company_id', companyId)
        .maybeSingle();

      if (itemError) {
        throw itemError;
      }

      if (!item) {
        // Produit non encore en stock, créer état initial
        return {
          product_id: productId,
          warehouse_id: warehouseId,
          current_quantity: 0,
          current_value: 0,
          unit_cost: 0,
          batches: [],
          last_updated: new Date().toISOString()
        };
      }

      // Pour FIFO/LIFO, récupérer l'historique des lots
      let batches: StockBatch[] = [];
      if (method === 'FIFO' || method === 'LIFO') {
        batches = await this.loadBatchHistory(item.id, companyId);
      }

      return {
        product_id: productId,
        warehouse_id: warehouseId,
        current_quantity: item.current_stock || 0,
        current_value: item.total_value || 0,
        unit_cost: item.unit_cost || item.avg_cost || 0,
        batches,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('InventoryValuation', 'Erreur récupération état stock:', error);
      throw new Error('Impossible de récupérer l\'état du stock');
    }
  }

  /**
   * Charge l'historique des lots pour FIFO/LIFO
   *
   * Utilise la table stock_movements pour reconstituer les lots actifs
   */
  private static async loadBatchHistory(
    itemId: string,
    companyId: string
  ): Promise<StockBatch[]> {
    try {
      // Récupérer tous les mouvements d'entrée (création des lots)
      const { data: movements, error } = await supabase
        .from('stock_movements')
        .select('movement_date, quantity, unit_price, type')
        .eq('item_id', itemId)
        .eq('company_id', companyId)
        .eq('type', 'entry')
        .order('movement_date', { ascending: true });

      if (error) {
        throw error;
      }

      if (!movements || movements.length === 0) {
        return [];
      }

      // Convertir mouvements en lots (simplification: considère chaque entrée comme un lot)
      const batches: StockBatch[] = movements.map(m => ({
        date: m.movement_date,
        quantity: m.quantity,
        unit_price: m.unit_price,
        remaining_quantity: m.quantity // À ajuster avec sorties ultérieures
      }));

      // TODO: Ajuster remaining_quantity en fonction des sorties historiques
      // Pour MVP, on part du principe que remaining_quantity = quantité stock actuel réparti proportionnellement

      return batches;
    } catch (error) {
      logger.error('InventoryValuation', 'Erreur chargement historique lots:', error);
      return [];
    }
  }

  /**
   * Ajoute un nouveau lot pour méthode FIFO (entrée)
   */
  private static async addBatchFIFO(
    stockState: StockState,
    movement: StockMovement
  ): Promise<ValuationResult> {
    // Pour FIFO, entrée = simple ajout d'un nouveau lot
    const newBatch: StockBatch = {
      date: movement.movement_date,
      quantity: movement.quantity,
      unit_price: movement.unit_price,
      remaining_quantity: movement.quantity
    };

    stockState.batches.push(newBatch);

    return {
      quantity: movement.quantity,
      total_value: movement.total_value,
      unit_cost: movement.unit_price,
      method: 'FIFO',
      details: {
        batches_consumed: [newBatch]
      }
    };
  }

  /**
   * Ajoute un nouveau lot pour méthode LIFO (entrée)
   */
  private static async addBatchLIFO(
    stockState: StockState,
    movement: StockMovement
  ): Promise<ValuationResult> {
    // Pour LIFO, entrée = simple ajout d'un nouveau lot (identique FIFO)
    const newBatch: StockBatch = {
      date: movement.movement_date,
      quantity: movement.quantity,
      unit_price: movement.unit_price,
      remaining_quantity: movement.quantity
    };

    stockState.batches.push(newBatch);

    return {
      quantity: movement.quantity,
      total_value: movement.total_value,
      unit_cost: movement.unit_price,
      method: 'LIFO',
      details: {
        batches_consumed: [newBatch]
      }
    };
  }

  // ==========================================================================
  // HELPERS: MÉTHODE DE VALORISATION PAR ENTREPRISE
  // ==========================================================================

  /**
   * Récupère la méthode de valorisation configurée pour une entreprise
   *
   * @param companyId ID de l'entreprise
   * @returns Méthode de valorisation (défaut: CMP)
   */
  static async getCompanyValuationMethod(companyId: string): Promise<ValuationMethod> {
    try {
      // Rechercher dans company_settings ou companies.inventory_valuation_method
      // Pour MVP, retourner CMP par défaut
      // TODO: Ajouter colonne dans DB si configuration nécessaire

      // Tentative de lecture depuis un champ hypothétique
      const { data, error } = await supabase
        .from('companies')
        .select('inventory_valuation_method')
        .eq('id', companyId)
        .maybeSingle();

      if (error || !data || !data.inventory_valuation_method) {
        logger.info('InventoryValuation', `Méthode par défaut (CMP) utilisée pour company ${companyId}`);
        return 'CMP';
      }

      const method = data.inventory_valuation_method.toUpperCase() as ValuationMethod;
      if (['CMP', 'FIFO', 'LIFO'].includes(method)) {
        return method;
      }

      return 'CMP';
    } catch (error) {
      logger.warn('InventoryValuation', 'Erreur récupération méthode valorisation, défaut CMP:', error);
      return 'CMP';
    }
  }

  /**
   * Définit la méthode de valorisation pour une entreprise
   *
   * ⚠️ Changement de méthode = impact comptable majeur
   * Nécessite revalorisation complète du stock et justification audit
   */
  static async setCompanyValuationMethod(
    companyId: string,
    method: ValuationMethod
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!['CMP', 'FIFO', 'LIFO'].includes(method)) {
        return {
          success: false,
          message: `Méthode invalide: ${method}. Valeurs autorisées: CMP, FIFO, LIFO`
        };
      }

      // Avertissement LIFO + IFRS
      if (method === 'LIFO') {
        const { data: company } = await supabase
          .from('companies')
          .select('accounting_standard')
          .eq('id', companyId)
          .maybeSingle();

        if (company?.accounting_standard === 'IFRS') {
          return {
            success: false,
            message: 'LIFO est INTERDIT en IFRS (IAS 2). Utilisez CMP ou FIFO.'
          };
        }

        logger.warn('InventoryValuation', `LIFO activé pour company ${companyId} - Non recommandé`);
      }

      // TODO: Mettre à jour DB quand colonne inventory_valuation_method existe
      // const { error } = await supabase
      //   .from('companies')
      //   .update({ inventory_valuation_method: method })
      //   .eq('id', companyId);

      return {
        success: true,
        message: `Méthode de valorisation ${method} configurée (fonctionnalité en attente migration DB)`
      };
    } catch (error) {
      logger.error('InventoryValuation', 'Erreur configuration méthode valorisation:', error);
      return {
        success: false,
        message: 'Erreur lors de la configuration de la méthode de valorisation'
      };
    }
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const inventoryValuationService = InventoryValuationService;
