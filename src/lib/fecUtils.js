import { useLocale } from '@/contexts/LocaleContext';

export const FEC_LINE_LENGTH = 18;

export const parseDate = (dateStr) => {
  if (!dateStr || dateStr.length !== 8) return null;
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`); // Assume UTC to avoid timezone issues
  return isNaN(date.getTime()) ? null : date;
};

export const formatDateForSQL = (date) => {
  if (!date) return null;
  return date.toISOString().split('T')[0];
};

export const getAccountType = (accountNumber) => {
  if (!accountNumber) return 'Unknown';
  const firstDigit = accountNumber.charAt(0);
  
  switch (firstDigit) {
    case '1': return 'EQUITY';
    case '2': return 'ASSET';
    case '3': return 'ASSET'; // Inventory
    case '4': 
      if (accountNumber.startsWith('40') || accountNumber.startsWith('404')) return 'LIABILITY'; // Suppliers
      if (accountNumber.startsWith('41')) return 'ASSET'; // Clients
      if (accountNumber.startsWith('42') || accountNumber.startsWith('43') || accountNumber.startsWith('44')) return 'LIABILITY'; // Personnel, Social, Tax
      return 'ASSET';
    case '5': return 'ASSET'; // Financial
    case '6': return 'EXPENSE';
    case '7': return 'REVENUE';
    default: return 'Unknown';
  }
};

export const getAccountClass = (accountNumber) => {
  if (!accountNumber) return null;
  return parseInt(accountNumber.charAt(0));
};

export const getJournalType = (journalCode) => {
  if (!journalCode) return 'Unknown';
  if (journalCode.match(/^AN$/i)) return 'OPENING';
  if (journalCode.match(/^VT|VE$/i)) return 'VENTE';
  if (journalCode.match(/^AC|HA$/i)) return 'ACHAT';
  if (journalCode.match(/^BQ[A-Z0-9]*$/i)) return 'BANQUE';
  if (journalCode.match(/^CA$/i)) return 'CAISSE';
  if (journalCode.match(/^OD$/i)) return 'OD';
  if (journalCode.match(/^EXT$/i)) return 'REVERSAL';
  return 'OTHER';
};

export const useFECParser = () => {
  const { t } = useLocale();
  
  const parseFECFileContent = (fileContent) => {
    try {
      // Déterminer le séparateur (tab ou pipe)
      const separator = fileContent.includes('\t') ? '\t' : '|';
      
      const lines = fileContent.split(/\r\n|\n|\r/).filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error(t('fecImport.error.notEnoughLines', { defaultValue: "File too short. A FEC file must contain at least a header and one data line." }));
      }
      
      const header = lines[0].split(separator);
      const entries = [];
      const accounts = new Map();
      const journals = new Set();
      let minDate = null;
      let maxDate = null;
      let totalDebit = 0;
      let totalCredit = 0;
      const errors = [];
      
      // Vérifier les colonnes obligatoires
      const requiredColumnNames = ['JournalCode', 'EcritureNum', 'EcritureDate', 'CompteNum', 'CompteLib', 'Debit', 'Credit'];
      const headerMap = {};
      header.forEach((col, index) => {
        headerMap[col] = index;
      });
      
      const missingColumns = requiredColumnNames.filter(col => !(col in headerMap));
      if (missingColumns.length > 0) {
        throw new Error(t('fecImport.error.missingColumns', { 
          columns: missingColumns.join(', '), 
          defaultValue: `Missing required columns: ${missingColumns.join(', ')}` 
        }));
      }
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        const fields = line.split(separator);
        
        // Vérifier que la ligne a le bon nombre de champs
        if (fields.length < requiredColumnNames.length) {
          errors.push({
            line: i + 1,
            message: t('fecImport.error.lineFormat', { 
              line: i + 1,
              expected: requiredColumnNames.length,
              actual: fields.length,
              defaultValue: `Line ${i + 1}: Invalid format, expected at least ${requiredColumnNames.length} fields, got ${fields.length}.` 
            })
          });
          continue;
        }
        
        // Extraire les valeurs en utilisant les indices du headerMap
        const journalCode = fields[headerMap.JournalCode];
        const journalLib = headerMap.JournalLib !== undefined ? fields[headerMap.JournalLib] : '';
        const ecritureNum = fields[headerMap.EcritureNum];
        const ecritureDateStr = fields[headerMap.EcritureDate];
        const compteNum = fields[headerMap.CompteNum];
        const compteLib = fields[headerMap.CompteLib];
        const compAuxNum = headerMap.CompAuxNum !== undefined ? fields[headerMap.CompAuxNum] : '';
        const compAuxLib = headerMap.CompAuxLib !== undefined ? fields[headerMap.CompAuxLib] : '';
        const pieceRef = headerMap.PieceRef !== undefined ? fields[headerMap.PieceRef] : '';
        const pieceDateStr = headerMap.PieceDate !== undefined ? fields[headerMap.PieceDate] : '';
        const ecritureLib = headerMap.EcritureLib !== undefined ? fields[headerMap.EcritureLib] : '';
        const debitStr = fields[headerMap.Debit];
        const creditStr = fields[headerMap.Credit];
        
        // Convertir les dates
        const ecritureDate = parseDate(ecritureDateStr);
        const pieceDate = pieceDateStr ? parseDate(pieceDateStr) : null;
        
        if (!ecritureDate) {
          errors.push({
            line: i + 1,
            message: t('fecImport.error.invalidDate', { 
              line: i + 1,
              date: ecritureDateStr,
              defaultValue: `Line ${i + 1}: Invalid EcritureDate format: ${ecritureDateStr}` 
            })
          });
          continue;
        }
        
        // Convertir les montants
        const debit = parseFloat(debitStr.replace(',', '.')) || 0;
        const credit = parseFloat(creditStr.replace(',', '.')) || 0;
        
        // Mettre à jour les dates min/max
        if (!minDate || ecritureDate < minDate) minDate = ecritureDate;
        if (!maxDate || ecritureDate > maxDate) maxDate = ecritureDate;
        
        // Mettre à jour les totaux
        totalDebit += debit;
        totalCredit += credit;
        
        // Collecter les comptes et journaux uniques
        if (!accounts.has(compteNum)) {
          accounts.set(compteNum, { 
            libelle: compteLib, 
            type: getAccountType(compteNum),
            class: getAccountClass(compteNum)
          });
        }
        journals.add(journalCode);
        
        // Créer l'entrée
        entries.push({
          JournalCode: journalCode,
          JournalLib: journalLib,
          EcritureNum: ecritureNum,
          EcritureDate: ecritureDate,
          CompteNum: compteNum,
          CompteLib: compteLib,
          CompAuxNum: compAuxNum,
          CompAuxLib: compAuxLib,
          PieceRef: pieceRef,
          PieceDate: pieceDate,
          EcritureLib: ecritureLib,
          Debit: debit,
          Credit: credit,
          // Autres champs si présents...
        });
      }
      
      if (entries.length === 0 && errors.length > 0) {
        throw new Error(t('fecImport.error.noValidEntries', { 
          defaultValue: "No valid entries found in the file. Please check the errors." 
        }));
      }
      
      // Regrouper les écritures par numéro d'écriture et journal
      const entriesByJournalAndNum = new Map();
      entries.forEach(entry => {
        const key = `${entry.JournalCode}-${entry.EcritureNum}`;
        if (!entriesByJournalAndNum.has(key)) {
          entriesByJournalAndNum.set(key, []);
        }
        entriesByJournalAndNum.get(key).push(entry);
      });
      
      // Vérifier l'équilibre des écritures
      const unbalancedEntries = [];
      entriesByJournalAndNum.forEach((entriesGroup, key) => {
        const totalDebit = entriesGroup.reduce((sum, e) => sum + (e.Debit || 0), 0);
        const totalCredit = entriesGroup.reduce((sum, e) => sum + (e.Credit || 0), 0);
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          unbalancedEntries.push({
            key,
            difference: (totalDebit - totalCredit).toFixed(2),
            entries: entriesGroup
          });
        }
      });
      
      if (unbalancedEntries.length > 0) {
        errors.push({
          message: t('fecImport.error.unbalancedEntries', { 
            count: unbalancedEntries.length,
            defaultValue: `${unbalancedEntries.length} unbalanced entries found.` 
          })
        });
      }
      
      const summary = {
        siren: header.length > 0 ? header[0] : t('fecImport.data.unavailable', { defaultValue: 'N/A' }),
        companyName: header.length > 2 ? header[2] : t('fecImport.data.unavailable', { defaultValue: 'N/A' }),
        numEntries: entries.length,
        numAccounts: accounts.size,
        numJournals: journals.size,
        periodStart: minDate ? minDate.toLocaleDateString() : t('fecImport.data.unavailable', { defaultValue: 'N/A' }),
        periodEnd: maxDate ? maxDate.toLocaleDateString() : t('fecImport.data.unavailable', { defaultValue: 'N/A' }),
        totalDebit: totalDebit.toFixed(2),
        totalCredit: totalCredit.toFixed(2),
        balance: (totalDebit - totalCredit).toFixed(2),
        errors: errors,
        unbalancedEntries: unbalancedEntries
      };
      
      return { 
        entries, 
        accounts: Array.from(accounts.entries()), 
        journals: Array.from(journals), 
        entriesByJournalAndNum: Array.from(entriesByJournalAndNum.entries()),
        summary 
      };
    } catch (err) {
      console.error("FEC Parsing error:", err);
      throw err; 
    }
  };
  
  return { parseFECFileContent };
};