import { useUserAccessData } from './useUserAccessData';
import { useUserAccessActions } from './useUserAccessActions';

export const useUserAccess = (userId) => {
  const accessData = useUserAccessData();
  const actions = useUserAccessActions(accessData, accessData.setters);

  return {
    ...accessData,
    ...actions,
    // Expose setters directly if needed by AuthContext or other parts
    setCurrentEnterpriseId: accessData.setters?.setCurrentEnterpriseId,
    setCurrentEnterpriseName: accessData.setters?.setCurrentEnterpriseName,
    setCurrentGroupId: accessData.setters?.setCurrentGroupId,
    setCurrentGroupName: accessData.setters?.setCurrentGroupName,
  };
};