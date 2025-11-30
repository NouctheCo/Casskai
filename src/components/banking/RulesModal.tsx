import React, { useState } from 'react';
import { X, Plus, Trash2, AlertCircle, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CategorizationRule {
  id: string;
  pattern: string;
  account_id: string;
  description_template?: string | null;
  is_regex: boolean;
  priority: number;
}

interface Account {
  id: string;
  account_number: string;
  name: string;
  type: string;
  class: number;
}

interface RulesModalProps {
  rules: CategorizationRule[];
  accounts: Account[];
  onClose: () => void;
  onSave: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({
  rules,
  accounts,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const [editingRules, setEditingRules] = useState<CategorizationRule[]>(rules);
  const [showNewRuleForm, setShowNewRuleForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Formulaire nouvelle règle
  const [newRule, setNewRule] = useState({
    pattern: '',
    account_id: '',
    description_template: '',
    is_regex: false,
    priority: 0,
  });

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm(t('confirm.deleteRule', 'Supprimer cette règle ?'))) return;

    try {
      const { error } = await supabase
        .from('categorization_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      setEditingRules(editingRules.filter((r) => r.id !== ruleId));
      toast.success(t('success.ruleDeleted', 'Règle supprimée'));
    } catch (error) {
      console.error('Erreur suppression règle:', error);
      toast.error(t('errors.deleteRule', 'Erreur lors de la suppression'));
    }
  };

  const handleAddRule = async () => {
    if (!currentCompany?.id) return;
    if (!newRule.pattern.trim() || !newRule.account_id) {
      toast.error(t('errors.fillFields', 'Veuillez remplir tous les champs obligatoires'));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categorization_rules')
        .insert({
          company_id: currentCompany.id,
          pattern: newRule.pattern.trim(),
          account_id: newRule.account_id,
          description_template: newRule.description_template || null,
          is_regex: newRule.is_regex,
          priority: newRule.priority,
        })
        .select()
        .single();

      if (error) throw error;

      setEditingRules([...editingRules, data]);
      setShowNewRuleForm(false);
      setNewRule({
        pattern: '',
        account_id: '',
        description_template: '',
        is_regex: false,
        priority: 0,
      });
      toast.success(t('success.ruleAdded', 'Règle ajoutée'));
    } catch (error) {
      console.error('Erreur ajout règle:', error);
      toast.error(t('errors.addRule', 'Erreur lors de l\'ajout de la règle'));
    }
  };

  const handleUpdateRule = async (ruleId: string, updates: Partial<CategorizationRule>) => {
    try {
      const { error } = await supabase
        .from('categorization_rules')
        .update(updates)
        .eq('id', ruleId);

      if (error) throw error;

      setEditingRules(
        editingRules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r))
      );
      toast.success(t('success.ruleUpdated', 'Règle mise à jour'));
    } catch (error) {
      console.error('Erreur mise à jour règle:', error);
      toast.error(t('errors.updateRule', 'Erreur lors de la mise à jour'));
    }
  };

  const handleClose = () => {
    onSave();
    onClose();
  };

  const getAccountLabel = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    return account ? `${account.account_number} - ${account.name}` : 'Compte inconnu';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-purple-600 to-purple-500">
          <div className="flex items-center gap-2 text-white">
            <Zap className="h-5 w-5" />
            <h2 className="text-xl font-semibold">
              {t('rules.title', 'Règles de catégorisation automatique')}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white/20 rounded text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Comment fonctionnent les règles ?</p>
              <p>
                Les règles permettent de catégoriser automatiquement les transactions selon leur
                libellé. Lorsqu'une transaction contient le motif défini, le compte comptable est
                suggéré automatiquement.
              </p>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-4 overflow-y-auto max-h-[55vh]">
          {editingRules.length === 0 && !showNewRuleForm ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Zap className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Aucune règle définie</p>
              <p className="text-sm mb-4">
                Créez des règles pour automatiser la catégorisation de vos transactions
              </p>
              <button
                onClick={() => setShowNewRuleForm(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Créer ma première règle
              </button>
            </div>
          ) : (
            <>
              {/* Liste des règles */}
              <div className="space-y-3 mb-4">
                {editingRules
                  .sort((a, b) => b.priority - a.priority)
                  .map((rule) => (
                    <div
                      key={rule.id}
                      className="border rounded-lg p-4 hover:shadow-md transition bg-white dark:bg-gray-800 dark:bg-gray-700"
                    >
                      <div className="flex items-start gap-4">
                        {/* Priorité */}
                        <div className="flex-shrink-0">
                          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Priorité</label>
                          <input
                            type="number"
                            value={rule.priority}
                            onChange={(e) =>
                              handleUpdateRule(rule.id, {
                                priority: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-16 px-2 py-1 border rounded text-center text-sm"
                            min="0"
                          />
                        </div>

                        {/* Pattern */}
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                            Motif de recherche
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={rule.pattern}
                              onChange={(e) =>
                                handleUpdateRule(rule.id, { pattern: e.target.value })
                              }
                              className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                              placeholder="Ex: AMAZON, EDF, LOYER..."
                            />
                            <label className="flex items-center gap-1 text-sm">
                              <input
                                type="checkbox"
                                checked={rule.is_regex}
                                onChange={(e) =>
                                  handleUpdateRule(rule.id, { is_regex: e.target.checked })
                                }
                                className="rounded"
                              />
                              Regex
                            </label>
                          </div>
                        </div>

                        {/* Compte */}
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                            Compte comptable
                          </label>
                          <select
                            value={rule.account_id}
                            onChange={(e) =>
                              handleUpdateRule(rule.id, { account_id: e.target.value })
                            }
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Sélectionner...</option>
                            {accounts.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.account_number} - {acc.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Actions */}
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded transition"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Template de description (optionnel) */}
                      {rule.description_template && (
                        <div className="mt-3 pt-3 border-t">
                          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                            Libellé personnalisé (optionnel)
                          </label>
                          <input
                            type="text"
                            value={rule.description_template || ''}
                            onChange={(e) =>
                              handleUpdateRule(rule.id, {
                                description_template: e.target.value || null,
                              })
                            }
                            className="w-full px-3 py-1 border rounded text-sm"
                            placeholder="Ex: Abonnement Amazon Prime"
                          />
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* Bouton ajouter */}
              {!showNewRuleForm && (
                <button
                  onClick={() => setShowNewRuleForm(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600"
                >
                  <Plus className="h-5 w-5" />
                  Ajouter une nouvelle règle
                </button>
              )}

              {/* Formulaire nouvelle règle */}
              {showNewRuleForm && (
                <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-purple-900 dark:text-purple-100">
                      Nouvelle règle
                    </h3>
                    <button
                      onClick={() => setShowNewRuleForm(false)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium block mb-1">Motif *</label>
                      <input
                        type="text"
                        value={newRule.pattern}
                        onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: AMAZON"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-1">Compte comptable *</label>
                      <select
                        value={newRule.account_id}
                        onChange={(e) =>
                          setNewRule({ ...newRule, account_id: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Sélectionner...</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.account_number} - {acc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-1">
                        Libellé (optionnel)
                      </label>
                      <input
                        type="text"
                        value={newRule.description_template}
                        onChange={(e) =>
                          setNewRule({ ...newRule, description_template: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: Abonnement Amazon"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-1">Priorité</label>
                      <input
                        type="number"
                        value={newRule.priority}
                        onChange={(e) =>
                          setNewRule({ ...newRule, priority: parseInt(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                        min="0"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newRule.is_regex}
                          onChange={(e) =>
                            setNewRule({ ...newRule, is_regex: e.target.checked })
                          }
                          className="rounded"
                        />
                        <span className="text-sm">Utiliser une expression régulière</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setShowNewRuleForm(false)}
                      className="px-4 py-2 border rounded hover:bg-gray-50 transition"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleAddRule}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                    >
                      Créer la règle
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between items-center bg-gray-50 dark:bg-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">
            {editingRules.length} règle(s) active(s)
          </div>
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
