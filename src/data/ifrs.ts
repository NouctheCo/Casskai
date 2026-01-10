/**
 * Plan comptable IFRS for SMEs
 * Structure adaptée pour les pays africains anglophones (Nigeria, Ghana, Kenya, Afrique du Sud, etc.)
 * Basé sur IFRS for Small and Medium-sized Entities (IFRS for SMEs)
 */

export interface IFRSAccount {
  number: string;
  name: string;
  nameFr: string;
  nameEs: string;
  class: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parent?: string;
}

export const IFRS_CLASSES = [
  { number: '1', name: 'Non-current Assets', nameFr: 'Actifs non courants', nameEs: 'Activos no corrientes' },
  { number: '2', name: 'Current Assets', nameFr: 'Actifs courants', nameEs: 'Activos corrientes' },
  { number: '3', name: 'Equity', nameFr: 'Capitaux propres', nameEs: 'Patrimonio neto' },
  { number: '4', name: 'Non-current Liabilities', nameFr: 'Passifs non courants', nameEs: 'Pasivos no corrientes' },
  { number: '5', name: 'Current Liabilities', nameFr: 'Passifs courants', nameEs: 'Pasivos corrientes' },
  { number: '6', name: 'Revenue', nameFr: 'Produits', nameEs: 'Ingresos' },
  { number: '7', name: 'Expenses', nameFr: 'Charges', nameEs: 'Gastos' },
];

