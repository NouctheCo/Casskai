import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Lightbulb,
  BookOpen,
  TrendingUp,
  Calculator,
  FileText,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { cn } from '../../../lib/utils';
import { aiAssistantService } from '../../../services/aiAssistantService';
import { Transaction, AIAssistantQuery } from '../../../types/ai.types';

interface AIAssistantChatProps {
  transactions: Transaction[];
  currentBalance: number;
  onQueryProcessed?: (query: AIAssistantQuery, response: string) => void;
  className?: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  queryType?: 'accounting' | 'tax' | 'analysis' | 'general';
  confidence?: number;
  sources?: string[];
  suggestions?: string[];
  isLoading?: boolean;
}

export const AIAssistantChat: React.FC<AIAssistantChatProps> = ({
  transactions,
  currentBalance,
  onQueryProcessed,
  className
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      type: 'assistant',
      content: "Bonjour ! Je suis votre assistant IA financier. Je peux vous aider avec vos questions comptables, fiscales, et d'analyse financière. Comment puis-je vous assister aujourd'hui ?",
      timestamp: new Date(),
      confidence: 1,
      suggestions: [
        "Analyser mes dépenses du mois",
        "Optimiser ma fiscalité",
        "Calculer mes ratios financiers"
      ]
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickQuestions = [
    { icon: TrendingUp, text: "Analyser ma trésorerie", category: "analysis" },
    { icon: Calculator, text: "Calculer la TVA", category: "tax" },
    { icon: FileText, text: "Écritures comptables", category: "accounting" },
    { icon: Lightbulb, text: "Conseils d'optimisation", category: "general" }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    // Ajouter le message utilisateur et un message de chargement
    const loadingMessage: ChatMessage = {
      id: crypto.randomUUID(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      // Appel au service IA
      const result = await aiAssistantService.askQuestion(content, {
        transactions,
        currentBalance,
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours
          end: new Date()
        }
      });

      if (result.success && result.data) {
        const assistantMessage: ChatMessage = {
          id: result.data.id,
          type: 'assistant',
          content: result.data.response,
          timestamp: result.data.timestamp,
          queryType: result.data.type,
          confidence: result.data.confidence,
          sources: result.data.sources,
          suggestions: result.data.suggestions
        };

        // Remplacer le message de chargement
        setMessages(prev => 
          prev.map(msg => msg.isLoading ? assistantMessage : msg)
        );

        // Callback optionnel
        if (onQueryProcessed) {
          onQueryProcessed(result.data, result.data.response);
        }
      } else {
        // Message d'erreur
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          type: 'assistant',
          content: "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer.",
          timestamp: new Date(),
          confidence: 0
        };

        setMessages(prev => 
          prev.map(msg => msg.isLoading ? errorMessage : msg)
        );
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error processing message:', errorMsg);

      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: "Une erreur s'est produite. Veuillez réessayer.",
        timestamp: new Date(),
        confidence: 0
      };

      setMessages(prev => 
        prev.map(msg => msg.isLoading ? errorMessage : msg)
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleFeedback = (messageId: string, positive: boolean) => {
    console.warn('Feedback:', messageId, positive);
    // Ici on pourrait envoyer le feedback au service
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'accounting':
        return <FileText className="w-3 h-3" />;
      case 'tax':
        return <Calculator className="w-3 h-3" />;
      case 'analysis':
        return <TrendingUp className="w-3 h-3" />;
      default:
        return <Bot className="w-3 h-3" />;
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'accounting':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'tax':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'analysis':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'bg-gray-500';
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className={cn("flex flex-col h-[600px]", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Assistant IA Financier</span>
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {aiAssistantService.isEnabled ? 'OpenAI' : 'Mode démo'}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setMessages(messages.slice(0, 1))}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Questions rapides */}
        <div className="flex flex-wrap gap-2 mt-3">
          {quickQuestions.map((question, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleQuickQuestion(question.text)}
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              disabled={isProcessing}
            >
              <question.icon className="w-3 h-3" />
              <span>{question.text}</span>
            </motion.button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Zone de messages */}
        <div className="flex-1 overflow-y-auto pr-4">
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex space-x-3",
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.type === 'assistant' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        {message.isLoading ? (
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        ) : (
                          <Bot className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                  )}

                  <div className={cn(
                    "max-w-[80%] space-y-2",
                    message.type === 'user' ? 'items-end' : 'items-start'
                  )}>
                    <div className={cn(
                      "px-4 py-3 rounded-lg",
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white ml-auto' 
                        : 'bg-gray-100 dark:bg-gray-800'
                    )}>
                      {message.isLoading ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">L'IA réfléchit...</span>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>

                    {/* Métadonnées du message assistant */}
                    {message.type === 'assistant' && !message.isLoading && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{message.timestamp.toLocaleTimeString('fr-FR')}</span>
                          
                          {message.queryType && (
                            <Badge className={cn("border text-xs", getTypeColor(message.queryType))}>
                              {getTypeIcon(message.queryType)}
                              <span className="ml-1 capitalize">{message.queryType}</span>
                            </Badge>
                          )}
                          
                          {message.confidence && (
                            <div className="flex items-center space-x-1">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                getConfidenceColor(message.confidence)
                              )} />
                              <span>Confiance: {(message.confidence * 100).toFixed(0)}%</span>
                            </div>
                          )}
                        </div>

                        {/* Actions du message */}
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyMessage(message.content)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(message.id, true)}
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(message.id, false)}
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Suggestions */}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">Suggestions:</p>
                            <div className="flex flex-wrap gap-1">
                              {message.suggestions.map((suggestion, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sources */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">Sources:</p>
                            <div className="flex flex-wrap gap-1">
                              {message.sources.map((source, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  <BookOpen className="w-2 h-2 mr-1" />
                                  {source}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {message.type === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Zone de saisie */}
        <div className="flex items-center space-x-2 p-2 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Posez votre question financière..."
            className="flex-1 border-0 bg-transparent focus:ring-0 focus:ring-offset-0"
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(inputValue);
              }
            }}
            disabled={isProcessing}
          />
          
          <Button
            size="sm"
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Indicateur de contexte */}
        <div className="text-xs text-gray-500 text-center">
          Contexte: {transactions.length} transactions • Solde: {currentBalance.toLocaleString('fr-FR')}€
        </div>
      </CardContent>
    </Card>
  );
};