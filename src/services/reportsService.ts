import {
  FinancialReport,
  ReportFormData,
  ReportTemplate,
  ReportTemplateFormData,
  ReportSchedule,
  ReportScheduleFormData,
  ReportAnalytics,
  BalanceSheetData,
  IncomeStatementData,
  CashFlowData,
  TrialBalanceData,
  ReportFilters,
  ReportStats,
  ReportsDashboardData,
  ReportExportConfig,
  ReportDistribution,
  ReportServiceResponse,
  ReportChartData
} from '../types/reports.types';

// Mock data
const mockBalanceSheetData: BalanceSheetData = {
  assets: {
    current_assets: {
      cash_and_equivalents: 145000,
      accounts_receivable: 89500,
      inventory: 67200,
      prepaid_expenses: 12800,
      other_current_assets: 8500,
      total_current_assets: 323000
    },
    non_current_assets: {
      property_plant_equipment: 425000,
      intangible_assets: 75000,
      investments: 120000,
      other_non_current_assets: 25000,
      total_non_current_assets: 645000
    },
    total_assets: 968000
  },
  liabilities: {
    current_liabilities: {
      accounts_payable: 54000,
      short_term_debt: 35000,
      accrued_expenses: 28500,
      other_current_liabilities: 15500,
      total_current_liabilities: 133000
    },
    non_current_liabilities: {
      long_term_debt: 180000,
      deferred_tax: 25000,
      other_non_current_liabilities: 12000,
      total_non_current_liabilities: 217000
    },
    total_liabilities: 350000
  },
  equity: {
    share_capital: 200000,
    retained_earnings: 398000,
    other_equity: 20000,
    total_equity: 618000
  },
  total_liabilities_equity: 968000
};

const mockIncomeStatementData: IncomeStatementData = {
  revenue: {
    gross_revenue: 1250000,
    returns_allowances: 18000,
    net_revenue: 1232000
  },
  cost_of_goods_sold: {
    direct_materials: 425000,
    direct_labor: 180000,
    manufacturing_overhead: 95000,
    total_cogs: 700000
  },
  gross_profit: 532000,
  operating_expenses: {
    selling_expenses: 125000,
    administrative_expenses: 95000,
    research_development: 45000,
    total_operating_expenses: 265000
  },
  operating_income: 267000,
  other_income_expenses: {
    interest_income: 5000,
    interest_expense: 18000,
    other_income: 8000,
    other_expenses: 3000,
    net_other_income: -8000
  },
  income_before_taxes: 259000,
  tax_expense: 64750,
  net_income: 194250
};

const mockCashFlowData: CashFlowData = {
  operating_activities: {
    net_income: 194250,
    depreciation_amortization: 45000,
    accounts_receivable_change: -12000,
    inventory_change: -8500,
    accounts_payable_change: 7500,
    other_operating_changes: 3200,
    net_cash_from_operations: 229450
  },
  investing_activities: {
    capital_expenditures: -85000,
    asset_sales: 15000,
    investments: -25000,
    other_investing: -5000,
    net_cash_from_investing: -100000
  },
  financing_activities: {
    debt_proceeds: 50000,
    debt_payments: -45000,
    equity_proceeds: 0,
    dividends_paid: -48000,
    other_financing: -2000,
    net_cash_from_financing: -45000
  },
  net_cash_change: 84450,
  beginning_cash: 95550,
  ending_cash: 180000
};

