/**
 * CassKai - Quick Actions Bar
 *
 * Phase 2 (P1) - Composants UI Premium
 *
 * Fonctionnalités:
 * - Barre d'actions rapides contextuelle
 * - Positionnement fixe ou flottant
 * - Shortcuts clavier automatiques
 * - Animations smooth
 * - Support mobile avec menu drawer
 * - Actions groupées par catégorie
 * - Icônes Lucide React
 * - Tooltips informatifs
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import {
  LucideIcon,
  FileText,
  Users,
  Package,
  Settings,
  Search,
  Menu,
} from 'lucide-react';

export interface QuickAction {
  /** ID unique de l'action */
  id: string;
  /** Label affiché */
  label: string;
  /** Icône Lucide React */
  icon: LucideIcon;
  /** Callback au clic */
  onClick: () => void;
  /** Shortcut clavier (ex: "Ctrl+N") */
  shortcut?: string;
  /** Badge de notification */
  badge?: number | string;
  /** Catégorie (pour groupement) */
  category?: string;
  /** Désactiver l'action */
  disabled?: boolean;
  /** Variante de couleur */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  /** Afficher uniquement sur desktop */
  desktopOnly?: boolean;
}

export interface QuickActionsBarProps {
  /** Liste des actions */
  actions: QuickAction[];
  /** Position de la barre */
  position?: 'top' | 'bottom' | 'floating';
  /** Afficher les shortcuts */
  showShortcuts?: boolean;
  /** Compacte (icônes seulement) */
  compact?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
  /** Titre de la barre (mobile) */
  title?: string;
}

/**
 * Variantes de couleur
 */
const variantClasses = {
  default: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100',
  primary: 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-900 dark:text-blue-100',
  success: 'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-900 dark:text-green-100',
  warning: 'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 text-yellow-900 dark:text-yellow-100',
  danger: 'bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-900 dark:text-red-100',
};

/**
 * Bouton d'action individuel
 */
