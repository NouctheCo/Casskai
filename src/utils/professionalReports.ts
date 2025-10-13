/**
 * Professional financial reports configuration
 * Extracted from OptimizedReportsTab for better bundle splitting
 */

import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Calculator,
  FileText,
  Users,
  Archive,
  Target,
  Zap
} from 'lucide-react';

export interface ProfessionalReport {
  type: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  category: string;
  frequency: string;
  compliance: string;
  estimatedTime: string;
}

export const professionalReports: ProfessionalReport[] = [
  {
    type: 'balance_sheet',
    name: 'Bilan comptable',
    description: 'Situation patrimoniale - Actifs et Passifs',
    icon: BarChart3,
    color: 'blue',
    category: 'États de synthèse',
    frequency: 'Mensuel',
    compliance: 'PCG, IFRS',
    estimatedTime: '2-3 min'
  },
  {
    type: 'income_statement',
    name: 'Compte de résultat',
    description: 'Produits et charges de la période',
    icon: TrendingUp,
    color: 'green',
    category: 'États de synthèse',
    frequency: 'Mensuel',
    compliance: 'PCG, IFRS',
    estimatedTime: '2-3 min'
  },
  {
    type: 'cash_flow',
    name: 'Tableau de flux de trésorerie',
    description: 'Flux de trésorerie par activité',
    icon: DollarSign,
    color: 'purple',
    category: 'États de synthèse',
    frequency: 'Trimestriel',
    compliance: 'IFRS',
    estimatedTime: '3-4 min'
  },
  {
    type: 'trial_balance',
    name: 'Balance générale',
    description: 'Balance de tous les comptes',
    icon: Calculator,
    color: 'orange',
    category: 'Contrôles comptables',
    frequency: 'Mensuel',
    compliance: 'PCG',
    estimatedTime: '1-2 min'
  },
  {
    type: 'general_ledger',
    name: 'Grand livre',
    description: 'Détail des mouvements par compte',
    icon: FileText,
    color: 'indigo',
    category: 'Livres comptables',
    frequency: 'À la demande',
    compliance: 'PCG',
    estimatedTime: '5-8 min'
  },
  {
    type: 'aged_receivables',
    name: 'Clients échéancier',
    description: 'Analyse des créances clients par ancienneté',
    icon: Users,
    color: 'cyan',
    category: 'Analyse crédit',
    frequency: 'Hebdomadaire',
    compliance: 'Gestion',
    estimatedTime: '2-3 min'
  },
  {
    type: 'aged_payables',
    name: 'Fournisseurs échéancier',
    description: 'Analyse des dettes fournisseurs',
    icon: Archive,
    color: 'red',
    category: 'Analyse crédit',
    frequency: 'Hebdomadaire',
    compliance: 'Gestion',
    estimatedTime: '2-3 min'
  },
  {
    type: 'financial_ratios',
    name: 'Ratios financiers',
    description: 'Indicateurs de performance financière',
    icon: Target,
    color: 'emerald',
    category: 'Analyse financière',
    frequency: 'Mensuel',
    compliance: 'Analyse',
    estimatedTime: '3-4 min'
  },
  {
    type: 'vat_report',
    name: 'Déclaration TVA',
    description: 'Rapport TVA collectée et déductible',
    icon: Calculator,
    color: 'yellow',
    category: 'Fiscalité',
    frequency: 'Mensuel',
    compliance: 'DGFiP',
    estimatedTime: '4-5 min'
  },
  {
    type: 'budget_variance',
    name: 'Analyse budgétaire',
    description: 'Écarts budget vs réalisé',
    icon: BarChart3,
    color: 'teal',
    category: 'Pilotage',
    frequency: 'Mensuel',
    compliance: 'Gestion',
    estimatedTime: '3-4 min'
  },
  {
    type: 'kpi_dashboard',
    name: 'Tableau de bord KPI',
    description: 'Indicateurs clés de performance',
    icon: Zap,
    color: 'pink',
    category: 'Pilotage',
    frequency: 'Hebdomadaire',
    compliance: 'Gestion',
    estimatedTime: '5-6 min'
  }
];