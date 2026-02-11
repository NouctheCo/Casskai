/**
 * CassKai - Navigation Comptabilité Optimisée
 * Navigation sans scroll horizontal avec dropdowns pour regrouper les éléments
 */
import { useState, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';
import {
  Eye,
  FileText,
  Edit3,
  Book,
  FolderTree,
  List,
  Upload,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  Menu,
  X,
  Lock
} from 'lucide-react';
interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  value?: string; // Pour la valeur de l'onglet actif
  type: 'link' | 'dropdown';
  items?: SubNavItem[];
  badge?: number;
}
interface SubNavItem {
  id: string;
  label: string;
  value: string;
  icon: React.ReactNode;
}
interface AccountingNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  anomaliesCount?: number;
  translations: {
    overview: string;
    operations: string;
    entries: string;
    journals: string;
    structure: string;
    chartOfAccounts: string;
    importFEC: string;
    reports: string;
    anomalies: string;
    closure: string;
  };
}
export function AccountingNavigation({
  activeTab,
  onTabChange,
  anomaliesCount = 0,
  translations: t
}: AccountingNavigationProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const navigationItems: NavItem[] = [
    {
      id: 'overview',
      icon: <Eye className="w-4 h-4" />,
      label: t.overview,
      value: 'overview',
      type: 'link'
    },
    {
      id: 'operations',
      icon: <FileText className="w-4 h-4" />,
      label: t.operations,
      type: 'dropdown',
      items: [
        {
          id: 'entries',
          label: t.entries,
          value: 'entries',
          icon: <Edit3 className="w-4 h-4" />
        },
        {
          id: 'journals',
          label: t.journals,
          value: 'journals',
          icon: <Book className="w-4 h-4" />
        }
      ]
    },
    {
      id: 'structure',
      icon: <FolderTree className="w-4 h-4" />,
      label: t.structure,
      type: 'dropdown',
      items: [
        {
          id: 'accounts',
          label: t.chartOfAccounts,
          value: 'accounts',
          icon: <List className="w-4 h-4" />
        },
        {
          id: 'fec-import',
          label: t.importFEC,
          value: 'fec-import',
          icon: <Upload className="w-4 h-4" />
        }
      ]
    },
    {
      id: 'reports',
      icon: <TrendingUp className="w-4 h-4" />,
      label: t.reports,
      value: 'reports',
      type: 'link'
    },
    {
      id: 'anomalies',
      icon: <AlertTriangle className="w-4 h-4" />,
      label: t.anomalies,
      value: 'anomalies',
      type: 'link',
      badge: anomaliesCount
    },
    {
      id: 'closure',
      icon: <Lock className="w-4 h-4" />,
      label: t.closure,
      value: 'closure',
      type: 'link'
    }
  ];
  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const dropdownElement = dropdownRefs.current.get(openDropdown);
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      }
    };
    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [openDropdown]);
  // Fermer le menu mobile au changement d'onglet
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);
  const isActive = (value?: string, items?: SubNavItem[]) => {
    if (value) {
      return activeTab === value;
    }
    if (items) {
      return items.some(item => activeTab === item.value);
    }
    return false;
  };
  const handleItemClick = (value: string) => {
    logger.debug('AccountingNavigation', '🔍 AccountingNavigation - handleItemClick called:', value);
    onTabChange(value);
    setOpenDropdown(null);
  };
  // Version Desktop
  const DesktopNav = () => (
    <nav className="hidden md:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 h-14">
          {navigationItems.map((item) => {
            if (item.type === 'link') {
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.value!)}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-lg
                    text-sm font-medium whitespace-nowrap transition-colors
                    ${
                      isActive(item.value)
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            }
            // Dropdown
            return (
              <div
                key={item.id}
                className="relative"
                ref={(el) => {
                  if (el) dropdownRefs.current.set(item.id, el);
                }}
              >
                <button
                  onClick={() => setOpenDropdown(openDropdown === item.id ? null : item.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg
                    text-sm font-medium whitespace-nowrap transition-colors
                    ${
                      isActive(undefined, item.items)
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      openDropdown === item.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {/* Dropdown Menu */}
                {openDropdown === item.id && (
                  <div className="absolute top-full left-0 mt-2 w-56 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50">
                    <div className="py-1">
                      {item.items?.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => handleItemClick(subItem.value)}
                          className={`
                            w-full flex items-center gap-3 px-4 py-2.5
                            text-sm transition-colors text-left
                            ${
                              activeTab === subItem.value
                                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }
                          `}
                        >
                          {subItem.icon}
                          <span>{subItem.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
  // Version Mobile
  const MobileNav = () => (
    <nav className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 h-14 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {navigationItems.find(item => {
            if (item.value === activeTab) return true;
            return item.items?.some(sub => sub.value === activeTab);
          })?.label || t.overview}
        </h2>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          )}
        </button>
      </div>
      {/* Menu Mobile (Drawer) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-800 shadow-xl">
            <div className="p-4 space-y-1">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Navigation
                </h3>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Fermer le menu"
                >
                  <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
              {/* Menu Items */}
              {navigationItems.map((item) => {
                if (item.type === 'link') {
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.value!)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg
                        text-sm font-medium transition-colors text-left
                        ${
                          isActive(item.value)
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      {item.icon}
                      <span className="flex-1">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                }
                // Dropdown Section
                return (
                  <div key={item.id} className="space-y-1">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {item.label}
                    </div>
                    {item.items?.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => handleItemClick(subItem.value)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
                          text-sm transition-colors text-left ml-2
                          ${
                            activeTab === subItem.value
                              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }
                        `}
                      >
                        {subItem.icon}
                        <span>{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
  return (
    <>
      <DesktopNav />
      <MobileNav />
    </>
  );
}