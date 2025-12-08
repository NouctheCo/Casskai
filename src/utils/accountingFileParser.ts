/**
 * Parser universel pour fichiers comptables multi-pays
 * Supporte: FEC (France), SYSCOHADA (OHADA), IFRS, SCF (Maghreb), QuickBooks, Sage, Xero
 */

// ============ TYPES ============

export type AccountingStandard = 'PCG' | 'SYSCOHADA' | 'IFRS' | 'SCF' | 'US_GAAP';
export type FileFormat = 'FEC' | 'SYSCOHADA' | 'IFRS_CSV' | 'SCF' | 'QUICKBOOKS' | 'SAGE' | 'XERO' | 'GENERIC';

export interface AccountingLine {
  // Identifiants
  journalCode: string;
  journalName: string;
  entryNumber: string;
  lineNumber: number;

  // Dates
  entryDate: string;      // Format ISO: YYYY-MM-DD
  documentDate: string | null;
  validationDate: string | null;

  // Compte
  accountNumber: string;
  accountName: string;
  auxiliaryAccount: string | null;
  auxiliaryName: string | null;

  // Pièce
  documentRef: string | null;
  description: string;

  // Montants
  debit: number;
  credit: number;
  currency: string;
  foreignAmount: number | null;
  foreignCurrency: string | null;

  // Lettrage
  letteringCode: string | null;
  letteringDate: string | null;

  // Métadonnées
  rawData: string;
}

export interface ParseResult {
  success: boolean;
  format: FileFormat;
  standard: AccountingStandard | null;
  lines: AccountingLine[];
  errors: ParseError[];
  warnings: string[];
  stats: ParseStats;
}

export interface ParseError {
  line: number;
  field?: string;
  message: string;
  data?: string;
}

export interface ParseStats {
  totalLines: number;
  validLines: number;
  errorLines: number;
  totalDebit: number;
  totalCredit: number;
  balance: number;
  currencies: string[];
  journals: string[];
  dateRange: { start: string; end: string } | null;
}

// ============ DÉTECTION AUTOMATIQUE ============

// Patterns de colonnes par format
const FORMAT_SIGNATURES: Record<FileFormat, string[][]> = {
  FEC: [
    ['JournalCode', 'EcritureNum', 'EcritureDate', 'CompteNum', 'Debit', 'Credit'],
    ['JOURNALCODE', 'ECRITURENUM', 'ECRITUREDATE', 'COMPTENUM', 'DEBIT', 'CREDIT'],
  ],
  SYSCOHADA: [
    ['NumCompte', 'CodeJournal', 'DatePiece', 'Debit', 'Credit'],
    ['NUMCOMPTE', 'CODEJOURNAL', 'DATEPIECE', 'DEBIT', 'CREDIT'],
    ['Compte', 'Journal', 'Date', 'Debit', 'Credit'],
  ],
  SCF: [
    ['CodeJournal', 'NumeroCompte', 'DateEcriture', 'Debit', 'Credit'],
    ['CODEJOURNAL', 'NUMEROCOMPTE', 'DATEECRITURE', 'DEBIT', 'CREDIT'],
  ],
  IFRS_CSV: [
    ['AccountCode', 'TransactionDate', 'Debit', 'Credit'],
    ['ACCOUNTCODE', 'TRANSACTIONDATE', 'DEBIT', 'CREDIT'],
    ['Account', 'Date', 'Dr', 'Cr'],
  ],
  QUICKBOOKS: [
    ['TRNS', 'TRNSTYPE', 'DATE', 'ACCNT', 'AMOUNT'],
    ['!TRNS', 'TRNSID', 'TRNSTYPE', 'DATE', 'ACCNT'],
  ],
  SAGE: [
    ['TransactionDate', 'AccountCode', 'Debit', 'Credit'],
    ['NominalCode', 'Date', 'Debit', 'Credit'],
  ],
  XERO: [
    ['*ContactName', '*InvoiceNumber', '*InvoiceDate', 'AccountCode'],
    ['Date', 'SourceAccount', 'Description', 'Amount'],
  ],
  GENERIC: [],
};

