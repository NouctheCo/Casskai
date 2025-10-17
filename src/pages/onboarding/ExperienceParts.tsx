import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2 } from 'lucide-react';

type ScenarioCardProps = {
  title: string;
  badge?: string;
  description: string;
  actionLabel: string;
  loading?: boolean;
  completed?: boolean;
  onAction?: () => void;
  typeLabel?: string | number | undefined;
};

export function ScenarioCard({ title, badge, description, actionLabel, loading, completed, onAction, typeLabel }: ScenarioCardProps) {
  return (
    <Card className="h-full border border-slate-200 shadow-sm dark:border-slate-800 relative">
      {completed && (
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Terminé
          </Badge>
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</CardTitle>
          {!completed && badge && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">{badge}</span>
          )}
        </div>
        <CardDescription className="text-sm text-slate-600 dark:text-slate-300">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button variant={completed ? 'outline' : 'default'} disabled={loading || completed} onClick={onAction} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Exécution...' : completed ? 'Complété' : actionLabel}
        </Button>
        <p className="text-xs text-slate-500 dark:text-slate-400">Type : {typeLabel}</p>
      </CardContent>
    </Card>
  );
}

type ExperienceFooterProps = {
  companyName: string;
  completionCount: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
};

export function ExperienceFooter({ companyName, completionCount, total, onBack, onNext }: ExperienceFooterProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white/70 p-6 dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Expérience multi-sessions pour {companyName}</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300">Chaque action est historisée via Supabase (fonction RPC `save_onboarding_scenario`) afin de suivre la progression réelle de vos équipes. Cette étape déclenche aussi les nouveaux toasts dynamiques introduits dans CassKai avec tracking analytics complet.</p>
      <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
        <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Progression :</span>
        <Badge variant="outline">{completionCount} / {total} complétés</Badge>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={onBack}>Retour</Button>
        <Button onClick={onNext}>Continuer</Button>
      </div>
    </div>
  );
}

export default ScenarioCard;

type ExperienceContentProps = {
  scenarios: any[];
  completionStatus: Record<string, boolean>;
  isSending: string | null;
  handleScenario: (s: any) => void;
  companyName: string;
  completionCount: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
};

export function ExperienceContent({ scenarios, completionStatus, isSending, handleScenario, companyName, completionCount, total, onBack, onNext }: ExperienceContentProps) {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            title={scenario.title}
            badge={scenario.badge}
            description={scenario.description}
            actionLabel={scenario.actionLabel}
            loading={isSending === scenario.id}
            completed={completionStatus[scenario.completedKey]}
            onAction={() => handleScenario(scenario)}
            typeLabel={String(scenario.payload.type)}
          />
        ))}
      </div>

      <ExperienceFooter
        companyName={companyName}
        completionCount={completionCount}
        total={total}
        onBack={onBack}
        onNext={onNext}
      />
    </>
  );
}
