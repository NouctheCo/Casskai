import React, { useState, useRef, useEffect } from 'react';
import {
  X, Send,
  Sparkles, Loader2, ChevronDown, Plus,
  FileText, Calculator
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { openAIService } from '@/services/ai/OpenAIService';
import { logger } from '@/lib/logger';

type AssistantContextType = 'dashboard' | 'accounting' | 'invoicing' | 'reports' | 'general';

export interface AIAssistantProps {
  variant?: 'floating' | 'embedded';
  contextType?: AssistantContextType;
  companyId?: string;
  className?: string;
}
interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  type?: 'text' | 'voice';
  sources?: string[];
  sourceItems?: Array<{ label: string; ref: string }>;
  suggestions?: string[];
  actions?: Array<{ type: string; label: string; payload?: any }>;
  confidence?: number;
}

function uniqueStrings(values: Array<string | null | undefined>, max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const v = typeof raw === 'string' ? raw.trim() : '';
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
    if (out.length >= max) break;
  }
  return out;
}

function uniqueActions(
  actions: Array<{ type: string; label: string; payload?: unknown }> | undefined,
  max: number
): Array<{ type: string; label: string; payload?: unknown }> {
  if (!actions?.length) return [];
  const seen = new Set<string>();
  const out: Array<{ type: string; label: string; payload?: unknown }> = [];
  for (const a of actions) {
    const type = typeof a?.type === 'string' ? a.type : '';
    const label = typeof a?.label === 'string' ? a.label : '';
    const path = typeof (a as any)?.payload?.path === 'string' ? String((a as any).payload.path) : '';
    const key = `${type}:${path || label}`.toLowerCase();
    if (!type || !label || seen.has(key)) continue;
    seen.add(key);
    out.push(a);
    if (out.length >= max) break;
  }
  return out;
}

function formatSourceLabel(ref: string): string {
  const last = ref.split(/[/\\]/g).pop() || ref;
  const noExt = last.replace(/\.(md|markdown|txt|pdf|docx?)$/i, '');
  const compact = noExt.replace(/[_-]+/g, ' ').trim();
  return compact.length > 60 ? `${compact.slice(0, 57)}...` : compact;
}

function buildSourceItems(sources: string[] | undefined, max: number): Array<{ label: string; ref: string }> {
  const refs = uniqueStrings(sources || [], max);
  return refs.map((ref) => ({ label: formatSourceLabel(ref), ref }));
}

