const fs = require('fs');

// Charger le rapport d'audit
const report = JSON.parse(fs.readFileSync('./translation-audit-report.json', 'utf8'));

// Suggestions de traductions basiques (à améliorer manuellement)
const translationSuggestions = {
  // Journal Entries
  'journal_entries.no_enterprise_selected': {
    fr: 'Aucune entreprise sélectionnée',
    en: 'No enterprise selected',
    es: 'Ninguna empresa seleccionada'
  },
  'journal_entries.supabase_not_configured': {
    fr: 'Supabase non configuré',
    en: 'Supabase not configured',
    es: 'Supabase no configurado'
  },
  'journal_entries.network_error': {
    fr: 'Erreur réseau',
    en: 'Network error',
    es: 'Error de red'
  },
  'journal_entries.edit': {
    fr: 'Modifier',
    en: 'Edit',
    es: 'Editar'
  },
  'journal_entries.new': {
    fr: 'Nouvelle écriture',
    en: 'New entry',
    es: 'Nueva entrada'
  },
  'journal_entries.retry': {
    fr: 'Réessayer',
    en: 'Retry',
    es: 'Reintentar'
  },
  'journal_entries.date': {
    fr: 'Date',
    en: 'Date',
    es: 'Fecha'
  },
  'journal_entries.selectDate': {
    fr: 'Sélectionner une date',
    en: 'Select a date',
    es: 'Seleccionar una fecha'
  },
  'journal_entries.journal': {
    fr: 'Journal',
    en: 'Journal',
    es: 'Diario'
  },
  'journal_entries.selectJournal': {
    fr: 'Sélectionner un journal',
    en: 'Select a journal',
    es: 'Seleccionar un diario'
  },
  'journal_entries.no_journals_found': {
    fr: 'Aucun journal trouvé',
    en: 'No journals found',
    es: 'No se encontraron diarios'
  },
  'journal_entries.no_code': {
    fr: 'Pas de code',
    en: 'No code',
    es: 'Sin código'
  },
  'journal_entries.untitledJournal': {
    fr: 'Journal sans titre',
    en: 'Untitled journal',
    es: 'Diario sin título'
  },
  'journal_entries.reference': {
    fr: 'Référence',
    en: 'Reference',
    es: 'Referencia'
  },
  'journal_entries.description': {
    fr: 'Description',
    en: 'Description',
    es: 'Descripción'
  },
  'journal_entries.items': {
    fr: 'Lignes',
    en: 'Items',
    es: 'Líneas'
  },
  'journal_entries.add_item': {
    fr: 'Ajouter une ligne',
    en: 'Add item',
    es: 'Agregar línea'
  },
  'journal_entries.account': {
    fr: 'Compte',
    en: 'Account',
    es: 'Cuenta'
  },
  'journal_entries.debit': {
    fr: 'Débit',
    en: 'Debit',
    es: 'Débito'
  },
  'journal_entries.credit': {
    fr: 'Crédit',
    en: 'Credit',
    es: 'Crédito'
  },
  'journal_entries.no_accounts_found': {
    fr: 'Aucun compte trouvé',
    en: 'No accounts found',
    es: 'No se encontraron cuentas'
  },
  'journal_entries.remove_item': {
    fr: 'Supprimer la ligne',
    en: 'Remove item',
    es: 'Eliminar línea'
  },
  'journal_entries.difference': {
    fr: 'Différence',
    en: 'Difference',
    es: 'Diferencia'
  },
  'journal_entries.balanced': {
    fr: 'Équilibré',
    en: 'Balanced',
    es: 'Equilibrado'
  },
  'journal_entries.unbalanced': {
    fr: 'Déséquilibré',
    en: 'Unbalanced',
    es: 'Desequilibrado'
  },
  'journal_entries.cancel': {
    fr: 'Annuler',
    en: 'Cancel',
    es: 'Cancelar'
  },
  'journal_entries.update': {
    fr: 'Mettre à jour',
    en: 'Update',
    es: 'Actualizar'
  },
  'journal_entries.create': {
    fr: 'Créer',
    en: 'Create',
    es: 'Crear'
  },

  // Common
  'noParent': {
    fr: 'Aucun parent',
    en: 'No parent',
    es: 'Sin padre'
  },
  'currency': {
    fr: 'Devise',
    en: 'Currency',
    es: 'Moneda'
  },
  'close': {
    fr: 'Fermer',
    en: 'Close',
    es: 'Cerrar'
  },
  'pageNotFound': {
    fr: 'Page non trouvée',
    en: 'Page not found',
    es: 'Página no encontrada'
  },
  'goHome': {
    fr: 'Retour à l\'accueil',
    en: 'Go home',
    es: 'Volver al inicio'
  },
  'common.noCompanySelected': {
    fr: 'Aucune entreprise sélectionnée',
    en: 'No company selected',
    es: 'Ninguna empresa seleccionada'
  },
  'common.errors.noCompany': {
    fr: 'Aucune entreprise',
    en: 'No company',
    es: 'Sin empresa'
  },
  'common.actions.cancel': {
    fr: 'Annuler',
    en: 'Cancel',
    es: 'Cancelar'
  },
  'common.actions.saving': {
    fr: 'Enregistrement...',
    en: 'Saving...',
    es: 'Guardando...'
  },
  'common.actions.create': {
    fr: 'Créer',
    en: 'Create',
    es: 'Crear'
  },

  // Auth
  'auth.emailAddress': {
    fr: 'Adresse email',
    en: 'Email address',
    es: 'Dirección de correo'
  },
  'auth.emailPlaceholder': {
    fr: 'votre@email.com',
    en: 'your@email.com',
    es: 'tu@email.com'
  },
  'auth.sending': {
    fr: 'Envoi...',
    en: 'Sending...',
    es: 'Enviando...'
  },
  'auth.sendResetEmail': {
    fr: 'Envoyer l\'email de réinitialisation',
    en: 'Send reset email',
    es: 'Enviar correo de restablecimiento'
  },
  'auth.backToLogin': {
    fr: 'Retour à la connexion',
    en: 'Back to login',
    es: 'Volver al inicio de sesión'
  },

  // Welcome Tour
  'welcomeTour.skip': {
    fr: 'Passer',
    en: 'Skip',
    es: 'Omitir'
  },
  'welcomeTour.previous': {
    fr: 'Précédent',
    en: 'Previous',
    es: 'Anterior'
  },
  'welcomeTour.stepCounter': {
    fr: 'Étape {{current}} sur {{total}}',
    en: 'Step {{current}} of {{total}}',
    es: 'Paso {{current}} de {{total}}'
  },
  'welcomeTour.finish': {
    fr: 'Terminer',
    en: 'Finish',
    es: 'Finalizar'
  },
  'welcomeTour.next': {
    fr: 'Suivant',
    en: 'Next',
    es: 'Siguiente'
  },

  // Validation
  'validation.required': {
    fr: 'Champ obligatoire',
    en: 'Required field',
    es: 'Campo obligatorio'
  },
  'validation.asyncError': {
    fr: 'Erreur de validation',
    en: 'Validation error',
    es: 'Error de validación'
  },
  'validation.formErrors': {
    fr: 'Erreurs dans le formulaire',
    en: 'Form errors',
    es: 'Errores en el formulario'
  },
  'validation.fixErrors': {
    fr: 'Veuillez corriger les erreurs',
    en: 'Please fix the errors',
    es: 'Por favor corrija los errores'
  },
  'validation.unexpectedError': {
    fr: 'Erreur inattendue',
    en: 'Unexpected error',
    es: 'Error inesperado'
  },
  'validation.fieldRequired': {
    fr: 'Ce champ est obligatoire',
    en: 'This field is required',
    es: 'Este campo es obligatorio'
  },
  'validation.string.lengthBetween': {
    fr: 'Doit contenir entre {{min}} et {{max}} caractères',
    en: 'Must be between {{min}} and {{max}} characters',
    es: 'Debe tener entre {{min}} y {{max}} caracteres'
  },
  'validation.string.minLength': {
    fr: 'Doit contenir au moins {{min}} caractères',
    en: 'Must be at least {{min}} characters',
    es: 'Debe tener al menos {{min}} caracteres'
  },
  'validation.string.maxLength': {
    fr: 'Ne doit pas dépasser {{max}} caractères',
    en: 'Must not exceed {{max}} characters',
    es: 'No debe exceder {{max}} caracteres'
  },
  'validation.string.invalidLength': {
    fr: 'Longueur invalide',
    en: 'Invalid length',
    es: 'Longitud inválida'
  },
  'validation.number.between': {
    fr: 'Doit être entre {{min}} et {{max}}',
    en: 'Must be between {{min}} and {{max}}',
    es: 'Debe estar entre {{min}} y {{max}}'
  },
  'validation.number.min': {
    fr: 'Doit être au moins {{min}}',
    en: 'Must be at least {{min}}',
    es: 'Debe ser al menos {{min}}'
  },
  'validation.number.max': {
    fr: 'Ne doit pas dépasser {{max}}',
    en: 'Must not exceed {{max}}',
    es: 'No debe exceder {{max}}'
  },
  'validation.number.invalidRange': {
    fr: 'Valeur hors limites',
    en: 'Value out of range',
    es: 'Valor fuera de rango'
  },
  'validation.fieldMatch': {
    fr: 'Les champs doivent correspondre',
    en: 'Fields must match',
    es: 'Los campos deben coincidir'
  },
  'validation.customFormat': {
    fr: 'Format invalide',
    en: 'Invalid format',
    es: 'Formato inválido'
  }
};

