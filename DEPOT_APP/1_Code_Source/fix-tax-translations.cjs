/**
 * Script pour corriger les traductions manquantes de la page Tax
 */

const fs = require('fs');
const path = require('path');

const translationsToAdd = {
  fr: {
    "tax.newDeclaration": "Nouvelle déclaration",
    "tax.newDeclaration.title": "Créer une nouvelle déclaration fiscale",
    "tax.newDeclaration.subtitle": "Remplissez les informations de votre déclaration fiscale",
    "tax.newDeclaration.form.type": "Type de déclaration",
    "tax.newDeclaration.form.selectType": "Sélectionnez un type",
    "tax.newDeclaration.form.types.tva": "TVA",
    "tax.newDeclaration.form.types.is": "Impôt sur les Sociétés",
    "tax.newDeclaration.form.types.liasse": "Liasse fiscale",
    "tax.newDeclaration.form.types.ir": "Impôt sur le Revenu",
    "tax.newDeclaration.form.types.cfe": "CFE",
    "tax.newDeclaration.form.types.cvae": "CVAE",
    "tax.newDeclaration.form.name": "Nom de la déclaration",
    "tax.newDeclaration.form.namePlaceholder": "Ex: TVA T1 2025",
    "tax.newDeclaration.form.periodStart": "Début de période",
    "tax.newDeclaration.form.periodEnd": "Fin de période",
    "tax.newDeclaration.form.dueDate": "Date limite",
    "tax.newDeclaration.form.amount": "Montant",
    "tax.newDeclaration.form.amountPlaceholder": "0.00",
    "tax.newDeclaration.form.description": "Description",
    "tax.newDeclaration.form.descriptionPlaceholder": "Notes ou commentaires...",
    "tax.newDeclaration.form.cancel": "Annuler",
    "tax.newDeclaration.form.create": "Créer la déclaration",
    "tax.newDeclaration.form.creating": "Création en cours..."
  },
  en: {
    "tax.newDeclaration": "New Declaration",
    "tax.newDeclaration.title": "Create a New Tax Declaration",
    "tax.newDeclaration.subtitle": "Fill in your tax declaration information",
    "tax.newDeclaration.form.type": "Declaration Type",
    "tax.newDeclaration.form.selectType": "Select a type",
    "tax.newDeclaration.form.types.tva": "VAT",
    "tax.newDeclaration.form.types.is": "Corporate Tax",
    "tax.newDeclaration.form.types.liasse": "Tax Return Package",
    "tax.newDeclaration.form.types.ir": "Income Tax",
    "tax.newDeclaration.form.types.cfe": "CFE",
    "tax.newDeclaration.form.types.cvae": "CVAE",
    "tax.newDeclaration.form.name": "Declaration Name",
    "tax.newDeclaration.form.namePlaceholder": "e.g., VAT Q1 2025",
    "tax.newDeclaration.form.periodStart": "Period Start",
    "tax.newDeclaration.form.periodEnd": "Period End",
    "tax.newDeclaration.form.dueDate": "Due Date",
    "tax.newDeclaration.form.amount": "Amount",
    "tax.newDeclaration.form.amountPlaceholder": "0.00",
    "tax.newDeclaration.form.description": "Description",
    "tax.newDeclaration.form.descriptionPlaceholder": "Notes or comments...",
    "tax.newDeclaration.form.cancel": "Cancel",
    "tax.newDeclaration.form.create": "Create Declaration",
    "tax.newDeclaration.form.creating": "Creating..."
  },
  es: {
    "tax.newDeclaration": "Nueva Declaración",
    "tax.newDeclaration.title": "Crear una Nueva Declaración Fiscal",
    "tax.newDeclaration.subtitle": "Complete la información de su declaración fiscal",
    "tax.newDeclaration.form.type": "Tipo de Declaración",
    "tax.newDeclaration.form.selectType": "Seleccione un tipo",
    "tax.newDeclaration.form.types.tva": "IVA",
    "tax.newDeclaration.form.types.is": "Impuesto de Sociedades",
    "tax.newDeclaration.form.types.liasse": "Paquete de Declaración",
    "tax.newDeclaration.form.types.ir": "Impuesto sobre la Renta",
    "tax.newDeclaration.form.types.cfe": "CFE",
    "tax.newDeclaration.form.types.cvae": "CVAE",
    "tax.newDeclaration.form.name": "Nombre de la Declaración",
    "tax.newDeclaration.form.namePlaceholder": "Ej: IVA T1 2025",
    "tax.newDeclaration.form.periodStart": "Inicio del Período",
    "tax.newDeclaration.form.periodEnd": "Fin del Período",
    "tax.newDeclaration.form.dueDate": "Fecha Límite",
    "tax.newDeclaration.form.amount": "Cantidad",
    "tax.newDeclaration.form.amountPlaceholder": "0.00",
    "tax.newDeclaration.form.description": "Descripción",
    "tax.newDeclaration.form.descriptionPlaceholder": "Notas o comentarios...",
    "tax.newDeclaration.form.cancel": "Cancelar",
    "tax.newDeclaration.form.create": "Crear Declaración",
    "tax.newDeclaration.form.creating": "Creando..."
  }
};

