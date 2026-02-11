/**
 * CassKai - Animated KPI Card
 *
 * Phase 2 (P1) - Dashboard Temps Réel
 *
 * Carte KPI avec animations lors des mises à jour :
 * - Pulse sur changement de valeur
 * - Highlight bleu temporaire
 * - Trend badge animé
 * - Effet glow sur valeurs critiques
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AnimatedKPICardProps {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'critical' | 'warning' | 'success';
  className?: string;
  children?: React.ReactNode;
}

export function AnimatedKPICard({
  id,
  label,
  value,
  unit = '',
  trend,
  trendValue,
  icon: Icon,
  variant = 'default',
  className,
  children
}: AnimatedKPICardProps) {
  const [prevValue, setPrevValue] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);
  const controls = useAnimation();
  const valueRef = useRef(value);

  /**
   * Détecter changement de valeur et déclencher animation
   */
  useEffect(() => {
    if (value !== prevValue && valueRef.current !== value) {
      setIsUpdating(true);

      // Animation de highlight
      controls.start({
        backgroundColor: ['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0)', 'transparent'],
        scale: [1, 1.02, 1],
        transition: { duration: 0.6, ease: 'easeOut' }
      });

      // Reset après animation
      setTimeout(() => {
        setIsUpdating(false);
        setPrevValue(value);
        valueRef.current = value;
      }, 600);
    }
  }, [value, prevValue, controls]);

  /**
   * Icône de trend selon direction
   */
  const TrendIcon = () => {
    if (!trend) return null;

    const icons = {
      up: TrendingUp,
      down: TrendingDown,
      neutral: Minus
    };

    const colors = {
      up: 'text-green-600 dark:text-green-400',
      down: 'text-red-600 dark:text-red-400',
      neutral: 'text-gray-500 dark:text-gray-400'
    };

    const IconComponent = icons[trend];

    return <IconComponent className={cn('w-4 h-4', colors[trend])} />;
  };

  /**
   * Couleurs selon variant
   */
  const variantStyles = {
    default: 'border-gray-200 dark:border-gray-700',
    critical: 'border-red-300 bg-red-50/50 dark:bg-red-950/20',
    warning: 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/20',
    success: 'border-green-300 bg-green-50/50 dark:bg-green-950/20'
  };

  const variantGlow = {
    default: '',
    critical: 'shadow-lg shadow-red-500/20',
    warning: 'shadow-lg shadow-orange-500/20',
    success: 'shadow-lg shadow-green-500/20'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div animate={controls}>
        <Card
          className={cn(
            'relative overflow-hidden transition-all duration-300',
            variantStyles[variant],
            variantGlow[variant],
            isUpdating && 'ring-2 ring-blue-400 ring-opacity-50',
            className
          )}
        >
          {/* Badge LIVE pendant mise à jour */}
          {isUpdating && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute top-2 right-2 z-10"
            >
              <Badge
                variant="default"
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs animate-pulse"
              >
                LIVE
              </Badge>
            </motion.div>
          )}

          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <div className="flex items-center space-x-2">
                {Icon && <Icon className="w-4 h-4 text-gray-500" />}
                <TrendIcon />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              {/* Valeur principale avec animation */}
              <motion.div
                key={String(value)} // Force re-render on value change
                initial={{ scale: 1.1, color: '#3B82F6' }}
                animate={{ scale: 1, color: 'inherit' }}
                transition={{ duration: 0.5 }}
                className="text-2xl font-bold"
              >
                {value}{unit && ` ${unit}`}
              </motion.div>

              {/* Trend badge */}
              {trendValue && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Badge
                    variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'outline'}
                    className="text-xs"
                  >
                    {trend === 'up' && '+'}
                    {trendValue}
                  </Badge>
                </motion.div>
              )}

              {/* Contenu additionnel (graphiques, etc.) */}
              {children}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default AnimatedKPICard;