// Détecter le séparateur
export const detectSeparator = (content: string): string => {
  const firstLines = content.split('\n').slice(0, 3).join('\n');
  const separators = [
    { char: '|', regex: /\|/g },
    { char: ';', regex: /;/g },
    { char: '\t', regex: /\t/g },
    { char: ',', regex: /,/g },
  ];

  let best = { char: ',', count: 0 };
  for (const sep of separators) {
    const count = (firstLines.match(sep.regex) || []).length;
    if (count > best.count) {
      best = { char: sep.char, count };
    }
  }

  return best.char;
};

// Détecter le format du fichier
export const detectFormat = (headers: string[]): FileFormat => {
  const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  for (const [format, signatures] of Object.entries(FORMAT_SIGNATURES)) {
    for (const signature of signatures) {
      const normalizedSignature = signature.map(s => s.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const matches = normalizedSignature.filter(s =>
        normalizedHeaders.some(h => h.includes(s) || s.includes(h))
      );
      if (matches.length >= Math.min(3, normalizedSignature.length)) {
        return format as FileFormat;
      }
    }
  }

  return 'GENERIC';
};

// Détecter le standard comptable depuis les numéros de compte
export const detectStandard = (accountNumbers: string[]): AccountingStandard | null => {
  if (accountNumbers.length === 0) return null;

  const samples = accountNumbers.slice(0, 50);

  // France PCG: 6 chiffres, commence par 1-7
  const pcgPattern = /^[1-7]\d{5}$/;
  const pcgMatches = samples.filter(a => pcgPattern.test(a)).length;

  // OHADA/SYSCOHADA: 4-8 chiffres, structure spécifique
  const ohadaPattern = /^[1-9]\d{3,7}$/;
  const ohadaMatches = samples.filter(a => ohadaPattern.test(a)).length;

  // IFRS/International: Variable, souvent alphanumérique
  const ifrsPattern = /^[A-Z0-9]{2,10}$/i;
  const ifrsMatches = samples.filter(a => ifrsPattern.test(a)).length;

  // Déterminer le plus probable
  if (pcgMatches > samples.length * 0.6) return 'PCG';
  if (ohadaMatches > samples.length * 0.6) return 'SYSCOHADA';
  if (ifrsMatches > samples.length * 0.6) return 'IFRS';

  return null;
};

// ============ PARSERS DE MONTANTS ============

// Parser montant universel
export const parseAmount = (value: string | undefined | null, locale?: string): number => {
  // DEBUG: Log les valeurs reçues
  if (value && value.trim() !== '' && value !== '0' && value !== '0,00' && value !== '0.00') {
    console.log('[parseAmount] Input:', value);
  }

  if (!value || value.trim() === '') return 0;

  let normalized = value.trim();

  // Supprimer symboles monétaires
  normalized = normalized.replace(/[€$£¥₣FCFA₦₵KSh]/gi, '').trim();

  // Supprimer espaces (séparateurs de milliers)
  normalized = normalized.replace(/\s/g, '');

  // Gérer les nombres négatifs entre parenthèses: (1234.56) -> -1234.56
  if (normalized.startsWith('(') && normalized.endsWith(')')) {
    normalized = '-' + normalized.slice(1, -1);
  }

  // Détecter le format
  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');

  if (hasComma && hasDot) {
    const lastComma = normalized.lastIndexOf(',');
    const lastDot = normalized.lastIndexOf('.');

    if (lastComma > lastDot) {
      // Format européen: 1.234,56
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else {
      // Format anglo-saxon: 1,234.56
      normalized = normalized.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Vérifier si c'est un séparateur de milliers ou décimal
    const parts = normalized.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Probablement décimal: 1234,56
      normalized = normalized.replace(',', '.');
    } else {
      // Probablement milliers: 1,234,567
      normalized = normalized.replace(/,/g, '');
    }
  }

  const parsed = parseFloat(normalized);
  const result = isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;

  // DEBUG: Log le résultat
  if (value && value.trim() !== '' && value !== '0' && value !== '0,00' && value !== '0.00') {
    console.log('[parseAmount] Normalized:', normalized, '-> Result:', result);
  }

  return result;
};

// ============ PARSERS DE DATES ============

// Parser date universel
export const parseDate = (value: string | undefined | null): string | null => {
  if (!value || value.trim() === '') return null;

  const cleaned = value.trim().split(/[\sT]/)[0]; // Ignorer heure

  // YYYYMMDD (FEC)
  if (/^\d{8}$/.test(cleaned)) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
  }

  // YYYY-MM-DD (ISO)
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // DD/MM/YYYY (Europe, Afrique francophone)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
    const [d, m, y] = cleaned.split('/');
    return `${y}-${m}-${d}`;
  }

  // MM/DD/YYYY (US)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
    const [m, d, y] = cleaned.split('/');
    // Heuristique: si m > 12, c'est DD/MM/YYYY
    if (parseInt(m) > 12) {
      return `${y}-${m}-${d}`;
    }
    return `${y}-${m}-${d}`;
  }

  // DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(cleaned)) {
    const [d, m, y] = cleaned.split('-');
    return `${y}-${m}-${d}`;
  }

  // DD.MM.YYYY (Allemand, Suisse)
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(cleaned)) {
    const [d, m, y] = cleaned.split('.');
    return `${y}-${m}-${d}`;
  }

  // Dernier recours
  const parsed = Date.parse(cleaned);
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().split('T')[0];
  }

  return null;
};

