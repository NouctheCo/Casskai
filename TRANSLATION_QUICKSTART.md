# Guide Rapide - Compléter les Traductions Manquantes

## Étape 1 : Lancer l'audit (Déjà fait ✅)

```bash
node audit-translations.cjs
```

**Résultat :** 289 clés manquantes identifiées

---

## Étape 2 : Générer les fichiers de traduction (Déjà fait ✅)

```bash
node generate-missing-translations.cjs
```

**Fichiers générés :**
- `missing-translations-fr.json` (268 clés)
- `missing-translations-en.json` (268 clés)
- `missing-translations-es.json` (268 clés)

---

## Étape 3 : Compléter les traductions marquées [TODO]

### Exemple du fichier `missing-translations-fr.json` :

#### ✅ Déjà traduit (64 clés)
```json
{
  "journal_entries": {
    "edit": "Modifier",
    "new": "Nouvelle écriture",
    "date": "Date"
  }
}
```

#### ❌ À traduire (204 clés)
```json
{
  "accounting": {
    "setup": {
      "fiscalYearSaved": "[TODO: accounting.setup.fiscalYearSaved]",
      "title": "[TODO: accounting.setup.title]"
    }
  }
}
```

### Comment compléter ?

**1. Ouvrir le fichier :**
```bash
code missing-translations-fr.json
```

**2. Rechercher les `[TODO: ...]` et remplacer :**

**Avant :**
```json
"fiscalYearSaved": "[TODO: accounting.setup.fiscalYearSaved]"
```

**Après :**
```json
"fiscalYearSaved": "Exercice fiscal enregistré avec succès"
```

---

## Étape 4 : Traductions Prioritaires

### Module : journal_entries (✅ FAIT)
```json
{
  "journal_entries": {
    "edit": "Modifier",
    "new": "Nouvelle écriture",
    "date": "Date",
    "debit": "Débit",
    "credit": "Crédit",
    "balanced": "Équilibré"
  }
}
```

### Module : accounting.setup (À FAIRE - PRIORITÉ 1)

**Français :**
```json
{
  "accounting": {
    "setup": {
      "fiscalYearSaved": "Exercice fiscal enregistré avec succès",
      "fiscalYearError": "Erreur lors de l'enregistrement de l'exercice fiscal",
      "journalsSaved": "Journaux enregistrés avec succès",
      "journalsError": "Erreur lors de l'enregistrement des journaux",
      "completed": "Configuration terminée",
      "title": "Configuration comptable",
      "description": "Configurez votre plan comptable, exercice fiscal et journaux",
      "chartOfAccounts": "Plan comptable",
      "chartOfAccountsDesc": "Choisissez votre plan comptable",
      "fiscalYear": "Exercice fiscal",
      "fiscalYearDesc": "Définissez votre exercice fiscal",
      "journals": "Journaux",
      "journalsDesc": "Configurez vos journaux comptables",
      "useDefaultChart": "Utiliser le plan par défaut",
      "createCustomChart": "Créer un plan personnalisé",
      "importFromFile": "Importer depuis un fichier",
      "monthly": "Mensuel",
      "quarterly": "Trimestriel",
      "annual": "Annuel"
    }
  }
}
```

**Anglais :**
```json
{
  "accounting": {
    "setup": {
      "fiscalYearSaved": "Fiscal year saved successfully",
      "fiscalYearError": "Error saving fiscal year",
      "journalsSaved": "Journals saved successfully",
      "journalsError": "Error saving journals",
      "completed": "Setup completed",
      "title": "Accounting Setup",
      "description": "Configure your chart of accounts, fiscal year and journals",
      "chartOfAccounts": "Chart of Accounts",
      "chartOfAccountsDesc": "Choose your chart of accounts",
      "fiscalYear": "Fiscal Year",
      "fiscalYearDesc": "Define your fiscal year",
      "journals": "Journals",
      "journalsDesc": "Configure your accounting journals",
      "useDefaultChart": "Use default chart",
      "createCustomChart": "Create custom chart",
      "importFromFile": "Import from file",
      "monthly": "Monthly",
      "quarterly": "Quarterly",
      "annual": "Annual"
    }
  }
}
```

