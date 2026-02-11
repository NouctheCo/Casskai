/**
 * EmptyState Component
 * Composant réutilisable pour afficher un état vide avec guidage utilisateur
 * Utilisé pour les listes/tables vides, résultats de recherche vides, etc.
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  /**
   * Icône à afficher (composant Lucide React)
   */
  icon: LucideIcon;
  
  /**
   * Titre principal
   */
  title: string;
  
  /**
   * Description ou instructions
   */
  description: string;
  
  /**
   * Action à proposer (optionnel)
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  };
  
  /**
   * Action secondaire (optionnel)
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  
  /**
   * Classes CSS additionnelles
   */
  className?: string;
  
  /**
   * Taille de l'icône
   * @default 'md'
   */
  iconSize?: 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Variante de couleur
   * @default 'default'
   */
  variant?: 'default' | 'muted' | 'accent';
}

/**
 * Tailles d'icône
 */
const iconSizes = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
};

/**
 * Couleurs par variante
 */
const variantStyles = {
  default: {
    container: '',
    icon: 'text-muted-foreground',
    title: 'text-foreground',
    description: 'text-muted-foreground',
  },
  muted: {
    container: 'bg-muted/30 border border-border rounded-lg p-8',
    icon: 'text-muted-foreground/60',
    title: 'text-muted-foreground',
    description: 'text-muted-foreground/80',
  },
  accent: {
    container: '',
    icon: 'text-primary',
    title: 'text-foreground',
    description: 'text-muted-foreground',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  iconSize = 'md',
  variant = 'default',
}) => {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-12 px-4',
        styles.container,
        className
      )}
    >
      {/* Icône */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' }}
        className={cn(
          'mb-4 flex items-center justify-center',
          'rounded-full bg-muted/50 p-4',
          'transition-transform hover:scale-105'
        )}
      >
        <Icon className={cn(iconSizes[iconSize], styles.icon)} strokeWidth={1.5} />
      </motion.div>

      {/* Titre */}
      <motion.h3
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className={cn(
          'text-lg font-semibold mb-2',
          'sm:text-xl',
          styles.title
        )}
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className={cn(
          'text-sm max-w-md mb-6',
          'sm:text-base',
          styles.description
        )}
      >
        {description}
      </motion.p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="flex flex-col sm:flex-row gap-3 items-center"
        >
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
              size="default"
              className="min-w-[140px]"
            >
              {action.label}
            </Button>
          )}

          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              size="default"
              className="min-w-[140px]"
            >
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

/**
 * Variantes pré-configurées pour cas d'usage courants
 */

/**
 * État vide pour une liste sans données
 */
export const EmptyList: React.FC<Omit<EmptyStateProps, 'variant'>> = (props) => (
  <EmptyState {...props} variant="default" />
);

/**
 * État vide pour des résultats de recherche
 */
export const EmptySearch: React.FC<Omit<EmptyStateProps, 'variant'>> = (props) => (
  <EmptyState {...props} variant="muted" />
);

/**
 * État vide pour des résultats filtrés
 */
export const EmptyFilter: React.FC<Omit<EmptyStateProps, 'variant'>> = (props) => (
  <EmptyState {...props} variant="muted" iconSize="sm" />
);

/**
 * État vide avec appel à l'action prononcé
 */
export const EmptyWithAction: React.FC<Omit<EmptyStateProps, 'variant'>> = (props) => (
  <EmptyState {...props} variant="accent" iconSize="lg" />
);

/**
 * Skeleton loader for page-level loading states.
 * Uses shimmer animation for a polished feel.
 */
export interface PageSkeletonProps {
  /** Number of KPI cards to show */
  kpiCount?: number;
  /** Show a title skeleton row */
  showTitle?: boolean;
  /** Show content area skeleton */
  showContent?: boolean;
  /** Additional CSS class */
  className?: string;
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({
  kpiCount = 4,
  showTitle = true,
  showContent = true,
  className,
}) => (
  <div className={cn('space-y-8 p-6', className)} role="status" aria-label="Loading">
    {/* Title row */}
    {showTitle && (
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton-shimmer h-8 w-64 rounded-lg" />
          <div className="skeleton-shimmer h-4 w-48 rounded" />
        </div>
        <div className="flex gap-3">
          <div className="skeleton-shimmer h-10 w-32 rounded-lg" />
          <div className="skeleton-shimmer h-10 w-40 rounded-lg" />
        </div>
      </div>
    )}

    {/* KPI cards row */}
    <div className={cn(
      'grid gap-6',
      kpiCount <= 3 ? 'md:grid-cols-3' :
      kpiCount === 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
      'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
    )}>
      {Array.from({ length: kpiCount }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="skeleton-shimmer h-12 w-12 rounded-xl" />
            <div className="skeleton-shimmer h-6 w-16 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="skeleton-shimmer h-4 w-24 rounded" />
            <div className="skeleton-shimmer h-7 w-32 rounded" />
            <div className="skeleton-shimmer h-3 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>

    {/* Content area */}
    {showContent && (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="skeleton-shimmer h-6 w-48 rounded" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="skeleton-shimmer h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="skeleton-shimmer h-4 w-full rounded" />
                <div className="skeleton-shimmer h-3 w-2/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default EmptyState;
