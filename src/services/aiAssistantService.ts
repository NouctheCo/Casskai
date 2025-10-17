import OpenAI from 'openai';
import { logger } from '@/utils/logger';
import type {
  AIAssistantQuery,
  TaxOptimization,
  SmartAlert,
  Transaction,
  ServiceResponse,
  AIInsight,
  AIAssistantMessage,
  AnomalyDetection
} from '@/types/ai-types';

// Type definitions for missing types
type ReportNarrative = any;
type AIServiceResponse<T> = ServiceResponse<T>;
type AIConfiguration = {
  assistant: {
    enabled: boolean;
    model: string;
    maxTokens: number;
    temperature: number;
    contextWindow: number;
  };
};

type AIAssistantContext = {
  transactions?: Transaction[];
  currentBalance?: number;
  period?: { start: Date; end: Date };
};

type NarrativeMetric = {
  name: string;
  value: number;
  previousValue: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  interpretation: string;
};

type AlertAction = {
  label: string;
  action: string;
  params?: Record<string, unknown>;
  style?: 'primary' | 'secondary' | 'danger';
};

type FinancialMetrics = {
  income: number;
  expenses: number;
  balance: number;
  profitMargin?: number;
  liquidityRatio?: number;
  debtRatio?: number;
  growthRate?: number;
};

// Service d'assistant IA pour les questions comptables et fiscales
class AIAssistantService {
  private openai: OpenAI | null = null;
  private config: AIConfiguration['assistant'] = {
    enabled: false,
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7,
    contextWindow: 10
  };
  
  private conversationHistory: AIAssistantQuery[] = [];
  private isInitialized = false;

  // Initialisation du service
  async initialize(apiKey?: string, config?: AIConfiguration['assistant']): Promise<void> {
    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }

