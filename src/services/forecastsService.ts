import {
  ForecastData,
  ForecastScenario,
  ForecastPeriod,
  ForecastFormData,
  ScenarioFormData,
  ForecastFilters,
  ForecastServiceResponse,
  ForecastDashboardData,
  WhatIfAnalysis,
  RevenueLineItem,
  ExpenseLineItem,
  CashFlowItem
} from '../types/forecasts.types';

// Mock data
const mockScenarios: ForecastScenario[] = [
  {
    id: '1',
    name: 'Scénario Optimiste',
    description: 'Croissance forte avec conditions de marché favorables',
    type: 'optimistic',
    growth_rate: 15,
    market_conditions: 'favorable',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:00:00Z'
  },
  {
    id: '2',
    name: 'Scénario Réaliste',
    description: 'Croissance modérée dans des conditions stables',
    type: 'realistic',
    growth_rate: 8,
    market_conditions: 'stable',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:00:00Z'
  },
  {
    id: '3',
    name: 'Scénario Pessimiste',
    description: 'Croissance faible avec défis du marché',
    type: 'pessimistic',
    growth_rate: 3,
    market_conditions: 'unfavorable',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:00:00Z'
  }
];

const mockPeriods: ForecastPeriod[] = [
  {
    id: '1',
    name: '2024 Q1-Q4',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    period_type: 'yearly',
    enterprise_id: 'company-1',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: '2024 T1',
    start_date: '2024-01-01',
    end_date: '2024-03-31',
    period_type: 'quarterly',
    enterprise_id: 'company-1',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: '2024 T2',
    start_date: '2024-04-01',
    end_date: '2024-06-30',
    period_type: 'quarterly',
    enterprise_id: 'company-1',
    created_at: '2024-01-01T00:00:00Z'
  }
];

const mockRevenueItems: RevenueLineItem[] = [
  {
    id: '1',
    category: 'Ventes Produits',
    subcategory: 'Produit A',
    description: 'Ventes du produit principal',
    amount: 450000,
    growth_rate: 12,
    seasonality_factor: 1.1,
    confidence_level: 'high'
  },
  {
    id: '2',
    category: 'Services',
    subcategory: 'Consulting',
    description: 'Services de conseil',
    amount: 180000,
    growth_rate: 8,
    seasonality_factor: 1.0,
    confidence_level: 'medium'
  },
  {
    id: '3',
    category: 'Licences',
    description: 'Revenus de licences logicielles',
    amount: 75000,
    growth_rate: 20,
    seasonality_factor: 0.9,
    confidence_level: 'medium'
  }
];

const mockExpenseItems: ExpenseLineItem[] = [
  {
    id: '1',
    category: 'fixed',
    subcategory: 'Salaires',
    description: 'Charges salariales',
    amount: 280000,
    growth_rate: 5,
    is_recurring: true,
    confidence_level: 'high'
  },
  {
    id: '2',
    category: 'variable',
    subcategory: 'Marketing',
    description: 'Dépenses marketing et publicité',
    amount: 95000,
    growth_rate: 15,
    is_recurring: false,
    confidence_level: 'medium'
  },
  {
    id: '3',
    category: 'operational',
    subcategory: 'Loyer',
    description: 'Loyer bureaux',
    amount: 48000,
    growth_rate: 3,
    is_recurring: true,
    confidence_level: 'high'
  }
];

const mockCashFlowItems: CashFlowItem[] = [
  {
    id: '1',
    type: 'inflow',
    category: 'Ventes',
    description: 'Encaissements clients',
    amount: 600000,
    timing: '2024-03-15',
    probability: 85
  },
  {
    id: '2',
    type: 'outflow',
    category: 'Fournisseurs',
    description: 'Paiements fournisseurs',
    amount: 320000,
    timing: '2024-03-30',
    probability: 95
  },
  {
    id: '3',
    type: 'outflow',
    category: 'Salaires',
    description: 'Paiement salaires',
    amount: 70000,
    timing: '2024-03-01',
    probability: 100
  }
];

