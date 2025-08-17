import { useContext } from 'react';
import { EnterpriseContext } from '@/contexts/EnterpriseContextBase';

export const useEnterprise = () => {
  const ctx = useContext(EnterpriseContext);
  if (!ctx) throw new Error('useEnterprise must be used within an EnterpriseProvider');
  return ctx;
};
