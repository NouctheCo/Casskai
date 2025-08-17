import { createContext } from 'react';
import { Enterprise, EnterpriseTaxConfiguration } from '../types/enterprise.types';

export interface EnterpriseContextType {
  enterprises: Enterprise[];
  currentEnterprise: Enterprise | null;
  currentEnterpriseId: string | null;
  setCurrentEnterpriseId: (id: string) => void;
  addEnterprise: (enterprise: Omit<Enterprise, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEnterprise: (id: string, data: Partial<Enterprise>) => Promise<void>;
  deleteEnterprise: (id: string) => Promise<void>;
  getEnterpriseTaxConfig: (enterpriseId: string) => EnterpriseTaxConfiguration | null;
  switchEnterprise: (enterpriseId: string) => void;
  synchronizeAfterOnboarding: () => void;
  loading: boolean;
}

export const EnterpriseContext = createContext<EnterpriseContextType | undefined>(undefined);
