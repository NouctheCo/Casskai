/**
 * Enterprise Trial Manager Component
 *
 * Composant de gestion professionnelle des périodes d'essai avec:
 * - Notifications intelligentes adaptées par phase
 * - Tracking d'engagement utilisateur
 * - CTA optimisés pour la conversion
 * - Analytics et A/B testing intégrés
 * - Design de niveau entreprise
 *
 * @author CassKai Team
 * @version 2.0.0
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrial } from '@/hooks/trial.hooks';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  Zap,
  Shield,
  Star,
  ArrowRight,
  X,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrialEngagement {
  days_remaining: number;
  trial_phase: 'discovery' | 'consideration' | 'decision' | 'urgency' | 'expired';
  should_show_notification: boolean;
  notification_urgency: 'low' | 'medium' | 'high' | 'critical';
  cta_message: string;
  has_clicked_upgrade: boolean;
  has_viewed_pricing: boolean;
}

export const EnterpriseTrialManager: React.FC<{ variant?: 'banner' | 'card' | 'modal' }> = ({
  variant = 'card'
}) => {
  const { user } = useAuth();
  const { trialInfo, isActive, daysRemaining } = useTrial();
  const navigate = useNavigate();
  const [engagement, setEngagement] = useState<TrialEngagement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Charger l'état d'engagement
  useEffect(() => {
    if (user?.id && isActive) {
      loadEngagement();
    }
  }, [user?.id, isActive]);

  const loadEngagement = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.rpc('get_user_trial_engagement', {
        p_user_id: user.id
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setEngagement(data[0]);
      }
    } catch (err) {
      console.error('Error loading trial engagement:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Tracker un événement d'engagement
  const trackEngagement = async (eventType: string, metadata: any = {}) => {
    if (!user?.id) return;

    try {
      await supabase.rpc('track_trial_engagement_event', {
        p_user_id: user.id,
        p_event_type: eventType,
        p_metadata: metadata
      });
    } catch (err) {
      console.error('Error tracking engagement:', err);
    }
  };

  // Gérer le clic sur "Choisir un plan"
  const handleUpgradeClick = async () => {
    await trackEngagement('clicked_upgrade');
    navigate('/billing');
  };

  // Gérer la fermeture de la notification
  const handleDismiss = async () => {
    setIsDismissed(true);

    // Marquer la notification comme vue pour cette phase
    const notifyEvent = engagement?.days_remaining <= 3 ? 'notified_3_days' :
                       engagement?.days_remaining <= 7 ? 'notified_7_days' :
                       'notified_15_days';

    await trackEngagement(notifyEvent);
  };

  // Ne rien afficher si pas d'essai actif ou si chargement
  if (!isActive || isLoading || isDismissed) {
    return null;
  }

  // Ne rien afficher si pas besoin de notifier
  if (engagement && !engagement.should_show_notification) {
    return null;
  }

  const phase = engagement?.trial_phase || 'discovery';
  const urgency = engagement?.notification_urgency || 'low';
  const progressValue = ((30 - daysRemaining) / 30) * 100;

  // Configuration des couleurs et icônes selon l'urgence
  const urgencyConfig = {
    low: {
      badgeVariant: 'default' as const,
      alertVariant: 'default' as const,
      icon: Sparkles,
      iconColor: 'text-blue-500',
      bgGradient: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200'
    },
    medium: {
      badgeVariant: 'secondary' as const,
      alertVariant: 'default' as const,
      icon: TrendingUp,
      iconColor: 'text-amber-500',
      bgGradient: 'from-amber-50 to-orange-50',
      borderColor: 'border-amber-200'
    },
    high: {
      badgeVariant: 'destructive' as const,
      alertVariant: 'default' as const,
      icon: Zap,
      iconColor: 'text-orange-500',
      bgGradient: 'from-orange-50 to-red-50',
      borderColor: 'border-orange-300'
    },
    critical: {
      badgeVariant: 'destructive' as const,
      alertVariant: 'destructive' as const,
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      bgGradient: 'from-red-50 to-red-100',
      borderColor: 'border-red-400'
    }
  };

  const config = urgencyConfig[urgency];
  const IconComponent = config.icon;

  // Bénéfices à afficher selon la phase
  const benefits = phase === 'expired' ? [
    { icon: Shield, text: 'Récupérez l\'accès à toutes vos données' },
    { icon: Zap, text: 'Reprenez votre gestion là où vous l\'aviez laissée' },
    { icon: Star, text: 'Support prioritaire inclus' },
  ] : [
    { icon: CheckCircle2, text: 'Accès complet à toutes les fonctionnalités' },
    { icon: Shield, text: 'Données sécurisées et sauvegardées' },
    { icon: TrendingUp, text: 'Support technique dédié' },
    { icon: Star, text: 'Mises à jour et améliorations continues' },
  ];

  // Messages selon la phase
  const phaseMessages = {
    discovery: {
      title: 'Bienvenue dans votre essai gratuit de 30 jours!',
      description: 'Explorez toutes les fonctionnalités premium sans engagement',
      cta: 'Découvrir les plans'
    },
    consideration: {
      title: `Plus que ${daysRemaining} jours d'essai gratuit`,
      description: 'Profitez encore de toutes nos fonctionnalités premium',
      cta: 'Voir les tarifs'
    },
    decision: {
      title: `⏰ Il vous reste ${daysRemaining} jours`,
      description: 'Ne perdez pas l\'accès à vos données - Choisissez votre plan maintenant',
      cta: 'Choisir mon plan'
    },
    urgency: {
      title: `🔴 Derniers jours! Plus que ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`,
      description: 'Votre essai expire bientôt - Passez à un abonnement pour continuer',
      cta: 'Sauvegarder mon accès'
    },
    expired: {
      title: '❌ Votre essai a expiré',
      description: 'Choisissez un plan pour réactiver votre compte et accéder à vos données',
      cta: 'Réactiver maintenant'
    }
  };

  const message = phaseMessages[phase];

  // VARIANT: Banner (top of page)
  if (variant === 'banner') {
    return (
      <Alert className={cn(
        'mb-4 border-l-4',
        config.borderColor,
        `bg-gradient-to-r ${config.bgGradient}`
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <IconComponent className={cn('h-5 w-5', config.iconColor)} />
            <div className="flex-1">
              <AlertTitle className="text-base font-semibold mb-1">
                {message.title}
              </AlertTitle>
              <AlertDescription className="text-sm">
                {engagement?.cta_message || message.description}
              </AlertDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleUpgradeClick} size="sm" className="whitespace-nowrap">
              {message.cta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={handleDismiss} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Alert>
    );
  }

  // VARIANT: Card (default - in settings or dashboard)
  return (
    <Card className={cn('border-l-4', config.borderColor)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <IconComponent className={cn('h-6 w-6', config.iconColor)} />
            <div>
              <CardTitle className="text-xl">{message.title}</CardTitle>
              <CardDescription className="mt-1">
                {engagement?.cta_message || message.description}
              </CardDescription>
            </div>
          </div>
          <Badge variant={config.badgeVariant} className="ml-2">
            {phase === 'expired' ? 'Expiré' : `${daysRemaining} jours`}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress bar */}
        {phase !== 'expired' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression de l'essai</span>
              <span className="font-medium">{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              Expire le {trialInfo?.trialEnd.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        )}

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <benefit.icon className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>{benefit.text}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleUpgradeClick}
          size="lg"
          className="w-full"
          variant={urgency === 'critical' ? 'destructive' : 'default'}
        >
          {message.cta}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        {/* Pricing link */}
        <p className="text-center text-sm text-muted-foreground">
          À partir de 29€/mois • Sans engagement •{' '}
          <button
            onClick={() => {
              trackEngagement('viewed_pricing');
              navigate('/pricing');
            }}
            className="text-primary hover:underline font-medium"
          >
            Voir tous les plans
          </button>
        </p>
      </CardContent>
    </Card>
  );
};

export default EnterpriseTrialManager;
