import React, { useEffect } from 'react';
import {
  Menu,
  UserCircle,
  Briefcase,
  LogOut,
  ChevronsRightLeft,
  Layers,
  Settings as SettingsIcon,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import EnterpriseSelector from '@/components/enterprise/EnterpriseSelector';

// Logo component simplifié - juste du texte
const Logo = () => {
  return (
    <div className="font-bold text-primary text-xl">CK</div>
  );
};

// Fonction pour obtenir les initiales d'un nom
const getInitials = (name) => {
  if (!name) return 'U';
  
  const parts = name.split(' ');
  if (parts.length === 1) return name.charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Fonction pour obtenir le nom d'utilisateur
const getUserDisplayName = (user) => {
  if (!user) return null;
  
  // Vérifier les métadonnées utilisateur
  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name;
  }
  
  if (user.user_metadata?.display_name) {
    return user.user_metadata.display_name;
  }
  
  if (user.user_metadata?.first_name && user.user_metadata?.last_name) {
    return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
  }
  
  if (user.user_metadata?.first_name) {
    return user.user_metadata.first_name;
  }
  
  // Fallback sur l'email
  if (user.email) {
    const emailName = user.email.split('@')[0];
    // Capitaliser la première lettre
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }
  
  return null;
};

export function Header({ toggleSidebar, isSidebarCollapsed, isMobile }) {
  const { t } = useLocale();
  const navigate = useNavigate();
  const {
    user,
    signOut,
    userCompanies = [],
    switchEnterprise,
    currentEnterpriseId,
    currentEnterpriseName
  } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleEnterpriseChange = (company) => {
    switchEnterprise(company.id);
  };

  // Obtenir le nom d'affichage et les initiales
  const userDisplayName = getUserDisplayName(user);
  const userInitials = getInitials(userDisplayName || user?.email);

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center">
        {isMobile ? (
          <Button variant="ghost\" size="icon\" onClick={toggleSidebar} className="mr-2">
            <Menu className="h-6 w-6" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
            <ChevronsRightLeft className={cn("h-5 w-5 transition-transform duration-300", isSidebarCollapsed && "rotate-180")} />
          </Button>
        )}

        {!isMobile && isSidebarCollapsed && (
          <div className="flex items-center">
            <Logo />
          </div>
        )}
      </div>

      {/* Entreprise active - visible sur mobile et desktop */}
      <div className="flex items-center">
        <EnterpriseSelector />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 z-[100]" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  {userDisplayName && (
                    <p className="text-sm font-medium leading-none">{userDisplayName}</p>
                  )}
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>{t('settings')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}