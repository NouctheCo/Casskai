import React, { useState } from 'react';
import { motion, useAnimation, useSpring, useTransform } from 'framer-motion';
import { Card, CardContent, CardHeader } from './card';
import { cn } from '../../lib/utils';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
  hoverRotation?: number;
  glowEffect?: boolean;
  clickEffect?: boolean;
  delay?: number;
  onClick?: () => void;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className,
  hoverScale = 1.02,
  hoverRotation = 0,
  glowEffect = true,
  clickEffect = true,
  delay = 0,
  onClick,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const controls = useAnimation();

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay,
        ease: [0.23, 1, 0.32, 1]
      }
    },
    hover: {
      scale: hoverScale,
      rotate: hoverRotation,
      y: -2,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    tap: clickEffect ? {
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    } : {}
  };

  return (
    <motion.div
      className={cn("relative", className)}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default'
      }}
      {...props}
    >
      {glowEffect && (
        <motion.div
          className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg opacity-0 blur"
          animate={{
            opacity: isHovered ? 0.3 : 0,
          }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      <Card className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        {children}
      </Card>
    </motion.div>
  );
};

// Card KPI spécialisée avec animations avancées
export const KPICard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
  className?: string;
  delay?: number;
}> = ({
  title,
  value,
  change,
  icon,
  color = 'blue',
  className,
  delay = 0
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <motion.div
      className={cn("relative group", className)}
      initial={{ opacity: 0, y: 30 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: {
          duration: 0.6,
          delay,
          ease: [0.23, 1, 0.32, 1]
        }
      }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.2 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Glow effect */}
      <motion.div
        className={cn(
          "absolute -inset-0.5 bg-gradient-to-r rounded-xl opacity-0 blur-sm",
          colorClasses[color]
        )}
        animate={{
          opacity: isHovered ? 0.4 : 0,
        }}
        transition={{ duration: 0.3 }}
      />
      
      <Card className="relative bg-white dark:bg-gray-800 border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <motion.p 
                className="text-sm font-medium text-gray-600 dark:text-gray-400"
                animate={isHovered ? { x: 2 } : { x: 0 }}
                transition={{ duration: 0.2 }}
              >
                {title}
              </motion.p>
              
              <motion.div 
                className="text-2xl font-bold text-gray-900 dark:text-white"
                animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <AnimatedNumber value={typeof value === 'number' ? value : 0} />
                {typeof value === 'string' && value}
              </motion.div>
              
              {change !== undefined && (
                <motion.div 
                  className={cn(
                    "flex items-center text-sm",
                    change >= 0 ? "text-green-600" : "text-red-600"
                  )}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: 1,
                    transition: { delay: delay + 0.3 }
                  }}
                >
                  <span className={change >= 0 ? "↗" : "↘"}></span>
                  {Math.abs(change)}%
                </motion.div>
              )}
            </div>
            
            {icon && (
              <motion.div
                className={cn(
                  "p-3 rounded-lg bg-gradient-to-r text-white",
                  colorClasses[color]
                )}
                animate={isHovered ? { 
                  rotate: 5,
                  scale: 1.1 
                } : { 
                  rotate: 0,
                  scale: 1 
                }}
                transition={{ duration: 0.2 }}
              >
                {icon}
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Composant pour animer les nombres
export const AnimatedNumber: React.FC<{
  value: number;
  duration?: number;
  format?: (value: number) => string;
}> = ({
  value,
  duration = 2,
  format = (val) => val.toLocaleString()
}) => {
  const animatedValue = useSpring(0, {
    stiffness: 50,
    damping: 15
  });

  const display = useTransform(animatedValue, (latest) => 
    format(Math.round(latest))
  );

  React.useEffect(() => {
    animatedValue.set(value);
  }, [animatedValue, value]);

  return <motion.span>{display}</motion.span>;
};

// Card avec effet de flip
export const FlipCard: React.FC<{
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
}> = ({ front, back, className }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className={cn("relative h-64 w-full perspective-1000", className)}>
      <motion.div
        className="relative w-full h-full cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          <Card className="w-full h-full">
            {front}
          </Card>
        </div>
        
        {/* Back */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden"
          style={{ transform: "rotateY(180deg)" }}
        >
          <Card className="w-full h-full">
            {back}
          </Card>
        </div>
      </motion.div>
    </div>
  );
};