const mockForecasts: ForecastData[] = [
  {
    id: '1',
    name: 'Prévisions 2024 - Réaliste',
    period_id: '1',
    scenario_id: '2',
    enterprise_id: 'company-1',
    revenue_items: mockRevenueItems,
    total_revenue: 705000,
    expense_items: mockExpenseItems,
    total_expenses: 423000,
    cash_flow_items: mockCashFlowItems,
    net_cash_flow: 280000,
    gross_margin: 65.2,
    net_margin: 40.0,
    break_even_point: 529000,
    status: 'approved',
    created_by: 'user-1',
    approved_by: 'manager-1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:00:00Z',
    key_assumptions: [
      'Croissance du marché de 8% en 2024',
      'Maintien des prix actuels',
      'Recrutement de 2 commerciaux supplémentaires'
    ],
    risk_factors: [
      'Concurrence accrue sur le segment principal',
      'Volatilité des coûts matières premières',
      'Incertitudes réglementaires'
    ],
    opportunities: [
      'Expansion sur nouveaux marchés',
      'Lancement produit innovant Q3',
      'Partenariats stratégiques'
    ]
  },
  {
    id: '2',
    name: 'Prévisions Q1 2024',
    period_id: '2',
    scenario_id: '2',
    enterprise_id: 'company-1',
    revenue_items: mockRevenueItems.map(item => ({...item, amount: item.amount * 0.25})),
    total_revenue: 176250,
    expense_items: mockExpenseItems.map(item => ({...item, amount: item.amount * 0.25})),
    total_expenses: 105750,
    cash_flow_items: mockCashFlowItems.map(item => ({...item, amount: item.amount * 0.25})),
    net_cash_flow: 70500,
    gross_margin: 65.2,
    net_margin: 40.0,
    break_even_point: 132250,
    status: 'published',
    created_by: 'user-1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:00:00Z',
    key_assumptions: [
      'Saisonnalité habituelle Q1',
      'Campagne marketing lancée en février'
    ],
    risk_factors: [
      'Retards de livraison possibles'
    ],
    opportunities: [
      'Nouveau contrat en négociation'
    ]
  }
];

class ForecastsService {
  // Scenarios
  async getScenarios(): Promise<ForecastServiceResponse<ForecastScenario[]>> {
    try {
      return { data: mockScenarios };
  } catch {
      return {
        data: [],
        error: { message: 'Erreur lors de la récupération des scénarios' }
      };
    }
  }

  async createScenario(formData: ScenarioFormData): Promise<ForecastServiceResponse<ForecastScenario>> {
    try {
      const newScenario: ForecastScenario = {
        id: Date.now().toString(),
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockScenarios.push(newScenario);
      return { data: newScenario };
  } catch {
      return {
        data: {} as ForecastScenario,
        error: { message: 'Erreur lors de la création du scénario' }
      };
    }
  }

  // Periods
  async getPeriods(enterpriseId: string): Promise<ForecastServiceResponse<ForecastPeriod[]>> {
    try {
      const filteredPeriods = mockPeriods.filter(period => period.enterprise_id === enterpriseId);
      return { data: filteredPeriods };
  } catch {
      return {
        data: [],
        error: { message: 'Erreur lors de la récupération des périodes' }
      };
    }
  }

  // Forecasts
  async getForecasts(enterpriseId: string, filters?: ForecastFilters): Promise<ForecastServiceResponse<ForecastData[]>> {
    try {
      let filteredForecasts = mockForecasts.filter(forecast => forecast.enterprise_id === enterpriseId);
      
      if (filters) {
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredForecasts = filteredForecasts.filter(forecast =>
            forecast.name.toLowerCase().includes(searchLower)
          );
        }
        
        if (filters.scenario_id) {
          filteredForecasts = filteredForecasts.filter(forecast => forecast.scenario_id === filters.scenario_id);
        }
        
        if (filters.status) {
          filteredForecasts = filteredForecasts.filter(forecast => forecast.status === filters.status);
        }
        
        if (filters.period_id) {
          filteredForecasts = filteredForecasts.filter(forecast => forecast.period_id === filters.period_id);
        }
      }
      
      return { data: filteredForecasts };
  } catch {
      return {
        data: [],
        error: { message: 'Erreur lors de la récupération des prévisions' }
      };
    }
  }

