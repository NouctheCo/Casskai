# 📊 Import Comptable Universel Multi-Pays - CassKai

## Vue d'ensemble

CassKai dispose d'un **parser d'import comptable universel** qui détecte automatiquement le format et le standard comptable de vos fichiers, permettant une compatibilité avec les systèmes comptables du monde entier.

## 🌍 Standards comptables supportés

### France 🇫🇷
- **Standard**: PCG (Plan Comptable Général)
- **Format**: FEC (Fichier des Écritures Comptables)
- **Séparateurs**: `|`, `;`, `TAB`
- **Dates**: `YYYYMMDD` ou `DD/MM/YYYY`
- **Montants**: Format français `1 234,56`

### Afrique Francophone (OHADA) 🇸🇳🇨🇮🇧🇫🇲🇱
- **Standard**: SYSCOHADA
- **Format**: SYSCOHADA / Fichiers locaux
- **Séparateurs**: `;`, `TAB`
- **Dates**: `DD/MM/YYYY` ou `YYYY-MM-DD`
- **Montants**: Format français `1 234,56` ou international `1234.56`
- **Devises**: XOF (FCFA), XAF, etc.

### Maghreb 🇲🇦🇩🇿🇹🇳
- **Standard**: SCF (Système Comptable Financier)
- **Format**: Similaire FEC adapté
- **Séparateurs**: `|`, `;`
- **Dates**: `DD/MM/YYYY` ou `YYYYMMDD`
- **Devises**: MAD, DZD, TND

### Afrique Anglophone 🇳🇬🇬🇭🇰🇪
- **Standard**: IFRS (International Financial Reporting Standards)
- **Format**: CSV/Excel standard
- **Séparateurs**: `,`, `;`
- **Dates**: `YYYY-MM-DD` ou `MM/DD/YYYY` ou `DD/MM/YYYY`
- **Montants**: Format anglo-saxon `1,234.56`
- **Devises**: NGN, GHS, KES

### International 🇺🇸🇬🇧🇪🇺
- **Standards**: US GAAP, IFRS
- **Formats**: QuickBooks (IIF), Sage, Xero, CSV générique
- **Séparateurs**: `,`, `;`, `TAB`
- **Dates**: Multiples formats supportés
- **Montants**: Format anglo-saxon `1,234.56`
- **Devises**: USD, GBP, EUR

## 📁 Formats de fichiers acceptés

| Extension | Description | Support |
|-----------|-------------|---------|
| `.txt` | Fichier texte (FEC, SYSCOHADA) | ✅ Full |
| `.csv` | Comma-Separated Values | ✅ Full |
| `.tsv` | Tab-Separated Values | ✅ Full |
| `.dat` | Fichier de données | ✅ Full |
| `.fec` | FEC officiel (France) | ✅ Full |
| `.iif` | QuickBooks Import Format | ✅ Full |
| `.xls` | Excel (ancien format) | 🔄 Planifié |
| `.xlsx` | Excel (nouveau format) | 🔄 Planifié |

## 🚀 Fonctionnalités

### Détection automatique

Le parser détecte automatiquement :

1. **Séparateur** : `|`, `;`, `,`, `TAB`
2. **Format de fichier** : FEC, SYSCOHADA, IFRS_CSV, SCF, QuickBooks, Sage, Xero
3. **Standard comptable** : PCG, SYSCOHADA, IFRS, SCF, US_GAAP
4. **Format de dates** : YYYYMMDD, YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, etc.
5. **Format de montants** : Français (virgule) ou Anglo-saxon (point)
6. **Devise** : EUR, XOF, USD, GBP, MAD, DZD, etc.

### Parsing intelligent

- ✅ **Montants universels** : Gère virgules ET points décimaux
- ✅ **Dates flexibles** : Support de 6+ formats de dates différents
- ✅ **Séparateurs variables** : Auto-détection du séparateur
- ✅ **Encodage** : UTF-8, ISO-8859-1
- ✅ **Devises multiples** : Support multi-devises dans un même fichier
- ✅ **Validation** : Vérification d'équilibre débit/crédit

### Mapping intelligent des colonnes

Le parser reconnaît automatiquement les colonnes selon plusieurs nomenclatures :

**Exemples de colonnes reconnues :**

