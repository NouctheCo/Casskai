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
      <div className="space-y-3">
        <h2 className="text-xl font-bold">{t('tour.welcome.title')} 👋</h2>
        <p>{t('tour.welcome.intro')}</p>
        <p className="text-sm text-gray-600">{t('tour.welcome.duration')}</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true
  },
  {
    target: '[data-tour="quick-start-cards"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-semibold">{t('tour.quickStart.title')}</h3>
        <p>{t('tour.quickStart.description', { companyName })}</p>
      </div>
    ),
    placement: 'bottom'
  },
  {
    target: '[data-tour="step-accounting"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-semibold">📚 {t('tour.accounting.title')}</h3>
        <p>{t('tour.accounting.description')}</p>
        <p className="text-sm text-gray-600">⏱️ {t('tour.accounting.time')}</p>
      </div>
    ),
    placement: 'right'
  },
  {
    target: '[data-tour="step-invoicing"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-semibold">📄 {t('tour.invoicing.title')}</h3>
        <p>{t('tour.invoicing.description')}</p>
      </div>
    ),
    placement: 'right'
  },
  {
    target: '[data-tour="step-banking"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-semibold">🏦 {t('tour.banking.title')}</h3>
        <p>{t('tour.banking.description')}</p>
      </div>
    ),
    placement: 'left'
  },
  {
    target: '[data-tour="progress-bar"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-semibold">📊 {t('tour.progress.title')}</h3>
        <p>{t('tour.progress.description')}</p>
      </div>
    ),
    placement: 'bottom'
  },
  {
    target: '[data-tour="help-section"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-semibold">💡 {t('tour.help.title')}</h3>
        <p>{t('tour.help.description')}</p>
      </div>
    ),
    placement: 'top'
  },
  {
    target: 'nav',
    content: (
      <div className="space-y-2">
        <h3 className="font-semibold">🧭 {t('tour.navigation.title')}</h3>
        <p>{t('tour.navigation.description')}</p>
      </div>
    ),
    placement: 'right'
  },
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h2 className="text-xl font-bold">{t('tour.ready.title')} 🚀</h2>
        <p>{t('tour.ready.description')}</p>
        <p className="text-sm text-gray-600">{t('tour.ready.tip')}</p>
      </div>
    ),
    placement: 'center'
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
    if (isNewAccount) {
      const hasCompletedTour = localStorage.getItem(storageKey);
      if (!hasCompletedTour) {
        const timeoutId = window.setTimeout(() => setRun(true), 1000);
        return () => window.clearTimeout(timeoutId);
      }
    }
    return undefined;
  }, [isNewAccount, storageKey]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(storageKey, 'true');
      setRun(false);
    }

    if (type === EVENTS.STEP_AFTER) {
      setStepIndex(index + 1);
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
