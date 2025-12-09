import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Joyride, { STATUS, EVENTS, type CallBackProps, type Step } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingTourProps {
  isNewAccount: boolean;
  companyName: string;
}

type TourWindow = Window & typeof globalThis & {
  restartOnboardingTour?: () => void;
};

const buildTourSteps = (t: TFunction, companyName: string): Step[] => [
  {
    target: 'body',
    content: (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Bienvenue sur CassKai ! 👋</h2>
        <p className="text-lg">La plateforme tout-en-un pour piloter votre entreprise : <strong>{companyName}</strong></p>
        <div className="space-y-2 text-sm">
          <p>✅ Comptabilité complète et conforme</p>
          <p>✅ Facturation et devis professionnels</p>
          <p>✅ CRM et gestion commerciale</p>
          <p>✅ Gestion de projets et ressources</p>
          <p>✅ Analyses et tableaux de bord en temps réel</p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">⏱️ Ce guide prend 3 minutes</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true
  },
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">🧭 Navigation principale</h3>
        <p>Accédez à tous vos modules depuis ce menu latéral :</p>
        <ul className="space-y-1 text-sm">
          <li><strong>Tableau de bord</strong> - Vue d'ensemble de votre activité</li>
          <li><strong>Comptabilité</strong> - Grand livre, journaux, plan comptable</li>
          <li><strong>Facturation</strong> - Créez et gérez vos factures clients</li>
          <li><strong>CRM</strong> - Prospects, clients, opportunités</li>
          <li><strong>Projets</strong> - Suivi du temps et des tâches</li>
          <li><strong>RH</strong> - Gestion des employés et congés</li>
        </ul>
        <p className="text-sm text-gray-600 dark:text-gray-400">💡 Utilisez Ctrl+K pour ouvrir la recherche rapide</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true
  },
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">📊 Tableau de bord</h3>
        <p>Visualisez en temps réel les indicateurs clés de votre entreprise :</p>
        <ul className="space-y-1 text-sm">
          <li>• <strong>Chiffre d'affaires</strong> - Évolution mensuelle et annuelle</li>
          <li>• <strong>Marge bénéficiaire</strong> - Rentabilité de votre activité</li>
          <li>• <strong>Trésorerie</strong> - Soldes bancaires et runway</li>
          <li>• <strong>Factures en attente</strong> - Suivi des impayés</li>
          <li>• <strong>Analyses IA</strong> - Recommandations personnalisées</li>
        </ul>
        <p className="text-sm text-gray-600 dark:text-gray-400">Les données sont synchronisées automatiquement depuis votre comptabilité.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true
  },
  {
    target: 'body',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🧠</span>
          </div>
          <h3 className="text-xl font-bold">Intelligence Artificielle</h3>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border-2 border-purple-200 dark:border-purple-700">
          <p className="font-semibold text-purple-900 dark:text-purple-200 mb-2">🎉 NOUVEAUTÉ : Analyses IA intégrées !</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">CassKai intègre une intelligence artificielle de pointe pour analyser automatiquement vos rapports financiers.</p>
        </div>
        <div className="space-y-2">
          <p className="font-medium">✨ Ce que l'IA fait pour vous :</p>
          <ul className="space-y-1 text-sm">
            <li>• <strong>7 rapports enrichis</strong> - KPI, trésorerie, créances, ratios, budget, dettes, stocks</li>
            <li>• <strong>Synthèses exécutives</strong> - Vue d'ensemble en langage clair</li>
            <li>• <strong>Détection des risques</strong> - Alertes proactives sur votre santé financière</li>
            <li>• <strong>Recommandations d'expert</strong> - Plans d'action personnalisés</li>
            <li>• <strong>Disponible 24/7</strong> - Sans surcoût, sur tous les plans</li>
          </ul>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
          <p className="font-semibold mb-1">📍 Où trouver les analyses IA ?</p>
          <p>Accédez au module <strong>Rapports</strong> et générez un rapport. L'IA créera automatiquement une synthèse exécutive en première page.</p>
        </div>
      </div>
    ),
    placement: 'center',
    disableBeacon: true
  },
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">📄 Module Facturation</h3>
        <p>Créez des factures et devis professionnels en quelques clics :</p>
        <ul className="space-y-1 text-sm">
          <li>• <strong>Factures clients</strong> - Génération automatique avec numérotation</li>
          <li>• <strong>Devis</strong> - Convertibles en factures instantanément</li>
          <li>• <strong>Suivi des paiements</strong> - Relances automatiques</li>
          <li>• <strong>Export PDF</strong> - Documents personnalisables avec votre logo</li>
          <li>• <strong>Multidevises</strong> - EUR, USD, GBP et plus</li>
        </ul>
        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">→ Accédez via le menu "Facturation"</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true
  },
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">📚 Module Comptabilité</h3>
        <p>Une comptabilité complète et conforme aux normes :</p>
        <ul className="space-y-1 text-sm">
          <li>• <strong>Plan comptable</strong> - Adapté à votre pays (France, Belgique, etc.)</li>
          <li>• <strong>Écritures automatiques</strong> - Depuis factures et achats</li>
          <li>• <strong>Grand livre</strong> - Vue détaillée de tous les mouvements</li>
          <li>• <strong>Journaux</strong> - Ventes, achats, banque, OD</li>
          <li>• <strong>Rapports fiscaux</strong> - Déclaration TVA, liasse fiscale</li>
        </ul>
        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">→ Accédez via le menu "Comptabilité"</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true
  },
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">👥 Module CRM</h3>
        <p>Gérez votre relation client de A à Z :</p>
        <ul className="space-y-1 text-sm">
          <li>• <strong>Prospects</strong> - Qualification et scoring</li>
          <li>• <strong>Clients</strong> - Fiches complètes avec historique</li>
          <li>• <strong>Opportunités</strong> - Pipeline de vente avec taux de conversion</li>
          <li>• <strong>Activités</strong> - Appels, emails, rendez-vous</li>
          <li>• <strong>Reporting</strong> - Performance commerciale</li>
        </ul>
        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">→ Accédez via le menu "CRM"</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true
  },
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">🚀 Module Projets</h3>
        <p>Pilotez vos projets et suivez le temps :</p>
        <ul className="space-y-1 text-sm">
          <li>• <strong>Gestion de projets</strong> - Kanban, Gantt, listes</li>
          <li>• <strong>Suivi du temps</strong> - Timetracking avec timer intégré</li>
          <li>• <strong>Tâches</strong> - Assignation et priorisation</li>
          <li>• <strong>Budget</strong> - Temps passé vs temps prévu</li>
          <li>• <strong>Facturation</strong> - Conversion automatique en factures</li>
        </ul>
        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">→ Accédez via le menu "Projets"</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true
  },
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">👔 Module RH</h3>
        <p>Gérez vos ressources humaines efficacement :</p>
        <ul className="space-y-1 text-sm">
          <li>• <strong>Employés</strong> - Fiches complètes avec contrats</li>
          <li>• <strong>Congés</strong> - Demandes et validation</li>
          <li>• <strong>Notes de frais</strong> - Suivi et remboursements</li>
          <li>• <strong>Évaluations</strong> - Entretiens annuels</li>
          <li>• <strong>Documents</strong> - Contrats, avenants, attestations</li>
        </ul>
        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">→ Accédez via le menu "Ressources Humaines"</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true
  },
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">💳 Autres modules disponibles</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Banque</strong> - Rapprochement bancaire et import de fichiers</p>
          <p><strong>Achats</strong> - Gestion des fournisseurs et bons de commande</p>
          <p><strong>Inventaire</strong> - Stock et immobilisations</p>
          <p><strong>Contrats</strong> - Modèles et signatures électroniques</p>
          <p><strong>Prévisions</strong> - Budget et forecasting</p>
          <p><strong>Rapports</strong> - Balance, compte de résultat, bilan</p>
        </div>
      </div>
    ),
    placement: 'center',
    disableBeacon: true
  },
  {
    target: 'body',
    content: (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">🎉 Vous êtes prêt à démarrer !</h2>
        <div className="space-y-2">
          <p className="text-lg">Pour commencer, nous vous recommandons de :</p>
          <ol className="space-y-2 text-sm list-decimal list-inside">
            <li>Compléter les paramètres de votre entreprise (logo, coordonnées)</li>
            <li>Importer vos clients et fournisseurs existants</li>
            <li>Créer votre première facture ou devis</li>
            <li>Explorer le tableau de bord et les rapports</li>
            <li><strong>🧠 Générer un rapport avec analyse IA</strong> pour découvrir la nouveauté</li>
          </ol>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 rounded-lg text-sm border border-purple-200 dark:border-purple-700">
          <p className="font-semibold mb-1 text-purple-900 dark:text-purple-200">🌟 N'oubliez pas !</p>
          <p className="text-gray-700 dark:text-gray-300">L'intelligence artificielle analyse automatiquement tous vos rapports financiers. Aucune configuration nécessaire !</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
          <p className="font-semibold mb-1">💡 Besoin d'aide ?</p>
          <p>• Documentation complète disponible dans Paramètres → Aide</p>
          <p>• Support par email : support@casskai.com</p>
          <p>• Relancez ce guide à tout moment depuis Paramètres</p>
        </div>
      </div>
    ),
    placement: 'center',
    disableBeacon: true
  }
];

