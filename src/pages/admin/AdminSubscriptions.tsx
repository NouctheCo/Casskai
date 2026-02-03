/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 *
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

/**
 * 💳 Dashboard Admin Abonnements
 *
 * Gestion centralisée des abonnements utilisateurs :
 * - Liste de tous les abonnements avec filtres
 * - Statistiques (total, en essai, actifs, expirés, taux conversion)
 * - Actions : Prolonger l'essai, Changer de plan
 *
 * ⚠️ Accès : super-admin uniquement
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  ArrowUpRight,
  XCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useIsSuperAdmin } from '@/hooks/useSuperAdmin';
import { logger } from '@/lib/logger';
import { toastError } from '@/lib/toast-helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface SubscriptionWithUser {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
}

interface SubscriptionStats {
  total: number;
  trialing: number;
  active: number;
  expired: number;
  canceled: number;
  conversionRate: number;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
}

export default function AdminSubscriptions() {
  const navigate = useNavigate();
  const { isSuperAdmin, isLoading: checkingAdmin } = useIsSuperAdmin();

  const [subscriptions, setSubscriptions] = useState<SubscriptionWithUser[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [stats, setStats] = useState<SubscriptionStats>({
    total: 0,
    trialing: 0,
    active: 0,
    expired: 0,
    canceled: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);

  // Filtres
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal de modification
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithUser | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [newTrialEndDate, setNewTrialEndDate] = useState('');
  const [newPlanId, setNewPlanId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Redirection si non super admin
  useEffect(() => {
    if (!checkingAdmin && !isSuperAdmin) {
      logger.warn('AdminSubscriptions', 'Accès non autorisé - redirection');
      navigate('/dashboard');
    }
  }, [checkingAdmin, isSuperAdmin, navigate]);

  const loadPlans = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, name, price, currency')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      logger.error('AdminSubscriptions', 'Erreur chargement plans:', error);
    }
  }, []);

  const loadSubscriptions = useCallback(async () => {
    try {
      setLoading(true);

      // Récupérer les abonnements
      let query = supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (planFilter !== 'all') {
        query = query.eq('plan_id', planFilter);
      }

      const { data: subs, error: subsError } = await query;

      if (subsError) throw subsError;

      // Récupérer les emails des utilisateurs
      const userIds = [...new Set((subs || []).map(s => s.user_id))];

      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds);

        if (!usersError && users) {
          const userMap = new Map(users.map(u => [u.id, u.email]));
          const subsWithEmail = (subs || []).map(sub => ({
            ...sub,
            user_email: userMap.get(sub.user_id) || 'Email inconnu'
          }));
          setSubscriptions(subsWithEmail);
        } else {
          setSubscriptions(subs || []);
        }
      } else {
        setSubscriptions([]);
      }

      // Calculer les statistiques
      const allSubs = subs || [];
      const now = new Date();
      const trialingCount = allSubs.filter(s => s.status === 'trialing').length;
      const activeCount = allSubs.filter(s => s.status === 'active').length;
      const canceledCount = allSubs.filter(s => s.status === 'canceled').length;
      const expiredCount = allSubs.filter(s =>
        s.status === 'trialing' && s.trial_end && new Date(s.trial_end) < now
      ).length;

      // Taux de conversion = (actifs / (actifs + essais expirés)) * 100
      const potentialConversions = activeCount + expiredCount;
      const conversionRate = potentialConversions > 0
        ? Math.round((activeCount / potentialConversions) * 100)
        : 0;

      setStats({
        total: allSubs.length,
        trialing: trialingCount,
        active: activeCount,
        expired: expiredCount,
        canceled: canceledCount,
        conversionRate
      });

    } catch (error) {
      logger.error('AdminSubscriptions', 'Erreur chargement abonnements:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, planFilter]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadPlans();
      loadSubscriptions();
    }
  }, [isSuperAdmin, loadPlans, loadSubscriptions]);

  // Filtrage par recherche
  const filteredSubscriptions = subscriptions.filter(sub => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      sub.user_email?.toLowerCase().includes(query) ||
      sub.user_id.toLowerCase().includes(query) ||
      sub.plan_id.toLowerCase().includes(query)
    );
  });

  // Calcul des jours restants
  const getDaysRemaining = (trialEnd: string | null): number => {
    if (!trialEnd) return 0;
    const now = new Date();
    const end = new Date(trialEnd);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Format de date
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Prolonger l'essai
  const handleExtendTrial = async () => {
    if (!selectedSubscription || !newTrialEndDate) return;

    try {
      setActionLoading(true);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          trial_end: new Date(newTrialEndDate).toISOString(),
          current_period_end: new Date(newTrialEndDate).toISOString(),
          status: 'trialing',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSubscription.id);

      if (error) throw error;

      logger.info('AdminSubscriptions', `Essai prolongé pour ${selectedSubscription.user_email} jusqu'au ${newTrialEndDate}`);
      setShowExtendModal(false);
      setSelectedSubscription(null);
      setNewTrialEndDate('');
      await loadSubscriptions();
    } catch (error) {
      logger.error('AdminSubscriptions', 'Erreur prolongation essai:', error);
      toastError('Erreur lors de la prolongation de l\'essai');
    } finally {
      setActionLoading(false);
    }
  };

  // Changer de plan
  const handleChangePlan = async () => {
    if (!selectedSubscription || !newPlanId) return;

    try {
      setActionLoading(true);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan_id: newPlanId,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSubscription.id);

      if (error) throw error;

      logger.info('AdminSubscriptions', `Plan changé pour ${selectedSubscription.user_email}: ${newPlanId}`);
      setShowChangePlanModal(false);
      setSelectedSubscription(null);
      setNewPlanId('');
      await loadSubscriptions();
    } catch (error) {
      logger.error('AdminSubscriptions', 'Erreur changement plan:', error);
      toastError('Erreur lors du changement de plan');
    } finally {
      setActionLoading(false);
    }
  };

  // Rendu du badge de statut
  const StatusBadge = ({ status, trialEnd }: { status: string; trialEnd: string | null }) => {
    const isExpired = status === 'trialing' && trialEnd && new Date(trialEnd) < new Date();

    if (isExpired) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <XCircle className="w-3 h-3 mr-1" />
          Expiré
        </span>
      );
    }

    switch (status) {
      case 'trialing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="w-3 h-3 mr-1" />
            En essai
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="w-3 h-3 mr-1" />
            Actif
          </span>
        );
      case 'canceled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
            <XCircle className="w-3 h-3 mr-1" />
            Annulé
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {status}
          </span>
        );
    }
  };

  // Loading state
  if (checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Non autorisé (avant redirection)
  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-primary" />
            Gestion des Abonnements
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Administration centralisée des abonnements utilisateurs
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadSubscriptions()}
          disabled={loading}
          className="mt-4 md:mt-0"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <Users className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Total</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <Clock className="w-8 h-8 text-yellow-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.trialing}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">En essai</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Actifs</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.expired}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Expirés</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <XCircle className="w-8 h-8 text-gray-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.canceled}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Annulés</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <TrendingUp className="w-8 h-8 text-purple-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.conversionRate}%</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Conversion</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par email ou ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="trialing">En essai</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="canceled">Annulé</SelectItem>
                <SelectItem value="past_due">En retard</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[180px]">
                <CreditCard className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les plans</SelectItem>
                {plans.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Liste des abonnements */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fin d'essai
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Jours restants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Créé le
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Aucun abonnement trouvé
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {sub.user_email || 'Email inconnu'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                        {sub.user_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {sub.plan_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={sub.status} trialEnd={sub.trial_end} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(sub.trial_end)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sub.status === 'trialing' ? (
                        <span className={`text-sm font-medium ${
                          getDaysRemaining(sub.trial_end) <= 7
                            ? 'text-red-600 dark:text-red-400'
                            : getDaysRemaining(sub.trial_end) <= 15
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-green-600 dark:text-green-400'
                        }`}>
                          {getDaysRemaining(sub.trial_end)} jours
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(sub.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSubscription(sub);
                            setNewTrialEndDate(sub.trial_end ? new Date(sub.trial_end).toISOString().split('T')[0] : '');
                            setShowExtendModal(true);
                          }}
                          title="Prolonger l'essai"
                        >
                          <Calendar className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSubscription(sub);
                            setNewPlanId(sub.plan_id);
                            setShowChangePlanModal(true);
                          }}
                          title="Changer de plan"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Prolonger l'essai */}
      <Dialog open={showExtendModal} onOpenChange={setShowExtendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prolonger l'essai</DialogTitle>
            <DialogDescription>
              Modifier la date de fin d'essai pour {selectedSubscription?.user_email}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="trial-end">Nouvelle date de fin</Label>
              <Input
                id="trial-end"
                type="date"
                value={newTrialEndDate}
                onChange={(e) => setNewTrialEndDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleExtendTrial} disabled={actionLoading || !newTrialEndDate}>
              {actionLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Changer de plan */}
      <Dialog open={showChangePlanModal} onOpenChange={setShowChangePlanModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer de plan</DialogTitle>
            <DialogDescription>
              Modifier le plan d'abonnement pour {selectedSubscription?.user_email}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="plan">Nouveau plan</Label>
              <Select value={newPlanId} onValueChange={setNewPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {plan.price} {plan.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePlanModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleChangePlan} disabled={actionLoading || !newPlanId}>
              {actionLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