// ============ MAPPING DE COLONNES PAR FORMAT ============

const COLUMN_MAPPINGS: Record<string, string[]> = {
  // Codes journal
  journalCode: [
    'JournalCode', 'JOURNALCODE', 'CodeJournal', 'CODE_JOURNAL',
    'Journal', 'JOURNAL', 'JrnlCode', 'JL',
  ],
  journalName: [
    'JournalLib', 'JOURNALLIB', 'LibJournal', 'LIB_JOURNAL',
    'JournalName', 'LibelleJournal', 'JrnlName',
  ],

  // Numéro d'écriture
  entryNumber: [
    'EcritureNum', 'ECRITURENUM', 'NumEcriture', 'NUM_ECRITURE',
    'EntryNumber', 'TransactionID', 'TRNSID', 'DocNum', 'Numero',
  ],

  // Dates
  entryDate: [
    'EcritureDate', 'ECRITUREDATE', 'DateEcriture', 'DATE_ECRITURE',
    'TransactionDate', 'Date', 'DATE', 'DatePiece', 'EntryDate',
  ],
  documentDate: [
    'PieceDate', 'PIECEDATE', 'DatePiece', 'DATE_PIECE',
    'DocumentDate', 'InvoiceDate', 'DocDate',
  ],
  validationDate: [
    'ValidDate', 'VALIDDATE', 'DateValidation', 'DATE_VALIDATION',
    'PostedDate', 'ApprovedDate',
  ],

  // Comptes
  accountNumber: [
    'CompteNum', 'COMPTENUM', 'NumCompte', 'NUM_COMPTE',
    'AccountCode', 'ACCOUNTCODE', 'Account', 'ACCNT',
    'NominalCode', 'GLCode', 'Compte', 'NumeroCompte',
  ],
  accountName: [
    'CompteLib', 'COMPTELIB', 'LibCompte', 'LIB_COMPTE',
    'AccountName', 'ACCOUNTNAME', 'AccountDescription',
    'IntituleCompte', 'NomCompte',
  ],
  auxiliaryAccount: [
    'CompAuxNum', 'COMPAUXNUM', 'NumCompteAux',
    'SubAccount', 'AuxiliaryCode', 'Auxiliaire',
  ],
  auxiliaryName: [
    'CompAuxLib', 'COMPAUXLIB', 'LibCompteAux',
    'SubAccountName', 'AuxiliaryName',
  ],

  // Pièce / Référence
  documentRef: [
    'PieceRef', 'PIECEREF', 'RefPiece', 'REF_PIECE',
    'Reference', 'REFERENCE', 'DocNum', 'InvoiceNumber',
    'Piece', 'NumPiece',
  ],
  description: [
    'EcritureLib', 'ECRITURELIB', 'LibEcriture', 'LIB_ECRITURE',
    'Description', 'DESCRIPTION', 'Memo', 'MEMO',
    'Libelle', 'LIBELLE', 'Narrative',
  ],

  // Montants
  debit: [
    'Debit', 'DEBIT', 'Débit', 'DÉBIT', 'Dr', 'DR',
    'MontantDebit', 'MONTANT_DEBIT', 'DebitAmount',
  ],
  credit: [
    'Credit', 'CREDIT', 'Crédit', 'CRÉDIT', 'Cr', 'CR',
    'MontantCredit', 'MONTANT_CREDIT', 'CreditAmount',
  ],
  amount: [ // Pour formats avec montant unique (+ ou -)
    'Amount', 'AMOUNT', 'Value',
    // IMPORTANT: Ne PAS inclure 'Montant' car ça match aussi 'Montantdevise' dans les FEC
    // et cause des problèmes où les montants deviennent 0
  ],

  // Devise
  currency: [
    'Idevise', 'IDEVISE', 'Currency', 'CURRENCY',
    'Devise', 'DEVISE', 'CurrencyCode',
  ],
  foreignAmount: [
    'Montantdevise', 'MONTANTDEVISE', 'MontantDevise',
    'ForeignAmount', 'OriginalAmount',
  ],

  // Lettrage
  letteringCode: [
    'EcritureLet', 'ECRITURELET', 'Lettrage', 'LETTRAGE',
    'MatchingCode', 'ReconciliationCode',
  ],
  letteringDate: [
    'DateLet', 'DATELET', 'DateLettrage', 'DATE_LETTRAGE',
    'MatchingDate', 'ReconciliationDate',
  ],
};