function ActionButton({
  action,
  compact,
  showShortcut,
}: {
  action: QuickAction;
  compact: boolean;
  showShortcut: boolean;
}) {
  const Icon = action.icon;
  const variant = action.variant || 'default';

  const handleClick = useCallback(() => {
    logger.debug('QuickActionsBar', 'Action clicked:', action.id);
    action.onClick();
  }, [action]);

  const buttonContent = (
    <Button
      variant="ghost"
      size={compact ? 'sm' : 'default'}
      disabled={action.disabled}
      onClick={handleClick}
      className={cn(
        'relative gap-2 transition-all duration-200',
        variantClasses[variant],
        compact ? 'p-2' : 'px-4 py-2'
      )}
    >
      <Icon className={cn('flex-shrink-0', compact ? 'w-4 h-4' : 'w-5 h-5')} />
      {!compact && <span className="font-medium">{action.label}</span>}
      {action.badge && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full px-1 text-xs"
        >
          {action.badge}
        </Badge>
      )}
      {showShortcut && action.shortcut && !compact && (
        <Badge variant="outline" className="ml-auto text-xs font-mono">
          {action.shortcut}
        </Badge>
      )}
    </Button>
  );

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="flex flex-col items-center gap-1">
              <span>{action.label}</span>
              {action.shortcut && (
                <Badge variant="outline" className="text-xs font-mono">
                  {action.shortcut}
                </Badge>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
}

/**
 * Quick Actions Bar Component
 */
export default function QuickActionsBar({
  actions,
  position = 'top',
  showShortcuts = true,
  compact = false,
  className,
  title = 'Actions Rapides',
}: QuickActionsBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Filtrer actions desktop uniquement sur mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const filteredActions = isMobile
    ? actions.filter((a) => !a.desktopOnly)
    : actions;

  // Grouper par catégorie
  const groupedActions = filteredActions.reduce((groups, action) => {
    const category = action.category || 'default';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(action);
    return groups;
  }, {} as Record<string, QuickAction[]>);

  const categories = Object.keys(groupedActions);

  /**
   * Desktop: barre fixe ou flottante
   */
  const renderDesktopBar = () => {
    const positionClasses = {
      top: 'fixed top-0 left-0 right-0 z-40 border-b',
      bottom: 'fixed bottom-0 left-0 right-0 z-40 border-t',
      floating:
        'fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 rounded-full shadow-2xl border',
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: position === 'bottom' ? 20 : -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: position === 'bottom' ? 20 : -20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          positionClasses[position],
          'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md',
          className
        )}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
            {categories.map((category, index) => (
              <React.Fragment key={category}>
                {index > 0 && <Separator orientation="vertical" className="h-8" />}
                <div className="flex items-center gap-2">
                  {groupedActions[category].map((action) => (
                    <ActionButton
                      key={action.id}
                      action={action}
                      compact={compact}
                      showShortcut={showShortcuts}
                    />
                  ))}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  /**
   * Mobile: drawer menu
   */
  const renderMobileDrawer = () => {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="default"
            size="lg"
            className="fixed bottom-6 right-6 z-50 rounded-full shadow-2xl w-14 h-14 p-0"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {categories.map((category) => (
              <div key={category}>
                {category !== 'default' && (
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">
                    {category}
                  </h3>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {groupedActions[category].map((action) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={action.id}
                        variant="outline"
                        disabled={action.disabled}
                        onClick={() => {
                          action.onClick();
                          setIsOpen(false);
                        }}
                        className="h-auto flex-col gap-2 py-4 relative"
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-sm font-medium">{action.label}</span>
                        {action.badge && (
                          <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full px-1 text-xs"
                          >
                            {action.badge}
                          </Badge>
                        )}
                        {action.shortcut && (
                          <Badge variant="outline" className="text-xs font-mono mt-1">
                            {action.shortcut}
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  // Afficher desktop ou mobile
  return isMobile ? renderMobileDrawer() : renderDesktopBar();
}

/**
 * Hook pour créer des actions rapides
 */
export function useQuickActions(config: {
  onNewInvoice?: () => void;
  onNewClient?: () => void;
  onNewProduct?: () => void;
  onSearch?: () => void;
  onSettings?: () => void;
}): QuickAction[] {
  const actions: QuickAction[] = [];

  if (config.onNewInvoice) {
    actions.push({
      id: 'new-invoice',
      label: 'Nouvelle Facture',
      icon: FileText,
      onClick: config.onNewInvoice,
      shortcut: 'Ctrl+N',
      variant: 'primary',
      category: 'Création',
    });
  }

  if (config.onNewClient) {
    actions.push({
      id: 'new-client',
      label: 'Nouveau Client',
      icon: Users,
      onClick: config.onNewClient,
      shortcut: 'Ctrl+Shift+C',
      category: 'Création',
    });
  }

  if (config.onNewProduct) {
    actions.push({
      id: 'new-product',
      label: 'Nouveau Produit',
      icon: Package,
      onClick: config.onNewProduct,
      shortcut: 'Ctrl+Shift+P',
      category: 'Création',
    });
  }

  if (config.onSearch) {
    actions.push({
      id: 'search',
      label: 'Recherche',
      icon: Search,
      onClick: config.onSearch,
      shortcut: 'Ctrl+K',
      category: 'Navigation',
    });
  }

  if (config.onSettings) {
    actions.push({
      id: 'settings',
      label: 'Paramètres',
      icon: Settings,
      onClick: config.onSettings,
      shortcut: 'Ctrl+,',
      category: 'Navigation',
      desktopOnly: true,
    });
  }

  return actions;
}

/**
 * Composant QuickActions avec Keyboard Shortcuts intégrés
 */
export function QuickActionsWithShortcuts({
  actions,
  ...props
}: QuickActionsBarProps) {
  // Setup keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (!modifier) return;

      actions.forEach((action) => {
        if (!action.shortcut || action.disabled) return;

        // Parse shortcut (ex: "Ctrl+N" ou "Ctrl+Shift+C")
        const parts = action.shortcut.toLowerCase().split('+');
        const needsShift = parts.includes('shift');
        const key = parts[parts.length - 1];

        if (e.key.toLowerCase() === key && e.shiftKey === needsShift) {
          e.preventDefault();
          e.stopPropagation();
          action.onClick();
          logger.debug('QuickActionsBar', 'Shortcut triggered:', action.shortcut);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [actions]);

  return <QuickActionsBar actions={actions} {...props} />;
}
