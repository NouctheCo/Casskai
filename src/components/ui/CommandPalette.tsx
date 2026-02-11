/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

/**
 * CommandPalette - Palette de commandes (Ctrl+K)
 *
 * Features:
 * - Recherche fuzzy globale
 * - Navigation rapide vers pages
 * - Actions rapides (créer facture, nouveau client, etc.)
 * - Raccourcis clavier visibles
 * - Historique des recherches récentes
 * - Catégorisation des résultats
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Home,
  FileText,
  Users,
  ShoppingCart,
  Package,
  Briefcase,
  Calendar,
  Settings,
  HelpCircle,
  TrendingUp,
  CreditCard,
  Building,
  UserPlus,
  FilePlus,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

/**
 * Type de commande
 */
export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  category?: string;
  keywords?: string[];
  action: () => void;
  shortcut?: string;
}

/**
 * Props de la Command Palette
 */
export interface CommandPaletteProps {
  /**
   * Palette ouverte
   */
  isOpen: boolean;

  /**
   * Callback fermeture
   */
  onClose: () => void;

  /**
   * Commandes personnalisées additionnelles
   */
  customCommands?: Command[];

  /**
   * Placeholder de recherche
   */
  searchPlaceholder?: string;

  /**
   * Nombre max de résultats affichés
   */
  maxResults?: number;
}

/**
 * Fuzzy search simple
 */
function fuzzyMatch(search: string, text: string): boolean {
  const searchLower = search.toLowerCase();
  const textLower = text.toLowerCase();

  let searchIndex = 0;
  for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
    if (textLower[i] === searchLower[searchIndex]) {
      searchIndex++;
    }
  }

  return searchIndex === searchLower.length;
}

/**
 * CommandPalette Component
 */
