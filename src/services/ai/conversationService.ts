/**
 * CassKai - Service de persistance des conversations IA
 * Sauvegarde et restaure l'historique du chat utilisateur
 * 
 * Fonctionnalité: L'utilisateur ne perd jamais son contexte
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  metadata?: {
    sources?: string[];
    suggestions?: string[];
    confidence?: number;
    [key: string]: any;
  };
}

export interface Conversation {
  id: string;
  company_id: string;
  user_id: string;
  title: string;
  context_type: 'dashboard' | 'accounting' | 'invoicing' | 'reports' | 'general';
  message_count: number;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

/**
 * Service de gestion des conversations persistantes
 */
class ConversationService {
  /**
   * Crée une nouvelle conversation
   */
  async createConversation(
    companyId: string,
    userId: string,
    contextType: Conversation['context_type'] = 'general'
  ): Promise<Conversation | null> {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          company_id: companyId,
          user_id: userId,
          title: `Conversation ${new Date().toLocaleString('fr-FR')}`,
          context_type: contextType,
          message_count: 0,
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('[ConversationService] Create error:', error);
        return null;
      }

      logger.info('[ConversationService] Conversation created:', data.id);
      return data;
    } catch (error) {
      logger.error('[ConversationService] Create exception:', error);
      return null;
    }
  }

  /**
   * Récupère les conversations de l'utilisateur
   */
  async getConversations(
    companyId: string,
    userId: string,
    limit: number = 20,
    archived: boolean = false
  ): Promise<Conversation[]> {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .eq('is_archived', archived)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('[ConversationService] Get conversations error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('[ConversationService] Get conversations exception:', error);
      return [];
    }
  }

  /**
   * Récupère une conversation avec tous ses messages
   */
  async getConversationWithMessages(conversationId: string): Promise<{
    conversation: Conversation | null;
    messages: ChatMessage[];
  }> {
    try {
      const { data: conversation, error: convError } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) {
        logger.error('[ConversationService] Get conversation error:', convError);
        return { conversation: null, messages: [] };
      }

      const { data: messages, error: msgError } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) {
        logger.error('[ConversationService] Get messages error:', msgError);
        return { conversation, messages: [] };
      }

      return {
        conversation,
        messages: messages || [],
      };
    } catch (error) {
      logger.error('[ConversationService] Get conversation exception:', error);
      return { conversation: null, messages: [] };
    }
  }

  /**
   * Ajoute un message à une conversation
   */
  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: ChatMessage['metadata']
  ): Promise<ChatMessage | null> {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          metadata,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('[ConversationService] Add message error:', error);
        return null;
      }

      // Mettre à jour updated_at et message_count de la conversation
      await supabase
        .from('ai_conversations')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      logger.info('[ConversationService] Message added:', data.id);
      return data;
    } catch (error) {
      logger.error('[ConversationService] Add message exception:', error);
      return null;
    }
  }

  /**
   * Met à jour le titre d'une conversation (auto-généré avec IA)
   */
  async updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) {
        logger.error('[ConversationService] Update title error:', error);
        return false;
      }

      logger.info('[ConversationService] Conversation title updated');
      return true;
    } catch (error) {
      logger.error('[ConversationService] Update title exception:', error);
      return false;
    }
  }

  /**
   * Archive une conversation
   */
  async archiveConversation(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({
          is_archived: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) {
        logger.error('[ConversationService] Archive error:', error);
        return false;
      }

      logger.info('[ConversationService] Conversation archived');
      return true;
    } catch (error) {
      logger.error('[ConversationService] Archive exception:', error);
      return false;
    }
  }

  /**
   * Restaure une conversation archivée
   */
  async unarchiveConversation(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({
          is_archived: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) {
        logger.error('[ConversationService] Unarchive error:', error);
        return false;
      }

      logger.info('[ConversationService] Conversation unarchived');
      return true;
    } catch (error) {
      logger.error('[ConversationService] Unarchive exception:', error);
      return false;
    }
  }

  /**
   * Supprime une conversation ET tous ses messages
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      // Supprimer les messages d'abord (cascade)
      const { error: msgError } = await supabase
        .from('ai_messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (msgError) {
        logger.error('[ConversationService] Delete messages error:', msgError);
        return false;
      }

      // Puis supprimer la conversation
      const { error: convError } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId);

      if (convError) {
        logger.error('[ConversationService] Delete conversation error:', convError);
        return false;
      }

      logger.info('[ConversationService] Conversation deleted');
      return true;
    } catch (error) {
      logger.error('[ConversationService] Delete exception:', error);
      return false;
    }
  }

  /**
   * Récupère les statistiques de conversations pour un utilisateur
   */
  async getConversationStats(companyId: string, userId: string): Promise<{
    totalConversations: number;
    totalMessages: number;
    avgMessagesPerConversation: number;
    lastConversationDate: string | null;
  }> {
    try {
      // Conversations
      const { data: convs, error: convError } = await supabase
        .from('ai_conversations')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .eq('is_archived', false);

      if (convError) {
        logger.error('[ConversationService] Stats error:', convError);
        return {
          totalConversations: 0,
          totalMessages: 0,
          avgMessagesPerConversation: 0,
          lastConversationDate: null,
        };
      }

      const totalConversations = convs?.length || 0;

      // Messages total
      const { data: messages, error: msgError } = await supabase
        .from('ai_messages')
        .select('conversation_id')
        .in('conversation_id', convs?.map((c) => c.id) || []);

      if (msgError) {
        logger.error('[ConversationService] Messages count error:', msgError);
        return {
          totalConversations,
          totalMessages: 0,
          avgMessagesPerConversation: 0,
          lastConversationDate: null,
        };
      }

      const totalMessages = messages?.length || 0;

      // Dernière conversation
      const { data: lastConv, error: lastError } = await supabase
        .from('ai_conversations')
        .select('updated_at')
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (lastError) {
        logger.error('[ConversationService] Last conversation error:', lastError);
      }

      return {
        totalConversations,
        totalMessages,
        avgMessagesPerConversation: totalConversations > 0 ? totalMessages / totalConversations : 0,
        lastConversationDate: lastConv?.updated_at || null,
      };
    } catch (error) {
      logger.error('[ConversationService] Stats exception:', error);
      return {
        totalConversations: 0,
        totalMessages: 0,
        avgMessagesPerConversation: 0,
        lastConversationDate: null,
      };
    }
  }
}

export const conversationService = new ConversationService();
