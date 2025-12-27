/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Configuration centralisée pour les services IA
 */

/**
 * Configuration des services IA
 *
 * IMPORTANT: En production, les clés API OpenAI sont utilisées
 * UNIQUEMENT depuis les Supabase Edge Functions (sécurisé), jamais depuis le frontend.
 *
 * En développement, les services peuvent appeler OpenAI directement si VITE_OPENAI_API_KEY
 * est configurée (pour faciliter le développement).
 */

export const AI_CONFIG = {
  // Utilise Edge Functions en production (sécurisé)
  useEdgeFunctions: import.meta.env.PROD,

  // Services activés selon l'environnement
  services: {
    // Assistant conversationnel : utilise Edge Function 'ai-assistant'
    assistant: {
      enabled: true,
      useEdgeFunction: true,
      edgeFunctionName: 'ai-assistant'
    },

    // Analyse des KPI financiers : utilise Edge Function
    kpiAnalysis: {
      enabled: true,
      useEdgeFunction: import.meta.env.PROD, // Edge Function en prod, direct en dev
      edgeFunctionName: 'ai-kpi-analysis'
    },

    // Analyse du dashboard : utilise Edge Function
    dashboardAnalysis: {
      enabled: true,
      useEdgeFunction: import.meta.env.PROD, // Edge Function en prod, direct en dev
      edgeFunctionName: 'ai-dashboard-analysis'
    },

    // Analyse des rapports : utilise Edge Function
    reportAnalysis: {
      enabled: true,
      useEdgeFunction: import.meta.env.PROD, // Edge Function en prod, direct en dev
      edgeFunctionName: 'ai-report-analysis'
    }
  },

  // Configuration OpenAI (uniquement dev)
  openai: {
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 1000
  }
} as const;

/**
 * Vérifie si un service IA est activé
 */
export function isAIServiceEnabled(service: keyof typeof AI_CONFIG.services): boolean {
  return AI_CONFIG.services[service].enabled;
}

/**
 * Vérifie si un service doit utiliser une Edge Function
 */
export function shouldUseEdgeFunction(service: keyof typeof AI_CONFIG.services): boolean {
  return AI_CONFIG.services[service].useEdgeFunction;
}

/**
 * Retourne le nom de la Edge Function pour un service
 */
export function getEdgeFunctionName(service: keyof typeof AI_CONFIG.services): string | null {
  const serviceConfig = AI_CONFIG.services[service];
  return serviceConfig.useEdgeFunction ? serviceConfig.edgeFunctionName : null;
}