const mockTrialBalanceData: TrialBalanceData = {
  accounts: [
    {
      account_number: '1000',
      account_name: 'Caisse',
      account_type: 'asset',
      debit_balance: 25000,
      credit_balance: 0,
      net_balance: 25000
    },
    {
      account_number: '1100',
      account_name: 'Banque',
      account_type: 'asset',
      debit_balance: 155000,
      credit_balance: 0,
      net_balance: 155000
    },
    {
      account_number: '4110',
      account_name: 'Clients',
      account_type: 'asset',
      debit_balance: 89500,
      credit_balance: 0,
      net_balance: 89500
    },
    {
      account_number: '4010',
      account_name: 'Fournisseurs',
      account_type: 'liability',
      debit_balance: 0,
      credit_balance: 54000,
      net_balance: -54000
    },
    {
      account_number: '7010',
      account_name: 'Ventes de marchandises',
      account_type: 'revenue',
      debit_balance: 0,
      credit_balance: 1232000,
      net_balance: -1232000
    },
    {
      account_number: '6010',
      account_name: 'Achats de marchandises',
      account_type: 'expense',
      debit_balance: 700000,
      credit_balance: 0,
      net_balance: 700000
    }
  ],
  totals: {
    total_debits: 969500,
    total_credits: 1286000,
    balance_difference: -316500
  }
};

const mockReports: FinancialReport[] = [
  {
    id: '1',
    name: 'Bilan Comptable Décembre 2023',
    type: 'balance_sheet',
    format: 'detailed',
    period: {
      start_date: '2023-01-01',
      end_date: '2023-12-31',
      type: 'annual'
    },
    comparison: {
      enabled: true,
      period_type: 'previous_year',
      comparison_start: '2022-01-01',
      comparison_end: '2022-12-31'
    },
    status: 'ready',
    generated_at: '2024-01-15T10:30:00Z',
    generated_by: 'user-1',
    file_url: '/reports/bilan_2023.pdf',
    file_format: 'pdf',
    file_size: 2048576,
    enterprise_id: 'company-1',
    is_public: false,
    access_level: 'management',
    include_notes: true,
    include_charts: true,
    show_variance: true,
    currency: 'EUR',
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Compte de Résultat Q4 2023',
    type: 'income_statement',
    format: 'summary',
    period: {
      start_date: '2023-10-01',
      end_date: '2023-12-31',
      type: 'quarterly'
    },
    status: 'published',
    generated_at: '2024-01-10T14:20:00Z',
    generated_by: 'user-2',
    file_url: '/reports/resultat_q4_2023.xlsx',
    file_format: 'excel',
    file_size: 1024000,
    enterprise_id: 'company-1',
    is_public: true,
    access_level: 'board',
    include_notes: false,
    include_charts: true,
    show_variance: false,
    currency: 'EUR',
    created_at: '2024-01-10T13:00:00Z',
    updated_at: '2024-01-10T14:20:00Z'
  },
  {
    id: '3',
    name: 'Tableau de Flux de Trésorerie 2023',
    type: 'cash_flow',
    format: 'detailed',
    period: {
      start_date: '2023-01-01',
      end_date: '2023-12-31',
      type: 'annual'
    },
    status: 'generating',
    generated_by: 'user-1',
    file_format: 'pdf',
    enterprise_id: 'company-1',
    is_public: false,
    access_level: 'internal',
    include_notes: true,
    include_charts: false,
    show_variance: true,
    currency: 'EUR',
    created_at: '2024-01-20T11:00:00Z',
    updated_at: '2024-01-20T11:15:00Z'
  }
];

