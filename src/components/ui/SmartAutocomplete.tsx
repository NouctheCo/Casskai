/**
 * CassKai - Smart Autocomplete Component
 *
 * Phase 2 (P1) - UX Formulaires Premium
 *
 * Fonctionnalités:
 * - Recherche floue (fuzzy search)
 * - Raccourcis clavier (↑↓ navigation, Enter sélection, Esc fermeture)
 * - Création rapide si non trouvé
 * - Historique des sélections récentes
 * - Groupes et catégories
 * - Recherche asynchrone avec debounce
 * - Highlighting des correspondances
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown, Plus, Clock, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

export interface AutocompleteOption {
  value: string;
  label: string;
  description?: string;
  category?: string;
  metadata?: Record<string, any>;
  disabled?: boolean;
}

export interface SmartAutocompleteProps {
  value?: string;
  onChange: (value: string, option?: AutocompleteOption) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
  allowCreate?: boolean;
  onCreateNew?: (searchTerm: string) => void;
  createLabel?: string;
  showRecent?: boolean;
  maxRecent?: number;
  groups?: boolean;
  disabled?: boolean;
  className?: string;
  searchFunction?: (query: string, options: AutocompleteOption[]) => AutocompleteOption[];
  onSearch?: (query: string) => Promise<AutocompleteOption[]>;
  debounceMs?: number;
}

/**
 * Recherche floue simple (fuzzy search)
 */
function fuzzySearch(query: string, text: string): boolean {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // Recherche exacte
  if (textLower.includes(queryLower)) {
    return true;
  }

  // Recherche floue : chaque caractère doit apparaître dans l'ordre
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }

  return queryIndex === queryLower.length;
}

/**
 * Highlight des correspondances dans le texte
 */
function highlightMatches(text: string, query: string): React.ReactNode {
  if (!query) return text;

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  for (let i = 0; i < textLower.length; i++) {
    if (textLower[i] === queryLower[lastIndex]) {
      if (lastIndex === 0) {
        // Début de la correspondance
        if (i > 0) {
          parts.push(<span key={`text-${parts.length}`}>{text.substring(0, i)}</span>);
        }
      }

      parts.push(
        <span key={`match-${parts.length}`} className="font-bold text-blue-600 dark:text-blue-400">
          {text[i]}
        </span>
      );

      lastIndex++;

      if (lastIndex === queryLower.length) {
        // Fin de la correspondance
        if (i + 1 < text.length) {
          parts.push(<span key={`text-${parts.length}`}>{text.substring(i + 1)}</span>);
        }
        break;
      }
    }
  }

  return parts.length > 0 ? <>{parts}</> : text;
}

