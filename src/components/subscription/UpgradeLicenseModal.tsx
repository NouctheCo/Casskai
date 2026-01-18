/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Modal pour upgrader le plan ou acheter des licences supplémentaires
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  ArrowUpCircle,
  Sparkles,
  Check,
  Crown
} from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { motion } from 'framer-motion';

interface UpgradeLicenseModalProps {
  open: boolean;
  onClose: () => void;
  currentUsers: number;
  maxUsers: number;
  featureName?: string;
}

export function UpgradeLicenseModal({
  open,
  onClose,
  currentUsers,
  maxUsers,
  featureName = 'utilisateurs'
}: UpgradeLicenseModalProps) {
  const navigate = useNavigate();
  const { subscriptionPlan } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = () => {
    setIsLoading(true);
    // Rediriger vers la page pricing avec un paramètre pour pré-sélectionner l'upgrade
    navigate('/pricing?upgrade=true&reason=users');
    onClose();
  };

  const handleContactSales = () => {
    // Ouvrir WhatsApp pour contacter l'équipe commerciale
    const message = encodeURIComponent(
      `Bonjour ! J'aimerais augmenter ma limite d'utilisateurs sur mon plan ${subscriptionPlan || 'actuel'}. ` +
      `J'ai actuellement ${currentUsers}/${maxUsers} utilisateurs.`
    );
    window.open(`https://wa.me/33752027198?text=${message}`, '_blank');
    onClose();
  };

  // Déterminer le plan recommandé basé sur le plan actuel
  const getRecommendedPlan = () => {
    switch (subscriptionPlan) {
      case 'free':
        return { name: 'Starter', users: 2, highlight: 'starter' };
      case 'starter':
        return { name: 'Professionnel', users: 10, highlight: 'professional' };
      case 'professional':
        return { name: 'Entreprise', users: 'illimités', highlight: 'enterprise' };
      default:
        return { name: 'Professionnel', users: 10, highlight: 'professional' };
    }
  };

  const recommendedPlan = getRecommendedPlan();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl">
              <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">Limite d'utilisateurs atteinte</DialogTitle>
              <DialogDescription className="mt-1">
                Votre plan actuel permet {maxUsers} {featureName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Status actuel */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentUsers}/{maxUsers}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {featureName} utilisés
              </div>
            </div>
            <Badge variant="destructive" className="text-xs">
              Limite atteinte
            </Badge>
          </div>

          {/* Plan recommandé */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
          >
            <div className="absolute -top-3 left-4">
              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Recommandé
              </Badge>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  Plan {recommendedPlan.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Jusqu'à {recommendedPlan.users} utilisateurs
                </p>
              </div>
              <ArrowUpCircle className="w-8 h-8 text-blue-500" />
            </div>

            <ul className="mt-3 space-y-1">
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="w-4 h-4 text-green-500" />
                Plus de fonctionnalités
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="w-4 h-4 text-green-500" />
                Support prioritaire
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="w-4 h-4 text-green-500" />
                Stockage augmenté
              </li>
            </ul>
          </motion.div>

          {/* Options */}
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Vous pouvez aussi nous contacter pour une offre personnalisée
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Annuler
          </Button>
          <Button
            variant="outline"
            onClick={handleContactSales}
            className="w-full sm:w-auto"
          >
            Nous contacter
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <ArrowUpCircle className="w-4 h-4 mr-2" />
            Voir les plans
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UpgradeLicenseModal;
