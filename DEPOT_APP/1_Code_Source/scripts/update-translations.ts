/**
 * 🌍 Translation Update Script
 * 
 * Automatically translates [UNTRANSLATED] entries in en.json and es.json
 * Uses a translation map for common terms
 */

import * as fs from 'fs';
import * as path from 'path';

// Translation maps
const translationMap: Record<string, { en: string; es: string }> = {
  // Common
  "Achats": { en: "Purchases", es: "Compras" },
  "Exportation...": { en: "Exporting...", es: "Exportando..." },
  "Import/Export Comptable": { en: "Accounting Import/Export", es: "Importación/Exportación Contable" },
  
  // Status & States
  "Statut": { en: "Status", es: "Estado" },
  "Actif": { en: "Active", es: "Activo" },
  "Inactif": { en: "Inactive", es: "Inactivo" },
  
  // Fields
  "Adresse": { en: "Address", es: "Dirección" },
  "Solde": { en: "Balance", es: "Saldo" },
  "Ville": { en: "City", es: "Ciudad" },
  "Pays": { en: "Country", es: "País" },
  "Email": { en: "Email", es: "Correo electrónico" },
  "Téléphone": { en: "Phone", es: "Teléfono" },
  "Code postal": { en: "Postal Code", es: "Código Postal" },
  "Devise par défaut": { en: "Default Currency", es: "Moneda Predeterminada" },
  
  // Third Parties
  "Tiers créé avec succès": { en: "Third party created successfully", es: "Tercero creado exitosamente" },
  "Créer un tiers": { en: "Create Third Party", es: "Crear Tercero" },
  "Modifier un tiers": { en: "Edit Third Party", es: "Editar Tercero" },
  "Tiers supprimé avec succès": { en: "Third party deleted successfully", es: "Tercero eliminado exitosamente" },
  "Erreur lors de la suppression du tiers": { en: "Error deleting third party", es: "Error al eliminar tercero" },
  "Êtes-vous sûr de vouloir supprimer {name} ?": { en: "Are you sure you want to delete {name}?", es: "¿Está seguro de que desea eliminar {name}?" },
  "Erreur lors du chargement des tiers": { en: "Error loading third parties", es: "Error al cargar terceros" },
  "Filtrer par statut": { en: "Filter by status", es: "Filtrar por estado" },
  "Remplissez les informations du tiers": { en: "Fill in third party information", es: "Complete la información del tercero" },
  
  // Import/Export
  "Erreur d'importation": { en: "Import Error", es: "Error de Importación" },
  "Importation réussie": { en: "Import Successful", es: "Importación Exitosa" },
  "Fichier non valide": { en: "Invalid File", es: "Archivo Inválido" },
  "Format de fichier non supporté": { en: "Unsupported file format", es: "Formato de archivo no soportado" },
  
  // Accounting
  "Écriture comptable": { en: "Journal Entry", es: "Asiento Contable" },
  "Plan comptable": { en: "Chart of Accounts", es: "Plan de Cuentas" },
  "Grand livre": { en: "General Ledger", es: "Libro Mayor" },
  "Balance générale": { en: "Trial Balance", es: "Balance General" },
  "Exercice comptable": { en: "Fiscal Year", es: "Ejercicio Fiscal" },
  
  // Invoicing
  "Facture": { en: "Invoice", es: "Factura" },
  "Devis": { en: "Quote", es: "Cotización" },
  "Avoir": { en: "Credit Note", es: "Nota de Crédito" },
  "Brouillon": { en: "Draft", es: "Borrador" },
  "Envoyée": { en: "Sent", es: "Enviada" },
  "Payée": { en: "Paid", es: "Pagada" },
  "En retard": { en: "Overdue", es: "Vencida" },
  
  // Reports
  "Compte de résultat": { en: "Income Statement", es: "Estado de Resultados" },
  "Bilan": { en: "Balance Sheet", es: "Balance" },
  "Tableau de trésorerie": { en: "Cash Flow Statement", es: "Estado de Flujo de Efectivo" },
  
  // RGPD
  "Données personnelles": { en: "Personal Data", es: "Datos Personales" },
  "Consentement": { en: "Consent", es: "Consentimiento" },
  "Droit à l'oubli": { en: "Right to be Forgotten", es: "Derecho al Olvido" },
  "Portabilité des données": { en: "Data Portability", es: "Portabilidad de Datos" },
};

function updateTranslations() {
  const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');
  const enPath = path.join(localesDir, 'en.json');
  const esPath = path.join(localesDir, 'es.json');
  
  // Read files
  const enContent = fs.readFileSync(enPath, 'utf-8');
  const esContent = fs.readFileSync(esPath, 'utf-8');
  
  let enJson = JSON.parse(enContent);
  let esJson = JSON.parse(esContent);
  
  let enUpdates = 0;
  let esUpdates = 0;
  
  // Process translations recursively
  function processObject(obj: any, lang: 'en' | 'es'): number {
    let updates = 0;
    
    for (const key in obj) {
      if (typeof obj[key] === 'string' && obj[key].startsWith('[UNTRANSLATED]')) {
        const frenchText = obj[key].replace('[UNTRANSLATED] ', '');
        
        // Check if we have a translation
        if (translationMap[frenchText]) {
          obj[key] = translationMap[frenchText][lang];
          updates++;
          console.log(`✅ Translated "${frenchText}" to ${lang.toUpperCase()}: "${obj[key]}"`);
        } else {
          console.warn(`⚠️  No translation found for: "${frenchText}"`);
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        updates += processObject(obj[key], lang);
      }
    }
    
    return updates;
  }
  
  // Update both files
  console.log('\n🔄 Updating English translations...');
  enUpdates = processObject(enJson, 'en');
  
  console.log('\n🔄 Updating Spanish translations...');
  esUpdates = processObject(esJson, 'es');
  
  // Write back to files
  fs.writeFileSync(enPath, JSON.stringify(enJson, null, 2), 'utf-8');
  fs.writeFileSync(esPath, JSON.stringify(esJson, null, 2), 'utf-8');
  
  console.log(`\n✅ Translation update complete!`);
  console.log(`   - English: ${enUpdates} entries updated`);
  console.log(`   - Spanish: ${esUpdates} entries updated`);
  
  // Count remaining untranslated
  const enRemaining = JSON.stringify(enJson).match(/\[UNTRANSLATED\]/g)?.length || 0;
  const esRemaining = JSON.stringify(esJson).match(/\[UNTRANSLATED\]/g)?.length || 0;
  
  if (enRemaining > 0 || esRemaining > 0) {
    console.log(`\n⚠️  Remaining untranslated entries:`);
    console.log(`   - English: ${enRemaining}`);
    console.log(`   - Spanish: ${esRemaining}`);
  } else {
    console.log(`\n🎉 All translations complete!`);
  }
}

// Run if called directly
if (require.main === module) {
  updateTranslations();
}

export { updateTranslations, translationMap };
