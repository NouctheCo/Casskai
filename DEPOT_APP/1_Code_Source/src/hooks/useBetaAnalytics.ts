/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import { useCallback, useEffect } from 'react';
import { usePlausibleAnalytics, useEngagementTracking } from './usePlausibleAnalytics';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook spécialisé pour le tracking des beta testers
 * Collecte des métriques comportementales détaillées pour Phase 3
 */
export const useBetaAnalytics = () => {
  const { trackEvent, trackGoal } = usePlausibleAnalytics();
  const { trackTimeSpent, trackFormSubmission, trackError } = useEngagementTracking();
  const { user } = useAuth();

  // Vérifier si on est en environnement beta
  const isBeta = import.meta.env.VITE_APP_ENV === 'staging' ||
                 import.meta.env.VITE_BETA_ANALYTICS_VERBOSE === 'true';

  // Track onboarding steps
  const trackOnboardingStep = useCallback((step: string, completed: boolean = true) => {
    if (!isBeta) return;

    trackEvent('Beta: Onboarding Step', {
      step,
      status: completed ? 'completed' : 'skipped',
      user_id: user?.id || 'anonymous',
    });
  }, [isBeta, trackEvent, user?.id]);

  // Track feature usage avec contexte beta
  const trackFeatureUsage = useCallback((feature: string, action: string, metadata?: Record<string, any>) => {
    if (!isBeta) return;

    trackEvent('Beta: Feature Usage', {
      feature,
      action,
      user_id: user?.id || 'anonymous',
      ...metadata,
    });
  }, [isBeta, trackEvent, user?.id]);

  // Track module activation
  const trackModuleActivation = useCallback((moduleName: string) => {
    if (!isBeta) return;

    trackGoal('Beta: Module Activated', {
      module: moduleName,
      user_id: user?.id || 'anonymous',
    });
  }, [isBeta, trackGoal, user?.id]);

  // Track feedback submission
  const trackFeedbackSubmission = useCallback((feedbackType: 'positive' | 'negative' | 'bug' | 'suggestion') => {
    if (!isBeta) return;

    trackGoal('Beta: Feedback Submitted', {
      type: feedbackType,
      user_id: user?.id || 'anonymous',
    });
  }, [isBeta, trackGoal, user?.id]);

  // Track bug report
  const trackBugReport = useCallback((severity: 'low' | 'medium' | 'high' | 'critical', page: string) => {
    if (!isBeta) return;

    trackGoal('Beta: Bug Reported', {
      severity,
      page,
      user_id: user?.id || 'anonymous',
    });
  }, [isBeta, trackGoal, user?.id]);

  // Track user session duration
  const trackSessionDuration = useCallback((durationSeconds: number) => {
    if (!isBeta) return;

    trackEvent('Beta: Session Duration', {
      duration: Math.round(durationSeconds),
      user_id: user?.id || 'anonymous',
    });
  }, [isBeta, trackEvent, user?.id]);

  // Track navigation patterns
  const trackNavigation = useCallback((from: string, to: string) => {
    if (!isBeta) return;

    trackEvent('Beta: Navigation', {
      from,
      to,
      user_id: user?.id || 'anonymous',
    });
  }, [isBeta, trackEvent, user?.id]);

  // Track form interactions
  const trackFormInteraction = useCallback((formName: string, fieldName: string, action: 'focus' | 'blur' | 'change' | 'error') => {
    if (!isBeta) return;

    trackEvent('Beta: Form Interaction', {
      form: formName,
      field: fieldName,
      action,
      user_id: user?.id || 'anonymous',
    });
  }, [isBeta, trackEvent, user?.id]);

  // Track import/export actions
  const trackDataAction = useCallback((action: 'import' | 'export', dataType: string, success: boolean, recordsCount?: number) => {
    if (!isBeta) return;

    trackEvent('Beta: Data Action', {
      action,
      type: dataType,
      status: success ? 'success' : 'error',
      records: recordsCount || 0,
      user_id: user?.id || 'anonymous',
    });
  }, [isBeta, trackEvent, user?.id]);

  // Track performance issues
  const trackPerformanceIssue = useCallback((issue: string, severity: 'minor' | 'major', details?: string) => {
    if (!isBeta) return;

    trackEvent('Beta: Performance Issue', {
      issue,
      severity,
      details: details || 'no details',
      user_id: user?.id || 'anonymous',
    });
  }, [isBeta, trackEvent, user?.id]);

  // Track user frustration signals
  const trackFrustrationSignal = useCallback((signal: 'rage_click' | 'dead_click' | 'error_click' | 'u_turn', element?: string) => {
    if (!isBeta) return;

    trackEvent('Beta: Frustration Signal', {
      signal,
      element: element || 'unknown',
      user_id: user?.id || 'anonymous',
    });
  }, [isBeta, trackEvent, user?.id]);

  // Track beta tester engagement score
  const trackEngagementScore = useCallback((score: number, actions: number, sessionsCount: number) => {
    if (!isBeta) return;

    trackEvent('Beta: Engagement Score', {
      score: Math.round(score),
      actions,
      sessions: sessionsCount,
      user_id: user?.id || 'anonymous',
    });
  }, [isBeta, trackEvent, user?.id]);

  // Auto-track session start/end
  useEffect(() => {
    if (!isBeta || !user) return;

    const sessionStart = Date.now();

    // Track session start
    trackEvent('Beta: Session Start', {
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });

    // Track session end on unmount
    return () => {
      const duration = (Date.now() - sessionStart) / 1000;
      trackSessionDuration(duration);
    };
  }, [isBeta, user, trackEvent, trackSessionDuration]);

  // Auto-detect rage clicks
  useEffect(() => {
    if (!isBeta) return;

    let clickCount = 0;
    let clickTimeout: NodeJS.Timeout;

    const handleClick = (e: MouseEvent) => {
      clickCount++;

      clearTimeout(clickTimeout);

      if (clickCount >= 3) {
        // Rage click detected
        const target = e.target as HTMLElement;
        trackFrustrationSignal('rage_click', target.tagName || 'unknown');
        clickCount = 0;
      }

      clickTimeout = setTimeout(() => {
        clickCount = 0;
      }, 1000);
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
      clearTimeout(clickTimeout);
    };
  }, [isBeta, trackFrustrationSignal]);

  return {
    trackOnboardingStep,
    trackFeatureUsage,
    trackModuleActivation,
    trackFeedbackSubmission,
    trackBugReport,
    trackSessionDuration,
    trackNavigation,
    trackFormInteraction,
    trackDataAction,
    trackPerformanceIssue,
    trackFrustrationSignal,
    trackEngagementScore,
    trackTimeSpent,
    trackFormSubmission,
    trackError,
    isBeta,
  };
};

export default useBetaAnalytics;
