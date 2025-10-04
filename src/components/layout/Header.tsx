import React, { useState } from 'react';
import { Menu, Settings, Bell, User, Search, Command, ChevronDown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { NotificationCenter, useNotificationCenter } from '@/components/notifications/NotificationCenter';

interface HeaderProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
  isDesktopSidebarCollapsed?: boolean;
}

export function Header({ 
  onMenuClick, 
  isMobile = false, 
  isDesktopSidebarCollapsed = false 
}: HeaderProps) {
  const { currentEnterprise } = useEnterprise();
  const { t } = useLocale();
  const { user, signOut, currentCompany } = useAuth();
  // const navigate = useNavigate(); // Commenté car on utilise Link maintenant
  const [searchFocused, setSearchFocused] = useState(false);

  // Utiliser le hook pour les notifications
  const { isOpen: isNotificationOpen, setIsOpen: setNotificationOpen, unreadCount } = useNotificationCenter();

  // Use currentCompany from AuthContext if available, fallback to currentEnterprise
  const displayCompany = currentCompany || currentEnterprise;

  return (
    <motion.header 
      className={cn(
        "main-header bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 fixed top-0 z-40 shadow-sm transition-all duration-300 ease-in-out",
        isMobile 
          ? "left-0 right-0 w-full" 
          : isDesktopSidebarCollapsed 
            ? "left-16 right-0" 
            : "left-64 right-0"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="header-content flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 w-full">
        {/* Left side - Menu and branding */}
        <div className="flex items-center space-x-4">
          {isMobile && (
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="md:hidden hover:bg-white/20 dark:hover:bg-gray-800/20"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </motion.div>
          )}
          
          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link 
                to="/dashboard"
                className="text-xl font-bold text-gray-900 dark:text-white gradient-text hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              >
                CassKai
              </Link>
            </motion.div>
            {displayCompany && (
              <motion.div
                className="flex items-center space-x-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  {displayCompany.name}
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Center - Search bar */}
        <div className="hidden lg:flex flex-1 max-w-md mx-4 lg:mx-8">
          <motion.div
            className="relative w-full"
            animate={{ scale: searchFocused ? 1.02 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('header.search', { defaultValue: 'Rechercher...' })}
              className="w-full pl-10 pr-12 py-2 bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-200"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-600">
                ⌘K
              </kbd>
            </div>
            
            {/* Search spotlight effect */}
            <AnimatePresence>
              {searchFocused && (
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 -z-10"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right side - Actions */}
        <div className="button-group flex items-center space-x-1 sm:space-x-2">
          {/* Mobile search */}
          <div className="lg:hidden">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button variant="ghost" size="icon" className="hover:bg-white/20 dark:hover:bg-gray-800/20 min-h-[44px] min-w-[44px] touch-manipulation">
                <Search className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>

          {/* Notifications with animated badge */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-white/20 dark:hover:bg-gray-800/20 min-h-[44px] min-w-[44px] touch-manipulation"
              onClick={() => setNotificationOpen(!isNotificationOpen)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <motion.span
                  className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </Button>
          </motion.div>

          {/* Settings */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:bg-white/20 dark:hover:bg-gray-800/20"
              asChild
            >
              <Link to="/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
          </motion.div>

          {/* Theme Toggle */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ThemeToggle />
          </motion.div>

          {/* Language Toggle */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <LanguageToggle />
          </motion.div>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-white/20 dark:hover:bg-gray-800/20 px-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card w-56">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="px-3 py-2 border-b border-white/20 dark:border-gray-800/20">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.user_metadata?.name || user?.email?.split('@')[0] || t('header.guestUser', { defaultValue: 'Utilisateur' })}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email || t('header.noEmail', { defaultValue: 'pas d\'email' })}
                  </p>
                </div>
                <DropdownMenuItem 
                  className="hover:bg-white/20 dark:hover:bg-gray-800/20"
                  asChild
                >
                  <Link to="/settings">
                    {t('header.profile', { defaultValue: 'Mon profil' })}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="hover:bg-white/20 dark:hover:bg-gray-800/20 flex items-center gap-2"
                  asChild
                >
                  <Link to="/security">
                    <Shield className="h-4 w-4" />
                    {t('sidebar.security', { defaultValue: 'Sécurité & Confidentialité' })}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="hover:bg-white/20 dark:hover:bg-gray-800/20"
                  asChild
                >
                  <Link to="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    {t('header.settings', { defaultValue: 'Paramètres' })}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="hover:bg-white/20 dark:hover:bg-gray-800/20"
                  asChild
                >
                  <Link to="/help">
                    {t('header.help', { defaultValue: 'Aide' })}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/20 dark:bg-gray-800/20" />
                <DropdownMenuItem 
                  className="hover:bg-white/20 dark:hover:bg-gray-800/20 text-red-600 dark:text-red-400"
                  onClick={async () => {
                    await signOut();
                    window.location.href = '/auth'; // Redirection forcée après déconnexion
                  }}
                >
                  {t('header.logout', { defaultValue: 'Se déconnecter' })}
                </DropdownMenuItem>
              </motion.div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Animated border bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      {/* Notification Center */}
      <NotificationCenter
        isOpen={isNotificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </motion.header>
  );
}