// Générer les fichiers de traduction
function generateTranslations(missingKeys, lang) {
  const translations = {};

  missingKeys.forEach(key => {
    // Ignorer les clés dynamiques
    if (key.includes('${')) {
      return;
    }

    if (translationSuggestions[key]) {
      // Utiliser la suggestion
      const parts = key.split('.');
      let current = translations;

      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }

      current[parts[parts.length - 1]] = translationSuggestions[key][lang];
    } else {
      // Génération automatique basique
      const parts = key.split('.');
      let current = translations;

      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }

      // Traduction par défaut (à remplacer manuellement)
      current[parts[parts.length - 1]] = `[TODO: ${key}]`;
    }
  });

  return translations;
}

// Générer les fichiers
console.log('\n=== GÉNÉRATION DES TRADUCTIONS MANQUANTES ===\n');

const languages = ['fr', 'en', 'es'];

languages.forEach(lang => {
  const missingKeys = report.missing[lang];
  const translations = generateTranslations(missingKeys, lang);

  // Filtrer les clés dynamiques
  const staticKeys = missingKeys.filter(key => !key.includes('${'));
  const dynamicKeys = missingKeys.filter(key => key.includes('${'));

  const outputFile = `./missing-translations-${lang}.json`;
  fs.writeFileSync(outputFile, JSON.stringify(translations, null, 2));

  console.log(`✅ ${lang.toUpperCase()}: ${staticKeys.length} clés générées dans ${outputFile}`);

  if (dynamicKeys.length > 0) {
    console.log(`   ⚠️  ${dynamicKeys.length} clés dynamiques ignorées (à traiter manuellement)`);
  }
});

