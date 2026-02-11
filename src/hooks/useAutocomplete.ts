/**
 * Hook pour autocomplétion intelligente dans les formulaires
 * Recherche fuzzy avec performance <100ms
 *
 * @module useAutocomplete
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

export interface AutocompleteOption<T = any> {
  /**
   * Valeur unique de l'option
   */
  value: string | number;

  /**
   * Label affiché à l'utilisateur
   */
  label: string;

  /**
   * Données complètes de l'option (optionnel)
   */
  data?: T;

  /**
   * Score de pertinence (0-1, calculé automatiquement)
   */
  score?: number;

  /**
   * Catégorie (pour regroupement)
   */
  category?: string;

  /**
   * Mots-clés additionnels pour la recherche
   */
  keywords?: string[];
}

export interface UseAutocompleteOptions<T = any> {
  /**
   * Options disponibles
   */
  options: AutocompleteOption<T>[];

  /**
   * Nombre max de résultats
   * @default 10
   */
  maxResults?: number;

  /**
   * Score minimum pour afficher (0-1)
   * @default 0.3
   */
  minScore?: number;

  /**
   * Fonction de recherche custom
   */
  customSearch?: (query: string, options: AutocompleteOption<T>[]) => AutocompleteOption<T>[];

  /**
   * Fonction de tri custom
   */
  customSort?: (a: AutocompleteOption<T>, b: AutocompleteOption<T>) => number;

  /**
   * Debounce delay (ms)
   * @default 150
   */
  debounceMs?: number;

  /**
   * Recherche case-sensitive
   * @default false
   */
  caseSensitive?: boolean;

  /**
   * Activer fuzzy matching
   * @default true
   */
  fuzzyMatch?: boolean;

  /**
   * Callback quand une option est sélectionnée
   */
  onSelect?: (option: AutocompleteOption<T>) => void;

  /**
   * Callback quand la recherche change
   */
  onChange?: (query: string) => void;

  /**
   * Logging pour debug
   * @default false
   */
  debug?: boolean;
}

export interface UseAutocompleteReturn<T = any> {
  /**
   * Query de recherche actuelle
   */
  query: string;

  /**
   * Mettre à jour la query
   */
  setQuery: (query: string) => void;

  /**
   * Résultats filtrés
   */
  results: AutocompleteOption<T>[];

  /**
   * Est en train de chercher (debounce)
   */
  isSearching: boolean;

  /**
   * Option sélectionnée actuellement
   */
  selected: AutocompleteOption<T> | null;

  /**
   * Sélectionner une option
   */
  selectOption: (option: AutocompleteOption<T>) => void;

  /**
   * Index de l'option surlignée (navigation clavier)
   */
  highlightedIndex: number;

  /**
   * Naviguer vers le haut (↑)
   */
  highlightPrevious: () => void;

  /**
   * Naviguer vers le bas (↓)
   */
  highlightNext: () => void;

  /**
   * Sélectionner l'option surlignée (Enter)
   */
  selectHighlighted: () => void;

  /**
   * Réinitialiser
   */
  reset: () => void;

  /**
   * Nombre total de résultats
   */
  totalResults: number;

  /**
   * Temps de recherche (ms) - pour debug
   */
  searchTime?: number;
}

/**
 * Calcule le score de fuzzy matching entre deux strings
 * Plus le score est élevé, meilleur est le match
 *
 * @returns score entre 0 et 1
 */
function fuzzyScore(query: string, target: string, caseSensitive = false): number {
  if (!query) return 1;
  if (!target) return 0;

  const q = caseSensitive ? query : query.toLowerCase();
  const t = caseSensitive ? target : target.toLowerCase();

  // Match exact = score parfait
  if (t === q) return 1.0;

  // Commence par = très bon score
  if (t.startsWith(q)) return 0.9;

  // Contient = bon score
  if (t.includes(q)) return 0.7;

  // Fuzzy matching caractère par caractère
  let queryIndex = 0;
  let targetIndex = 0;
  let matches = 0;
  let consecutiveMatches = 0;

  while (queryIndex < q.length && targetIndex < t.length) {
    if (q[queryIndex] === t[targetIndex]) {
      matches++;
      consecutiveMatches++;
      queryIndex++;
    } else {
      consecutiveMatches = 0;
    }
    targetIndex++;
  }

  // Tous les caractères trouvés ?
  if (queryIndex !== q.length) return 0;

  // Score basé sur le ratio de matches et la consécutivité
  const matchRatio = matches / q.length;
  const consecutiveBonus = consecutiveMatches / q.length * 0.2;
  const positionPenalty = targetIndex / t.length * 0.1;

  return Math.max(0, matchRatio + consecutiveBonus - positionPenalty);
}

