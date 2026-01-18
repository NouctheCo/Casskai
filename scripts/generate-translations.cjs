/**
 * Script de génération des fichiers de traduction en.json et es.json
 * Traduction complète de phrases depuis fr.json
 */

const fs = require('fs');
const path = require('path');

// Dictionnaire de traductions françaises vers anglais - phrases complètes
const frToEnPhrases = {
  // Account Classes
  "Classe 1 - Comptes de capitaux": "Class 1 - Capital Accounts",
  "Classe 2 - Comptes d'immobilisations": "Class 2 - Fixed Assets Accounts",
  "Classe 3 - Comptes de stocks": "Class 3 - Inventory Accounts",
  "Classe 4 - Comptes de tiers": "Class 4 - Third Party Accounts",
  "Classe 5 - Comptes financiers": "Class 5 - Financial Accounts",
  "Classe 6 - Comptes de charges": "Class 6 - Expense Accounts",
  "Classe 7 - Comptes de produits": "Class 7 - Revenue Accounts",
  "Classe 8 - Comptes spéciaux": "Class 8 - Special Accounts",
  "Classe 9 - Comptabilité analytique": "Class 9 - Cost Accounting",

  // Common
  "Compte créé avec succès": "Account created successfully",
  "Description du compte": "Account description",
  "Achats": "Purchases",
  "Ventes": "Sales",
  "Banque": "Bank",
  "Caisse": "Cash",
  "Général": "General",
  "À-nouveaux": "Opening Balance",

  // Chart Detection
  "Peut être utilisé pour les multinationales ou cas spécifiques": "Can be used for multinationals or specific cases",
  "Plans alternatifs": "Alternative chart of accounts",
  "Recommandé": "Recommended",
  "Par défaut": "Default",
  "Suggéré": "Suggested",
  "Obligatoire": "Mandatory",
  "Plan comptable détecté": "Chart of accounts detected",
  "Utiliser ce plan": "Use this chart",

  // Journal Types
  "Opérations diverses": "Miscellaneous operations",
  "Autre": "Other",

  // PCG
  "Plan Comptable Général": "General Chart of Accounts",

  // Setup
  "Annuel": "Annual",
  "Plan Comptable": "Chart of Accounts",
  "Définissez votre plan comptable": "Define your chart of accounts",
  "Choisissez comment configurer votre plan comptable": "Choose how to configure your chart of accounts",
  "Option de Plan Comptable": "Chart of Accounts Option",
  "Configuration comptable terminée": "Accounting setup completed",
  "Configurer le Plan Comptable": "Configure Chart of Accounts",
  "Configurer l'Exercice Fiscal": "Configure Fiscal Year",
  "Configurer les Journaux": "Configure Journals",
  "Créer un plan comptable personnalisé": "Create a custom chart of accounts",
  "Créer des journaux personnalisés": "Create custom journals",
  "Configurez votre plan comptable, exercice fiscal et journaux": "Configure your chart of accounts, fiscal year and journals",
  "Exercice Fiscal": "Fiscal Year",
  "Configurez votre exercice fiscal": "Configure your fiscal year",
  "Définissez les dates de votre exercice fiscal": "Set your fiscal year dates",
  "Fin de l'exercice": "Year end",
  "Erreur lors de l'enregistrement de l'exercice fiscal": "Error saving fiscal year",
  "Exercice fiscal enregistré avec succès": "Fiscal year saved successfully",
  "Début de l'exercice": "Year start",
  "Importer depuis un fichier": "Import from file",
  "Journaux Comptables": "Accounting Journals",
  "Configurez vos journaux comptables": "Configure your accounting journals",
  "Erreur lors de l'enregistrement des journaux": "Error saving journals",
  "Option de Journaux": "Journals Option",
  "Journaux enregistrés avec succès": "Journals saved successfully",
  "Mensuel": "Monthly",
  "Type de période": "Period type",
  "Trimestriel": "Quarterly",
  "Sélectionner une option": "Select an option",
  "Sélectionner le type": "Select type",
  "Configuration de la Comptabilité": "Accounting Configuration",
  "Utiliser le plan comptable par défaut": "Use default chart of accounts",
  "Utiliser les journaux par défaut": "Use default journals",

  // SYSCOHADA
  "Le SYSCOHADA révisé 2017 est le plan comptable légal dans les 17 pays membres de l'Organisation pour l'Harmonisation en Afrique du Droit des Affaires (OHADA).": "SYSCOHADA 2017 revised is the legal chart of accounts in the 17 member countries of the Organization for the Harmonization of Business Law in Africa (OHADA).",
  "Pays membre de l'OHADA": "OHADA Member Country",
  "Système Comptable OHADA": "OHADA Accounting System",
  "Voir tous les pays membres de l'OHADA": "View all OHADA member countries",

  // Accounting Main
  "Comptabilité & Finances": "Accounting & Finance",
  "Gérez vos écritures comptables et analyses financières": "Manage your accounting entries and financial analyses",

  // Stats
  "Solde total": "Total Balance",
  "Balance générale": "General Balance",
  "Total débit": "Total Debit",
  "Débits": "Debits",
  "Total crédit": "Total Credit",
  "Crédits": "Credits",
  "Écritures": "Entries",
  "Écritures saisies": "Recorded entries",
  "En attente": "Pending",
  "Écritures à valider": "Entries to validate",
  "Validées": "Validated",
  "Écritures comptabilisées": "Posted entries",
  "À recevoir": "Receivable",
  "À payer": "Payable",
  "En retard": "Overdue",
  "Taux validation": "Validation rate",
  "Écritures validées": "Validated entries",
  "Ce mois": "This month",
  "Ce trimestre": "This quarter",
  "Cette année": "This year",
  "Mois dernier": "Last month",
  "Année dernière": "Last year",
  "Période sélectionnée": "Selected period",

  // Journal Distribution
  "Répartition par journal": "Distribution by journal",
  "Aucune donnée disponible": "No data available",
  "Total journaux": "Total journals",
  "Total écritures": "Total entries",

  // Budget vs Actual
  "Budget vs Réel": "Budget vs Actual",
  "Aucune catégorie budgétaire disponible": "No budget category available",
  "Budget": "Budget",
  "Réel": "Actual",
  "Budget total": "Total Budget",
  "Réel total": "Total Actual",
  "Écart total": "Total Variance",

  // Actions
  "Actualiser": "Refresh",
  "Nouvelle écriture": "New Entry",
  "Créer une écriture comptable": "Create an accounting entry",
  "Voir les rapports": "View Reports",
  "Consulter les états financiers": "View financial statements",
  "Exporter les données": "Export Data",
  "Télécharger les écritures FEC": "Download FEC entries",

  // Export
  "Export comptable": "Accounting Export",
  "Générer un fichier d'export de vos écritures comptables (FEC, SYSCOHADA, etc.)": "Generate an export file of your accounting entries (FEC, SYSCOHADA, etc.)",
  "Exercice fiscal": "Fiscal year",
  "Date début": "Start date",
  "Date fin": "End date",
  "Format d'export": "Export format",
  "Encodage": "Encoding",
  "Inclure les écritures non validées": "Include unvalidated entries",
  "Générer l'export": "Generate export",
  "Export en cours...": "Exporting...",
  "Retélécharger": "Re-download",
  "Export réussi": "Export successful",
  "Erreur lors de l'export": "Export error",
  "Aucune écriture trouvée pour la période": "No entries found for the period",

  // Tabs
  "Vue d'ensemble": "Overview",
  "Plan comptable": "Chart of Accounts",
  "📥 Import FEC": "📥 FEC Import",
  "Journaux": "Journals",
  "Rapports": "Reports",
  "Anomalies": "Anomalies",

  // Nav
  "Opérations": "Operations",
  "Structure": "Structure",
  "Import FEC": "FEC Import",
  "Clôture": "Closing",

  // Recent Activity
  "Activité récente": "Recent Activity",
  "Aucune activité récente": "No recent activity",

  // Import
  "Importer des données": "Import Data",
  "Importez vos données comptables depuis différents formats": "Import your accounting data from various formats",
  "Importer CSV": "Import CSV",
  "Type d'import": "Import type",
  "Écritures comptables": "Accounting entries",

  // Common Actions
  "Ajouter": "Add",
  "Modifier": "Edit",
  "Supprimer": "Delete",
  "Enregistrer": "Save",
  "Annuler": "Cancel",
  "Confirmer": "Confirm",
  "Valider": "Validate",
  "Exporter": "Export",
  "Importer": "Import",
  "Télécharger": "Download",
  "Rechercher": "Search",
  "Filtrer": "Filter",
  "Créer": "Create",
  "Voir": "View",
  "Fermer": "Close",
  "Suivant": "Next",
  "Précédent": "Previous",
  "Retour": "Back",
  "Terminer": "Finish",
  "Passer": "Skip",
  "Continuer": "Continue",
  "Appliquer": "Apply",
  "Réinitialiser": "Reset",
  "Oui": "Yes",
  "Non": "No",
  "Tous": "All",
  "Aucun": "None",
  "Nouveau": "New",
  "Nouvelle": "New",

  // Status
  "Actif": "Active",
  "Inactif": "Inactive",
  "En cours": "In Progress",
  "Terminé": "Completed",
  "Brouillon": "Draft",
  "Payé": "Paid",
  "Impayé": "Unpaid",
  "Approuvé": "Approved",
  "Rejeté": "Rejected",
  "Soumis": "Submitted",
  "Complété": "Completed",

  // Messages
  "Succès": "Success",
  "Erreur": "Error",
  "Avertissement": "Warning",
  "Information": "Information",
  "Chargement...": "Loading...",
  "Aucun résultat": "No results",

  // Forms
  "Nom": "Name",
  "Prénom": "First Name",
  "Email": "Email",
  "Téléphone": "Phone",
  "Adresse": "Address",
  "Ville": "City",
  "Pays": "Country",
  "Code postal": "Postal Code",
  "Mot de passe": "Password",
  "Description": "Description",
  "Date": "Date",
  "Montant": "Amount",
  "Référence": "Reference",
  "Numéro": "Number",
  "Quantité": "Quantity",
  "Prix": "Price",
  "Total": "Total",
  "Sous-total": "Subtotal",

  // Navigation
  "Tableau de bord": "Dashboard",
  "Accueil": "Home",
  "Paramètres": "Settings",
  "Profil": "Profile",
  "Aide": "Help",
  "Documentation": "Documentation",
  "Support": "Support",
  "Se déconnecter": "Log out",
  "Déconnexion": "Logout",
  "Connexion": "Login",

  // Time
  "Aujourd'hui": "Today",
  "Hier": "Yesterday",
  "Demain": "Tomorrow",
  "Semaine": "Week",
  "Mois": "Month",
  "Année": "Year",
  "Jour": "Day",
  "Jours": "Days",
  "Heure": "Hour",
  "Heures": "Hours",

  // Invoicing
  "Facturation": "Invoicing",
  "Facture": "Invoice",
  "Factures": "Invoices",
  "Devis": "Quote",
  "Avoir": "Credit Note",
  "Échéance": "Due Date",
  "Remise": "Discount",

  // Banking
  "Transaction": "Transaction",
  "Transactions": "Transactions",
  "Virement": "Transfer",
  "Prélèvement": "Direct Debit",
  "Rapprochement": "Reconciliation",
  "Trésorerie": "Cash Flow",

  // HR
  "Ressources Humaines": "Human Resources",
  "Employé": "Employee",
  "Employés": "Employees",
  "Congé": "Leave",
  "Congés": "Leaves",
  "Salaire": "Salary",
  "Paie": "Payroll",
  "Contrat": "Contract",
  "Formation": "Training",
  "Département": "Department",

  // Accounting Terms
  "Comptabilité": "Accounting",
  "Écriture": "Entry",
  "Journal": "Journal",
  "Compte": "Account",
  "Comptes": "Accounts",
  "Débit": "Debit",
  "Crédit": "Credit",
  "Solde": "Balance",
  "Bilan": "Balance Sheet",
  "Compte de résultat": "Income Statement",
  "TVA": "VAT",
  "Taxe": "Tax",
  "Taxes": "Taxes",
  "Impôt": "Tax",
  "Charges": "Expenses",
  "Produits": "Revenue",
  "Capitaux": "Capital",
  "Immobilisations": "Fixed Assets",
  "Stocks": "Inventory",
  "Tiers": "Third Parties",
  "Fournisseurs": "Suppliers",
  "Fournisseur": "Supplier",
  "Clients": "Customers",
  "Client": "Customer",

  // Company
  "Entreprise": "Company",
  "Société": "Company",
  "Raison sociale": "Legal Name",

  // Billing Page
  "Facturation & Abonnement": "Billing & Subscription",
  "Gérez votre abonnement et vos factures": "Manage your subscription and invoices",
  "Mon abonnement": "My Subscription",
  "Moyens de paiement": "Payment Methods",
  "Historique des factures": "Invoice History",
  "Changer de plan": "Change Plan",
  "Gérer les paiements": "Manage Payments",
  "Voir l'historique": "View History",
  "Renouvellement dans": "Renewal in",
  "Prochain prélèvement": "Next payment",
  "Expiré depuis": "Expired since",
  "jour": "day",
  "jours": "days",
  "Période actuelle": "Current Period",
  "Annulation programmée": "Scheduled Cancellation",
  "Votre abonnement sera annulé le": "Your subscription will be cancelled on",
  "Période d'essai": "Trial Period",
  "Se termine le": "Ends on",
  "Utilisation": "Usage",
  "Utilisateurs": "Users",
  "Stockage": "Storage",
  "Gérer l'abonnement": "Manage Subscription",
  "Voir les factures": "View Invoices",
  "Aucun abonnement actif": "No Active Subscription",
  "Choisissez un plan pour débloquer toutes les fonctionnalités de CassKai": "Choose a plan to unlock all CassKai features",
  "Voir les plans": "View Plans",
  "Plan Gratuit": "Free Plan",
  "Accès de base à CassKai": "Basic access to CassKai",
  "Fonctionnalités incluses": "Included Features",
  "Base": "Basic",
  "Passer à Premium": "Upgrade to Premium",

  // Common phrases
  "Ce champ est obligatoire": "This field is required",
  "Veuillez corriger les erreurs": "Please fix the errors",
  "Erreurs dans le formulaire": "Form errors",
  "Enregistrer les modifications": "Save changes",
  "Êtes-vous sûr de vouloir supprimer": "Are you sure you want to delete",
  "Cette action ne peut pas être annulée": "This action cannot be undone",
  "Chargement en cours...": "Loading...",
  "Aucune donnée": "No data",
  "Rechercher...": "Search...",

  // Login/Auth
  "Connexion à votre compte": "Sign in to your account",
  "Créer un compte": "Create an account",
  "Mot de passe oublié ?": "Forgot password?",
  "Se souvenir de moi": "Remember me",
  "Ou continuer avec": "Or continue with",

  // Settings
  "Paramètres généraux": "General Settings",
  "Paramètres du compte": "Account Settings",
  "Notifications": "Notifications",
  "Sécurité": "Security",
  "Confidentialité": "Privacy",
  "Langue": "Language",
  "Thème": "Theme",
  "Clair": "Light",
  "Sombre": "Dark",
  "Système": "System",

  // Dashboard
  "Bienvenue": "Welcome",
  "Chiffre d'affaires": "Revenue",
  "Dépenses": "Expenses",
  "Résultat net": "Net Result",
  "Évolution": "Evolution",
  "Tendances": "Trends",
  "Performance": "Performance",

  // Subscriptions
  "Abonnement": "Subscription",
  "Plan": "Plan",
  "Prix": "Price",
  "par mois": "per month",
  "par an": "per year",
  "Starter": "Starter",
  "Pro": "Pro",
  "Entreprise": "Enterprise",
  "Gratuit": "Free",
  "Essai gratuit": "Free Trial",
  "jours d'essai": "trial days",
  "Fonctionnalités": "Features",
  "Illimité": "Unlimited",
  "Support prioritaire": "Priority Support",
  "Support dédié": "Dedicated Support",
  "Support par email": "Email Support",
};

