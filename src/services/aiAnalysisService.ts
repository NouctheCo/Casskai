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
import { getCurrentCompanyCurrency } from '@/lib/utils';
import { isAIServiceEnabled, shouldUseEdgeFunction, getEdgeFunctionName } from '@/config/ai.config';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
interface FinancialKPIs {
  revenues: number;
  expenses: number;
  netIncome: number;
  profitMargin: number;
  currentRatio: number;
  debtToEquity: number;
  roa: number;
  roe: number;
  revenueGrowth: number;
  inventoryTurnover: number;
  dso: number; // Days Sales Outstanding
  dpo: number; // Days Payable Outstanding
  cashConversionCycle: number;
  currentAssets: number;
  currentLiabilities: number;
}
interface AIAnalysisResult {
  executiveSummary: string;
  financialHealth: string;
  keyStrengths: string[];
  concernPoints: string[];
  recommendations: string[];
  riskLevel: 'Faible' | 'Modéré' | 'Élevé' | 'Critique';
}
class AIAnalysisService {
  private static instance: AIAnalysisService;
  private constructor() {
  }
  static getInstance(): AIAnalysisService {
    if (!this.instance) {
      this.instance = new AIAnalysisService();
    }
    return this.instance;
  }
  /**
   * Génère une analyse IA complète des KPI financiers
   */
  async analyzeFinancialKPIs(kpis: FinancialKPIs, periodStart: string, periodEnd: string, companyId?: string): Promise<AIAnalysisResult> {
    // Vérifier si le service est activé
    if (!isAIServiceEnabled('kpiAnalysis')) {
      logger.warn('AiAnalysis', 'AI KPI Analysis disabled.');
      return this.generateDefaultAnalysis(kpis);
    }
    // Utiliser Edge Function en production (sécurisé)
    if (shouldUseEdgeFunction('kpiAnalysis')) {
      return this.analyzeViaEdgeFunction(kpis, periodStart, periodEnd, companyId);
    }
    // Utiliser l'API backend sécurisée
    if (!isAIServiceEnabled('kpiAnalysis')) {
      logger.warn('AiAnalysis', 'AI KPI Analysis disabled.');
      return this.generateDefaultAnalysis(kpis);
    }
    try {
      const prompt = this.buildAnalysisPrompt(kpis, periodStart, periodEnd);
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `Tu es un expert-comptable et analyste financier senior avec 20 ans d'expérience.
Tu analyses les indicateurs financiers d'une entreprise et fournis des recommandations stratégiques claires et actionnables.
Tes analyses sont professionnelles, précises, et adaptées au contexte français (PCG).
Tu te concentres sur les aspects critiques et fournis des conseils pratiques.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 1500
        })
      });
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      const data = await response.json();
      if (!data.content) {
        return this.generateDefaultAnalysis(kpis);
      }
      return this.parseAIResponse(data.content, kpis);
    } catch (error) {
      logger.error('AiAnalysis', 'Erreur lors de l\'analyse IA:', error);
      return this.generateDefaultAnalysis(kpis);
    }
  }
  /**
   * Analyse via Edge Function Supabase (production)
   */
  private async analyzeViaEdgeFunction(
    kpis: FinancialKPIs,
    periodStart: string,
    periodEnd: string,
    companyId?: string
  ): Promise<AIAnalysisResult> {
    try {
      const edgeFunctionName = getEdgeFunctionName('kpiAnalysis');
      if (!edgeFunctionName) {
        throw new Error('Edge Function not configured');
      }
      // Récupérer company_id depuis le contexte utilisateur si non fourni
      if (!companyId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        // Récupérer la première company de l'utilisateur
        const { data: userCompanies } = await supabase
          .from('user_companies')
          .select('company_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1)
          .single();
        if (!userCompanies) {
          throw new Error('No active company found');
        }
        companyId = userCompanies.company_id;
      }
      const response = await supabase.functions.invoke(edgeFunctionName, {
        body: {
          kpis,
          periodStart,
          periodEnd,
          company_id: companyId
        }
      });
      if (response.error) {
        logger.error('AiAnalysis', 'Edge Function error:', response.error);
        throw new Error(response.error.message || 'Edge Function failed');
      }
      if (!response.data) {
        throw new Error('Empty response from Edge Function');
      }
      return response.data as AIAnalysisResult;
    } catch (error) {
      logger.error('AiAnalysis', 'Error calling Edge Function:', error);
      return this.generateDefaultAnalysis(kpis);
    }
  }
  /**
   * Construit le prompt d'analyse pour l'IA
   */
  private buildAnalysisPrompt(kpis: FinancialKPIs, periodStart: string, periodEnd: string): string {
    return `Analyse les indicateurs financiers suivants pour la période du ${periodStart} au ${periodEnd}:
INDICATEURS FINANCIERS:
- Chiffre d'affaires: ${this.formatCurrency(kpis.revenues)}
- Charges: ${this.formatCurrency(kpis.expenses)}
- Résultat net: ${this.formatCurrency(kpis.netIncome)}
- Marge nette: ${kpis.profitMargin.toFixed(1)}%
- Croissance CA: ${kpis.revenueGrowth.toFixed(1)}%
RATIOS DE LIQUIDITÉ ET SOLVABILITÉ:
- Ratio de liquidité générale: ${kpis.currentRatio.toFixed(2)}
- Ratio d'endettement: ${kpis.debtToEquity.toFixed(2)}
- ROA (Rentabilité des actifs): ${kpis.roa.toFixed(1)}%
- ROE (Rentabilité des capitaux propres): ${kpis.roe.toFixed(1)}%
INDICATEURS OPÉRATIONNELS:
- Rotation des stocks: ${kpis.inventoryTurnover.toFixed(2)} fois
- Délai clients (DSO): ${kpis.dso.toFixed(0)} jours
- Délai fournisseurs (DPO): ${kpis.dpo.toFixed(0)} jours
- Cycle de conversion cash: ${kpis.cashConversionCycle.toFixed(0)} jours
Fournis une analyse structurée au format suivant (STRICT):
## RÉSUMÉ EXÉCUTIF
[2-3 phrases résumant la santé financière globale]
## ANALYSE DE LA SANTÉ FINANCIÈRE
[Paragraphe d'analyse détaillée avec contexte]
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
[Faible/Modéré/Élevé/Critique] - [Justification en 1 phrase]
Sois précis, professionnel et actionnable. Utilise le contexte français (PCG) et les standards comptables.`;
  }
  /**
   * Parse la réponse de l'IA et structure les données
   */
  private parseAIResponse(response: string, kpis: FinancialKPIs): AIAnalysisResult {
    const sections = this.extractSections(response);
    // Déterminer le niveau de risque
    let riskLevel: 'Faible' | 'Modéré' | 'Élevé' | 'Critique' = 'Modéré';
    const riskText = sections.riskLevel.toLowerCase();
    if (riskText.includes('faible')) riskLevel = 'Faible';
    else if (riskText.includes('élevé') || riskText.includes('eleve')) riskLevel = 'Élevé';
    else if (riskText.includes('critique')) riskLevel = 'Critique';
    else if (riskText.includes('modéré') || riskText.includes('modere')) riskLevel = 'Modéré';
    return {
      executiveSummary: sections.executiveSummary || this.getDefaultSummary(kpis),
      financialHealth: sections.financialHealth || this.getDefaultHealthAnalysis(kpis),
      keyStrengths: sections.strengths.length > 0 ? sections.strengths : this.getDefaultStrengths(kpis),
      concernPoints: sections.concerns.length > 0 ? sections.concerns : this.getDefaultConcerns(kpis),
      recommendations: sections.recommendations.length > 0 ? sections.recommendations : this.getDefaultRecommendations(kpis),
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
    // Extraire Résumé Exécutif
    const summaryMatch = text.match(/##\s*RÉSUMÉ EXÉCUTIF\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (summaryMatch) {
      result.executiveSummary = summaryMatch[1].trim();
    }
    // Extraire Santé Financière
    const healthMatch = text.match(/##\s*ANALYSE DE LA SANTÉ FINANCIÈRE\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (healthMatch) {
      result.financialHealth = healthMatch[1].trim();
    }
    // Extraire Points Forts
    const strengthsMatch = text.match(/##\s*POINTS FORTS\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (strengthsMatch) {
      result.strengths = this.extractBulletPoints(strengthsMatch[1]);
    }
    // Extraire Points d'Attention
    const concernsMatch = text.match(/##\s*POINTS D'ATTENTION\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (concernsMatch) {
      result.concerns = this.extractBulletPoints(concernsMatch[1]);
    }
    // Extraire Recommandations
    const recoMatch = text.match(/##\s*RECOMMANDATIONS PRIORITAIRES\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (recoMatch) {
      result.recommendations = this.extractBulletPoints(recoMatch[1]);
    }
    // Extraire Niveau de Risque
    const riskMatch = text.match(/##\s*NIVEAU DE RISQUE\s*\n([\s\S]*?)$/i);
    if (riskMatch) {
      result.riskLevel = riskMatch[1].trim();
    }
    return result;
  }
  /**
   * Extrait les bullet points d'un texte
   */
  private extractBulletPoints(text: string): string[] {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    return lines
      .filter(line => line.match(/^[-•*\d.]/))
      .map(line => line.replace(/^[-•*\d.]\s*/, '').trim())
      .filter(line => line.length > 0);
  }
  /**
   * Génère une analyse par défaut si OpenAI n'est pas disponible
   */
  private generateDefaultAnalysis(kpis: FinancialKPIs): AIAnalysisResult {
    const riskLevel = this.calculateRiskLevel(kpis);
    return {
      executiveSummary: this.getDefaultSummary(kpis),
      financialHealth: this.getDefaultHealthAnalysis(kpis),
      keyStrengths: this.getDefaultStrengths(kpis),
      concernPoints: this.getDefaultConcerns(kpis),
      recommendations: this.getDefaultRecommendations(kpis),
      riskLevel
    };
  }
  /**
   * Calcule le niveau de risque basé sur les KPI
   */
  private calculateRiskLevel(kpis: FinancialKPIs): 'Faible' | 'Modéré' | 'Élevé' | 'Critique' {
    let riskScore = 0;
    // Critères de risque
    if (kpis.profitMargin < 5) riskScore += 2;
    if (kpis.currentRatio < 1.0) riskScore += 3;
    if (kpis.currentRatio < 0.8) riskScore += 2;
    if (kpis.debtToEquity > 2.0) riskScore += 2;
    if (kpis.netIncome < 0) riskScore += 3;
    if (kpis.cashConversionCycle > 90) riskScore += 1;
    if (riskScore >= 7) return 'Critique';
    if (riskScore >= 5) return 'Élevé';
    if (riskScore >= 3) return 'Modéré';
    return 'Faible';
  }
  private getDefaultSummary(kpis: FinancialKPIs): string {
    const margin = kpis.profitMargin;
    const liquidity = kpis.currentRatio;
    if (margin > 10 && liquidity > 1.5) {
      return `L'entreprise présente une situation financière solide avec une marge nette de ${margin.toFixed(1)}% et une liquidité confortable (${liquidity.toFixed(2)}). Les indicateurs suggèrent une gestion saine et une capacité à faire face aux obligations.`;
    } else if (margin > 5 && liquidity > 1.0) {
      return `L'entreprise affiche des résultats satisfaisants avec une marge nette de ${margin.toFixed(1)}%. La liquidité reste correcte (${liquidity.toFixed(2)}). Quelques axes d'amélioration sont à envisager pour optimiser la performance.`;
    } else {
      return `L'entreprise fait face à des défis avec une marge nette de ${margin.toFixed(1)}% et un ratio de liquidité de ${liquidity.toFixed(2)}. Une attention particulière doit être portée à la rentabilité et à la trésorerie.`;
    }
  }
  private getDefaultHealthAnalysis(kpis: FinancialKPIs): string {
    const parts: string[] = [];
    // Analyse rentabilité
    if (kpis.profitMargin > 10) {
      parts.push(`La rentabilité est excellente avec une marge nette de ${kpis.profitMargin.toFixed(1)}%, supérieure aux standards du secteur.`);
    } else if (kpis.profitMargin > 5) {
      parts.push(`La rentabilité est correcte avec une marge nette de ${kpis.profitMargin.toFixed(1)}%, mais peut être améliorée.`);
    } else {
      parts.push(`La rentabilité nécessite une attention prioritaire avec une marge nette de ${kpis.profitMargin.toFixed(1)}%.`);
    }
    // Analyse liquidité
    if (kpis.currentRatio > 1.5) {
      parts.push(`La liquidité est solide (ratio ${kpis.currentRatio.toFixed(2)}), permettant de couvrir confortablement les engagements court terme.`);
    } else if (kpis.currentRatio > 1.0) {
      parts.push(`La liquidité est acceptable (ratio ${kpis.currentRatio.toFixed(2)}), mais mérite surveillance.`);
    } else {
      parts.push(`La liquidité est préoccupante (ratio ${kpis.currentRatio.toFixed(2)}), nécessitant des mesures correctives rapides.`);
    }
    // Analyse endettement
    if (kpis.debtToEquity < 1.0) {
      parts.push(`La structure financière est saine avec un endettement maîtrisé (ratio ${kpis.debtToEquity.toFixed(2)}).`);
    } else if (kpis.debtToEquity < 2.0) {
      parts.push(`L'endettement est modéré (ratio ${kpis.debtToEquity.toFixed(2)}) et reste dans des limites acceptables.`);
    } else {
      parts.push(`L'endettement est élevé (ratio ${kpis.debtToEquity.toFixed(2)}) et nécessite une stratégie de désendettement.`);
    }
    return parts.join(' ');
  }
  private getDefaultStrengths(kpis: FinancialKPIs): string[] {
    const strengths: string[] = [];
    if (kpis.profitMargin > 10) {
      strengths.push(`Excellente rentabilité avec une marge nette de ${kpis.profitMargin.toFixed(1)}%`);
    }
    if (kpis.currentRatio > 1.5) {
      strengths.push(`Liquidité solide garantissant la solvabilité court terme`);
    }
    if (kpis.revenueGrowth > 5) {
      strengths.push(`Croissance dynamique du chiffre d'affaires (+${kpis.revenueGrowth.toFixed(1)}%)`);
    }
    if (kpis.debtToEquity < 1.0) {
      strengths.push(`Structure financière équilibrée avec un faible endettement`);
    }
    if (kpis.roa > 8) {
      strengths.push(`Bonne rentabilité des actifs (ROA ${kpis.roa.toFixed(1)}%)`);
    }
    return strengths.length > 0 ? strengths : ['Stabilité des opérations', 'Respect des obligations comptables'];
  }
  private getDefaultConcerns(kpis: FinancialKPIs): string[] {
    const concerns: string[] = [];
    if (kpis.profitMargin < 5) {
      concerns.push(`Marge nette faible (${kpis.profitMargin.toFixed(1)}%) - Risque sur la viabilité`);
    }
    if (kpis.currentRatio < 1.0) {
      concerns.push(`Liquidité insuffisante - Risque de tensions de trésorerie`);
    }
    if (kpis.debtToEquity > 2.0) {
      concerns.push(`Endettement élevé - Vulnérabilité financière accrue`);
    }
    if (kpis.dso > 60) {
      concerns.push(`Délai de paiement clients trop long (${kpis.dso.toFixed(0)} jours) - Impact sur le BFR`);
    }
    if (kpis.cashConversionCycle > 60) {
      concerns.push(`Cycle de conversion cash long - Besoin en fonds de roulement important`);
    }
    return concerns.length > 0 ? concerns : ['Aucun point critique identifié'];
  }
  private getDefaultRecommendations(kpis: FinancialKPIs): string[] {
    const recommendations: string[] = [];
    if (kpis.profitMargin < 10) {
      recommendations.push('Optimiser la structure de coûts et réviser la politique tarifaire');
    }
    if (kpis.currentRatio < 1.5) {
      recommendations.push('Renforcer la trésorerie et améliorer le recouvrement des créances');
    }
    if (kpis.dso > 45) {
      recommendations.push('Accélérer le recouvrement clients et négocier les conditions de paiement');
    }
    if (kpis.debtToEquity > 1.5) {
      recommendations.push('Mettre en place un plan de désendettement progressif');
    }
    if (kpis.revenueGrowth < 5) {
      recommendations.push('Développer une stratégie de croissance et diversifier les sources de revenus');
    }
    return recommendations.length > 0 ? recommendations : [
      'Maintenir la discipline financière actuelle',
      'Surveiller les indicateurs mensuellement',
      'Optimiser les processus opérationnels'
    ];
  }
  /**
   * Formate un montant en devise
   */
  private formatCurrency(value: number): string {
    const currency = getCurrentCompanyCurrency();
    const isZero = currency === 'XOF' || currency === 'XAF';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: isZero ? 0 : 0,
      maximumFractionDigits: isZero ? 0 : 0
    }).format(value);
  }
}
export const aiAnalysisService = AIAnalysisService.getInstance();
export type { FinancialKPIs, AIAnalysisResult };