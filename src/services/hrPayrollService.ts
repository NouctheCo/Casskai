/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

// Service de gestion de la paie et intégration comptable
import { supabase } from '@/lib/supabase';
import { Employee } from './hrService';

export interface PayrollCalculation {
  employee_id: string;
  employee_name: string;
  gross_salary: number;
  social_charges_employee: number;
  social_charges_employer: number;
  net_salary: number;
  tax_withholding: number;
  period_start: string;
  period_end: string;
  status: 'draft' | 'calculated' | 'paid';
}

export interface PayrollJournalEntry {
  account_number: string;
  account_name: string;
  debit: number;
  credit: number;
  description: string;
}

export class HRPayrollService {
  private static instance: HRPayrollService;

  private constructor() {}

  static getInstance(): HRPayrollService {
    if (!HRPayrollService.instance) {
      HRPayrollService.instance = new HRPayrollService();
    }
    return HRPayrollService.instance;
  }

  /**
   * Calculer la paie pour un employé
   * @param employee - Employé
   * @param periodStart - Début période
   * @param periodEnd - Fin période
   */
  async calculatePayroll(
    employee: Employee,
    periodStart: string,
    periodEnd: string
  ): Promise<PayrollCalculation> {
    const grossSalary = employee.salary || 0;

    // Calculs simplifiés (à adapter selon le pays et la législation)
    const socialChargesEmployee = grossSalary * 0.22; // ~22% charges salariales
    const socialChargesEmployer = grossSalary * 0.42; // ~42% charges patronales
    const netSalary = grossSalary - socialChargesEmployee;
    const taxWithholding = netSalary * 0.10; // Prélèvement à la source ~10%

    return {
      employee_id: employee.id,
      employee_name: employee.full_name || `${employee.first_name} ${employee.last_name}`,
      gross_salary: grossSalary,
      social_charges_employee: socialChargesEmployee,
      social_charges_employer: socialChargesEmployer,
      net_salary: netSalary - taxWithholding,
      tax_withholding: taxWithholding,
      period_start: periodStart,
      period_end: periodEnd,
      status: 'calculated'
    };
  }

  /**
   * Générer les écritures comptables pour une paie
   * Respect du plan comptable général français
   */
  async generatePayrollJournalEntries(
    payroll: PayrollCalculation,
    _companyId: string
  ): Promise<PayrollJournalEntry[]> {
    const entries: PayrollJournalEntry[] = [];

    // 1. Salaire brut
    // Débit 641 - Rémunération du personnel
    entries.push({
      account_number: '641000',
      account_name: 'Rémunération du personnel',
      debit: payroll.gross_salary,
      credit: 0,
      description: `Salaire brut ${payroll.employee_name} - ${payroll.period_start}`
    });

    // 2. Charges sociales patronales
    // Débit 645 - Charges de sécurité sociale et de prévoyance
    entries.push({
      account_number: '645000',
      account_name: 'Charges de sécurité sociale et de prévoyance',
      debit: payroll.social_charges_employer,
      credit: 0,
      description: `Charges patronales ${payroll.employee_name} - ${payroll.period_start}`
    });

    // 3. Charges sociales salariales
    // Crédit 431 - Sécurité sociale
    entries.push({
      account_number: '431000',
      account_name: 'Sécurité sociale',
      debit: 0,
      credit: payroll.social_charges_employee + payroll.social_charges_employer,
      description: `Charges sociales ${payroll.employee_name} - ${payroll.period_start}`
    });

    // 4. Prélèvement à la source
    // Crédit 442 - État - Impôts et taxes
    entries.push({
      account_number: '442000',
      account_name: 'État - Impôts et taxes recouvrables',
      debit: 0,
      credit: payroll.tax_withholding,
      description: `Prélèvement source ${payroll.employee_name} - ${payroll.period_start}`
    });

    // 5. Net à payer
    // Crédit 421 - Personnel - Rémunérations dues
    entries.push({
      account_number: '421000',
      account_name: 'Personnel - Rémunérations dues',
      debit: 0,
      credit: payroll.net_salary,
      description: `Net à payer ${payroll.employee_name} - ${payroll.period_start}`
    });

    return entries;
  }

