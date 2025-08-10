import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  AlertTriangle, 
  Crown, 
  X,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';

interface TrialExpirationNoticeProps {
  dismissible?: boolean;
  compact?: boolean;
  className?: string;
}

export const TrialExpirationNotice: React.FC<TrialExpirationNoticeProps> = ({
  dismissible = true,
  compact = false,
  className = ''
}) => {
  const navigate = useNavigate();
  const { subscription, plan, isTrialing, daysUntilRenewal } = useSubscription();
  const [isDismissed, setIsDismissed] = useState(false);

  // Ne pas afficher si pas en période d'essai ou si dismissé
  if (!isTrialing || !subscription || isDismissed) {
    return null;
  }

  const trialProgress = subscription.trialEnd 
    ? Math.max(0, Math.min(100, ((30 - daysUntilRenewal) / 30) * 100))
    : 0;

  const getUrgencyLevel = () => {
    if (daysUntilRenewal <= 3) return 'critical';
    if (daysUntilRenewal <= 7) return 'warning';
    return 'info';
  };

  const urgencyLevel = getUrgencyLevel();

  const urgencyColors = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      icon: 'text-blue-600 dark:text-blue-400',
      progress: 'bg-blue-500'
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800', 
      text: 'text-amber-800 dark:text-amber-200',
      icon: 'text-amber-600 dark:text-amber-400',
      progress: 'bg-amber-500'
    },
    critical: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200', 
      icon: 'text-red-600 dark:text-red-400',
      progress: 'bg-red-500'
    }
  };

  const colors = urgencyColors[urgencyLevel];

  const handleUpgrade = () => {
    navigate('/settings/billing?tab=plans');
  };

  const handleDismiss = () => {
    if (dismissible) {
      setIsDismissed(true);
      // Stocker le dismiss dans localStorage pour éviter de réafficher trop souvent
      localStorage.setItem(`trial_notice_dismissed_${subscription.id}`, Date.now().toString());
    }
  };

  // Version compacte pour la sidebar ou header
  if (compact) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`p-3 rounded-lg ${colors.bg} ${colors.border} border ${className}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {urgencyLevel === 'critical' ? (
                <AlertTriangle className={`w-4 h-4 ${colors.icon}`} />
              ) : (
                <Clock className={`w-4 h-4 ${colors.icon}`} />
              )}
              <div>
                <p className={`text-xs font-medium ${colors.text}`}>
                  Essai : {daysUntilRenewal} jour{daysUntilRenewal > 1 ? 's' : ''} restant{daysUntilRenewal > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={handleUpgrade}>
              Upgrade
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Version complète
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={className}
      >
        <Card className={`${colors.bg} ${colors.border} border-l-4`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className={`p-2 rounded-lg bg-white dark:bg-gray-800`}>
                  {urgencyLevel === 'critical' ? (
                    <AlertTriangle className={`w-6 h-6 ${colors.icon}`} />
                  ) : (
                    <Clock className={`w-6 h-6 ${colors.icon}`} />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className={`text-lg font-semibold ${colors.text}`}>
                      {urgencyLevel === 'critical' ? 'Essai se termine bientôt !' : 'Période d\'essai active'}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {plan?.name || 'Essai gratuit'}
                    </Badge>
                  </div>
                  
                  <p className={`text-sm ${colors.text} mb-4`}>
                    {urgencyLevel === 'critical' 
                      ? `Votre essai gratuit se termine dans ${daysUntilRenewal} jour${daysUntilRenewal > 1 ? 's' : ''}. Choisissez un plan pour continuer à utiliser toutes les fonctionnalités.`
                      : `Il vous reste ${daysUntilRenewal} jour${daysUntilRenewal > 1 ? 's' : ''} d'essai gratuit. Découvrez nos plans pour profiter pleinement de CassKai.`
                    }
                  </p>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium ${colors.text}`}>
                        Progression de l'essai
                      </span>
                      <span className={`text-xs ${colors.text}`}>
                        {Math.round(trialProgress)}%
                      </span>
                    </div>
                    <Progress 
                      value={trialProgress} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button 
                      onClick={handleUpgrade}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Choisir un plan
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    
                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Expire le {subscription.trialEnd?.toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {dismissible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className={`${colors.text} hover:bg-white/50 dark:hover:bg-gray-800/50`}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default TrialExpirationNotice;