#!/usr/bin/env python3
"""
Script de traduction automatique des fichiers i18n
Traduit tous les textes français manquants vers l'anglais et l'espagnol
"""

import json
import re
from pathlib import Path

# Dictionnaire de traductions communes FR -> EN (ordre important: phrases complètes avant mots simples)
FR_TO_EN = {
    # Phrases complètes
    "Bienvenue {{name}} ! 🎉": "Welcome {{name}}! 🎉",
    "Bienvenue sur CassKai": "Welcome to CassKai",
    "Créer vos premières écritures": "Create your first entries",
    "Commencez par enregistrer vos opérations comptables": "Start by recording your accounting operations",
    "Émettre votre première facture": "Issue your first invoice",
    "Créez et envoyez des factures à vos clients": "Create and send invoices to your clients",
    "Connecter votre banque": "Connect your bank",
    "Synchronisez vos comptes bancaires pour un suivi automatique": "Sync your bank accounts for automatic tracking",
    "Inviter votre équipe": "Invite your team",
    "Ajoutez des collaborateurs à votre espace": "Add collaborators to your workspace",
    "Nous préparons votre espace de travail personnalisé...": "We're preparing your personalized workspace...",
    "est prêt à démarrer.": "is ready to get started.",
    "Compte créé avec succès": "Account created successfully",
    "étapes complétées": "steps completed",
    "Progression de la configuration": "Setup progress",
    "Premiers pas recommandés": "Recommended first steps",
    "Étape": "Step",
    "Besoin d'aide ?": "Need help?",
    "Notre équipe est là pour vous accompagner dans la prise en main de CassKai": "Our team is here to guide you through CassKai",
    "Commencez à saisir vos données": "Start entering your data",
    "Chiffre d'affaires": "Revenue",
    "Dépenses": "Expenses",
    "Factures": "Invoices",
    
    # Navigation
    "Tableau de bord": "Dashboard",
    "Comptabilité": "Accounting",
    "Facturation": "Invoicing",
    "Banque": "Banking",
    "Budget": "Budget",
    "Fiscalité": "Tax",
    "Tiers": "Third Parties",
    "Clients": "Clients",
    "Fournisseurs": "Suppliers",
    "CRM": "CRM",
    "Inventaire": "Inventory",
    "Achats": "Purchases",
    "Projets": "Projects",
    "Ressources Humaines": "Human Resources",
    "Rapports": "Reports",
    "Paramètres": "Settings",
    "Documentation": "Documentation",
    "Support": "Support",
    "Tutoriels vidéo": "Video tutorials",
    
    # Actions
    "Ajouter": "Add",
    "Modifier": "Edit",
    "Supprimer": "Delete",
    "Enregistrer": "Save",
    "Annuler": "Cancel",
    "Valider": "Validate",
    "Rechercher": "Search",
    "Filtrer": "Filter",
    "Exporter": "Export",
    "Importer": "Import",
    "Télécharger": "Download",
    "Créer": "Create",
    "Voir": "View",
    "Ajouter": "Add",
    "Nouveau": "New",
    
    # Mots communs
    "vos": "your",
    "votre": "your",
    "premières": "first",
    "premier": "first",
    "première": "first",
    "écritures": "entries",
    "opérations": "operations",
    "facture": "invoice",
    "banque": "bank",
    "comptes": "accounts",
    "équipe": "team",
    "espace": "workspace",
    "données": "data",
    
    # Statuts
    "Actif": "Active",
    "Inactif": "Inactive",
    "En attente": "Pending",
    "Validé": "Validated",
    "Brouillon": "Draft",
    "Terminé": "Completed",
    
    # Communs
    "Nom": "Name",
    "Prénom": "First Name",
    "Email": "Email",
    "Téléphone": "Phone",
    "Adresse": "Address",
    "Ville": "City",
    "Code postal": "Postal Code",
    "Pays": "Country",
    "Description": "Description",
    "Date": "Date",
    "Montant": "Amount",
    "Total": "Total",
    "Devise": "Currency",
    "Langue": "Language",
    "Oui": "Yes",
    "Non": "No",
    "Succès": "Success",
    "Erreur": "Error",
    "Attention": "Warning",
    "Information": "Information",
    "Chargement": "Loading",
    "Aucun résultat": "No results",
    "Résultats": "Results",
}