/**
 * Hook pour autocomplétion intelligente
 *
 * @example
 * function MyInput() {
 *   const {
 *     query,
 *     setQuery,
 *     results,
 *     selectOption,
 *     highlightedIndex,
 *     highlightNext,
 *     highlightPrevious,
 *     selectHighlighted
 *   } = useAutocomplete({
 *     options: [
 *       { value: '411000', label: 'Clients', category: 'Tiers' },
 *       { value: '401000', label: 'Fournisseurs', category: 'Tiers' },
 *       { value: '512000', label: 'Banque', category: 'Trésorerie' }
 *     ],
 *     maxResults: 5,
 *     onSelect: (option) => console.log('Selected:', option)
 *   });
 *
 *   return (
 *     <div>
 *       <input
 *         value={query}
 *         onChange={(e) => setQuery(e.target.value)}
 *         onKeyDown={(e) => {
 *           if (e.key === 'ArrowDown') { e.preventDefault(); highlightNext(); }
 *           if (e.key === 'ArrowUp') { e.preventDefault(); highlightPrevious(); }
 *           if (e.key === 'Enter') { e.preventDefault(); selectHighlighted(); }
 *         }}
 *       />
 *       <ul>
 *         {results.map((result, index) => (
 *           <li
 *             key={result.value}
 *             onClick={() => selectOption(result)}
 *             className={index === highlightedIndex ? 'highlighted' : ''}
 *           >
 *             {result.label} (score: {result.score?.toFixed(2)})
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 */
export function useAutocomplete<T = any>(
  options: UseAutocompleteOptions<T>
): UseAutocompleteReturn<T> {
  const {
    options: allOptions,
    maxResults = 10,
    minScore = 0.3,
    customSearch,
    customSort,
    debounceMs = 150,
    caseSensitive = false,
    fuzzyMatch = true,
    onSelect,
    onChange,
    debug = false
  } = options;

  const [query, setQueryState] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<AutocompleteOption<T> | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [searchTime, setSearchTime] = useState<number>();

  const debounceTimerRef = useRef<NodeJS.Timeout>();

  /**
   * Mettre à jour la query avec debounce
   */
  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery);
      setIsSearching(true);

      if (onChange) {
        onChange(newQuery);
      }

      // Clear debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        setIsSearching(false);
      }, debounceMs);
    },
    [debounceMs, onChange]
  );

  /**
   * Recherche et filtrage des options
   */
  const results = useMemo(() => {
    const startTime = performance.now();

    if (!query.trim()) {
      // Pas de query = retourner top options
      const topOptions = allOptions.slice(0, maxResults);
      setSearchTime(performance.now() - startTime);
      return topOptions;
    }

    let filtered: AutocompleteOption<T>[];

    // Custom search function
    if (customSearch) {
      filtered = customSearch(query, allOptions);
    } else {
      // Default fuzzy search
      filtered = allOptions.map((option) => {
        // Recherche dans label
        const labelScore = fuzzyMatch
          ? fuzzyScore(query, option.label, caseSensitive)
          : option.label.toLowerCase().includes(query.toLowerCase())
          ? 0.7
          : 0;

        // Recherche dans keywords
        let keywordScore = 0;
        if (option.keywords && option.keywords.length > 0) {
          const scores = option.keywords.map((keyword) =>
            fuzzyMatch
              ? fuzzyScore(query, keyword, caseSensitive)
              : keyword.toLowerCase().includes(query.toLowerCase())
              ? 0.6
              : 0
          );
          keywordScore = Math.max(...scores);
        }

        // Recherche dans value (si string)
        let valueScore = 0;
        if (typeof option.value === 'string') {
          valueScore = fuzzyMatch
            ? fuzzyScore(query, option.value, caseSensitive) * 0.5
            : option.value.toLowerCase().includes(query.toLowerCase())
            ? 0.5
            : 0;
        }

        const score = Math.max(labelScore, keywordScore, valueScore);

        return {
          ...option,
          score
        };
      }).filter((option) => option.score! >= minScore);
    }

    // Tri par score
    const sorted = customSort
      ? filtered.sort(customSort)
      : filtered.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Limiter les résultats
    const limited = sorted.slice(0, maxResults);

    const endTime = performance.now();
    const duration = endTime - startTime;
    setSearchTime(duration);

    if (debug) {
      console.log('🔍 Autocomplete search:', {
        query,
        totalOptions: allOptions.length,
        matchedOptions: filtered.length,
        returnedResults: limited.length,
        searchTime: `${duration.toFixed(2)}ms`,
        topResults: limited.slice(0, 3).map((r) => ({
          label: r.label,
          score: r.score?.toFixed(2)
        }))
      });
    }

    return limited;
  }, [query, allOptions, maxResults, minScore, customSearch, customSort, caseSensitive, fuzzyMatch, debug]);

  /**
   * Sélectionner une option
   */
  const selectOption = useCallback(
    (option: AutocompleteOption<T>) => {
      setSelected(option);
      setQueryState(option.label);
      setHighlightedIndex(0);

      if (onSelect) {
        onSelect(option);
      }
    },
    [onSelect]
  );

  /**
   * Navigation clavier
   */
  const highlightNext = useCallback(() => {
    setHighlightedIndex((prev) => (prev + 1) % results.length);
  }, [results.length]);

  const highlightPrevious = useCallback(() => {
    setHighlightedIndex((prev) => (prev - 1 + results.length) % results.length);
  }, [results.length]);

  const selectHighlighted = useCallback(() => {
    if (results[highlightedIndex]) {
      selectOption(results[highlightedIndex]);
    }
  }, [results, highlightedIndex, selectOption]);

  /**
   * Réinitialiser
   */
  const reset = useCallback(() => {
    setQueryState('');
    setSelected(null);
    setHighlightedIndex(0);
    setSearchTime(undefined);
  }, []);

  /**
   * Reset highlighted index when results change
   */
  useEffect(() => {
    setHighlightedIndex(0);
  }, [results]);

  /**
   * Cleanup debounce timer
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    selected,
    selectOption,
    highlightedIndex,
    highlightPrevious,
    highlightNext,
    selectHighlighted,
    reset,
    totalResults: results.length,
    searchTime
  };
}

/**
 * Hook simplifié pour autocomplétion de comptes comptables
 *
 * @example
 * const autocomplete = useAccountAutocomplete(accountsData);
 */
