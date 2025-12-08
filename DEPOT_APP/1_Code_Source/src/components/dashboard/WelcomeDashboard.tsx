import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  type LucideIcon,
  BookOpen,
  FileText,
  Banknote,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WelcomeDashboardProps {
  companyName: string;
  userName?: string;
}

interface QuickStartStepConfig {
  id: string;
  icon: LucideIcon;
  path: string;
  color: string;
  estimatedTime: string;
}

interface QuickStartStep extends QuickStartStepConfig {
  title: string;
  description: string;
  estimatedTime: string;
  orderLabel: string;
}

interface QuickStartStepWithAction extends QuickStartStep {
  action: () => void;
}

const QUICK_START_STEP_CONFIGS: QuickStartStepConfig[] = [
  {
    id: 'accounting',
    icon: BookOpen,
    path: '/accounting',
    color: 'blue',
    estimatedTime: '5 min'
  },
  {
    id: 'invoicing',
    icon: FileText,
    path: '/invoicing',
    color: 'green',
    estimatedTime: '3 min'
  },
  {
    id: 'banking',
    icon: Banknote,
    path: '/banks',
    color: 'purple',
    estimatedTime: '2 min'
  },
  {
    id: 'team',
    icon: Users,
    path: '/settings',
    color: 'orange',
    estimatedTime: '1 min'
  }
];

const HELP_LINKS = [
  { id: 'documentation', icon: '📚', url: '/help' },
  { id: 'support', icon: '💬', url: 'mailto:support@casskai.app' },
  { id: 'tutorials', icon: '🎥', url: 'https://youtube.com/@casskai' }
] as const;

const PLACEHOLDER_STATS = [
  { id: 'revenue', value: '0,00', icon: '💰' },
  { id: 'expenses', value: '0,00', icon: '📉' },
  { id: 'invoices', value: '0', icon: '📄' },
  { id: 'clients', value: '0', icon: '👥' }
] as const;

interface HeroSectionContent {
  greeting: string;
  subtitle: string;
  companyReady: string;
  accountReady: string;
  stepsCompleted: string;
  progressLabel: string;
}

const HeroSection: React.FC<{
  content: HeroSectionContent;
  progressPercent: number;
}> = ({ content, progressPercent }) => (
  <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-none">
    <CardContent className="pt-6 pb-8">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
              {content.greeting}
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {content.subtitle}
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {content.companyReady}
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>{content.accountReady}</span>
            <span className="mx-2">•</span>
            <span>{content.stepsCompleted}</span>
          </div>
        </div>
      </div>

      <div className="mt-6" data-tour="progress-bar">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-2">
          <span>{content.progressLabel}</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </CardContent>
  </Card>
);

const QuickStartGrid: React.FC<{
  steps: QuickStartStepWithAction[];
  completedSteps: string[];
  onStepClick: (stepId: string, action: () => void) => void;
  title: string;
}> = ({ steps, completedSteps, onStepClick, title }) => (
  <div>
    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-4">
      {title}
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-tour="quick-start-cards">
      {steps.map((step) => {
        const Icon = step.icon;
        const isCompleted = completedSteps.includes(step.id);

        return (
          <Card
            key={step.id}
            data-tour={`step-${step.id}`}
            className={`group hover:shadow-lg transition-all duration-200 cursor-pointer ${
              isCompleted ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : ''
            }`}
            onClick={() => onStepClick(step.id, step.action)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-${step.color}-100 dark:bg-${step.color}-900/20`}>
                    <Icon className={`w-6 h-6 text-${step.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                      {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    </div>
                    <CardDescription className="mt-1">
                      {step.description}
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-300">
                        {step.estimatedTime}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {step.orderLabel}
                      </span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  </div>
);

const HelpSection: React.FC<{
  title: string;
  description: string;
  links: Array<{ id: string; label: string; url: string; icon: string }>;
  navigate: ReturnType<typeof useNavigate>;
}> = ({ title, description, links, navigate }) => {
  const handleLinkClick = (url: string) => {
    // Navigation intelligente : liens internes = même onglet, externes = nouvel onglet
    if (url.startsWith('/')) {
      // Lien interne : navigation React Router
      navigate(url);
    } else {
      // Lien externe (mailto:, https://) : nouvel onglet
      window.open(url, '_blank');
    }
  };

  return (
    <Card data-tour="help-section">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {links.map((link) => (
            <Button key={link.id} variant="outline" onClick={() => handleLinkClick(link.url)}>
              {link.icon} {link.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const StatsGrid: React.FC<{
  stats: Array<{ id: string; label: string; value: string; icon: string }>;
  emptyLabel: string;
}> = ({ stats, emptyLabel }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {stats.map((stat) => (
      <Card key={stat.id}>
        <CardContent className="pt-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-1">
            {stat.icon} {stat.label}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
            {stat.value}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-300 mt-1">
            {emptyLabel}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export function WelcomeDashboard({ companyName, userName }: WelcomeDashboardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const totalSteps = QUICK_START_STEP_CONFIGS.length;

  const steps = useMemo<QuickStartStepWithAction[]>(
    () => QUICK_START_STEP_CONFIGS.map((stepConfig, index) => ({
      ...stepConfig,
      title: t(`dashboard.welcome.steps.${stepConfig.id}.title`),
      description: t(`dashboard.welcome.steps.${stepConfig.id}.description`),
      estimatedTime: t('dashboard.welcome.estimatedTime', { time: stepConfig.estimatedTime }),
      orderLabel: t('dashboard.welcome.stepLabel', { step: index + 1 }),
      action: () => navigate(stepConfig.path)
    })),
    [navigate, t]
  );

  const handleStepClick = (stepId: string, action: () => void) => {
    setCompletedSteps((prev) => (prev.includes(stepId) ? prev : [...prev, stepId]));
    action();
  };

  const progressPercent = totalSteps ? Math.round((completedSteps.length / totalSteps) * 100) : 0;

  const heroContent = useMemo<HeroSectionContent>(() => ({
    greeting: t('dashboard.welcome.greeting', {
      name: userName ?? t('dashboard.welcome.defaultUserName')
    }),
    subtitle: t('dashboard.welcome.subtitle'),
    companyReady: t('dashboard.welcome.companyReady', { companyName }),
    accountReady: t('dashboard.welcome.accountReady'),
    stepsCompleted: t('dashboard.welcome.stepsCompleted', {
      completed: completedSteps.length,
      total: totalSteps
    }),
    progressLabel: t('dashboard.welcome.progress')
  }), [companyName, completedSteps.length, t, totalSteps, userName]);

  const quickStartTitle = t('dashboard.welcome.quickStartTitle');

  const helpLinks = useMemo(
    () => HELP_LINKS.map((link) => ({
      ...link,
      label: t(`dashboard.welcome.help.${link.id}`)
    })),
    [t]
  );

  const stats = useMemo(
    () => PLACEHOLDER_STATS.map((stat) => ({
      ...stat,
      label: t(`dashboard.welcome.stats.${stat.id}`)
    })),
    [t]
  );

  const statsEmptyLabel = t('dashboard.welcome.stats.empty');

  const helpTitle = t('dashboard.welcome.help.title');
  const helpDescription = t('dashboard.welcome.help.description');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <HeroSection
        content={heroContent}
        progressPercent={progressPercent}
      />
      <QuickStartGrid
        steps={steps}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
        title={quickStartTitle}
      />
      <HelpSection title={helpTitle} description={helpDescription} links={helpLinks} navigate={navigate} />
      <StatsGrid stats={stats} emptyLabel={statsEmptyLabel} />
    </div>
  );
}
