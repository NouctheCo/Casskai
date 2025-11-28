import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fromBudgetLinesDB, type BudgetLineDB } from '@/utils/budgetMapping';

// Types partagés avec le mapping
export interface BudgetCategory {
  account_number?: string;
  account_name?: string;
  type: 'revenue' | 'expense';
  annual_amount: number;
  growth_rate: number;
  monthly_distribution: number[];
  notes?: string;
}

interface BudgetHypothesis {
  name: string;
  value: string;
  description?: string;
}

interface BudgetData {
  year: number;
  company: {
    name: string;
    country?: string;
    activity?: string;
  };
  categories: BudgetCategory[];
  hypotheses?: BudgetHypothesis[];
}

/**
 * Génère un Business Plan PDF à partir de données brutes de la DB
 * Gère automatiquement le mapping line_type -> type
 */
export interface BudgetDataDB {
  year: number;
  company: {
    name: string;
    country?: string;
    activity?: string;
  };
  categories: BudgetLineDB[];
  hypotheses?: BudgetHypothesis[];
}

const MONTHS = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Jun',
  'Jul',
  'Aoû',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
];

export const businessPlanService = {
  async generatePDF(data: BudgetData): Promise<Blob> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let y = 20;

    // ===== PAGE 1 : COUVERTURE =====
    pdf.setFontSize(24);
    pdf.setTextColor(0, 51, 102);
    pdf.text('BUSINESS PLAN', pageWidth / 2, y, { align: 'center' });
    y += 15;

    pdf.setFontSize(18);
    pdf.text(data.company.name, pageWidth / 2, y, { align: 'center' });
    y += 10;

    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Exercice ${data.year}`, pageWidth / 2, y, { align: 'center' });
    y += 30;

    // Logo placeholder
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(pageWidth / 2 - 30, y, 60, 40);
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text('[Logo entreprise]', pageWidth / 2, y + 22, { align: 'center' });
    y += 60;

    // Informations entreprise
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    if (data.company.activity) {
      pdf.text(`Secteur d'activité : ${data.company.activity}`, pageWidth / 2, y, {
        align: 'center',
      });
      y += 8;
    }
    pdf.text(`Pays : ${data.company.country || 'France'}`, pageWidth / 2, y, {
      align: 'center',
    });
    y += 8;
    pdf.text(
      `Date de génération : ${new Date().toLocaleDateString('fr-FR')}`,
      pageWidth / 2,
      y,
      { align: 'center' }
    );

    // ===== PAGE 2 : RÉSUMÉ EXÉCUTIF =====
    pdf.addPage();
    y = 20;

    pdf.setFontSize(16);
    pdf.setTextColor(0, 51, 102);
    pdf.text('1. RÉSUMÉ EXÉCUTIF', 20, y);
    y += 15;

    // Calculs
    const totalRevenue = data.categories
      .filter((c) => c.type === 'revenue')
      .reduce((sum, c) => sum + c.annual_amount, 0);

    const totalExpenses = data.categories
      .filter((c) => c.type === 'expense')
      .reduce((sum, c) => sum + c.annual_amount, 0);

    const netResult = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (netResult / totalRevenue) * 100 : 0;

    // KPIs
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);

    const kpis = [
      ['Chiffre d\'affaires prévisionnel', `${totalRevenue.toLocaleString('fr-FR')} €`],
      ['Total des charges', `${totalExpenses.toLocaleString('fr-FR')} €`],
      ['Résultat net prévisionnel', `${netResult.toLocaleString('fr-FR')} €`],
      ['Marge nette', `${margin.toFixed(1)}%`],
    ];

    autoTable(pdf, {
      startY: y,
      head: [['Indicateur', 'Valeur']],
      body: kpis,
      theme: 'striped',
      headStyles: { fillColor: [0, 51, 102] },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 60, halign: 'right', fontStyle: 'bold' },
      },
    });

    y = (pdf as any).lastAutoTable.finalY + 20;

    // Commentaire
    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);
    const commentary =
      netResult >= 0
        ? `L'entreprise prévoit un résultat positif de ${netResult.toLocaleString(
            'fr-FR'
          )} € pour l'année ${data.year}, soit une marge nette de ${margin.toFixed(1)}%.`
        : `L'entreprise prévoit un déficit de ${Math.abs(netResult).toLocaleString(
            'fr-FR'
          )} € pour l'année ${data.year}. Des mesures correctives sont à envisager.`;

    const splitText = pdf.splitTextToSize(commentary, pageWidth - 40);
    pdf.text(splitText, 20, y);

    // ===== PAGE 3 : COMPTE DE RÉSULTAT PRÉVISIONNEL =====
    pdf.addPage();
    y = 20;

    pdf.setFontSize(16);
    pdf.setTextColor(0, 51, 102);
    pdf.text('2. COMPTE DE RÉSULTAT PRÉVISIONNEL', 20, y);
    y += 15;

    // Revenus
    pdf.setFontSize(12);
    pdf.setTextColor(0, 100, 0);
    pdf.text('PRODUITS (Revenus)', 20, y);
    y += 8;

    const revenueRows = data.categories
      .filter((c) => c.type === 'revenue')
      .map((c) => [
        c.account_number || '-',
        c.account_name || 'Revenu',
        `${c.annual_amount.toLocaleString('fr-FR')} €`,
      ]);

    revenueRows.push(['', 'TOTAL PRODUITS', `${totalRevenue.toLocaleString('fr-FR')} €`]);

    autoTable(pdf, {
      startY: y,
      head: [['Compte', 'Libellé', 'Montant']],
      body: revenueRows,
      theme: 'grid',
      headStyles: { fillColor: [0, 128, 0] },
      styles: { fontSize: 9 },
      columnStyles: {
        2: { halign: 'right' },
      },
    });

    y = (pdf as any).lastAutoTable.finalY + 15;

    // Charges
    pdf.setFontSize(12);
    pdf.setTextColor(150, 0, 0);
    pdf.text('CHARGES (Dépenses)', 20, y);
    y += 8;

    const expenseRows = data.categories
      .filter((c) => c.type === 'expense')
      .map((c) => [
        c.account_number || '-',
        c.account_name || 'Dépense',
        `${c.annual_amount.toLocaleString('fr-FR')} €`,
      ]);

    expenseRows.push(['', 'TOTAL CHARGES', `${totalExpenses.toLocaleString('fr-FR')} €`]);

    autoTable(pdf, {
      startY: y,
      head: [['Compte', 'Libellé', 'Montant']],
      body: expenseRows,
      theme: 'grid',
      headStyles: { fillColor: [150, 0, 0] },
      styles: { fontSize: 9 },
      columnStyles: {
        2: { halign: 'right' },
      },
    });

    y = (pdf as any).lastAutoTable.finalY + 15;

    // Résultat
    pdf.setFontSize(14);
    pdf.setTextColor(netResult >= 0 ? 0 : 150, netResult >= 0 ? 100 : 0, 0);
    pdf.text(`RÉSULTAT NET : ${netResult.toLocaleString('fr-FR')} €`, 20, y);

    // ===== PAGE 4 : RÉPARTITION MENSUELLE =====
    pdf.addPage();
    y = 20;

    pdf.setFontSize(16);
    pdf.setTextColor(0, 51, 102);
    pdf.text('3. PRÉVISIONS MENSUELLES', 20, y);
    y += 15;

    // Calculer totaux mensuels
    const monthlyRevenue = Array(12).fill(0);
    const monthlyExpenses = Array(12).fill(0);

    data.categories.forEach((cat) => {
      cat.monthly_distribution.forEach((amount, i) => {
        if (cat.type === 'revenue') {
          monthlyRevenue[i] += amount;
        } else {
          monthlyExpenses[i] += amount;
        }
      });
    });

    const monthlyResult = monthlyRevenue.map((rev, i) => rev - monthlyExpenses[i]);
    const cumulativeResult: number[] = [];
    let cumul = 0;
    monthlyResult.forEach((val) => {
      cumul += val;
      cumulativeResult.push(cumul);
    });

    const monthlyData = MONTHS.map((month, i) => [
      month,
      `${Math.round(monthlyRevenue[i]).toLocaleString('fr-FR')}`,
      `${Math.round(monthlyExpenses[i]).toLocaleString('fr-FR')}`,
      `${Math.round(monthlyResult[i]).toLocaleString('fr-FR')}`,
      `${Math.round(cumulativeResult[i]).toLocaleString('fr-FR')}`,
    ]);

    autoTable(pdf, {
      startY: y,
      head: [['Mois', 'Produits (€)', 'Charges (€)', 'Résultat (€)', 'Cumul (€)']],
      body: monthlyData,
      theme: 'striped',
      headStyles: { fillColor: [0, 51, 102] },
      styles: { fontSize: 8, halign: 'right' },
      columnStyles: {
        0: { halign: 'left' },
      },
    });

    // ===== PAGE 5 : HYPOTHÈSES (si présentes) =====
    if (data.hypotheses && data.hypotheses.length > 0) {
      pdf.addPage();
      y = 20;

      pdf.setFontSize(16);
      pdf.setTextColor(0, 51, 102);
      pdf.text('4. HYPOTHÈSES DE TRAVAIL', 20, y);
      y += 15;

      const hypothesesRows = data.hypotheses.map((h) => [
        h.name,
        h.value,
        h.description || '',
      ]);

      autoTable(pdf, {
        startY: y,
        head: [['Hypothèse', 'Valeur', 'Description']],
        body: hypothesesRows,
        theme: 'striped',
        headStyles: { fillColor: [0, 51, 102] },
        styles: { fontSize: 9 },
      });
    }

    // ===== FOOTER sur toutes les pages =====
    const totalPages = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `${data.company.name} - Business Plan ${data.year} - Page ${i}/${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      pdf.text(
        `Généré par CassKai le ${new Date().toLocaleDateString('fr-FR')}`,
        pageWidth - 20,
        pageHeight - 10,
        { align: 'right' }
      );
    }

    return pdf.output('blob');
  },

  async downloadPDF(data: BudgetData, fileName?: string): Promise<void> {
    const blob = await this.generatePDF(data);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || `BusinessPlan_${data.company.name}_${data.year}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Génère un PDF à partir de données brutes de la DB (avec line_type)
   * Effectue le mapping automatiquement
   */
  async generatePDFFromDB(dataDB: BudgetDataDB): Promise<Blob> {
    const mappedData: BudgetData = {
      ...dataDB,
      categories: fromBudgetLinesDB(dataDB.categories),
    };
    return this.generatePDF(mappedData);
  },

  /**
   * Télécharge un PDF à partir de données brutes de la DB
   */
  async downloadPDFFromDB(dataDB: BudgetDataDB, fileName?: string): Promise<void> {
    const blob = await this.generatePDFFromDB(dataDB);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || `BusinessPlan_${dataDB.company.name}_${dataDB.year}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
