import React, { createContext, useContext, useEffect } from 'react';
    import { useLocalStorage } from '@/hooks/useLocalStorage';

    const ThemeContext = createContext();

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
      if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
      }
      return context;
    };