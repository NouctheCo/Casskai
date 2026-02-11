import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, MessageCircle, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { aiService } from '@/services/ai/chatService';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: AIAction[];
  suggestions?: string[];
}

interface AIAction {
  type: 'navigate' | 'create' | 'search' | 'explain';
  label: string;
  payload?: any;
}

interface AIAssistantChatProps {
  contextType?: 'dashboard' | 'accounting' | 'invoicing' | 'reports' | 'general';
  onNavigate?: (path: string) => void;
  className?: string;
  variant?: 'sidebar' | 'modal' | 'embedded';
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Pour simplifier, on utilise un ID de conversation temporaire
      const tempConversationId = 'temp-chat-session';
      const response = await aiService.sendMessage(tempConversationId, inputValue, {
        currentPage: contextType,
        selectedData: { companyId: currentCompany?.id },
      });

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message || t('ai.unexpected_error'),
        timestamp: new Date(),
        actions: response.actions || [],
        suggestions: response.suggestions || [],
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('AI chat error:', err);
      setError(t('ai.unexpected_error'));
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: t('ai.unexpected_error'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleActionClick = (action: AIAction) => {
    if (action.type === 'navigate' && action.payload?.path) {
      onNavigate?.(action.payload.path);
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  // Trigger button for modal/sidebar variants
  if (!isOpen && (variant === 'modal' || variant === 'sidebar')) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-4 right-4 z-50 rounded-full shadow-lg',
          'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700',
          'text-white px-6 py-6',
          className
        )}
        aria-label={t('ai.ai_assistant')}
      >
        <MessageCircle className="h-6 w-6 mr-2" />
        <Sparkles className="h-5 w-5" />
      </Button>
    );
  }

  // Chat interface
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 flex flex-col',
        variant === 'modal' && 'fixed bottom-4 right-4 z-50 w-96 h-[600px] rounded-lg shadow-2xl border border-gray-200 dark:border-gray-800',
        variant === 'sidebar' && 'w-full h-full',
        variant === 'embedded' && 'w-full h-full',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="h-5 w-5" />
          <h3 className="font-semibold">{t('ai.ai_assistant')}</h3>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="text-white hover:bg-white/20"
            >
              {t('common.clear')}
            </Button>
          )}
          {(variant === 'modal' || variant === 'sidebar') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
            <Sparkles className="h-12 w-12 mb-4 text-purple-500" />
            <p className="font-medium">{t('ai.ai_assistant')}</p>
            <p className="text-sm mt-2">{t('ai.ask_question')}</p>
            {!currentCompany?.id && (
              <div className="mt-4 flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{t('ai.no_company_selected')}</p>
              </div>
            )}
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-lg p-3',
                message.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {/* Actions */}
              {message.actions && message.actions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.actions.map((action, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleActionClick(action)}
                      className="w-full justify-start text-left"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs px-2 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <p className="text-xs mt-2 opacity-70">
                {message.timestamp.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 dark:bg-gray-800">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{t('ai.thinking')}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('ai.ask_question')}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white disabled:opacity-50"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
