/**
 * CassKai - Contenu d'aide contextuelle
 *
 * Centralise tous les textes d'aide pour les tooltips et bannières
 * Ces contenus sont également disponibles dans les fichiers de traduction i18n
 */

// ============================================================================
// CLÔTURE COMPTABLE
// ============================================================================

export const periodClosureHelp = {
  // Clôture de période
  closePeriod: {
    title: 'Clôture de période comptable',
    description: 'La clôture verrouille définitivement les écritures de la période et génère automatiquement le résultat de l\'exercice.',
    details: 'Une fois clôturée, aucune modification ne sera possible sur les écritures de cette période. Les écritures à-nouveaux seront générées automatiquement pour la période suivante.',
    tips: [
      'Vérifiez que toutes les écritures sont validées avant la clôture',
      'Assurez-vous que le lettrage clients/fournisseurs est à jour',
      'Conservez une copie de sauvegarde avant clôture',
    ],
  },

  // Réouverture
  reopenPeriod: {
    title: 'Réouverture de période',
    description: 'Permet de modifier des écritures après clôture. Cette action est tracée et nécessite une justification.',
    details: 'La réouverture supprime l\'écriture de clôture et les à-nouveaux générés. Vous devrez re-clôturer après corrections.',
    tips: [
      'Utilisez uniquement en cas d\'erreur importante',
      'Documentez la raison de la réouverture',
      'Re-clôturez dès que les corrections sont terminées',
    ],
  },

  // Validation pré-clôture
  preClosureValidation: {
    title: 'Validation pré-clôture',
    description: 'Vérifie que la période peut être clôturée : pas de brouillons, équilibre comptable correct, lettrage à jour.',
    details: 'Les écritures en brouillon doivent être validées ou supprimées. Les écritures non lettrées seront signalées mais ne bloquent pas la clôture.',
  },

  // Validation (alias pour le composant PeriodClosurePanel)
  validation: {
    title: 'État de la validation',
    description: 'Synthèse des vérifications pré-clôture : équilibre comptable, écritures en brouillon, lettrage.',
    details: 'Tous les indicateurs doivent être au vert pour procéder à la clôture. Les avertissements (warnings) n\'empêchent pas la clôture mais méritent votre attention.',
    tips: [
      'Corrigez les erreurs bloquantes avant de continuer',
      'Les écritures non lettrées devraient être vérifiées',
      'L\'équilibre total débit/crédit doit être parfait',
    ],
  },

  // Écritures de clôture
  closingEntries: {
    title: 'Écritures de clôture',
    description: 'Écritures automatiques générées lors de la clôture pour solder les comptes de résultat (classes 6 et 7).',
    details: 'Les charges (classe 6) sont débitées et les produits (classe 7) sont crédités, la différence étant affectée au compte de résultat 120 (bénéfice) ou 129 (perte).',
    tips: [
      'Ces écritures sont générées automatiquement',
      'Elles ne peuvent pas être modifiées après clôture',
      'Vérifiez le résultat calculé avant de confirmer',
    ],
  },

  // Écritures à-nouveaux
  openingEntries: {
    title: 'Écritures à-nouveaux',
    description: 'Les à-nouveaux reprennent les soldes des comptes de bilan (classes 1-5) pour la nouvelle période.',
    details: 'Ils sont générés automatiquement lors de la clôture si la période suivante existe. Les comptes de résultat (classes 6-7) sont soldés dans le compte 120.',
    tips: [
      'Créez la période suivante avant de clôturer pour générer les à-nouveaux automatiquement',
      'Vérifiez les à-nouveaux après génération',
    ],
  },

  // Résultat de l'exercice
  periodResult: {
    title: 'Résultat de l\'exercice',
    description: 'Différence entre les produits (classe 7) et les charges (classe 6). Un montant positif indique un bénéfice.',
    details: 'Le résultat est comptabilisé au compte 120 lors de la clôture. L\'affectation du résultat (réserves, dividendes) se fait dans l\'exercice suivant.',
  },
};

