/**
 * CassKai - Composant d'aide contextuelle
 *
 * Affiche une icône (i) avec un tooltip d'aide au survol/clic
 * Supporte différents niveaux d'aide : basique, détaillé, expert
 */
import React from 'react';
import { Info, BookOpen, Lightbulb, AlertCircle } from 'lucide-react';
import { SmartTooltip } from './SmartTooltip';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

// Types de contenu d'aide
export type HelpLevel = 'basic' | 'detailed' | 'expert';
export type HelpVariant = 'info' | 'tip' | 'warning' | 'learn';

export interface HelpContent {
  title: string;
  description: string;
  details?: string;
  tips?: string[];
  learnMoreUrl?: string;
  relatedTopics?: string[];
}

export interface HelpTooltipProps {
  /** Clé de traduction pour le contenu d'aide (ex: "help.periodClosure.title") */
  helpKey?: string;
  /** Contenu d'aide direct (si pas de clé de traduction) */
  content?: HelpContent;
  /** Niveau d'aide affiché */
  level?: HelpLevel;
  /** Variante visuelle */
  variant?: HelpVariant;
  /** Taille de l'icône */
  size?: 'sm' | 'md' | 'lg';
  /** Position du tooltip */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Classes CSS additionnelles */
  className?: string;
  /** Afficher en ligne avec le texte */
  inline?: boolean;
  /** Délai avant affichage (ms) */
  delay?: number;
  /** Interactif (permet de cliquer sur les liens) */
  interactive?: boolean;
}

// Icônes par variante
const variantIcons = {
  info: Info,
  tip: Lightbulb,
  warning: AlertCircle,
  learn: BookOpen,
};

// Couleurs par variante
const variantColors = {
  info: 'text-blue-500 hover:text-blue-600',
  tip: 'text-amber-500 hover:text-amber-600',
  warning: 'text-orange-500 hover:text-orange-600',
  learn: 'text-purple-500 hover:text-purple-600',
};

// Couleurs de fond du tooltip par variante
const variantBgColors = {
  info: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950',
  tip: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950',
  warning: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950',
  learn: 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950',
};

