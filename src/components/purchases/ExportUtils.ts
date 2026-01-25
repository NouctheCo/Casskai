import { Purchase } from '../../types/purchase.types';
import { getCurrentCompanyCurrency } from '@/lib/utils';

export const exportToCsv = (purchases: Purchase[], filename: string = 'achats') => {
  const headers = [
    'Numéro facture',
    'Date d\'achat',
    'Fournisseur',
    'Description',
    'Montant HT (€)',
    'TVA (€)',
    'Montant TTC (€)',
    'Taux TVA (%)',
    'Statut paiement',
    'Date de paiement',
    'Date d\'échéance',
    'Date de création'
  ];

  const csvData = [
    headers.join(','),
    ...purchases.map(purchase => [
      `"${purchase.invoice_number}"`,
      purchase.purchase_date,
      `"${purchase.supplier_name}"`,
      `"${purchase.description.replace(/"/g, '""')}"`,
      purchase.amount_ht.toFixed(2),
      purchase.tva_amount.toFixed(2),
      purchase.amount_ttc.toFixed(2),
      purchase.tva_rate.toString(),
      purchase.payment_status,
      purchase.payment_date || '',
      purchase.due_date,
      purchase.created_at.split('T')[0]
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generatePdfReport = (purchases: Purchase[], filters: any) => {
  // Simulate PDF generation - in real implementation, you would use a library like jsPDF
  const reportData = {
    title: 'Rapport des Achats',
    generatedDate: new Date().toLocaleDateString('fr-FR'),
    filters: {
      dateRange: filters.date_from && filters.date_to 
        ? `Du ${new Date(filters.date_from).toLocaleDateString('fr-FR')} au ${new Date(filters.date_to).toLocaleDateString('fr-FR')}`
        : 'Toutes les dates',
      supplier: filters.supplier_id ? 'Fournisseur sélectionné' : 'Tous les fournisseurs',
      status: filters.payment_status && filters.payment_status !== 'all' 
        ? `Statut: ${filters.payment_status}` 
        : 'Tous les statuts'
    },
    summary: {
      totalPurchases: purchases.length,
      totalAmount: purchases.reduce((sum, p) => sum + p.amount_ttc, 0),
      paidAmount: purchases.filter(p => p.payment_status === 'paid').reduce((sum, p) => sum + p.amount_ttc, 0),
      pendingAmount: purchases.filter(p => p.payment_status === 'pending').reduce((sum, p) => sum + p.amount_ttc, 0),
      overdueAmount: purchases.filter(p => p.payment_status === 'overdue').reduce((sum, p) => sum + p.amount_ttc, 0)
    },
    purchases: purchases.map(p => ({
      invoice_number: p.invoice_number,
      date: new Date(p.purchase_date).toLocaleDateString('fr-FR'),
      supplier: p.supplier_name,
      amount: p.amount_ttc,
      status: p.payment_status
    }))
  };

  // For now, we'll create a simple HTML structure that could be converted to PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${reportData.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .filters { background: #f5f5f5; padding: 15px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; }
        .summary-item { background: white; padding: 15px; border: 1px solid #ddd; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .status-paid { color: green; }
        .status-pending { color: orange; }
        .status-overdue { color: red; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${reportData.title}</h1>
        <p>Généré le ${reportData.generatedDate}</p>
      </div>
      
      <div class="filters">
        <h3>Filtres appliqués:</h3>
        <p><strong>Période:</strong> ${reportData.filters.dateRange}</p>
        <p><strong>Fournisseur:</strong> ${reportData.filters.supplier}</p>
        <p><strong>Statut:</strong> ${reportData.filters.status}</p>
      </div>
      
      <div class="summary">
        <div class="summary-item">
          <h4>Nombre total d'achats</h4>
          <p><strong>${reportData.summary.totalPurchases}</strong></p>
        </div>
        <div class="summary-item">
            <h4>Montant total</h4>
            <p><strong>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: getCurrentCompanyCurrency() }).format(reportData.summary.totalAmount)}</strong></p>
          </div>
          <div class="summary-item">
            <h4>Montant payé</h4>
            <p><strong>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: getCurrentCompanyCurrency() }).format(reportData.summary.paidAmount)}</strong></p>
          </div>
          <div class="summary-item">
            <h4>Montant en attente</h4>
            <p><strong>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: getCurrentCompanyCurrency() }).format(reportData.summary.pendingAmount + reportData.summary.overdueAmount)}</strong></p>
          </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>N° Facture</th>
            <th>Date</th>
            <th>Fournisseur</th>
            <th>Montant TTC</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.purchases.map(p => `
            <tr>
              <td>${p.invoice_number}</td>
              <td>${p.date}</td>
              <td>${p.supplier}</td>
              <td>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: getCurrentCompanyCurrency() }).format(p.amount)}</td>
              <td class="status-${p.status}">${p.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Open in new window for printing/PDF conversion
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Trigger print dialog after content loads
    printWindow.onload = () => {
      printWindow.print();
    };
  }

  return reportData;
};
