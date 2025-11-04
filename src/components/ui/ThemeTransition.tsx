import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
// Hook personnalisé pour les thèmes (remplace next-themes)
const useTheme = () => {
  const [theme, setTheme] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'system';
    }
    return 'system';
  });

  React.useEffect(() => {
    const root = window.document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const effectiveTheme = theme === 'system' ? systemTheme : theme;
    
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
};
import { cn } from '../../lib/utils';

// Hook pour les transitions de thème fluides
export const useThemeTransition = () => {
  const { theme, setTheme } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const transitionTheme = async (newTheme: string) => {
    if (newTheme === theme) return;

    setIsTransitioning(true);

    // Ajouter une classe CSS pour la transition
    document.documentElement.classList.add('theme-transitioning');

    // Attendre un petit délai pour l'effet visuel
    await new Promise(resolve => setTimeout(resolve, 150));

    setTheme(newTheme);

    // Nettoyer après la transition
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
      setIsTransitioning(false);
    }, 300);
  };

  return { theme, transitionTheme, isTransitioning };
};

// Composant de transition de thème animé
export const AnimatedThemeToggle: React.FC<{
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'switch' | 'dropdown';
}> = ({ className, size = 'md', variant = 'button' }) => {
  const { theme, transitionTheme, isTransitioning } = useThemeTransition();
  const controls = useAnimation();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme || 'system');
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    transitionTheme(nextTheme);
  };

  useEffect(() => {
    if (isTransitioning) {
      controls.start({
        rotate: 180,
        scale: [1, 1.2, 1],
        transition: { duration: 0.3 }
      });
    }
  }, [isTransitioning, controls]);

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className={iconSizes[size]} />;
      case 'dark':
        return <Moon className={iconSizes[size]} />;
      default:
        return <Monitor className={iconSizes[size]} />;
    }
  };

  if (variant === 'switch') {
    return <ThemeSwitch className={className} size={size} />;
  }

  if (variant === 'dropdown') {
    return <ThemeDropdown className={className} />;
  }

  return (
    <motion.button
      className={cn(
        "relative rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm",
        "hover:shadow-md transition-shadow duration-200",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
        sizeClasses[size],
        "flex items-center justify-center",
        className
      )}
      onClick={cycleTheme}
      animate={controls}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      disabled={isTransitioning}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.2 }}
          className="text-gray-700 dark:text-gray-300"
        >
          {getIcon()}
        </motion.div>
      </AnimatePresence>

      {/* Effet de pulsation pendant la transition */}
      {isTransitioning && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-blue-400 opacity-20"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  );
};

// Switch toggle animé
const ThemeSwitch: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({ 
  className, 
  size = 'md' 
}) => {
  const { theme, transitionTheme } = useThemeTransition();
  const isDark = theme === 'dark';

  const sizeClasses = {
    sm: 'w-10 h-6',
    md: 'w-12 h-7',
    lg: 'w-14 h-8'
  };

  const handleSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <motion.button
      className={cn(
        "relative rounded-full transition-colors duration-200",
        isDark ? 'bg-gray-700' : 'bg-gray-200',
        sizeClasses[size],
        className
      )}
      onClick={() => transitionTheme(isDark ? 'light' : 'dark')}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className={cn(
          "absolute top-0.5 flex items-center justify-center rounded-full bg-white shadow-sm",
          handleSizes[size]
        )}
        animate={{
          x: isDark ? 'calc(100% + 0.25rem)' : '0.125rem'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isDark ? 'dark' : 'light'}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
          >
            {isDark ? (
              <Moon className="w-3 h-3 text-gray-700" />
            ) : (
              <Sun className="w-3 h-3 text-yellow-500" />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.button>
  );
};

// Dropdown de sélection de thème
const ThemeDropdown: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, transitionTheme } = useThemeTransition();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { value: 'light', label: 'Clair', icon: Sun },
    { value: 'dark', label: 'Sombre', icon: Moon },
    { value: 'system', label: 'Système', icon: Monitor }
  ];

  const currentTheme = themes.find(t => t.value === theme) || themes[2];

  return (
    <div className={cn("relative", className)}>
      <motion.button
        className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <currentTheme.icon className="w-4 h-4" />
        <span className="text-sm font-medium">{currentTheme.label}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ↓
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {themes.map((themeOption) => (
              <motion.button
                key={themeOption.value}
                className={cn(
                  "w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg",
                  theme === themeOption.value && "bg-blue-50 dark:bg-blue-900/20"
                )}
                onClick={() => {
                  transitionTheme(themeOption.value);
                  setIsOpen(false);
                }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <themeOption.icon className="w-4 h-4" />
                <span className="text-sm">{themeOption.label}</span>
                {theme === themeOption.value && (
                  <motion.div
                    className="ml-auto text-blue-500"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    ✓
                  </motion.div>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Overlay d'effet de transition global
export const ThemeTransitionOverlay: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as HTMLElement;
          if (target.classList.contains('theme-transitioning')) {
            setIsVisible(true);
            setTimeout(() => setIsVisible(false), 300);
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Effet de vague */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent"
            initial={{ x: '-100%', skewX: -45 }}
            animate={{ x: '200%', skewX: -45 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
          
          {/* Effet de pulsation */}
          <motion.div
            className="absolute inset-0 bg-white/5 dark:bg-black/5"
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// CSS personnalisé pour les transitions (à ajouter dans le CSS global)
export const themeTransitionStyles = `
  .theme-transitioning {
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  }
  
  .theme-transitioning * {
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, fill 0.3s ease;
  }
`;
