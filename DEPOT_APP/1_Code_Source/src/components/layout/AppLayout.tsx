import React from 'react';
import AuthGuard from '@/components/guards/AuthGuard';
import { MainLayout } from '@/components/layout/MainLayout';

export const AppLayout: React.FC = () => {
  return (
    <AuthGuard>
      <MainLayout />
    </AuthGuard>
  );
};

export default AppLayout;
