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

import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Route-to-breadcrumb mapping
const ROUTE_LABELS: Record<string, string> = {
  '/': 'common.dashboard',
  '/accounting': 'common.accounting',
  '/invoicing': 'common.invoicing',
  '/banks': 'common.banking',
  '/crm': 'common.salesCrm',
  '/hr': 'common.humanResources',
  '/inventory': 'common.inventory',
  '/projects': 'common.projects',
  '/contracts': 'sidebar.contracts',
  '/purchases': 'common.purchases',
  '/third-parties': 'common.thirdParties',
  '/tax': 'tax.title',
  '/reports': 'sidebar.reports',
  '/settings': 'common.settings',
  '/automation': 'sidebar.automation',
};

export function Breadcrumb() {
  const location = useLocation();
  const { t } = useTranslation();

  // Don't show on dashboard (home page)
  if (location.pathname === '/' || location.pathname === '/dashboard') return null;

  const pathSegments = location.pathname.split('/').filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground px-4 sm:px-6 lg:px-8 pt-3 pb-0">
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        aria-label={t('common.dashboard')}
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {pathSegments.map((segment, index) => {
        const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const isLast = index === pathSegments.length - 1;
        const label = ROUTE_LABELS[path] || segment;

        return (
          <span key={path} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            {isLast ? (
              <span className="font-medium text-foreground" aria-current="page">
                {t(label, { defaultValue: segment })}
              </span>
            ) : (
              <Link to={path} className="hover:text-foreground transition-colors">
                {t(label, { defaultValue: segment })}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
