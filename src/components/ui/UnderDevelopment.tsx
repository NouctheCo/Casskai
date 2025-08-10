import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Construction, ArrowLeft, Clock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/contexts/LocaleContext';

interface UnderDevelopmentProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  icon?: React.ReactNode;
}

export function UnderDevelopment({ 
  title, 
  description, 
  showBackButton = true,
  icon = <Construction className="h-16 w-16 text-blue-600/50" />
}: UnderDevelopmentProps) {
  const navigate = useNavigate();
  const { t } = useLocale();

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {showBackButton && (
          <Button 
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back', { defaultValue: 'Retour' })}
          </Button>
        )}
      </div>

      <Card className="border-2 border-dashed border-primary/20">
        <CardContent className="p-12 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="mx-auto mb-6">
              {icon}
            </div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {t('common.underDevelopment', { defaultValue: 'En cours de développement' })}
            </h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-md mx-auto">
              {t('common.underDevelopmentMessage', { 
                defaultValue: 'Ce module est actuellement en cours de développement. Il sera bientôt disponible.' 
              })}
            </p>
            
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{t('common.comingSoon', { defaultValue: 'Bientôt disponible' })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>{t('common.newFeatures', { defaultValue: 'Nouvelles fonctionnalités' })}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-600/10 rounded-lg p-4">
                <h3 className="font-semibold text-blue-600 mb-2">
                  {t('common.stayTuned', { defaultValue: 'Restez à l\'écoute' })}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('common.stayTunedMessage', { 
                    defaultValue: 'Nous travaillons dur pour vous apporter cette fonctionnalité. Merci de votre patience.' 
                  })}
                </p>
              </div>
              
              <Button 
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 hover:bg-blue-600/90"
              >
                {t('common.backToDashboard', { defaultValue: 'Retour au tableau de bord' })}
              </Button>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}