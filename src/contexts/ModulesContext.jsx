import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const ModulesContext = createContext();

export const useModules = () => useContext(ModulesContext);

// Define all available modules in the system
export const ALL_MODULES = [
  { key: 'dashboard', nameKey: 'common.dashboard', path: '/', icon: 'Home', defaultEnabled: true, category: 'core', descriptionKey: 'dashboardDescription' },
  { key: 'accounting', nameKey: 'accountingPageTitle', path: '/accounting', icon: 'Briefcase', defaultEnabled: true, category: 'finance', descriptionKey: 'accountingDescription' },
  { key: 'banking', nameKey: 'bankConnections', path: '/banking', icon: 'Landmark', defaultEnabled: true, category: 'finance', descriptionKey: 'bankingDescription' },
  { key: 'invoicing', nameKey: 'invoicing', path: '/invoicing', icon: 'InvoicingIcon', defaultEnabled: true, category: 'finance', descriptionKey: 'invoicingDescription' },
  { key: 'purchases', nameKey: 'purchases', path: '/purchases', icon: 'ShoppingCart', defaultEnabled: true, category: 'operations', descriptionKey: 'purchasesDescription' },
  { key: 'sales_crm', nameKey: 'salesCrm', path: '/sales-crm', icon: 'Users', defaultEnabled: true, category: 'sales', descriptionKey: 'salesCrmDescription' },
  { key: 'human_resources', nameKey: 'humanResources', path: '/human-resources', icon: 'UsersRound', defaultEnabled: true, category: 'management', descriptionKey: 'humanResourcesDescription' },
  { key: 'projects', nameKey: 'projects', path: '/projects', icon: 'KanbanSquare', defaultEnabled: true, category: 'management', descriptionKey: 'projectsDescription' },
  { key: 'inventory', nameKey: 'inventory', path: '/inventory', icon: 'Archive', defaultEnabled: true, category: 'operations', descriptionKey: 'inventoryDescription' },
  { key: 'reports', nameKey: 'financialReports', path: '/reports', icon: 'BarChart3', defaultEnabled: true, category: 'analytics', descriptionKey: 'reportsDescription' },
  { key: 'forecasts_module', nameKey: 'financialForecasts', path: '/forecasts', icon: 'Zap', defaultEnabled: true, category: 'planning', descriptionKey: 'forecastsDescription' },
  { key: 'third_parties_module', nameKey: 'thirdParties.title', path: '/third-parties', icon: 'Users2', defaultEnabled: true, category: 'core', descriptionKey: 'thirdPartiesDescription' },
  { key: 'tax_module', nameKey: 'tax', path: '/tax', icon: 'FileText', defaultEnabled: true, category: 'finance', descriptionKey: 'taxDescription' },
  { key: 'settings', nameKey: 'settings', path: '/settings', icon: 'Settings', defaultEnabled: true, category: 'core', descriptionKey: 'settingsDescription', isGlobal: true },
];

export const ModulesProvider = ({ children }) => {
  const { user, currentEnterpriseId } = useAuth();
  const [enabledModules, setEnabledModules] = useState({});
  const [loadingModules, setLoadingModules] = useState(true);

  const fetchEnabledModules = useCallback(async () => {
    if (!user) {
      setEnabledModules({});
      setLoadingModules(false);
      console.log("ModulesContext: No user, clearing modules.");
      return;
    }

    if (!currentEnterpriseId) {
      console.log("ModulesContext: No currentEnterpriseId. Using default/global modules.");
      const defaultEnabled = {};
      ALL_MODULES.forEach(mod => {
        if (mod.defaultEnabled || mod.isGlobal) {
          defaultEnabled[mod.key] = true;
        }
      });
      setEnabledModules(defaultEnabled);
      setLoadingModules(false);
      return;
    }

    setLoadingModules(true);
    console.log(`ModulesContext: Fetching modules for enterprise ${currentEnterpriseId}`);
    
    try {
      // Check if Supabase client is properly configured
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('company_modules')
        .select('module_key, is_enabled')
        .eq('company_id', currentEnterpriseId);

      if (error) {
        console.error('ModulesContext: Error fetching company modules:', error.message);
        // Fall back to default modules on error
        const defaultEnabled = {};
        ALL_MODULES.forEach(mod => {
            if (mod.defaultEnabled) defaultEnabled[mod.key] = true;
        });
        setEnabledModules(defaultEnabled);
        return;
      }
      
      console.log("ModulesContext: Fetched company_modules data:", data);

      const modulesMap = {};
      ALL_MODULES.forEach(mod => {
        if (mod.defaultEnabled || mod.isGlobal) {
          modulesMap[mod.key] = true;
        } else {
          modulesMap[mod.key] = false;
        }
      });

      if (data && Array.isArray(data)) {
        data.forEach(dbModule => {
          modulesMap[dbModule.module_key] = dbModule.is_enabled;
        });
      }
      
      setEnabledModules(modulesMap);
      console.log("ModulesContext: Enabled modules map:", modulesMap);

    } catch (err) {
      console.error('ModulesContext: Unexpected error fetching modules:', err.message);
      // Fall back to default modules on any error
      const defaultEnabled = {};
      ALL_MODULES.forEach(mod => {
        if (mod.defaultEnabled) defaultEnabled[mod.key] = true;
      });
      setEnabledModules(defaultEnabled);
    } finally {
      setLoadingModules(false);
    }
  }, [user, currentEnterpriseId]);

  useEffect(() => {
    fetchEnabledModules();
  }, [fetchEnabledModules]);

  const isModuleActive = useCallback((moduleKey) => {
    if (loadingModules) {
      console.log(`ModulesContext: isModuleActive(${moduleKey}) called while loading. Returning false.`);
      return false; 
    }
    const moduleConfig = ALL_MODULES.find(m => m.key === moduleKey);
    if (moduleConfig?.isGlobal) {
       console.log(`ModulesContext: isModuleActive(${moduleKey}) is global. Returning true.`);
      return true;
    }
    const isActive = !!enabledModules[moduleKey];
    console.log(`ModulesContext: isModuleActive(${moduleKey}) -> ${isActive}. Enabled modules:`, enabledModules);
    return isActive;
  }, [enabledModules, loadingModules]);
  
  const updateModuleState = async (moduleKey, isEnabled) => {
    if (!currentEnterpriseId) {
      console.warn("ModulesContext: Cannot update module state without an active enterprise.");
      return false;
    }
    
    console.log(`ModulesContext: Updating module ${moduleKey} to ${isEnabled} for enterprise ${currentEnterpriseId}`);
    try {
      // Check if Supabase client is properly configured
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Use RPC call instead of direct upsert to avoid SET in non-volatile function error
      const { data, error } = await supabase.rpc('update_company_module', {
        p_company_id: currentEnterpriseId,
        p_module_key: moduleKey,
        p_is_enabled: isEnabled
      });

      if (error) {
        console.error('ModulesContext: Error updating module state:', error.message);
        return false;
      }
      
      setEnabledModules(prev => ({ ...prev, [moduleKey]: isEnabled }));
      console.log(`ModulesContext: Module ${moduleKey} state updated successfully.`);
      return true;
    } catch (err) {
      console.error('ModulesContext: Unexpected error updating module state:', err.message);
      return false;
    }
  };

  return (
    <ModulesContext.Provider value={{ 
      ALL_MODULES, 
      enabledModules, 
      loadingModules, 
      isModuleActive, 
      fetchEnabledModules, 
      updateModuleState 
    }}>
      {children}
    </ModulesContext.Provider>
  );
};