| Donnée | Noms acceptés |
|--------|---------------|
| **Journal** | `JournalCode`, `CodeJournal`, `Journal`, `JL` |
| **Date** | `EcritureDate`, `DateEcriture`, `TransactionDate`, `Date`, `DatePiece` |
| **Compte** | `CompteNum`, `NumCompte`, `AccountCode`, `Account`, `ACCNT` |
| **Débit** | `Debit`, `DEBIT`, `Débit`, `Dr`, `DR`, `MontantDebit` |
| **Crédit** | `Credit`, `CREDIT`, `Crédit`, `Cr`, `CR`, `MontantCredit` |
| **Libellé** | `EcritureLib`, `Description`, `Memo`, `Libelle`, `Narrative` |
| **Référence** | `PieceRef`, `Reference`, `DocNum`, `InvoiceNumber`, `Piece` |

## 📊 Interface utilisateur

### Affichage des statistiques

Après le parsing, l'interface affiche :

1. **Informations de détection**
   - Format détecté (FEC, SYSCOHADA, etc.)
   - Standard comptable (PCG, IFRS, etc.)
   - Devises présentes
   - Période couverte

2. **Statistiques de parsing**
   - Lignes valides
   - Total Débit
   - Total Crédit
   - Écart (vérification d'équilibre)

3. **Journaux détectés**
   - Liste des codes journaux trouvés
   - Nombre de journaux

4. **Erreurs et avertissements**
   - Liste détaillée des erreurs (avec numéros de ligne)
   - Avertissements de détection

### Badges colorés par format

- 🔵 **FEC** : Bleu
- 🟢 **SYSCOHADA** : Vert
- 🟣 **IFRS_CSV** : Violet
- 🟠 **SCF** : Orange
- 🟦 **QuickBooks** : Indigo
- 🩷 **Sage** : Rose
- 🔷 **Xero** : Cyan

## 🔧 Utilisation technique

### Utilisation du parser

```typescript
import { parseAccountingFile } from '@/utils/accountingFileParser';

// Lire le contenu du fichier
const content = await readFile(file);

// Parser avec options
const result = parseAccountingFile(content, {
  defaultCurrency: 'XOF',  // Devise par défaut (FCFA pour OHADA)
  expectedStandard: 'SYSCOHADA'  // Standard attendu (optionnel)
});

if (result.success) {
  console.log('Format détecté:', result.format);
  console.log('Standard:', result.standard);
  console.log('Lignes valides:', result.lines.length);
  console.log('Statistiques:', result.stats);
}
```

### Structure des résultats

```typescript
interface ParseResult {
  success: boolean;
  format: FileFormat;  // 'FEC' | 'SYSCOHADA' | 'IFRS_CSV' | etc.
  standard: AccountingStandard | null;  // 'PCG' | 'SYSCOHADA' | 'IFRS' | etc.
  lines: AccountingLine[];
  errors: ParseError[];
  warnings: string[];
  stats: {
    totalLines: number;
    validLines: number;
    errorLines: number;
    totalDebit: number;
    totalCredit: number;
    balance: number;
    currencies: string[];
    journals: string[];
    dateRange: { start: string; end: string } | null;
  };
}
```

### Import en base de données

```typescript
import { accountingImportService } from '@/services/accountingImportService';

// Import complet avec parsing et insertion
const result = await accountingImportService.parseAndImportFile(
  file,
  companyId,
  {
    defaultCurrency: 'EUR',
    expectedStandard: 'PCG'
  }
);

if (result.success && result.summary) {
  console.log('Comptes créés:', result.summary.accountsCreated);
  console.log('Journaux créés:', result.summary.journalsCreated);
  console.log('Écritures créées:', result.summary.entriesCreated);
}
```

## 📝 Exemples de fichiers supportés

### Exemple FEC (France)

```
JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|Debit|Credit
VT|Ventes|001|20240101|411000|Clients|1000,00|0,00
VT|Ventes|001|20240101|707000|Ventes|0,00|1000,00
```

### Exemple SYSCOHADA (Afrique OHADA)

```
NumCompte;IntituleCompte;CodeJournal;DatePiece;Libelle;Debit;Credit;Devise
411;Clients;VT;01/01/2024;Facture FV-001;1000;0;XOF
701;Ventes de marchandises;VT;01/01/2024;Facture FV-001;0;1000;XOF
```

### Exemple IFRS CSV (International)

```
AccountCode,AccountName,TransactionDate,Reference,Description,Debit,Credit,Currency
1100,Accounts Receivable,2024-01-01,INV001,Sales Invoice,1000.00,0.00,USD
4000,Sales Revenue,2024-01-01,INV001,Sales Invoice,0.00,1000.00,USD
```

## ⚡ Performance

- **Fichiers légers** (< 1 MB) : Parsing instantané (< 1s)
- **Fichiers moyens** (1-10 MB) : 2-5 secondes
- **Fichiers volumineux** (10-50 MB) : 5-15 secondes
- **Limite** : 50 MB par fichier

## 🛡️ Validation et sécurité

### Validations effectuées

1. ✅ **Format de fichier** : Vérification de l'extension
2. ✅ **Taille** : Maximum 50 MB
3. ✅ **Structure** : Vérification des colonnes obligatoires
4. ✅ **Dates** : Validation des formats de dates
5. ✅ **Montants** : Validation numérique
6. ✅ **Équilibre** : Vérification débit = crédit
7. ✅ **Comptes** : Validation des numéros de compte

### Gestion des erreurs

- **Erreurs bloquantes** : Empêchent l'import
  - Format de fichier non supporté
  - Colonnes obligatoires manquantes
  - Fichier vide

- **Erreurs non-bloquantes** : Signalées mais n'empêchent pas l'import
  - Lignes mal formées (ignorées)
  - Dates invalides (ligne ignorée)
  - Montants non numériques (ligne ignorée)

- **Avertissements** : Informations importantes
  - Déséquilibre débit/crédit
  - Devises multiples détectées
  - Standard comptable non détecté

## 🎯 Bonnes pratiques

1. **Préparer vos fichiers**
   - Supprimer les lignes d'en-tête vides
   - S'assurer que les montants sont bien formatés
   - Vérifier que les dates sont cohérentes

2. **Choisir le bon format**
   - France : Privilégier le format FEC officiel
   - OHADA : Utiliser le format SYSCOHADA standard
   - International : CSV avec séparateur virgule

3. **Vérifier après import**
   - Consulter les statistiques d'import
   - Vérifier l'équilibre débit/crédit
   - Contrôler les erreurs signalées

4. **Tester avec un petit échantillon**
   - Importer d'abord 10-20 lignes pour valider
   - Vérifier que le format est bien détecté
   - Puis importer le fichier complet

## 🔍 Dépannage

### Le format n'est pas détecté

**Solutions :**
- Vérifier que le fichier contient des en-têtes de colonnes
- S'assurer que le séparateur est cohérent
- Ajouter les colonnes obligatoires : compte, date, montants

### Les montants ne sont pas corrects

**Solutions :**
- Vérifier le séparateur décimal (virgule vs point)
- Supprimer les symboles monétaires (€, $, etc.)
- S'assurer qu'il n'y a pas d'espaces dans les nombres

### Erreur "Déséquilibre"

**Solutions :**
- Vérifier que chaque écriture a débit = crédit
- Contrôler les arrondis (2 décimales max)
- Vérifier qu'il n'y a pas de lignes manquantes

### Format détecté incorrect

**Solutions :**
- Forcer le standard attendu avec l'option `expectedStandard`
- Renommer les colonnes selon la nomenclature standard
- Utiliser un format de fichier plus explicite (.fec pour France)

## 📚 Ressources

- **Documentation PCG** : [Plan Comptable Général France]
- **Documentation SYSCOHADA** : [OHADA Accounting Standards]
- **Format FEC** : [Spécification FEC DGFiP]
- **IFRS Standards** : [IFRS Foundation]

## 🎉 Nouveautés à venir

- 🔄 **Support Excel natif** (.xls, .xlsx)
- 🔄 **Import par lots** (plusieurs fichiers)
- 🔄 **Mapping personnalisé** des colonnes
- 🔄 **Templates de fichiers** téléchargeables
- 🔄 **Validation avancée** (numéros SIRET/SIREN, TVA)
- 🔄 **Export universel** (conversion de formats)

---

**Version** : 1.0.0
**Date** : Décembre 2024
**Auteur** : CassKai Team - NOUTCHE CONSEIL