export const IFRS_ACCOUNTS: IFRSAccount[] = [
  // ============================================================================
  // CLASS 1: NON-CURRENT ASSETS (Actifs non courants / Activos no corrientes)
  // ============================================================================
  { number: '1100', name: 'Property, Plant & Equipment', nameFr: 'Immobilisations corporelles', nameEs: 'Inmovilizado material', class: '1', type: 'asset' },
  { number: '1110', name: 'Land', nameFr: 'Terrains', nameEs: 'Terrenos', class: '1', type: 'asset', parent: '1100' },
  { number: '1120', name: 'Buildings', nameFr: 'Constructions', nameEs: 'Edificios', class: '1', type: 'asset', parent: '1100' },
  { number: '1130', name: 'Machinery & Equipment', nameFr: 'Matériel et équipements', nameEs: 'Maquinaria y equipos', class: '1', type: 'asset', parent: '1100' },
  { number: '1140', name: 'Motor Vehicles', nameFr: 'Matériel de transport', nameEs: 'Vehículos', class: '1', type: 'asset', parent: '1100' },
  { number: '1150', name: 'Furniture & Fixtures', nameFr: 'Mobilier et agencements', nameEs: 'Mobiliario y enseres', class: '1', type: 'asset', parent: '1100' },
  { number: '1160', name: 'Computer Equipment', nameFr: 'Matériel informatique', nameEs: 'Equipos informáticos', class: '1', type: 'asset', parent: '1100' },

  { number: '1200', name: 'Intangible Assets', nameFr: 'Immobilisations incorporelles', nameEs: 'Inmovilizado intangible', class: '1', type: 'asset' },
  { number: '1210', name: 'Goodwill', nameFr: 'Fonds de commerce', nameEs: 'Fondo de comercio', class: '1', type: 'asset', parent: '1200' },
  { number: '1220', name: 'Patents & Trademarks', nameFr: 'Brevets et marques', nameEs: 'Patentes y marcas', class: '1', type: 'asset', parent: '1200' },
  { number: '1230', name: 'Software', nameFr: 'Logiciels', nameEs: 'Software', class: '1', type: 'asset', parent: '1200' },

  { number: '1300', name: 'Financial Assets', nameFr: 'Actifs financiers', nameEs: 'Activos financieros', class: '1', type: 'asset' },
  { number: '1310', name: 'Investments in Subsidiaries', nameFr: 'Participations dans les filiales', nameEs: 'Inversiones en filiales', class: '1', type: 'asset', parent: '1300' },
  { number: '1320', name: 'Long-term Investments', nameFr: 'Placements à long terme', nameEs: 'Inversiones a largo plazo', class: '1', type: 'asset', parent: '1300' },

  // ============================================================================
  // CLASS 2: CURRENT ASSETS (Actifs courants / Activos corrientes)
  // ============================================================================
  { number: '2100', name: 'Inventories', nameFr: 'Stocks', nameEs: 'Inventarios', class: '2', type: 'asset' },
  { number: '2110', name: 'Raw Materials', nameFr: 'Matières premières', nameEs: 'Materias primas', class: '2', type: 'asset', parent: '2100' },
  { number: '2120', name: 'Work in Progress', nameFr: 'Produits en cours', nameEs: 'Productos en curso', class: '2', type: 'asset', parent: '2100' },
  { number: '2130', name: 'Finished Goods', nameFr: 'Produits finis', nameEs: 'Productos terminados', class: '2', type: 'asset', parent: '2100' },
  { number: '2140', name: 'Goods for Resale', nameFr: 'Marchandises', nameEs: 'Mercancías', class: '2', type: 'asset', parent: '2100' },

  { number: '2200', name: 'Trade Receivables', nameFr: 'Créances clients', nameEs: 'Cuentas por cobrar comerciales', class: '2', type: 'asset' },
  { number: '2210', name: 'Accounts Receivable', nameFr: 'Clients', nameEs: 'Clientes', class: '2', type: 'asset', parent: '2200' },
  { number: '2220', name: 'Allowance for Doubtful Debts', nameFr: 'Provisions pour créances douteuses', nameEs: 'Provisión para deudas incobrables', class: '2', type: 'asset', parent: '2200' },

  { number: '2300', name: 'Other Receivables', nameFr: 'Autres créances', nameEs: 'Otras cuentas por cobrar', class: '2', type: 'asset' },
  { number: '2310', name: 'Prepayments', nameFr: 'Charges constatées d\'avance', nameEs: 'Gastos anticipados', class: '2', type: 'asset', parent: '2300' },
  { number: '2320', name: 'Staff Advances', nameFr: 'Avances au personnel', nameEs: 'Anticipos al personal', class: '2', type: 'asset', parent: '2300' },
  { number: '2330', name: 'VAT Recoverable', nameFr: 'TVA récupérable', nameEs: 'IVA recuperable', class: '2', type: 'asset', parent: '2300' },

  { number: '2400', name: 'Cash & Cash Equivalents', nameFr: 'Trésorerie', nameEs: 'Efectivo y equivalentes', class: '2', type: 'asset' },
  { number: '2410', name: 'Bank Accounts', nameFr: 'Banques', nameEs: 'Cuentas bancarias', class: '2', type: 'asset', parent: '2400' },
  { number: '2420', name: 'Petty Cash', nameFr: 'Caisse', nameEs: 'Caja chica', class: '2', type: 'asset', parent: '2400' },
  { number: '2430', name: 'Short-term Deposits', nameFr: 'Dépôts à court terme', nameEs: 'Depósitos a corto plazo', class: '2', type: 'asset', parent: '2400' },

  // ============================================================================
  // CLASS 3: EQUITY (Capitaux propres / Patrimonio neto)
  // ============================================================================
  { number: '3100', name: 'Share Capital', nameFr: 'Capital social', nameEs: 'Capital social', class: '3', type: 'equity' },
  { number: '3110', name: 'Ordinary Shares', nameFr: 'Actions ordinaires', nameEs: 'Acciones ordinarias', class: '3', type: 'equity', parent: '3100' },
  { number: '3120', name: 'Preference Shares', nameFr: 'Actions privilégiées', nameEs: 'Acciones preferentes', class: '3', type: 'equity', parent: '3100' },

  { number: '3200', name: 'Share Premium', nameFr: 'Prime d\'émission', nameEs: 'Prima de emisión', class: '3', type: 'equity' },

  { number: '3300', name: 'Retained Earnings', nameFr: 'Résultats reportés', nameEs: 'Resultados acumulados', class: '3', type: 'equity' },
  { number: '3310', name: 'Current Year Profit/Loss', nameFr: 'Résultat de l\'exercice', nameEs: 'Resultado del ejercicio', class: '3', type: 'equity', parent: '3300' },
  { number: '3320', name: 'Prior Year Retained Earnings', nameFr: 'Report à nouveau', nameEs: 'Resultados de ejercicios anteriores', class: '3', type: 'equity', parent: '3300' },

  { number: '3400', name: 'Other Reserves', nameFr: 'Autres réserves', nameEs: 'Otras reservas', class: '3', type: 'equity' },
  { number: '3410', name: 'Revaluation Reserve', nameFr: 'Réserve de réévaluation', nameEs: 'Reserva de revaluación', class: '3', type: 'equity', parent: '3400' },
  { number: '3420', name: 'General Reserve', nameFr: 'Réserve générale', nameEs: 'Reserva general', class: '3', type: 'equity', parent: '3400' },

  // ============================================================================
  // CLASS 4: NON-CURRENT LIABILITIES (Passifs non courants / Pasivos no corrientes)
  // ============================================================================
  { number: '4100', name: 'Long-term Borrowings', nameFr: 'Emprunts à long terme', nameEs: 'Préstamos a largo plazo', class: '4', type: 'liability' },
  { number: '4110', name: 'Bank Loans - Long-term', nameFr: 'Emprunts bancaires long terme', nameEs: 'Préstamos bancarios a largo plazo', class: '4', type: 'liability', parent: '4100' },
  { number: '4120', name: 'Bonds Payable', nameFr: 'Obligations', nameEs: 'Bonos por pagar', class: '4', type: 'liability', parent: '4100' },

  { number: '4200', name: 'Deferred Tax Liabilities', nameFr: 'Impôts différés passifs', nameEs: 'Pasivos por impuestos diferidos', class: '4', type: 'liability' },

  { number: '4300', name: 'Provisions - Long-term', nameFr: 'Provisions à long terme', nameEs: 'Provisiones a largo plazo', class: '4', type: 'liability' },
  { number: '4310', name: 'Employee Benefits', nameFr: 'Avantages du personnel', nameEs: 'Beneficios a empleados', class: '4', type: 'liability', parent: '4300' },
  { number: '4320', name: 'Warranties', nameFr: 'Garanties', nameEs: 'Garantías', class: '4', type: 'liability', parent: '4300' },

  // ============================================================================
  // CLASS 5: CURRENT LIABILITIES (Passifs courants / Pasivos corrientes)
  // ============================================================================
  { number: '5100', name: 'Trade Payables', nameFr: 'Dettes fournisseurs', nameEs: 'Cuentas por pagar comerciales', class: '5', type: 'liability' },
  { number: '5110', name: 'Accounts Payable', nameFr: 'Fournisseurs', nameEs: 'Proveedores', class: '5', type: 'liability', parent: '5100' },
  { number: '5120', name: 'Bills Payable', nameFr: 'Effets à payer', nameEs: 'Efectos a pagar', class: '5', type: 'liability', parent: '5100' },

  { number: '5200', name: 'Short-term Borrowings', nameFr: 'Emprunts à court terme', nameEs: 'Préstamos a corto plazo', class: '5', type: 'liability' },
  { number: '5210', name: 'Bank Overdraft', nameFr: 'Découvert bancaire', nameEs: 'Sobregiro bancario', class: '5', type: 'liability', parent: '5200' },
  { number: '5220', name: 'Short-term Loans', nameFr: 'Emprunts court terme', nameEs: 'Préstamos a corto plazo', class: '5', type: 'liability', parent: '5200' },

  { number: '5300', name: 'Tax Payables', nameFr: 'Dettes fiscales', nameEs: 'Impuestos por pagar', class: '5', type: 'liability' },
  { number: '5310', name: 'VAT Payable', nameFr: 'TVA à payer', nameEs: 'IVA por pagar', class: '5', type: 'liability', parent: '5300' },
  { number: '5320', name: 'Corporate Tax Payable', nameFr: 'Impôt sur les sociétés à payer', nameEs: 'Impuesto sobre sociedades por pagar', class: '5', type: 'liability', parent: '5300' },
  { number: '5330', name: 'Withholding Tax Payable', nameFr: 'Retenue à la source à payer', nameEs: 'Retenciones por pagar', class: '5', type: 'liability', parent: '5300' },
  { number: '5340', name: 'PAYE Payable', nameFr: 'Charges salariales à payer', nameEs: 'Impuesto sobre nómina por pagar', class: '5', type: 'liability', parent: '5300' },

  { number: '5400', name: 'Other Payables', nameFr: 'Autres dettes', nameEs: 'Otras cuentas por pagar', class: '5', type: 'liability' },
  { number: '5410', name: 'Accrued Expenses', nameFr: 'Charges à payer', nameEs: 'Gastos acumulados', class: '5', type: 'liability', parent: '5400' },
  { number: '5420', name: 'Dividends Payable', nameFr: 'Dividendes à payer', nameEs: 'Dividendos por pagar', class: '5', type: 'liability', parent: '5400' },
  { number: '5430', name: 'Customer Deposits', nameFr: 'Acomptes clients', nameEs: 'Depósitos de clientes', class: '5', type: 'liability', parent: '5400' },

  // ============================================================================
  // CLASS 6: REVENUE (Produits / Ingresos)
  // ============================================================================
  { number: '6100', name: 'Revenue from Sales', nameFr: 'Chiffre d\'affaires', nameEs: 'Ingresos por ventas', class: '6', type: 'revenue' },
  { number: '6110', name: 'Sales of Goods', nameFr: 'Ventes de marchandises', nameEs: 'Ventas de bienes', class: '6', type: 'revenue', parent: '6100' },
  { number: '6120', name: 'Services Revenue', nameFr: 'Prestations de services', nameEs: 'Ingresos por servicios', class: '6', type: 'revenue', parent: '6100' },
  { number: '6130', name: 'Sales Returns & Allowances', nameFr: 'Retours et rabais sur ventes', nameEs: 'Devoluciones y descuentos sobre ventas', class: '6', type: 'revenue', parent: '6100' },
  { number: '6140', name: 'Sales Discounts', nameFr: 'Remises sur ventes', nameEs: 'Descuentos sobre ventas', class: '6', type: 'revenue', parent: '6100' },

  { number: '6200', name: 'Other Income', nameFr: 'Autres produits', nameEs: 'Otros ingresos', class: '6', type: 'revenue' },
  { number: '6210', name: 'Rental Income', nameFr: 'Revenus locatifs', nameEs: 'Ingresos por alquileres', class: '6', type: 'revenue', parent: '6200' },
  { number: '6220', name: 'Gain on Sale of Assets', nameFr: 'Plus-value sur cession d\'actifs', nameEs: 'Ganancia por venta de activos', class: '6', type: 'revenue', parent: '6200' },
  { number: '6230', name: 'Miscellaneous Income', nameFr: 'Produits divers', nameEs: 'Ingresos diversos', class: '6', type: 'revenue', parent: '6200' },

  { number: '6300', name: 'Finance Income', nameFr: 'Produits financiers', nameEs: 'Ingresos financieros', class: '6', type: 'revenue' },
  { number: '6310', name: 'Interest Income', nameFr: 'Produits d\'intérêts', nameEs: 'Ingresos por intereses', class: '6', type: 'revenue', parent: '6300' },
  { number: '6320', name: 'Dividend Income', nameFr: 'Revenus de dividendes', nameEs: 'Ingresos por dividendos', class: '6', type: 'revenue', parent: '6300' },
  { number: '6330', name: 'Foreign Exchange Gains', nameFr: 'Gains de change', nameEs: 'Ganancias por tipo de cambio', class: '6', type: 'revenue', parent: '6300' },

  // ============================================================================
  // CLASS 7: EXPENSES (Charges / Gastos)
  // ============================================================================
  { number: '7100', name: 'Cost of Sales', nameFr: 'Coût des ventes', nameEs: 'Costo de ventas', class: '7', type: 'expense' },
  { number: '7110', name: 'Cost of Goods Sold', nameFr: 'Coût des marchandises vendues', nameEs: 'Costo de bienes vendidos', class: '7', type: 'expense', parent: '7100' },
  { number: '7120', name: 'Direct Labour', nameFr: 'Main-d\'œuvre directe', nameEs: 'Mano de obra directa', class: '7', type: 'expense', parent: '7100' },
  { number: '7130', name: 'Manufacturing Overheads', nameFr: 'Frais généraux de production', nameEs: 'Costos indirectos de fabricación', class: '7', type: 'expense', parent: '7100' },

  { number: '7200', name: 'Employee Benefits', nameFr: 'Charges de personnel', nameEs: 'Beneficios a empleados', class: '7', type: 'expense' },
  { number: '7210', name: 'Salaries & Wages', nameFr: 'Salaires et traitements', nameEs: 'Sueldos y salarios', class: '7', type: 'expense', parent: '7200' },
  { number: '7220', name: 'Social Security Costs', nameFr: 'Charges sociales', nameEs: 'Costos de seguridad social', class: '7', type: 'expense', parent: '7200' },
  { number: '7230', name: 'Pension Contributions', nameFr: 'Cotisations de retraite', nameEs: 'Contribuciones de pensión', class: '7', type: 'expense', parent: '7200' },
  { number: '7240', name: 'Staff Training', nameFr: 'Formation du personnel', nameEs: 'Capacitación del personal', class: '7', type: 'expense', parent: '7200' },
  { number: '7250', name: 'Staff Welfare', nameFr: 'Œuvres sociales', nameEs: 'Bienestar del personal', class: '7', type: 'expense', parent: '7200' },

  { number: '7300', name: 'Depreciation & Amortisation', nameFr: 'Dotations aux amortissements', nameEs: 'Depreciación y amortización', class: '7', type: 'expense' },
  { number: '7310', name: 'Depreciation - Buildings', nameFr: 'Amortissements - Constructions', nameEs: 'Depreciación - Edificios', class: '7', type: 'expense', parent: '7300' },
  { number: '7320', name: 'Depreciation - Machinery', nameFr: 'Amortissements - Matériel', nameEs: 'Depreciación - Maquinaria', class: '7', type: 'expense', parent: '7300' },
  { number: '7330', name: 'Depreciation - Vehicles', nameFr: 'Amortissements - Véhicules', nameEs: 'Depreciación - Vehículos', class: '7', type: 'expense', parent: '7300' },
  { number: '7340', name: 'Amortisation - Intangibles', nameFr: 'Amortissements - Immobilisations incorporelles', nameEs: 'Amortización - Intangibles', class: '7', type: 'expense', parent: '7300' },

  { number: '7400', name: 'Other Operating Expenses', nameFr: 'Autres charges d\'exploitation', nameEs: 'Otros gastos operativos', class: '7', type: 'expense' },
  { number: '7410', name: 'Rent', nameFr: 'Loyers', nameEs: 'Alquileres', class: '7', type: 'expense', parent: '7400' },
  { number: '7420', name: 'Utilities', nameFr: 'Charges d\'électricité et eau', nameEs: 'Servicios públicos', class: '7', type: 'expense', parent: '7400' },
  { number: '7430', name: 'Insurance', nameFr: 'Assurances', nameEs: 'Seguros', class: '7', type: 'expense', parent: '7400' },
  { number: '7440', name: 'Professional Fees', nameFr: 'Honoraires professionnels', nameEs: 'Honorarios profesionales', class: '7', type: 'expense', parent: '7400' },
  { number: '7450', name: 'Repairs & Maintenance', nameFr: 'Entretien et réparations', nameEs: 'Reparaciones y mantenimiento', class: '7', type: 'expense', parent: '7400' },
  { number: '7460', name: 'Advertising & Marketing', nameFr: 'Publicité et marketing', nameEs: 'Publicidad y marketing', class: '7', type: 'expense', parent: '7400' },
  { number: '7470', name: 'Travel & Entertainment', nameFr: 'Déplacements et représentation', nameEs: 'Viajes y entretenimiento', class: '7', type: 'expense', parent: '7400' },
  { number: '7480', name: 'Office Expenses', nameFr: 'Fournitures de bureau', nameEs: 'Gastos de oficina', class: '7', type: 'expense', parent: '7400' },
  { number: '7490', name: 'Communication Expenses', nameFr: 'Frais de communication', nameEs: 'Gastos de comunicación', class: '7', type: 'expense', parent: '7400' },

  { number: '7500', name: 'Finance Costs', nameFr: 'Charges financières', nameEs: 'Costos financieros', class: '7', type: 'expense' },
  { number: '7510', name: 'Interest Expense', nameFr: 'Charges d\'intérêts', nameEs: 'Gastos por intereses', class: '7', type: 'expense', parent: '7500' },
  { number: '7520', name: 'Bank Charges', nameFr: 'Frais bancaires', nameEs: 'Comisiones bancarias', class: '7', type: 'expense', parent: '7500' },
  { number: '7530', name: 'Foreign Exchange Losses', nameFr: 'Pertes de change', nameEs: 'Pérdidas por tipo de cambio', class: '7', type: 'expense', parent: '7500' },

  { number: '7600', name: 'Tax Expense', nameFr: 'Charge d\'impôt', nameEs: 'Gasto por impuestos', class: '7', type: 'expense' },
  { number: '7610', name: 'Corporate Tax', nameFr: 'Impôt sur les sociétés', nameEs: 'Impuesto sobre sociedades', class: '7', type: 'expense', parent: '7600' },
  { number: '7620', name: 'Deferred Tax', nameFr: 'Impôts différés', nameEs: 'Impuesto diferido', class: '7', type: 'expense', parent: '7600' },

  { number: '7700', name: 'Other Expenses', nameFr: 'Autres charges', nameEs: 'Otros gastos', class: '7', type: 'expense' },
  { number: '7710', name: 'Bad Debts', nameFr: 'Créances irrécouvrables', nameEs: 'Deudas incobrables', class: '7', type: 'expense', parent: '7700' },
  { number: '7720', name: 'Loss on Sale of Assets', nameFr: 'Moins-value sur cession d\'actifs', nameEs: 'Pérdida por venta de activos', class: '7', type: 'expense', parent: '7700' },
  { number: '7730', name: 'Donations & Contributions', nameFr: 'Dons et contributions', nameEs: 'Donaciones y contribuciones', class: '7', type: 'expense', parent: '7700' },
];

/**
 * Récupère les comptes par classe
 */
export function getIFRSAccountsByClass(classNumber: string): IFRSAccount[] {
  return IFRS_ACCOUNTS.filter(acc => acc.class === classNumber);
}

/**
 * Récupère un compte par son numéro
 */
export function getIFRSAccountByNumber(number: string): IFRSAccount | undefined {
  return IFRS_ACCOUNTS.find(acc => acc.number === number);
}

/**
 * Récupère tous les comptes parents (sans parent)
 */
export function getIFRSParentAccounts(): IFRSAccount[] {
  return IFRS_ACCOUNTS.filter(acc => !acc.parent);
}

/**
 * Récupère les comptes enfants d'un compte parent
 */
export function getIFRSChildAccounts(parentNumber: string): IFRSAccount[] {
  return IFRS_ACCOUNTS.filter(acc => acc.parent === parentNumber);
}