// ============================================================================
// ÉCRITURES COMPTABLES
// ============================================================================

export const journalEntriesHelp = {
  // Équilibre débit/crédit
  balance: {
    title: 'Équilibre débit/crédit',
    description: 'Une écriture comptable doit toujours être équilibrée : total des débits = total des crédits.',
    details: 'C\'est le principe fondamental de la comptabilité en partie double. Chaque opération impacte au minimum deux comptes.',
    tips: [
      'Vérifiez l\'équilibre avant validation',
      'Une différence peut indiquer un oubli de ligne',
    ],
  },

  // Statuts d'écriture
  status: {
    title: 'Statuts des écritures',
    description: 'Brouillon → En révision → Validée → Comptabilisée. Seules les écritures comptabilisées apparaissent dans les rapports officiels.',
    details: 'Les écritures en brouillon peuvent être modifiées librement. Une fois validées, elles nécessitent une contre-passation pour correction.',
  },

  // Lettrage
  lettrage: {
    title: 'Lettrage',
    description: 'Le lettrage associe les factures aux règlements correspondants pour faciliter le suivi des créances et dettes.',
    details: 'Un compte lettré montre que la créance/dette est soldée. Les écritures non lettrées représentent des montants en attente.',
    tips: [
      'Lettrez régulièrement pour un suivi précis',
      'Vérifiez les non-lettrés avant clôture',
    ],
  },

  // Journaux
  journals: {
    title: 'Journaux comptables',
    description: 'Les journaux regroupent les écritures par nature : Ventes, Achats, Banque, Caisse, OD.',
    details: 'Chaque journal a un code et une numérotation propre. Le journal OD (Opérations Diverses) sert aux écritures exceptionnelles.',
  },
};

// ============================================================================
// FACTURES
// ============================================================================

export const invoicesHelp = {
  // Statuts facture
  status: {
    title: 'Statuts de facture',
    description: 'Brouillon → Envoyée → Vue → Payée. Le statut évolue automatiquement selon les actions.',
    details: 'Une facture en brouillon n\'est pas envoyée au client et peut être modifiée. Une fois envoyée, elle génère une écriture comptable.',
  },

  // Échéance
  dueDate: {
    title: 'Date d\'échéance',
    description: 'Date limite de paiement de la facture. Détermine les créances en retard.',
    details: 'Les factures non payées après l\'échéance apparaissent dans l\'analyse des créances (aging). Des relances peuvent être automatisées.',
    tips: [
      'Définissez des conditions de paiement claires',
      'Suivez régulièrement les factures en retard',
    ],
  },

  // TVA
  vat: {
    title: 'TVA - Taxe sur la Valeur Ajoutée',
    description: 'La TVA collectée sur ventes est reversée à l\'État, diminuée de la TVA déductible sur achats.',
    details: 'TVA à payer = TVA collectée (compte 4457) - TVA déductible (compte 4456). La déclaration est mensuelle ou trimestrielle selon le régime.',
  },

  // Avoir
  creditNote: {
    title: 'Avoir (note de crédit)',
    description: 'Un avoir annule totalement ou partiellement une facture. Il génère une écriture inverse.',
    details: 'L\'avoir doit référencer la facture d\'origine. Il diminue le chiffre d\'affaires et la TVA collectée.',
  },
};

// ============================================================================
// RAPPORTS & ANALYSES
// ============================================================================