export function useAccountAutocomplete(accounts: Array<{ code: string; label: string }>) {
  const options: AutocompleteOption[] = useMemo(
    () =>
      accounts.map((account) => ({
        value: account.code,
        label: `${account.code} - ${account.label}`,
        keywords: [account.code, account.label],
        category: account.code.charAt(0), // Premier chiffre = classe
        data: account
      })),
    [accounts]
  );

  return useAutocomplete({
    options,
    maxResults: 8,
    minScore: 0.2,
    fuzzyMatch: true
  });
}

/**
 * Hook simplifié pour autocomplétion de tiers (clients/fournisseurs)
 *
 * @example
 * const autocomplete = useThirdPartyAutocomplete(clientsData);
 */
export function useThirdPartyAutocomplete(
  thirdParties: Array<{ id: string; name: string; code?: string; type?: string }>
) {
  const options: AutocompleteOption[] = useMemo(
    () =>
      thirdParties.map((party) => ({
        value: party.id,
        label: party.name,
        keywords: party.code ? [party.code, party.name] : [party.name],
        category: party.type,
        data: party
      })),
    [thirdParties]
  );

  return useAutocomplete({
    options,
    maxResults: 10,
    minScore: 0.3,
    fuzzyMatch: true
  });
}

/**
 * Hook simplifié pour autocomplétion d'articles
 *
 * @example
 * const autocomplete = useArticleAutocomplete(articlesData);
 */
export function useArticleAutocomplete(
  articles: Array<{ id: string; reference: string; designation: string; category?: string }>
) {
  const options: AutocompleteOption[] = useMemo(
    () =>
      articles.map((article) => ({
        value: article.id,
        label: `${article.reference} - ${article.designation}`,
        keywords: [article.reference, article.designation],
        category: article.category,
        data: article
      })),
    [articles]
  );

  return useAutocomplete({
    options,
    maxResults: 10,
    minScore: 0.2,
    fuzzyMatch: true
  });
}