export default function SmartAutocomplete({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner...',
  emptyMessage = 'Aucun résultat trouvé',
  searchPlaceholder = 'Rechercher...',
  allowCreate = false,
  onCreateNew,
  createLabel = 'Créer',
  showRecent = true,
  maxRecent = 5,
  groups = false,
  disabled = false,
  className,
  searchFunction,
  onSearch,
  debounceMs = 300
}: SmartAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSelections, setRecentSelections] = useState<string[]>([]);
  const [asyncOptions, setAsyncOptions] = useState<AutocompleteOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  /**
   * Charger les sélections récentes depuis localStorage
   */
  useEffect(() => {
    if (!showRecent) return;

    try {
      const stored = localStorage.getItem('smart-autocomplete-recent');
      if (stored) {
        setRecentSelections(JSON.parse(stored));
      }
    } catch (error) {
      logger.error('SmartAutocomplete', 'Error loading recent selections:', error);
    }
  }, [showRecent]);

  /**
   * Sauvegarder une sélection récente
   */
  const saveRecentSelection = useCallback((optionValue: string) => {
    if (!showRecent) return;

    setRecentSelections((prev) => {
      const updated = [optionValue, ...prev.filter((v) => v !== optionValue)].slice(0, maxRecent);
      try {
        localStorage.setItem('smart-autocomplete-recent', JSON.stringify(updated));
      } catch (error) {
        logger.error('SmartAutocomplete', 'Error saving recent selection:', error);
      }
      return updated;
    });
  }, [showRecent, maxRecent]);

  /**
   * Recherche asynchrone avec debounce
   */
  useEffect(() => {
    if (!onSearch || !searchQuery) {
      setAsyncOptions([]);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await onSearch(searchQuery);
        setAsyncOptions(results);
      } catch (error) {
        logger.error('SmartAutocomplete', 'Error in async search:', error);
        setAsyncOptions([]);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, onSearch, debounceMs]);

  /**
   * Filtrer les options selon la recherche
   */
  const filteredOptions = useMemo(() => {
    const allOptions = onSearch ? asyncOptions : options;

    if (!searchQuery) {
      return allOptions;
    }

    if (searchFunction) {
      return searchFunction(searchQuery, allOptions);
    }

    // Recherche floue par défaut
    return allOptions.filter((option) => {
      const matchLabel = fuzzySearch(searchQuery, option.label);
      const matchDescription = option.description ? fuzzySearch(searchQuery, option.description) : false;
      const matchValue = fuzzySearch(searchQuery, option.value);

      return matchLabel || matchDescription || matchValue;
    });
  }, [searchQuery, options, asyncOptions, onSearch, searchFunction]);

  /**
   * Grouper les options par catégorie
   */
  const groupedOptions = useMemo(() => {
    if (!groups) {
      return { 'Tous': filteredOptions };
    }

    const grouped: Record<string, AutocompleteOption[]> = {};

    filteredOptions.forEach((option) => {
      const category = option.category || 'Autres';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(option);
    });

    return grouped;
  }, [filteredOptions, groups]);

  /**
   * Options récentes
   */
  const recentOptions = useMemo(() => {
    if (!showRecent || recentSelections.length === 0) {
      return [];
    }

    return recentSelections
      .map((val) => options.find((opt) => opt.value === val))
      .filter((opt): opt is AutocompleteOption => opt !== undefined);
  }, [showRecent, recentSelections, options]);

  /**
   * Gérer la sélection
   */
  const handleSelect = useCallback((optionValue: string) => {
    const option = options.find((opt) => opt.value === optionValue);

    if (option && !option.disabled) {
      onChange(optionValue, option);
      saveRecentSelection(optionValue);
      setOpen(false);
      setSearchQuery('');
    }
  }, [options, onChange, saveRecentSelection]);

  /**
   * Créer un nouvel élément
   */
  const handleCreate = useCallback(() => {
    if (allowCreate && onCreateNew && searchQuery) {
      onCreateNew(searchQuery);
      setOpen(false);
      setSearchQuery('');
    }
  }, [allowCreate, onCreateNew, searchQuery]);

  /**
   * Effacer la sélection
   */
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  }, [onChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="flex items-center space-x-1">
            {selectedOption && !disabled && (
              <X
                className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isSearching && (
              <div className="flex items-center justify-center py-6">
                <Search className="h-4 w-4 animate-pulse text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Recherche en cours...</span>
              </div>
            )}

            {!isSearching && filteredOptions.length === 0 && (
              <CommandEmpty>
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <p className="text-sm text-gray-500 mb-3">{emptyMessage}</p>

                  {allowCreate && onCreateNew && searchQuery && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreate}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {createLabel} "{searchQuery}"
                    </Button>
                  )}
                </div>
              </CommandEmpty>
            )}

            {!isSearching && recentOptions.length > 0 && !searchQuery && (
              <CommandGroup heading="Récents">
                {recentOptions.map((option) => (
                  <CommandItem
                    key={`recent-${option.value}`}
                    value={option.value}
                    onSelect={handleSelect}
                    disabled={option.disabled}
                  >
                    <Clock className="mr-2 h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-gray-500">{option.description}</div>
                      )}
                    </div>
                    <Check
                      className={cn(
                        'ml-2 h-4 w-4',
                        value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {!isSearching && Object.entries(groupedOptions).map(([category, categoryOptions]) => (
              <CommandGroup key={category} heading={groups ? category : undefined}>
                {categoryOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                    disabled={option.disabled}
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {highlightMatches(option.label, searchQuery)}
                      </div>
                      {option.description && (
                        <div className="text-xs text-gray-500">
                          {highlightMatches(option.description, searchQuery)}
                        </div>
                      )}
                      {option.category && groups && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {option.category}
                        </Badge>
                      )}
                    </div>
                    <Check
                      className={cn(
                        'ml-2 h-4 w-4',
                        value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
