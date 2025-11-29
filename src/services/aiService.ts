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

// src/services/aiService.ts

import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  type?: 'text' | 'voice';
}

export interface AIConversation {
  id: string;
  company_id: string;
  user_id: string;
  title: string;
  context: string;
  messages: AIMessage[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIResponse {
  message: string;
  suggestions?: string[];
  actions?: AIAction[];
}

export interface AIAction {
  type: 'navigate' | 'create' | 'search' | 'explain';
  label: string;
  payload: any;
}

// =====================================================
// CONFIGURATION
// =====================================================

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_MODEL = 'gpt-4-turbo-preview';

const SYSTEM_PROMPT = `Tu es l'assistant IA de CassKai, une plateforme de gestion financière pour PME et indépendants.

Tu peux aider les utilisateurs à :
- Naviguer dans l'application
- Créer des factures, devis, écritures comptables
- Comprendre leurs données financières
- Configurer des workflows d'automatisation
- Répondre aux questions sur la comptabilité et la gestion

Règles :
- Réponds en français
- Sois concis et pratique
- Propose des actions concrètes quand c'est pertinent
- Si tu ne sais pas, dis-le et suggère de contacter le support`;

// =====================================================
// SERVICE
// =====================================================

class AIService {
  // ----- CONVERSATIONS -----

  async getConversations(userId: string): Promise<AIConversation[]> {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  }

  async getConversation(conversationId: string): Promise<AIConversation | null> {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) throw error;
    return data;
  }

  async createConversation(
    companyId: string,
    userId: string,
    context: string = 'general'
  ): Promise<AIConversation> {
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        company_id: companyId,
        user_id: userId,
        context,
        messages: [],
        title: 'Nouvelle conversation'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('ai_conversations')
      .update({ is_active: false })
      .eq('id', conversationId);

    if (error) throw error;
  }

  // ----- CHAT -----

  async sendMessage(
    conversationId: string,
    userMessage: string,
    context?: {
      currentPage?: string;
      selectedData?: any;
      userPreferences?: any;
    }
  ): Promise<AIResponse> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation non trouvée');

    const userMsg: AIMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    const updatedMessages = [...conversation.messages, userMsg];

    // Si clé API OpenAI configurée, appeler OpenAI
    let aiResponse: AIResponse;
    if (OPENAI_API_KEY) {
      aiResponse = await this.callOpenAI(updatedMessages, context);
    } else {
      // Sinon réponse simulée
      aiResponse = this.simulateResponse(userMessage);
    }

    const assistantMsg: AIMessage = {
      role: 'assistant',
      content: aiResponse.message,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    await supabase
      .from('ai_conversations')
      .update({
        messages: [...updatedMessages, assistantMsg],
        title: this.generateTitle(userMessage, aiResponse.message),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    return aiResponse;
  }

  private async callOpenAI(
    messages: AIMessage[],
    context?: any
  ): Promise<AIResponse> {
    if (!OPENAI_API_KEY) {
      throw new Error('Clé API OpenAI non configurée');
    }

    let systemMessage = SYSTEM_PROMPT;
    if (context?.currentPage) {
      systemMessage += `\n\nL'utilisateur est sur: ${context.currentPage}`;
    }

    const openAIMessages = [
      { role: 'system', content: systemMessage },
      ...messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: openAIMessages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erreur API OpenAI');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return this.parseAIResponse(content);
  }

  private simulateResponse(userMessage: string): AIResponse {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('facture')) {
      return {
        message: 'Pour créer une facture, allez dans le module Facturation puis cliquez sur "Nouvelle facture". Vous pourrez y ajouter vos produits/services, le client et les conditions de paiement.',
        actions: [{
          type: 'navigate',
          label: 'Aller à Facturation',
          payload: { path: '/invoicing' }
        }]
      };
    }

    if (lowerMessage.includes('comptab') || lowerMessage.includes('écriture')) {
      return {
        message: 'La comptabilité dans CassKai fonctionne avec un plan comptable et des journaux. Chaque écriture doit être équilibrée (débit = crédit). Voulez-vous que je vous explique comment créer une écriture ?',
        actions: [{
          type: 'navigate',
          label: 'Aller à Comptabilité',
          payload: { path: '/accounting' }
        }]
      };
    }

    if (lowerMessage.includes('workflow') || lowerMessage.includes('automation')) {
      return {
        message: 'Les workflows d\'automatisation vous permettent de créer des processus automatiques comme l\'envoi de rappels de factures, la génération de rapports mensuels, etc. Voulez-vous explorer les templates disponibles ?',
        actions: [{
          type: 'navigate',
          label: 'Voir les workflows',
          payload: { path: '/automation' }
        }]
      };
    }

    if (lowerMessage.includes('aide') || lowerMessage.includes('help')) {
      return {
        message: 'Je suis là pour vous aider ! Vous pouvez me poser des questions sur :\n- La création de factures et devis\n- La comptabilité et les écritures\n- Les workflows d\'automatisation\n- La navigation dans CassKai\n\nQue voulez-vous savoir ?',
        suggestions: ['Comment créer une facture ?', 'Expliquer le plan comptable', 'Configurer un workflow']
      };
    }

    return {
      message: `J'ai bien reçu votre question : "${userMessage}". Cette fonctionnalité sera bientôt disponible avec l'intégration OpenAI complète. Pour le moment, je peux vous aider avec les factures, la comptabilité et les workflows.`,
      suggestions: ['Créer une facture', 'Voir la documentation', 'Contacter le support']
    };
  }

  private parseAIResponse(content: string): AIResponse {
    const actions: AIAction[] = [];
    const navigationPattern = /aller à|naviguer vers|ouvrir|accéder à/i;
    const createPattern = /créer|ajouter|nouveau|nouvelle/i;

    if (navigationPattern.test(content)) {
      const pages = ['dashboard', 'accounting', 'invoicing', 'banking', 'crm', 'hr'];
      for (const page of pages) {
        if (content.toLowerCase().includes(page)) {
          actions.push({
            type: 'navigate',
            label: `Aller à ${page}`,
            payload: { path: `/${page}` }
          });
        }
      }
    }

    if (createPattern.test(content)) {
      if (content.toLowerCase().includes('facture')) {
        actions.push({
          type: 'create',
          label: 'Créer une facture',
          payload: { entity: 'invoice' }
        });
      }
    }

    return {
      message: content,
      actions: actions.length > 0 ? actions : undefined
    };
  }

  private generateTitle(userMessage: string, aiResponse: string): string {
    const words = userMessage.split(' ').slice(0, 5).join(' ');
    return words.length > 30 ? words.slice(0, 30) + '...' : words;
  }

  // ----- QUICK ACTIONS -----

  async quickAction(action: string): Promise<AIResponse> {
    const quickActions: Record<string, AIResponse> = {
      'help': {
        message: 'Comment puis-je t\'aider avec CassKai aujourd\'hui ?',
        suggestions: ['Créer une facture', 'Voir mes rapports', 'Configurer un workflow']
      },
      'create_invoice': {
        message: 'Pour créer une facture, va dans Facturation > Nouvelle facture. Tu veux que je t\'y emmène ?',
        actions: [{
          type: 'navigate',
          label: 'Aller à Facturation',
          payload: { path: '/invoicing' }
        }]
      },
      'explain_accounting': {
        message: 'La comptabilité dans CassKai fonctionne avec un plan comptable et des journaux. Chaque écriture doit être équilibrée (débit = crédit).',
        actions: [{
          type: 'navigate',
          label: 'Voir le plan comptable',
          payload: { path: '/accounting' }
        }]
      }
    };

    return quickActions[action] || {
      message: 'Je ne comprends pas cette action.',
      suggestions: ['Aide', 'Créer une facture', 'Documentation']
    };
  }
}

export const aiService = new AIService();