export function OnboardingTour({ isNewAccount, companyName }: OnboardingTourProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const storageKey = useMemo(() => `onboarding_tour_completed_${user?.id ?? 'anonymous'}`, [user?.id]);
  const steps = useMemo(() => buildTourSteps(t, companyName), [t, companyName]);

  useEffect(() => {
    // Vérifier si le tour est déjà complété
    const hasCompletedTour = localStorage.getItem(storageKey);

    // Vérifier si l'URL demande explicitement le tour (pour relancer)
    const urlParams = new URLSearchParams(window.location.search);
    const forceTour = urlParams.get('tour') === 'start' || urlParams.get('tour') === 'true';

    if (forceTour) {
      // Forcer le redémarrage du tour
      localStorage.removeItem(storageKey);
      setStepIndex(0);
      const timeoutId = window.setTimeout(() => setRun(true), 500);
      // Nettoyer l'URL après avoir lancé le tour
      window.history.replaceState({}, '', window.location.pathname);
      return () => window.clearTimeout(timeoutId);
    }

    if (isNewAccount && !hasCompletedTour) {
      // Nouveau compte et tour pas encore fait
      const timeoutId = window.setTimeout(() => setRun(true), 1000);
      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [isNewAccount, storageKey]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data;

    console.log('[OnboardingTour] Callback:', { status, type, index });

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(storageKey, 'true');
      setRun(false);
      return;
    }

    // Gérer target non trouvé - passer à l'étape suivante
    if (type === EVENTS.TARGET_NOT_FOUND) {
      console.warn('[OnboardingTour] Target not found, skipping to next step');
      setStepIndex(index + 1);
      return;
    }

    // Gérer STEP_AFTER (bouton Next ou Last cliqué)
    if (type === EVENTS.STEP_AFTER) {
      setStepIndex(index + 1);
    }

    // Gérer STEP_BEFORE (bouton Back cliqué)
    // L'index fourni par Joyride est déjà celui de l'étape précédente
    if (type === EVENTS.STEP_BEFORE) {
      setStepIndex(index);
    }
  };

  const restartTour = useCallback(() => {
    localStorage.removeItem(storageKey);
    setStepIndex(0);
    setRun(true);
  }, [storageKey]);

  useEffect(() => {
    const tourWindow = window as TourWindow;
    tourWindow.restartOnboardingTour = restartTour;
    return () => {
      delete tourWindow.restartOnboardingTour;
    };
  }, [restartTour]);

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#3b82f6',
          zIndex: 10000
        },
        tooltip: {
          borderRadius: 8,
          fontSize: 14
        },
        buttonNext: {
          backgroundColor: '#3b82f6',
          borderRadius: 6,
          padding: '8px 16px'
        },
        buttonBack: {
          color: '#6b7280'
        },
        buttonSkip: {
          color: '#6b7280'
        }
      }}
      locale={{
        back: t('tour.back'),
        close: t('tour.close'),
        last: t('tour.last'),
        next: t('tour.next'),
        skip: t('tour.skip')
      }}
    />
  );
}
