import React from 'react';
import CrmDashboard from '@/components/crm/CrmDashboard';
import type { CrmDashboardData } from '@/types/crm.types';

const CRMDashboard: React.FC = () => {
  const fallbackData: CrmDashboardData = {
    stats: {
      total_clients: 0,
      active_clients: 0,
      prospects: 0,
      total_opportunities: 0,
      opportunities_value: 0,
      won_opportunities: 0,
      won_value: 0,
      conversion_rate: 0,
      pending_actions: 0,
      overdue_actions: 0,
      monthly_revenue: 0,
      revenue_growth: 0,
    },
    pipeline_stats: [],
    revenue_data: [],
    recent_opportunities: [],
    recent_actions: [],
    top_clients: [],
  };

  return <CrmDashboard dashboardData={fallbackData} loading={false} />;
};

export default CRMDashboard;
