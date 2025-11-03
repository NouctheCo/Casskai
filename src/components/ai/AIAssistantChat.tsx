import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Send,
  Minimize2,
  Maximize2,
  X,
  Bot,
  User,
  Loader2,
  AlertTriangle,
  TrendingUp,
  FileText,
  Calculator,
  Mic,
  MicOff
} from 'lucide-react';
import { openAIService } from '@/services/ai/OpenAIService';
import { AIAssistantMessage } from '@/types/ai.types';

type SpeechRecognitionEventData = {
  results: ArrayLike<{
    0: { transcript: string };
  }>;
};

interface SpeechRecognitionInstance {
  start: () => void;
  stop: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventData) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface AIAssistantChatProps {
  companyId: string;
  contextType?: 'dashboard' | 'accounting' | 'invoicing' | 'reports' | 'general';
  className?: string;
}

type QuickActionIcon = React.ComponentType<{ className?: string; size?: number | string }>;

interface QuickAction {
  id: string;
  label: string;
  icon: QuickActionIcon;
  query: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'financial_health',
    label: 'Santé financière',
    icon: TrendingUp,
    query: 'Analyse ma situation financière actuelle et donne-moi des conseils',
    color: 'bg-green-500'
  },
  {
    id: 'cash_flow',
    label: 'Trésorerie',
    icon: Calculator,
    query: 'Comment évolue ma trésorerie ? Y a-t-il des risques à prévoir ?',
    color: 'bg-blue-500'
  },
  {
    id: 'tax_tips',
    label: 'Conseils fiscaux',
    icon: FileText,
    query: 'Quelles optimisations fiscales puis-je mettre en place ?',
    color: 'bg-purple-500'
  },
  {
    id: 'anomalies',
    label: 'Vérifier anomalies',
    icon: AlertTriangle,
    query: 'Y a-t-il des transactions suspectes ou inhabituelles récemment ?',
    color: 'bg-orange-500'
  }
];

export const AIAssistantChat: React.FC<AIAssistantChatProps> = ({
  companyId,
  contextType = 'general',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<AIAssistantMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Bonjour ! Je suis CassKai AI, votre assistant intelligent pour la gestion d\'entreprise. Comment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    const Constructor = typeof window !== 'undefined'
      ? window.webkitSpeechRecognition || window.SpeechRecognition
      : undefined;

    if (!Constructor) {
      return;
    }

    const recognition = new Constructor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'fr-FR';

    recognition.onresult = (event) => {
      const firstResult = event.results[0]?.[0];
      if (firstResult?.transcript) {
        setCurrentMessage(firstResult.transcript);
      }
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognitionRef.current = null;
    };
  }, []);

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || currentMessage.trim();
    if (!messageToSend || isLoading) return;

    const userMessage: AIAssistantMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await openAIService.chat({
        query: messageToSend,
        context_type: contextType,
        company_id: companyId
      });

      if (response.success && response.data) {
        const assistantMessage: AIAssistantMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(response.error || 'Erreur lors de la communication avec l\'IA');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorMessage: AIAssistantMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Désolé, je rencontre une difficulté technique. Pouvez-vous réessayer ?',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    handleSendMessage(action.query);
  };

  // Chat Toggle Button
  const ChatToggle = () => (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setIsOpen(true)}
      className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 flex items-center justify-center"
    >
      <MessageCircle size={24} />
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
    </motion.button>
  );

  // Chat Window
  const ChatWindow = () => (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={`fixed bottom-6 right-6 z-50 ${
            isMinimized ? 'w-80 h-14' : 'w-96 h-[600px]'
          } bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="font-semibold">CassKai AI</h3>
                <p className="text-xs opacity-80">Assistant intelligent</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 1 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {quickActions.map((action) => {
                      const IconComponent = action.icon as React.ComponentType<{ className?: string; size?: number | string }>;
                      return (
                      <button
                        key={action.id}
                        onClick={() => handleQuickAction(action)}
                        className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-6 h-6 ${action.color} rounded-full flex items-center justify-center`}>
                            <IconComponent size={14} className="text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{action.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{action.query}</p>
                      </button>
                    );
                    })}
                  </div>
                )}

                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-purple-100 text-purple-600'
                    }`}>
                      {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>

                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white rounded-tr-none'
                        : 'bg-gray-100 text-gray-800 rounded-tl-none'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.error && (
                        <p className="text-xs text-red-500 mt-1">Erreur: {message.error}</p>
                      )}
                      <p className="text-xs opacity-60 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                      <Bot size={16} />
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none">
                      <div className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin text-purple-600" />
                        <span className="text-sm text-gray-600">CassKai AI réfléchit...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Posez votre question..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      disabled={isLoading}
                    />
                    {recognitionRef.current && (
                      <button
                        onClick={toggleVoiceInput}
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                          isListening ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!currentMessage.trim() || isLoading}
                    className="w-10 h-10 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  CassKai AI peut faire des erreurs. Vérifiez les informations importantes.
                </p>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={className}>
      {!isOpen && <ChatToggle />}
      <ChatWindow />
    </div>
  );
};