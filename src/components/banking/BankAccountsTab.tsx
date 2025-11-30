/**
 * Onglet de gestion des comptes bancaires
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, CreditCard, Building2 } from 'lucide-react';
import { BankAccountFormModal } from './BankAccountFormModal';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface BankAccountsTabProps {
  companyId: string;
  accounts: any[];
  onRefresh: () => void;
}

export const BankAccountsTab: React.FC<BankAccountsTabProps> = ({
  companyId,
  accounts,
  onRefresh
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);

  const handleCreate = () => {
    setEditingAccount(null);
    setShowModal(true);
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setShowModal(true);
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (editingAccount) {
        // Update existing account
        const { error } = await supabase
          .from('bank_accounts')
          .update(formData)
          .eq('id', editingAccount.id);

        if (error) throw error;
        toast.success('Compte bancaire modifié');
      } else {
        // Create new account
        const { error } = await supabase
          .from('bank_accounts')
          .insert({
            ...formData,
            company_id: companyId,
            account_type: 'checking',
            current_balance: formData.initial_balance || 0,
            is_active: true
          });

        if (error) throw error;
        toast.success('Compte bancaire créé');
      }

      onRefresh();
      return true;
    } catch (error: any) {
      console.error('Error saving account:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
      return false;
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte bancaire ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ is_active: false })
        .eq('id', accountId);

      if (error) throw error;

      toast.success('Compte bancaire supprimé');
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatIBAN = (iban?: string) => {
    if (!iban) return 'Non renseigné';
    return `${iban.substring(0, 20)  }...`;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Comptes bancaires</CardTitle>
              <CardDescription>
                Gérez les comptes bancaires de votre entreprise
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un compte
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-2">
                Aucun compte bancaire
              </h3>
              <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 mb-4">
                Ajoutez votre premier compte bancaire pour commencer
              </p>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un compte
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="border border-gray-200 dark:border-gray-600 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
                        <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-gray-100">
                            {account.account_name || 'Sans nom'}
                          </h4>
                          {account.iban && account.bic && (
                            <Badge variant="success">SEPA</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400 mb-2">
                          {account.bank_name || 'Banque non renseignée'}
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400">IBAN:</span>
                            <span className="ml-2 font-mono text-gray-900 dark:text-gray-100 dark:text-gray-100">
                              {formatIBAN(account.iban)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400">BIC:</span>
                            <span className="ml-2 font-mono text-gray-900 dark:text-gray-100 dark:text-gray-100">
                              {account.bic || 'Non renseigné'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400">Solde:</span>
                            <span className={`ml-2 font-semibold ${
                              (account.current_balance || 0) >= 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: account.currency || 'EUR'
                              }).format(account.current_balance || 0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400">Devise:</span>
                            <span className="ml-2 text-gray-900 dark:text-gray-100 dark:text-gray-100">
                              {account.currency || 'EUR'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(account)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(account.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          {accounts.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                💡 Pour utiliser la génération de virements SEPA, assurez-vous que vos comptes ont un IBAN et un BIC valides
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <BankAccountFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        account={editingAccount}
      />
    </>
  );
};
