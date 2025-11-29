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

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  accent: string;
  accentHover: string;
  background: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

const MODULE_THEMES: Record<string, ThemeColors> = {
  dashboard: {
    primary: 'rgb(59, 130, 246)', // blue-500
    primaryHover: 'rgb(37, 99, 235)', // blue-600
    accent: 'rgb(99, 102, 241)', // indigo-500
    accentHover: 'rgb(79, 70, 229)', // indigo-600
    background: 'rgb(248, 250, 252)', // slate-50
    backgroundSecondary: 'rgb(241, 245, 249)', // slate-100
    text: 'rgb(15, 23, 42)', // slate-900
    textSecondary: 'rgb(71, 85, 105)', // slate-600
    border: 'rgb(226, 232, 240)', // slate-200
    success: 'rgb(34, 197, 94)', // green-500
    warning: 'rgb(245, 158, 11)', // amber-500
    error: 'rgb(239, 68, 68)', // red-500
  },
  accounting: {
    primary: 'rgb(16, 185, 129)', // emerald-500
    primaryHover: 'rgb(5, 150, 105)', // emerald-600
    accent: 'rgb(6, 182, 212)', // cyan-500
    accentHover: 'rgb(8, 145, 178)', // cyan-600
    background: 'rgb(240, 253, 250)', // emerald-50
    backgroundSecondary: 'rgb(209, 250, 229)', // emerald-100
    text: 'rgb(4, 47, 46)', // emerald-900
    textSecondary: 'rgb(6, 78, 59)', // emerald-800
    border: 'rgb(167, 243, 208)', // emerald-200
    success: 'rgb(34, 197, 94)',
    warning: 'rgb(245, 158, 11)',
    error: 'rgb(239, 68, 68)',
  },
  invoicing: {
    primary: 'rgb(34, 197, 94)', // green-500
    primaryHover: 'rgb(22, 163, 74)', // green-600
    accent: 'rgb(132, 204, 22)', // lime-500
    accentHover: 'rgb(101, 163, 13)', // lime-600
    background: 'rgb(240, 253, 244)', // green-50
    backgroundSecondary: 'rgb(220, 252, 231)', // green-100
    text: 'rgb(20, 83, 45)', // green-900
    textSecondary: 'rgb(22, 101, 52)', // green-800
    border: 'rgb(187, 247, 208)', // green-200
    success: 'rgb(34, 197, 94)',
    warning: 'rgb(245, 158, 11)',
    error: 'rgb(239, 68, 68)',
  },
  crm: {
    primary: 'rgb(147, 51, 234)', // purple-500
    primaryHover: 'rgb(126, 34, 206)', // purple-600
    accent: 'rgb(168, 85, 247)', // purple-400
    accentHover: 'rgb(147, 51, 234)', // purple-500
    background: 'rgb(250, 245, 255)', // purple-50
    backgroundSecondary: 'rgb(243, 232, 255)', // purple-100
    text: 'rgb(59, 7, 100)', // purple-900
    textSecondary: 'rgb(88, 28, 135)', // purple-800
    border: 'rgb(221, 214, 254)', // purple-200
    success: 'rgb(34, 197, 94)',
    warning: 'rgb(245, 158, 11)',
    error: 'rgb(239, 68, 68)',
  },
  reports: {
    primary: 'rgb(245, 158, 11)', // amber-500
    primaryHover: 'rgb(217, 119, 6)', // amber-600
    accent: 'rgb(251, 191, 36)', // amber-400
    accentHover: 'rgb(245, 158, 11)', // amber-500
    background: 'rgb(255, 251, 235)', // amber-50
    backgroundSecondary: 'rgb(254, 243, 199)', // amber-100
    text: 'rgb(120, 53, 15)', // amber-900
    textSecondary: 'rgb(146, 64, 14)', // amber-800
    border: 'rgb(253, 230, 138)', // amber-200
    success: 'rgb(34, 197, 94)',
    warning: 'rgb(245, 158, 11)',
    error: 'rgb(239, 68, 68)',
  },
  banking: {
    primary: 'rgb(6, 182, 212)', // cyan-500
    primaryHover: 'rgb(8, 145, 178)', // cyan-600
    accent: 'rgb(34, 211, 238)', // cyan-400
    accentHover: 'rgb(6, 182, 212)', // cyan-500
    background: 'rgb(236, 254, 255)', // cyan-50
    backgroundSecondary: 'rgb(207, 250, 254)', // cyan-100
    text: 'rgb(22, 78, 99)', // cyan-900
    textSecondary: 'rgb(21, 94, 117)', // cyan-800
    border: 'rgb(165, 243, 252)', // cyan-200
    success: 'rgb(34, 197, 94)',
    warning: 'rgb(245, 158, 11)',
    error: 'rgb(239, 68, 68)',
  },
  inventory: {
    primary: 'rgb(239, 68, 68)', // red-500
    primaryHover: 'rgb(220, 38, 38)', // red-600
    accent: 'rgb(251, 113, 133)', // rose-400
    accentHover: 'rgb(244, 63, 94)', // rose-500
    background: 'rgb(254, 242, 242)', // red-50
    backgroundSecondary: 'rgb(254, 226, 226)', // red-100
    text: 'rgb(127, 29, 29)', // red-900
    textSecondary: 'rgb(153, 27, 27)', // red-800
    border: 'rgb(254, 202, 202)', // red-200
    success: 'rgb(34, 197, 94)',
    warning: 'rgb(245, 158, 11)',
    error: 'rgb(239, 68, 68)',
  }
};

