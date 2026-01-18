/**
 * Script pour ajouter les traductions manquantes de landing.features, landing.footer et landing.aiChat
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');

// Traductions manquantes pour features
const featuresMissingKeys = {
  description: {
    fr: 'CassKai combine intelligence artificielle, automatisation et conformité pour transformer votre gestion financière',
    en: 'CassKai combines artificial intelligence, automation and compliance to transform your financial management',
    es: 'CassKai combina inteligencia artificial, automatización y cumplimiento para transformar su gestión financiera'
  },
  cta: {
    fr: 'Essayer gratuitement',
    en: 'Try for free',
    es: 'Probar gratis'
  },
  ai: {
    description: {
      fr: 'Notre IA comprend votre comptabilité et vous assiste au quotidien. Posez vos questions en français, obtenez des réponses instantanées.',
      en: 'Our AI understands your accounting and assists you daily. Ask your questions in your language, get instant answers.',
      es: 'Nuestra IA comprende su contabilidad y le asiste diariamente. Haga sus preguntas en su idioma, obtenga respuestas instantáneas.'
    },
    benefits: {
      categorization: {
        fr: 'Catégorisation automatique des transactions',
        en: 'Automatic transaction categorization',
        es: 'Categorización automática de transacciones'
      }
    }
  },
  treasury: {
    description: {
      fr: 'Visualisez vos flux en temps réel, anticipez vos besoins et optimisez votre cash. Multi-banques, multi-devises.',
      en: 'Visualize your flows in real time, anticipate your needs and optimize your cash. Multi-bank, multi-currency.',
      es: 'Visualice sus flujos en tiempo real, anticipe sus necesidades y optimice su efectivo. Multi-banco, multi-moneda.'
    }
  },
  regulatory: {
    description: {
      fr: 'Générez vos déclarations fiscales et sociales en quelques clics. TVA, DSN, liasses fiscales, états SYSCOHADA.',
      en: 'Generate your tax and social declarations in a few clicks. VAT, payroll declarations, tax returns, SYSCOHADA statements.',
      es: 'Genere sus declaraciones fiscales y sociales en pocos clics. IVA, declaraciones de nómina, declaraciones fiscales, estados SYSCOHADA.'
    },
    benefits: {
      tax: {
        fr: 'Liasses fiscales automatisées',
        en: 'Automated tax returns',
        es: 'Declaraciones fiscales automatizadas'
      }
    }
  },
  hr: {
    description: {
      fr: 'Gérez vos collaborateurs de A à Z : contrats, bulletins de paie, congés, notes de frais. Automatisé et conforme.',
      en: 'Manage your employees from A to Z: contracts, payslips, leave, expense reports. Automated and compliant.',
      es: 'Gestione a sus empleados de la A a la Z: contratos, nóminas, permisos, informes de gastos. Automatizado y conforme.'
    }
  },
  analytics: {
    description: {
      fr: 'Des KPIs financiers en temps réel, des graphiques interactifs et des rapports personnalisables pour piloter votre activité.',
      en: 'Real-time financial KPIs, interactive charts and customizable reports to manage your business.',
      es: 'KPIs financieros en tiempo real, gráficos interactivos e informes personalizables para gestionar su negocio.'
    },
    benefits: {
      customizable: {
        fr: 'Dashboard personnalisable',
        en: 'Customizable dashboard',
        es: 'Dashboard personalizable'
      }
    }
  },
  multi: {
    description: {
      fr: 'PCG français, SYSCOHADA, IFRS, SCF Maghreb : CassKai s\'adapte à votre référentiel comptable et à votre pays.',
      en: 'French PCG, SYSCOHADA, IFRS, Maghreb SCF: CassKai adapts to your accounting standard and country.',
      es: 'PCG francés, SYSCOHADA, IFRS, SCF Magreb: CassKai se adapta a su norma contable y país.'
    }
  },
  stats: {
    gdpr: {
      fr: 'Conforme RGPD',
      en: 'GDPR Compliant',
      es: 'Conforme RGPD'
    },
    aiResponse: {
      fr: 'Temps de réponse IA',
      en: 'AI response time',
      es: 'Tiempo de respuesta IA'
    },
    countries: {
      fr: 'Pays supportés',
      en: 'Supported countries',
      es: 'Países soportados'
    },
    availability: {
      fr: 'Disponibilité',
      en: 'Availability',
      es: 'Disponibilidad'
    }
  }
};

// Traductions manquantes pour footer
const footerMissingKeys = {
  description: {
    fr: 'La solution complète de gestion d\'entreprise pour les PME et indépendants.',
    en: 'The complete business management solution for SMEs and freelancers.',
    es: 'La solución completa de gestión empresarial para PYMES y autónomos.'
  },
  sections: {
    product: {
      systemStatus: {
        fr: 'Statut système',
        en: 'System status',
        es: 'Estado del sistema'
      }
    },
    solutions: {
      accounting: {
        fr: 'Cabinets comptables',
        en: 'Accounting firms',
        es: 'Firmas contables'
      }
    }
  }
};

// Traductions manquantes pour aiChat
const aiChatMissingKeys = {
  welcome: {
    fr: 'Bonjour ! 👋 Je suis l\'assistant CassKai. Comment puis-je vous aider aujourd\'hui ?',
    en: 'Hello! 👋 I\'m the CassKai assistant. How can I help you today?',
    es: '¡Hola! 👋 Soy el asistente de CassKai. ¿Cómo puedo ayudarte hoy?'
  },
  needHelp: {
    fr: 'Besoin d\'aide ?',
    en: 'Need help?',
    es: '¿Necesita ayuda?'
  },
  title: {
    fr: 'Assistant CassKai',
    en: 'CassKai Assistant',
    es: 'Asistente CassKai'
  },
  online: {
    fr: 'En ligne',
    en: 'Online',
    es: 'En línea'
  },
  frequentQuestions: {
    fr: 'Questions fréquentes',
    en: 'Frequent questions',
    es: 'Preguntas frecuentes'
  },
  placeholder: {
    fr: 'Posez votre question...',
    en: 'Ask your question...',
    es: 'Haga su pregunta...'
  },
  send: {
    fr: 'Envoyer',
    en: 'Send',
    es: 'Enviar'
  },
  suggestions: [
    {
      fr: 'Quelles sont vos fonctionnalités ?',
      en: 'What are your features?',
      es: '¿Cuáles son sus funcionalidades?'
    },
    {
      fr: 'Combien ça coûte ?',
      en: 'How much does it cost?',
      es: '¿Cuánto cuesta?'
    },
    {
      fr: 'Supportez-vous l\'Afrique ?',
      en: 'Do you support Africa?',
      es: '¿Soportan África?'
    }
  ],
  responses: {
    pricing: {
      fr: '💰 Nos tarifs démarrent à partir de 29€/mois pour le plan Starter. Tous nos plans incluent un essai gratuit de 30 jours sans carte bancaire. Découvrez nos offres sur la page Tarifs !',
      en: '💰 Our pricing starts from €29/month for the Starter plan. All our plans include a 30-day free trial without credit card. Discover our offers on the Pricing page!',
      es: '💰 Nuestros precios comienzan desde €29/mes para el plan Starter. Todos nuestros planes incluyen una prueba gratuita de 30 días sin tarjeta de crédito. ¡Descubra nuestras ofertas en la página de Precios!'
    },
    features: {
      fr: '✨ CassKai offre une suite complète : Comptabilité & Finances, Facturation & CRM, Gestion bancaire, RH & Paie, Gestion de projets, et bien plus. Le tout avec IA intégrée et conformité multi-pays (PCG, SYSCOHADA, IFRS, SCF).',
      en: '✨ CassKai offers a complete suite: Accounting & Finance, Invoicing & CRM, Banking, HR & Payroll, Project Management, and more. All with integrated AI and multi-country compliance (PCG, SYSCOHADA, IFRS, SCF).',
      es: '✨ CassKai ofrece una suite completa: Contabilidad y Finanzas, Facturación y CRM, Banca, RRHH y Nómina, Gestión de Proyectos, y más. Todo con IA integrada y cumplimiento multi-país (PCG, SYSCOHADA, IFRS, SCF).'
    },
    africa: {
      fr: '🌍 Absolument ! CassKai est adapté à l\'Afrique avec le support complet du SYSCOHADA révisé 2017, des devises locales (XOF, XAF, etc.) et plus de 17 pays OHADA. Nous supportons aussi le Maghreb (SCF, PCM).',
      en: '🌍 Absolutely! CassKai is adapted to Africa with full support for revised SYSCOHADA 2017, local currencies (XOF, XAF, etc.) and over 17 OHADA countries. We also support Maghreb (SCF, PCM).',
      es: '🌍 ¡Absolutamente! CassKai está adaptado a África con soporte completo para SYSCOHADA revisado 2017, monedas locales (XOF, XAF, etc.) y más de 17 países OHADA. También soportamos el Magreb (SCF, PCM).'
    },
    france: {
      fr: '🇫🇷 CassKai est 100% conforme aux normes françaises : PCG 2025, facturation électronique, export FEC, déclarations TVA, liasses fiscales automatiques. Conformité RGPD garantie.',
      en: '🇫🇷 CassKai is 100% compliant with French standards: PCG 2025, electronic invoicing, FEC export, VAT declarations, automatic tax returns. GDPR compliance guaranteed.',
      es: '🇫🇷 CassKai es 100% conforme con las normas francesas: PCG 2025, facturación electrónica, exportación FEC, declaraciones de IVA, declaraciones fiscales automáticas. Cumplimiento RGPD garantizado.'
    },
    ai: {
      fr: '🤖 Notre IA vous aide à catégoriser automatiquement les transactions, suggère des écritures comptables, détecte les anomalies en temps réel et répond à vos questions sur votre comptabilité 24/7.',
      en: '🤖 Our AI helps you automatically categorize transactions, suggests accounting entries, detects anomalies in real time and answers your accounting questions 24/7.',
      es: '🤖 Nuestra IA le ayuda a categorizar automáticamente las transacciones, sugiere asientos contables, detecta anomalías en tiempo real y responde a sus preguntas contables 24/7.'
    },
    security: {
      fr: '🔒 Sécurité maximale : données chiffrées AES-256, hébergement sécurisé ISO 27001, sauvegardes automatiques quotidiennes, conformité RGPD stricte. Vos données sont en sécurité avec nous.',
      en: '🔒 Maximum security: AES-256 encrypted data, ISO 27001 secure hosting, daily automatic backups, strict GDPR compliance. Your data is safe with us.',
      es: '🔒 Seguridad máxima: datos cifrados AES-256, alojamiento seguro ISO 27001, copias de seguridad automáticas diarias, cumplimiento estricto de RGPD. Sus datos están seguros con nosotros.'
    },
    demo: {
      fr: '🎯 Démarrez votre essai gratuit de 30 jours dès maintenant ! Aucune carte bancaire requise. Accès immédiat à toutes les fonctionnalités. Support inclus pour vous accompagner.',
      en: '🎯 Start your 30-day free trial now! No credit card required. Immediate access to all features. Support included to assist you.',
      es: '🎯 ¡Comience su prueba gratuita de 30 días ahora! No se requiere tarjeta de crédito. Acceso inmediato a todas las funcionalidades. Soporte incluido para ayudarle.'
    },
    accountant: {
      fr: '👔 CassKai est parfait pour les cabinets comptables : collaboration temps réel avec vos clients, multi-sociétés, accès différenciés, exports conformes, workflow de validation avancé.',
      en: '👔 CassKai is perfect for accounting firms: real-time collaboration with your clients, multi-company, differentiated access, compliant exports, advanced validation workflow.',
      es: '👔 CassKai es perfecto para firmas contables: colaboración en tiempo real con sus clientes, multi-empresa, acceso diferenciado, exportaciones conformes, flujo de validación avanzado.'
    },
    greeting: {
      fr: 'Bonjour ! 👋 Bienvenue chez CassKai. Je suis là pour répondre à toutes vos questions sur notre plateforme de gestion d\'entreprise. N\'hésitez pas à me demander ce que vous voulez savoir !',
      en: 'Hello! 👋 Welcome to CassKai. I\'m here to answer all your questions about our business management platform. Feel free to ask me anything you want to know!',
      es: '¡Hola! 👋 Bienvenido a CassKai. Estoy aquí para responder todas sus preguntas sobre nuestra plataforma de gestión empresarial. ¡No dude en preguntarme lo que quiera saber!'
    },
    default: {
      fr: 'Excellente question ! Pour une réponse précise et personnalisée, je vous invite à nous contacter directement via notre formulaire de contact ou à démarrer votre essai gratuit pour discuter avec notre équipe support. 📧',
      en: 'Great question! For a precise and personalized answer, I invite you to contact us directly via our contact form or start your free trial to chat with our support team. 📧',
      es: '¡Excelente pregunta! Para una respuesta precisa y personalizada, le invito a contactarnos directamente a través de nuestro formulario de contacto o iniciar su prueba gratuita para chatear con nuestro equipo de soporte. 📧'
    }
  }
};

// Fonction pour merger profondément les objets
function deepMerge(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

// Fonction principale
function fixTranslations() {
  const locales = ['fr', 'en', 'es'];

  for (const locale of locales) {
    const filePath = path.join(LOCALES_DIR, `${locale}.json`);

    console.log(`\nTraitement de ${locale}.json...`);

    // Lire le fichier JSON existant
    const content = fs.readFileSync(filePath, 'utf-8');
    const translations = JSON.parse(content);

    // S'assurer que landing existe
    if (!translations.landing) {
      translations.landing = {};
    }

    // Ajouter features
    if (!translations.landing.features) {
      translations.landing.features = {};
    }

    // Merger features.description et features.cta
    translations.landing.features.description = featuresMissingKeys.description[locale];
    translations.landing.features.cta = featuresMissingKeys.cta[locale];

    // Merger les sous-sections de features
    ['ai', 'treasury', 'regulatory', 'hr', 'analytics', 'multi'].forEach(section => {
      if (!translations.landing.features[section]) {
        translations.landing.features[section] = {};
      }

      if (featuresMissingKeys[section]?.description) {
        translations.landing.features[section].description = featuresMissingKeys[section].description[locale];
      }

      if (featuresMissingKeys[section]?.benefits) {
        if (!translations.landing.features[section].benefits) {
          translations.landing.features[section].benefits = {};
        }
        Object.keys(featuresMissingKeys[section].benefits).forEach(benefitKey => {
          translations.landing.features[section].benefits[benefitKey] =
            featuresMissingKeys[section].benefits[benefitKey][locale];
        });
      }
    });

    // Ajouter features.stats
    if (!translations.landing.features.stats) {
      translations.landing.features.stats = {};
    }
    Object.keys(featuresMissingKeys.stats).forEach(statKey => {
      translations.landing.features.stats[statKey] = featuresMissingKeys.stats[statKey][locale];
    });

    // Ajouter footer
    if (!translations.landing.footer) {
      translations.landing.footer = {};
    }
    translations.landing.footer.description = footerMissingKeys.description[locale];

    if (!translations.landing.footer.sections) {
      translations.landing.footer.sections = {};
    }
    if (!translations.landing.footer.sections.product) {
      translations.landing.footer.sections.product = {};
    }
    translations.landing.footer.sections.product.systemStatus =
      footerMissingKeys.sections.product.systemStatus[locale];

    if (!translations.landing.footer.sections.solutions) {
      translations.landing.footer.sections.solutions = {};
    }
    translations.landing.footer.sections.solutions.accounting =
      footerMissingKeys.sections.solutions.accounting[locale];

    // Ajouter aiChat
    if (!translations.landing.aiChat) {
      translations.landing.aiChat = {};
    }

    // Clés simples de aiChat
    ['welcome', 'needHelp', 'title', 'online', 'frequentQuestions', 'placeholder', 'send'].forEach(key => {
      translations.landing.aiChat[key] = aiChatMissingKeys[key][locale];
    });

    // Suggestions
    translations.landing.aiChat.suggestions = aiChatMissingKeys.suggestions.map(s => s[locale]);

    // Responses
    if (!translations.landing.aiChat.responses) {
      translations.landing.aiChat.responses = {};
    }
    Object.keys(aiChatMissingKeys.responses).forEach(responseKey => {
      translations.landing.aiChat.responses[responseKey] = aiChatMissingKeys.responses[responseKey][locale];
    });

    // Écrire le fichier mis à jour
    fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf-8');
    console.log(`✅ ${locale}.json mis à jour avec succès`);
  }

  console.log('\n✅ Toutes les traductions ont été ajoutées avec succès!');
}

// Exécuter le script
try {
  fixTranslations();
} catch (error) {
  console.error('❌ Erreur:', error);
  process.exit(1);
}
