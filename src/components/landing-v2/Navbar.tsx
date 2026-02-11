/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Navbar de la landing page V2
 */

import { useState, useEffect, type ForwardRefExoticComponent, type RefAttributes, type SVGAttributes } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Globe,
  Users,
  BarChart3,
  FileSpreadsheet,
  Wallet,
  Brain,
  BookOpen,
  HelpCircle,
  FileText
} from 'lucide-react';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { useLocale } from '@/contexts/LocaleContext';

interface NavItem {
  icon: ForwardRefExoticComponent<Omit<SVGAttributes<SVGSVGElement>, 'ref'> & RefAttributes<SVGSVGElement>>;
  label: string;
  description: string;
  href: string;
  isExternal?: boolean;
}

interface NavLink {
  label: string;
  href: string;
  hasDropdown?: boolean;
  isExternal?: boolean;
  items?: NavItem[];
}

export function Navbar() {
  const { t } = useLocale();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const navLinks: NavLink[] = [
    {
      label: t('landing.navbar.product'),
      href: '#features',
      hasDropdown: true,
      items: [
        { icon: Brain, label: t('landing.navbar.features.ai'), description: t('landing.navbar.features.aiDesc'), href: '#features' },
        { icon: Wallet, label: t('landing.navbar.features.treasury'), description: t('landing.navbar.features.treasuryDesc'), href: '#features' },
        { icon: FileSpreadsheet, label: t('landing.navbar.features.compliance'), description: t('landing.navbar.features.complianceDesc'), href: '#features' },
        { icon: Users, label: t('landing.navbar.features.hr'), description: t('landing.navbar.features.hrDesc'), href: '#features' },
        { icon: BarChart3, label: t('landing.navbar.features.dashboards'), description: t('landing.navbar.features.dashboardsDesc'), href: '#features' },
        { icon: Globe, label: t('landing.navbar.features.multiCountry'), description: t('landing.navbar.features.multiCountryDesc'), href: '#coverage' }
      ]
    },
    { label: t('landing.navbar.pricing'), href: '#plans' },
    {
      label: t('landing.navbar.resources'),
      href: '/docs',
      hasDropdown: true,
      isExternal: true,
      items: [
        { icon: BookOpen, label: t('landing.navbar.resourcesMenu.documentation'), description: t('landing.navbar.resourcesMenu.documentationDesc'), href: '/docs', isExternal: true },
        { icon: HelpCircle, label: t('landing.navbar.resourcesMenu.faq'), description: t('landing.navbar.resourcesMenu.faqDesc'), href: '/faq', isExternal: true },
        { icon: FileText, label: t('landing.navbar.resourcesMenu.blog'), description: t('landing.navbar.resourcesMenu.blogDesc'), href: '/docs', isExternal: true }
      ]
    },
    { label: t('landing.navbar.roadmap'), href: '/roadmap', isExternal: true }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-gray-900/95 backdrop-blur-lg border-b border-gray-800 shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="CassKai"
                className="h-8 md:h-10 w-auto mix-blend-screen"
                style={{ background: 'transparent' }}
              />
              <span className="text-xl font-bold text-white">CassKai</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => link.hasDropdown && setActiveDropdown(link.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {link.isExternal ? (
                    <Link
                      to={link.href}
                      className="px-4 py-2 text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-sm font-medium"
                    >
                      {link.label}
                      {link.hasDropdown && (
                        <ChevronDown className={`w-4 h-4 transition-transform ${
                          activeDropdown === link.label ? 'rotate-180' : ''
                        }`} />
                      )}
                    </Link>
                  ) : (
                    <button
                      onClick={() => scrollToSection(link.href)}
                      className="px-4 py-2 text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-sm font-medium"
                    >
                      {link.label}
                      {link.hasDropdown && (
                        <ChevronDown className={`w-4 h-4 transition-transform ${
                          activeDropdown === link.label ? 'rotate-180' : ''
                        }`} />
                      )}
                    </button>
                  )}

                  {/* Dropdown */}
                  {link.hasDropdown && (
                    <AnimatePresence>
                      {activeDropdown === link.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 pt-2"
                        >
                          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-4 min-w-[320px]">
                            <div className="grid grid-cols-2 gap-2">
                              {link.items?.map((item) => (
                                item.isExternal ? (
                                  <Link
                                    key={item.label}
                                    to={item.href}
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors group"
                                  >
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-colors">
                                      <item.icon className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                      <p className="text-white font-medium text-sm">{item.label}</p>
                                      <p className="text-gray-500 text-xs">{item.description}</p>
                                    </div>
                                  </Link>
                                ) : (
                                  <button
                                    key={item.label}
                                    onClick={() => {
                                      scrollToSection(item.href);
                                      setActiveDropdown(null);
                                    }}
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors group text-left"
                                  >
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-colors">
                                      <item.icon className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                      <p className="text-white font-medium text-sm">{item.label}</p>
                                      <p className="text-gray-500 text-xs">{item.description}</p>
                                    </div>
                                  </button>
                                )
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageSelector variant="dropdown" compact showFlag className="text-sm border-gray-600 bg-gray-800/50 text-white hover:bg-gray-700 hover:text-white [&>button]:border-gray-600 [&>button]:bg-gray-800/50 [&>button]:text-white [&>button:hover]:bg-gray-700" />
              <Link
                to="/auth"
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                {t('landing.navbar.login')}
              </Link>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/auth"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {t('landing.navbar.freeTrial')}
                </Link>
              </motion.div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Menu de navigation"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-gray-900 md:hidden pt-20"
          >
            <div className="container mx-auto px-6 py-8">
              <div className="space-y-4">
                {navLinks.map((link) => (
                  <div key={link.label}>
                    {link.isExternal ? (
                      <Link
                        to={link.href}
                        className="block py-3 text-xl text-white font-medium"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          scrollToSection(link.href);
                          setIsMobileMenuOpen(false);
                        }}
                        className="block py-3 text-xl text-white font-medium"
                      >
                        {link.label}
                      </button>
                    )}
                    {link.items && (
                      <div className="pl-4 space-y-2 mt-2">
                        {link.items.map((item) => (
                          item.isExternal ? (
                            <Link
                              key={item.label}
                              to={item.href}
                              className="flex items-center gap-3 py-2 text-gray-400"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <item.icon className="w-5 h-5" />
                              {item.label}
                            </Link>
                          ) : (
                            <button
                              key={item.label}
                              onClick={() => {
                                scrollToSection(item.href);
                                setIsMobileMenuOpen(false);
                              }}
                              className="flex items-center gap-3 py-2 text-gray-400"
                            >
                              <item.icon className="w-5 h-5" />
                              {item.label}
                            </button>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-800 space-y-4">
                <div className="mb-4">
                  <LanguageSelector variant="button" showFlag className="w-full justify-center" />
                </div>
                <Link
                  to="/auth"
                  className="block w-full py-3 text-center text-gray-300 border border-gray-700 rounded-lg font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('landing.navbar.login')}
                </Link>
                <Link
                  to="/auth"
                  className="block w-full py-3 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-semibold"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('landing.navbar.freeTrial')}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
