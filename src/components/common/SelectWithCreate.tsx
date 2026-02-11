/**
 * Composant Select amélioré avec recherche et création à la volée
 * Utilisable pour Fournisseurs, Clients, Catégories, etc.
 *
 * Utilise Radix Popover pour le dropdown, ce qui garantit :
 * - Pas de clipping par overflow des parents (Dialog, etc.)
 * - Compatibilité avec le focus trap de Radix Dialog
 * - Fermeture correcte sans interférences
 *
 * Deux modes de création :
 * - onCreateClick : ouvre un formulaire externe (ex: ThirdPartyFormDialog)
 * - onCreate : création inline avec un champ de saisie rapide
 */
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, X, Check, ChevronDown } from 'lucide-react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { logger } from '@/lib/logger';

interface Option {
  value: string;
  label: string;
  sublabel?: string;
}

interface SelectWithCreateProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  createLabel?: string;
  /** Callback pour ouvrir un formulaire de création externe (prioritaire sur onCreate) */
  onCreateClick?: () => void;
  /** Callback pour création inline rapide (utilisé si onCreateClick n'est pas défini) */
  onCreate?: (name: string) => Promise<Option | null>;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SelectWithCreate: React.FC<SelectWithCreateProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  searchPlaceholder = 'Rechercher...',
  createLabel = 'Créer',
  onCreateClick,
  onCreate,
  isLoading = false,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [creatingLoading, setCreatingLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus le champ de recherche quand le popover s'ouvre
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Petit délai pour laisser Radix terminer l'animation d'ouverture
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
    if (!isOpen) {
      setSearch('');
      setIsCreating(false);
      setNewItemName('');
    }
    return undefined;
  }, [isOpen]);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase()) ||
    option.sublabel?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(o => o.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleCreateClick = () => {
    if (onCreateClick) {
      setIsOpen(false);
      // Petit délai pour laisser le popover se fermer avant d'ouvrir le dialog
      setTimeout(() => onCreateClick(), 100);
    } else {
      setIsCreating(true);
    }
  };

  const handleInlineCreate = async () => {
    if (!newItemName.trim() || !onCreate) return;
    setCreatingLoading(true);
    try {
      const newOption = await onCreate(newItemName.trim());
      if (newOption) {
        onChange(newOption.value);
        setIsOpen(false);
      }
    } catch (error) {
      logger.error('SelectWithCreate', 'Erreur création:', error);
    } finally {
      setCreatingLoading(false);
    }
  };

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <PopoverPrimitive.Trigger asChild disabled={disabled}>
        <button
          type="button"
          className={`w-full px-3 py-2 border rounded-lg text-left flex items-center justify-between transition-all
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white dark:bg-gray-800 hover:border-primary cursor-pointer'}
            ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300 dark:border-gray-600'}
            ${className}
          `}
        >
          <span className={selectedOption ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-[200] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
          style={{ width: 'var(--radix-popover-trigger-width)' }}
          onOpenAutoFocus={(e) => {
            // Empêcher Radix de focus le premier élément focusable (on veut focus le search input)
            e.preventDefault();
            searchInputRef.current?.focus();
          }}
        >
          {/* Recherche */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-600">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsOpen(false);
                }}
              />
            </div>
          </div>

          {/* Options */}
          <div className="overflow-y-auto" style={{ maxHeight: '200px' }}>
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 text-sm">Chargement...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Aucun résultat pour &quot;{search}&quot;
              </div>
            ) : (
              filteredOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors
                    ${option.value === value ? 'bg-primary/10 text-primary' : ''}
                  `}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{option.label}</div>
                    {option.sublabel && (
                      <div className="text-xs text-gray-500 mt-0.5">{option.sublabel}</div>
                    )}
                  </div>
                  {option.value === value && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                </button>
              ))
            )}
          </div>

          {/* Bouton créer */}
          {(onCreateClick || onCreate) && (
            <div className="border-t border-gray-200 dark:border-gray-600 p-2">
              {isCreating && onCreate && !onCreateClick ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Nom..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleInlineCreate(); }
                      if (e.key === 'Escape') { setIsCreating(false); setNewItemName(''); }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleInlineCreate}
                    disabled={creatingLoading || !newItemName.trim()}
                    className="px-3 py-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-primary/90 transition-colors"
                  >
                    {creatingLoading ? '...' : <Check className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsCreating(false); setNewItemName(''); }}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateClick}
                  className="w-full px-3 py-2 text-left text-primary hover:bg-primary/10 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-medium">{createLabel}</span>
                </button>
              )}
            </div>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};
