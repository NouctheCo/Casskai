/**
 * CassKai - Validateur SIREN/SIRET
 * Validation algorithmique avec formule de Luhn + formats internationaux
 */

// Formats d'identifiants par pays
export const BUSINESS_ID_FORMATS: Record<string, {
  name: string;
  format: string;
  length: number;
  example: string;
  regex?: RegExp;
}> = {
  // France
  FR_SIREN: {
    name: 'SIREN',
    format: '9 chiffres',
    length: 9,
    example: '909672685',
    regex: /^[0-9]{9}$/
  },
  FR_SIRET: {
    name: 'SIRET',
    format: '14 chiffres (SIREN + NIC)',
    length: 14,
    example: '90967268500018',
    regex: /^[0-9]{14}$/
  },
  // Belgique
  BE_BCE: {
    name: 'BCE (Numéro d\'entreprise)',
    format: '10 chiffres',
    length: 10,
    example: '0123456789',
    regex: /^[0-9]{10}$/
  },
  // Luxembourg
  LU_RCS: {
    name: 'RCS (Registre de Commerce)',
    format: 'B + 6 chiffres',
    length: 7,
    example: 'B123456',
    regex: /^B[0-9]{6}$/
  },
  // Côte d'Ivoire
  CI_CC: {
    name: 'Compte Contribuable',
    format: '10 chiffres',
    length: 10,
    example: '1234567890',
    regex: /^[0-9]{10}$/
  },
  // Sénégal
  SN_NINEA: {
    name: 'NINEA (Numéro d\'Identification National des Entreprises)',
    format: '7 chiffres',
    length: 7,
    example: '1234567',
    regex: /^[0-9]{7}$/
  },
  // Bénin
  BJ_IFU: {
    name: 'IFU (Identifiant Fiscal Unique)',
    format: '13 chiffres',
    length: 13,
    example: '1234567890123',
    regex: /^[0-9]{13}$/
  },
  // Maroc
  MA_ICE: {
    name: 'ICE (Identifiant Commun de l\'Entreprise)',
    format: '15 chiffres',
    length: 15,
    example: '123456789012345',
    regex: /^[0-9]{15}$/
  },
  // Algérie
  DZ_NIF: {
    name: 'NIF (Numéro d\'Identification Fiscale)',
    format: '15 chiffres',
    length: 15,
    example: '123456789012345',
    regex: /^[0-9]{15}$/
  }
};

/**
 * Algorithme de Luhn pour validation SIREN/SIRET
 * https://fr.wikipedia.org/wiki/Formule_de_Luhn
 */
export function validateLuhn(number: string): boolean {
  const digits = number.split('').map(Number);
  let sum = 0;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];

    // Pour les positions impaires (en partant de la droite, index pair), multiplier par 2
    if ((digits.length - 1 - i) % 2 === 1) {
      digit *= 2;
      // Si le résultat est > 9, soustraire 9
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
  }

  // Valide si la somme est un multiple de 10
  return sum % 10 === 0;
}

/**
 * Valide un numéro SIREN (9 chiffres)
 */
export function validateSIREN(siren: string): {
  isValid: boolean;
  error?: string;
} {
  // Nettoyer
  const cleaned = siren.replace(/\s/g, '');

  // Vérifier format
  if (!/^[0-9]{9}$/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Le SIREN doit contenir exactement 9 chiffres'
    };
  }

  // Vérifier avec algorithme de Luhn
  const isLuhnValid = validateLuhn(cleaned);

  if (!isLuhnValid) {
    return {
      isValid: false,
      error: 'Numéro SIREN invalide (échec validation Luhn)'
    };
  }

  return { isValid: true };
}

/**
 * Valide un numéro SIRET (14 chiffres)
 */
export function validateSIRET(siret: string): {
  isValid: boolean;
  siren?: string;
  nic?: string;
  error?: string;
} {
  // Nettoyer
  const cleaned = siret.replace(/\s/g, '');

  // Vérifier format
  if (!/^[0-9]{14}$/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Le SIRET doit contenir exactement 14 chiffres'
    };
  }

  // Extraire SIREN et NIC
  const siren = cleaned.substring(0, 9);
  const nic = cleaned.substring(9, 14);

  // Vérifier avec algorithme de Luhn
  const isLuhnValid = validateLuhn(cleaned);

  if (!isLuhnValid) {
    return {
      isValid: false,
      siren,
      nic,
      error: 'Numéro SIRET invalide (échec validation Luhn)'
    };
  }

  return {
    isValid: true,
    siren,
    nic
  };
}