  async createForecast(enterpriseId: string, formData: ForecastFormData): Promise<ForecastServiceResponse<ForecastData>> {
    try {
      // Calculate totals
      const totalRevenue = formData.revenue_items.reduce((sum, item) => sum + item.amount, 0);
      const totalExpenses = formData.expense_items.reduce((sum, item) => sum + item.amount, 0);
      const netCashFlow = formData.cash_flow_items.reduce((sum, item) => 
        sum + (item.type === 'inflow' ? item.amount : -item.amount), 0
      );
      
      const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
      const netMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
      const breakEvenPoint = totalExpenses;
      
      const newForecast: ForecastData = {
        id: Date.now().toString(),
        name: formData.name,
        period_id: formData.period_id,
        scenario_id: formData.scenario_id,
        enterprise_id: enterpriseId,
        revenue_items: formData.revenue_items.map((item, index) => ({
          ...item,
          id: `revenue_${index + 1}`
        })),
        total_revenue: totalRevenue,
        expense_items: formData.expense_items.map((item, index) => ({
          ...item,
          id: `expense_${index + 1}`
        })),
        total_expenses: totalExpenses,
        cash_flow_items: formData.cash_flow_items.map((item, index) => ({
          ...item,
          id: `cashflow_${index + 1}`
        })),
        net_cash_flow: netCashFlow,
        gross_margin: grossMargin,
        net_margin: netMargin,
        break_even_point: breakEvenPoint,
        status: 'draft',
        created_by: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        key_assumptions: formData.key_assumptions,
        risk_factors: formData.risk_factors,
        opportunities: formData.opportunities
      };
      
      mockForecasts.push(newForecast);
      return { data: newForecast };
  } catch {
      return {
        data: {} as ForecastData,
        error: { message: 'Erreur lors de la création de la prévision' }
      };
    }
  }

  async updateForecast(forecastId: string, formData: Partial<ForecastFormData>): Promise<ForecastServiceResponse<ForecastData>> {
    try {
      const forecastIndex = mockForecasts.findIndex(forecast => forecast.id === forecastId);
      if (forecastIndex === -1) {
        return {
          data: {} as ForecastData,
          error: { message: 'Prévision non trouvée' }
        };
      }
      
      const existingForecast = mockForecasts[forecastIndex];
      
      // Recalculate totals if items are updated
      let totalRevenue = existingForecast.total_revenue;
      let totalExpenses = existingForecast.total_expenses;
      let netCashFlow = existingForecast.net_cash_flow;
      
      if (formData.revenue_items) {
        totalRevenue = formData.revenue_items.reduce((sum, item) => sum + item.amount, 0);
      }
      
      if (formData.expense_items) {
        totalExpenses = formData.expense_items.reduce((sum, item) => sum + item.amount, 0);
      }
      
      if (formData.cash_flow_items) {
        netCashFlow = formData.cash_flow_items.reduce((sum, item) => 
          sum + (item.type === 'inflow' ? item.amount : -item.amount), 0
        );
      }
      
      const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
      const netMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
      
      mockForecasts[forecastIndex] = {
        ...existingForecast,
        ...formData,
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_cash_flow: netCashFlow,
        gross_margin: grossMargin,
        net_margin: netMargin,
        break_even_point: totalExpenses,
        updated_at: new Date().toISOString()
      };
      
      return { data: mockForecasts[forecastIndex] };
  } catch {
      return {
        data: {} as ForecastData,
        error: { message: 'Erreur lors de la mise à jour de la prévision' }
      };
    }
  }

  async deleteForecast(forecastId: string): Promise<ForecastServiceResponse<boolean>> {
    try {
      const forecastIndex = mockForecasts.findIndex(forecast => forecast.id === forecastId);
      if (forecastIndex === -1) {
        return {
          data: false,
          error: { message: 'Prévision non trouvée' }
        };
      }
      
      mockForecasts.splice(forecastIndex, 1);
      return { data: true };
  } catch {
      return {
        data: false,
        error: { message: 'Erreur lors de la suppression de la prévision' }
      };
    }
  }

