/**
 * CassKai - Composant de Gestion des Soldes Bancaires
 * Permet de recalculer et synchroniser les soldes des comptes bancaires
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertTriangle, RefreshCw, History } from 'lucide-react';
import { bankAccountBalanceService } from '@/services/bankAccountBalanceService';
import { toast } from 'sonner';

interface BankAccountBalanceManagerProps {
  companyId: string;
  bankAccounts: Array<{
    id: string;
    account_name: string;
    current_balance: number;
    currency: string;
  }>;
  onBalanceUpdated?: () => void;
}

export function BankAccountBalanceManager({
  companyId,
  bankAccounts,
  onBalanceUpdated
}: BankAccountBalanceManagerProps) {
  const [isRecalculatingAll, setIsRecalculatingAll] = useState(false);
  const [recalculatingAccount, setRecalculatingAccount] = useState<string | null>(null);
  const [movementHistory, setMovementHistory] = useState<{
    accountId: string;
    movements: any[];
    visible: boolean;
  } | null>(null);
  const [results, setResults] = useState<Array<{
    accountId: string;
    message: string;
    success: boolean;
  }> | null>(null);

  /**
   * Recalcule le solde d'un compte spécifique
   */
  const handleRecalculateAccount = async (accountId: string) => {
    setRecalculatingAccount(accountId);
    try {
      const result = await bankAccountBalanceService.recalculateBankAccountBalance(
        companyId,
        accountId
      );

      if (result.success) {
        toast.success(result.message);
        onBalanceUpdated?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du recalcul');
    } finally {
      setRecalculatingAccount(null);
    }
  };

  /**
   * Recalcule tous les comptes
   */
  const handleRecalculateAll = async () => {
    setIsRecalculatingAll(true);
    setResults(null);
    try {
      const result = await bankAccountBalanceService.recalculateAllBankAccountBalances(companyId);

      if (result.success) {
        toast.success('✅ Tous les soldes ont été recalculés');
        setResults(
          result.results.map((r) => ({
            accountId: r.accountId,
            message: r.message,
            success: true
          }))
        );
        onBalanceUpdated?.();
      } else {
        toast.error('Erreur lors du recalcul');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du recalcul');
    } finally {
      setIsRecalculatingAll(false);
    }
  };

  /**
   * Affiche l'historique des mouvements d'un compte
   */
  const handleShowMovementHistory = async (accountId: string) => {
    try {
      const movements = await bankAccountBalanceService.getBankAccountMovementHistory(
        companyId,
        accountId,
        50
      );

      setMovementHistory({
        accountId,
        movements,
        visible: true
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la récupération de l\'historique');
    }
  };

  return (
    <div className="space-y-6">
      {/* Carte de gestion globale */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            Gestion des Soldes Bancaires
          </CardTitle>
          <CardDescription>
            Recalculez ou synchronisez les soldes de vos comptes bancaires en fonction des opérations comptables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-900 dark:text-blue-200">
              <strong>Approche 1 - Automatique :</strong> Les soldes se mettent à jour automatiquement en temps réel lors de la création/modification d'écritures comptables.
            </AlertDescription>
          </Alert>

          <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-900 dark:text-amber-200">
              <strong>Approche 2 - Manuelle :</strong> Utilisez les boutons ci-dessous pour recalculer les soldes en cas de désynchronisation.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleRecalculateAll}
            disabled={isRecalculatingAll || bankAccounts.length === 0}
            className="w-full"
          >
            {isRecalculatingAll ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recalcul en cours...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Recalculer tous les comptes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Résultats du recalcul */}
      {results && results.length > 0 && (
        <Card className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/10">
          <CardHeader>
            <CardTitle className="text-green-900 dark:text-green-200 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Résultats du recalcul
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.map((result) => (
              <div
                key={result.accountId}
                className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-900"
              >
                <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
                  {result.message}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Liste des comptes */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Comptes bancaires</h3>
        
        {bankAccounts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">Aucun compte bancaire</p>
            </CardContent>
          </Card>
        ) : (
          bankAccounts.map((account) => (
            <Card key={account.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {account.account_name}
                    </h4>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Solde actuel :</span>
                      <Badge variant="secondary" className="font-mono">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: account.currency || 'EUR'
                        }).format(account.current_balance || 0)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShowMovementHistory(account.id)}
                      title="Afficher l'historique des mouvements"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRecalculateAccount(account.id)}
                      disabled={recalculatingAccount === account.id}
                    >
                      {recalculatingAccount === account.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Historique des mouvements */}
      {movementHistory?.visible && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Historique des mouvements
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setMovementHistory(
                  movementHistory
                    ? { ...movementHistory, visible: false }
                    : null
                )
              }
            >
              ✕
            </Button>
          </CardHeader>
          <CardContent>
            {movementHistory.movements.length === 0 ? (
              <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                Aucun mouvement pour ce compte
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-2">Date</th>
                      <th className="text-left py-2 px-2">Description</th>
                      <th className="text-right py-2 px-2">Débit</th>
                      <th className="text-right py-2 px-2">Crédit</th>
                      <th className="text-right py-2 px-2">Mouvement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movementHistory.movements.map((movement, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30"
                      >
                        <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                          {new Date(movement.entryDate).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-2 px-2 text-gray-900 dark:text-gray-100 max-w-xs truncate">
                          {movement.description}
                        </td>
                        <td className="text-right py-2 px-2 text-green-600 dark:text-green-400 font-mono">
                          {movement.debit > 0
                            ? new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'EUR'
                            }).format(movement.debit)
                            : '-'}
                        </td>
                        <td className="text-right py-2 px-2 text-red-600 dark:text-red-400 font-mono">
                          {movement.credit > 0
                            ? new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'EUR'
                            }).format(movement.credit)
                            : '-'}
                        </td>
                        <td
                          className={`text-right py-2 px-2 font-mono font-semibold ${
                            movement.movement >= 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR'
                          }).format(movement.movement)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info supplémentaire */}
      <Alert className="bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>💡 Conseil :</strong> Les soldes se synchronisent automatiquement avec les écritures comptables. Utilisez le recalcul manuel uniquement en cas de désynchronisation.
        </AlertDescription>
      </Alert>
    </div>
  );
}