export const reportsHelp = {
  // Balance générale
  trialBalance: {
    title: 'Balance générale',
    description: 'Liste tous les comptes avec leurs soldes débiteurs et créditeurs. Le total des débits doit égaler le total des crédits.',
    details: 'C\'est l\'outil de vérification principal avant clôture. Une différence indique une erreur dans les écritures.',
  },

  // Bilan
  balanceSheet: {
    title: 'Bilan comptable',
    description: 'Photographie du patrimoine de l\'entreprise à une date donnée. Actif = Passif obligatoirement.',
    details: 'L\'actif représente ce que possède l\'entreprise (immobilisations, stocks, créances, trésorerie). Le passif représente l\'origine des financements (capitaux propres, dettes).',
  },

  // Compte de résultat
  incomeStatement: {
    title: 'Compte de résultat',
    description: 'Synthèse des produits et charges de la période. Résultat = Produits - Charges.',
    details: 'Un résultat positif est un bénéfice, un résultat négatif est une perte. Il est reporté au bilan dans les capitaux propres.',
  },

  // Aging créances
  receivablesAging: {
    title: 'Échéancier créances clients',
    description: 'Analyse les factures impayées par tranche d\'ancienneté pour identifier les retards de paiement.',
    details: 'Les tranches standard sont : non échu, 1-30 jours, 31-60 jours, 61-90 jours, plus de 90 jours. Plus une créance est ancienne, plus le risque d\'impayé est élevé.',
    tips: [
      'Relancez les clients dès 30 jours de retard',
      'Provisionnez les créances douteuses (+90 jours)',
    ],
  },

  // Aging dettes
  payablesAging: {
    title: 'Échéancier dettes fournisseurs',
    description: 'Analyse les factures fournisseurs à payer par tranche d\'échéance pour gérer la trésorerie.',
    details: 'Permet d\'anticiper les sorties de trésorerie et de négocier des délais si nécessaire.',
  },

  // Solde d'ouverture
  openingBalance: {
    title: 'Solde d\'ouverture',
    description: 'Solde du compte au début de la période, repris de la clôture de la période précédente.',
    details: 'Pour les comptes de bilan (classes 1-5), c\'est le solde de clôture de l\'exercice précédent. Les comptes de résultat (6-7) commencent toujours à zéro.',
  },
};

// ============================================================================
// TRÉSORERIE
// ============================================================================

export const cashHelp = {
  // Rapprochement bancaire
  reconciliation: {
    title: 'Rapprochement bancaire',
    description: 'Compare le solde comptable avec le relevé bancaire pour identifier les écarts.',
    details: 'Les écarts proviennent généralement des opérations en transit (chèques non encaissés, virements en cours). Le rapprochement doit être fait régulièrement.',
    tips: [
      'Effectuez le rapprochement chaque mois',
      'Investiguez tout écart non expliqué',
    ],
  },

  // Solde bancaire
  bankBalance: {
    title: 'Solde bancaire',
    description: 'Solde du compte banque (512) dans la comptabilité. Peut différer du relevé bancaire à cause des opérations en transit.',
    details: 'Le solde comptable est mis à jour automatiquement après chaque écriture sur le compte banque.',
  },
};

// ============================================================================
// IMMOBILISATIONS
// ============================================================================

export const assetsHelp = {
  // Amortissement
  depreciation: {
    title: 'Amortissement',
    description: 'Constate la perte de valeur d\'une immobilisation sur sa durée d\'utilisation.',
    details: 'L\'amortissement est une charge (compte 68) qui réduit le résultat. Il crée une provision (compte 28) qui diminue la valeur nette de l\'actif au bilan.',
    tips: [
      'Choisissez une durée d\'amortissement réaliste',
      'Les dotations doivent être passées chaque mois/année',
    ],
  },

  // Cession
  disposal: {
    title: 'Cession d\'immobilisation',
    description: 'Sortie d\'un bien du patrimoine de l\'entreprise (vente, mise au rebut).',
    details: 'La cession génère une plus ou moins-value : Prix de vente - Valeur nette comptable. Cette plus/moins-value impacte le résultat.',
  },
};

// ============================================================================
// EXPORTS GROUPÉS
// ============================================================================

export const helpContent = {
  periodClosure: periodClosureHelp,
  journalEntries: journalEntriesHelp,
  invoices: invoicesHelp,
  reports: reportsHelp,
  cash: cashHelp,
  assets: assetsHelp,
};

export default helpContent;