  // Dashboard
  async getDashboardData(enterpriseId: string): Promise<ForecastServiceResponse<ForecastDashboardData>> {
    try {
      const enterpriseForecasts = mockForecasts.filter(f => f.enterprise_id === enterpriseId);
      
      const summary = {
        total_forecasts: enterpriseForecasts.length,
        active_scenarios: mockScenarios.length,
        avg_accuracy: 87.5, // Mock accuracy
        next_review_date: '2024-02-15'
      };
      
      const scenarioPerformance = mockScenarios.map(scenario => ({
        scenario_name: scenario.name,
        accuracy: 85 + Math.random() * 10, // Mock accuracy between 85-95%
        last_updated: scenario.updated_at
      }));
      
      const upcomingReviews = [
        {
          forecast_name: 'Prévisions Q2 2024',
          review_date: '2024-02-10',
          status: 'pending'
        },
        {
          forecast_name: 'Budget annuel 2024',
          review_date: '2024-02-15',
          status: 'scheduled'
        }
      ];
      
      const keyMetrics = {
        revenue_trend: 8.5,
        expense_trend: 5.2,
        cash_flow_trend: 12.3,
        profitability_trend: 3.8
      };
      
      const dashboardData: ForecastDashboardData = {
        summary,
        recent_forecasts: enterpriseForecasts.slice(0, 5),
        scenario_performance: scenarioPerformance,
        upcoming_reviews: upcomingReviews,
        key_metrics: keyMetrics
      };
      
      return { data: dashboardData };
  } catch {
      return {
        data: {} as ForecastDashboardData,
        error: { message: 'Erreur lors de la récupération des données du tableau de bord' }
      };
    }
  }

  // What-if Analysis
  async performWhatIfAnalysis(forecastId: string, variables: {name: string, test_values: number[]}[]): Promise<ForecastServiceResponse<WhatIfAnalysis>> {
    try {
      const forecast = mockForecasts.find(f => f.id === forecastId);
      if (!forecast) {
        return {
          data: {} as WhatIfAnalysis,
          error: { message: 'Prévision non trouvée' }
        };
      }
      
      const baseScenario = mockScenarios.find(s => s.id === forecast.scenario_id)?.name || 'Base';
      
      const results = variables.flatMap(variable => 
        variable.test_values.map(value => {
          // Mock impact calculation
          const impact_multiplier = value / 100;
          return {
            variable_combination: { [variable.name]: value },
            impact_on_revenue: forecast.total_revenue * impact_multiplier * 0.1,
            impact_on_expenses: forecast.total_expenses * impact_multiplier * 0.05,
            impact_on_cash_flow: forecast.net_cash_flow * impact_multiplier * 0.15,
            impact_on_profitability: (forecast.total_revenue - forecast.total_expenses) * impact_multiplier * 0.12
          };
        })
      );
      
      const analysis: WhatIfAnalysis = {
        base_scenario: baseScenario,
        variables: variables.map(v => ({
          name: v.name,
          current_value: 100, // Mock current value
          test_values: v.test_values
        })),
        results
      };
      
      return { data: analysis };
  } catch {
      return {
        data: {} as WhatIfAnalysis,
        error: { message: 'Erreur lors de l\'analyse what-if' }
      };
    }
  }

  // Export functions
  exportForecastsToCSV(forecasts: ForecastData[], filename: string = 'previsions') {
    const headers = [
      'Nom',
      'Période',
      'Scénario',
      'Revenus totaux',
      'Dépenses totales',
      'Marge brute',
      'Flux de trésorerie net',
      'Statut',
      'Date de création'
    ];
    
    const csvContent = [
      headers.join(','),
      ...forecasts.map(forecast => [
        `"${forecast.name}"`,
        forecast.period_id,
        forecast.scenario_id,
        forecast.total_revenue,
        forecast.total_expenses,
        `${forecast.gross_margin.toFixed(2)}%`,
        forecast.net_cash_flow,
        `"${forecast.status}"`,
        new Date(forecast.created_at).toLocaleDateString('fr-FR')
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  generatePDFReport(forecast: ForecastData): void {
    // Mock PDF generation
  console.warn(`Génération du rapport PDF pour: ${forecast.name}`);
    // In a real implementation, you would use a library like jsPDF or call a backend service
  }
}

export const forecastsService = new ForecastsService();