**Espagnol :**
```json
{
  "accounting": {
    "setup": {
      "fiscalYearSaved": "Ejercicio fiscal guardado con éxito",
      "fiscalYearError": "Error al guardar el ejercicio fiscal",
      "journalsSaved": "Diarios guardados con éxito",
      "journalsError": "Error al guardar los diarios",
      "completed": "Configuración completada",
      "title": "Configuración contable",
      "description": "Configure su plan de cuentas, ejercicio fiscal y diarios",
      "chartOfAccounts": "Plan de cuentas",
      "chartOfAccountsDesc": "Elija su plan de cuentas",
      "fiscalYear": "Ejercicio fiscal",
      "fiscalYearDesc": "Defina su ejercicio fiscal",
      "journals": "Diarios",
      "journalsDesc": "Configure sus diarios contables",
      "useDefaultChart": "Usar plan predeterminado",
      "createCustomChart": "Crear plan personalizado",
      "importFromFile": "Importar desde archivo",
      "monthly": "Mensual",
      "quarterly": "Trimestral",
      "annual": "Anual"
    }
  }
}
```

### Module : validation (À FAIRE - PRIORITÉ 2)

**Français :**
```json
{
  "validation": {
    "required": "Champ obligatoire",
    "fieldRequired": "Ce champ est obligatoire",
    "formErrors": "Le formulaire contient des erreurs",
    "fixErrors": "Veuillez corriger les erreurs",
    "string": {
      "minLength": "Doit contenir au moins {{min}} caractères",
      "maxLength": "Ne doit pas dépasser {{max}} caractères"
    },
    "number": {
      "min": "Doit être au moins {{min}}",
      "max": "Ne doit pas dépasser {{max}}"
    }
  }
}
```

**Anglais :**
```json
{
  "validation": {
    "required": "Required field",
    "fieldRequired": "This field is required",
    "formErrors": "The form contains errors",
    "fixErrors": "Please fix the errors",
    "string": {
      "minLength": "Must be at least {{min}} characters",
      "maxLength": "Must not exceed {{max}} characters"
    },
    "number": {
      "min": "Must be at least {{min}}",
      "max": "Must not exceed {{max}}"
    }
  }
}
```

**Espagnol :**
```json
{
  "validation": {
    "required": "Campo obligatorio",
    "fieldRequired": "Este campo es obligatorio",
    "formErrors": "El formulario contiene errores",
    "fixErrors": "Por favor corrija los errores",
    "string": {
      "minLength": "Debe tener al menos {{min}} caracteres",
      "maxLength": "No debe exceder {{max}} caracteres"
    },
    "number": {
      "min": "Debe ser al menos {{min}}",
      "max": "No debe exceder {{max}}"
    }
  }
}
```

### Module : CRM (À FAIRE - PRIORITÉ 3)

**Français - Actions CRM :**
```json
{
  "crm": {
    "action": {
      "new": "Nouvelle action",
      "created": "Action créée avec succès",
      "errors": {
        "createFailed": "Erreur lors de la création de l'action"
      },
      "validation": {
        "subjectRequired": "Le sujet est obligatoire"
      },
      "fields": {
        "subject": "Sujet",
        "type": "Type",
        "client": "Client",
        "opportunity": "Opportunité",
        "dueDate": "Date d'échéance",
        "dueTime": "Heure d'échéance",
        "priority": "Priorité",
        "notes": "Notes"
      },
      "placeholders": {
        "subject": "Entrez le sujet de l'action",
        "selectClient": "Sélectionnez un client",
        "selectOpportunity": "Sélectionnez une opportunité",
        "notes": "Ajoutez des notes..."
      },
      "sections": {
        "relations": "Relations",
        "schedule": "Planification"
      },
      "noClient": "Aucun client disponible",
      "noOpportunity": "Aucune opportunité disponible",
      "selectClientFirst": "Sélectionnez d'abord un client"
    }
  }
}
```

