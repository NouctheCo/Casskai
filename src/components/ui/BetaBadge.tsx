import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface BetaBadgeProps {
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

/**
 * Badge Beta pour indiquer les fonctionnalités en développement
 * Conforme aux recommandations marketing de transparence
 */
export const BetaBadge: React.FC<BetaBadgeProps> = ({ 
  variant = 'secondary',
  className = '' 
}) => {
  const { t } = useTranslation();

  return (
    <Badge 
      variant={variant}
      className={`ml-2 text-xs font-medium ${className}`}
    >
      {t('common.beta', 'BETA')}
    </Badge>
  );
};

/**
 * Badge pour fonctionnalités "Coming Soon"
 */
export const ComingSoonBadge: React.FC<BetaBadgeProps> = ({ 
  variant = 'outline',
  className = '' 
}) => {
  const { t } = useTranslation();

  return (
    <Badge 
      variant={variant}
      className={`ml-2 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 ${className}`}
    >
      {t('common.comingSoon', 'Bientôt disponible')}
    </Badge>
  );
};