# Dictionnaire de traductions FR -> ES (ordre important: phrases complètes avant mots simples)
FR_TO_ES = {
    # Phrases complètes
    "Bienvenue {{name}} ! 🎉": "¡Bienvenido {{name}}! 🎉",
    "Bienvenue sur CassKai": "Bienvenido a CassKai",
    "Créer vos premières écritures": "Crear sus primeros asientos",
    "Commencez par enregistrer vos opérations comptables": "Comience por registrar sus operaciones contables",
    "Émettre votre première facture": "Emitir su primera factura",
    "Créez et envoyez des factures à vos clients": "Cree y envíe facturas a sus clientes",
    "Connecter votre banque": "Conectar su banco",
    "Synchronisez vos comptes bancaires pour un suivi automatique": "Sincronice sus cuentas bancarias para un seguimiento automático",
    "Inviter votre équipe": "Invitar a su equipo",
    "Ajoutez des collaborateurs à votre espace": "Agregue colaboradores a su espacio",
    "Nous préparons votre espace de travail personnalisé...": "Estamos preparando su espacio de trabajo personalizado...",
    "est prêt à démarrer.": "está listo para comenzar.",
    "Compte créé avec succès": "Cuenta creada con éxito",
    "étapes complétées": "pasos completados",
    "Progression de la configuration": "Progreso de la configuración",
    "Premiers pas recommandés": "Primeros pasos recomendados",
    "Étape": "Paso",
    "Besoin d'aide ?": "¿Necesita ayuda?",
    "Notre équipe est là pour vous accompagner dans la prise en main de CassKai": "Nuestro equipo está aquí para guiarlo en el uso de CassKai",
    "Commencez à saisir vos données": "Comience a ingresar sus datos",
    "Chiffre d'affaires": "Facturación",
    "Dépenses": "Gastos",
    "Factures": "Facturas",
    
    # Navigation
    "Tableau de bord": "Panel de Control",
    "Comptabilité": "Contabilidad",
    "Facturation": "Facturación",
    "Banque": "Banco",
    "Budget": "Presupuesto",
    "Fiscalité": "Fiscalidad",
    "Tiers": "Terceros",
    "Clients": "Clientes",
    "Fournisseurs": "Proveedores",
    "CRM": "CRM",
    "Inventaire": "Inventario",
    "Achats": "Compras",
    "Projets": "Proyectos",
    "Ressources Humaines": "Recursos Humanos",
    "Rapports": "Informes",
    "Paramètres": "Configuración",
    "Documentation": "Documentación",
    "Support": "Soporte",
    "Tutoriels vidéo": "Tutoriales en video",
    
    # Actions
    "Ajouter": "Añadir",
    "Modifier": "Modificar",
    "Supprimer": "Eliminar",
    "Enregistrer": "Guardar",
    "Annuler": "Cancelar",
    "Valider": "Validar",
    "Rechercher": "Buscar",
    "Filtrer": "Filtrar",
    "Exporter": "Exportar",
    "Importer": "Importar",
    "Télécharger": "Descargar",
    "Créer": "Crear",
    "Voir": "Ver",
    "Ajouter": "Añadir",
    "Nouveau": "Nuevo",
    
    # Mots communs
    "vos": "sus",
    "votre": "su",
    "premières": "primeros",
    "premier": "primer",
    "première": "primera",
    "écritures": "asientos",
    "opérations": "operaciones",
    "facture": "factura",
    "banque": "banco",
    "comptes": "cuentas",
    "équipe": "equipo",
    "espace": "espacio",
    "données": "datos",
    
    # Statuts
    "Actif": "Activo",
    "Inactif": "Inactivo",
    "En attente": "Pendiente",
    "Validé": "Validado",
    "Brouillon": "Borrador",
    "Terminé": "Completado",
    
    # Communs
    "Nom": "Nombre",
    "Prénom": "Nombre",
    "Email": "Correo",
    "Téléphone": "Teléfono",
    "Adresse": "Dirección",
    "Ville": "Ciudad",
    "Code postal": "Código Postal",
    "Pays": "País",
    "Description": "Descripción",
    "Date": "Fecha",
    "Montant": "Importe",
    "Total": "Total",
    "Devise": "Moneda",
    "Langue": "Idioma",
    "Oui": "Sí",
    "Non": "No",
    "Succès": "Éxito",
    "Erreur": "Error",
    "Attention": "Atención",
    "Information": "Información",
    "Chargement": "Cargando",
    "Aucun résultat": "Sin resultados",
    "Résultats": "Resultados",
}

def translate_text(text: str, target_lang: str) -> str:
    """Traduit un texte français vers l'anglais ou l'espagnol"""
    if not isinstance(text, str):
        return text
    
    dictionary = FR_TO_EN if target_lang == 'en' else FR_TO_ES
    
    # Recherche exacte d'abord
    if text in dictionary:
        return dictionary[text]
    
    # Recherche partielle pour les phrases composées
    result = text
    for fr, translation in dictionary.items():
        result = result.replace(fr, translation)
    
    # Si aucune traduction trouvée, retourner le texte français
    # (mieux que [UNTRANSLATED])
    return result

def translate_dict(obj, target_lang: str, parent_key=""):
    """Traduit récursivement un dictionnaire"""
    if isinstance(obj, dict):
        result = {}
        for key, value in obj.items():
            new_key = f"{parent_key}.{key}" if parent_key else key
            result[key] = translate_dict(value, target_lang, new_key)
        return result
    elif isinstance(obj, list):
        return [translate_dict(item, target_lang, parent_key) for item in obj]
    elif isinstance(obj, str):
        return translate_text(obj, target_lang)
    else:
        return obj

def main():
    base_path = Path("src/i18n/locales")
    
    # Charger le fichier français de référence
    with open(base_path / "fr.json", "r", encoding="utf-8") as f:
        fr_data = json.load(f)
    
    print("🔄 Traduction des fichiers...")
    print(f"✅ Fichier français chargé: {len(json.dumps(fr_data))} caractères")
    
    # Traduire en anglais
    print("\n📝 Traduction vers l'anglais...")
    en_data = translate_dict(fr_data, 'en')
    with open(base_path / "en.json", "w", encoding="utf-8") as f:
        json.dump(en_data, f, ensure_ascii=False, indent=2)
    print(f"✅ Fichier anglais généré: {len(json.dumps(en_data))} caractères")
    
    # Traduire en espagnol
    print("\n📝 Traduction vers l'espagnol...")
    es_data = translate_dict(fr_data, 'es')
    with open(base_path / "es.json", "w", encoding="utf-8") as f:
        json.dump(es_data, f, ensure_ascii=False, indent=2)
    print(f"✅ Fichier espagnol généré: {len(json.dumps(es_data))} caractères")
    
    print("\n✅ Traduction terminée!")
    print("ℹ️  Note: Les traductions utilisent un dictionnaire de base.")
    print("   Pour des traductions plus précises, utilisez un service de traduction professionnel.")

if __name__ == "__main__":
    main()