// Tailles d'icône
const iconSizes = {
  sm: 14,
  md: 16,
  lg: 20,
};

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  helpKey,
  content,
  level = 'basic',
  variant = 'info',
  size = 'md',
  side = 'top',
  className,
  inline = true,
  delay = 300,
  interactive = true,
}) => {
  const { t, i18n } = useTranslation();

  // Récupérer le contenu depuis les traductions ou le prop direct
  const helpContent: HelpContent = helpKey
    ? {
        title: t(`${helpKey}.title`, { defaultValue: '' }),
        description: t(`${helpKey}.description`, { defaultValue: '' }),
        details: t(`${helpKey}.details`, { defaultValue: '' }),
        tips: i18n.exists(`${helpKey}.tips`)
          ? (t(`${helpKey}.tips`, { returnObjects: true }) as string[])
          : undefined,
        learnMoreUrl: t(`${helpKey}.learnMoreUrl`, { defaultValue: '' }) || undefined,
      }
    : content || { title: '', description: '' };

  // Si pas de contenu, ne pas afficher
  if (!helpContent.title && !helpContent.description) {
    return null;
  }

  const Icon = variantIcons[variant];
  const iconSize = iconSizes[size];

  // Construire le contenu du tooltip
  const tooltipContent = (
    <div className={cn(
      "max-w-xs space-y-2 p-1",
      variantBgColors[variant]
    )}>
      {/* Titre */}
      {helpContent.title && (
        <div className="flex items-center gap-2">
          <Icon size={16} className={variantColors[variant]}/>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
            {helpContent.title}
          </h4>
        </div>
      )}

      {/* Description */}
      {helpContent.description && (
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {helpContent.description}
        </p>
      )}

      {/* Détails (niveau detailed ou expert) */}
      {(level === 'detailed' || level === 'expert') && helpContent.details && (
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
          {helpContent.details}
        </p>
      )}

      {/* Tips (niveau expert) */}
      {level === 'expert' && helpContent.tips && helpContent.tips.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
          <div className="flex items-center gap-1 mb-1">
            <Lightbulb size={12} className="text-amber-500"/>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {t('help.tips', 'Conseils')}
            </span>
          </div>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-4">
            {helpContent.tips.map((tip, index) => (
              <li key={index} className="list-disc">{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Lien "En savoir plus" */}
      {interactive && helpContent.learnMoreUrl && (
        <a href={helpContent.learnMoreUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-2">
          <BookOpen size={12}/>
          {t('help.learnMore', 'En savoir plus')}
        </a>
      )}
    </div>
  );

  return (
    <SmartTooltip content={tooltipContent} side={side} delay={delay} interactive={interactive} theme="light" animation="scale" maxWidth={320}>
      <button type="button" className={cn(
          "inline-flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500",
          variantColors[variant],
          inline ? "ml-1" : "",
          size === 'sm' && "p-0.5",
          size === 'md' && "p-0.5",
          size === 'lg' && "p-1",
          className
        )} aria-label={t('help.showHelp', 'Afficher l\'aide')}>
        <Icon size={iconSize}/>
      </button>
    </SmartTooltip>
  );
};

/**
 * Composant HelpLabel - Label avec aide intégrée
 *
 * Usage: <HelpLabel label="Clôture période" helpKey="help.periodClosure"/>
 */
export interface HelpLabelProps {
  label: string;
  helpKey?: string;
  helpContent?: HelpContent;
  helpVariant?: HelpVariant;
  helpLevel?: HelpLevel;
  required?: boolean;
  className?: string;
  labelClassName?: string;
}

export const HelpLabel: React.FC<HelpLabelProps> = ({
  label,
  helpKey,
  helpContent,
  helpVariant = 'info',
  helpLevel = 'basic',
  required = false,
  className,
  labelClassName,
}) => {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className={cn("text-sm font-medium text-gray-700 dark:text-gray-300", labelClassName)}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {(helpKey || helpContent) && (
        <HelpTooltip helpKey={helpKey} content={helpContent} variant={helpVariant} level={helpLevel} size="sm"/>
      )}
    </div>
  );
};

/**
 * Composant HelpSection - Section avec aide contextuelle
 *
 * Usage:
 * <HelpSection helpKey="help.journalEntries">
 *   <JournalEntriesForm />
 * </HelpSection>
 */
export interface HelpSectionProps {
  children: React.ReactNode;
  helpKey?: string;
  helpContent?: HelpContent;
  helpVariant?: HelpVariant;
  helpLevel?: HelpLevel;
  title?: string;
  showHelpInTitle?: boolean;
  className?: string;
}

export const HelpSection: React.FC<HelpSectionProps> = ({
  children,
  helpKey,
  helpContent,
  helpVariant = 'info',
  helpLevel = 'basic',
  title,
  showHelpInTitle = true,
  className,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {showHelpInTitle && (helpKey || helpContent) && (
            <HelpTooltip helpKey={helpKey} content={helpContent} variant={helpVariant} level={helpLevel} size="md"/>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

/**
 * Composant HelpBanner - Bannière d'aide dépliable
 */
export interface HelpBannerProps {
  helpKey?: string;
  helpContent?: HelpContent;
  variant?: HelpVariant;
  dismissible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

export const HelpBanner: React.FC<HelpBannerProps> = ({
  helpKey,
  helpContent,
  variant = 'info',
  dismissible = true,
  defaultExpanded = false,
  className,
}) => {
  const { t, i18n } = useTranslation();
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Récupérer les tips de manière sécurisée
  const getTips = (): string[] | undefined => {
    if (!helpKey || !i18n.exists(`${helpKey}.tips`)) return undefined;
    const tipsValue = t(`${helpKey}.tips`, { returnObjects: true }) as any;
    // Vérifier que c'est bien un tableau
    if (Array.isArray(tipsValue)) {
      return tipsValue as string[];
    }
    // Si c'est une chaîne, la convertir en tableau
    if (typeof tipsValue === 'string' && tipsValue.trim()) {
      return [tipsValue];
    }
    return undefined;
  };

  const content: HelpContent = helpKey
    ? {
        title: t(`${helpKey}.title`, { defaultValue: '' }),
        description: t(`${helpKey}.description`, { defaultValue: '' }),
        details: t(`${helpKey}.details`, { defaultValue: '' }),
        tips: getTips(),
      }
    : helpContent || { title: '', description: '' };

  if (isDismissed || (!content.title && !content.description)) {
    return null;
  }

  const Icon = variantIcons[variant];
  const bgColors = {
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    tip: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
    warning: 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800',
    learn: 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800',
  };

  return (
    <div className={cn(
      "rounded-lg border p-4",
      bgColors[variant],
      className
    )}>
      <div className="flex items-start gap-3">
        <Icon size={20} className={variantColors[variant]}/>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              {content.title}
            </h4>
            <div className="flex items-center gap-2">
              {content.details && (
                <button type="button" onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {isExpanded ? t('help.showLess', 'Moins') : t('help.showMore', 'Plus')}
                </button>
              )}
              {dismissible && (
                <button type="button" onClick={() => setIsDismissed(true)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label={t('help.dismiss', 'Fermer')}
                >
                  ×
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
            {content.description}
          </p>
          {isExpanded && content.details && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {content.details}
            </p>
          )}
          {isExpanded && content.tips && content.tips.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1 mb-1">
                <Lightbulb size={14} className="text-amber-500"/>
                <span className="text-xs font-medium">{t('help.tips', 'Conseils')}</span>
              </div>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-5">
                {content.tips.map((tip, index) => (
                  <li key={index} className="list-disc">{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpTooltip;
