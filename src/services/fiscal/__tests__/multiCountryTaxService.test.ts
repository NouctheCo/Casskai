import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../FrenchTaxComplianceService', () => {
  return {
    frenchTaxComplianceService: {
      generateCA3Declaration: vi.fn(async () => ({
        id: 'ca3-1',
        type: 'CA3',
        period: '2025-01',
        status: 'ready',
        dueDate: new Date('2025-02-15'),
        data: {
          ventes_france_taux_normal: 100,
          ventes_france_taux_intermediaire: 50,
          ventes_france_taux_reduit: 0,
          ventes_france_taux_particulier: 0,
          autres_operations_imposables: 10,
          regularisations_tva_collectee: 5,
          achats_tva_deductible: 20,
          immobilisations_tva_deductible: 5,
          autres_biens_services_tva_deductible: 2,
          regularisations_tva_deductible: 1,
          tva_nette_due: 0,
          tva_a_payer: 0,
          credit_a_reporter: 0
        }
      })),
      generateLiasseFiscale: vi.fn(async () => ([
        {
          id: '2058-1',
          type: 'LIASSE_2058',
          period: '2025',
          status: 'ready',
          dueDate: new Date('2026-05-01'),
          data: {
            resultat_fiscal: 1000
          }
        }
      ])),
      generateFEC: vi.fn(async () => 'FEC_CONTENT'),
      validateAccountingTaxConsistency: vi.fn(async () => ({
        errors: [],
        warnings: [],
        checks: [{ status: 'ok' }]
      }))
    }
  };
});

const mockService = {
  generateVATDeclaration: vi.fn(async () => ({
    id: 'vat-1',
    type: 'TVA',
    period: '2025-01',
    status: 'ready',
    dueDate: new Date('2025-02-15'),
    data: {
      tvaCollectee: 200,
      tvaDeductible: { total: 50 },
      tvaNette: 150,
      tvaAPayer: 150
    }
  })),
  generateCorporateTaxDeclaration: vi.fn(async () => ({
    id: 'is-1',
    type: 'IMPOT_SOCIETES',
    period: '2025',
    status: 'ready',
    dueDate: new Date('2026-04-30'),
    data: {
      resultatFiscal: 10000,
      impotCalcule: 2500,
      impotAPayer: 2500
    }
  })),
  generateDSF: vi.fn(async () => ({
    id: 'dsf-1',
    type: 'DSF_COMPLETE',
    period: '2025',
    status: 'ready',
    dueDate: new Date('2026-04-30'),
    data: { ok: true }
  })),
  generateG50Algeria: vi.fn(async () => ({
    id: 'g50-1',
    type: 'G50',
    period: '2025-01',
    status: 'ready',
    dueDate: new Date('2025-01-20'),
    data: { tvaAPayer: 123 }
  })),
  generateIBSAlgeria: vi.fn(async () => ({
    id: 'ibs-1',
    type: 'IBS',
    period: '2025',
    status: 'ready',
    dueDate: new Date('2026-05-01'),
    data: { soldeAPayer: 456 }
  })),
  generateBalanceSheet: vi.fn(async () => ({
    id: 'bs-1',
    type: 'BALANCE_SHEET',
    period: '2025',
    status: 'ready',
    dueDate: new Date('2026-05-01'),
    data: { ok: true }
  })),
  generateIncomeStatement: vi.fn(async () => ({
    id: 'is-2',
    type: 'INCOME_STATEMENT',
    period: '2025',
    status: 'ready',
    dueDate: new Date('2026-05-01'),
    data: { ok: true }
  }))
};

vi.mock('../FiscalServiceFactory', () => {
  return {
    FiscalServiceFactory: {
      isCountrySupported: vi.fn((code: string) => ['SN', 'DZ'].includes(code)),
      getServiceForCountry: vi.fn((_code: string) => mockService)
    }
  };
});

import { MultiCountryTaxService } from '../MultiCountryTaxService';
import { mapDeclarationTypeToRegulatoryDocumentType } from '../multiCountryRegulatoryExportService';

describe('MultiCountryTaxService (smoke)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates FR VAT from CA3 fields', async () => {
    const service = MultiCountryTaxService.getInstance();
    const vat = await service.calculateVAT('company-1', 'FR', '2025-01');

    expect(vat.countryCode).toBe('FR');
    expect(vat.totalVAT).toBe(165); // 100 + 50 + 10 + 5
    expect(vat.deductibleVAT).toBe(28); // 20 + 5 + 2 + 1
    expect(vat.netVAT).toBe(137);
  });

  it('calculates non-FR VAT via FiscalServiceFactory service', async () => {
    const service = MultiCountryTaxService.getInstance();
    const vat = await service.calculateVAT('company-1', 'SN', '2025-01');

    expect(vat.countryCode).toBe('SN');
    expect(vat.totalVAT).toBe(200);
    expect(vat.deductibleVAT).toBe(50);
    expect(vat.netVAT).toBe(150);
  });

  it('calculates FR corporate tax from liasse 2058 resultat_fiscal', async () => {
    const service = MultiCountryTaxService.getInstance();
    const corp = await service.calculateCorporateTax('company-1', 'FR', '2025');

    expect(corp.countryCode).toBe('FR');
    expect(corp.taxableIncome).toBe(1000);
    expect(corp.corporateTax).toBeGreaterThanOrEqual(0);
  });

  it('generates DSF for OHADA when requested', async () => {
    const service = MultiCountryTaxService.getInstance();
    const decl = await service.generateDeclaration('company-1', 'SN', 'DSF', '2025');

    expect(decl.type).toBe('DSF_COMPLETE');
  });

  it('generates Algeria G50 when requested', async () => {
    const service = MultiCountryTaxService.getInstance();
    const decl = await service.generateDeclaration('company-1', 'DZ', 'G50', '2025-01');

    expect(decl.type).toBe('G50');
    expect(decl.amount).toBe(123);
  });

  it('exports a PDF draft (bytes) for non-FR countries', async () => {
    const service = MultiCountryTaxService.getInstance();
    const exportResult = await service.exportTaxData('company-1', 'SN', '2025-01', 'pdf');

    expect(exportResult.mimeType).toBe('application/pdf');
    expect(exportResult.filename).toContain('tax_export_SN_2025-01');
    expect(exportResult.content).toBeInstanceOf(ArrayBuffer);
  });
});

describe('multiCountryRegulatoryExportService mapping (smoke)', () => {
  it('maps SN VAT declaration ids to SN_TVA', () => {
    expect(mapDeclarationTypeToRegulatoryDocumentType('SN', 'DECLARATION_TVA_SN')).toBe('SN_TVA');
  });

  it('maps GH VAT return ids to GH_VAT', () => {
    expect(mapDeclarationTypeToRegulatoryDocumentType('GH', 'VAT_RETURN_GH')).toBe('GH_VAT');
  });

  it('maps DZ VAT/G50 to DZ_TVA_G50', () => {
    expect(mapDeclarationTypeToRegulatoryDocumentType('DZ', 'G50')).toBe('DZ_TVA_G50');
    expect(mapDeclarationTypeToRegulatoryDocumentType('DZ', 'DECLARATION_TVA_DZ')).toBe('DZ_TVA_G50');
  });
});