function createInitialMessages(): AIMessage[] {
  return [
    {
      role: 'assistant',
      content:
        "Bonjour ! Je suis l'assistant CassKai. Pose-moi une question sur CassKai, la facturation, la comptabilité, ou demande une analyse rapide de ta trésorerie.",
      timestamp: new Date().toISOString(),
      type: 'text',
      suggestions: [
        'Comment créer une facture ?',
        'Analyse ma trésorerie sur les 30 derniers jours',
        'Où trouver les paramètres de TVA ?'
      ]
    }
  ];
}
export const AIAssistant: React.FC<AIAssistantProps> = ({
  variant = 'floating',
  contextType = 'general',
  companyId: companyIdProp,
  className = ''
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: _user, currentCompany } = useAuth();
  const isFloating = variant === 'floating';
  const companyId = companyIdProp || currentCompany?.id;

  const [isOpen, setIsOpen] = useState(!isFloating);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>(() => createInitialMessages());
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSourceRef, setSelectedSourceRef] = useState<string | null>(null);
  const [_isListening, _setIsListening] = useState(false);
  const [_isSpeaking, _setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  // Focus sur l'input quand on ouvre
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    if (!companyId) {
      setMessages(prev => ([
        ...prev,
        {
          role: 'assistant',
          content: "Je peux t'aider, mais j'ai besoin qu'une entreprise soit sélectionnée pour contextualiser (sinon l'assistant sera limité).",
          timestamp: new Date().toISOString(),
          type: 'text'
        }
      ]));
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    // Ajouter le message utilisateur
    const tempUserMsg: AIMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
      type: 'text'
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsLoading(true);
    try {
      const history = [...messages, tempUserMsg]
        .filter(m => m.role !== 'system')
        .slice(-16)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await openAIService.chatWithMessages({
        messages: history,
        context: {
          companyId,
          contextType,
          currentPage: `${location.pathname}${location.search || ''}`,
          selectedSourceRef,
          ui: {
            supportsActions: true,
            assistantVariant: variant
          }
        }
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erreur lors de la communication avec l\'IA');
      }

      const assistantText = response.data.message || response.data.response || 'Désolé, je n\'ai pas pu traiter votre demande.';

      const assistantMsg: AIMessage = {
        role: 'assistant',
        content: assistantText,
        timestamp: new Date().toISOString(),
        type: 'text',
        sources: uniqueStrings(response.data.sources || [], 3),
        sourceItems: Array.isArray((response.data as any).sourceItems)
          ? (response.data as any).sourceItems
          : buildSourceItems(response.data.sources || [], 3),
        suggestions: uniqueStrings(response.data.suggestions || [], 4),
        actions: uniqueActions((response.data.actions as any[]) || [], 3),
        confidence: response.data.confidence
      };

      setMessages(prev => [...prev, assistantMsg]);
      setSelectedSourceRef(null);
    } catch (error) {
      const errorMsg: AIMessage = {
        role: 'assistant',
        content: 'Désolé, je rencontre une difficulté technique. Veuillez vérifier que la clé API OpenAI est configurée dans les Secrets Supabase.',
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMsg]);
      logger.error('AIAssistant', 'Erreur AI Assistant:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleNewConversation = () => {
    setMessages(createInitialMessages());
    setSelectedSourceRef(null);
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAction = (action: AIMessage['actions'][number]) => {
    if (!action) return;
    if ((action.type === 'navigate' || action.type === 'create') && action.payload?.path) {
      navigate(action.payload.path);
      return;
    }
    if (action.payload?.query && typeof action.payload.query === 'string') {
      setInputValue(action.payload.query);
      return;
    }
  };
  const quickSuggestions = [
    { label: 'Comment créer une facture ?', icon: FileText },
    { label: 'Expliquer le plan comptable', icon: Calculator },
    { label: 'Configurer un workflow', icon: Sparkles },
  ];

  if (isFloating && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Ouvrir l'assistant"
        title="Ouvrir l'assistant"
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105 transition-all flex items-center justify-center z-50"
        type="button"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    );
  }

  const containerClassName = isFloating
    ? `fixed bottom-6 right-6 w-96 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 flex flex-col overflow-hidden transition-all duration-300 ${
        isMinimized ? 'h-16' : 'h-[600px] max-h-[80vh]'
      }`
    : `w-full bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden ${
        isMinimized ? 'h-16' : 'h-[600px]'
      } ${className}`;

  return (
    <div
      className={containerClassName}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center dark:bg-gray-800">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Assistant CassKai</h3>
            <p className="text-xs text-white/70">IA propulsée par un modèle avancé</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleNewConversation}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors dark:bg-gray-800"
            title="Nouvelle conversation"
            aria-label="Nouvelle conversation"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            aria-label={isMinimized ? 'Agrandir' : 'Réduire'}
            title={isMinimized ? 'Agrandir' : 'Réduire'}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors dark:bg-gray-800"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
          </button>
          {isFloating && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer"
              title="Fermer"
              className="p-2 hover:bg-white/20 rounded-lg transition-colors dark:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-indigo-500" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Comment puis-je vous aider ?
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Je peux vous guider dans CassKai, créer des documents, ou répondre à vos questions.
                </p>
                {/* Suggestions rapides */}
                <div className="space-y-2">
                  {quickSuggestions.map((suggestion, idx) => {
                    const Icon = suggestion.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setInputValue(suggestion.label)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-left transition-colors dark:bg-gray-900/50"
                      >
                        <Icon className="h-4 w-4 text-indigo-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{suggestion.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                  {msg.role === 'assistant' && !!msg.sources?.length && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(msg.sourceItems?.length ? msg.sourceItems.slice(0, 3) : buildSourceItems(msg.sources, 3)).map((item, sIdx) => (
                        <button
                          key={`${idx}-source-${sIdx}-${item.ref}`}
                          type="button"
                          onClick={() => {
                            setSelectedSourceRef(item.ref);
                            setInputValue(`Approfondis en t'appuyant sur la source: ${item.label}`);
                          }}
                          className="text-[11px] px-2 py-1 rounded-full bg-white/70 text-gray-700 border border-gray-200 hover:bg-white transition-colors dark:bg-gray-900/40 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-900"
                          title={item.ref}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.role === 'assistant' && !!msg.actions?.length && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {uniqueActions(msg.actions, 3).map((action, aIdx) => (
                        <button
                          key={`${idx}-action-${aIdx}`}
                          type="button"
                          onClick={() => handleAction(action)}
                          className="text-[12px] px-3 py-1.5 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.role === 'assistant' && !!msg.suggestions?.length && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {uniqueStrings(msg.suggestions, 4).map((s, sIdx) => (
                        <button
                          key={`${idx}-sugg-${sIdx}-${s}`}
                          type="button"
                          onClick={() => setInputValue(s)}
                          className="text-[12px] px-3 py-1.5 rounded-full bg-white/70 text-gray-700 border border-gray-200 hover:bg-white transition-colors dark:bg-gray-900/40 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-900"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  <p className={`text-xs mt-1 ${
                    msg.role === 'user' ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Input */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Posez votre question..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Propulsé par l'IA • Les réponses peuvent contenir des erreurs
            </p>
          </div>
        </>
      )}
    </div>
  );
};
export default AIAssistant;