---

## Étape 5 : Fusionner avec les fichiers existants

### Option 1 : Fusion Manuelle (Recommandé)

**1. Ouvrir les fichiers de traduction existants :**
```bash
code src/i18n/locales/fr.json
```

**2. Copier-coller les nouvelles traductions :**
- Ouvrir `missing-translations-fr.json`
- Copier les sections complétées
- Les ajouter dans `src/i18n/locales/fr.json` au bon endroit

**3. Répéter pour EN et ES**

### Option 2 : Script Automatique (À créer)

```bash
# À FAIRE : Créer le script de fusion
node merge-translations.cjs
```

---

## Étape 6 : Vérifier que ça fonctionne

**1. Démarrer l'application :**
```bash
npm run dev
```

**2. Tester les modules :**
- ✅ Aller sur la page Comptabilité
- ✅ Créer une écriture comptable
- ✅ Aller sur le CRM
- ✅ Changer de langue (FR/EN/ES)

**3. Vérifier qu'il n'y a plus de :**
- `[TODO: ...]`
- Clés non traduites (affichées comme `accounting.setup.title`)

---

## Aide-Mémoire : Patterns de Traduction

### Messages de Succès
```json
{
  "success": {
    "saved": "Enregistré avec succès",
    "created": "Créé avec succès",
    "updated": "Mis à jour avec succès",
    "deleted": "Supprimé avec succès"
  }
}
```

### Messages d'Erreur
```json
{
  "errors": {
    "loadFailed": "Erreur lors du chargement",
    "saveFailed": "Erreur lors de l'enregistrement",
    "deleteFailed": "Erreur lors de la suppression",
    "notFound": "Non trouvé",
    "required": "Ce champ est obligatoire"
  }
}
```

### Actions Communes
```json
{
  "common": {
    "actions": {
      "save": "Enregistrer",
      "cancel": "Annuler",
      "delete": "Supprimer",
      "edit": "Modifier",
      "create": "Créer",
      "close": "Fermer",
      "confirm": "Confirmer",
      "back": "Retour"
    }
  }
}
```

---

## Checklist de Complétion

### Phase 1 - Critique
- [ ] Compléter accounting.setup (30 clés)
- [ ] Compléter journal_entries (28 clés) ✅
- [ ] Compléter validation (16 clés)
- [ ] Compléter crm.action (20 clés)
- [ ] Compléter crm.client (30 clés)
- [ ] Compléter crm.opportunity (20 clés)

### Phase 2 - Important
- [ ] Compléter termsOfService (30+ clés)
- [ ] Compléter contracts (10 clés)
- [ ] Compléter inventorypage (15 clés)
- [ ] Compléter projectspage (10 clés)

### Phase 3 - Secondaire
- [ ] Compléter auth (5 clés) ✅
- [ ] Compléter welcomeTour (5 clés) ✅
- [ ] Compléter common (10 clés) ✅
- [ ] Compléter les messages success/errors

---

## Ressources Utiles

### Outils de Traduction
- Google Translate : https://translate.google.com
- DeepL : https://www.deepl.com (meilleure qualité)
- Reverso Context : https://context.reverso.net (contexte métier)

### Glossaire Comptable
- FR → EN : Plan comptable = Chart of Accounts
- FR → EN : Écriture = Entry
- FR → EN : Journal = Journal
- FR → EN : Débit = Debit
- FR → EN : Crédit = Credit

### Glossaire CRM
- FR → EN : Client = Client/Customer
- FR → EN : Opportunité = Opportunity
- FR → EN : Action = Action/Task
- FR → EN : Pipeline = Pipeline

---

**Dernière mise à jour :** 28 novembre 2025
**Contact :** Équipe technique CassKai
