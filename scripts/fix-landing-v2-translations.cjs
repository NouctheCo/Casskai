/**
 * Script pour corriger les traductions manquantes de la landing page V2
 * Ajoute toutes les clés de traduction manquantes dans fr.json, en.json et es.json
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');

// Clés de traduction manquantes pour worldMap
const worldMapMissingKeys = {
  description: {
    fr: 'Disponible dans {{countries}} pays avec adaptation automatique aux normes comptables locales',
    en: 'Available in {{countries}} countries with automatic adaptation to local accounting standards',
    es: 'Disponible en {{countries}} países con adaptación automática a las normas contables locales'
  },
  titleHighlight: {
    fr: 'partout dans le monde',
    en: 'worldwide',
    es: 'en todo el mundo'
  },
  accountingStandard: {
    fr: 'Norme comptable',
    en: 'Accounting standard',
    es: 'Norma contable'
  },
  localCurrency: {
    fr: 'Devise locale',
    en: 'Local currency',
    es: 'Moneda local'
  },
  availableFeatures: {
    fr: 'Fonctionnalités disponibles',
    en: 'Available features',
    es: 'Funcionalidades disponibles'
  },
  compliant: {
    fr: 'Conforme aux normes locales',
    en: 'Compliant with local standards',
    es: 'Conforme a las normas locales'
  },
  pause: {
    fr: '⏸️ Pause',
    en: '⏸️ Pause',
    es: '⏸️ Pausa'
  },
  stats: {
    countries: {
      fr: 'Pays supportés',
      en: 'Supported countries',
      es: 'Países soportados'
    },
    standards: {
      fr: 'Normes comptables',
      en: 'Accounting standards',
      es: 'Normas contables'
    },
    currencies: {
      fr: 'Devises',
      en: 'Currencies',
      es: 'Monedas'
    },
    documents: {
      fr: 'Documents légaux',
      en: 'Legal documents',
      es: 'Documentos legales'
    }
  }
};

// Clés manquantes pour testimonials
const testimonialsMissingKeys = {
  description: {
    fr: 'Découvrez les retours de nos premiers utilisateurs qui ont testé CassKai en avant-première',
    en: 'Discover feedback from our first users who tested CassKai in preview',
    es: 'Descubra los comentarios de nuestros primeros usuarios que probaron CassKai en vista previa'
  },
  previous: {
    fr: 'Précédent',
    en: 'Previous',
    es: 'Anterior'
  },
  next: {
    fr: 'Suivant',
    en: 'Next',
    es: 'Siguiente'
  },
  metrics: {
    errorReduction: {
      fr: 'Réduction des erreurs',
      en: 'Error reduction',
      es: 'Reducción de errores'
    }
  },
  stats: {
    betaTesters: {
      fr: 'Beta testeurs',
      en: 'Beta testers',
      es: 'Beta testers'
    },
    countries: {
      fr: 'Pays représentés',
      en: 'Countries represented',
      es: 'Países representados'
    },
    rating: {
      fr: 'Note moyenne',
      en: 'Average rating',
      es: 'Calificación promedio'
    },
    recommend: {
      fr: 'Recommandent CassKai',
      en: 'Recommend CassKai',
      es: 'Recomiendan CassKai'
    }
  },
  items: [
    {
      sector: {
        fr: 'Expertise Comptable',
        en: 'Accounting Firm',
        es: 'Firma de contabilidad'
      },
      country: {
        fr: 'Sénégal',
        en: 'Senegal',
        es: 'Senegal'
      },
      quote: {
        fr: 'CassKai a transformé notre cabinet. Fini les heures de saisie manuelle ! La génération automatique des états SYSCOHADA nous fait gagner 3 jours par mois.',
        en: 'CassKai transformed our firm. No more hours of manual entry! Automatic SYSCOHADA statement generation saves us 3 days per month.',
        es: 'CassKai transformó nuestra firma. ¡No más horas de entrada manual! La generación automática de estados SYSCOHADA nos ahorra 3 días al mes.'
      },
      tags: {
        fr: 'SYSCOHADA, Gain de temps, Automatisation',
        en: 'SYSCOHADA, Time saving, Automation',
        es: 'SYSCOHADA, Ahorro de tiempo, Automatización'
      }
    },
    {
      sector: {
        fr: 'PME - Distribution',
        en: 'SME - Distribution',
        es: 'PYME - Distribución'
      },
      country: {
        fr: 'France',
        en: 'France',
        es: 'Francia'
      },
      quote: {
        fr: 'Interface intuitive, conforme PCG 2025. Mon comptable adore pouvoir accéder aux données en temps réel. Plus de va-et-vient par email !',
        en: 'Intuitive interface, PCG 2025 compliant. My accountant loves being able to access data in real time. No more back-and-forth emails!',
        es: 'Interfaz intuitiva, conforme a PCG 2025. Mi contador adora poder acceder a los datos en tiempo real. ¡No más intercambios de correos!'
      },
      tags: {
        fr: 'PCG 2025, Collaboration, Interface',
        en: 'PCG 2025, Collaboration, Interface',
        es: 'PCG 2025, Colaboración, Interfaz'
      }
    },
    {
      sector: {
        fr: 'Import-Export',
        en: 'Import-Export',
        es: 'Importación-Exportación'
      },
      country: {
        fr: 'Côte d\'Ivoire',
        en: 'Ivory Coast',
        es: 'Costa de Marfil'
      },
      quote: {
        fr: 'Le multi-devises et la conformité SYSCOHADA sont parfaits pour notre activité internationale. Rapprochement bancaire ultra-rapide !',
        en: 'Multi-currency and SYSCOHADA compliance are perfect for our international business. Ultra-fast bank reconciliation!',
        es: 'La multi-moneda y el cumplimiento de SYSCOHADA son perfectos para nuestro negocio internacional. ¡Conciliación bancaria ultra rápida!'
      },
      tags: {
        fr: 'Multi-devises, SYSCOHADA, International',
        en: 'Multi-currency, SYSCOHADA, International',
        es: 'Multi-moneda, SYSCOHADA, Internacional'
      }
    },
    {
      sector: {
        fr: 'Startup Tech',
        en: 'Tech Startup',
        es: 'Startup Tech'
      },
      country: {
        fr: 'France',
        en: 'France',
        es: 'Francia'
      },
      quote: {
        fr: 'Exactement ce qu\'il nous fallait pour démarrer sans se ruiner. L\'IA nous aide à catégoriser les dépenses, on gagne un temps fou !',
        en: 'Exactly what we needed to start without breaking the bank. AI helps us categorize expenses, saving us tons of time!',
        es: '¡Exactamente lo que necesitábamos para comenzar sin arruinarnos! La IA nos ayuda a categorizar gastos, ¡ahorramos mucho tiempo!'
      },
      tags: {
        fr: 'IA, Startup, Catégorisation',
        en: 'AI, Startup, Categorization',
        es: 'IA, Startup, Categorización'
      }
    },
    {
      sector: {
        fr: 'Commerce de détail',
        en: 'Retail',
        es: 'Comercio minorista'
      },
      country: {
        fr: 'Mali',
        en: 'Mali',
        es: 'Mali'
      },
      quote: {
        fr: 'Simple, efficace et adapté au Mali. La connexion bancaire automatique et les rapports SYSCOHADA clairs nous facilitent la vie au quotidien.',
        en: 'Simple, effective, and adapted to Mali. Automatic bank connection and clear SYSCOHADA reports make our daily life easier.',
        es: 'Simple, efectivo y adaptado a Mali. La conexión bancaria automática y los informes SYSCOHADA claros nos facilitan la vida diaria.'
      },
      tags: {
        fr: 'Simplicité, SYSCOHADA, Rapports',
        en: 'Simplicity, SYSCOHADA, Reports',
        es: 'Simplicidad, SYSCOHADA, Informes'
      }
    },
    {
      sector: {
        fr: 'Consulting',
        en: 'Consulting',
        es: 'Consultoría'
      },
      country: {
        fr: 'Maroc',
        en: 'Morocco',
        es: 'Marruecos'
      },
      quote: {
        fr: 'Parfait pour notre cabinet au Maroc. La génération automatique des liasses fiscales SCF/PCM nous évite des heures de travail fastidieux.',
        en: 'Perfect for our firm in Morocco. Automatic SCF/PCM tax return generation saves us hours of tedious work.',
        es: 'Perfecto para nuestro bufete en Marruecos. La generación automática de declaraciones fiscales SCF/PCM nos ahorra horas de trabajo tedioso.'
      },
      tags: {
        fr: 'PCM/SCF, Maghreb, Liasses fiscales',
        en: 'PCM/SCF, Maghreb, Tax returns',
        es: 'PCM/SCF, Magreb, Declaraciones fiscales'
      }
    }
  ]
};

// Clés manquantes pour timeline
const timelineMissingKeys = {
  beforeCasskai: {
    fr: 'AVANT CassKai',
    en: 'BEFORE CassKai',
    es: 'ANTES de CassKai'
  },
  withCasskai: {
    fr: 'AVEC CassKai',
    en: 'WITH CassKai',
    es: 'CON CassKai'
  },
  description: {
    fr: 'Découvrez comment CassKai transforme votre quotidien étape par étape',
    en: 'Discover how CassKai transforms your daily life step by step',
    es: 'Descubra cómo CassKai transforma su vida diaria paso a paso'
  },
  before: {
    fr: 'Avant',
    en: 'Before',
    es: 'Antes'
  },
  after: {
    fr: 'Après',
    en: 'After',
    es: 'Después'
  },
  play: {
    fr: '▶️ Lecture auto',
    en: '▶️ Auto play',
    es: '▶️ Reproducción auto'
  },
  pause: {
    fr: '⏸️ Pause',
    en: '⏸️ Pause',
    es: '⏸️ Pausa'
  },
  previous: {
    fr: 'Précédent',
    en: 'Previous',
    es: 'Anterior'
  },
  next: {
    fr: 'Suivant',
    en: 'Next',
    es: 'Siguiente'
  },
  stats: {
    timeSaved: {
      fr: 'Temps gagné',
      en: 'Time saved',
      es: 'Tiempo ahorrado'
    },
    errors: {
      fr: 'Erreurs de saisie',
      en: 'Input errors',
      es: 'Errores de entrada'
    },
    compliance: {
      fr: 'Conformité',
      en: 'Compliance',
      es: 'Cumplimiento'
    },
    access: {
      fr: 'Accès données',
      en: 'Data access',
      es: 'Acceso a datos'
    }
  },
  items: [
    {
      day: {
        fr: 'Jour 1',
        en: 'Day 1',
        es: 'Día 1'
      },
      before: {
        title: {
          fr: 'Saisie manuelle',
          en: 'Manual entry',
          es: 'Entrada manual'
        },
        description: {
          fr: 'Excel, papiers, double saisie. 2h de travail quotidien.',
          en: 'Excel, papers, double entry. 2h of daily work.',
          es: 'Excel, papeles, doble entrada. 2h de trabajo diario.'
        },
        time: {
          fr: '2h/jour',
          en: '2h/day',
          es: '2h/día'
        }
      },
      after: {
        title: {
          fr: 'Import automatique',
          en: 'Automatic import',
          es: 'Importación automática'
        },
        description: {
          fr: 'Connexion bancaire, OCR factures. Zéro saisie.',
          en: 'Bank connection, invoice OCR. Zero entry.',
          es: 'Conexión bancaria, OCR de facturas. Cero entrada.'
        },
        time: {
          fr: '0 min',
          en: '0 min',
          es: '0 min'
        }
      }
    },
    {
      day: {
        fr: 'Jour 15',
        en: 'Day 15',
        es: 'Día 15'
      },
      before: {
        title: {
          fr: 'Rapprochement bancaire',
          en: 'Bank reconciliation',
          es: 'Conciliación bancaria'
        },
        description: {
          fr: 'Comparaison ligne par ligne. Recherche des écarts.',
          en: 'Line by line comparison. Finding discrepancies.',
          es: 'Comparación línea por línea. Búsqueda de discrepancias.'
        },
        time: {
          fr: '4h',
          en: '4h',
          es: '4h'
        }
      },
      after: {
        title: {
          fr: 'Déjà réconcilié',
          en: 'Already reconciled',
          es: 'Ya conciliado'
        },
        description: {
          fr: 'L\'IA a matché 98% des transactions automatiquement.',
          en: 'AI matched 98% of transactions automatically.',
          es: 'La IA coincidió el 98% de las transacciones automáticamente.'
        },
        time: {
          fr: 'Automatique',
          en: 'Automatic',
          es: 'Automático'
        }
      }
    },
    {
      day: {
        fr: 'Fin de mois',
        en: 'End of month',
        es: 'Fin de mes'
      },
      before: {
        title: {
          fr: 'Clôture urgente',
          en: 'Urgent closing',
          es: 'Cierre urgente'
        },
        description: {
          fr: 'Nuit blanche, stress, erreurs de dernière minute.',
          en: 'All-nighter, stress, last-minute errors.',
          es: 'Noche en blanco, estrés, errores de último minuto.'
        },
        time: {
          fr: 'Nuit blanche',
          en: 'All-nighter',
          es: 'Noche en blanco'
        }
      },
      after: {
        title: {
          fr: 'Clôture en 1 clic',
          en: 'One-click closing',
          es: 'Cierre en 1 clic'
        },
        description: {
          fr: 'Rapport généré, prêt pour validation.',
          en: 'Report generated, ready for validation.',
          es: 'Informe generado, listo para validación.'
        },
        time: {
          fr: '5 min',
          en: '5 min',
          es: '5 min'
        }
      }
    },
    {
      day: {
        fr: 'Trimestre',
        en: 'Quarter',
        es: 'Trimestre'
      },
      before: {
        title: {
          fr: 'Expert-comptable',
          en: 'Accountant',
          es: 'Contador'
        },
        description: {
          fr: 'Envoi des documents, aller-retours, corrections.',
          en: 'Sending documents, back-and-forth, corrections.',
          es: 'Envío de documentos, idas y vueltas, correcciones.'
        },
        time: {
          fr: '2000€',
          en: '2000€',
          es: '2000€'
        }
      },
      after: {
        title: {
          fr: 'Collaboration temps réel',
          en: 'Real-time collaboration',
          es: 'Colaboración en tiempo real'
        },
        description: {
          fr: 'Votre comptable accède en direct. Validation instantanée.',
          en: 'Your accountant accesses live. Instant validation.',
          es: 'Su contador accede en vivo. Validación instantánea.'
        },
        time: {
          fr: 'Inclus',
          en: 'Included',
          es: 'Incluido'
        }
      }
    },
    {
      day: {
        fr: 'Année',
        en: 'Year',
        es: 'Año'
      },
      before: {
        title: {
          fr: 'Bilan annuel',
          en: 'Annual report',
          es: 'Informe anual'
        },
        description: {
          fr: 'Des semaines de préparation, stress fiscal.',
          en: 'Weeks of preparation, tax stress.',
          es: 'Semanas de preparación, estrés fiscal.'
        },
        time: {
          fr: '3 semaines',
          en: '3 weeks',
          es: '3 semanas'
        }
      },
      after: {
        title: {
          fr: 'Liasse fiscale auto',
          en: 'Auto tax return',
          es: 'Declaración fiscal auto'
        },
        description: {
          fr: 'Documents pré-remplis, conformes, prêts à déposer.',
          en: 'Pre-filled documents, compliant, ready to file.',
          es: 'Documentos precargados, conformes, listos para presentar.'
        },
        time: {
          fr: '1 jour',
          en: '1 day',
          es: '1 día'
        }
      }
    }
  ]
};

// Fonction pour merger les traductions
function mergeTranslations(existing, updates, path = 'landing') {
  const merged = { ...existing };

  for (const [key, value] of Object.entries(updates)) {
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      merged[key] = mergeTranslations(merged[key] || {}, value, `${path}.${key}`);
    } else {
      merged[key] = value;
    }
  }

  return merged;
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

    // Ajouter les clés manquantes pour worldMap
    if (!translations.landing.worldMap) {
      translations.landing.worldMap = {};
    }

    Object.keys(worldMapMissingKeys).forEach(key => {
      if (key === 'stats') {
        if (!translations.landing.worldMap.stats) {
          translations.landing.worldMap.stats = {};
        }
        Object.keys(worldMapMissingKeys.stats).forEach(statKey => {
          translations.landing.worldMap.stats[statKey] = worldMapMissingKeys.stats[statKey][locale];
        });
      } else {
        translations.landing.worldMap[key] = worldMapMissingKeys[key][locale];
      }
    });

    // Ajouter les clés manquantes pour testimonials
    if (!translations.landing.testimonials) {
      translations.landing.testimonials = {};
    }

    Object.keys(testimonialsMissingKeys).forEach(key => {
      if (key === 'metrics') {
        if (!translations.landing.testimonials.metrics) {
          translations.landing.testimonials.metrics = {};
        }
        translations.landing.testimonials.metrics.errorReduction = testimonialsMissingKeys.metrics.errorReduction[locale];
      } else if (key === 'stats') {
        if (!translations.landing.testimonials.stats) {
          translations.landing.testimonials.stats = {};
        }
        Object.keys(testimonialsMissingKeys.stats).forEach(statKey => {
          translations.landing.testimonials.stats[statKey] = testimonialsMissingKeys.stats[statKey][locale];
        });
      } else if (key === 'items') {
        translations.landing.testimonials.items = testimonialsMissingKeys.items.map(item => ({
          sector: item.sector[locale],
          country: item.country[locale],
          quote: item.quote[locale],
          tags: item.tags[locale]
        }));
      } else {
        translations.landing.testimonials[key] = testimonialsMissingKeys[key][locale];
      }
    });

    // Ajouter les clés manquantes pour timeline
    if (!translations.landing.timeline) {
      translations.landing.timeline = {};
    }

    Object.keys(timelineMissingKeys).forEach(key => {
      if (key === 'stats') {
        if (!translations.landing.timeline.stats) {
          translations.landing.timeline.stats = {};
        }
        Object.keys(timelineMissingKeys.stats).forEach(statKey => {
          translations.landing.timeline.stats[statKey] = timelineMissingKeys.stats[statKey][locale];
        });
      } else if (key === 'items') {
        translations.landing.timeline.items = timelineMissingKeys.items.map(item => ({
          day: item.day[locale],
          before: {
            title: item.before.title[locale],
            description: item.before.description[locale],
            time: item.before.time[locale]
          },
          after: {
            title: item.after.title[locale],
            description: item.after.description[locale],
            time: item.after.time[locale]
          }
        }));
      } else {
        translations.landing.timeline[key] = timelineMissingKeys[key][locale];
      }
    });

    // Écrire le fichier mis à jour
    fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf-8');
    console.log(`✅ ${locale}.json mis à jour avec succès`);
  }

  console.log('\n✅ Toutes les traductions ont été corrigées avec succès!');
}

// Exécuter le script
try {
  fixTranslations();
} catch (error) {
  console.error('❌ Erreur:', error);
  process.exit(1);
}
