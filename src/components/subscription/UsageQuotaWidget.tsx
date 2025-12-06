import React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Progress } from '@/components/ui/progress';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import { 

  Users, 

  Building2, 

  HardDrive, 

  FileText,

  AlertTriangle,

  CheckCircle,

  ArrowUpCircle,

  MoreHorizontal

} from 'lucide-react';

import { useSubscriptionQuotas } from '@/hooks/useSubscriptionQuotas';

import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';



interface UsageQuotaWidgetProps {

  compact?: boolean;

  showUpgradeButton?: boolean;

  className?: string;

}



export const UsageQuotaWidget: React.FC<UsageQuotaWidgetProps> = ({

  compact = false,

  showUpgradeButton = true,

  className = ''

}) => {

  const navigate = useNavigate();

  const { 

    usageLimits, 

    isLoading, 

    getTopUsageFeatures, 

    hasCriticalQuotas,

    getNearLimitCount 

  } = useSubscriptionQuotas();



  const getFeatureIcon = (featureName: string) => {

    switch (featureName) {

      case 'users':

        return Users;

      case 'clients':

        return Building2;

      case 'storage_gb':

        return HardDrive;

      case 'invoices':

        return FileText;

      default:

        return FileText;

    }

  };



  const getFeatureDisplayName = (featureName: string) => {

    switch (featureName) {

      case 'users':

        return 'Utilisateurs';

      case 'clients':

        return 'Clients';

      case 'storage_gb':

        return 'Stockage';

      case 'invoices':

        return 'Factures';

      default:

        return featureName;

    }

  };



  const getFeatureUnit = (featureName: string) => {

    switch (featureName) {

      case 'storage_gb':

        return 'GB';

      case 'users': case 'clients': case 'invoices':

        return '';

      default:

        return '';

    }

  };



  const _getProgressColor = (percentage: number) => {

    if (percentage >= 95) return 'bg-red-500';

    if (percentage >= 80) return 'bg-amber-500';

    if (percentage >= 60) return 'bg-blue-500';

    return 'bg-green-500';

  };



  const getStatusColor = (percentage: number) => {

    if (percentage >= 95) return 'text-red-600 dark:text-red-400';

    if (percentage >= 80) return 'text-amber-600 dark:text-amber-400';

    return 'text-green-600 dark:text-green-400';

  };



  const topFeatures = getTopUsageFeatures(compact ? 2 : 4);

  const criticalCount = hasCriticalQuotas();

  const nearLimitCount = getNearLimitCount();



  if (isLoading) {

    return (

      <Card className={className}>

        <CardContent className="p-6">

          <div className="animate-pulse space-y-4">

            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>

            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>

            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>

          </div>

        </CardContent>

      </Card>

    );

  }



  if (usageLimits.length === 0) {

    return (

      <Card className={className}>

        <CardContent className="p-6 text-center">

          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />

          <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">

            Aucune limite configurée

          </p>

        </CardContent>

      </Card>

    );

  }



  return (

    <Card className={className}>

      <CardHeader className={compact ? 'pb-3' : 'pb-4'}>

        <div className="flex items-center justify-between">

          <div>

            <CardTitle className={compact ? 'text-sm' : 'text-base'}>

              Quotas d'utilisation

            </CardTitle>

            {!compact && (

              <CardDescription>

                Suivez votre consommation et vos limites

              </CardDescription>

            )}

          </div>

          

          {(criticalCount || nearLimitCount > 0) && (

            <div className="flex items-center space-x-1">

              {criticalCount && (

                <Badge variant="destructive" className="text-xs">

                  <AlertTriangle className="w-3 h-3 mr-1" />

                  Critique

                </Badge>

              )}

              {nearLimitCount > 0 && !criticalCount && (

                <Badge variant="secondary" className="text-xs">

                  <AlertTriangle className="w-3 h-3 mr-1" />

                  {nearLimitCount} proche{nearLimitCount > 1 ? 's' : ''}

                </Badge>

              )}

            </div>

          )}

        </div>

      </CardHeader>



      <CardContent className={compact ? 'pt-0 px-4 pb-4' : 'pt-0'}>

        <div className="space-y-4">

          {topFeatures.map((limit, index) => {

            const IconComponent = getFeatureIcon(limit.feature_name);

            const percentage = Math.round(limit.percentage_used);

            

            return (

              <motion.div

                key={limit.feature_name}

                initial={{ opacity: 0, y: 10 }}

                animate={{ opacity: 1, y: 0 }}

                transition={{ delay: index * 0.1 }}

                className="flex items-center space-x-3"

              >

                <div className="flex-shrink-0">

                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">

                    <IconComponent className="w-4 h-4 text-gray-600 dark:text-gray-400 dark:text-gray-400" />

                  </div>

                </div>

                

                <div className="flex-1 min-w-0">

                  <div className="flex items-center justify-between mb-1">

                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 dark:text-white truncate">

                      {getFeatureDisplayName(limit.feature_name)}

                    </span>

                    <div className="flex items-center space-x-2">

                      <span className={`text-xs font-medium ${getStatusColor(percentage)}`}>

                        {percentage}%

                      </span>

                      {limit.limit_value && (

                        <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">

                          {limit.current_usage}/{limit.limit_value} {getFeatureUnit(limit.feature_name)}

                        </span>

                      )}

                    </div>

                  </div>

                  

                  <Progress 

                    value={percentage} 

                    className={`h-2 ${compact ? 'h-1' : ''}`}

                  />

                </div>

              </motion.div>

            );

          })}



          {!compact && usageLimits.length > topFeatures.length && (

            <div className="flex items-center justify-center pt-2">

              <Button 

                variant="ghost" 

                size="sm" 

                onClick={() => navigate('/settings/billing')}

                className="text-xs"

              >

                <MoreHorizontal className="w-4 h-4 mr-1" />

                Voir tous les quotas

              </Button>

            </div>

          )}



          {showUpgradeButton && (criticalCount || nearLimitCount > 1) && (

            <div className={`${compact ? 'pt-2' : 'pt-4'} border-t border-gray-200 dark:border-gray-700`}>

              <Button 

                onClick={() => navigate('/pricing')}

                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"

                size={compact ? 'sm' : 'default'}

              >

                <ArrowUpCircle className="w-4 h-4 mr-2" />

                Augmenter les limites

              </Button>

            </div>

          )}

        </div>

      </CardContent>

    </Card>

  );

};



export default UsageQuotaWidget;