// Trouver l'index d'une colonne
const findColumnIndex = (headers: string[], fieldName: string): number => {
  const possibleNames = COLUMN_MAPPINGS[fieldName] || [fieldName];
  const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  for (const name of possibleNames) {
    const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const index = normalizedHeaders.findIndex(h => h === normalizedName || h.includes(normalizedName));
    if (index !== -1) return index;
  }
  return -1;
};

// ============ PARSER PRINCIPAL ============

export const parseAccountingFile = (
  content: string,
  options?: {
    defaultCurrency?: string;
    expectedStandard?: AccountingStandard;
  }
): ParseResult => {
  const errors: ParseError[] = [];
  const warnings: string[] = [];
  const lines: AccountingLine[] = [];

  const defaultCurrency = options?.defaultCurrency || 'EUR';

  // Normaliser les fins de ligne
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = normalizedContent.split('\n').filter(line => line.trim() !== '');

  if (rawLines.length < 2) {
    return {
      success: false,
      format: 'GENERIC',
      standard: null,
      lines: [],
      errors: [{ line: 0, message: 'Fichier vide ou sans données' }],
      warnings: [],
      stats: { totalLines: 0, validLines: 0, errorLines: 0, totalDebit: 0, totalCredit: 0, balance: 0, currencies: [], journals: [], dateRange: null }
    };
  }

  // Détecter le séparateur
  const separator = detectSeparator(rawLines[0]);
  warnings.push(`Séparateur détecté: "${separator === '\t' ? 'TAB' : separator}"`);

  // Parser les headers
  const headers = rawLines[0].split(separator).map(h => h.trim().replace(/^["']|["']$/g, ''));

  // Détecter le format
  const format = detectFormat(headers);
  warnings.push(`Format détecté: ${format}`);

  // Créer le mapping des colonnes
  const columnMap = {
    journalCode: findColumnIndex(headers, 'journalCode'),
    journalName: findColumnIndex(headers, 'journalName'),
    entryNumber: findColumnIndex(headers, 'entryNumber'),
    entryDate: findColumnIndex(headers, 'entryDate'),
    documentDate: findColumnIndex(headers, 'documentDate'),
    validationDate: findColumnIndex(headers, 'validationDate'),
    accountNumber: findColumnIndex(headers, 'accountNumber'),
    accountName: findColumnIndex(headers, 'accountName'),
    auxiliaryAccount: findColumnIndex(headers, 'auxiliaryAccount'),
    auxiliaryName: findColumnIndex(headers, 'auxiliaryName'),
    documentRef: findColumnIndex(headers, 'documentRef'),
    description: findColumnIndex(headers, 'description'),
    debit: findColumnIndex(headers, 'debit'),
    credit: findColumnIndex(headers, 'credit'),
    amount: findColumnIndex(headers, 'amount'),
    currency: findColumnIndex(headers, 'currency'),
    foreignAmount: findColumnIndex(headers, 'foreignAmount'),
    letteringCode: findColumnIndex(headers, 'letteringCode'),
    letteringDate: findColumnIndex(headers, 'letteringDate'),
  };

  // DEBUG: Afficher les colonnes détectées
  console.log('[Parser] Headers:', headers);
  console.log('[Parser] Column mapping:', {
    debit: `${columnMap.debit} (${headers[columnMap.debit] || 'N/A'})`,
    credit: `${columnMap.credit} (${headers[columnMap.credit] || 'N/A'})`,
    accountNumber: `${columnMap.accountNumber} (${headers[columnMap.accountNumber] || 'N/A'})`,
    entryDate: `${columnMap.entryDate} (${headers[columnMap.entryDate] || 'N/A'})`,
  });

  // Vérifier les colonnes obligatoires
  if (columnMap.accountNumber === -1) {
    errors.push({ line: 1, message: 'Colonne de numéro de compte non trouvée' });
  }
  if (columnMap.entryDate === -1) {
    errors.push({ line: 1, message: 'Colonne de date non trouvée' });
  }
  if (columnMap.debit === -1 && columnMap.credit === -1 && columnMap.amount === -1) {
    errors.push({ line: 1, message: 'Colonnes de montants (Débit/Crédit ou Amount) non trouvées' });
  }

  if (errors.length > 0) {
    return {
      success: false,
      format,
      standard: null,
      lines: [],
      errors,
      warnings,
      stats: { totalLines: rawLines.length - 1, validLines: 0, errorLines: errors.length, totalDebit: 0, totalCredit: 0, balance: 0, currencies: [], journals: [], dateRange: null }
    };
  }

  // Statistiques
  let totalDebit = 0;
  let totalCredit = 0;
  const currencies = new Set<string>();
  const journals = new Set<string>();
  const accountNumbers: string[] = [];
  let minDate: string | null = null;
  let maxDate: string | null = null;

  // Parser chaque ligne
  for (let i = 1; i < rawLines.length; i++) {
    const lineNumber = i + 1;
    const rawLine = rawLines[i];

    if (rawLine.trim() === '') continue;

    // Parser les valeurs (gérer les guillemets)
    const values = rawLine.split(separator).map(v => v.trim().replace(/^["']|["']$/g, ''));

    const getValue = (field: keyof typeof columnMap): string => {
      const idx = columnMap[field];
      return idx >= 0 && idx < values.length ? values[idx] : '';
    };

    try {
      // Parser la date
      const entryDate = parseDate(getValue('entryDate'));
      if (!entryDate) {
        errors.push({ line: lineNumber, message: `Date invalide: ${getValue('entryDate')}`, data: rawLine });
        continue;
      }

      // Parser le compte
      const accountNumber = getValue('accountNumber').trim();
      if (!accountNumber) {
        errors.push({ line: lineNumber, message: 'Numéro de compte manquant', data: rawLine });
        continue;
      }
      accountNumbers.push(accountNumber);

      // Parser les montants
      let debit = 0;
      let credit = 0;

      console.log(`[Parser Line ${lineNumber}] columnMap.amount = ${columnMap.amount}`);

      if (columnMap.amount !== -1) {
        console.log(`[Parser Line ${lineNumber}] Using AMOUNT column`);
        // Format avec montant unique (positif = débit, négatif = crédit)
        const amount = parseAmount(getValue('amount'));
        console.log(`[Parser Line ${lineNumber}] Amount parsed: ${amount}`);
        if (amount >= 0) {
          debit = amount;
        } else {
          credit = Math.abs(amount);
        }
      } else {
        console.log(`[Parser Line ${lineNumber}] Using DEBIT/CREDIT columns`);
        // DEBUG: Log les valeurs brutes extraites
        const rawDebit = getValue('debit');
        const rawCredit = getValue('credit');

        // DEBUG: Log TOUTES les lignes pour voir le problème
        console.log(`[Parser Line ${lineNumber}] Raw Debit: "${rawDebit}" | Raw Credit: "${rawCredit}"`);

        debit = parseAmount(rawDebit);
        credit = parseAmount(rawCredit);

        console.log(`[Parser Line ${lineNumber}] Parsed Debit: ${debit} | Parsed Credit: ${credit}`);
      }

      console.log(`[Parser Line ${lineNumber}] FINAL: debit=${debit}, credit=${credit}`);

      // Devise
      const currency = getValue('currency') || defaultCurrency;
      currencies.add(currency);

      // Journal
      const journalCode = getValue('journalCode') || 'OD';
      journals.add(journalCode);

      // Dates min/max
      if (!minDate || entryDate < minDate) minDate = entryDate;
      if (!maxDate || entryDate > maxDate) maxDate = entryDate;

      // Créer la ligne
      const line: AccountingLine = {
        journalCode,
        journalName: getValue('journalName') || journalCode,
        entryNumber: getValue('entryNumber') || String(i),
        lineNumber,
        entryDate,
        documentDate: parseDate(getValue('documentDate')),
        validationDate: parseDate(getValue('validationDate')),
        accountNumber,
        accountName: getValue('accountName') || '',
        auxiliaryAccount: getValue('auxiliaryAccount') || null,
        auxiliaryName: getValue('auxiliaryName') || null,
        documentRef: getValue('documentRef') || null,
        description: getValue('description') || '',
        debit,
        credit,
        currency,
        foreignAmount: parseAmount(getValue('foreignAmount')) || null,
        foreignCurrency: null,
        letteringCode: getValue('letteringCode') || null,
        letteringDate: parseDate(getValue('letteringDate')),
        rawData: rawLine,
      };

      lines.push(line);
      totalDebit += debit;
      totalCredit += credit;

    } catch (e) {
      errors.push({
        line: lineNumber,
        message: `Erreur: ${e instanceof Error ? e.message : 'Erreur inconnue'}`,
        data: rawLine
      });
    }
  }

  // Détecter le standard comptable
  const standard = options?.expectedStandard || detectStandard(accountNumbers);
  if (standard) {
    warnings.push(`Standard comptable détecté: ${standard}`);
  }

  // Vérifier l'équilibre
  const balance = Math.round((totalDebit - totalCredit) * 100) / 100;
  if (Math.abs(balance) > 0.01) {
    warnings.push(`⚠️ Déséquilibre: Débit=${totalDebit.toFixed(2)}, Crédit=${totalCredit.toFixed(2)}, Écart=${balance.toFixed(2)}`);
  }

  return {
    success: errors.length === 0 || lines.length > 0,
    format,
    standard,
    lines,
    errors,
    warnings,
    stats: {
      totalLines: rawLines.length - 1,
      validLines: lines.length,
      errorLines: errors.length,
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      balance,
      currencies: Array.from(currencies),
      journals: Array.from(journals),
      dateRange: minDate && maxDate ? { start: minDate, end: maxDate } : null,
    }
  };
};

// ============ EXPORTS ============

export default parseAccountingFile;