function addTranslationsToTaxSection(locale) {
  const filePath = path.join(__dirname, 'src', 'i18n', 'locales', `${locale}.json`);

  console.log(`\n📝 Processing ${locale}.json...`);

  const content = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(content);

  // Naviguer vers la section tax (la plus récente à la fin)
  if (!json.tax) {
    console.log(`❌ Section "tax" not found in ${locale}.json`);
    return;
  }

  const translations = translationsToAdd[locale];
  let added = 0;

  // Ajouter newDeclaration si manquant
  if (!json.tax.newDeclaration) {
    json.tax.newDeclaration = {
      title: translations["tax.newDeclaration.title"],
      subtitle: translations["tax.newDeclaration.subtitle"],
      form: {
        type: translations["tax.newDeclaration.form.type"],
        selectType: translations["tax.newDeclaration.form.selectType"],
        types: {
          tva: translations["tax.newDeclaration.form.types.tva"],
          is: translations["tax.newDeclaration.form.types.is"],
          liasse: translations["tax.newDeclaration.form.types.liasse"],
          ir: translations["tax.newDeclaration.form.types.ir"],
          cfe: translations["tax.newDeclaration.form.types.cfe"],
          cvae: translations["tax.newDeclaration.form.types.cvae"]
        },
        name: translations["tax.newDeclaration.form.name"],
        namePlaceholder: translations["tax.newDeclaration.form.namePlaceholder"],
        periodStart: translations["tax.newDeclaration.form.periodStart"],
        periodEnd: translations["tax.newDeclaration.form.periodEnd"],
        dueDate: translations["tax.newDeclaration.form.dueDate"],
        amount: translations["tax.newDeclaration.form.amount"],
        amountPlaceholder: translations["tax.newDeclaration.form.amountPlaceholder"],
        description: translations["tax.newDeclaration.form.description"],
        descriptionPlaceholder: translations["tax.newDeclaration.form.descriptionPlaceholder"],
        cancel: translations["tax.newDeclaration.form.cancel"],
        create: translations["tax.newDeclaration.form.create"],
        creating: translations["tax.newDeclaration.form.creating"]
      }
    };
    added++;
  }

  // Écrire le fichier
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');

  console.log(`✅ Added ${added} translation sections to ${locale}.json`);
}

console.log('🚀 Starting tax translations fix...\n');

['fr', 'en', 'es'].forEach(locale => {
  addTranslationsToTaxSection(locale);
});

console.log('\n✅ All translations added successfully!');
console.log('\n📋 Summary:');
console.log('   - tax.newDeclaration.* (all sub-keys added)');
console.log('   - Translations added for: fr, en, es');
