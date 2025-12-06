// Configuration WhatsApp pour CassKai

export const WHATSAPP_CONFIG = {
  // TODO: Remplacez par votre vrai numéro WhatsApp Business
  // Format international : +33123456789 (sans espaces ni tirets)
  phoneNumber: import.meta.env.VITE_WHATSAPP_PHONE || "+33752027198",

  // Messages pré-définis pour différents contextes
  messages: {
    general: "Bonjour ! J'aimerais avoir des informations sur CassKai.",
    documentation: "Bonjour ! J'ai une question sur la documentation de CassKai.",
    support: "Bonjour ! J'ai besoin d'aide avec CassKai.",
    pricing: "Bonjour ! J'aimerais en savoir plus sur les tarifs de CassKai.",
    demo: "Bonjour ! J'aimerais voir une démo de CassKai.",
    trial: "Bonjour ! Comment puis-je commencer mon essai gratuit de CassKai ?",
    billing: "Bonjour ! J'ai une question sur ma facturation CassKai.",
    technical: "Bonjour ! J'ai un problème technique avec CassKai."
  },

  // Configuration de l'agent IA N8n
  ai: {
    enabled: true,
    triggerKeywords: ["aide", "help", "problème", "question", "support"],
    autoResponse: "🤖 Notre agent IA va analyser votre demande et vous répondre dans quelques instants !",
    transferToHuman: "Un membre de notre équipe va prendre le relais.",
    webhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL || "https://n8n.srv782070.hstgr.cloud/webhook/whatsapp-casskai",
  },

  // Heures d'ouverture pour affichage (optionnel)
  businessHours: {
    timezone: "Europe/Paris",
    days: {
      monday: { open: "09:00", close: "18:00" },
      tuesday: { open: "09:00", close: "18:00" },
      wednesday: { open: "09:00", close: "18:00" },
      thursday: { open: "09:00", close: "18:00" },
      friday: { open: "09:00", close: "18:00" },
      saturday: { open: "09:00", close: "12:00" }, // Ouvert
      sunday: null, // Fermé
    }
  },

  // Tracking/Analytics
  analytics: {
    trackClicks: true,
    eventName: 'whatsapp_chat_initiated',
    category: 'engagement'
  }
};

// Fonction utilitaire pour formater le numéro de téléphone
export function formatWhatsAppNumber(phoneNumber: string): string {
  return phoneNumber.replace(/[^0-9]/g, '');
}

// Fonction utilitaire pour créer l'URL WhatsApp
export function createWhatsAppUrl(message: string, phoneNumber?: string): string {
  const phone = phoneNumber || WHATSAPP_CONFIG.phoneNumber;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formatWhatsAppNumber(phone)}?text=${encodedMessage}`;
}

// Fonction pour vérifier si c'est pendant les heures d'ouverture
export function isBusinessHoursOpen(): boolean {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = now.toLocaleTimeString('en-GB', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });

  const dayConfig = WHATSAPP_CONFIG.businessHours.days[currentDay as keyof typeof WHATSAPP_CONFIG.businessHours.days];

  if (!dayConfig) return false; // Fermé ce jour

  return currentTime >= dayConfig.open && currentTime <= dayConfig.close;
}

// Messages contextuels selon l'heure
export function getContextualMessage(context: keyof typeof WHATSAPP_CONFIG.messages = 'general'): string {
  const baseMessage = WHATSAPP_CONFIG.messages[context];
  const isOpen = isBusinessHoursOpen();

  if (!isOpen) {
    return `${baseMessage}\n\nNote: Je vous écris en dehors des heures d'ouverture. Notre agent IA est disponible 24h/7j !`;
  }

  return baseMessage;
}

// Fonction pour envoyer les données à N8n
export async function sendToN8nWebhook(data: {
  phone: string;
  message: string;
  context: string;
  timestamp: string;
  user_info: {
    page: string;
    language: string;
    user_agent?: string;
    referrer?: string;
  }
}): Promise<boolean> {
  if (!WHATSAPP_CONFIG.ai.enabled || !WHATSAPP_CONFIG.ai.webhookUrl) {
    return false;
  }

  try {
    const response = await fetch(WHATSAPP_CONFIG.ai.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        source: 'casskai_website',
        business_hours: isBusinessHoursOpen(),
        config: {
          auto_response: WHATSAPP_CONFIG.ai.autoResponse,
          transfer_keywords: ["humain", "human", "personne", "équipe", "team"]
        }
      })
    });

    return response.ok;
  } catch (error) {
    console.warn('Failed to send to N8n webhook:', error);
    return false;
  }
}
