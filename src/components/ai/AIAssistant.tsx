import React, { useState, useRef, useEffect } from 'react';
import {
  X, Send,
  Sparkles, Loader2, ChevronDown, Plus,
  FileText, Calculator
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { openAIService } from '@/services/ai/OpenAIService';
import { logger } from '@/lib/logger';
interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  type?: 'text' | 'voice';
}
export const AIAssistant: React.FC = () => {
  const _navigate = useNavigate();
  const { user: _user, currentCompany } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      // Appel réel à OpenAI via Edge Function
      const response = await openAIService.chat({
        query: userMessage,
        context_type: 'general',
        company_id: currentCompany?.id
      });
      if (response.success && response.data) {
        const assistantMsg: AIMessage = {
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date().toISOString(),
          type: 'text'
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        throw new Error(response.error || 'Erreur lors de la communication avec l\'IA');
      }
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
    setMessages([]);
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const quickSuggestions = [
    { label: 'Comment créer une facture ?', icon: FileText },
    { label: 'Expliquer le plan comptable', icon: Calculator },
    { label: 'Configurer un workflow', icon: Sparkles },
  ];
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105 transition-all flex items-center justify-center z-50"
        type="button"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    );
  }
  return (
    <div
      className={`fixed bottom-6 right-6 w-96 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 flex flex-col overflow-hidden transition-all duration-300 ${
        isMinimized ? 'h-16' : 'h-[600px] max-h-[80vh]'
      }`}
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
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors dark:bg-gray-800"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors dark:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
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
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-2">
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