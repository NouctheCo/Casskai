import { useCallback } from 'react';

export const useUserAccessActions = (accessData, setters) => {
  const { userCompanies, userGroups, loadingAccess, currentUserPermissions, currentCompanySubscription } = accessData || {};
  const { 
    setCurrentEnterpriseId, 
    setCurrentEnterpriseName, 
    setCurrentGroupId, 
    setCurrentGroupName,
    setCurrentUserRole, 
    setCurrentUserPermissions, 
    setCurrentCompanySubscription: setContextCompanySubscription 
  } = setters || {};

  const hasPermission = useCallback((permissionName) => {
    if (loadingAccess || !currentUserPermissions) return false;
    return currentUserPermissions.includes(permissionName);
  }, [currentUserPermissions, loadingAccess]);

  const switchEnterprise = useCallback((companyId) => {
    if (!setters) {
      console.error("useUserAccessActions: setters object is undefined");
      return;
    }
    
    const company = userCompanies?.find(c => c.id === companyId);
    if (company) {
      setCurrentEnterpriseId(company.id);
      setCurrentEnterpriseName(company.name);
      setCurrentUserRole(company.role);
      setCurrentUserPermissions(company.permissions);
      setContextCompanySubscription(company.subscription);
      if (company.group_id) {
        setCurrentGroupId(company.group_id);
        setCurrentGroupName(`Groupe ID: ${company.group_id.substring(0,8)}`);
      } else {
        setCurrentGroupId(null);
        setCurrentGroupName(null);
      }
    } else {
      console.warn("useUserAccessActions: switchEnterprise called with invalid companyId:", companyId);
    }
  }, [userCompanies, setters, setCurrentEnterpriseId, setCurrentEnterpriseName, setCurrentUserRole, setCurrentUserPermissions, setCurrentGroupId, setCurrentGroupName, setContextCompanySubscription]);

  const switchGroup = useCallback((groupId) => {
    if (!setters) {
      console.error("useUserAccessActions: setters object is undefined");
      return;
    }
    
    const group = userGroups?.find(g => g.id === groupId);
    if (group) {
      setCurrentGroupId(group.id);
      setCurrentGroupName(group.name);
    } else {
      setCurrentGroupId(groupId);
      setCurrentGroupName(`Groupe ID: ${groupId ? groupId.substring(0,8): 'N/A'}`);
    }
    setCurrentEnterpriseId(null);
    setCurrentEnterpriseName('Vue Groupe');
    setCurrentUserRole(null);
    setCurrentUserPermissions([]);
    setContextCompanySubscription(null);
  }, [userGroups, setters, setCurrentGroupId, setCurrentGroupName, setCurrentEnterpriseId, setCurrentEnterpriseName, setCurrentUserRole, setCurrentUserPermissions, setContextCompanySubscription]);

  const getCurrentCompanySubscriptionInfo = useCallback(() => {
    if (loadingAccess) return null;
    return currentCompanySubscription;
  }, [currentCompanySubscription, loadingAccess]);

  return {
    hasPermission,
    switchEnterprise,
    switchGroup,
    getCurrentCompanySubscriptionInfo
  };
};