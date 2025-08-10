import {
  BankTransaction,
  AccountingEntry,
  ReconciliationRule,
  ReconciliationMatch,
  ReconciliationCondition,
  ReconciliationAction,
  OpenBankingResponse
} from '../../../types/openBanking.types';

// Moteur de réconciliation intelligent
export class ReconciliationEngine {
  private rules: ReconciliationRule[] = [];
  private isInitialized = false;

  constructor() {}

  async initialize(rules: ReconciliationRule[]): Promise<void> {
    try {
      this.rules = rules.sort((a, b) => a.priority - b.priority);
      this.isInitialized = true;
      console.log(`Reconciliation engine initialized with ${rules.length} rules`);
    } catch (error) {
      throw new Error(`Failed to initialize reconciliation engine: ${error.message}`);
    }
  }

  // Réconciliation automatique d'une transaction
  async reconcileTransaction(
    transaction: BankTransaction,
    accountingEntries: AccountingEntry[],
    autoApply: boolean = false
  ): Promise<OpenBankingResponse<ReconciliationMatch[]>> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: {
          code: 'ENGINE_NOT_INITIALIZED',
          message: 'Reconciliation engine not initialized'
        }
      };
    }

    try {
      const matches: ReconciliationMatch[] = [];
      
      // Rechercher des correspondances potentielles
      const potentialMatches = await this.findPotentialMatches(transaction, accountingEntries);
      
      // Appliquer les règles de réconciliation
      for (const rule of this.rules.filter(r => r.isActive)) {
        if (await this.evaluateRule(rule, transaction, potentialMatches)) {
          const ruleMatches = await this.applyRule(rule, transaction, potentialMatches);
          matches.push(...ruleMatches);
          
          if (rule.autoApply && autoApply) {
            await this.applyMatches(ruleMatches);
          }
        }
      }

      // Si aucune règle ne s'applique, utiliser la logique de correspondance par défaut
      if (matches.length === 0) {
        const defaultMatches = await this.findDefaultMatches(transaction, accountingEntries);
        matches.push(...defaultMatches);
      }

      // Trier par confiance décroissante
      matches.sort((a, b) => b.confidence - a.confidence);

      return {
        success: true,
        data: matches
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RECONCILIATION_ERROR',
          message: `Failed to reconcile transaction: ${error.message}`,
          details: error
        }
      };
    }
  }

  // Réconciliation en lot
  async reconcileBatch(
    transactions: BankTransaction[],
    accountingEntries: AccountingEntry[],
    autoApply: boolean = false
  ): Promise<OpenBankingResponse<{
    matches: ReconciliationMatch[];
    statistics: {
      totalTransactions: number;
      matchedTransactions: number;
      unmatchedTransactions: number;
      averageConfidence: number;
    };
  }>> {
    try {
      const allMatches: ReconciliationMatch[] = [];
      let totalConfidence = 0;
      let matchedCount = 0;

      for (const transaction of transactions) {
        const result = await this.reconcileTransaction(transaction, accountingEntries, autoApply);
        
        if (result.success && result.data && result.data.length > 0) {
          const bestMatch = result.data[0];
          allMatches.push(bestMatch);
          totalConfidence += bestMatch.confidence;
          matchedCount++;
        }
      }

      const statistics = {
        totalTransactions: transactions.length,
        matchedTransactions: matchedCount,
        unmatchedTransactions: transactions.length - matchedCount,
        averageConfidence: matchedCount > 0 ? totalConfidence / matchedCount : 0
      };

      return {
        success: true,
        data: {
          matches: allMatches,
          statistics
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BATCH_RECONCILIATION_ERROR',
          message: `Failed to reconcile batch: ${error.message}`,
          details: error
        }
      };
    }
  }

  // Trouver des correspondances potentielles
  private async findPotentialMatches(
    transaction: BankTransaction,
    accountingEntries: AccountingEntry[]
  ): Promise<AccountingEntry[]> {
    const potentialMatches: AccountingEntry[] = [];
    const transactionAmount = Math.abs(transaction.amount);
    const transactionDate = new Date(transaction.date);

    for (const entry of accountingEntries) {
      if (entry.isReconciled) continue;

      const entryAmount = Math.abs(entry.amount);
      const entryDate = new Date(entry.date);
      
      // Critères de base pour une correspondance potentielle
      const amountMatch = this.isAmountMatch(transactionAmount, entryAmount);
      const dateMatch = this.isDateMatch(transactionDate, entryDate, 7); // 7 jours de tolérance
      
      if (amountMatch && dateMatch) {
        potentialMatches.push(entry);
      }
    }

    return potentialMatches;
  }

  // Évaluer si une règle s'applique
  private async evaluateRule(
    rule: ReconciliationRule,
    transaction: BankTransaction,
    potentialMatches: AccountingEntry[]
  ): Promise<boolean> {
    for (const condition of rule.conditions) {
      if (!await this.evaluateCondition(condition, transaction)) {
        return false;
      }
    }
    return true;
  }

  // Évaluer une condition individuelle
  private async evaluateCondition(
    condition: ReconciliationCondition,
    transaction: BankTransaction
  ): Promise<boolean> {
    const fieldValue = this.getFieldValue(transaction, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return this.compareValues(fieldValue, condition.value, 'equals');
        
      case 'contains':
        return typeof fieldValue === 'string' && typeof condition.value === 'string' &&
          (condition.caseSensitive 
            ? fieldValue.includes(condition.value)
            : fieldValue.toLowerCase().includes(condition.value.toLowerCase())
          );
          
      case 'starts_with':
        return typeof fieldValue === 'string' && typeof condition.value === 'string' &&
          (condition.caseSensitive
            ? fieldValue.startsWith(condition.value)
            : fieldValue.toLowerCase().startsWith(condition.value.toLowerCase())
          );
          
      case 'ends_with':
        return typeof fieldValue === 'string' && typeof condition.value === 'string' &&
          (condition.caseSensitive
            ? fieldValue.endsWith(condition.value)
            : fieldValue.toLowerCase().endsWith(condition.value.toLowerCase())
          );
          
      case 'regex':
        if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
          const flags = condition.caseSensitive ? 'g' : 'gi';
          const regex = new RegExp(condition.value, flags);
          return regex.test(fieldValue);
        }
        return false;
        
      case 'range':
        if (Array.isArray(condition.value) && condition.value.length === 2) {
          const [min, max] = condition.value;
          return typeof fieldValue === 'number' && 
            fieldValue >= (min as number) && 
            fieldValue <= (max as number);
        }
        return false;
        
      case 'date_range':
        if (Array.isArray(condition.value) && condition.value.length === 2) {
          const [startDate, endDate] = condition.value;
          const fieldDate = new Date(fieldValue as string | Date);
          return fieldDate >= new Date(startDate as string | Date) &&
            fieldDate <= new Date(endDate as string | Date);
        }
        return false;
        
      default:
        return false;
    }
  }

  // Appliquer une règle et générer des correspondances
  private async applyRule(
    rule: ReconciliationRule,
    transaction: BankTransaction,
    potentialMatches: AccountingEntry[]
  ): Promise<ReconciliationMatch[]> {
    const matches: ReconciliationMatch[] = [];

    for (const entry of potentialMatches) {
      const match = await this.createMatch(transaction, entry, 'rule_based', rule);
      
      // Appliquer les actions de la règle
      for (const action of rule.actions) {
        await this.applyAction(action, match, transaction, entry);
      }
      
      matches.push(match);
    }

    return matches;
  }

  // Correspondances par défaut (sans règles)
  private async findDefaultMatches(
    transaction: BankTransaction,
    accountingEntries: AccountingEntry[]
  ): Promise<ReconciliationMatch[]> {
    const matches: ReconciliationMatch[] = [];
    const transactionAmount = Math.abs(transaction.amount);
    const transactionDate = new Date(transaction.date);

    for (const entry of accountingEntries) {
      if (entry.isReconciled) continue;

      const confidence = this.calculateDefaultConfidence(transaction, entry);
      
      if (confidence > 0.3) { // Seuil minimum de confiance
        const match = await this.createMatch(transaction, entry, 'automatic');
        match.confidence = confidence;
        matches.push(match);
      }
    }

    return matches;
  }

  // Calculer la confiance pour une correspondance par défaut
  private calculateDefaultConfidence(
    transaction: BankTransaction,
    entry: AccountingEntry
  ): number {
    let confidence = 0;
    
    // Correspondance de montant (50% du score)
    const amountMatch = this.getAmountMatchScore(
      Math.abs(transaction.amount),
      Math.abs(entry.amount)
    );
    confidence += amountMatch * 0.5;
    
    // Correspondance de date (30% du score)
    const dateMatch = this.getDateMatchScore(
      new Date(transaction.date),
      new Date(entry.date)
    );
    confidence += dateMatch * 0.3;
    
    // Correspondance de description (20% du score)
    const descriptionMatch = this.getDescriptionMatchScore(
      transaction.description,
      entry.description
    );
    confidence += descriptionMatch * 0.2;

    return Math.min(confidence, 1);
  }

  // Créer une correspondance
  private async createMatch(
    transaction: BankTransaction,
    entry: AccountingEntry,
    matchType: ReconciliationMatch['matchType'],
    rule?: ReconciliationRule
  ): Promise<ReconciliationMatch> {
    const discrepancy = this.calculateDiscrepancy(transaction, entry);
    
    return {
      id: crypto.randomUUID(),
      transactionId: transaction.id,
      accountingEntryId: entry.id,
      matchType,
      confidence: 0.8, // Sera recalculé selon le contexte
      ruleId: rule?.id,
      discrepancy,
      status: 'matched',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Calculer les écarts entre transaction et écriture
  private calculateDiscrepancy(
    transaction: BankTransaction,
    entry: AccountingEntry
  ): ReconciliationMatch['discrepancy'] {
    const amountDiff = Math.abs(transaction.amount) - Math.abs(entry.amount);
    const dateDiff = Math.abs(
      new Date(transaction.date).getTime() - new Date(entry.date).getTime()
    ) / (1000 * 60 * 60 * 24); // en jours

    const discrepancy: ReconciliationMatch['discrepancy'] = {};

    if (Math.abs(amountDiff) > 0.01) {
      discrepancy.amount = amountDiff;
    }

    if (dateDiff > 1) {
      discrepancy.date = Math.round(dateDiff);
    }

    if (transaction.description.toLowerCase() !== entry.description.toLowerCase()) {
      discrepancy.description = `Transaction: "${transaction.description}", Entry: "${entry.description}"`;
    }

    return Object.keys(discrepancy).length > 0 ? discrepancy : undefined;
  }

  // Appliquer une action de réconciliation
  private async applyAction(
    action: ReconciliationAction,
    match: ReconciliationMatch,
    transaction: BankTransaction,
    entry: AccountingEntry
  ): Promise<void> {
    switch (action.type) {
      case 'match':
        // Marquer comme réconcilié
        match.status = 'matched';
        break;
        
      case 'categorize':
        // Appliquer une catégorie
        if (action.parameters.category) {
          // En production, mettre à jour la transaction
        }
        break;
        
      case 'split':
        // Diviser la transaction
        match.status = 'partial';
        break;
        
      case 'merge':
        // Fusionner plusieurs correspondances
        break;
        
      case 'flag':
        // Marquer pour révision
        match.status = 'disputed';
        break;
        
      case 'create_entry':
        // Créer une nouvelle écriture comptable
        break;
    }
  }

  // Appliquer les correspondances (marquer comme réconciliées)
  private async applyMatches(matches: ReconciliationMatch[]): Promise<void> {
    for (const match of matches) {
      if (match.status === 'matched' && match.confidence > 0.8) {
        // En production, mettre à jour la base de données
        console.log(`Auto-applied match: ${match.id}`);
      }
    }
  }

  // Méthodes utilitaires
  private getFieldValue(transaction: BankTransaction, field: ReconciliationCondition['field']): any {
    switch (field) {
      case 'amount':
        return transaction.amount;
      case 'date':
        return transaction.date;
      case 'description':
        return transaction.description;
      case 'counterparty':
        return transaction.counterparty;
      case 'reference':
        return transaction.reference;
      case 'category':
        return transaction.category;
      default:
        return null;
    }
  }

  private compareValues(value1: any, value2: any, operator: string): boolean {
    if (operator === 'equals') {
      if (typeof value1 === 'number' && typeof value2 === 'number') {
        return Math.abs(value1 - value2) < 0.01; // Tolérance pour les montants
      }
      return value1 === value2;
    }
    return false;
  }

  private isAmountMatch(amount1: number, amount2: number, tolerance: number = 0.01): boolean {
    return Math.abs(amount1 - amount2) <= tolerance;
  }

  private isDateMatch(date1: Date, date2: Date, toleranceDays: number = 0): boolean {
    const diffMs = Math.abs(date1.getTime() - date2.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= toleranceDays;
  }

  private getAmountMatchScore(amount1: number, amount2: number): number {
    const diff = Math.abs(amount1 - amount2);
    const maxAmount = Math.max(amount1, amount2);
    if (maxAmount === 0) return diff === 0 ? 1 : 0;
    
    const percentDiff = diff / maxAmount;
    return Math.max(0, 1 - percentDiff * 10); // Pénalité de 10x la différence en pourcentage
  }

  private getDateMatchScore(date1: Date, date2: Date): number {
    const diffDays = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffDays === 0) return 1;
    if (diffDays <= 1) return 0.9;
    if (diffDays <= 3) return 0.7;
    if (diffDays <= 7) return 0.5;
    if (diffDays <= 30) return 0.2;
    
    return 0;
  }

  private getDescriptionMatchScore(desc1: string, desc2: string): number {
    if (!desc1 || !desc2) return 0;
    
    const cleanDesc1 = desc1.toLowerCase().trim();
    const cleanDesc2 = desc2.toLowerCase().trim();
    
    if (cleanDesc1 === cleanDesc2) return 1;
    
    // Similarité Jaccard pour les mots
    const words1 = new Set(cleanDesc1.split(/\s+/));
    const words2 = new Set(cleanDesc2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  // Gestion des règles
  async addRule(rule: ReconciliationRule): Promise<void> {
    this.rules.push(rule);
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  async updateRule(ruleId: string, updates: Partial<ReconciliationRule>): Promise<void> {
    const ruleIndex = this.rules.findIndex(r => r.id === ruleId);
    if (ruleIndex !== -1) {
      this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates };
      this.rules.sort((a, b) => a.priority - b.priority);
    }
  }

  async removeRule(ruleId: string): Promise<void> {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  getRules(): ReconciliationRule[] {
    return [...this.rules];
  }

  // Statistiques
  async getStatistics(matches: ReconciliationMatch[]): Promise<{
    totalMatches: number;
    automaticMatches: number;
    manualMatches: number;
    ruleBasedMatches: number;
    averageConfidence: number;
    statusDistribution: Record<string, number>;
  }> {
    const stats = {
      totalMatches: matches.length,
      automaticMatches: matches.filter(m => m.matchType === 'automatic').length,
      manualMatches: matches.filter(m => m.matchType === 'manual').length,
      ruleBasedMatches: matches.filter(m => m.matchType === 'rule_based').length,
      averageConfidence: matches.length > 0 
        ? matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length 
        : 0,
      statusDistribution: {}
    };

    // Distribution des statuts
    for (const match of matches) {
      stats.statusDistribution[match.status] = 
        (stats.statusDistribution[match.status] || 0) + 1;
    }

    return stats;
  }

  get initialized(): boolean {
    return this.isInitialized;
  }

  dispose(): void {
    this.rules = [];
    this.isInitialized = false;
  }
}

// Service de réconciliation avec persistance
export class ReconciliationService {
  private engine: ReconciliationEngine;
  private isInitialized = false;

  constructor() {
    this.engine = new ReconciliationEngine();
  }

  async initialize(rules: ReconciliationRule[]): Promise<void> {
    await this.engine.initialize(rules);
    this.isInitialized = true;
  }

  // Interface publique pour la réconciliation
  async reconcileTransaction(
    transaction: BankTransaction,
    accountingEntries: AccountingEntry[]
  ): Promise<OpenBankingResponse<ReconciliationMatch[]>> {
    return await this.engine.reconcileTransaction(transaction, accountingEntries);
  }

  async reconcileBatch(
    transactions: BankTransaction[],
    accountingEntries: AccountingEntry[]
  ): Promise<OpenBankingResponse<any>> {
    return await this.engine.reconcileBatch(transactions, accountingEntries);
  }

  // Gestion des règles avec persistance
  async createRule(rule: Omit<ReconciliationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReconciliationRule> {
    const newRule: ReconciliationRule = {
      ...rule,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.engine.addRule(newRule);
    
    // En production, sauvegarder en base de données
    return newRule;
  }

  async updateRule(ruleId: string, updates: Partial<ReconciliationRule>): Promise<void> {
    const updatedRule = { ...updates, updatedAt: new Date() };
    await this.engine.updateRule(ruleId, updatedRule);
    
    // En production, mettre à jour en base de données
  }

  async deleteRule(ruleId: string): Promise<void> {
    await this.engine.removeRule(ruleId);
    
    // En production, supprimer de la base de données
  }

  async getRules(): Promise<ReconciliationRule[]> {
    return this.engine.getRules();
  }

  get initialized(): boolean {
    return this.isInitialized;
  }

  dispose(): void {
    this.engine.dispose();
    this.isInitialized = false;
  }
}