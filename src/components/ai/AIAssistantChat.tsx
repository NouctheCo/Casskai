import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Sparkles, X, MessageCircle, AlertCircle,
  Copy, Check, RefreshCw, ThumbsUp, ThumbsDown, Trash2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { aiService } from '@/services/ai/chatService';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { toastSuccess, toastError } from '@/lib/toast-helpers';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: AIAction[];
  suggestions?: string[];
  feedback?: 'positive' | 'negative' | null;
  isStreaming?: boolean;
}

interface AIAction {
  type: 'navigate' | 'create' | 'search' | 'explain';
  label: string;
  payload?: Record<string, unknown>;
}

interface AIAssistantChatProps {
  contextType?: 'dashboard' | 'accounting' | 'invoicing' | 'reports' | 'general';
  onNavigate?: (path: string) => void;
  className?: string;
  variant?: 'sidebar' | 'modal' | 'embedded';
}

const STORAGE_KEY = 'casskai-ai-chat-history';
const MAX_STORED_MESSAGES = 50;

// Persist messages to localStorage
function saveMessages(messages: Message[]) {
  try {
    const toStore = messages.slice(-MAX_STORED_MESSAGES).map(m => ({
      ...m,
      timestamp: m.timestamp.toISOString(),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // localStorage full or unavailable
  }
}

// Load messages from localStorage
function loadMessages(): Message[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map((m: Record<string, unknown>) => ({
      ...m,
      timestamp: new Date(m.timestamp as string),
      isStreaming: false,
    }));
  } catch {
    return [];
  }
}

// Simple markdown-like rendering (bold, inline code, lists)
function renderMarkdown(content: string) {
  const lines = content.split('\n');
  return lines.map((line, i) => {
    // Bold
    let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Inline code
    processed = processed.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">$1</code>');
    // Bullet list
    if (processed.startsWith('- ') || processed.startsWith('• ')) {
      processed = `<span class="flex gap-2"><span>•</span><span>${processed.slice(2)}</span></span>`;
    }
    // Numbered list
    const numberedMatch = processed.match(/^(\d+)\.\s(.+)/);
    if (numberedMatch) {
      processed = `<span class="flex gap-2"><span class="font-medium">${numberedMatch[1]}.</span><span>${numberedMatch[2]}</span></span>`;
    }

    return (
      <span key={i} className="block" dangerouslySetInnerHTML={{ __html: processed || '&nbsp;' }} />
    );
  });
}

export function AIAssistantChat({
  contextType = 'general',
  onNavigate,
  className,
  variant = 'modal'
}: AIAssistantChatProps) {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => loadMessages());
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist messages
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Streaming-like text effect
  const streamText = useCallback((fullText: string, messageId: string) => {
    let index = 0;
    const chunkSize = 3; // characters per tick
    const interval = setInterval(() => {
      index += chunkSize;
      if (index >= fullText.length) {
        index = fullText.length;
        clearInterval(interval);
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, content: fullText, isStreaming: false } : m
        ));
      } else {
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, content: fullText.slice(0, index) } : m
        ));
      }
    }, 20);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = useCallback(async (text: string, isRetry = false) => {
    if (!text.trim() || isLoading) return;

    if (!isRetry) {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
    }

    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const tempConversationId = 'temp-chat-session';
      const response = await aiService.sendMessage(tempConversationId, text, {
        currentPage: contextType,
        selectedData: { companyId: currentCompany?.id },
      });

      const messageId = `assistant-${Date.now()}`;
      const fullContent = response.message || t('ai.unexpected_error');

      const assistantMessage: Message = {
        id: messageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        actions: response.actions || [],
        suggestions: response.suggestions || [],
        feedback: null,
        isStreaming: true,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Start streaming effect
      streamText(fullContent, messageId);
    } catch (err) {
      logger.error('AIAssistantChat', 'AI chat error:', err);
      const errorMsg = err instanceof TypeError && String(err).includes('fetch')
        ? t('ai.connection_error', { defaultValue: 'Connexion impossible. Vérifiez votre connexion internet.' })
        : t('ai.unexpected_error', { defaultValue: 'Une erreur est survenue. Réessayez dans quelques instants.' });
      setError(errorMsg);

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, contextType, currentCompany?.id, t, streamText]);

  const handleSendMessage = () => sendMessage(inputValue);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleActionClick = (action: AIAction) => {
    if (action.type === 'navigate' && (action.payload?.path as string)) {
      onNavigate?.(action.payload!.path as string);
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toastError(t('common.error', { defaultValue: 'Erreur' }));
    }
  };

  const handleRegenerateResponse = () => {
    // Find last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) return;

    // Remove last assistant message
    setMessages(prev => {
      const lastAssistantIdx = prev.findLastIndex(m => m.role === 'assistant');
      if (lastAssistantIdx >= 0) {
        return prev.filter((_, i) => i !== lastAssistantIdx);
      }
      return prev;
    });

    sendMessage(lastUserMessage.content, true);
  };

  const handleFeedback = (messageId: string, type: 'positive' | 'negative') => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, feedback: m.feedback === type ? null : type } : m
    ));
    if (type === 'positive') {
      toastSuccess(t('ai.feedback_thanks', { defaultValue: 'Merci pour votre retour !' }));
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleRetry = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      setError(null);
      sendMessage(lastUserMessage.content, true);
    }
  };

  // Trigger button for modal/sidebar variants
  if (!isOpen && (variant === 'modal' || variant === 'sidebar')) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-4 right-4 z-50 rounded-full shadow-lg',
          'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700',
          'text-white px-6 py-6 group',
          className
        )}
        aria-label={t('ai.ai_assistant', { defaultValue: 'Assistant IA' })}
      >
        <MessageCircle className="h-6 w-6 mr-2 group-hover:scale-110 transition-transform" />
        <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
      </Button>
    );
  }

  // Chat interface
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 flex flex-col',
        variant === 'modal' && 'fixed bottom-4 right-4 z-50 w-96 h-[600px] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800',
        variant === 'sidebar' && 'w-full h-full',
        variant === 'embedded' && 'w-full h-full',
        className
      )}
      role="dialog"
      aria-label={t('ai.ai_assistant', { defaultValue: 'Assistant IA' })}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-t-xl">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="h-5 w-5" />
          <h3 className="font-semibold font-heading">{t('ai.ai_assistant', { defaultValue: 'Assistant IA' })}</h3>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Beta</span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              aria-label={t('common.clear', { defaultValue: 'Effacer' })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {(variant === 'modal' || variant === 'sidebar') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              aria-label={t('common.action.close', { defaultValue: 'Fermer' })}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
        role="log"
        aria-label={t('ai.conversation', { defaultValue: 'Messages de la conversation' })}
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-purple-500" />
            </div>
            <p className="font-medium text-gray-700 dark:text-gray-300">{t('ai.ai_assistant', { defaultValue: 'Assistant IA CassKai' })}</p>
            <p className="text-sm mt-2 max-w-[250px]">{t('ai.ask_question', { defaultValue: 'Posez-moi une question sur vos données financières' })}</p>

            {/* Quick suggestions */}
            <div className="mt-6 space-y-2 w-full">
              {[
                t('ai.suggestion_revenue', { defaultValue: 'Quel est mon chiffre d\'affaires ce mois ?' }),
                t('ai.suggestion_invoices', { defaultValue: 'Combien de factures sont en retard ?' }),
                t('ai.suggestion_cash', { defaultValue: 'Analyse ma trésorerie' }),
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => { setInputValue(suggestion); inputRef.current?.focus(); }}
                  className="w-full text-left text-sm px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {!currentCompany?.id && (
              <div className="mt-4 flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{t('ai.no_company_selected', { defaultValue: 'Sélectionnez une entreprise' })}</p>
              </div>
            )}
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex group',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-2xl p-3 relative',
                message.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
              )}
            >
              {/* Message content with markdown */}
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {message.role === 'assistant' ? renderMarkdown(message.content) : message.content}
                {message.isStreaming && (
                  <span className="inline-block w-1.5 h-4 bg-current animate-pulse ml-0.5 align-text-bottom" />
                )}
              </div>

              {/* Actions */}
              {message.actions && message.actions.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {message.actions.map((action, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleActionClick(action)}
                      className="w-full justify-start text-left h-8 text-xs"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && !message.isStreaming && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {message.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors border border-white/10"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              <p className="text-[10px] mt-1.5 opacity-50">
                {message.timestamp.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>

              {/* Action buttons for assistant messages */}
              {message.role === 'assistant' && !message.isStreaming && (
                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Copy */}
                  <button
                    onClick={() => handleCopyMessage(message.id, message.content)}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label={t('common.copy', { defaultValue: 'Copier' })}
                    title={t('common.copy', { defaultValue: 'Copier' })}
                  >
                    {copiedId === message.id ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-gray-500" />
                    )}
                  </button>

                  {/* Feedback */}
                  <button
                    onClick={() => handleFeedback(message.id, 'positive')}
                    className={cn(
                      'p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
                      message.feedback === 'positive' && 'bg-green-100 dark:bg-green-900/30'
                    )}
                    aria-label={t('ai.helpful', { defaultValue: 'Utile' })}
                    title={t('ai.helpful', { defaultValue: 'Utile' })}
                  >
                    <ThumbsUp className={cn('h-3.5 w-3.5', message.feedback === 'positive' ? 'text-green-500' : 'text-gray-500')} />
                  </button>
                  <button
                    onClick={() => handleFeedback(message.id, 'negative')}
                    className={cn(
                      'p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
                      message.feedback === 'negative' && 'bg-red-100 dark:bg-red-900/30'
                    )}
                    aria-label={t('ai.not_helpful', { defaultValue: 'Pas utile' })}
                    title={t('ai.not_helpful', { defaultValue: 'Pas utile' })}
                  >
                    <ThumbsDown className={cn('h-3.5 w-3.5', message.feedback === 'negative' ? 'text-red-500' : 'text-gray-500')} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteMessage(message.id)}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ml-auto"
                    aria-label={t('common.delete', { defaultValue: 'Supprimer' })}
                    title={t('common.delete', { defaultValue: 'Supprimer' })}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </div>
              )}

              {/* Delete button for user messages */}
              {message.role === 'user' && (
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDeleteMessage(message.id)}
                    className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    aria-label={t('common.delete', { defaultValue: 'Supprimer' })}
                  >
                    <Trash2 className="h-3 w-3 text-gray-500" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-bl-md p-4 bg-gray-100 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="ai-typing-dot" />
                  <div className="ai-typing-dot" />
                  <div className="ai-typing-dot" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('ai.thinking', { defaultValue: 'Réflexion en cours...' })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error with retry */}
        {error && !isLoading && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm flex-1">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              {t('common.retry', { defaultValue: 'Réessayer' })}
            </Button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Regenerate button */}
      {messages.length > 0 && !isLoading && messages[messages.length - 1]?.role === 'assistant' && (
        <div className="px-4 pb-2">
          <button
            onClick={handleRegenerateResponse}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            {t('ai.regenerate', { defaultValue: 'Régénérer la réponse' })}
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={t('ai.ask_question', { defaultValue: 'Posez votre question...' })}
            disabled={isLoading}
            aria-label={t('ai.ask_question', { defaultValue: 'Posez votre question...' })}
            className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white disabled:opacity-50 text-sm"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl h-10 w-10 p-0"
            aria-label={t('ai.send', { defaultValue: 'Envoyer' })}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-center text-gray-400 mt-2">
          {t('ai.disclaimer', { defaultValue: 'L\'IA peut faire des erreurs. Vérifiez les informations importantes.' })}
        </p>
      </div>
    </div>
  );
}