      if (apiKey && this.config.enabled) {
        this.openai = new OpenAI({
          apiKey,
          dangerouslyAllowBrowser: true // Pour usage côté client uniquement en démo
        });
        
        logger.info('AI Assistant Service initialized with OpenAI API')
      } else {
        logger.info('AI Assistant Service initialized in mock mode')
      }

      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize AI Assistant Service:', error);
      this.isInitialized = true; // Continue en mode mock
    }
  }

  // CHAT ASSISTANT POUR QUESTIONS COMPTABLES
  async askQuestion(
    query: string, 
    context?: AIAssistantContext
  ): Promise<AIServiceResponse<AIAssistantQuery>> {
    try {
      const startTime = Date.now();
      
      // Détermine le type de question
      const queryType = this.classifyQuery(query);
      
      let response: string;
      let confidence: number;
      let sources: string[] = [];
      let suggestions: string[] = [];

      if (this.openai && this.config.enabled) {
        // Utilise OpenAI API
        const result = await this.queryOpenAI(query, queryType, context);
        response = result.response;
        confidence = result.confidence;
        sources = result.sources;
        suggestions = result.suggestions;
      } else {
        // Mode mock avec réponses prédéfinies
        const mockResult = this.generateMockResponse(query, queryType, context);
        response = mockResult.response;
        confidence = mockResult.confidence;
        sources = mockResult.sources;
        suggestions = mockResult.suggestions;
      }

      const assistantQuery: AIAssistantQuery = {
        id: crypto.randomUUID(),
        query,
        response,
        timestamp: new Date(),
        type: queryType,
        confidence,
        sources,
        suggestions
      };

      // Ajoute à l'historique
      this.conversationHistory.push(assistantQuery);
      
      // Limite la taille de l'historique
      if (this.conversationHistory.length > this.config.contextWindow) {
        this.conversationHistory = this.conversationHistory.slice(-this.config.contextWindow);
      }

      return {
        success: true,
        data: assistantQuery,
        processingTime: Date.now() - startTime,
        modelUsed: this.openai ? this.config.model : 'mock_assistant'
      };

    } catch (error) {
      logger.error('Error processing AI assistant query:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Classification du type de question
  private classifyQuery(query: string): 'accounting' | 'tax' | 'analysis' | 'general' {
    const lowerQuery = query.toLowerCase();
    
    // Mots-clés comptables
    const accountingKeywords = ['bilan', 'compte', 'écriture', 'journal', 'grand livre', 'amortissement', 'provision'];
    if (accountingKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return 'accounting';
    }
    
    // Mots-clés fiscaux
    const taxKeywords = ['tva', 'impôt', 'fiscal', 'déduction', 'crédit', 'déclaration'];
    if (taxKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return 'tax';
    }
    
    // Mots-clés d'analyse
    const analysisKeywords = ['analyse', 'tendance', 'performance', 'ratio', 'évolution', 'prévision'];
    if (analysisKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return 'analysis';
    }
    
    return 'general';
  }

  // Requête vers OpenAI API
  private async queryOpenAI(
    query: string, 
    type: string, 
    context?: AIAssistantContext
  ): Promise<{response: string; confidence: number; sources: string[]; suggestions: string[]}> {
    try {
      // Construction du prompt avec contexte
      const systemPrompt = this.buildSystemPrompt(type, context);
      const userPrompt = this.buildUserPrompt(query, context);

      const completion = await this.openai!.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.getRecentHistory(),
          { role: 'user', content: userPrompt }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      });

      const response = completion.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu traiter votre demande.';
      
      return {
        response,
        confidence: 0.8, // Estimation basée sur la qualité de la réponse
        sources: ['Assistant IA OpenAI', 'Base de connaissances comptable'],
        suggestions: this.generateSuggestions(query, type)
      };

    } catch (error) {
      logger.error('OpenAI API error:', error);
      throw error;
    }
  }

  // Construction du prompt système
  private buildSystemPrompt(type: string, context?: AIAssistantContext): string {
    const basePrompt = `Vous êtes un assistant comptable expert français. Répondez de manière claire, précise et professionnelle.`;
    
    const typeSpecificPrompts = {
      accounting: `Vous spécialisez dans la comptabilité française, le plan comptable général, et les écritures comptables.`,
      tax: `Vous spécialisez dans la fiscalité française, la TVA, l'impôt sur les sociétés et l'optimisation fiscale.`,
      analysis: `Vous spécialisez dans l'analyse financière, les ratios, et l'interprétation des données comptables.`,
      general: `Vous pouvez répondre à toutes questions relatives à la comptabilité et la gestion d'entreprise.`
    };

    let contextPrompt = '';
    if (context?.currentBalance) {
      contextPrompt += `\nSolde actuel: ${context.currentBalance}€`;
    }
    if (context?.transactions?.length) {
      contextPrompt += `\nNombre de transactions récentes: ${context.transactions.length}`;
    }

    return `${basePrompt}\n${typeSpecificPrompts[type] || typeSpecificPrompts.general}${contextPrompt}`;
  }

  // Construction du prompt utilisateur
  private buildUserPrompt(query: string, context?: AIAssistantContext): string {
    let prompt = query;
    
    // Ajoute du contexte si pertinent
    if (context?.period) {
      prompt += `\n\nPériode d'analyse: du ${context.period.start.toLocaleDateString('fr-FR')} au ${context.period.end.toLocaleDateString('fr-FR')}`;
    }
    
    return prompt;
  }

  // Récupère l'historique récent de conversation
  private getRecentHistory(): Array<{role: 'user' | 'assistant'; content: string}> {
    return this.conversationHistory.slice(-4).flatMap(item => [
      { role: 'user' as const, content: item.query },
      { role: 'assistant' as const, content: item.response }
    ]);
  }

  // Génération de réponses mock (fallback)
  private generateMockResponse(
    query: string, 
    type: string, 
    context?: AIAssistantContext
  ): {response: string; confidence: number; sources: string[]; suggestions: string[]} {
    
    const responses = {
      accounting: [
        "En comptabilité française, il est important de respecter le plan comptable général (PCG). Pour votre question, je recommande de consulter les comptes de classe 6 pour les charges et classe 7 pour les produits.",
        "Cette opération nécessite une écriture comptable au journal. Pensez à équilibrer le débit et le crédit, et à respecter le principe de la partie double.",
        "Pour cette situation, vous devez consulter les articles du Code de commerce relatifs à la tenue de la comptabilité."
      ],
      tax: [
        "Concernant la TVA, le taux normal est de 20% en France. Vérifiez si votre activité permet l'application d'un taux réduit.",
        "Cette déduction fiscale est possible sous certaines conditions. Je recommande de conserver tous les justificatifs et de vérifier l'éligibilité.",
        "L'optimisation fiscale doit respecter la loi. Cette stratégie semble légitime, mais consultez un expert-comptable pour validation."
      ],
      analysis: [
        `Basé sur vos données${context?.currentBalance ? ` (solde: ${context.currentBalance}€)` : ''}, voici mon analyse: vos indicateurs financiers montrent une tendance positive.`,
        "Les ratios financiers indiquent une situation stable. Surveillez particulièrement la trésorerie et les délais de paiement clients.",
        "Cette évolution est cohérente avec le secteur d'activité. Je recommande de maintenir cette trajectoire."
      ],
      general: [
        "Voici une réponse générale à votre question. Pour une analyse plus précise, n'hésitez pas à fournir plus de contexte.",
        "Cette situation est courante en gestion d'entreprise. Je recommande de suivre les bonnes pratiques comptables.",
        "Pour une réponse plus personnalisée, précisez votre secteur d'activité et la taille de votre entreprise."
      ]
    };

    const typeResponses = responses[type] || responses.general;
    const response = typeResponses[Math.floor(Math.random() * typeResponses.length)];
    
    return {
      response,
      confidence: 0.6,
      sources: ['Base de connaissances', 'Réglementation française'],
      suggestions: this.generateSuggestions(query, type)
    };
  }

  // Génération de suggestions
  private generateSuggestions(query: string, type: string): string[] {
    const suggestions = {
      accounting: [
        "Vérifier le plan comptable général",
        "Consulter un expert-comptable",
        "Analyser l'impact sur le bilan"
      ],
      tax: [
        "Vérifier la réglementation fiscale",
        "Calculer l'impact fiscal",
        "Consulter un conseiller fiscal"
      ],
      analysis: [
        "Analyser les tendances",
        "Comparer avec le secteur",
        "Prévoir l'évolution future"
      ],
      general: [
        "Demander plus de précisions",
        "Consulter la documentation",
        "Contacter un professionnel"
      ]
    };

    return suggestions[type] || suggestions.general;
  }

  // SUGGESTIONS D'OPTIMISATION FISCALE
  async generateTaxOptimizations(transactions: Transaction[]): Promise<AIServiceResponse<TaxOptimization[]>> {
    try {
      const startTime = Date.now();
      
      const optimizations: TaxOptimization[] = [];
      
      // Analyse des transactions pour identifier les opportunités
      const deductibleExpenses = this.identifyDeductibleExpenses(transactions);
      const timingOpportunities = this.identifyTimingOpportunities(transactions);
      const structureOptimizations = this.identifyStructureOptimizations(transactions);
      
      optimizations.push(...deductibleExpenses, ...timingOpportunities, ...structureOptimizations);
      
      // Tri par potentiel d'économie
      optimizations.sort((a, b) => b.potentialSavings - a.potentialSavings);
      
      return {
        success: true,
        data: optimizations.slice(0, 10), // Top 10 optimisations
        processingTime: Date.now() - startTime,
        modelUsed: 'tax_optimization_analyzer'
      };

    } catch (error) {
      logger.error('Error generating tax optimizations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Identification des dépenses déductibles
  private identifyDeductibleExpenses(transactions: Transaction[]): TaxOptimization[] {
    const optimizations: TaxOptimization[] = [];
    
    // Recherche de dépenses potentiellement déductibles
    const potentialDeductions = transactions.filter(t => {
      const description = t.description.toLowerCase();
      return t.type === 'expense' && (
        description.includes('formation') ||
        description.includes('bureau') ||
        description.includes('ordinateur') ||
        description.includes('logiciel') ||
        description.includes('restaurant') && t.amount < 200 // repas d'affaires
      );
    });

    if (potentialDeductions.length > 0) {
      const totalAmount = potentialDeductions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      optimizations.push({
        id: crypto.randomUUID(),
        type: 'deduction',
        title: 'Optimiser les déductions fiscales',
        description: `${potentialDeductions.length} transactions identifiées comme potentiellement déductibles`,
        potentialSavings: totalAmount * 0.25, // estimation 25% d'économie d'impôt
        effort: 'medium',
        requirements: [
          'Vérifier l\'éligibilité de chaque dépense',
          'Rassembler les justificatifs',
          'Documenter l\'utilisation professionnelle'
        ],
        status: 'suggested'
      });
    }

    return optimizations;
  }

  // Identification des opportunités de timing
  private identifyTimingOpportunities(transactions: Transaction[]): TaxOptimization[] {
    const optimizations: TaxOptimization[] = [];
    
    // Analyse des dépenses de fin d'année
    const now = new Date();
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    const daysUntilEndOfYear = Math.ceil((endOfYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilEndOfYear < 60) {
      const recentExpenses = transactions.filter(t => 
        t.type === 'expense' && 
        new Date(t.date).getMonth() >= 10 // Nov-Dec
      );
      
      if (recentExpenses.length > 0) {
        optimizations.push({
          id: crypto.randomUUID(),
          type: 'timing',
          title: 'Optimisation fiscale de fin d\'année',
          description: 'Anticiper ou reporter certaines dépenses pour optimiser l\'impôt',
          potentialSavings: 2000,
          effort: 'low',
          deadline: endOfYear,
          requirements: [
            'Identifier les dépenses à anticiper',
            'Vérifier les règles de déductibilité',
            'Planifier les achats'
          ],
          status: 'suggested'
        });
      }
    }

    return optimizations;
  }

  // Identification des optimisations de structure
  private identifyStructureOptimizations(transactions: Transaction[]): TaxOptimization[] {
    const optimizations: TaxOptimization[] = [];
    
    const totalRevenue = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Si le CA dépasse certains seuils
    if (totalRevenue > 170000) {
      optimizations.push({
        id: crypto.randomUUID(),
        type: 'structure',
        title: 'Évaluer le passage en société',
        description: 'Le chiffre d\'affaires pourrait justifier une optimisation de structure juridique',
        potentialSavings: 5000,
        effort: 'high',
        requirements: [
          'Consulter un expert-comptable',
          'Analyser les charges sociales',
          'Évaluer les avantages/inconvénients'
        ],
        status: 'suggested'
      });
    }

    return optimizations;
  }

  // GÉNÉRATION DE RAPPORTS NARRATIFS
  async generateNarrativeReport(
    type: 'monthly' | 'quarterly' | 'annual',
    period: { start: Date; end: Date },
    transactions: Transaction[],
    metrics: FinancialMetrics
  ): Promise<AIServiceResponse<ReportNarrative>> {
    try {
      const startTime = Date.now();
      
      const report = await this.generateReportContent(type, period, transactions, metrics);
      
      return {
        success: true,
        data: report,
        processingTime: Date.now() - startTime,
        modelUsed: this.openai ? this.config.model : 'narrative_generator'
      };

    } catch (error) {
      logger.error('Error generating narrative report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Génération du contenu du rapport
  private async generateReportContent(
    type: string,
    period: { start: Date; end: Date },
    transactions: Transaction[],
    metrics: FinancialMetrics
  ): Promise<ReportNarrative> {
    
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const balance = income - expenses;
    
    let summary: string;
    let keyInsights: string[];
    let recommendations: string[];

    if (this.openai && this.config.enabled) {
      // Utilise OpenAI pour générer le rapport
      const prompt = `Générez un rapport financier ${type} pour la période du ${period.start.toLocaleDateString('fr-FR')} au ${period.end.toLocaleDateString('fr-FR')}.
      
      Données:
      - Revenus: ${income.toLocaleString('fr-FR')}€
      - Dépenses: ${expenses.toLocaleString('fr-FR')}€
      - Solde: ${balance.toLocaleString('fr-FR')}€
      - Nombre de transactions: ${transactions.length}
      
      Format attendu: JSON avec summary, keyInsights (array), recommendations (array)`;

      try {
        const completion = await this.openai.chat.completions.create({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800,
          temperature: 0.5
        });

        const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
        summary = response.summary || this.generateDefaultSummary(balance, income, expenses);
        keyInsights = response.keyInsights || this.generateDefaultInsights(transactions, metrics);
        recommendations = response.recommendations || this.generateDefaultRecommendations(balance, metrics);
      } catch (error) {
        // Fallback vers génération par défaut
        summary = this.generateDefaultSummary(balance, income, expenses);
        keyInsights = this.generateDefaultInsights(transactions, metrics);
        recommendations = this.generateDefaultRecommendations(balance, metrics);
      }
    } else {
      // Génération par défaut
      summary = this.generateDefaultSummary(balance, income, expenses);
      keyInsights = this.generateDefaultInsights(transactions, metrics);
      recommendations = this.generateDefaultRecommendations(balance, metrics);
    }

    return {
      id: crypto.randomUUID(),
      type,
      title: `Rapport ${type} - ${period.start.toLocaleDateString('fr-FR')} à ${period.end.toLocaleDateString('fr-FR')}`,
      summary,
      keyInsights,
      recommendations,
      metrics: this.generateNarrativeMetrics(income, expenses, balance),
      generatedAt: new Date(),
      period
    };
  }

  // Génération du résumé par défaut
  private generateDefaultSummary(balance: number, income: number, expenses: number): string {
    const profitability = income > 0 ? ((balance / income) * 100).toFixed(1) : '0';
    
    return `Au cours de cette période, l'activité a généré ${income.toLocaleString('fr-FR')}€ de revenus pour ${expenses.toLocaleString('fr-FR')}€ de dépenses, ` +
           `soit un résultat ${balance >= 0 ? 'positif' : 'négatif'} de ${Math.abs(balance).toLocaleString('fr-FR')}€. ` +
           `La marge bénéficiaire s'établit à ${profitability}%, ${balance >= 0 ? 'témoignant d\'une bonne performance' : 'nécessitant une attention particulière'}.`;
  }

  // Génération des insights par défaut
  private generateDefaultInsights(transactions: Transaction[], _metrics: FinancialMetrics): string[] {
    const insights: string[] = [];
    
    // Analyse des transactions
    const avgTransaction = transactions.length > 0 ? 
      transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactions.length : 0;
    
    insights.push(`Montant moyen par transaction: ${avgTransaction.toLocaleString('fr-FR')}€`);
    
    // Analyse par type
    const incomeCount = transactions.filter(t => t.type === 'income').length;
    const expenseCount = transactions.filter(t => t.type === 'expense').length;
    
    insights.push(`Répartition: ${incomeCount} transactions de revenus, ${expenseCount} de dépenses`);
    
    // Analyse temporelle
    const weekdays = transactions.filter(t => {
      const day = new Date(t.date).getDay();
      return day >= 1 && day <= 5;
    }).length;
    
    insights.push(`${((weekdays / transactions.length) * 100).toFixed(0)}% des transactions en semaine`);
    
    return insights;
  }

  // Génération des recommandations par défaut
  private generateDefaultRecommendations(balance: number, _metrics: FinancialMetrics): string[] {
    const recommendations: string[] = [];
    
    if (balance < 0) {
      recommendations.push('Analyser les postes de dépenses pour identifier les optimisations possibles');
      recommendations.push('Diversifier les sources de revenus pour améliorer la stabilité financière');
    } else {
      recommendations.push('Maintenir cette performance positive tout en surveillant les coûts');
      recommendations.push('Envisager des investissements pour soutenir la croissance');
    }
    
    recommendations.push('Mettre en place un suivi budgétaire régulier');
    recommendations.push('Constituer une réserve de trésorerie pour faire face aux imprévus');
    
    return recommendations;
  }

  // Génération des métriques narratives
  private generateNarrativeMetrics(income: number, expenses: number, balance: number): NarrativeMetric[] {
    return [
      {
        name: 'Chiffre d\'affaires',
        value: income,
        previousValue: income * 0.9, // estimation
        change: income * 0.1,
        trend: 'up',
        interpretation: 'Croissance du chiffre d\'affaires'
      },
      {
        name: 'Charges',
        value: expenses,
        previousValue: expenses * 1.1,
        change: expenses * -0.1,
        trend: 'down',
        interpretation: 'Maîtrise des charges'
      },
      {
        name: 'Résultat',
        value: balance,
        previousValue: balance * 0.8,
        change: balance * 0.2,
        trend: balance >= 0 ? 'up' : 'down',
        interpretation: balance >= 0 ? 'Performance positive' : 'Vigilance requise'
      }
    ];
  }

  // ALERTES INTELLIGENTES
  generateSmartAlert(
    type: SmartAlert['type'],
    severity: SmartAlert['severity'],
    title: string,
    message: string,
    data: Record<string, unknown>
  ): SmartAlert {
    return {
      id: crypto.randomUUID(),
      type,
      severity,
      title,
      message,
      data,
      timestamp: new Date(),
      isRead: false,
      actions: this.generateAlertActions(type, data),
      autoResolve: type === 'threshold' || type === 'anomaly'
    };
  }

  // Génération des actions d'alerte
  private generateAlertActions(type: string, data: Record<string, unknown>): AlertAction[] {
    const actions = [];
    
    switch (type) {
      case 'anomaly':
        actions.push(
          { label: 'Analyser', action: 'analyze_anomaly', params: { id: data.id }, style: 'primary' },
          { label: 'Ignorer', action: 'dismiss_alert', style: 'secondary' }
        );
        break;
        
      case 'threshold':
        actions.push(
          { label: 'Ajuster seuil', action: 'adjust_threshold', style: 'primary' },
          { label: 'Voir détails', action: 'view_details', style: 'secondary' }
        );
        break;
        
      case 'opportunity':
        actions.push(
          { label: 'En savoir plus', action: 'learn_more', style: 'primary' },
          { label: 'Ignorer', action: 'dismiss_alert', style: 'secondary' }
        );
        break;
    }
    
    return actions;
  }

  // Getters et utilitaires
  getConversationHistory(): AIAssistantQuery[] {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  updateConfig(config: Partial<AIConfiguration['assistant']>): void {
    this.config = { ...this.config, ...config };
  }

  get isEnabled(): boolean {
    return this.config.enabled;
  }

  get initialized(): boolean {
    return this.isInitialized;
  }

  dispose(): void {
    this.conversationHistory = [];
    this.openai = null;
    this.isInitialized = false;
  }
}

// Instance singleton
export const aiAssistantService = new AIAssistantService();