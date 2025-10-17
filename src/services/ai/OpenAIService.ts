import { supabase } from '@/lib/supabase';
import { AIAssistantMessage, AIInsight, SmartAlert, CashFlowPrediction, TaxOptimization, AnomalyDetection } from '@/types/ai-types';
import { logger } from '@/utils/logger';

interface AIServiceResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  confidence?: number;
  processingTime?: number;
}

interface ChatRequest {
  query: string;
  context_type?: 'dashboard' | 'accounting' | 'invoicing' | 'reports' | 'general';
  company_id: string;
}

interface AnalysisRequest {
  type: 'financial_health' | 'cash_flow' | 'anomaly_detection' | 'tax_optimization';
  company_id: string;
  data?: any;
}

type TransactionWithLines = {
  id?: string;
  description?: string;
  reference?: string;
  total_amount: number;
  entry_date: string | Date;
  journal_entry_lines?: Array<{
    account_code: string;
  }>;
  [key: string]: unknown;
};

export class OpenAIService {
  private static instance: OpenAIService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
  }

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  // 🤖 Assistant conversationnel
  async chat(request: ChatRequest): Promise<AIServiceResponse<{ response: string; sources: string[]; suggestions?: string[] }>> {
    const startTime = performance.now();

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await fetch(`${this.baseUrl}/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const processingTime = performance.now() - startTime;

      return {
        success: true,
        data,
        processingTime
      };
    } catch (error) {
      logger.error('OpenAI Chat Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de communication avec l\'IA'
      };
    }
  }

  // 📊 Analyse financière intelligente
  async analyzeFinancialHealth(companyId: string): Promise<AIServiceResponse<AIInsight[]>> {
    try {
      // Récupérer les données financières récentes
      const { data: transactions } = await supabase
        .from('journal_entries')
        .select(`
          id, entry_date, total_amount, description,
          journal_entry_lines (account_code, debit_amount, credit_amount)
        `)
        .eq('company_id', companyId)
        .gte('entry_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('entry_date', { ascending: false });

      const { data: accounts } = await supabase
        .from('accounts')
        .select('account_code, account_name, account_type, current_balance')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (!transactions || !accounts) {
        return { success: false, error: 'Données insuffisantes pour l\'analyse' };
      }

      // Générer des insights IA
      const insights = this.generateFinancialInsights(transactions, accounts);

      return {
        success: true,
        data: insights,
        confidence: 0.85
      };
    } catch (error) {
      logger.error('Financial Health Analysis Error:', error);
      return {
        success: false,
        error: 'Erreur lors de l\'analyse financière'
      };
    }
  }

  // 🔮 Prédictions cash-flow
  async predictCashFlow(companyId: string, months: number = 6): Promise<AIServiceResponse<CashFlowPrediction[]>> {
    try {
      // Récupérer l'historique des transactions
      const { data: transactions } = await supabase
        .from('journal_entries')
        .select(`
          entry_date, total_amount, description,
          journal_entry_lines!inner (account_code, debit_amount, credit_amount)
        `)
        .eq('company_id', companyId)
        .gte('entry_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
        .order('entry_date', { ascending: true });

      if (!transactions || transactions.length < 10) {
        return { success: false, error: 'Historique insuffisant pour les prédictions (minimum 10 transactions)' };
      }

      // Analyser les patterns et générer les prédictions
      const predictions = this.generateCashFlowPredictions(transactions, months);

      return {
        success: true,
        data: predictions,
        confidence: 0.75
      };
    } catch (error) {
      logger.error('Cash Flow Prediction Error:', error);
      return {
        success: false,
        error: 'Erreur lors de la prédiction de trésorerie'
      };
    }
  }

  // 🚨 Détection d'anomalies
  async detectAnomalies(companyId: string): Promise<AIServiceResponse<AnomalyDetection[]>> {
    try {
      const { data: recentTransactions } = await supabase
        .from('journal_entries')
        .select(`
          id, entry_date, total_amount, description, reference,
          journal_entry_lines (account_code, debit_amount, credit_amount)
        `)
        .eq('company_id', companyId)
        .gte('entry_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('entry_date', { ascending: false });

      if (!recentTransactions || recentTransactions.length === 0) {
        return { success: true, data: [] };
      }

      const anomalies = this.detectTransactionAnomalies(recentTransactions);

      return {
        success: true,
        data: anomalies,
        confidence: 0.80
      };
    } catch (error) {
      logger.error('Anomaly Detection Error:', error);
      return {
        success: false,
        error: 'Erreur lors de la détection d\'anomalies'
      };
    }
  }

  // 💡 Suggestions d'optimisation fiscale
  async getTaxOptimizations(companyId: string): Promise<AIServiceResponse<TaxOptimization[]>> {
    try {
      const { data: company } = await supabase
        .from('companies')
        .select('country, default_currency, accounting_standard')
        .eq('id', companyId)
        .single();

      if (!company) {
        return { success: false, error: 'Entreprise non trouvée' };
      }

      // Récupérer les données pour l'analyse fiscale
      const { data: transactions } = await supabase
        .from('journal_entries')
        .select(`
          entry_date, total_amount, description,
          journal_entry_lines (account_code, debit_amount, credit_amount)
        `)
        .eq('company_id', companyId)
        .gte('entry_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

      const optimizations = this.generateTaxOptimizations(company, transactions || []);

      return {
        success: true,
        data: optimizations,
        confidence: 0.70
      };
    } catch (error) {
      logger.error('Tax Optimization Error:', error);
      return {
        success: false,
        error: 'Erreur lors de l\'analyse fiscale'
      };
    }
  }

  // 🔔 Générer des alertes intelligentes
  async generateSmartAlerts(companyId: string): Promise<AIServiceResponse<SmartAlert[]>> {
    try {
      const [healthResult, cashFlowResult, anomalyResult] = await Promise.all([
        this.analyzeFinancialHealth(companyId),
        this.predictCashFlow(companyId, 3),
        this.detectAnomalies(companyId)
      ]);

      const alerts: SmartAlert[] = [];

      // Alertes basées sur la santé financière
      if (healthResult.success && healthResult.data) {
        const criticalInsights = healthResult.data.filter(insight => insight.priority === 'high');
        criticalInsights.forEach(insight => {
          alerts.push({
            id: `health_${insight.id}`,
            type: 'risk',
            severity: 'warning',
            title: insight.title,
            message: insight.description,
            data: { insight },
            timestamp: new Date(),
            isRead: false,
            actions: insight.actions
          });
        });
      }

      // Alertes basées sur les prédictions cash-flow
      if (cashFlowResult.success && cashFlowResult.data) {
        const negativePredictions = cashFlowResult.data.filter(p => p.predictedBalance < 0);
        if (negativePredictions.length > 0) {
          alerts.push({
            id: `cashflow_negative`,
            type: 'risk',
            severity: 'error',
            title: '⚠️ Risque de trésorerie négative',
            message: `Votre trésorerie pourrait devenir négative dans ${negativePredictions.length} mois.`,
            data: { predictions: negativePredictions },
            timestamp: new Date(),
            isRead: false,
            actions: [
              { label: 'Voir les détails', action: 'view_cashflow', style: 'primary' },
              { label: 'Plan d\'action', action: 'create_action_plan', style: 'secondary' }
            ]
          });
        }
      }

      // Alertes basées sur les anomalies
      if (anomalyResult.success && anomalyResult.data) {
        const criticalAnomalies = anomalyResult.data.filter(a => a.severity === 'high' || a.severity === 'critical');
        criticalAnomalies.forEach(anomaly => {
          alerts.push({
            id: `anomaly_${anomaly.id}`,
            type: 'anomaly',
            severity: anomaly.severity === 'critical' ? 'critical' : 'warning',
            title: 'Transaction inhabituelle détectée',
            message: anomaly.description,
            data: { anomaly },
            timestamp: new Date(),
            isRead: false,
            actions: [
              { label: 'Examiner', action: 'examine_transaction', params: { transactionId: anomaly.transaction.id }, style: 'primary' }
            ]
          });
        });
      }

      return {
        success: true,
        data: alerts,
        confidence: 0.85
      };
    } catch (error) {
      logger.error('Smart Alerts Generation Error:', error);
      return {
        success: false,
        error: 'Erreur lors de la génération des alertes'
      };
    }
  }

  // Méthodes privées d'analyse
  private generateFinancialInsights(transactions: any[], accounts: any[]): AIInsight[] {
    const insights: AIInsight[] = [];

    // Analyse de la liquidité
    const cashAccounts = accounts.filter(a => a.account_code.startsWith('512') || a.account_code.startsWith('53'));
    const totalCash = cashAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

    if (totalCash < 5000) {
      insights.push({
        id: 'liquidity_low',
        type: 'alert',
        title: 'Trésorerie faible',
        description: `Votre trésorerie (${totalCash.toLocaleString()}€) est en dessous du seuil recommandé.`,
        confidence: 0.9,
        category: 'Liquidité',
        priority: 'high',
        createdAt: new Date().toISOString(),
        actions: [
          { label: 'Relancer les clients', action: 'chase_receivables' },
          { label: 'Voir le cash-flow', action: 'view_cashflow' }
        ]
      });
    }

    // Analyse des revenus
    const recentRevenue = transactions
      .filter(t => new Date(t.entry_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .filter(t => t.journal_entry_lines?.some((line: any) => line.account_code.startsWith('70')))
      .reduce((sum, t) => sum + t.total_amount, 0);

    const previousRevenue = transactions
      .filter(t => {
        const date = new Date(t.entry_date);
        return date > new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) &&
               date <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      })
      .filter(t => t.journal_entry_lines?.some((line: any) => line.account_code.startsWith('70')))
      .reduce((sum, t) => sum + t.total_amount, 0);

    if (previousRevenue > 0) {
      const revenueChange = ((recentRevenue - previousRevenue) / previousRevenue) * 100;
      if (revenueChange > 10) {
        insights.push({
          id: 'revenue_growth',
          type: 'recommendation',
          title: '📈 Croissance des revenus',
          description: `Excellente performance ! Vos revenus ont augmenté de ${revenueChange.toFixed(1)}% ce mois.`,
          confidence: 0.95,
          category: 'Performance',
          priority: 'medium',
          createdAt: new Date().toISOString()
        });
      } else if (revenueChange < -10) {
        insights.push({
          id: 'revenue_decline',
          type: 'alert',
          title: '📉 Baisse des revenus',
          description: `Attention : vos revenus ont diminué de ${Math.abs(revenueChange).toFixed(1)}% ce mois.`,
          confidence: 0.9,
          category: 'Performance',
          priority: 'high',
          createdAt: new Date().toISOString(),
          actions: [
            { label: 'Analyser les causes', action: 'analyze_revenue_decline' },
            { label: 'Plan d\'action commercial', action: 'create_sales_plan' }
          ]
        });
      }
    }

    return insights;
  }

  private generateCashFlowPredictions(transactions: TransactionWithLines[], months: number): CashFlowPrediction[] {
    const predictions: CashFlowPrediction[] = [];

    // Analyser les patterns mensuels
    const monthlyData = this.analyzeMonthlyPatterns(transactions);

    for (let i = 1; i <= months; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);

      // Prédiction simple basée sur les moyennes mobiles
      const avgIncome = monthlyData.avgMonthlyIncome;
      const avgExpenses = monthlyData.avgMonthlyExpenses;
      const trend = monthlyData.trend;

      const predictedIncome = avgIncome * (1 + trend * i * 0.1);
      const predictedExpenses = avgExpenses * (1 + trend * i * 0.05);

      predictions.push({
        id: `prediction_${i}`,
        month: futureDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }),
        date: futureDate,
        predictedValue: predictedIncome - predictedExpenses,
        predictedIncome,
        predictedExpenses,
        predictedBalance: predictedIncome - predictedExpenses,
        confidence: Math.max(0.5, 0.9 - (i * 0.1)), // Confiance décroissante avec le temps
        factors: [
          { id: 'historical', name: 'Historique', impact: 0.7 },
          { id: 'trend', name: 'Tendance', impact: trend },
          { id: 'seasonality', name: 'Saisonnalité', impact: 0.1 }
        ],
        trend: predictedIncome > avgIncome ? 'up' : predictedIncome < avgIncome ? 'down' : 'stable'
      });
    }

    return predictions;
  }

  private analyzeMonthlyPatterns(transactions: TransactionWithLines[]) {
    // Grouper par mois
    const monthlyGroups = transactions.reduce<Record<string, TransactionWithLines[]>>((groups, transaction) => {
      const month = new Date(transaction.entry_date).toISOString().slice(0, 7);
      if (!groups[month]) groups[month] = [];
      groups[month].push(transaction);
      return groups;
    }, {});

    const monthlyTotals = Object.entries(monthlyGroups).map(([month, txns]) => {
      const typedTxns = Array.isArray(txns) ? (txns as TransactionWithLines[]) : [];
      const income = typedTxns
        .filter(transaction =>
          transaction.journal_entry_lines?.some(line => line.account_code.startsWith('70'))
        )
        .reduce((sum, transaction) => sum + (Number(transaction.total_amount) || 0), 0);
      const expenses = typedTxns
        .filter(transaction =>
          transaction.journal_entry_lines?.some(line => line.account_code.startsWith('6'))
        )
        .reduce((sum, transaction) => sum + (Number(transaction.total_amount) || 0), 0);

      return { month, income, expenses };
    });

    const avgMonthlyIncome = monthlyTotals.reduce((sum, m) => sum + m.income, 0) / monthlyTotals.length;
    const avgMonthlyExpenses = monthlyTotals.reduce((sum, m) => sum + m.expenses, 0) / monthlyTotals.length;

    // Calculer la tendance (très simplifié)
    const recent = monthlyTotals.slice(-3);
    const older = monthlyTotals.slice(-6, -3);
    const recentAvg = recent.reduce((sum, m) => sum + (m.income - m.expenses), 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, m) => sum + (m.income - m.expenses), 0) / older.length : recentAvg;
    const trend = olderAvg !== 0 ? (recentAvg - olderAvg) / Math.abs(olderAvg) : 0;

    return { avgMonthlyIncome, avgMonthlyExpenses, trend };
  }

  private detectTransactionAnomalies(transactions: TransactionWithLines[]): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];

    // Calculer les statistiques pour détecter les outliers
    const amounts = transactions.map(t => t.total_amount);
    const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const stdDev = Math.sqrt(amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length);
    const threshold = mean + (2 * stdDev); // 2 écarts-types

    transactions.forEach(transaction => {
      const reasons: string[] = [];
      let score = 0;
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      // Montant inhabituel
      if (Math.abs(transaction.total_amount) > threshold) {
        reasons.push(`Montant inhabituel (${transaction.total_amount.toLocaleString()}€)`);
        score += 0.4;
        severity = 'medium';
      }

      // Weekend ou jour férié
      const date = new Date(transaction.entry_date);
      if (date.getDay() === 0 || date.getDay() === 6) {
        reasons.push('Transaction un weekend');
        score += 0.2;
      }

      // Heure tardive (si on avait l'heure)
      if (transaction.reference?.includes('URGENT') || transaction.description?.toLowerCase().includes('urgent')) {
        reasons.push('Transaction marquée comme urgente');
        score += 0.3;
        severity = 'medium';
      }

      // Description suspecte
      const suspiciousKeywords = ['cash', 'espèce', 'remboursement personnel', 'avance'];
      const hasSuspiciousKeyword = suspiciousKeywords.some(keyword =>
        transaction.description?.toLowerCase().includes(keyword)
      );

      if (hasSuspiciousKeyword) {
        reasons.push('Description contenant des mots-clés suspects');
        score += 0.5;
        severity = 'high';
      }

      // Si anomalie détectée
      if (score > 0.3) {
        anomalies.push({
          id: `anomaly_${transaction.id}`,
          type: score > 0.6 ? 'pattern' : 'outlier',
          description: `Transaction du ${new Date(transaction.entry_date).toLocaleDateString()} : ${transaction.description}`,
          severity,
          affectedData: 'journal_entries',
          detectedAt: new Date().toISOString(),
          confidence: Math.min(score, 1),
          resolved: false,
          transaction: {
            id: transaction.id,
            date: new Date(transaction.entry_date),
            amount: transaction.total_amount,
            description: transaction.description || '',
            type: transaction.total_amount > 0 ? 'income' : 'expense',
            account: transaction.journal_entry_lines?.[0]?.account_code || '',
            reference: transaction.reference
          },
          score,
          reasons,
          timestamp: new Date(),
          possibleCauses: reasons,
          suggestedActions: [
            'Vérifier la justification de la transaction',
            'Contrôler les pièces justificatives',
            'Valider avec le responsable concerné'
          ]
        });
      }
    });

    return anomalies.sort((a, b) => b.score - a.score);
  }

  private generateTaxOptimizations(company: any, transactions: any[]): TaxOptimization[] {
    const optimizations: TaxOptimization[] = [];

    // Optimisation TVA
    const vatTransactions = transactions.filter(t =>
      t.journal_entry_lines?.some((line: any) => line.account_code.includes('445'))
    );

    if (vatTransactions.length > 10) {
      optimizations.push({
        id: 'vat_optimization',
        title: 'Optimisation déclaration TVA',
        description: 'Vos déclarations TVA pourraient être optimisées en regroupant certaines opérations.',
        potentialSavings: 1200,
        complexity: 'medium',
        effort: 'low',
        type: 'timing',
        status: 'suggested',
        category: 'TVA',
        implementationSteps: [
          'Analyser les déclarations des 12 derniers mois',
          'Identifier les opportunités de report',
          'Mettre en place un calendrier optimal'
        ],
        estimatedTime: '2-3 heures'
      });
    }

    // Optimisation amortissements
    const assetAccounts = transactions.filter(t =>
      t.journal_entry_lines?.some((line: any) => line.account_code.startsWith('2'))
    );

    if (assetAccounts.length > 0) {
      optimizations.push({
        id: 'depreciation_optimization',
        title: 'Optimisation des amortissements',
        description: 'Certains actifs pourraient bénéficier d\'amortissements accélérés pour optimiser votre fiscalité.',
        potentialSavings: 3500,
        complexity: 'high',
        effort: 'medium',
        type: 'structure',
        status: 'suggested',
        category: 'Amortissements',
        implementationSteps: [
          'Inventaire des immobilisations',
          'Analyse des modes d\'amortissement',
          'Calcul des économies potentielles',
          'Mise en œuvre des changements'
        ],
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedTime: '1 jour'
      });
    }

    return optimizations;
  }
}

export const openAIService = OpenAIService.getInstance();