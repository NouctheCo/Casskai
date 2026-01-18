import React from 'react';
import { Outlet } from 'react-router-dom';
import AnalyticsProvider from '@/components/analytics/AnalyticsProvider';
import { PageTransition } from '@/components/ui/PageTransition';
import { WhatsAppFloatingButton } from '@/components/chat/WhatsAppChat';

export const PublicLayout: React.FC = () => {
  return (
    <AnalyticsProvider domain="casskai.app" showConsentBanner={true}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <PageTransition>
          <Outlet />
        </PageTransition>
        {/* Bouton WhatsApp flottant - rendu au niveau du layout pour rester visible sur toutes les pages publiques */}
        <WhatsAppFloatingButton />
      </div>
    </AnalyticsProvider>
  );
};

export default PublicLayout;
