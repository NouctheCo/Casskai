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

import type OpenAI from 'openai';
import { supabase } from '@/lib/supabase';
import { shouldUseEdgeFunction, getEdgeFunctionName, AI_CONFIG, isAIServiceEnabled } from '@/config/ai.config';

// Types communs pour les analyses IA
export interface AIAnalysisResult {
  executiveSummary: string;
  financialHealth: string;
  keyStrengths: string[];
  concernPoints: string[];
  recommendations: string[];
  riskLevel: 'Faible' | 'Modéré' | 'Élevé' | 'Critique';
}

// Données spécifiques pour chaque type de rapport
export interface CashFlowData {
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  cashBalance: number;
  cashFlowToDebt: number;
  freeCashFlow: number;
}

export interface ReceivablesData {
  totalReceivables: number;
  current: number; // 0-30 jours
  overdue30: number; // 30-60 jours
  overdue60: number; // 60-90 jours
  overdue90: number; // 90+ jours
  dso: number; // Days Sales Outstanding
  collectionRate: number;
  averageOverdueAmount: number;
}

export interface FinancialRatiosData {
  liquidityRatios: {
    currentRatio: number;
    quickRatio: number;
    cashRatio: number;
  };
  profitabilityRatios: {
    grossMargin: number;
    netMargin: number;
    roa: number;
    roe: number;
  };
  leverageRatios: {
    debtToEquity: number;
    debtToAssets: number;
    interestCoverage: number;
  };
  efficiencyRatios: {
    assetTurnover: number;
    inventoryTurnover: number;
    receivablesTurnover: number;
  };
}

export interface BudgetVarianceData {
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
  variancePercentage: number;
  majorVariances: Array<{
    category: string;
    budget: number;
    actual: number;
    variance: number;
    variancePercent: number;
  }>;
}

export interface PayablesData {
  totalPayables: number;
  current: number; // 0-30 jours
  overdue30: number; // 30-60 jours
  overdue60: number; // 60-90 jours
  overdue90: number; // 90+ jours
  dpo: number; // Days Payable Outstanding
  paymentRate: number;
  averageOverdueAmount: number;
}

export interface InventoryData {
  totalInventory: number;
  rawMaterials: number;
  workInProgress: number;
  finishedGoods: number;
  inventoryTurnover: number;
  daysInventoryOutstanding: number; // DIO
  obsoleteInventory: number;
  inventoryToSales: number;
}

/**
 * Service d'analyse IA spécialisé pour les différents types de rapports financiers
 */
class AIReportAnalysisService {
  private static instance: AIReportAnalysisService;
  private openai: OpenAI | null = null;
  private clientPromise: Promise<OpenAI | null> | null = null;

  private constructor() {
  }

  private async getClient(): Promise<OpenAI | null> {
    if (this.openai) return this.openai;
    if (this.clientPromise) return this.clientPromise;

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey || apiKey === 'sk-your-openai-api-key') {
      console.warn('OpenAI API key not configured. Report AI analysis disabled.');
      return null;
    }

    this.clientPromise = import('openai')
      .then(({ default: OpenAIImport }) => {
        this.openai = new OpenAIImport({
          apiKey,
          dangerouslyAllowBrowser: true
        });
        return this.openai;
      })
      .catch((error) => {
        console.error('Failed to load OpenAI client:', error);
        return null;
      });

