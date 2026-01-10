/**
 * Lettrage Panel Component
 *
 * Interface comptable pour le lettrage (réconciliation) des écritures.
 * Permet aux comptables de pointer/lettrer facilement les comptes clients,
 * fournisseurs et banques.
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import {
  getUnlettragedLines,
  findLettrageMatches,
  applyLettrage,
  autoLettrage,
  deleteLettrage,
  getLettrageStats,
  type JournalEntryLine,
  type LettrageMatch,
} from '@/services/accounting/lettrageService';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, X, Zap, Trash2, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
interface LettragePanelProps {
  companyId: string;
  accountType: 'clients' | 'fournisseurs' | 'banque';
}
export function LettragePanel({ companyId, accountType }: LettragePanelProps) {
  const { showToast } = useToast();
  const [lines, setLines] = useState<JournalEntryLine[]>([]);
  const [matches, setMatches] = useState<LettrageMatch[]>([]);
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'suggestions'>('list');
  const accountPatterns = {
    clients: '411%',
    fournisseurs: '401%',
    banque: '512%',
  };
  const accountPattern = accountPatterns[accountType];
  // Load data
  useEffect(() => {
    loadData();
  }, [companyId, accountType]);
  async function loadData() {
    setLoading(true);
    try {
      const [linesData, matchesData, statsData] = await Promise.all([
        getUnlettragedLines(companyId, accountPattern),
        findLettrageMatches(companyId, accountPattern),
        getLettrageStats(companyId, accountPattern),
      ]);
      setLines(linesData);
      setMatches(matchesData);
      setStats(statsData);
    } catch (error) {
      logger.error('LettragePanel', 'Error loading lettrage data:', error);
      showToast('Erreur: Impossible de charger les données de lettrage', 'error');
    } finally {
      setLoading(false);
    }
  }
  // Toggle line selection
  function toggleLine(lineId: string) {
    const newSelection = new Set(selectedLines);
    if (newSelection.has(lineId)) {
      newSelection.delete(lineId);
    } else {
      newSelection.add(lineId);
    }
    setSelectedLines(newSelection);
  }
  // Select all lines in a match
  function selectMatch(match: LettrageMatch) {
    const newSelection = new Set(selectedLines);
    [...match.debitLines, ...match.creditLines].forEach(line => {
      newSelection.add(line.id);
    });
    setSelectedLines(newSelection);
  }
  // Apply lettrage to selected lines
  async function handleApplyLettrage() {
    if (selectedLines.size === 0) {
      showToast('Aucune ligne sélectionnée: Veuillez sélectionner au moins 2 lignes à lettrer', 'error');
      return;
    }
    setLoading(true);
    try {
      const result = await applyLettrage(companyId, Array.from(selectedLines));
      if (result.success) {
        showToast(`Lettrage appliqué: ${result.message}`, 'success');
        setSelectedLines(new Set());
        await loadData();
      } else {
        showToast(`Erreur de lettrage: ${result.error}`, 'error');
      }
    } catch (error) {
      logger.error('LettragePanel', 'Error applying lettrage:', error);
      showToast('Erreur: Impossible d\'appliquer le lettrage', 'error');
    } finally {
      setLoading(false);
    }
  }
  // Auto lettrage
  async function handleAutoLettrage() {
    setLoading(true);
    try {
      const result = await autoLettrage(companyId, accountPattern);
      showToast(`Lettrage automatique terminé: ${result.success} lettrage(s) appliqué(s), ${result.failed} échec(s)`, 'success');
      if (result.errors.length > 0) {
        logger.error('LettragePanel', 'Auto lettrage errors:', result.errors);
      }
      await loadData();
    } catch (error) {
      logger.error('LettragePanel', 'Error auto lettrage:', error);
      showToast('Erreur: Impossible d\'effectuer le lettrage automatique', 'error');
    } finally {
      setLoading(false);
    }
  }
  // Calculate selected balance
  const selectedBalance = lines
    .filter(l => selectedLines.has(l.id))
    .reduce((sum, l) => sum + l.net_amount, 0);
  return (
    <div className="space-y-4">
      {/* Stats Card */}
      {stats && (
        <Card className="p-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Total lignes</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Lettrées</div>
              <div className="text-2xl font-bold text-green-600">{stats.lettraged}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Non lettrées</div>
              <div className="text-2xl font-bold text-orange-600">{stats.unlettraged}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">% Lettré</div>
              <div className="text-2xl font-bold">{stats.percentLettraged.toFixed(1)}%</div>
            </div>
          </div>
        </Card>
      )}
      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => setView('list')}
          >
            Liste
          </Button>
          <Button
            variant={view === 'suggestions' ? 'default' : 'outline'}
            onClick={() => setView('suggestions')}
          >
            Suggestions ({matches.length})
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleAutoLettrage}
            disabled={loading || matches.filter(m => m.confidence === 'exact').length === 0}
          >
            <Zap className="h-4 w-4 mr-2" />
            Auto-lettrage
          </Button>
          <Button
            onClick={handleApplyLettrage}
            disabled={loading || selectedLines.size === 0}
          >
            <Check className="h-4 w-4 mr-2" />
            Lettrer ({selectedLines.size})
          </Button>
        </div>
      </div>
      {/* Selected Balance Indicator */}
      {selectedLines.size > 0 && (
        <Card className={`p-3 ${Math.abs(selectedBalance) > 0.05 ? 'border-orange-500' : 'border-green-500'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedLines.size} ligne(s) sélectionnée(s)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm">Solde:</span>
              <Badge variant={Math.abs(selectedBalance) > 0.05 ? 'destructive' : 'default'}>
                {selectedBalance.toFixed(2)}€
              </Badge>
              {Math.abs(selectedBalance) > 0.05 && (
                <AlertCircle className="h-4 w-4 text-orange-500" />
              )}
            </div>
          </div>
        </Card>
      )}
      {/* Content */}
      {view === 'list' ? (
        <LinesListView
          lines={lines}
          selectedLines={selectedLines}
          onToggleLine={toggleLine}
          loading={loading}
        />
      ) : (
        <SuggestionsView
          matches={matches}
          onSelectMatch={selectMatch}
          loading={loading}
        />
      )}
    </div>
  );
}
// Lines List View
function LinesListView({
  lines,
  selectedLines,
  onToggleLine,
  loading,
}: {
  lines: JournalEntryLine[];
  selectedLines: Set<string>;
  onToggleLine: (id: string) => void;
  loading: boolean;
}) {
  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }
  if (lines.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Aucune ligne à lettrer 🎉
      </Card>
    );
  }
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b">
            <tr className="text-left text-sm">
              <th className="p-2 w-10"></th>
              <th className="p-2">Date</th>
              <th className="p-2">N° écriture</th>
              <th className="p-2">Compte</th>
              <th className="p-2">Description</th>
              <th className="p-2 text-right">Débit</th>
              <th className="p-2 text-right">Crédit</th>
              <th className="p-2 text-right">Solde</th>
            </tr>
          </thead>
          <tbody>
            {lines.map(line => (
              <tr
                key={line.id}
                className={`border-b hover:bg-muted/50 cursor-pointer ${
                  selectedLines.has(line.id) ? 'bg-primary/10' : ''
                }`}
                onClick={() => onToggleLine(line.id)}
              >
                <td className="p-2">
                  <Checkbox
                    checked={selectedLines.has(line.id)}
                    onCheckedChange={() => onToggleLine(line.id)}
                  />
                </td>
                <td className="p-2 text-sm">
                  {new Date(line.entry_date).toLocaleDateString('fr-FR')}
                </td>
                <td className="p-2 text-sm font-mono">{line.entry_number}</td>
                <td className="p-2 text-sm">
                  <div>{line.account_number}</div>
                  <div className="text-xs text-muted-foreground">{line.account_name}</div>
                </td>
                <td className="p-2 text-sm">{line.description}</td>
                <td className="p-2 text-sm text-right">
                  {line.debit_amount > 0 ? line.debit_amount.toFixed(2) : '-'}
                </td>
                <td className="p-2 text-sm text-right">
                  {line.credit_amount > 0 ? line.credit_amount.toFixed(2) : '-'}
                </td>
                <td className={`p-2 text-sm text-right font-medium ${
                  line.net_amount > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {line.net_amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
// Suggestions View
function SuggestionsView({
  matches,
  onSelectMatch,
  loading,
}: {
  matches: LettrageMatch[];
  onSelectMatch: (match: LettrageMatch) => void;
  loading: boolean;
}) {
  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }
  if (matches.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Aucune suggestion de lettrage automatique trouvée
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      {matches.map((match, idx) => (
        <Card key={idx} className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <Badge variant={match.confidence === 'exact' ? 'default' : 'secondary'}>
                {match.confidence === 'exact' ? 'Match exact' : 'Suggestion'}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">
                {match.debitLines.length + match.creditLines.length} ligne(s)
              </div>
            </div>
            <Button size="sm" onClick={() => onSelectMatch(match)}>
              Sélectionner
            </Button>
          </div>
          <div className="space-y-2">
            {/* Debit lines */}
            {match.debitLines.map(line => (
              <div key={line.id} className="flex items-center justify-between text-sm border-l-4 border-green-500 pl-2">
                <div>
                  <div className="font-medium">{line.account_number} - {line.account_name}</div>
                  <div className="text-xs text-muted-foreground">{line.description}</div>
                </div>
                <div className="text-green-600 font-medium">+{line.net_amount.toFixed(2)}€</div>
              </div>
            ))}
            {/* Credit lines */}
            {match.creditLines.map(line => (
              <div key={line.id} className="flex items-center justify-between text-sm border-l-4 border-red-500 pl-2">
                <div>
                  <div className="font-medium">{line.account_number} - {line.account_name}</div>
                  <div className="text-xs text-muted-foreground">{line.description}</div>
                </div>
                <div className="text-red-600 font-medium">{line.net_amount.toFixed(2)}€</div>
              </div>
            ))}
          </div>
          {/* Balance indicator */}
          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <span className="text-sm font-medium">Solde:</span>
            <Badge variant={Math.abs(match.balance) < 0.05 ? 'default' : 'destructive'}>
              {match.balance.toFixed(2)}€
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}