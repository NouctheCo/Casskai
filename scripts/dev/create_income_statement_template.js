const { reportsService } = require('./src/services/reportsService.ts');

// Template pour le Compte de Résultat SYSCOHADA
const incomeStatementTemplate = {
  name: 'Compte de Résultat SYSCOHADA',
  description: 'Modèle de compte de résultat conforme au système comptable SYSCOHADA',
  type: 'income_statement',
  sections: [
    {
      name: 'PRODUITS D\'EXPLOITATION',
      items: [
        { name: 'Ventes de marchandises', account_codes: ['7000-7099'], calculation_type: 'sum', format: 'currency', show_in_summary: true },
        { name: 'Prestations de services', account_codes: ['7100-7199'], calculation_type: 'sum', format: 'currency', show_in_summary: true },
        { name: 'Production stockée', account_codes: ['7200-7299'], calculation_type: 'sum', format: 'currency', show_in_summary: true },
        { name: 'Production immobilisée', account_codes: ['7300-7399'], calculation_type: 'sum', format: 'currency', show_in_summary: true },
        { name: 'Subventions d\'exploitation', account_codes: ['7400-7499'], calculation_type: 'sum', format: 'currency', show_in_summary: true },
        { name: 'Autres produits d\'exploitation', account_codes: ['7500-7599'], calculation_type: 'sum', format: 'currency', show_in_summary: true }
      ]
    },
    {
      name: 'CHARGES D\'EXPLOITATION',
      items: [
        { name: 'Achats de marchandises', account_codes: ['6000-6099'], calculation_type: 'sum', format: 'currency', show_in_summary: true },
        { name: 'Variation stocks marchandises', account_codes: ['6030-6039'], calculation_type: 'sum', format: 'currency', show_in_summary: true },
        { name: 'Achats de matières premières', account_codes: ['6100-6199'], calculation_type: 'sum', format: 'currency', show_in_summary: true },
        { name: 'Variation stocks matières', account_codes: ['6130-6139'], calculation_type: 'sum', format: 'currency', show_in_summary: true },
        { name: 'Autres achats', account_codes: ['6200-6299'], calculation_type: 'sum', format: 'currency', show_in_summary: true },
        { name: 'Charges de personnel', account_codes: ['6400-6499'], calculation_type: 'sum', format: 'currency', show_in_summary: true },
        { name: 'Impôts et taxes', account_codes: ['6300-6399'], calculation_type: 'sum', format: 'currency', show_in_summary: true },
        { name: 'Autres charges d\'exploitation', account_codes: ['6500-6599'], calculation_type: 'sum', format: 'currency', show_in_summary: true }
      ]
    },
    {
      name: 'RÉSULTAT D\'EXPLOITATION',
      items: [
        { name: 'Résultat d\'exploitation', account_codes: [], calculation_type: 'difference', format: 'currency', show_in_summary: true }
      ]
    },
    {
      name: 'PRODUITS FINANCIERS',
      items: [
        { name: 'Produits de participations', account_codes: ['7600-7699'], calculation_type: 'sum', format: 'currency', show_in_summary: true },
        { name: 'Autres intérêts et produits assimilés', account_codes: ['7700-7799'], calculation_type: 'sum', format: 'currency', show_in_summary: true }
      ]
    },
    {
      name: 'CHARGES FINANCIÈRES',
      items: [
        { name: 'Intérêts et charges assimilées', account_codes: ['7800-7899'], calculation_type: 'sum', format: 'currency', show_in_summary: true },
        { name: 'Pertes sur créances', account_codes: ['7900-7999'], calculation_type: 'sum', format: 'currency', show_in_summary: true }
      ]
    },
    {
      name: 'RÉSULTAT FINANCIER',
      items: [
        { name: 'Résultat financier', account_codes: [], calculation_type: 'difference', format: 'currency', show_in_summary: true }
      ]
    },
    {
      name: 'RÉSULTAT NET',
      items: [
        { name: 'Résultat net', account_codes: [], calculation_type: 'difference', format: 'currency', show_in_summary: true }
      ]
    }
  ]
};

async function createTemplate() {
  try {
    const result = await reportsService.createTemplate('company-1', incomeStatementTemplate);
    console.log('Template créé avec succès:', result);
  } catch (error) {
    console.error('Erreur lors de la création du template:', error);
  }
}

createTemplate();