    return this.clientPromise;
  }

  static getInstance(): AIReportAnalysisService {
    if (!this.instance) {
      this.instance = new AIReportAnalysisService();
    }
    return this.instance;
  }

  /**
   * Méthode générique d'analyse avec fallback
   */
  private async analyzeWithAI(prompt: string, reportType: string): Promise<string> {
    // En production, route via Edge Function sécurisée
    if (shouldUseEdgeFunction('reportAnalysis')) {
      const fnName = getEdgeFunctionName('reportAnalysis') || 'ai-report-analysis';
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return '';

        const response = await supabase.functions.invoke(fnName, {
          body: { prompt, reportType }
        });

        if (response.error) {
          console.error('Edge Function reportAnalysis error:', response.error);
          return '';
        }
        return (response.data?.result as string) || '';
      } catch (error) {
        console.error('Failed calling Edge Function reportAnalysis:', error);
        return '';
      }
    }

    // En développement, utiliser client OpenAI si clé dispo
    if (!isAIServiceEnabled('reportAnalysis')) {
      console.warn('AI Report Analysis disabled.');
      return '';
    }

    const client = await this.getClient();
    if (!client) return '';

    try {
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert-comptable et analyste financier senior avec 20 ans d'expérience.
Tu analyses les ${reportType} d'une entreprise et fournis des recommandations stratégiques claires et actionnables.
Tes analyses sont professionnelles, précises, et adaptées au contexte français (PCG).
Tu te concentres sur les aspects critiques et fournis des conseils pratiques.
IMPORTANT: Réponds UNIQUEMENT avec le format structuré demandé, sans texte supplémentaire.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: AI_CONFIG.openai.temperature,
        max_tokens: AI_CONFIG.openai.maxTokens
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error(`Erreur lors de l'analyse IA (${reportType}):`, error);
      return '';
    }
  }

  /**
   * Analyse du Flux de Trésorerie
   */
  async analyzeCashFlow(data: CashFlowData, periodStart: string, periodEnd: string): Promise<AIAnalysisResult> {
    const prompt = `Analyse le flux de trésorerie suivant pour la période du ${periodStart} au ${periodEnd}:

FLUX DE TRÉSORERIE:
- Flux opérationnel: ${this.formatCurrency(data.operatingCashFlow)}
- Flux d'investissement: ${this.formatCurrency(data.investingCashFlow)}
- Flux de financement: ${this.formatCurrency(data.financingCashFlow)}
- Flux net: ${this.formatCurrency(data.netCashFlow)}
- Solde de trésorerie: ${this.formatCurrency(data.cashBalance)}
- Ratio flux/dette: ${(data.cashFlowToDebt * 100).toFixed(1)}%
- Free cash flow: ${this.formatCurrency(data.freeCashFlow)}

Fournis une analyse au format suivant (STRICT):

## RÉSUMÉ EXÉCUTIF
[2-3 phrases sur la santé de la trésorerie]

## ANALYSE DE LA TRÉSORERIE
[Paragraphe d'analyse détaillée avec contexte sur les flux]

## POINTS FORTS
- [Point fort 1]
- [Point fort 2]
- [Point fort 3]

## POINTS D'ATTENTION
- [Point d'attention 1]
- [Point d'attention 2]
- [Point d'attention 3]

## RECOMMANDATIONS PRIORITAIRES
1. [Recommandation action 1]
2. [Recommandation action 2]
3. [Recommandation action 3]

## NIVEAU DE RISQUE
[Faible/Modéré/Élevé/Critique] - [Justification en 1 phrase]`;

    const response = await this.analyzeWithAI(prompt, 'flux de trésorerie');

    if (!response) {
      return this.generateDefaultCashFlowAnalysis(data);
    }

    return this.parseAIResponse(response);
  }

  /**
   * Analyse des Créances Clients
   */
  async analyzeReceivables(data: ReceivablesData, periodStart: string, periodEnd: string): Promise<AIAnalysisResult> {
    const prompt = `Analyse les créances clients suivantes pour la période du ${periodStart} au ${periodEnd}:

CRÉANCES CLIENTS:
- Total créances: ${this.formatCurrency(data.totalReceivables)}
- À jour (0-30j): ${this.formatCurrency(data.current)} (${((data.current / data.totalReceivables) * 100).toFixed(1)}%)
- Retard 30-60j: ${this.formatCurrency(data.overdue30)} (${((data.overdue30 / data.totalReceivables) * 100).toFixed(1)}%)
- Retard 60-90j: ${this.formatCurrency(data.overdue60)} (${((data.overdue60 / data.totalReceivables) * 100).toFixed(1)}%)
- Retard 90+j: ${this.formatCurrency(data.overdue90)} (${((data.overdue90 / data.totalReceivables) * 100).toFixed(1)}%)
- DSO (délai clients): ${data.dso.toFixed(0)} jours
- Taux de recouvrement: ${data.collectionRate.toFixed(1)}%
- Montant moyen en retard: ${this.formatCurrency(data.averageOverdueAmount)}

Fournis une analyse au format structuré (STRICT) avec sections: RÉSUMÉ EXÉCUTIF, ANALYSE DES CRÉANCES, POINTS FORTS, POINTS D'ATTENTION, RECOMMANDATIONS PRIORITAIRES, NIVEAU DE RISQUE.`;

    const response = await this.analyzeWithAI(prompt, 'créances clients');

    if (!response) {
      return this.generateDefaultReceivablesAnalysis(data);
    }

    return this.parseAIResponse(response);
  }

  /**
   * Analyse des Ratios Financiers
   */
  async analyzeFinancialRatios(data: FinancialRatiosData, periodStart: string, periodEnd: string): Promise<AIAnalysisResult> {
    const prompt = `Analyse les ratios financiers suivants pour la période du ${periodStart} au ${periodEnd}:

RATIOS DE LIQUIDITÉ:
- Ratio de liquidité générale: ${data.liquidityRatios.currentRatio.toFixed(2)}
- Ratio de liquidité réduite (quick ratio): ${data.liquidityRatios.quickRatio.toFixed(2)}
- Ratio de liquidité immédiate: ${data.liquidityRatios.cashRatio.toFixed(2)}

RATIOS DE RENTABILITÉ:
- Marge brute: ${data.profitabilityRatios.grossMargin.toFixed(1)}%
- Marge nette: ${data.profitabilityRatios.netMargin.toFixed(1)}%
- ROA (Return on Assets): ${data.profitabilityRatios.roa.toFixed(1)}%
- ROE (Return on Equity): ${data.profitabilityRatios.roe.toFixed(1)}%

RATIOS D'ENDETTEMENT:
- Ratio d'endettement (dette/capitaux propres): ${data.leverageRatios.debtToEquity.toFixed(2)}
- Ratio dette/actifs: ${(data.leverageRatios.debtToAssets * 100).toFixed(1)}%
- Couverture des intérêts: ${data.leverageRatios.interestCoverage.toFixed(2)}x

RATIOS D'EFFICACITÉ:
- Rotation des actifs: ${data.efficiencyRatios.assetTurnover.toFixed(2)}x
- Rotation des stocks: ${data.efficiencyRatios.inventoryTurnover.toFixed(2)}x
- Rotation des créances: ${data.efficiencyRatios.receivablesTurnover.toFixed(2)}x

Fournis une analyse comparative au format structuré (STRICT) en comparant avec les standards sectoriels.`;

    const response = await this.analyzeWithAI(prompt, 'ratios financiers');

    if (!response) {
      return this.generateDefaultRatiosAnalysis(data);
    }

    return this.parseAIResponse(response);
  }

  /**
   * Analyse des Écarts Budgétaires
   */
  async analyzeBudgetVariance(data: BudgetVarianceData, periodStart: string, periodEnd: string): Promise<AIAnalysisResult> {
    const majorVariancesText = data.majorVariances
      .map(v => `  - ${v.category}: Budget ${this.formatCurrency(v.budget)} vs Réel ${this.formatCurrency(v.actual)} = Écart ${this.formatCurrency(v.variance)} (${v.variancePercent > 0 ? '+' : ''}${v.variancePercent.toFixed(1)}%)`)
      .join('\n');

    const prompt = `Analyse les écarts budgétaires suivants pour la période du ${periodStart} au ${periodEnd}:

SYNTHÈSE GLOBALE:
- Budget total: ${this.formatCurrency(data.totalBudget)}
- Réalisé total: ${this.formatCurrency(data.totalActual)}
- Écart total: ${this.formatCurrency(data.totalVariance)} (${data.variancePercentage > 0 ? '+' : ''}${data.variancePercentage.toFixed(1)}%)

PRINCIPAUX ÉCARTS PAR CATÉGORIE:
${majorVariancesText}

Fournis une analyse au format structuré (STRICT) en identifiant:
- Les causes probables des écarts significatifs
- Les domaines nécessitant des actions correctives
- Les opportunités d'optimisation
- Les ajustements budgétaires à envisager`;

    const response = await this.analyzeWithAI(prompt, 'écarts budgétaires');

    if (!response) {
      return this.generateDefaultBudgetVarianceAnalysis(data);
    }

    return this.parseAIResponse(response);
  }

  /**
   * Analyse des Dettes Fournisseurs
   */
  async analyzePayables(data: PayablesData, periodStart: string, periodEnd: string): Promise<AIAnalysisResult> {
    const prompt = `Analyse les dettes fournisseurs suivantes pour la période du ${periodStart} au ${periodEnd}:

DETTES FOURNISSEURS:
- Total dettes: ${this.formatCurrency(data.totalPayables)}
- À échéance (0-30j): ${this.formatCurrency(data.current)} (${((data.current / data.totalPayables) * 100).toFixed(1)}%)
- Retard 30-60j: ${this.formatCurrency(data.overdue30)} (${((data.overdue30 / data.totalPayables) * 100).toFixed(1)}%)
- Retard 60-90j: ${this.formatCurrency(data.overdue60)} (${((data.overdue60 / data.totalPayables) * 100).toFixed(1)}%)
- Retard 90+j: ${this.formatCurrency(data.overdue90)} (${((data.overdue90 / data.totalPayables) * 100).toFixed(1)}%)
- DPO (délai paiement fournisseurs): ${data.dpo.toFixed(0)} jours
- Taux de paiement: ${data.paymentRate.toFixed(1)}%
- Montant moyen en retard: ${this.formatCurrency(data.averageOverdueAmount)}

Fournis une analyse au format structuré (STRICT) en équilibrant trésorerie vs relations fournisseurs.`;

    const response = await this.analyzeWithAI(prompt, 'dettes fournisseurs');

    if (!response) {
      return this.generateDefaultPayablesAnalysis(data);
    }

    return this.parseAIResponse(response);
  }

  /**
   * Analyse de la Valorisation des Stocks
   */
  async analyzeInventory(data: InventoryData, periodStart: string, periodEnd: string): Promise<AIAnalysisResult> {
    const prompt = `Analyse la valorisation des stocks suivante pour la période du ${periodStart} au ${periodEnd}:

VALORISATION DES STOCKS:
- Stock total: ${this.formatCurrency(data.totalInventory)}
  - Matières premières: ${this.formatCurrency(data.rawMaterials)}
  - Produits en cours: ${this.formatCurrency(data.workInProgress)}
  - Produits finis: ${this.formatCurrency(data.finishedGoods)}
- Rotation des stocks: ${data.inventoryTurnover.toFixed(2)}x par an
- DIO (Days Inventory Outstanding): ${data.daysInventoryOutstanding.toFixed(0)} jours
- Stock obsolète: ${this.formatCurrency(data.obsoleteInventory)} (${((data.obsoleteInventory / data.totalInventory) * 100).toFixed(1)}%)
- Ratio stock/ventes: ${(data.inventoryToSales * 100).toFixed(1)}%

Fournis une analyse au format structuré (STRICT) avec focus sur l'optimisation du BFR.`;

    const response = await this.analyzeWithAI(prompt, 'valorisation des stocks');

    if (!response) {
      return this.generateDefaultInventoryAnalysis(data);
    }

    return this.parseAIResponse(response);
  }

  /**
   * Parse la réponse de l'IA
   */
  private parseAIResponse(response: string): AIAnalysisResult {
    const sections = this.extractSections(response);

    let riskLevel: 'Faible' | 'Modéré' | 'Élevé' | 'Critique' = 'Modéré';
    const riskText = sections.riskLevel.toLowerCase();
    if (riskText.includes('faible')) riskLevel = 'Faible';
    else if (riskText.includes('élevé') || riskText.includes('eleve')) riskLevel = 'Élevé';
    else if (riskText.includes('critique')) riskLevel = 'Critique';
    else if (riskText.includes('modéré') || riskText.includes('modere')) riskLevel = 'Modéré';

    return {
      executiveSummary: sections.executiveSummary || 'Analyse en cours...',
      financialHealth: sections.financialHealth || 'Diagnostic en cours...',
      keyStrengths: sections.strengths.length > 0 ? sections.strengths : ['Données insuffisantes'],
      concernPoints: sections.concerns.length > 0 ? sections.concerns : ['Aucun point critique identifié'],
      recommendations: sections.recommendations.length > 0 ? sections.recommendations : ['Maintenir la surveillance'],
      riskLevel
    };
  }

  /**
   * Extrait les sections du texte généré par l'IA
   */
  private extractSections(text: string): {
    executiveSummary: string;
    financialHealth: string;
    strengths: string[];
    concerns: string[];
    recommendations: string[];
    riskLevel: string;
  } {
    const result = {
      executiveSummary: '',
      financialHealth: '',
      strengths: [] as string[],
      concerns: [] as string[],
      recommendations: [] as string[],
      riskLevel: ''
    };

    // Résumé Exécutif
    const summaryMatch = text.match(/##\s*RÉSUMÉ EXÉCUTIF\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (summaryMatch) result.executiveSummary = summaryMatch[1].trim();

    // Analyse (peut avoir différents titres)
    const healthMatch = text.match(/##\s*ANALYSE[^\n]*\n([\s\S]*?)(?=\n##|$)/i);
    if (healthMatch) result.financialHealth = healthMatch[1].trim();

    // Points Forts
    const strengthsMatch = text.match(/##\s*POINTS FORTS\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (strengthsMatch) result.strengths = this.extractBulletPoints(strengthsMatch[1]);

    // Points d'Attention
    const concernsMatch = text.match(/##\s*POINTS D'ATTENTION\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (concernsMatch) result.concerns = this.extractBulletPoints(concernsMatch[1]);

    // Recommandations
    const recoMatch = text.match(/##\s*RECOMMANDATIONS PRIORITAIRES\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (recoMatch) result.recommendations = this.extractBulletPoints(recoMatch[1]);

    // Niveau de Risque
    const riskMatch = text.match(/##\s*NIVEAU DE RISQUE\s*\n([\s\S]*?)$/i);
    if (riskMatch) result.riskLevel = riskMatch[1].trim();

    return result;
  }

  /**
   * Extrait les bullet points
   */
  private extractBulletPoints(text: string): string[] {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    return lines
      .filter(line => line.match(/^[-•*\d.]/))
      .map(line => line.replace(/^[-•*\d.]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  /**
   * Analyses par défaut (fallback)
   */
  private generateDefaultCashFlowAnalysis(data: CashFlowData): AIAnalysisResult {
    const riskLevel = data.netCashFlow < 0 ? 'Élevé' : data.cashBalance < 10000 ? 'Modéré' : 'Faible';

    return {
      executiveSummary: `Le flux de trésorerie net s'élève à ${this.formatCurrency(data.netCashFlow)}. Le solde de trésorerie est de ${this.formatCurrency(data.cashBalance)}.`,
      financialHealth: `L'analyse du flux de trésorerie montre un flux opérationnel de ${this.formatCurrency(data.operatingCashFlow)}. Le free cash flow de ${this.formatCurrency(data.freeCashFlow)} indique la capacité de l'entreprise à générer de la trésorerie après investissements.`,
      keyStrengths: data.operatingCashFlow > 0 ?
        ['Flux opérationnel positif', 'Capacité à générer de la trésorerie'] :
        ['Analyse en cours'],
      concernPoints: data.netCashFlow < 0 ?
        ['Flux net négatif - surveillance nécessaire', 'Risque de tension de trésorerie'] :
        ['Aucun point critique'],
      recommendations: [
        'Surveiller mensuellement les flux de trésorerie',
        'Optimiser le besoin en fonds de roulement',
        'Anticiper les besoins de financement'
      ],
      riskLevel
    };
  }

  private generateDefaultReceivablesAnalysis(data: ReceivablesData): AIAnalysisResult {
    const overduePercent = ((data.overdue30 + data.overdue60 + data.overdue90) / data.totalReceivables) * 100;
    const riskLevel = overduePercent > 30 ? 'Élevé' : overduePercent > 15 ? 'Modéré' : 'Faible';

    return {
      executiveSummary: `Les créances clients totalisent ${this.formatCurrency(data.totalReceivables)} avec un DSO de ${data.dso.toFixed(0)} jours. ${overduePercent.toFixed(1)}% des créances sont en retard.`,
      financialHealth: `Le délai moyen de paiement (DSO) de ${data.dso.toFixed(0)} jours impacte le besoin en fonds de roulement. Le taux de recouvrement de ${data.collectionRate.toFixed(1)}% nécessite une surveillance.`,
      keyStrengths: data.dso < 45 ?
        ['DSO inférieur à 45 jours', 'Bonne maîtrise du poste clients'] :
        ['Analyse en cours'],
      concernPoints: overduePercent > 15 ?
        [`${overduePercent.toFixed(1)}% de créances en retard`, 'Impact sur la trésorerie'] :
        ['Aucun point critique'],
      recommendations: [
        'Renforcer le suivi des clients en retard',
        'Négocier les conditions de paiement',
        'Mettre en place des relances automatiques'
      ],
      riskLevel
    };
  }

  private generateDefaultRatiosAnalysis(data: FinancialRatiosData): AIAnalysisResult {
    const liquidityOk = data.liquidityRatios.currentRatio >= 1.5;
    const profitabilityOk = data.profitabilityRatios.netMargin > 5;
    const riskLevel = (!liquidityOk && !profitabilityOk) ? 'Élevé' : (!liquidityOk || !profitabilityOk) ? 'Modéré' : 'Faible';

    return {
      executiveSummary: `Les ratios financiers montrent ${liquidityOk ? 'une bonne' : 'une'} liquidité (${data.liquidityRatios.currentRatio.toFixed(2)}) et une rentabilité ${profitabilityOk ? 'satisfaisante' : 'à améliorer'} (marge nette: ${data.profitabilityRatios.netMargin.toFixed(1)}%).`,
      financialHealth: `L'analyse des ratios révèle une structure financière ${liquidityOk ? 'solide' : 'sous tension'}. La rentabilité des capitaux propres (ROE) de ${data.profitabilityRatios.roe.toFixed(1)}% ${data.profitabilityRatios.roe > 15 ? 'est excellente' : 'mérite attention'}.`,
      keyStrengths: [
        liquidityOk && 'Bonne liquidité générale',
        profitabilityOk && 'Rentabilité satisfaisante'
      ].filter(Boolean) as string[],
      concernPoints: [
        !liquidityOk && 'Ratio de liquidité sous les normes',
        !profitabilityOk && 'Marge nette faible'
      ].filter(Boolean) as string[],
      recommendations: [
        'Comparer avec les ratios sectoriels',
        'Surveiller l\'évolution trimestrielle',
        'Optimiser la structure financière'
      ],
      riskLevel
    };
  }

  private generateDefaultBudgetVarianceAnalysis(data: BudgetVarianceData): AIAnalysisResult {
    const isOverBudget = data.totalVariance > 0;
    const variancePercent = Math.abs(data.variancePercentage);
    const riskLevel = variancePercent > 20 ? 'Élevé' : variancePercent > 10 ? 'Modéré' : 'Faible';

    return {
      executiveSummary: `Le budget présente un écart ${isOverBudget ? 'défavorable' : 'favorable'} de ${this.formatCurrency(Math.abs(data.totalVariance))} (${Math.abs(data.variancePercentage).toFixed(1)}%).`,
      financialHealth: `L'analyse des écarts budgétaires révèle ${data.majorVariances.length} postes avec des variations significatives. Une révision budgétaire ${variancePercent > 15 ? 'est nécessaire' : 'peut être envisagée'}.`,
      keyStrengths: isOverBudget ?
        ['Analyse en cours'] :
        ['Maîtrise budgétaire', 'Écarts favorables'],
      concernPoints: isOverBudget ?
        ['Dépassements budgétaires significatifs', 'Nécessité d\'actions correctives'] :
        ['Surveillance continue recommandée'],
      recommendations: [
        'Analyser les causes des écarts majeurs',
        'Ajuster les prévisions budgétaires',
        'Mettre en place des alertes sur les dépassements'
      ],
      riskLevel
    };
  }

  private generateDefaultPayablesAnalysis(data: PayablesData): AIAnalysisResult {
    const overduePercent = ((data.overdue30 + data.overdue60 + data.overdue90) / data.totalPayables) * 100;
    const riskLevel = overduePercent > 30 ? 'Élevé' : overduePercent > 15 ? 'Modéré' : 'Faible';

    return {
      executiveSummary: `Les dettes fournisseurs totalisent ${this.formatCurrency(data.totalPayables)} avec un DPO de ${data.dpo.toFixed(0)} jours. ${overduePercent.toFixed(1)}% des dettes sont en retard.`,
      financialHealth: `Le délai moyen de paiement fournisseurs (DPO) de ${data.dpo.toFixed(0)} jours ${data.dpo > 60 ? 'peut impacter les relations commerciales' : 'est correct'}. Le taux de paiement de ${data.paymentRate.toFixed(1)}% ${data.paymentRate < 90 ? 'nécessite une amélioration' : 'est satisfaisant'}.`,
      keyStrengths: data.dpo > 45 ?
        ['Optimisation de la trésorerie', 'DPO favorisant le BFR'] :
        ['Bonnes relations fournisseurs', 'Paiements à jour'],
      concernPoints: overduePercent > 15 ?
        [`${overduePercent.toFixed(1)}% de dettes en retard`, 'Risque de pénalités ou rupture fournisseurs'] :
        ['Aucun point critique'],
      recommendations: [
        'Équilibrer trésorerie et relations fournisseurs',
        'Négocier les conditions de paiement',
        'Prioriser les paiements critiques'
      ],
      riskLevel
    };
  }

  private generateDefaultInventoryAnalysis(data: InventoryData): AIAnalysisResult {
    const obsoletePercent = (data.obsoleteInventory / data.totalInventory) * 100;
    const riskLevel = obsoletePercent > 15 || data.daysInventoryOutstanding > 90 ? 'Élevé' : obsoletePercent > 10 || data.daysInventoryOutstanding > 60 ? 'Modéré' : 'Faible';

    return {
      executiveSummary: `Le stock total s'élève à ${this.formatCurrency(data.totalInventory)} avec une rotation de ${data.inventoryTurnover.toFixed(2)}x par an (${data.daysInventoryOutstanding.toFixed(0)} jours). ${obsoletePercent.toFixed(1)}% du stock est obsolète.`,
      financialHealth: `La rotation des stocks de ${data.inventoryTurnover.toFixed(2)}x ${data.inventoryTurnover > 6 ? 'est excellente' : data.inventoryTurnover > 4 ? 'est correcte' : 'nécessite optimisation'}. Le DIO de ${data.daysInventoryOutstanding.toFixed(0)} jours impacte le BFR.`,
      keyStrengths: data.inventoryTurnover > 6 ?
        ['Excellente rotation des stocks', 'Gestion optimisée du stock'] :
        ['Analyse en cours'],
      concernPoints: [
        obsoletePercent > 10 && `${obsoletePercent.toFixed(1)}% de stock obsolète`,
        data.daysInventoryOutstanding > 60 && 'DIO élevé - immobilisation de trésorerie'
      ].filter(Boolean) as string[],
      recommendations: [
        'Optimiser la rotation des stocks',
        'Déprécier ou liquider le stock obsolète',
        'Ajuster les niveaux de commande'
      ],
      riskLevel
    };
  }

  /**
   * Formate un montant en devise
   */
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value);
  }
}

export const aiReportAnalysisService = AIReportAnalysisService.getInstance();
