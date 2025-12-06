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

import React, { createContext, useContext, useEffect } from 'react';
    import { useLocalStorage } from '@/hooks/useLocalStorage.tsx';

    interface ThemeContextType {
      theme: string;
      setTheme: (theme: string) => void;
    }
    
    const ThemeContext = createContext<ThemeContextType | null>(null);

    export const ThemeProvider = ({ children, defaultTheme = 'system', storageKey = 'vite-ui-theme' }) => {
      const [theme, setTheme] = useLocalStorage(storageKey, defaultTheme);

      useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          root.classList.add(systemTheme);
          return;
        }

        root.classList.add(theme);
      }, [theme]);

      const value = {
        theme,
        setTheme: (newTheme) => {
          setTheme(newTheme);
        },
      };

      return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
    };

    export const useTheme = () => {
      const context = useContext(ThemeContext);
      if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
      }
      return context;
    };
