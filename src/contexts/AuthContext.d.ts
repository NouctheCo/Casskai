// Declaration file for AuthContext.jsx
declare module '../contexts/AuthContext' {
  export const AuthProvider: React.FC<{ children: React.ReactNode }>;
  export function useAuth(): {
    user: any;
    loading: boolean;
    currentEnterpriseId: string | null;
    currentEnterpriseName: string | null;
    userCompanies: any[];
    login: (email: string, password: string) => Promise<any>;
    logout: () => Promise<void>;
    register: (email: string, password: string) => Promise<any>;
    resetPassword: (email: string) => Promise<any>;
    updatePassword: (password: string) => Promise<any>;
    setActiveEnterprise: (companyId: string) => void;
  };
}
