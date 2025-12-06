/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

import OpenAI from 'openai';
import type { RealKPIData } from './realDashboardKpiService';

export interface AIAnalysisResult {
  executive_summary: string;
  key_insights: string[];
  strategic_recommendations: string[];
  risk_factors: string[];
  opportunities: string[];
  action_items: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    expected_impact: string;
  }[];
}

/**
 * Service d'analyse IA du dashboard avec OpenAI
 */
export class AIDashboardAnalysisService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true, // Pour utilisation côté client
      });
    } else {
      console.warn('OpenAI API key not configured. AI analysis will be disabled.');
    }
  }

  /**
   * Génère une analyse IA complète des KPIs
   */
  async analyzeKPIs(
    kpiData: RealKPIData,
    companyName: string,
    industryType?: string
  ): Promise<AIAnalysisResult> {
    if (!this.openai) {
      return this.getFallbackAnalysis(kpiData);
    }

    try {
      const prompt = this.buildAnalysisPrompt(kpiData, companyName, industryType);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Utiliser le meilleur modèle disponible
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en contrôle de gestion et analyse financière.
Tu analyses les données financières d'entreprises françaises et fournis des recommandations stratégiques précises et actionnables.
Tu dois répondre en français et structurer ta réponse au format JSON selon le schéma fourni.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('Empty response from OpenAI');
      }

      const analysis = JSON.parse(response) as AIAnalysisResult;
      return analysis;
    } catch (error) {
      console.error('Error analyzing KPIs with OpenAI:', error);
      return this.getFallbackAnalysis(kpiData);
    }
  }

  /**
   * Construit le prompt d'analyse pour OpenAI
   */
  private buildAnalysisPrompt(
    kpiData: RealKPIData,
    companyName: string,
    industryType?: string
  ): string {
    return `
Analyse les données financières suivantes pour l'entreprise "${companyName}"${industryType ? ` dans le secteur ${industryType}` : ''} :

**KPIs Clés:**
- Chiffre d'affaires YTD: ${this.formatCurrency(kpiData.revenue_ytd)}
- Croissance CA: ${kpiData.revenue_growth.toFixed(1)}%
- Marge bénéficiaire: ${kpiData.profit_margin.toFixed(1)}%
- Runway trésorerie: ${kpiData.cash_runway_days} jours
- Solde de trésorerie: ${this.formatCurrency(kpiData.cash_balance)}
- Factures émises: ${kpiData.total_invoices}
- Factures en attente: ${kpiData.pending_invoices}
- Total achats: ${this.formatCurrency(kpiData.total_purchases)}

**Évolution mensuelle du CA:**
${kpiData.monthly_revenue.map((m, i) => `- Mois ${i + 1}: ${this.formatCurrency(m.amount)}`).join('\n')}

**Top 5 clients:**
${kpiData.top_clients.map((c) => `- ${c.name}: ${this.formatCurrency(c.amount)}`).join('\n')}

**Répartition des dépenses:**
${kpiData.expense_breakdown.map((e) => `- ${e.category}: ${this.formatCurrency(e.amount)}`).join('\n')}

Fournis une analyse détaillée au format JSON avec la structure suivante:
{
  "executive_summary": "Résumé exécutif en 2-3 phrases",
  "key_insights": ["Insight 1", "Insight 2", "Insight 3"],
  "strategic_recommendations": ["Recommandation 1", "Recommandation 2", "Recommandation 3"],
  "risk_factors": ["Risque 1", "Risque 2"],
  "opportunities": ["Opportunité 1", "Opportunité 2"],
  "action_items": [
    {
      "priority": "high",
      "action": "Action à prendre",
      "expected_impact": "Impact attendu"
    }
  ]
}

Concentre-toi sur:
1. La santé financière globale
2. Les tendances et signaux d'alerte
3. Les opportunités d'optimisation
4. Des actions concrètes et priorisées
`;
  }

  /**
   * Génère une analyse de secours si OpenAI n'est pas disponible
   */
  private getFallbackAnalysis(kpiData: RealKPIData): AIAnalysisResult {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const risks: string[] = [];
    const opportunities: string[] = [];
    const actionItems: AIAnalysisResult['action_items'] = [];

    // Analyse de la croissance
    if (kpiData.revenue_growth > 10) {
      insights.push(`Forte croissance du CA de ${kpiData.revenue_growth.toFixed(1)}%`);
      opportunities.push('Capitaliser sur la dynamique de croissance pour gagner des parts de marché');
    } else if (kpiData.revenue_growth < 0) {
      insights.push(`Baisse du CA de ${Math.abs(kpiData.revenue_growth).toFixed(1)}%`);
      risks.push('Décroissance du chiffre d\'affaires');
      actionItems.push({
        priority: 'high',
        action: 'Analyser les causes de la baisse et mettre en place un plan de relance commercial',
        expected_impact: 'Stopper la décroissance et relancer la croissance',
      });
    }

    // Analyse de la marge
    if (kpiData.profit_margin < 5) {
      risks.push('Marge bénéficiaire très faible');
      recommendations.push('Optimiser les coûts et revoir la stratégie de pricing');
      actionItems.push({
        priority: 'high',
        action: 'Audit des coûts et renégociation des contrats fournisseurs',
        expected_impact: 'Amélioration de 5-10 points de marge',
      });
    } else if (kpiData.profit_margin > 20) {
      insights.push('Excellente marge bénéficiaire');
      opportunities.push('Réinvestir dans le développement et l\'innovation');
    }

    // Analyse du runway
    if (kpiData.cash_runway_days < 60) {
      risks.push('Runway de trésorerie critique');
      actionItems.push({
        priority: 'high',
        action: 'Accélérer le recouvrement des créances et réduire les délais de paiement',
        expected_impact: 'Augmenter le runway de 30-60 jours',
      });
    } else if (kpiData.cash_runway_days > 180) {
      insights.push('Trésorerie saine et confortable');
      opportunities.push('Envisager des investissements stratégiques');
    }

    // Analyse des factures en attente
    if (kpiData.pending_invoices > kpiData.total_invoices * 0.3) {
      risks.push('Taux élevé de factures en attente');
      recommendations.push('Améliorer le processus de facturation et de relance client');
    }

    const executive_summary = `L'entreprise affiche ${
      kpiData.revenue_growth > 0 ? 'une croissance positive' : 'une baisse'
    } avec une marge de ${kpiData.profit_margin.toFixed(1)}%. ${
      kpiData.cash_runway_days < 60
        ? 'Attention au runway de trésorerie qui nécessite une action immédiate.'
        : 'La trésorerie est dans une situation acceptable.'
    }`;

    return {
      executive_summary,
      key_insights: insights.length > 0 ? insights : ['Analyse détaillée non disponible'],
      strategic_recommendations:
        recommendations.length > 0 ? recommendations : ['Continuer le suivi régulier des KPIs'],
      risk_factors: risks.length > 0 ? risks : ['Aucun risque majeur identifié'],
      opportunities:
        opportunities.length > 0
          ? opportunities
          : ['Poursuivre la stratégie actuelle'],
      action_items:
        actionItems.length > 0
          ? actionItems
          : [
              {
                priority: 'medium',
                action: 'Maintenir un suivi mensuel des indicateurs',
                expected_impact: 'Visibilité continue sur la performance',
              },
            ],
    };
  }

  /**
   * Formate un montant en euros
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  /**
   * Vérifie si OpenAI est configuré
   */
  isConfigured(): boolean {
    return this.openai !== null;
  }
}

// Export singleton instance
export const aiDashboardAnalysisService = new AIDashboardAnalysisService();
