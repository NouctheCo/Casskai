import React, { useState, useEffect } from 'react';
import { MessageCircle, Phone, Zap, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { WHATSAPP_CONFIG, createWhatsAppUrl, isBusinessHoursOpen, getContextualMessage, sendToN8nWebhook } from '@/config/whatsapp.config';

interface WhatsAppChatProps {
  phoneNumber?: string;
  message?: string;
  messageType?: keyof typeof WHATSAPP_CONFIG.messages;
  className?: string;
}

export function WhatsAppChat({
  phoneNumber,
  message,
  messageType = 'support',
  className = ""
}: WhatsAppChatProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);

  const openWhatsApp = async () => {
    const finalMessage = message || getContextualMessage(messageType);
    const whatsappUrl = createWhatsAppUrl(finalMessage, phoneNumber);
    const isOpen = isBusinessHoursOpen();

    // Envoyer les données à N8n en parallèle (ne pas attendre)
    const webhookData = {
      phone: phoneNumber || WHATSAPP_CONFIG.phoneNumber,
      message: finalMessage,
      context: messageType,
      timestamp: new Date().toISOString(),
      user_info: {
        page: window.location.pathname,
        language: i18n.language || 'fr',
        user_agent: navigator.userAgent,
        referrer: document.referrer
      }
    };

    // Envoi asynchrone à N8n (sans bloquer)
    sendToN8nWebhook(webhookData).catch(error => {
      console.warn('N8n webhook failed:', error);
    });

    // Analytics/tracking
    if (WHATSAPP_CONFIG.analytics.trackClicks && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', WHATSAPP_CONFIG.analytics.eventName, {
        event_category: WHATSAPP_CONFIG.analytics.category,
        event_label: messageType,
        business_hours: isOpen,
        n8n_enabled: WHATSAPP_CONFIG.ai.enabled
      });
    }

    // Ouvrir WhatsApp
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    toast({
      title: "Redirection vers WhatsApp",
      description: isOpen
        ? "Ouverture de WhatsApp... Notre équipe vous répondra rapidement !"
        : "Ouverture de WhatsApp... Notre agent IA 24h/7j va vous répondre !"
    });
  };

  return (
    <Button
      onClick={openWhatsApp}
      className={`relative overflow-hidden transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered
          ? 'linear-gradient(135deg, #128C7E 0%, #25D366 100%)'
          : '#25D366'
      }}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      <span className="relative z-10">
        Chat WhatsApp
      </span>

      {isHovered && (
        <div className="absolute inset-0 bg-white/20 animate-pulse dark:bg-gray-800" />
      )}
    </Button>
  );
}

export function WhatsAppFloatingButton({
  phoneNumber,
  className = ""
}: Pick<WhatsAppChatProps, 'phoneNumber' | 'className'>) {
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Détection mobile et gestion du scroll
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', checkIsMobile);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const openWhatsApp = async () => {
    if (isLoading) return;

    setIsLoading(true);
    const messageType = 'general';

    try {
      const finalMessage = getContextualMessage(messageType);
      const whatsappUrl = createWhatsAppUrl(finalMessage, phoneNumber);
      const isOpen = isBusinessHoursOpen();
      // Envoyer les données à N8n en parallèle (ne pas attendre)
      const webhookData = {
        phone: phoneNumber || WHATSAPP_CONFIG.phoneNumber,
        message: finalMessage,
        context: messageType,
        timestamp: new Date().toISOString(),
        user_info: {
          page: window.location.pathname,
          language: i18n.language || 'fr',
          user_agent: navigator.userAgent,
          referrer: document.referrer
        }
      };

      // Envoi asynchrone à N8n (sans bloquer)
      sendToN8nWebhook(webhookData).catch(error => {
        console.warn('N8n webhook failed:', error);
      });

      // Analytics/tracking
      if (WHATSAPP_CONFIG.analytics.trackClicks && typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', WHATSAPP_CONFIG.analytics.eventName, {
          event_category: WHATSAPP_CONFIG.analytics.category,
          event_label: 'floating_button',
          business_hours: isOpen,
          n8n_enabled: WHATSAPP_CONFIG.ai.enabled
        });
      }

      // Ouvrir WhatsApp
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

      toast({
        title: "Redirection vers WhatsApp",
        description: isOpen
          ? "Notre équipe vous répondra rapidement !"
          : "Notre agent IA 24h/7j va vous répondre !"
      });

      // Masquer temporairement le bouton pour éviter les clics multiples
      setIsVisible(false);
      setTimeout(() => setIsVisible(true), 5000);

    } catch (error) {
      console.error('WhatsApp error:', error instanceof Error ? error.message : String(error));
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir WhatsApp. Veuillez réessayer."
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  // Positionnement adaptatif avec styles plus robustes
  const getButtonStyle = () => {
    const baseClasses = "fixed z-[9999] transition-all duration-300";
    const mobileClasses = isMobile
      ? "bottom-4 right-4 sm:bottom-6 sm:right-6"
      : "bottom-6 right-6";

    // Ajuste la position si on scroll vers le bas
    const scrollAdjustment = scrollY > 100 ? "transform scale-90 opacity-90" : "";

    return `${baseClasses} ${mobileClasses} ${scrollAdjustment} ${className}`;
  };

  return (
    <div className={getButtonStyle()}>
      <div className="relative group">
        <Button
          onClick={openWhatsApp}
          onMouseEnter={() => !isMobile && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onTouchStart={() => isMobile && setShowTooltip(true)}
          onTouchEnd={() => isMobile && setTimeout(() => setShowTooltip(false), 2000)}
          disabled={isLoading}
          className={`
            relative ${isMobile ? 'w-14 h-14' : 'w-16 h-16'} rounded-full shadow-xl hover:shadow-2xl
            transition-all duration-500 transform hover:scale-110 active:scale-95
            bg-gradient-to-r from-[#25D366] to-[#128C7E]
            hover:from-[#128C7E] hover:to-[#075E54]
            border-2 border-white dark:border-gray-800
            focus:ring-4 focus:ring-[#25D366]/30 focus:outline-none
            ${isLoading ? 'animate-pulse cursor-not-allowed' : 'cursor-pointer'}
          `}
          style={{
            boxShadow: '0 8px 32px rgba(37, 211, 102, 0.4), 0 4px 16px rgba(0, 0, 0, 0.2)'
          }}
        >
          {isLoading ? (
            <div className={`animate-spin rounded-full border-b-2 border-white ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`}></div>
          ) : (
            <MessageCircle className={`text-white drop-shadow-sm ${isMobile ? 'w-6 h-6' : 'w-7 h-7'}`} />
          )}
        </Button>

        {/* Tooltip amélioré */}
        {showTooltip && !isLoading && (
          <div className="absolute bottom-20 right-0 transform translate-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg px-4 py-2 shadow-xl whitespace-nowrap">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>💬 Chat avec notre agent IA</span>
              </div>
              {/* Flèche */}
              <div className="absolute top-full right-4 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-700"></div>
            </div>
          </div>
        )}

        {/* Animation pulsante subtile */}
        {!isLoading && (
          <div className="absolute inset-0 w-16 h-16 rounded-full bg-[#25D366] animate-ping opacity-20 pointer-events-none"></div>
        )}

        {/* Badge de notification discret */}
        {!isLoading && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm dark:bg-red-900/20">
            <span className="text-[10px] text-white font-bold">!</span>
          </div>
        )}

        {/* Indicateur online */}
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
          <div className="w-2 h-2 bg-white dark:bg-gray-800 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export function WhatsAppSupportCard({
  phoneNumber = "+33123456789",
  className = ""
}: Pick<WhatsAppChatProps, 'phoneNumber' | 'className'>) {
  const { t } = useTranslation();

  return (
    <Card className={`border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center text-green-800 dark:text-green-200">
            <MessageCircle className="w-5 h-5 mr-2" />
            Support WhatsApp
          </CardTitle>
          <Badge variant="outline" className="border-green-300 text-green-700 dark:text-green-400">
            <Zap className="w-3 h-3 mr-1" />
            Agent IA
          </Badge>
        </div>
        <CardDescription className="text-green-700 dark:text-green-300">
          Notre agent IA répond 24h/7j via WhatsApp
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3 text-sm">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>Réponses instantanées avec l'IA</span>
        </div>
        <div className="flex items-center space-x-3 text-sm">
          <Clock className="w-4 h-4 text-green-600" />
          <span>Disponible 24h/7j</span>
        </div>
        <div className="flex items-center space-x-3 text-sm">
          <Phone className="w-4 h-4 text-green-600" />
          <span>Transfert vers un humain si besoin</span>
        </div>

        <WhatsAppChat
          phoneNumber={phoneNumber}
          message="Bonjour ! J'ai besoin d'aide avec CassKai. Pouvez-vous m'assister ?"
          className="w-full mt-4"
        />
      </CardContent>
    </Card>
  );
}