const mockTemplates: ReportTemplate[] = [
  {
    id: '1',
    name: 'Bilan Standard SYSCOHADA',
    description: 'Modèle de bilan conforme au système comptable SYSCOHADA',
    type: 'balance_sheet',
    sections: [
      {
        id: '1',
        name: 'ACTIF',
        order: 1,
        items: [
          {
            id: '1',
            name: 'Actif immobilisé',
            account_codes: ['2000-2999'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: '2',
            name: 'Actif circulant',
            account_codes: ['3000-3999', '4000-4999', '5000-5999'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          }
        ]
      },
      {
        id: '2',
        name: 'PASSIF',
        order: 2,
        items: [
          {
            id: '3',
            name: 'Capitaux propres',
            account_codes: ['1000-1999'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          },
          {
            id: '4',
            name: 'Dettes',
            account_codes: ['4000-4999'],
            calculation_type: 'sum',
            format: 'currency',
            show_in_summary: true
          }
        ]
      }
    ],
    styling: {
      font_family: 'Arial',
      font_size: 12,
      header_color: '#2563eb',
      show_logo: true,
      show_watermark: false
    },
    is_default: true,
    enterprise_id: 'company-1',
    created_by: 'system',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const mockSchedules: ReportSchedule[] = [
  {
    id: '1',
    report_template_id: '1',
    name: 'Bilan Mensuel Automatique',
    description: 'Génération automatique du bilan chaque mois',
    frequency: 'monthly',
    day_of_month: 5,
    time: '08:00',
    recipients: [
      { email: 'direction@entreprise.fr', name: 'Direction', role: 'Directeur' },
      { email: 'comptabilite@entreprise.fr', name: 'Comptabilité', role: 'Comptable' }
    ],
    auto_send: true,
    include_charts: true,
    file_format: 'pdf',
    is_active: true,
    last_run: '2024-01-05T08:00:00Z',
    next_run: '2024-02-05T08:00:00Z',
    enterprise_id: 'company-1',
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-05T08:00:00Z'
  }
];

class ReportsService {
  // Reports CRUD
  async getReports(enterpriseId: string, filters?: ReportFilters): Promise<ReportServiceResponse<FinancialReport[]>> {
    try {
      let filteredReports = mockReports.filter(r => r.enterprise_id === enterpriseId);
      
      if (filters) {
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredReports = filteredReports.filter(r =>
            r.name.toLowerCase().includes(searchLower)
          );
        }
        
        if (filters.type) {
          filteredReports = filteredReports.filter(r => r.type === filters.type);
        }
        
        if (filters.status) {
          filteredReports = filteredReports.filter(r => r.status === filters.status);
        }
        
        if (filters.period_start) {
          filteredReports = filteredReports.filter(r => r.period.start_date >= filters.period_start!);
        }
        
        if (filters.period_end) {
          filteredReports = filteredReports.filter(r => r.period.end_date <= filters.period_end!);
        }
        
        if (filters.generated_by) {
          filteredReports = filteredReports.filter(r => r.generated_by === filters.generated_by);
        }
        
        if (filters.access_level) {
          filteredReports = filteredReports.filter(r => r.access_level === filters.access_level);
        }
        
        if (filters.file_format) {
          filteredReports = filteredReports.filter(r => r.file_format === filters.file_format);
        }
      }
      
      return { data: filteredReports };
    } catch (error) {
      return {
        data: [],
        error: { message: 'Erreur lors de la récupération des rapports' }
      };
    }
  }

  async createReport(enterpriseId: string, formData: ReportFormData): Promise<ReportServiceResponse<FinancialReport>> {
    try {
      const newReport: FinancialReport = {
        id: Date.now().toString(),
        name: formData.name,
        type: formData.type,
        format: formData.format,
        period: {
          start_date: formData.period_start,
          end_date: formData.period_end,
          type: this.determinePeriodType(formData.period_start, formData.period_end)
        },
        comparison: formData.comparison_enabled ? {
          enabled: true,
          period_type: 'previous_period',
          comparison_start: formData.comparison_period_start,
          comparison_end: formData.comparison_period_end
        } : undefined,
        status: 'generating',
        generated_by: 'current-user',
        file_format: formData.file_format,
        enterprise_id: enterpriseId,
        is_public: false,
        access_level: formData.access_level,
        include_notes: formData.include_notes,
        include_charts: formData.include_charts,
        show_variance: formData.show_variance,
        currency: 'EUR',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Simulate report generation delay
      setTimeout(() => {
        const reportIndex = mockReports.findIndex(r => r.id === newReport.id);
        if (reportIndex !== -1) {
          mockReports[reportIndex] = {
            ...mockReports[reportIndex],
            status: 'ready',
            generated_at: new Date().toISOString(),
            file_url: `/reports/${newReport.name.toLowerCase().replace(/\s+/g, '_')}.${formData.file_format}`,
            file_size: Math.floor(Math.random() * 5000000) + 1000000 // 1-5MB
          };
        }
      }, 5000);
      
      mockReports.push(newReport);
      return { data: newReport };
    } catch (error) {
      return {
        data: {} as FinancialReport,
        error: { message: 'Erreur lors de la création du rapport' }
      };
    }
  }

  async updateReport(reportId: string, formData: Partial<ReportFormData>): Promise<ReportServiceResponse<FinancialReport>> {
    try {
      const reportIndex = mockReports.findIndex(r => r.id === reportId);
      if (reportIndex === -1) {
        return {
          data: {} as FinancialReport,
          error: { message: 'Rapport non trouvé' }
        };
      }
      
      const existingReport = mockReports[reportIndex];
      
      mockReports[reportIndex] = {
        ...existingReport,
        name: formData.name || existingReport.name,
        include_notes: formData.include_notes ?? existingReport.include_notes,
        include_charts: formData.include_charts ?? existingReport.include_charts,
        show_variance: formData.show_variance ?? existingReport.show_variance,
        access_level: formData.access_level || existingReport.access_level,
        updated_at: new Date().toISOString()
      };
      
      return { data: mockReports[reportIndex] };
    } catch (error) {
      return {
        data: {} as FinancialReport,
        error: { message: 'Erreur lors de la mise à jour du rapport' }
      };
    }
  }

  async deleteReport(reportId: string): Promise<ReportServiceResponse<boolean>> {
    try {
      const reportIndex = mockReports.findIndex(r => r.id === reportId);
      if (reportIndex === -1) {
        return {
          data: false,
          error: { message: 'Rapport non trouvé' }
        };
      }
      
      mockReports.splice(reportIndex, 1);
      return { data: true };
    } catch (error) {
      return {
        data: false,
        error: { message: 'Erreur lors de la suppression du rapport' }
      };
    }
  }

  // Report data generation
  async generateBalanceSheet(enterpriseId: string, periodStart: string, periodEnd: string): Promise<ReportServiceResponse<BalanceSheetData>> {
    try {
      // In a real implementation, this would query the accounting data
      return { data: mockBalanceSheetData };
    } catch (error) {
      return {
        data: {} as BalanceSheetData,
        error: { message: 'Erreur lors de la génération du bilan' }
      };
    }
  }

  async generateIncomeStatement(enterpriseId: string, periodStart: string, periodEnd: string): Promise<ReportServiceResponse<IncomeStatementData>> {
    try {
      // In a real implementation, this would query the accounting data
      return { data: mockIncomeStatementData };
    } catch (error) {
      return {
        data: {} as IncomeStatementData,
        error: { message: 'Erreur lors de la génération du compte de résultat' }
      };
    }
  }

  async generateCashFlowStatement(enterpriseId: string, periodStart: string, periodEnd: string): Promise<ReportServiceResponse<CashFlowData>> {
    try {
      // In a real implementation, this would query the accounting data
      return { data: mockCashFlowData };
    } catch (error) {
      return {
        data: {} as CashFlowData,
        error: { message: 'Erreur lors de la génération du tableau de flux de trésorerie' }
      };
    }
  }

  async generateTrialBalance(enterpriseId: string, periodEnd: string): Promise<ReportServiceResponse<TrialBalanceData>> {
    try {
      // In a real implementation, this would query the accounting data
      return { data: mockTrialBalanceData };
    } catch (error) {
      return {
        data: {} as TrialBalanceData,
        error: { message: 'Erreur lors de la génération de la balance générale' }
      };
    }
  }

  // Templates
  async getTemplates(enterpriseId: string): Promise<ReportServiceResponse<ReportTemplate[]>> {
    try {
      const filteredTemplates = mockTemplates.filter(t => t.enterprise_id === enterpriseId || t.is_default);
      return { data: filteredTemplates };
    } catch (error) {
      return {
        data: [],
        error: { message: 'Erreur lors de la récupération des modèles' }
      };
    }
  }

  async createTemplate(enterpriseId: string, formData: ReportTemplateFormData): Promise<ReportServiceResponse<ReportTemplate>> {
    try {
      const newTemplate: ReportTemplate = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        type: formData.type,
        sections: formData.sections.map((section, index) => ({
          id: (index + 1).toString(),
          name: section.name,
          order: index + 1,
          items: section.items.map((item, itemIndex) => ({
            id: (itemIndex + 1).toString(),
            name: item.name,
            account_codes: item.account_codes,
            calculation_type: item.calculation_type,
            format: item.format,
            show_in_summary: item.show_in_summary
          }))
        })),
        styling: {
          font_family: 'Arial',
          font_size: 12,
          header_color: '#2563eb',
          show_logo: true,
          show_watermark: false
        },
        is_default: false,
        enterprise_id: enterpriseId,
        created_by: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockTemplates.push(newTemplate);
      return { data: newTemplate };
    } catch (error) {
      return {
        data: {} as ReportTemplate,
        error: { message: 'Erreur lors de la création du modèle' }
      };
    }
  }

  // Schedules
  async getSchedules(enterpriseId: string): Promise<ReportServiceResponse<ReportSchedule[]>> {
    try {
      const filteredSchedules = mockSchedules.filter(s => s.enterprise_id === enterpriseId);
      return { data: filteredSchedules };
    } catch (error) {
      return {
        data: [],
        error: { message: 'Erreur lors de la récupération des planifications' }
      };
    }
  }

  async createSchedule(enterpriseId: string, formData: ReportScheduleFormData): Promise<ReportServiceResponse<ReportSchedule>> {
    try {
      const newSchedule: ReportSchedule = {
        id: Date.now().toString(),
        report_template_id: formData.report_template_id,
        name: formData.name,
        description: formData.description,
        frequency: formData.frequency,
        day_of_week: formData.day_of_week,
        day_of_month: formData.day_of_month,
        time: formData.time,
        recipients: formData.recipients,
        auto_send: formData.auto_send,
        include_charts: formData.include_charts,
        file_format: formData.file_format,
        is_active: true,
        next_run: this.calculateNextRun(formData.frequency, formData.day_of_month, formData.day_of_week, formData.time),
        enterprise_id: enterpriseId,
        created_by: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockSchedules.push(newSchedule);
      return { data: newSchedule };
    } catch (error) {
      return {
        data: {} as ReportSchedule,
        error: { message: 'Erreur lors de la création de la planification' }
      };
    }
  }

  // Analytics
  async getReportAnalytics(reportId: string, period: string): Promise<ReportServiceResponse<ReportAnalytics>> {
    try {
      const report = mockReports.find(r => r.id === reportId);
      if (!report) {
        return {
          data: {} as ReportAnalytics,
          error: { message: 'Rapport non trouvé' }
        };
      }
      
      // Mock analytics calculation based on report type
      const analytics: ReportAnalytics = {
        report_id: reportId,
        period,
        profitability: {
          gross_margin: 43.2,
          operating_margin: 21.7,
          net_margin: 15.8,
          return_on_assets: 20.1,
          return_on_equity: 31.4
        },
        liquidity: {
          current_ratio: 2.43,
          quick_ratio: 1.92,
          cash_ratio: 1.09,
          working_capital: 190000
        },
        efficiency: {
          asset_turnover: 1.27,
          inventory_turnover: 10.4,
          receivables_turnover: 13.8,
          payables_turnover: 13.0
        },
        leverage: {
          debt_to_equity: 0.57,
          debt_to_assets: 0.36,
          interest_coverage: 14.8,
          debt_service_coverage: 2.8
        },
        trends: {
          revenue_growth: 8.5,
          expense_growth: 6.2,
          profit_growth: 12.3,
          asset_growth: 5.7
        },
        industry_benchmarks: {
          gross_margin: 40.0,
          operating_margin: 18.5,
          current_ratio: 2.1,
          debt_to_equity: 0.6
        }
      };
      
      return { data: analytics };
    } catch (error) {
      return {
        data: {} as ReportAnalytics,
        error: { message: 'Erreur lors du calcul des analytiques' }
      };
    }
  }

  // Dashboard
  async getDashboardData(enterpriseId: string): Promise<ReportServiceResponse<ReportsDashboardData>> {
    try {
      const enterpriseReports = mockReports.filter(r => r.enterprise_id === enterpriseId);
      const enterpriseSchedules = mockSchedules.filter(s => s.enterprise_id === enterpriseId);
      const enterpriseTemplates = mockTemplates.filter(t => t.enterprise_id === enterpriseId || t.is_default);
      
      const stats: ReportStats = {
        total_reports: enterpriseReports.length,
        reports_this_month: enterpriseReports.filter(r => {
          const createdDate = new Date(r.created_at);
          const now = new Date();
          return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
        }).length,
        automated_reports: enterpriseSchedules.filter(s => s.is_active).length,
        manual_reports: enterpriseReports.filter(r => !enterpriseSchedules.some(s => s.report_template_id === r.id)).length,
        by_type: [
          {
            type: 'balance_sheet',
            count: enterpriseReports.filter(r => r.type === 'balance_sheet').length,
            last_generated: enterpriseReports.find(r => r.type === 'balance_sheet')?.generated_at
          },
          {
            type: 'income_statement',
            count: enterpriseReports.filter(r => r.type === 'income_statement').length,
            last_generated: enterpriseReports.find(r => r.type === 'income_statement')?.generated_at
          },
          {
            type: 'cash_flow',
            count: enterpriseReports.filter(r => r.type === 'cash_flow').length,
            last_generated: enterpriseReports.find(r => r.type === 'cash_flow')?.generated_at
          }
        ],
        by_format: [
          {
            format: 'pdf',
            count: enterpriseReports.filter(r => r.file_format === 'pdf').length,
            percentage: (enterpriseReports.filter(r => r.file_format === 'pdf').length / enterpriseReports.length) * 100
          },
          {
            format: 'excel',
            count: enterpriseReports.filter(r => r.file_format === 'excel').length,
            percentage: (enterpriseReports.filter(r => r.file_format === 'excel').length / enterpriseReports.length) * 100
          }
        ],
        recent_generations: Math.floor(Math.random() * 10) + 5,
        scheduled_today: enterpriseSchedules.filter(s => {
          const today = new Date().toISOString().split('T')[0];
          return s.next_run?.startsWith(today);
        }).length
      };
      
      const dashboardData: ReportsDashboardData = {
        stats,
        recent_reports: enterpriseReports.slice(0, 5),
        scheduled_reports: enterpriseSchedules.filter(s => s.is_active).slice(0, 5),
        popular_templates: enterpriseTemplates.slice(0, 3),
        key_metrics: {
          total_revenue_ytd: mockIncomeStatementData.revenue.net_revenue,
          total_expenses_ytd: mockIncomeStatementData.cost_of_goods_sold.total_cogs + mockIncomeStatementData.operating_expenses.total_operating_expenses,
          net_income_ytd: mockIncomeStatementData.net_income,
          cash_position: mockBalanceSheetData.assets.current_assets.cash_and_equivalents
        },
        alerts: {
          missing_data: Math.floor(Math.random() * 3) + 1,
          failed_schedules: Math.floor(Math.random() * 2),
          outdated_reports: Math.floor(Math.random() * 5) + 2
        }
      };
      
      return { data: dashboardData };
    } catch (error) {
      return {
        data: {} as ReportsDashboardData,
        error: { message: 'Erreur lors de la récupération des données du tableau de bord' }
      };
    }
  }

  // Export functions
  async exportReport(reportId: string, config: ReportExportConfig): Promise<ReportServiceResponse<string>> {
    try {
      const report = mockReports.find(r => r.id === reportId);
      if (!report) {
        return {
          data: '',
          error: { message: 'Rapport non trouvé' }
        };
      }
      
      // Mock export URL generation
      const exportUrl = `/exports/${reportId}_${Date.now()}.${config.format}`;
      
      // Simulate export processing
      console.log(`Export du rapport ${report.name} en format ${config.format}`);
      
      return { data: exportUrl };
    } catch (error) {
      return {
        data: '',
        error: { message: 'Erreur lors de l\'export du rapport' }
      };
    }
  }

  exportReportsToCSV(reports: FinancialReport[], filename: string = 'rapports_financiers') {
    const headers = [
      'Nom',
      'Type',
      'Format',
      'Période début',
      'Période fin',
      'Statut',
      'Généré le',
      'Généré par',
      'Taille fichier (KB)',
      'Accès'
    ];
    
    const csvContent = [
      headers.join(','),
      ...reports.map(report => [
        `"${report.name}"`,
        `"${report.type}"`,
        `"${report.format}"`,
        report.period.start_date,
        report.period.end_date,
        `"${report.status}"`,
        report.generated_at ? new Date(report.generated_at).toLocaleDateString('fr-FR') : '',
        `"${report.generated_by}"`,
        report.file_size ? Math.round(report.file_size / 1024).toString() : '0',
        `"${report.access_level}"`
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

  // Chart data generation
  async generateChartData(reportType: string, period: string): Promise<ReportServiceResponse<ReportChartData[]>> {
    try {
      const charts: ReportChartData[] = [];
      
      if (reportType === 'balance_sheet') {
        charts.push({
          type: 'pie',
          title: 'Répartition de l\'Actif',
          data: {
            labels: ['Actif immobilisé', 'Actif circulant'],
            datasets: [{
              name: 'Montant',
              data: [mockBalanceSheetData.assets.non_current_assets.total_non_current_assets, mockBalanceSheetData.assets.current_assets.total_current_assets],
              color: '#3b82f6'
            }]
          },
          options: {
            show_legend: true,
            show_grid: false,
            currency_format: true,
            percentage_format: false
          }
        });
      }
      
      if (reportType === 'income_statement') {
        charts.push({
          type: 'bar',
          title: 'Évolution Trimestrielle',
          data: {
            labels: ['T1 2023', 'T2 2023', 'T3 2023', 'T4 2023'],
            datasets: [{
              name: 'Chiffre d\'affaires',
              data: [280000, 315000, 298000, 339000],
              color: '#10b981'
            }, {
              name: 'Charges',
              data: [210000, 235000, 225000, 255000],
              color: '#ef4444'
            }]
          },
          options: {
            show_legend: true,
            show_grid: true,
            currency_format: true,
            percentage_format: false
          }
        });
      }
      
      return { data: charts };
    } catch (error) {
      return {
        data: [],
        error: { message: 'Erreur lors de la génération des graphiques' }
      };
    }
  }

  // Utility functions
  private determinePeriodType(startDate: string, endDate: string): 'monthly' | 'quarterly' | 'annual' | 'custom' {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    
    if (diffMonths === 0) return 'monthly';
    if (diffMonths === 2) return 'quarterly';
    if (diffMonths === 11) return 'annual';
    return 'custom';
  }

  private calculateNextRun(frequency: string, dayOfMonth?: number, dayOfWeek?: number, time?: string): string {
    const now = new Date();
    const nextRun = new Date();
    
    switch (frequency) {
      case 'daily':
        nextRun.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        const targetDay = dayOfWeek || 1; // Monday default
        const currentDay = now.getDay();
        const daysUntilNext = (targetDay - currentDay + 7) % 7 || 7;
        nextRun.setDate(now.getDate() + daysUntilNext);
        break;
      case 'monthly':
        nextRun.setMonth(now.getMonth() + 1);
        nextRun.setDate(dayOfMonth || 1);
        break;
      case 'quarterly':
        nextRun.setMonth(now.getMonth() + 3);
        nextRun.setDate(dayOfMonth || 1);
        break;
      case 'annually':
        nextRun.setFullYear(now.getFullYear() + 1);
        nextRun.setMonth(0);
        nextRun.setDate(dayOfMonth || 1);
        break;
      default:
        nextRun.setDate(now.getDate() + 1);
    }
    
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      nextRun.setHours(hours, minutes, 0, 0);
    }
    
    return nextRun.toISOString();
  }
}

export const reportsService = new ReportsService();