// Dictionnaire français -> espagnol
const frToEsPhrases = {
  // Account Classes
  "Classe 1 - Comptes de capitaux": "Clase 1 - Cuentas de Capital",
  "Classe 2 - Comptes d'immobilisations": "Clase 2 - Cuentas de Activo Fijo",
  "Classe 3 - Comptes de stocks": "Clase 3 - Cuentas de Inventario",
  "Classe 4 - Comptes de tiers": "Clase 4 - Cuentas de Terceros",
  "Classe 5 - Comptes financiers": "Clase 5 - Cuentas Financieras",
  "Classe 6 - Comptes de charges": "Clase 6 - Cuentas de Gastos",
  "Classe 7 - Comptes de produits": "Clase 7 - Cuentas de Ingresos",
  "Classe 8 - Comptes spéciaux": "Clase 8 - Cuentas Especiales",
  "Classe 9 - Comptabilité analytique": "Clase 9 - Contabilidad Analítica",

  // Common
  "Compte créé avec succès": "Cuenta creada con éxito",
  "Description du compte": "Descripción de la cuenta",
  "Achats": "Compras",
  "Ventes": "Ventas",
  "Banque": "Banco",
  "Caisse": "Caja",
  "Général": "General",
  "À-nouveaux": "Apertura",

  // Actions
  "Ajouter": "Añadir",
  "Modifier": "Modificar",
  "Supprimer": "Eliminar",
  "Enregistrer": "Guardar",
  "Annuler": "Cancelar",
  "Confirmer": "Confirmar",
  "Valider": "Validar",
  "Actualiser": "Actualizar",
  "Exporter": "Exportar",
  "Importer": "Importar",
  "Télécharger": "Descargar",
  "Rechercher": "Buscar",
  "Filtrer": "Filtrar",
  "Créer": "Crear",
  "Voir": "Ver",
  "Fermer": "Cerrar",
  "Suivant": "Siguiente",
  "Précédent": "Anterior",
  "Retour": "Volver",
  "Terminer": "Finalizar",
  "Passer": "Omitir",
  "Continuer": "Continuar",
  "Appliquer": "Aplicar",
  "Réinitialiser": "Restablecer",
  "Oui": "Sí",
  "Non": "No",
  "Tous": "Todos",
  "Aucun": "Ninguno",
  "Nouveau": "Nuevo",
  "Nouvelle": "Nueva",

  // Status
  "Actif": "Activo",
  "Inactif": "Inactivo",
  "En cours": "En Progreso",
  "Terminé": "Completado",
  "En attente": "Pendiente",
  "Brouillon": "Borrador",
  "Payé": "Pagado",
  "Impayé": "Sin Pagar",
  "En retard": "Vencido",
  "Approuvé": "Aprobado",
  "Rejeté": "Rechazado",
  "Soumis": "Enviado",
  "Complété": "Completado",

  // Accounting
  "Comptabilité": "Contabilidad",
  "Comptabilité & Finances": "Contabilidad y Finanzas",
  "Gérez vos écritures comptables et analyses financières": "Gestione sus asientos contables y análisis financieros",
  "Écriture": "Asiento",
  "Écritures": "Asientos",
  "Journal": "Diario",
  "Journaux": "Diarios",
  "Compte": "Cuenta",
  "Comptes": "Cuentas",
  "Plan comptable": "Plan de Cuentas",
  "Débit": "Débito",
  "Crédit": "Crédito",
  "Solde": "Saldo",
  "Bilan": "Balance",
  "Compte de résultat": "Estado de Resultados",
  "Exercice fiscal": "Ejercicio Fiscal",
  "Clôture": "Cierre",
  "TVA": "IVA",
  "Taxe": "Impuesto",
  "Taxes": "Impuestos",
  "Charges": "Gastos",
  "Produits": "Ingresos",
  "Capitaux": "Capital",
  "Immobilisations": "Activos Fijos",
  "Stocks": "Inventario",
  "Tiers": "Terceros",
  "Fournisseurs": "Proveedores",
  "Fournisseur": "Proveedor",
  "Clients": "Clientes",
  "Client": "Cliente",

  // Stats
  "Solde total": "Saldo Total",
  "Balance générale": "Balance General",
  "Total débit": "Total Débito",
  "Débits": "Débitos",
  "Total crédit": "Total Crédito",
  "Crédits": "Créditos",
  "Écritures saisies": "Asientos registrados",
  "Écritures à valider": "Asientos por validar",
  "Validées": "Validados",
  "Écritures comptabilisées": "Asientos contabilizados",
  "À recevoir": "Por Cobrar",
  "À payer": "Por Pagar",
  "Taux validation": "Tasa de validación",
  "Écritures validées": "Asientos validados",
  "Ce mois": "Este mes",
  "Ce trimestre": "Este trimestre",
  "Cette année": "Este año",
  "Mois dernier": "Mes pasado",
  "Année dernière": "Año pasado",
  "Période sélectionnée": "Período seleccionado",

  // Navigation
  "Vue d'ensemble": "Vista General",
  "Tableau de bord": "Panel de Control",
  "Accueil": "Inicio",
  "Paramètres": "Configuración",
  "Profil": "Perfil",
  "Aide": "Ayuda",
  "Documentation": "Documentación",
  "Support": "Soporte",
  "Se déconnecter": "Cerrar Sesión",
  "Connexion": "Iniciar Sesión",

  // Invoicing
  "Facturation": "Facturación",
  "Facture": "Factura",
  "Factures": "Facturas",
  "Devis": "Presupuesto",
  "Avoir": "Nota de Crédito",
  "Montant": "Importe",
  "Prix": "Precio",
  "Total": "Total",
  "Sous-total": "Subtotal",
  "Remise": "Descuento",
  "Échéance": "Vencimiento",
  "Date": "Fecha",
  "Référence": "Referencia",
  "Numéro": "Número",
  "Description": "Descripción",
  "Quantité": "Cantidad",

  // HR
  "Ressources Humaines": "Recursos Humanos",
  "Employé": "Empleado",
  "Employés": "Empleados",
  "Congé": "Permiso",
  "Congés": "Permisos",
  "Salaire": "Salario",
  "Paie": "Nómina",
  "Contrat": "Contrato",
  "Formation": "Formación",
  "Département": "Departamento",

  // Time
  "Aujourd'hui": "Hoy",
  "Hier": "Ayer",
  "Demain": "Mañana",
  "Semaine": "Semana",
  "Mois": "Mes",
  "Année": "Año",
  "Jour": "Día",
  "Jours": "Días",
  "Mensuel": "Mensual",
  "Annuel": "Anual",
  "Trimestriel": "Trimestral",

  // Company
  "Entreprise": "Empresa",
  "Société": "Empresa",
  "Raison sociale": "Razón Social",

  // Messages
  "Succès": "Éxito",
  "Erreur": "Error",
  "Avertissement": "Advertencia",
  "Information": "Información",
  "Chargement...": "Cargando...",
  "Aucun résultat": "Sin resultados",
  "Aucune donnée": "Sin datos",
  "Aucune donnée disponible": "Sin datos disponibles",

  // Forms
  "Nom": "Nombre",
  "Prénom": "Nombre",
  "Email": "Correo Electrónico",
  "Téléphone": "Teléfono",
  "Adresse": "Dirección",
  "Ville": "Ciudad",
  "Pays": "País",
  "Code postal": "Código Postal",
  "Mot de passe": "Contraseña",

  // Billing
  "Facturation & Abonnement": "Facturación y Suscripción",
  "Gérez votre abonnement et vos factures": "Gestione su suscripción y facturas",
  "Mon abonnement": "Mi Suscripción",
  "Moyens de paiement": "Métodos de Pago",
  "Historique des factures": "Historial de Facturas",
  "Prochain prélèvement": "Próximo Cobro",
  "Période actuelle": "Período Actual",
  "Période d'essai": "Período de Prueba",
  "Utilisation": "Uso",
  "Utilisateurs": "Usuarios",
  "Stockage": "Almacenamiento",
  "Abonnement": "Suscripción",
  "Plan": "Plan",
  "par mois": "por mes",
  "par an": "por año",
  "Gratuit": "Gratis",
  "Essai gratuit": "Prueba Gratuita",
  "jours d'essai": "días de prueba",
  "Fonctionnalités": "Características",
  "Illimité": "Ilimitado",
  "Support prioritaire": "Soporte Prioritario",
  "Support dédié": "Soporte Dedicado",
  "Support par email": "Soporte por Email",

  // Dashboard
  "Bienvenue": "Bienvenido",
  "Chiffre d'affaires": "Ingresos",
  "Dépenses": "Gastos",
  "Résultat net": "Resultado Neto",

  // Settings
  "Paramètres généraux": "Configuración General",
  "Notifications": "Notificaciones",
  "Sécurité": "Seguridad",
  "Confidentialité": "Privacidad",
  "Langue": "Idioma",
  "Thème": "Tema",
  "Clair": "Claro",
  "Sombre": "Oscuro",
  "Système": "Sistema",
};

