/**
 * PageTabs - Composant unifié pour les onglets de toutes les pages
 * Support de 3 variants (pills, underline, cards), 5 couleurs, 3 tailles
 * Gestion des badges et icônes
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;
  disabled?: boolean;
}

interface PageTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'pills' | 'underline' | 'cards';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'emerald' | 'blue' | 'purple' | 'amber';
}

export const PageTabs: React.FC<PageTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  size = 'md',
  color = 'primary'
}) => {
  const colorClasses = {
    primary: {
      active: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30',
      inactive: 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50',
      border: 'border-indigo-500'
    },
    emerald: {
      active: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30',
      inactive: 'text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
      border: 'border-emerald-500'
    },
    blue: {
      active: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30',
      inactive: 'text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20',
      border: 'border-blue-500'
    },
    purple: {
      active: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30',
      inactive: 'text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20',
      border: 'border-purple-500'
    },
    amber: {
      active: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30',
      inactive: 'text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20',
      border: 'border-amber-500'
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5'
  };

  const colors = colorClasses[color];
  const sizes = sizeClasses[size];

  if (variant === 'pills') {
    return (
      <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onChange(tab.id)}
              disabled={tab.disabled}
              className={`flex items-center ${sizes} rounded-xl font-medium transition-all duration-200
                ${isActive ? colors.active : colors.inactive}
                ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${isActive ? 'scale-[1.02]' : 'hover:scale-[1.01]'}
              `}
            >
              {Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'} />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold
                  ${isActive
                    ? 'bg-white/30 text-white'
                    : 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'underline') {
    return (
      <div className="flex border-b border-gray-200 dark:border-gray-600 dark:border-gray-700 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onChange(tab.id)}
              disabled={tab.disabled}
              className={`flex items-center ${sizes} font-medium transition-all border-b-2 -mb-[2px]
                ${isActive
                  ? `${colors.border} text-gray-900 dark:text-white`
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                }
                ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'} />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // variant === 'cards'
  return (
    <div className="flex flex-wrap gap-3">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={`flex items-center ${sizes} rounded-2xl font-medium transition-all duration-200 border-2
              ${isActive
                ? `${colors.active} border-transparent`
                : `bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${colors.inactive}`
              }
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'}
            `}
          >
            {Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold
                ${isActive
                  ? 'bg-white/30 text-white'
                  : 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
