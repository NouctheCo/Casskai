import React from 'react';
import { useEnterprisePlan, useCapabilityAccess } from '@/hooks/useEnterprisePlan';
import { PlanCapability } from '@/config/moduleCapabilities';
import { cn } from '@/lib/utils';

interface FeatureGateProps {
  capability: PlanCapability;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  enterpriseId?: string;
  className?: string;
}

/**
 * Composant pour contrôler l'accès aux fonctionnalités selon le plan
 * Cache ou remplace le contenu si la capacité n'est pas disponible
 */
export function FeatureGate({
  capability,
  children,
  fallback,
  enterpriseId,
  className
}: FeatureGateProps) {
  const hasAccess = useCapabilityAccess(capability, enterpriseId);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
}

interface ModuleGateProps {
  moduleKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  enterpriseId?: string;
  className?: string;
}

/**
 * Composant pour contrôler l'accès aux modules selon le plan
 */
export function ModuleGate({
  moduleKey,
  children,
  fallback,
  enterpriseId,
  className
}: ModuleGateProps) {
  const plan = useEnterprisePlan(enterpriseId);

  // Pour l'instant, on utilise une logique simple
  // TODO: Intégrer avec le mapping modules -> capacités
  const hasAccess = plan.planCode === 'enterprise' ||
    (plan.planCode === 'pro' && !['advanced_reporting', 'api_access'].includes(moduleKey)) ||
    (plan.planCode === 'starter' && !['advanced_reporting', 'api_access', 'multi_company'].includes(moduleKey));

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
}

interface UpgradePromptProps {
  feature: string;
  currentPlan: string;
  requiredPlan: string;
  className?: string;
}

/**
 * Composant d'incitation à la mise à niveau
 */
export function UpgradePrompt({
  feature,
  currentPlan,
  requiredPlan,
  className
}: UpgradePromptProps) {
  return (
    <div className={cn(
      "p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20",
      "border border-blue-200 dark:border-blue-800 rounded-lg",
      className
    )}>
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Fonctionnalité {feature} disponible avec le plan {requiredPlan}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-300">
            Vous utilisez actuellement le plan {currentPlan}
          </p>
        </div>
        <div className="flex-shrink-0">
          <button className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-md transition-colors">
            Mettre à niveau
          </button>
        </div>
      </div>
    </div>
  );
}

interface QuotaIndicatorProps {
  quotaKey: string;
  enterpriseId?: string;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Composant pour afficher l'usage des quotas
 */
export function QuotaIndicator({
  quotaKey,
  enterpriseId,
  className,
  showLabel = true,
  size = 'md'
}: QuotaIndicatorProps) {
  const plan = useEnterprisePlan(enterpriseId);
  const quota = plan.quotas[quotaKey];

  if (!quota) return null;

  const { current, limit, percentage } = quota;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400 capitalize">
            {quotaKey.replace('_', ' ')}
          </span>
          <span className={cn(
            "font-medium",
            isAtLimit ? "text-red-600 dark:text-red-400" :
            isNearLimit ? "text-yellow-600 dark:text-yellow-400" :
            "text-gray-900 dark:text-gray-100"
          )}>
            {current}{limit ? `/${limit}` : ''}
          </span>
        </div>
      )}
      {limit && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              "transition-all duration-300 rounded-full",
              sizeClasses[size],
              isAtLimit ? "bg-red-500" :
              isNearLimit ? "bg-yellow-500" :
              "bg-blue-500"
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
