// Extension du hook useHR pour les fonctionnalités de paie et export
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hrPayrollService, PayrollCalculation } from '@/services/hrPayrollService';
import { hrExportService } from '@/services/hrExportService';
import { Employee, Leave, Expense, TimeEntry } from '@/services/hrService';

interface UseHRPayrollParams {
  employees: Employee[];
  leaves: Leave[];
  expenses: Expense[];
  timeEntries: TimeEntry[];
}

interface UseHRPayrollReturn {
  // Payroll functions
  calculatePayroll: (employeeId: string, periodStart: string, periodEnd: string) => Promise<PayrollCalculation | null>;
  processMonthlyPayroll: (year: number, month: number) => Promise<{ success: boolean; processed: number; errors: string[] }>;
  generatePayslip: (payroll: PayrollCalculation) => Promise<void>;
  createPayrollJournalEntry: (payroll: PayrollCalculation) => Promise<{ success: boolean; error?: string; entryId?: string }>;

  // Export functions
  exportEmployeesToCSV: () => void;
  exportEmployeesToExcel: () => void;
  exportLeavesToCSV: () => void;
  exportExpensesToCSV: () => void;
  exportTimeEntriesToCSV: () => void;
  exportPayrollToCSV: (payrolls: PayrollCalculation[]) => void;
  exportMonthlyPayrollReport: (payrolls: PayrollCalculation[], year: number, month: number) => void;
  exportDADSFormat: (payrolls: PayrollCalculation[], year: number) => void;
}

/**
 * Hook pour les fonctionnalités avancées RH : Paie et Exports
 * À utiliser en combinaison avec useHR()
 */
export function useHRPayroll({
  employees,
  leaves,
  expenses,
  timeEntries
}: UseHRPayrollParams): UseHRPayrollReturn {
  const { currentCompany } = useAuth();

  // ========== PAYROLL FUNCTIONS ==========

  /**
   * Calculer la paie pour un employé spécifique
   */
  const calculatePayroll = useCallback(async (
    employeeId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<PayrollCalculation | null> => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) {
      console.error(`Employee ${employeeId} not found`);
      return null;
    }

    try {
      return await hrPayrollService.calculatePayroll(employee, periodStart, periodEnd);
    } catch (error) {
      console.error('Error calculating payroll:', error);
      return null;
    }
  }, [employees]);

  /**
   * Traiter la paie mensuelle pour tous les employés actifs
   */
  const processMonthlyPayroll = useCallback(async (
    year: number,
    month: number
  ): Promise<{ success: boolean; processed: number; errors: string[] }> => {
    if (!currentCompany?.id) {
      return {
        success: false,
        processed: 0,
        errors: ['No company selected']
      };
    }

    try {
      return await hrPayrollService.processMonthlyPayroll(currentCompany.id, year, month);
    } catch (error) {
      return {
        success: false,
        processed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }, [currentCompany?.id]);

  /**
   * Générer et télécharger une fiche de paie
   */
  const generatePayslip = useCallback(async (payroll: PayrollCalculation): Promise<void> => {
    try {
      const result = await hrPayrollService.generatePayslip(payroll);

      if (result.success && result.pdf) {
        // Télécharger la fiche de paie
        const url = URL.createObjectURL(result.pdf);
        const link = document.createElement('a');
        link.href = url;
        link.download = `fiche_paie_${payroll.employee_name.replace(/\s/g, '_')}_${payroll.period_start}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        console.error('Error generating payslip:', result.error);
        throw new Error(result.error || 'Failed to generate payslip');
      }
    } catch (error) {
      console.error('Error in generatePayslip:', error);
      throw error;
    }
  }, []);

  /**
   * Créer l'écriture comptable pour une paie
   */
  const createPayrollJournalEntry = useCallback(async (
    payroll: PayrollCalculation
  ): Promise<{ success: boolean; error?: string; entryId?: string }> => {
    if (!currentCompany?.id) {
      return {
        success: false,
        error: 'No company selected'
      };
    }

    try {
      return await hrPayrollService.createPayrollJournalEntry(
        currentCompany.id,
        payroll
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [currentCompany?.id]);

  // ========== EXPORT FUNCTIONS ==========

  /**
   * Exporter les employés en CSV
   */
  const exportEmployeesToCSV = useCallback(() => {
    hrExportService.exportEmployeesToCSV(employees);
  }, [employees]);

  /**
   * Exporter les employés en Excel
   */
  const exportEmployeesToExcel = useCallback(() => {
    hrExportService.exportEmployeesToExcel(employees);
  }, [employees]);

  /**
   * Exporter les congés en CSV
   */
  const exportLeavesToCSV = useCallback(() => {
    hrExportService.exportLeavesToCSV(leaves);
  }, [leaves]);

  /**
   * Exporter les notes de frais en CSV
   */
  const exportExpensesToCSV = useCallback(() => {
    hrExportService.exportExpensesToCSV(expenses);
  }, [expenses]);

  /**
   * Exporter les temps de travail en CSV
   */
  const exportTimeEntriesToCSV = useCallback(() => {
    hrExportService.exportTimeEntriesToCSV(timeEntries);
  }, [timeEntries]);

  /**
   * Exporter les paies en CSV
   */
  const exportPayrollToCSV = useCallback((payrolls: PayrollCalculation[]) => {
    hrExportService.exportPayrollToCSV(payrolls);
  }, []);

  /**
   * Exporter le rapport de paie mensuel
   */
  const exportMonthlyPayrollReport = useCallback((
    payrolls: PayrollCalculation[],
    year: number,
    month: number
  ) => {
    hrExportService.exportMonthlyPayrollReport(payrolls, year, month);
  }, []);

  /**
   * Exporter au format DADS (Déclaration Annuelle des Données Sociales)
   */
  const exportDADSFormat = useCallback((
    payrolls: PayrollCalculation[],
    year: number
  ) => {
    hrExportService.exportDADSFormat(employees, payrolls, year);
  }, [employees]);

  return {
    // Payroll
    calculatePayroll,
    processMonthlyPayroll,
    generatePayslip,
    createPayrollJournalEntry,

    // Exports
    exportEmployeesToCSV,
    exportEmployeesToExcel,
    exportLeavesToCSV,
    exportExpensesToCSV,
    exportTimeEntriesToCSV,
    exportPayrollToCSV,
    exportMonthlyPayrollReport,
    exportDADSFormat
  };
}