export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  customCommands = [],
  searchPlaceholder = 'Rechercher une page ou une action...',
  maxResults = 10,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Commandes par défaut (navigation)
   */
  const defaultCommands: Command[] = useMemo(
    () => [
      // Navigation pages
      {
        id: 'nav-dashboard',
        label: 'Tableau de bord',
        icon: Home,
        category: 'Navigation',
        keywords: ['home', 'accueil', 'dashboard'],
        action: () => {
          navigate('/dashboard');
          onClose();
        },
      },
      {
        id: 'nav-accounting',
        label: 'Comptabilité',
        icon: FileText,
        category: 'Navigation',
        keywords: ['accounting', 'écritures', 'journal'],
        action: () => {
          navigate('/accounting');
          onClose();
        },
      },
      {
        id: 'nav-invoicing',
        label: 'Facturation',
        icon: FileText,
        category: 'Navigation',
        keywords: ['invoices', 'factures', 'devis'],
        action: () => {
          navigate('/invoicing');
          onClose();
        },
      },
      {
        id: 'nav-clients',
        label: 'CRM & Ventes',
        icon: Users,
        category: 'Navigation',
        keywords: ['crm', 'clients', 'prospects', 'opportunities'],
        action: () => {
          navigate('/sales-crm');
          onClose();
        },
      },
      {
        id: 'nav-third-parties',
        label: 'Tiers (Clients & Fournisseurs)',
        icon: Building,
        category: 'Navigation',
        keywords: ['tiers', 'clients', 'fournisseurs', 'suppliers'],
        action: () => {
          navigate('/third-parties');
          onClose();
        },
      },
      {
        id: 'nav-purchases',
        label: 'Achats',
        icon: ShoppingCart,
        category: 'Navigation',
        keywords: ['purchases', 'achats', 'suppliers'],
        action: () => {
          navigate('/purchases');
          onClose();
        },
      },
      {
        id: 'nav-inventory',
        label: 'Stock & Inventaire',
        icon: Package,
        category: 'Navigation',
        keywords: ['inventory', 'stock', 'articles'],
        action: () => {
          navigate('/inventory');
          onClose();
        },
      },
      {
        id: 'nav-hr',
        label: 'Ressources Humaines',
        icon: Users,
        category: 'Navigation',
        keywords: ['hr', 'rh', 'employés', 'paie'],
        action: () => {
          navigate('/human-resources');
          onClose();
        },
      },
      {
        id: 'nav-projects',
        label: 'Projets',
        icon: Briefcase,
        category: 'Navigation',
        keywords: ['projects', 'projets', 'tasks'],
        action: () => {
          navigate('/projects');
          onClose();
        },
      },
      {
        id: 'nav-contracts',
        label: 'Contrats',
        icon: Calendar,
        category: 'Navigation',
        keywords: ['contracts', 'contrats', 'rfa'],
        action: () => {
          navigate('/contracts');
          onClose();
        },
      },
      {
        id: 'nav-banking',
        label: 'Banque & Trésorerie',
        icon: CreditCard,
        category: 'Navigation',
        keywords: ['banking', 'banque', 'trésorerie', 'cash'],
        action: () => {
          navigate('/banks');
          onClose();
        },
      },
      {
        id: 'nav-reports',
        label: 'Rapports Financiers',
        icon: TrendingUp,
        category: 'Navigation',
        keywords: ['reports', 'rapports', 'bilan', 'compte de résultat'],
        action: () => {
          navigate('/reports');
          onClose();
        },
      },
      {
        id: 'nav-settings',
        label: 'Paramètres',
        icon: Settings,
        category: 'Navigation',
        keywords: ['settings', 'paramètres', 'config'],
        action: () => {
          navigate('/settings');
          onClose();
        },
      },

      // Actions rapides
      {
        id: 'action-new-invoice',
        label: 'Créer une facture',
        icon: FilePlus,
        category: 'Actions',
        keywords: ['nouvelle', 'facture', 'invoice'],
        action: () => {
          navigate('/invoicing');
          onClose();
          // TODO: Trigger modal nouvelle facture
        },
        shortcut: 'Ctrl+N',
      },
      {
        id: 'action-new-client',
        label: 'Ajouter un client',
        icon: UserPlus,
        category: 'Actions',
        keywords: ['nouveau', 'client', 'customer'],
        action: () => {
          navigate('/sales-crm');
          onClose();
          // TODO: Trigger modal nouveau client
        },
      },
      {
        id: 'action-recent',
        label: 'Historique récent',
        icon: Clock,
        category: 'Actions',
        keywords: ['historique', 'récent', 'history'],
        action: () => {
          logger.info('CommandPalette', 'Historique récent');
          onClose();
        },
      },
      {
        id: 'action-help',
        label: 'Centre d\'aide',
        icon: HelpCircle,
        category: 'Aide',
        keywords: ['help', 'aide', 'support', 'documentation'],
        action: () => {
          logger.info('CommandPalette', 'Centre d\'aide');
          onClose();
        },
        shortcut: 'Shift+?',
      },
    ],
    [navigate, onClose]
  );

  /**
   * Toutes les commandes (défaut + custom)
   */
  const allCommands = useMemo(() => {
    return [...defaultCommands, ...customCommands];
  }, [defaultCommands, customCommands]);

  /**
   * Filtrer les commandes par recherche fuzzy
   */
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) {
      return allCommands.slice(0, maxResults);
    }

    const query = searchQuery.trim();
    const matches = allCommands.filter((command) => {
      // Recherche dans le label
      if (fuzzyMatch(query, command.label)) return true;

      // Recherche dans la description
      if (command.description && fuzzyMatch(query, command.description)) return true;

      // Recherche dans les keywords
      if (command.keywords?.some((keyword) => fuzzyMatch(query, keyword))) return true;

      return false;
    });

    return matches.slice(0, maxResults);
  }, [searchQuery, allCommands, maxResults]);

  /**
   * Grouper par catégorie
   */
  const groupedCommands = useMemo(() => {
    const groups = new Map<string, Command[]>();

    filteredCommands.forEach((command) => {
      const category = command.category || 'Autres';
      const existing = groups.get(category) || [];
      groups.set(category, [...existing, command]);
    });

    return groups;
  }, [filteredCommands]);

  /**
   * Reset quand la palette s'ouvre
   */
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  /**
   * Reset sélection quand résultats changent
   */
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  /**
   * Navigation clavier (↑↓ Enter Esc)
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
          break;

        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;

        case 'Enter':
          event.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;

        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    },
    [filteredCommands, selectedIndex, onClose]
  );

  /**
   * Exécuter une commande
   */
  const executeCommand = useCallback((command: Command) => {
    command.action();
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-gray-700">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" strokeWidth={2} />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">Aucun résultat trouvé</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Essayez "facture", "clients", "paramètres"...
              </p>
            </div>
          ) : (
            <div className="py-2">
              {Array.from(groupedCommands.entries()).map(([category, commands]) => (
                <div key={category} className="mb-2">
                  {/* Category Header */}
                  <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {category}
                  </div>

                  {/* Commands */}
                  {commands.map((command, index) => {
                    const globalIndex = filteredCommands.indexOf(command);
                    const isSelected = globalIndex === selectedIndex;
                    const Icon = command.icon;

                    return (
                      <button
                        key={command.id}
                        onClick={() => executeCommand(command)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        )}
                      >
                        {Icon && (
                          <Icon
                            className={cn(
                              'h-5 w-5 flex-shrink-0',
                              isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                            )}
                            strokeWidth={2}
                          />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{command.label}</div>
                          {command.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {command.description}
                            </div>
                          )}
                        </div>

                        {command.shortcut && (
                          <div className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 font-mono">
                            {command.shortcut}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded">↑↓</kbd>
                Naviguer
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded">↵</kbd>
                Sélectionner
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded">Esc</kbd>
                Fermer
              </span>
            </div>
            <span>{filteredCommands.length} résultat{filteredCommands.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
