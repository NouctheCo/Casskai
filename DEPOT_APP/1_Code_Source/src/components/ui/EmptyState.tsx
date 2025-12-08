/**
 * EmptyState Component
 * Composant réutilisable pour afficher un état vide avec guidage utilisateur
 * Utilisé pour les listes/tables vides, résultats de recherche vides, etc.
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
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
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-12 px-4',
        styles.container,
        className
      )}
    >
      {/* Icône */}
      <div
        className={cn(
          'mb-4 flex items-center justify-center',
          'rounded-full bg-muted/50 p-4',
          'transition-transform hover:scale-105'
        )}
      >
        <Icon className={cn(iconSizes[iconSize], styles.icon)} strokeWidth={1.5} />
      </div>

      {/* Titre */}
      <h3
        className={cn(
          'text-lg font-semibold mb-2',
          'sm:text-xl',
          styles.title
        )}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className={cn(
          'text-sm max-w-md mb-6',
          'sm:text-base',
          styles.description
        )}
      >
        {description}
      </p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 items-center">
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
        </div>
      )}
    </div>
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
 * État vide avec appel à l'action prononcé
 */
export const EmptyWithAction: React.FC<Omit<EmptyStateProps, 'variant'>> = (props) => (
  <EmptyState {...props} variant="accent" iconSize="lg" />
);

export default EmptyState;