const DARK_MODULE_THEMES: Record<string, ThemeColors> = {
  dashboard: {
    primary: 'rgb(96, 165, 250)', // blue-400
    primaryHover: 'rgb(59, 130, 246)', // blue-500
    accent: 'rgb(129, 140, 248)', // indigo-400
    accentHover: 'rgb(99, 102, 241)', // indigo-500
    background: 'rgb(15, 23, 42)', // slate-900
    backgroundSecondary: 'rgb(30, 41, 59)', // slate-800
    text: 'rgb(248, 250, 252)', // slate-50
    textSecondary: 'rgb(203, 213, 225)', // slate-300
    border: 'rgb(71, 85, 105)', // slate-600
    success: 'rgb(34, 197, 94)',
    warning: 'rgb(245, 158, 11)',
    error: 'rgb(239, 68, 68)',
  },
  // Add other dark themes...
};

export interface ContextualThemeHook {
  theme: ThemeColors;
  isDark: boolean;
  currentModule: string;
  setTheme: (theme: Partial<ThemeColors>) => void;
  resetTheme: () => void;
  applyThemeToDOM: () => void;
}

export function useContextualTheme(): ContextualThemeHook {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [customTheme, setCustomTheme] = useState<Partial<ThemeColors>>({});

  // Detect current module from path
  const getCurrentModule = useCallback(() => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    
    const modulePath = path.split('/')[1];
    return modulePath || 'dashboard';
  }, [location.pathname]);

  const currentModule = getCurrentModule();

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark') ||
                         window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(isDarkMode);
    };

    checkDarkMode();
    
    // Listen for dark mode changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const observer = new MutationObserver(checkDarkMode);
    
    mediaQuery.addEventListener('change', checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    return () => {
      mediaQuery.removeEventListener('change', checkDarkMode);
      observer.disconnect();
    };
  }, []);

  // Get theme based on module and dark mode
  const getTheme = useCallback((): ThemeColors => {
    const baseTheme = isDark 
      ? (DARK_MODULE_THEMES[currentModule] || DARK_MODULE_THEMES.dashboard)
      : (MODULE_THEMES[currentModule] || MODULE_THEMES.dashboard);
    
    return { ...baseTheme, ...customTheme };
  }, [currentModule, isDark, customTheme]);

  const theme = getTheme();

  // Apply theme to DOM as CSS custom properties
  const applyThemeToDOM = useCallback(() => {
    const root = document.documentElement;
    
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-primary-hover', theme.primaryHover);
    root.style.setProperty('--theme-accent', theme.accent);
    root.style.setProperty('--theme-accent-hover', theme.accentHover);
    root.style.setProperty('--theme-background', theme.background);
    root.style.setProperty('--theme-background-secondary', theme.backgroundSecondary);
    root.style.setProperty('--theme-text', theme.text);
    root.style.setProperty('--theme-text-secondary', theme.textSecondary);
    root.style.setProperty('--theme-border', theme.border);
    root.style.setProperty('--theme-success', theme.success);
    root.style.setProperty('--theme-warning', theme.warning);
    root.style.setProperty('--theme-error', theme.error);
    
    // Also set data attribute for module
    root.setAttribute('data-module-theme', currentModule);
  }, [theme, currentModule]);

  // Apply theme on change
  useEffect(() => {
    applyThemeToDOM();
  }, [applyThemeToDOM]);

  const setTheme = useCallback((newTheme: Partial<ThemeColors>) => {
    setCustomTheme(prev => ({ ...prev, ...newTheme }));
  }, []);

  const resetTheme = useCallback(() => {
    setCustomTheme({});
  }, []);

  return {
    theme,
    isDark,
    currentModule,
    setTheme,
    resetTheme,
    applyThemeToDOM,
  };
}
