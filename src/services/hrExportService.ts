// Service d'export des données RH (Excel, CSV, PDF)
import { Employee, Leave, Expense, TimeEntry } from './hrService';
import { PayrollCalculation } from './hrPayrollService';

export class HRExportService {
  private static instance: HRExportService;

  private constructor() {}

  static getInstance(): HRExportService {
    if (!HRExportService.instance) {
      HRExportService.instance = new HRExportService();
    }
    return HRExportService.instance;
  }

  /**
   * Convertir les données en CSV
   */
  private arrayToCSV(data: unknown[], headers: string[]): string {
    const headerRow = headers.join(',');
    const rows = data.map(item =>
      headers.map(header => {
        const value = item[header] ?? '';
        // Échapper les virgules et guillemets
        const stringValue = String(value).replace(/"/g, '""');
        return stringValue.includes(',') || stringValue.includes('"')
          ? `"${stringValue}"`
          : stringValue;
      }).join(',')
    );
    return [headerRow, ...rows].join('\n');
  }

  /**
   * Télécharger un fichier
   */
  private downloadFile(content: string | Blob, filename: string, mimeType: string): void {
    const blob = content instanceof Blob
      ? content
      : new Blob([content], { type: mimeType });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Exporter les employés en CSV
   */
  exportEmployeesToCSV(employees: Employee[]): void {
    const headers = [
      'employee_number',
      'first_name',
      'last_name',
      'email',
      'phone',
      'position',
      'department',
      'hire_date',
      'salary',
      'contract_type',
      'status'
    ];

    const csv = this.arrayToCSV(employees, headers);
    const filename = `employes_${new Date().toISOString().split('T')[0]}.csv`;
    this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Exporter les employés en Excel (format CSV UTF-8 avec BOM)
   */
  exportEmployeesToExcel(employees: Employee[]): void {
    const headers = [
      'employee_number',
      'first_name',
      'last_name',
      'email',
      'phone',
      'position',
      'department',
      'hire_date',
      'salary',
      'contract_type',
      'status'
    ];

    const csv = this.arrayToCSV(employees, headers);
    // Ajouter le BOM UTF-8 pour Excel
    const bom = '\uFEFF';
    const content = bom + csv;

    const filename = `employes_${new Date().toISOString().split('T')[0]}.csv`;
    this.downloadFile(content, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Exporter les congés en CSV
   */
  exportLeavesToCSV(leaves: Leave[]): void {
    const headers = [
      'employee_name',
      'type',
      'start_date',
      'end_date',
      'days_count',
      'status',
      'reason',
      'approved_by',
      'approved_at'
    ];

    const csv = this.arrayToCSV(leaves, headers);
    const filename = `conges_${new Date().toISOString().split('T')[0]}.csv`;
    this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Exporter les notes de frais en CSV
   */
  exportExpensesToCSV(expenses: Expense[]): void {
    const headers = [
      'employee_name',
      'category',
      'description',
      'amount',
      'currency',
      'expense_date',
      'status',
      'approved_by',
      'approved_at'
    ];

    const csv = this.arrayToCSV(expenses, headers);
    const filename = `notes_frais_${new Date().toISOString().split('T')[0]}.csv`;
    this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Exporter les temps de travail en CSV
   */
  exportTimeEntriesToCSV(timeEntries: TimeEntry[]): void {
    const headers = [
      'employee_name',
      'date',
      'hours',
      'overtime_hours',
      'description',
      'status'
    ];

    const csv = this.arrayToCSV(timeEntries, headers);
    const filename = `temps_travail_${new Date().toISOString().split('T')[0]}.csv`;
    this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Exporter les paies en CSV
   */
  exportPayrollToCSV(payrolls: PayrollCalculation[]): void {
    const headers = [
      'employee_name',
      'gross_salary',
      'social_charges_employee',
      'social_charges_employer',
      'tax_withholding',
      'net_salary',
      'period_start',
      'period_end',
      'status'
    ];

    const csv = this.arrayToCSV(payrolls, headers);
    const filename = `paies_${new Date().toISOString().split('T')[0]}.csv`;
    this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Exporter un rapport de paie mensuel en Excel
   */
  exportMonthlyPayrollReport(
    payrolls: PayrollCalculation[],
    year: number,
    month: number
  ): void {
    // Calculer les totaux
    const totals = payrolls.reduce(
      (acc, p) => ({
        grossSalary: acc.grossSalary + p.gross_salary,
        socialChargesEmployee: acc.socialChargesEmployee + p.social_charges_employee,
        socialChargesEmployer: acc.socialChargesEmployer + p.social_charges_employer,
        taxWithholding: acc.taxWithholding + p.tax_withholding,
        netSalary: acc.netSalary + p.net_salary
      }),
      {
        grossSalary: 0,
        socialChargesEmployee: 0,
        socialChargesEmployer: 0,
        taxWithholding: 0,
        netSalary: 0
      }
    );

    // Ajouter une ligne de total
    const data = [
      ...payrolls,
      {
        employee_name: 'TOTAL',
        gross_salary: totals.grossSalary,
        social_charges_employee: totals.socialChargesEmployee,
        social_charges_employer: totals.socialChargesEmployer,
        tax_withholding: totals.taxWithholding,
        net_salary: totals.netSalary,
        period_start: '',
        period_end: '',
        status: '',
        employee_id: ''
      }
    ];

    const headers = [
      'employee_name',
      'gross_salary',
      'social_charges_employee',
      'social_charges_employer',
      'tax_withholding',
      'net_salary'
    ];

    const bom = '\uFEFF';
    const csv = this.arrayToCSV(data, headers);
    const content = bom + csv;

    const monthNames = [
      'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'
    ];
    const filename = `paie_${monthNames[month - 1]}_${year}.csv`;

    this.downloadFile(content, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Exporter les données employés pour la DADS (Déclaration Annuelle des Données Sociales)
   * Format spécifique pour les déclarations fiscales françaises
   */
  exportDADSFormat(
    employees: Employee[],
    payrolls: PayrollCalculation[],
    year: number
  ): void {
    // Format DADS simplifié
    const dadsData = employees.map(emp => {
      const empPayrolls = payrolls.filter(p => p.employee_id === emp.id);
      const annualGross = empPayrolls.reduce((sum, p) => sum + p.gross_salary, 0);
      const annualNet = empPayrolls.reduce((sum, p) => sum + p.net_salary, 0);

      return {
        numero_securite_sociale: emp.employee_number,
        nom: emp.last_name,
        prenom: emp.first_name,
        date_embauche: emp.hire_date,
        salaire_brut_annuel: annualGross.toFixed(2),
        salaire_net_annuel: annualNet.toFixed(2),
        type_contrat: emp.contract_type,
        statut: emp.status
      };
    });

    const headers = [
      'numero_securite_sociale',
      'nom',
      'prenom',
      'date_embauche',
      'salaire_brut_annuel',
      'salaire_net_annuel',
      'type_contrat',
      'statut'
    ];

    const bom = '\uFEFF';
    const csv = this.arrayToCSV(dadsData, headers);
    const content = bom + csv;

    const filename = `DADS_${year}.csv`;
    this.downloadFile(content, filename, 'text/csv;charset=utf-8;');
  }
}

// Export singleton instance
export const hrExportService = HRExportService.getInstance();
