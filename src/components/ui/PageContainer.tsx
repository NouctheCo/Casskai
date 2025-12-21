import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  variant?: 'default' | 'auth' | 'landing' | 'legal' | 'onboarding';
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  variant = 'default',
  className 
}) => {
  const baseClasses = 'min-h-screen';
  
  const variants = {
    default: 'bg-gray-50 dark:bg-gray-900',
    auth: 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800',
    landing: 'bg-white dark:bg-gray-900',
    legal: 'bg-gray-50 dark:bg-gray-900',
    onboarding: 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800'
  };

  return (
    <div className={cn(baseClasses, variants[variant], className)}>
      {children}
    </div>
  );
};

export default PageContainer;