function translateValue(value, dictionary) {
  if (typeof value !== 'string') return value;

  // Recherche exacte d'abord
  if (dictionary[value]) {
    return dictionary[value];
  }

  // Si pas de traduction exacte, retourner l'original
  // Cela évite les traductions partielles incorrectes
  return value;
}

function translateObject(obj, dictionary) {
  if (typeof obj === 'string') {
    return translateValue(obj, dictionary);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => translateObject(item, dictionary));
  }

  if (typeof obj === 'object' && obj !== null) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = translateObject(value, dictionary);
    }
    return result;
  }

  return obj;
}

// Chemins des fichiers
const frPath = path.join(__dirname, '../src/i18n/locales/fr.json');
const enPath = path.join(__dirname, '../src/i18n/locales/en.json');
const esPath = path.join(__dirname, '../src/i18n/locales/es.json');

try {
  console.log('Reading fr.json...');
  const frContent = fs.readFileSync(frPath, 'utf8');
  const frJson = JSON.parse(frContent);

  console.log('Generating en.json...');
  const enJson = translateObject(frJson, frToEnPhrases);
  fs.writeFileSync(enPath, JSON.stringify(enJson, null, 2), 'utf8');
  console.log('en.json generated successfully!');

  console.log('Generating es.json...');
  const esJson = translateObject(frJson, frToEsPhrases);
  fs.writeFileSync(esPath, JSON.stringify(esJson, null, 2), 'utf8');
  console.log('es.json generated successfully!');

  console.log('Done! Note: Only phrases with exact matches were translated.');
  console.log('Phrases without matches remain in French and should be manually translated.');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