console.log('\n=== CLÉS DYNAMIQUES À TRAITER MANUELLEMENT ===\n');
const dynamicKeys = report.missing.fr.filter(key => key.includes('${'));
dynamicKeys.forEach(key => {
  console.log(`  - ${key}`);
});

console.log('\n=== STATISTIQUES ===\n');
const staticCount = report.missing.fr.filter(key => !key.includes('${'));
const withSuggestions = staticCount.filter(key => translationSuggestions[key]);
const withoutSuggestions = staticCount.filter(key => !translationSuggestions[key]);

console.log(`Total de clés statiques: ${staticCount.length}`);
console.log(`Avec suggestions: ${withSuggestions.length} (${(withSuggestions.length / staticCount.length * 100).toFixed(1)}%)`);
console.log(`À traduire manuellement: ${withoutSuggestions.length} (${(withoutSuggestions.length / staticCount.length * 100).toFixed(1)}%)`);
console.log(`Clés dynamiques: ${dynamicKeys.length}`);

console.log('\n=== PROCHAINES ÉTAPES ===\n');
console.log('1. Vérifier les fichiers générés:');
console.log('   - missing-translations-fr.json');
console.log('   - missing-translations-en.json');
console.log('   - missing-translations-es.json');
console.log('');
console.log('2. Remplacer les [TODO: xxx] par les vraies traductions');
console.log('');
console.log('3. Fusionner avec les fichiers existants:');
console.log('   node merge-translations.cjs');
console.log('');
console.log('4. Traiter les clés dynamiques manuellement');
console.log('');

console.log('=== GÉNÉRATION TERMINÉE ===\n');