  /**
   * Créer l'écriture comptable dans Supabase
   * Intégration avec le module comptable
   */
  async createPayrollJournalEntry(
    companyId: string,
    payroll: PayrollCalculation,
    journalId: string = 'journal-paie'
  ): Promise<{ success: boolean; error?: string; entryId?: string }> {
    try {
      const entries = await this.generatePayrollJournalEntries(payroll, companyId);

      // Créer l'écriture principale dans journal_entries
      const { data: journalEntry, error: journalError } = await supabase
        .from('journal_entries')
        .insert({
          company_id: companyId,
          journal_id: journalId,
          entry_date: payroll.period_end,
          reference: `PAIE-${payroll.employee_id}-${payroll.period_start}`,
          description: `Paie ${payroll.employee_name} - ${payroll.period_start}`,
          status: 'draft'
        })
        .select()
        .single();

      if (journalError) {
        throw journalError;
      }

      // Créer les lignes d'écriture
      const lines = entries.map(entry => ({
        journal_entry_id: journalEntry.id,
        company_id: companyId,
        account_number: entry.account_number,
        account_name: entry.account_name,
        debit: entry.debit,
        credit: entry.credit,
        description: entry.description
      }));

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(lines);

      if (linesError) {
        // Rollback: supprimer l'écriture principale
        await supabase
          .from('journal_entries')
          .delete()
          .eq('id', journalEntry.id);
        throw linesError;
      }

      return {
        success: true,
        entryId: journalEntry.id
      };
    } catch (error) {
      console.error('Error creating payroll journal entry:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Calculer et enregistrer la paie pour tous les employés actifs
   */
  async processMonthlyPayroll(
    companyId: string,
    year: number,
    month: number
  ): Promise<{ success: boolean; processed: number; errors: string[] }> {
    const errors: string[] = [];
    let processed = 0;

    try {
      // Récupérer tous les employés actifs
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'active');

      if (empError) throw empError;
      if (!employees || employees.length === 0) {
        return { success: true, processed: 0, errors: ['Aucun employé actif trouvé'] };
      }

      // Calculer période
      const periodStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const periodEnd = new Date(year, month, 0).toISOString().split('T')[0];

      // Traiter chaque employé
      for (const employee of employees) {
        try {
          const payroll = await this.calculatePayroll(employee as Employee, periodStart, periodEnd);
          const result = await this.createPayrollJournalEntry(companyId, payroll);

          if (result.success) {
            processed++;
          } else {
            errors.push(`${employee.first_name} ${employee.last_name}: ${result.error}`);
          }
        } catch (error) {
          errors.push(`${employee.first_name} ${employee.last_name}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
      }

      return {
        success: errors.length === 0,
        processed,
        errors
      };
    } catch (error) {
      return {
        success: false,
        processed,
        errors: [error instanceof Error ? error.message : 'Erreur lors du traitement des paies']
      };
    }
  }

  /**
   * Générer une fiche de paie PDF (simplifié - à enrichir)
   */
  async generatePayslip(payroll: PayrollCalculation): Promise<{ success: boolean; pdf?: Blob; error?: string }> {
    try {
      // TODO: Intégrer une librairie PDF (ex: jsPDF ou pdfmake)
      // Pour l'instant, retourner les données structurées

      const payslipData = {
        employee: payroll.employee_name,
        period: `${payroll.period_start} au ${payroll.period_end}`,
        grossSalary: payroll.gross_salary.toFixed(2),
        socialChargesEmployee: payroll.social_charges_employee.toFixed(2),
        socialChargesEmployer: payroll.social_charges_employer.toFixed(2),
        taxWithholding: payroll.tax_withholding.toFixed(2),
        netSalary: payroll.net_salary.toFixed(2),
        totalCost: (payroll.gross_salary + payroll.social_charges_employer).toFixed(2)
      };

      // Générer un HTML simple pour l'instant
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Bulletin de Paie - ${payslipData.employee}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; }
            h1 { text-align: center; color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .total { font-weight: bold; font-size: 1.1em; }
          </style>
        </head>
        <body>
          <h1>Bulletin de Paie</h1>
          <p><strong>Employé:</strong> ${payslipData.employee}</p>
          <p><strong>Période:</strong> ${payslipData.period}</p>
          <table>
            <tr><th>Libellé</th><th>Montant</th></tr>
            <tr><td>Salaire Brut</td><td>${payslipData.grossSalary} €</td></tr>
            <tr><td>Charges Sociales Salariales</td><td>-${payslipData.socialChargesEmployee} €</td></tr>
            <tr><td>Prélèvement à la Source</td><td>-${payslipData.taxWithholding} €</td></tr>
            <tr class="total"><td>Net à Payer</td><td>${payslipData.netSalary} €</td></tr>
          </table>
          <p><strong>Coût Total Employeur:</strong> ${payslipData.totalCost} € (charges patronales: ${payslipData.socialChargesEmployer} €)</p>
        </body>
        </html>
      `;

      const blob = new Blob([html], { type: 'text/html' });

      return {
        success: true,
        pdf: blob
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur génération fiche de paie'
      };
    }
  }
}

// Export singleton instance
export const hrPayrollService = HRPayrollService.getInstance();