/**
 * Valide un numéro BCE belge (10 chiffres)
 * Utilise l'algorithme modulo 97
 */
export function validateBCE(bce: string): {
  isValid: boolean;
  error?: string;
} {
  const cleaned = bce.replace(/\s/g, '');

  if (!/^[0-9]{10}$/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Le numéro BCE doit contenir exactement 10 chiffres'
    };
  }

  // Extraire les 8 premiers chiffres et les 2 derniers (clé de contrôle)
  const base = cleaned.substring(0, 8);
  const controlKey = parseInt(cleaned.substring(8, 10), 10);

  // Calculer la clé de contrôle : 97 - (base % 97)
  const calculatedKey = 97 - (parseInt(base, 10) % 97);

  if (calculatedKey !== controlKey) {
    return {
      isValid: false,
      error: `Numéro BCE invalide (clé de contrôle incorrecte: attendu ${calculatedKey}, reçu ${controlKey})`
    };
  }

  return { isValid: true };
}

/**
 * Détecte automatiquement le type d'identifiant et le valide
 */
export function validateBusinessId(id: string, countryCode?: string): {
  isValid: boolean;
  type?: string;
  format?: string;
  error?: string;
  details?: any;
} {
  const cleaned = id.replace(/\s/g, '');

  // France : SIREN ou SIRET
  if (!countryCode || countryCode === 'FR') {
    if (cleaned.length === 9) {
      const result = validateSIREN(cleaned);
      return {
        isValid: result.isValid,
        type: 'SIREN',
        format: '9 chiffres',
        error: result.error
      };
    }

    if (cleaned.length === 14) {
      const result = validateSIRET(cleaned);
      return {
        isValid: result.isValid,
        type: 'SIRET',
        format: '14 chiffres (SIREN + NIC)',
        error: result.error,
        details: result.isValid ? {
          siren: result.siren,
          nic: result.nic
        } : undefined
      };
    }
  }

  // Belgique : BCE
  if (countryCode === 'BE' && cleaned.length === 10) {
    const result = validateBCE(cleaned);
    return {
      isValid: result.isValid,
      type: 'BCE',
      format: '10 chiffres',
      error: result.error
    };
  }

  // Luxembourg : RCS
  if (countryCode === 'LU' && /^B[0-9]{6}$/.test(cleaned)) {
    return {
      isValid: true,
      type: 'RCS',
      format: 'B + 6 chiffres'
    };
  }

  // Autres formats (validation basique)
  const formats = Object.entries(BUSINESS_ID_FORMATS);
  for (const [key, format] of formats) {
    if (format.regex && format.regex.test(cleaned)) {
      return {
        isValid: true,
        type: format.name,
        format: format.format
      };
    }
  }

  return {
    isValid: false,
    error: 'Format non reconnu ou invalide'
  };
}

/**
 * Formate un SIREN pour l'affichage (espaces tous les 3 chiffres)
 */
export function formatSIREN(siren: string): string {
  const cleaned = siren.replace(/\s/g, '');
  if (cleaned.length !== 9) return siren;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}`;
}

/**
 * Formate un SIRET pour l'affichage
 */
export function formatSIRET(siret: string): string {
  const cleaned = siret.replace(/\s/g, '');
  if (cleaned.length !== 14) return siret;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9, 14)}`;
}

/**
 * Enrichit un SIREN/SIRET via API INSEE (France uniquement)
 * NOTE: Nécessite une clé API INSEE
 */
export async function enrichFromINSEE(siret: string): Promise<{
  success: boolean;
  data?: {
    denomination: string;
    address: string;
    activity: string;
    legalForm: string;
    creationDate: string;
    status: 'active' | 'closed';
  };
  error?: string;
}> {
  try {
    // Simulation d'un appel API
    // En production : https://api.insee.fr/entreprises/sirene/V3/siret/{siret}
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock data
    return {
      success: true,
      data: {
        denomination: 'NOUTCHE CONSEIL',
        address: '123 RUE DE LA REPUBLIQUE, 75001 PARIS',
        activity: 'Conseil en systèmes et logiciels informatiques',
        legalForm: 'SASU',
        creationDate: '2024-01-15',
        status: 'active'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Erreur lors de l\'enrichissement : ' + (error instanceof Error ? error.message : String(error))
    };
  }
}
