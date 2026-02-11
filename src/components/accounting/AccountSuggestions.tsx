/**
 * Composant AccountSuggestions
 * Affiche les suggestions d'auto-catégorisation IA pour les comptes comptables
 *
 * @module AccountSuggestions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, TrendingUp, Clock, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { aiAccountCategorizationService, type AccountSuggestion } from '@/services/ai/accountCategorizationService';

interface AccountSuggestionsProps {
  companyId: string;
  description: string;
  onSelectSuggestion: (accountCode: string, accountName: string) => void;
  className?: string;
  disabled?: boolean;
}

export function AccountSuggestions({
  companyId,
  description,
  onSelectSuggestion,
  className,
  disabled = false,
}: AccountSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AccountSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce description pour éviter trop d'appels API
  const [debouncedDescription, setDebouncedDescription] = useState(description);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDescription(description);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [description]);

  // Charger suggestions quand description change
  const loadSuggestions = useCallback(async () => {
    if (!debouncedDescription || debouncedDescription.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await aiAccountCategorizationService.suggestAccount(
        companyId,
        debouncedDescription
      );

      setSuggestions(results.slice(0, 3)); // Max 3 suggestions
    } catch (err) {
      console.error('Erreur chargement suggestions:', err);
      setError('Impossible de charger les suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, debouncedDescription]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  // Sélectionner une suggestion
  const handleSelectSuggestion = useCallback(
    async (suggestion: AccountSuggestion) => {
      if (disabled) return;

      // Incrémenter usage_count
      try {
        await aiAccountCategorizationService.incrementUsageCount(
          companyId,
          debouncedDescription,
          suggestion.account_code
        );
      } catch (err) {
        console.error('Erreur incrémentation usage:', err);
      }

      onSelectSuggestion(suggestion.account_code, suggestion.account_name);
    },
    [companyId, debouncedDescription, onSelectSuggestion, disabled]
  );

  // Affichage badge confidence
  const getConfidenceBadgeVariant = (score: number): 'default' | 'secondary' | 'outline' => {
    if (score >= 90) return 'default'; // Vert
    if (score >= 75) return 'secondary'; // Bleu
    return 'outline'; // Gris
  };

  const getConfidenceIcon = (score: number) => {
    if (score >= 90) return <TrendingUp className="h-3 w-3" />;
    if (score >= 75) return <Sparkles className="h-3 w-3" />;
    return null;
  };

  // Ne rien afficher si description trop courte
  if (!debouncedDescription || debouncedDescription.trim().length < 3) {
    return null;
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span>Recherche de suggestions IA...</span>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  // Erreur
  if (error) {
    return (
      <div className={cn('text-sm text-destructive', className)}>
        {error}
      </div>
    );
  }

  // Aucune suggestion
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        <span>Suggestions IA</span>
      </div>

      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion.account_code}
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => handleSelectSuggestion(suggestion)}
            className={cn(
              'w-full justify-start text-left h-auto py-3 px-4',
              'hover:bg-accent hover:border-primary transition-colors'
            )}
          >
            <div className="flex-1 space-y-1">
              {/* Ligne 1: Code + Nom compte */}
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-sm">
                  {suggestion.account_code}
                </span>
                <span className="text-sm font-medium">
                  {suggestion.account_name}
                </span>
              </div>

              {/* Ligne 2: Badges info */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Badge confidence */}
                <Badge
                  variant={getConfidenceBadgeVariant(suggestion.confidence_score)}
                  className="flex items-center gap-1 text-xs"
                >
                  {getConfidenceIcon(suggestion.confidence_score)}
                  <span>{Math.round(suggestion.confidence_score)}% confiance</span>
                </Badge>

                {/* Badge usage */}
                {suggestion.usage_count > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    <Check className="h-3 w-3" />
                    <span>Utilisé {suggestion.usage_count}x</span>
                  </Badge>
                )}

                {/* Badge récent */}
                {suggestion.last_used_at && (
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    <span>Récent</span>
                  </Badge>
                )}
              </div>

              {/* Ligne 3: Raison (si disponible) */}
              {suggestion.reason && (
                <p className="text-xs text-muted-foreground italic">
                  {suggestion.reason}
                </p>
              )}
            </div>

            {/* Icône check pour sélection */}
            <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Check className="h-5 w-5 text-primary" />
            </div>
          </Button>
        ))}
      </div>

      {/* Footer info */}
      <p className="text-xs text-muted-foreground italic">
        💡 Suggestions basées sur votre historique et l'IA. Cliquez pour appliquer.
      </p>
    </div>
  );
}

export default AccountSuggestions;
