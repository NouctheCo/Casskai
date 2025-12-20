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

/**
 * Sidebar "Floating Cards" - Design moderne avec glassmorphism
 * Support des favoris, récents, badges de notification et recherche
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard, Calculator, Receipt, Landmark, TrendingUp, Scale,
  Handshake, FileSignature, ShoppingCart, Package, FolderKanban,
  Building, Building2, UserCog, BarChart3, Zap, Search, Pin, PinOff,
  ChevronDown, Sparkles, Shield, TrendingDown
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

interface MenuSection {
  id: string;
  label: string;
  emoji: string;
  gradient: string;
  bgLight: string;
  bgLightHover: string;
  items: MenuItem[];
}

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentCompany, user } = useAuth();

  const [expandedSections, setExpandedSections] = useState<string[]>(['finances']);
  const [pinnedItems, setPinnedItems] = useState<string[]>([]);
  const [_recentItems, setRecentItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [badges, setBadges] = useState<Record<string, number>>({});

  // Charger les préférences utilisateur
  useEffect(() => {
    const savedPinned = localStorage.getItem(`casskai_pinned_${user?.id}`);
    const savedRecent = localStorage.getItem(`casskai_recent_${user?.id}`);
    const savedExpanded = localStorage.getItem(`casskai_expanded_${user?.id}`);

    if (savedPinned) setPinnedItems(JSON.parse(savedPinned));
    if (savedRecent) setRecentItems(JSON.parse(savedRecent));
    if (savedExpanded) setExpandedSections(JSON.parse(savedExpanded));
  }, [user?.id]);

  // Sauvegarder les préférences
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`casskai_pinned_${user.id}`, JSON.stringify(pinnedItems));
      localStorage.setItem(`casskai_expanded_${user.id}`, JSON.stringify(expandedSections));
    }
  }, [pinnedItems, expandedSections, user?.id]);

  // Charger les badges (notifications)
  useEffect(() => {
    const loadBadges = async () => {
      if (!currentCompany?.id) return;

      // Factures en attente
      const { count: invoicesPending } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', currentCompany.id)
        .eq('status', 'draft');

      // Congés en attente
      const { count: leavePending } = await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', currentCompany.id)
        .eq('status', 'pending');

      // Contrats à renouveler
      const { count: contractsExpiring } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', currentCompany.id)
        .lte('end_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

      // Ne définir les badges QUE s'ils ont une valeur > 0
      const newBadges: Record<string, number> = {};
      if (invoicesPending && invoicesPending > 0) newBadges.invoicing = invoicesPending;
      if (leavePending && leavePending > 0) newBadges.hr = leavePending;
      if (contractsExpiring && contractsExpiring > 0) newBadges.contracts = contractsExpiring;

      setBadges(newBadges);
    };

    loadBadges();
  }, [currentCompany?.id]);

  // Tracker les pages récentes
  useEffect(() => {
    const currentPath = location.pathname;
    setRecentItems(prev => {
      const updated = [currentPath, ...prev.filter(p => p !== currentPath)].slice(0, 5);
      if (user?.id) {
        localStorage.setItem(`casskai_recent_${user.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  }, [location.pathname, user?.id]);

  const menuSections: MenuSection[] = [
    {
      id: 'finances',
      label: t('sidebar.finances', 'Finances'),
      emoji: '💰',
      gradient: 'from-emerald-400 to-teal-500',
      bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
      bgLightHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/10',
      items: [
        { id: 'dashboard-fin', label: t('sidebar.dashboard', 'Tableau de bord'), icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { id: 'accounting', label: t('sidebar.accounting', 'Comptabilité'), icon: <Calculator size={20} />, path: '/accounting' },
        { id: 'assets', label: t('sidebar.assets', 'Immobilisations'), icon: <Building2 size={20} />, path: '/assets' },
        { id: 'invoicing', label: t('sidebar.invoicing', 'Facturation'), icon: <Receipt size={20} />, path: '/invoicing', badge: badges.invoicing },
        { id: 'banking', label: t('sidebar.banking', 'Banque'), icon: <Landmark size={20} />, path: '/banks' },
        { id: 'budget', label: t('sidebar.budget', 'Budget & Prévisions'), icon: <TrendingUp size={20} />, path: '/forecasts' },
        { id: 'tax', label: t('sidebar.tax', 'Fiscalité'), icon: <Scale size={20} />, path: '/tax' },
      ]
    },
    {
      id: 'commercial',
      label: t('sidebar.commercial', 'Commercial'),
      emoji: '🤝',
      gradient: 'from-blue-400 to-indigo-500',
      bgLight: 'bg-blue-50 dark:bg-blue-900/20',
      bgLightHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/10',
      items: [
        { id: 'crm', label: t('sidebar.crm', 'CRM Ventes'), icon: <Handshake size={20} />, path: '/sales-crm' },
        { id: 'contracts', label: t('sidebar.contracts', 'Contrats'), icon: <FileSignature size={20} />, path: '/contracts', badge: badges.contracts },
      ]
    },
    {
      id: 'gestion',
      label: t('sidebar.management', 'Gestion'),
      emoji: '⚙️',
      gradient: 'from-purple-400 to-pink-500',
      bgLight: 'bg-purple-50 dark:bg-purple-900/20',
      bgLightHover: 'hover:bg-purple-50 dark:hover:bg-purple-900/10',
      items: [
        { id: 'purchases', label: t('sidebar.purchases', 'Achats'), icon: <ShoppingCart size={20} />, path: '/purchases' },
        { id: 'inventory', label: t('sidebar.inventory', 'Stock & Inventaire'), icon: <Package size={20} />, path: '/inventory' },
        { id: 'projects', label: t('sidebar.projects', 'Projets'), icon: <FolderKanban size={20} />, path: '/projects' },
        { id: 'thirdparties', label: t('sidebar.thirdparties', 'Tiers'), icon: <Building size={20} />, path: '/third-parties' },
        { id: 'hr', label: t('sidebar.hr', 'Ressources Humaines'), icon: <UserCog size={20} />, path: '/hr', badge: badges.hr },
      ]
    },
    {
      id: 'analytics',
      label: t('sidebar.analytics', 'Analyse'),
      emoji: '📊',
      gradient: 'from-amber-400 to-orange-500',
      bgLight: 'bg-amber-50 dark:bg-amber-900/20',
      bgLightHover: 'hover:bg-amber-50 dark:hover:bg-amber-900/10',
      items: [
        { id: 'reports', label: t('sidebar.reports', 'Rapports'), icon: <BarChart3 size={20} />, path: '/reports' },
        { id: 'tax-simulator', label: t('sidebar.tax_simulator', 'Simulateur IS/IR'), icon: <Calculator size={20} />, path: '/reports/tax-simulator' },
        { id: 'loan-simulator', label: t('sidebar.loan_simulator', 'Simulateur de Prêt'), icon: <TrendingDown size={20} />, path: '/reports/loan-simulator' },
        { id: 'automation', label: t('sidebar.automation', 'Automatisation'), icon: <Zap size={20} />, path: '/automation' },
      ]
    },
    {
      id: 'admin',
      label: t('sidebar.admin', 'Administration'),
      emoji: '🔒',
      gradient: 'from-red-400 to-rose-500',
      bgLight: 'bg-red-50 dark:bg-red-900/20',
      bgLightHover: 'hover:bg-red-50 dark:hover:bg-red-900/10',
      items: [
        { id: 'audit-logs', label: t('sidebar.audit_logs', 'Logs d\'Audit'), icon: <Shield size={20} />, path: '/admin/audit-logs' },
      ]
    }
  ];

  const allItems = menuSections.flatMap(s => s.items);
  const pinnedItemsData = allItems.filter(item => pinnedItems.includes(item.id));

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const togglePin = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => location.pathname === path;

  // Filtrer par recherche
  const filteredSections = searchQuery
    ? menuSections.map(section => ({
        ...section,
        items: section.items.filter(item =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(section => section.items.length > 0)
    : menuSections;

  return (
    <aside className="w-80 m-3 mr-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 flex flex-col overflow-hidden border border-white/50 dark:border-gray-700/50">
      {/* Logo */}
      <div className="p-6 pb-4">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden">
            <img
              src="/icons/icon-512.png"
              alt="CassKai Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback vers icon-192 si icon-512 échoue
                e.currentTarget.src = '/icons/icon-192.png';
              }}
            />
          </div>
          <div className="text-left">
            <h1 className="font-bold text-xl text-gray-800 dark:text-white">CassKai</h1>
            <p className="text-xs text-gray-400 dark:text-gray-300 truncate max-w-[140px]">
              {currentCompany?.name || 'Finance Platform'}
            </p>
          </div>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search', 'Rechercher un module...')}
            className="w-full pl-11 pr-12 py-3 bg-slate-100/80 dark:bg-gray-800/80 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:bg-gray-800 dark:focus:bg-gray-800 transition-all placeholder-gray-400 dark:placeholder-gray-500 dark:text-white"
          />
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
          <div className="absolute right-3 top-2.5 flex gap-0.5">
            <kbd className="px-1.5 py-1 bg-white dark:bg-gray-800 dark:bg-gray-700 text-gray-400 dark:text-gray-500 text-xs rounded-md shadow-sm">⌘</kbd>
            <kbd className="px-1.5 py-1 bg-white dark:bg-gray-800 dark:bg-gray-700 text-gray-400 dark:text-gray-500 text-xs rounded-md shadow-sm">K</kbd>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">

        {/* Épinglés / Favoris */}
        {pinnedItemsData.length > 0 && !searchQuery && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-800/30">
            <div className="flex items-center gap-2 mb-3">
              <Pin className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                {t('sidebar.pinned', 'Épinglés')}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {pinnedItemsData.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all
                    ${isActive(item.path)
                      ? 'bg-white dark:bg-gray-800 shadow-md text-gray-800 dark:text-white font-medium'
                      : 'bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm'
                    }`}
                >
                  <span className="text-gray-500 dark:text-gray-300">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium dark:bg-red-900/20">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Menu Sections as Cards */}
        {filteredSections.map(section => (
          <div
            key={section.id}
            className={`rounded-2xl overflow-hidden transition-all duration-300 ${
              expandedSections.includes(section.id)
                ? 'shadow-lg dark:shadow-black/20'
                : 'shadow-sm hover:shadow-md'
            }`}
          >
            {/* Section Header */}
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className={`w-full flex items-center justify-between p-4 transition-all ${
                expandedSections.includes(section.id)
                  ? `bg-gradient-to-r ${section.gradient} text-white`
                  : `${section.bgLight} text-gray-700 dark:text-gray-200 hover:opacity-90`
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{section.emoji}</span>
                <div className="text-left">
                  <span className="font-bold">{section.label}</span>
                  <p className={`text-xs ${
                    expandedSections.includes(section.id)
                      ? 'text-white/80'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {section.items.length} modules
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {section.items.some(i => i.badge && i.badge > 0) && (
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    expandedSections.includes(section.id)
                      ? 'bg-white/30 text-white'
                      : 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                  }`}>
                    {section.items.reduce((sum, i) => sum + (i.badge || 0), 0)}
                  </span>
                )}
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-300 ${
                    expandedSections.includes(section.id) ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {/* Section Items */}
            {expandedSections.includes(section.id) && (
              <div className="bg-white dark:bg-gray-800 p-2 space-y-1">
                {section.items.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.path)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all group
                      ${isActive(item.path)
                        ? `${section.bgLight} font-medium text-gray-800 dark:text-white`
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive(item.path) ? 'text-gray-700 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && item.badge > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
                          {item.badge}
                        </span>
                      )}
                      <div
                        onClick={(e) => togglePin(item.id, e)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && togglePin(item.id, e as any)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          pinnedItems.includes(item.id)
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/30 opacity-100'
                            : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {pinnedItems.includes(item.id) ? <PinOff size={14} /> : <Pin size={14} />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50">
        <button
          type="button"
          onClick={() => navigate('/billing')}
          className="w-full py-3.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="h-5 w-5" />
          {t('sidebar.manageSubscription', "Gérer l'abonnement")}
        </button>

        {/* Shortcuts hint */}
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">⌘</kbd>
          <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">⇧</kbd>
          <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">D</kbd>
          <span>→ Dashboard</span>
        </div>
      </div>
    </aside>
  );
};
