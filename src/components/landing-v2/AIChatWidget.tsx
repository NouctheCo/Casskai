/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Widget Chat IA flottant pour la landing page
 * Position: milieu droit, défilant avec le scroll, draggable
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}


export function AIChatWidget() {
  const { t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: t('landing.aiChat.welcome'),
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const SMART_RESPONSES: Record<string, string> = {
    'prix|tarif|coût|combien|price|pricing|cost': t('landing.aiChat.responses.pricing'),
    'fonctionnalité|fonction|peut faire|capable|feature|function': t('landing.aiChat.responses.features'),
    'afrique|ohada|syscohada|sénégal|côte|cameroun|africa': t('landing.aiChat.responses.africa'),
    'france|français|pcg|french': t('landing.aiChat.responses.france'),
    'ia|intelligence artificielle|automatique|ai|automatic': t('landing.aiChat.responses.ai'),
    'sécurité|données|rgpd|confidentiel|security|data|privacy': t('landing.aiChat.responses.security'),
    'démo|essai|tester|découvrir|demo|trial|test': t('landing.aiChat.responses.demo'),
    'comptable|expert-comptable|cabinet|accountant': t('landing.aiChat.responses.accountant'),
    'bonjour|salut|hello|coucou|hi': t('landing.aiChat.responses.greeting')
  };

  const DEFAULT_RESPONSE = t('landing.aiChat.responses.default');

  const findBestResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    for (const [keywords, response] of Object.entries(SMART_RESPONSES)) {
      const keywordList = keywords.split('|');
      if (keywordList.some(kw => lowerMessage.includes(kw))) {
        return response;
      }
    }
    return DEFAULT_RESPONSE;
  };

  const suggestedQuestions = [
    t('landing.aiChat.suggestions.0'),
    t('landing.aiChat.suggestions.1'),
    t('landing.aiChat.suggestions.2')
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simuler un délai de réflexion réaliste
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const response = findBestResponse(userMessage.content);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };

    setIsTyping(false);
    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Bouton flottant - Position fixe en bas au centre */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[9999] flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl shadow-blue-500/30 cursor-pointer group hover:shadow-blue-500/50 transition-all duration-300"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium whitespace-nowrap">{t('landing.aiChat.needHelp')}</span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Fenêtre de chat - Position fixe en bas au centre */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: isMinimized ? 'auto' : '600px'
            }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[9999] w-96 max-w-[calc(100vw-3rem)] bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{t('landing.aiChat.title')}</h3>
                  <p className="text-white/70 text-xs flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    {t('landing.aiChat.online')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  {isMinimized ? (
                    <Maximize2 className="w-4 h-4 text-white" />
                  ) : (
                    <Minimize2 className="w-4 h-4 text-white" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Corps du chat */}
            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  {/* Messages */}
                  <div className="h-80 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === 'assistant'
                            ? 'bg-gradient-to-br from-blue-500 to-purple-500'
                            : 'bg-gray-700'
                        }`}>
                          {message.role === 'assistant' ? (
                            <Sparkles className="w-4 h-4 text-white" />
                          ) : (
                            <User className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                          message.role === 'assistant'
                            ? 'bg-gray-800 text-gray-100'
                            : 'bg-blue-600 text-white'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content.split('**').map((part, i) =>
                              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                            )}
                          </p>
                        </div>
                      </motion.div>
                    ))}

                    {/* Indicateur de frappe */}
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-gray-800 rounded-2xl px-4 py-3">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Suggestions rapides */}
                  {messages.length === 1 && (
                    <div className="px-4 pb-2">
                      <p className="text-xs text-gray-500 mb-2">{t('landing.aiChat.frequentQuestions')}</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedQuestions.map((q, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setInput(q);
                              setTimeout(() => handleSend(), 100);
                            }}
                            className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Zone de saisie */}
                  <div className="p-4 border-t border-gray-800">
                    <div className="flex gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={t('landing.aiChat.placeholder')}
                        className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isTyping}
                      />
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={t('landing.aiChat.send')}
                      >
                        {isTyping ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AIChatWidget;
