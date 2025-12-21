# Rapport d'Audit Complet des Traductions - CassKai

**Date de l'audit:** 28 novembre 2025
**Analysé par:** Script automatisé d'audit des traductions
**Fichiers analysés:** 750 fichiers sources (.tsx, .ts, .jsx, .js)

---

## Résumé Exécutif

### Vue d'ensemble

| Métrique | Valeur |
|----------|--------|
| **Clés dans FR** | 2,441 |
| **Clés dans EN** | 2,441 |
| **Clés dans ES** | 2,437 |
| **Clés utilisées dans le code** | 1,143 |
| **Fichiers sources analysés** | 750 |

### Taux de Complétion

| Langue | Taux | Clés Valides | Clés Manquantes |
|--------|------|--------------|-----------------|
| 🇫🇷 **Français** | **188.3%** | 2,152 / 1,143 | 289 |
| 🇬🇧 **Anglais** | **188.3%** | 2,152 / 1,143 | 289 |
| 🇪🇸 **Espagnol** | **187.9%** | 2,148 / 1,143 | 289 |

> **Note:** Le taux supérieur à 100% indique qu'il existe des clés orphelines (définies mais non utilisées).

---

## Problèmes Identifiés

### 1. Clés de Traduction Manquantes (289 clés)

Les **289 clés** suivantes sont utilisées dans le code mais **absentes dans les 3 langues** :

#### Catégorie: Écritures Comptables (journal_entries)
- `journal_entries.no_enterprise_selected`
- `journal_entries.supabase_not_configured`
- `journal_entries.network_error`
- `journal_entries.edit`
- `journal_entries.new`
- `journal_entries.retry`
- `journal_entries.date`
- `journal_entries.selectDate`
- `journal_entries.journal`
- `journal_entries.selectJournal`
- `journal_entries.no_journals_found`
- `journal_entries.no_code`
- `journal_entries.untitledJournal`
- `journal_entries.reference`
- `journal_entries.description`
- `journal_entries.items`
- `journal_entries.add_item`
- `journal_entries.account`
- `journal_entries.debit`
- `journal_entries.credit`
- `journal_entries.no_accounts_found`
- `journal_entries.remove_item`
- `journal_entries.difference`
- `journal_entries.balanced`
- `journal_entries.unbalanced`
- `journal_entries.cancel`
- `journal_entries.update`
- `journal_entries.create`

#### Catégorie: Configuration Comptable (accounting.setup)
- `accounting.setup.fiscalYearSaved`
- `accounting.setup.fiscalYearError`
- `accounting.setup.journalsSaved`
- `accounting.setup.journalsError`
- `accounting.setup.completed`
- `accounting.setup.title`
- `accounting.setup.description`
- `accounting.setup.chartOfAccounts`
- `accounting.setup.chartOfAccountsDesc`
- `accounting.setup.fiscalYear`
- `accounting.setup.fiscalYearDesc`
- `accounting.setup.journals`
- `accounting.setup.journalsDesc`
- `accounting.setup.configureChartOfAccounts`
- `accounting.setup.chartOfAccountsDialogDesc`
- `accounting.setup.chartOption`
- `accounting.setup.selectChartOption`
- `accounting.setup.useDefaultChart`
- `accounting.setup.createCustomChart`
- `accounting.setup.importFromFile`
- `accounting.setup.configureFiscalYear`
- `accounting.setup.fiscalYearDialogDesc`
- `accounting.setup.fiscalYearStart`
- `accounting.setup.fiscalYearEnd`
- `accounting.setup.periodType`
- `accounting.setup.selectPeriodType`
- `accounting.setup.monthly`
- `accounting.setup.quarterly`
- `accounting.setup.annual`
- `accounting.setup.configureJournals`
- `accounting.setup.journalsDialogDesc`
- `accounting.setup.journalsOption`
- `accounting.setup.selectJournalsOption`
- `accounting.setup.useDefaultJournals`
- `accounting.setup.createCustomJournals`

#### Catégorie: CRM - Actions
- `crm.action.validation.subjectRequired`
- `crm.action.created`
- `crm.action.errors.createFailed`
- `crm.action.new`
- `crm.action.fields.subject`
- `crm.action.placeholders.subject`
- `crm.action.fields.type`
- `crm.action.sections.relations`
- `crm.action.fields.client`
- `crm.action.placeholders.selectClient`
- `crm.action.noClient`
- `crm.action.fields.opportunity`
- `crm.action.selectClientFirst`
- `crm.action.placeholders.selectOpportunity`
- `crm.action.noOpportunity`
- `crm.action.sections.schedule`
- `crm.action.fields.dueDate`
- `crm.action.fields.dueTime`
- `crm.action.fields.priority`
- `crm.action.fields.notes`
- `crm.action.placeholders.notes`

#### Catégorie: CRM - Clients
- `crm.client.validation.nameRequired`
- `crm.client.created`
- `crm.client.errors.createFailed`
- `crm.client.new`
- `crm.client.sections.basicInfo`
- `crm.client.fields.companyName`
- `crm.client.placeholders.companyName`
- `crm.client.fields.type`
- `crm.client.types.prospect`
- `crm.client.types.client`
- `crm.client.types.supplier`
- `crm.client.types.other`
- `crm.client.sections.contact`
- `crm.client.fields.email`
- `crm.client.placeholders.email`
- `crm.client.fields.phone`
- `crm.client.placeholders.phone`
- `crm.client.sections.address`
- `crm.client.fields.address`
- `crm.client.placeholders.address`
- `crm.client.fields.postalCode`
- `crm.client.placeholders.postalCode`
- `crm.client.fields.city`
- `crm.client.placeholders.city`
- `crm.client.fields.country`
- `crm.client.placeholders.country`
- `crm.client.sections.legal`
- `crm.client.fields.siret`
- `crm.client.placeholders.siret`
- `crm.client.fields.vatNumber`
- `crm.client.placeholders.vatNumber`
- `crm.client.fields.notes`
- `crm.client.placeholders.notes`

#### Catégorie: CRM - Opportunités
- `crm.opportunity.errors.loadClientsFailed`
- `crm.opportunity.validation.titleRequired`
- `crm.opportunity.validation.clientRequired`
- `crm.opportunity.created`
- `crm.opportunity.errors.createFailed`
- `crm.opportunity.new`
- `crm.opportunity.fields.title`
- `crm.opportunity.placeholders.title`
- `crm.opportunity.fields.client`
- `crm.opportunity.placeholders.selectClient`
- `crm.opportunity.noClients`
- `crm.opportunity.sections.financial`
- `crm.opportunity.fields.amount`
- `crm.opportunity.placeholders.amount`
- `crm.opportunity.fields.probability`
- `crm.opportunity.fields.weightedAmount`
- `crm.opportunity.sections.pipeline`
- `crm.opportunity.fields.stage`
- `crm.stages.lead`
- `crm.stages.qualified`
- `crm.opportunity.fields.priority`
- `crm.opportunity.sections.timeline`
- `crm.opportunity.fields.expectedCloseDate`
- `crm.opportunity.fields.notes`
- `crm.opportunity.placeholders.notes`

#### Catégorie: Validation de Formulaires
- `validation.required`
- `validation.asyncError`
- `validation.formErrors`
- `validation.fixErrors`
- `validation.unexpectedError`
- `validation.fieldRequired`
- `validation.string.lengthBetween`
- `validation.string.minLength`
- `validation.string.maxLength`
- `validation.string.invalidLength`
- `validation.number.between`
- `validation.number.min`
- `validation.number.max`
- `validation.number.invalidRange`
- `validation.fieldMatch`
- `validation.customFormat`

#### Catégorie: Authentification
- `auth.emailAddress`
- `auth.emailPlaceholder`
- `auth.sending`
- `auth.sendResetEmail`
- `auth.backToLogin`

#### Catégorie: Dashboard Bienvenue
- `dashboard.welcome.steps.${stepConfig.id}.title`
- `dashboard.welcome.steps.${stepConfig.id}.description`
- `dashboard.welcome.help.${link.id}`
- `dashboard.welcome.stats.${stat.id}`

#### Catégorie: Conditions Générales
- `termsOfService.title`
- `termsOfService.subtitle`
- `termsOfService.lastUpdated`
- `termsOfService.preamble.title`
- `termsOfService.preamble.content`
- `termsOfService.preamble.legalInfo`
- `termsOfService.preamble.fields.denomination`
- `termsOfService.preamble.company.name`
- `termsOfService.preamble.fields.legalForm`
- `termsOfService.preamble.company.legalForm`
- `termsOfService.preamble.fields.capital`
- `termsOfService.preamble.company.capital`
- `termsOfService.preamble.fields.siren`
- `termsOfService.preamble.company.siren`
- `termsOfService.preamble.fields.siret`
- `termsOfService.preamble.company.siret`
- `termsOfService.preamble.fields.rcs`
- `termsOfService.preamble.company.rcs`
- `termsOfService.preamble.fields.vat`
- `termsOfService.preamble.company.vat`
- `termsOfService.preamble.fields.nafCode`
- `termsOfService.preamble.company.nafCode`
- `termsOfService.preamble.fields.collectiveAgreement`
- `termsOfService.preamble.company.collectiveAgreement`
- `termsOfService.definitions.title`
- `termsOfService.definitions.platform`
- `termsOfService.definitions.editor`
- `termsOfService.definitions.user`
- `termsOfService.definitions.client`
- `termsOfService.definitions.services`
- `termsOfService.definitions.data`
- `termsOfService.definitions.account`
- `termsOfService.acceptance.title`
- `termsOfService.acceptance.content`
- `termsOfService.acceptance.binding`
- `termsOfService.acceptance.updates`
- `termsOfService.acceptance.notification`

#### Catégorie: Contrats
- `contracts.form.edit_title`
- `contracts.form.edit_description`

#### Catégorie: Achats
- `purchases.notifications.deleteTitle`

#### Catégorie: Inventaire (inventorypage)
- `inventorypage.ajoutez_un_nouvel_article_votre_stock`
- `inventorypage.ref001`
- `inventorypage.ordinateur_portable_dell`
- `inventorypage.description`
- `inventorypage.matriel_informatique`
- `inventorypage.fournitures_bureau`
- `inventorypage.marchandises`
- `inventorypage.80000`
- `inventorypage.120000`
- `inventorypage.pice`
- `inventorypage.mtre`
- `inventorypage.litre`
- `inventorypage.entrept_alle_3`
- `inventorypage.annuler`
- `inventorypage.ajouter_larticle`

#### Catégorie: Projets (projectspage)
- `projectspage.crez_un_nouveau_projet`
- `projectspage.refonte_site_web_client_abc`
- `projectspage.slectionner_un_client`
- `projectspage.slectionnez_une_date`
- `projectspage.slectionner_un_responsable`
- `projectspage.en_prparation`
- `projectspage.en_pause`
- `projectspage.annuler`
- `projectspage.crer_le_projet`

#### Catégorie: Messages Génériques
- `noParent`
- `currency`
- `close`
- `pageNotFound`
- `goHome`
- `chart.aucune_donne_afficher`
- `common.noCompanySelected`
- `common.errors.noCompany`
- `common.actions.cancel`
- `common.actions.saving`
- `common.actions.create`

#### Catégorie: Tour de Bienvenue
- `welcomeTour.skip`
- `welcomeTour.previous`
- `welcomeTour.stepCounter`
- `welcomeTour.finish`
- `welcomeTour.next`

#### Catégorie: Configuration Entreprise
- `setup.company.sectors.african`
- `setup.company.sectors.default`

#### Catégorie: Autres (Règles, Succès, Erreurs)
- `confirm.deleteRule`
- `success.ruleDeleted`
- `success.ruleAdded`
- `success.ruleUpdated`
- `success.categorized`
- `success.bulkCategorized`
- `success.ignored`
- `success.ruleCreated`
- `success.distributionApplied`
- `success.adjusted`
- `errors.deleteRule`
- `errors.fillFields`
- `errors.addRule`
- `errors.updateRule`
- `errors.loadData`
- `errors.categorization`
- `errors.ignore`
- `errors.ruleCreation`
- `errors.loadAccounts`
- `errors.enterAnnualAmount`
- `rules.title`
- `searchTransactions`

#### Clés Dynamiques (à vérifier manuellement)
- `accountTypes.${account.account_type}`
- `accountTypes.${account.account_type?.toUpperCase()}`
- `accounting.journalTypes.${journal.type}`
- `accounting.journalTypes.${selectedJournal.type}`
- `crm.clientSize.${client.size}`
- `crm.clientStatus.${client.status}`
- `crm.clientForm.companyNamePlaceholder`
- `crm.actionStatus.${action.status}`
- `crm.priority.${action.priority}`
- `crm.stages.${stage.stage}`
- `crm.stages.${opportunity.stage}`
- `crm.priority.${opportunity.priority}`
- `crm.client.types.${client.type}`
- `purchases.status.${filters.payment_status}`
- `contracts.status.${calc.status}`
- `contracts.status.${contract.status}`
- `contracts.type.${contract.contract_type}`
- `contracts.rfa_status.${calc.status}`

---

### 2. Clés Orphelines (1,587 clés)

**1,587 clés** sont définies dans les fichiers de traduction mais **jamais utilisées** dans le code. Ceci représente un excès de ~65% de clés inutilisées.

#### Exemples de clés orphelines (Top 50) :

**Thèmes/Apparence:**
- `translation.light`
- `translation.dark`
- `translation.system`

**Landing Page:**
- `landing.features.hr.badge`
- `landing.testimonials.marie.content`
- `landing.testimonials.pierre.content`
- `landing.testimonials.sophie.content`
- `landing.footer.ssl`
- `landing.footer.gdpr_compliant`
- `landing.footer.company.title`
- `landing.footer.product.integrations`

**Sidebar:**
- `sidebar.accountingImport`
- `sidebar.bank`
- `sidebar.banques`
- `sidebar.taxes`
- `sidebar.sales`
- `sidebar.gestion`
- `sidebar.inventaire`
- `sidebar.thirdParties`
- `sidebar.tiers`
- `sidebar.humanResources`
- `sidebar.forecasts`
- `sidebar.settings`
- `sidebar.search`
- `sidebar.modules`

**Prévisions (Forecasts):**
- `forecasts.title`
- `forecasts.description`
- `forecasts.forecastsDashboard.title`
- `forecasts.forecastsDashboard.totalForecasts`
- `forecasts.forecastsDashboard.activeScenarios`
- `forecasts.forecastsDashboard.avgAccuracy`
- `forecasts.scenarios.optimistic`
- `forecasts.scenarios.realistic`
- `forecasts.scenarios.pessimistic`
- `forecasts.status.draft`
- `forecasts.status.review`
- `forecasts.buttons.newForecast`

**Contrats:**
- `contracts.description`
- `contracts.stats.total_rfa_paid`
- `contracts.status.active`
- `contracts.status.expired`
- `contracts.alerts.tier_approaching`
- `contracts.buttons.new_contract`

**CRM Dashboard:**
- `crm.crmDashboard.title`
- `crm.crmDashboard.stats.totalClients`
- `crm.crmDashboard.stats.activeOpportunities`
- `crm.crmDashboard.pipeline.title`

**HR (Ressources Humaines):**
- `hr.title`
- `hr.description`
- `hr.employees.title`
- `hr.employees.add`
- `hr.contractTypes.cdi`
- `hr.training.title`

> **Note complète:** Voir le fichier `translation-audit-report.json` pour la liste exhaustive des 1,587 clés orphelines.

---

### 3. Textes Hardcodés (Top 20 Fichiers)

**20 fichiers** contiennent des **textes en dur** qui devraient être internationalisés :

| Rang | Occurrences | Fichier |
|------|-------------|---------|
| 1 | 18 | `src/pages/TermsOfServicePage.tsx` |
| 2 | 15 | `src/components/inventory/InventoryDialogs.tsx` |
| 3 | 14 | `src/components/reports/FinancialReportsPage.tsx` |
| 4 | 11 | `src/components/ai/PredictiveDashboard.tsx` |
| 5 | 10 | `src/components/settings/NotificationSettings.tsx` |
| 6 | 10 | `src/data/hr-document-templates-defaults.ts` |
| 7 | 10 | `src/pages/ProjectsPage.tsx` |
| 8 | 10 | `src/pages/TaxPage.tsx` |
| 9 | 10 | `src/services/sendgridEmailService.ts` |
| 10 | 9 | `src/components/account/AccountDeletionWizard.tsx` |
| 11 | 9 | `src/components/admin/DataGovernanceDashboard.tsx` |
| 12 | 9 | `src/components/einvoicing/EInvoiceSettings.tsx` |
| 13 | 9 | `src/pages/CookiesPolicyPage.tsx` |
| 14 | 9 | `src/pages/TermsOfSalePage.tsx` |
| 15 | 8 | `src/components/hr/ReviewFormModal.tsx` |
| 16 | 8 | `src/components/invoicing/OptimizedPaymentsTab.tsx` |
| 17 | 8 | `src/pages/GDPRPage.tsx` |
| 18 | 7 | `src/components/dashboard/DashboardWidgetRenderer.tsx` |
| 19 | 7 | `src/components/hr/HRAnalyticsDashboard.tsx` |
| 20 | 7 | `src/components/reports/ModernReportsIntegration.tsx` |

---

## Recommandations

### Priorité 1 - CRITIQUE (À faire immédiatement)

#### 1.1 Ajouter les 289 clés manquantes

**Impact:** Bugs d'affichage, textes non traduits

**Action requise:**
```bash
# Créer un script pour générer les clés manquantes
node scripts/add-missing-translation-keys.cjs
```

**Catégories prioritaires:**
1. **journal_entries** (28 clés) - Module comptabilité critique
2. **accounting.setup** (30 clés) - Configuration initiale
3. **crm.action, crm.client, crm.opportunity** (80+ clés) - Module CRM complet
4. **validation** (16 clés) - Validation de formulaires
5. **termsOfService** (30+ clés) - Mentions légales obligatoires

#### 1.2 Internationaliser les fichiers critiques avec textes hardcodés

**Fichiers prioritaires:**
- `src/pages/TermsOfServicePage.tsx` (18 occurrences)
- `src/components/inventory/InventoryDialogs.tsx` (15 occurrences)
- `src/pages/TaxPage.tsx` (10 occurrences)

### Priorité 2 - IMPORTANT (À faire dans les 2 semaines)

#### 2.1 Nettoyer les clés orphelines

**Impact:** Réduction de la taille des bundles, meilleure maintenabilité

**Action:**
1. Valider que les clés ne sont vraiment jamais utilisées
2. Créer un backup des clés supprimées
3. Supprimer progressivement par catégorie

**Gain estimé:**
- Réduction de ~40% de la taille des fichiers de traduction
- Suppression de 1,587 clés inutilisées

#### 2.2 Standardiser les conventions de nommage

**Problèmes détectés:**
- Mélange de formats : `inventorypage.xxx` vs `inventory.xxx`
- Clés dynamiques mal gérées : `accountTypes.${variable}`

**Solutions:**
1. Utiliser un format cohérent : `module.category.key`
2. Pour les clés dynamiques, créer des fonctions d'aide

### Priorité 3 - AMÉLIORATION (À planifier)

#### 3.1 Mettre en place un système de validation

**Outils recommandés:**
- Pre-commit hook pour vérifier les traductions
- CI/CD pour valider que toutes les clés utilisées existent
- Script de détection des textes hardcodés

#### 3.2 Documentation

**À créer:**
- Guide de contribution pour les traductions
- Convention de nommage des clés
- Process pour ajouter de nouvelles langues

---

## Scripts Disponibles

### 1. Audit des traductions
```bash
node audit-translations.cjs
```

### 2. Générer un rapport JSON
```bash
# Le rapport est automatiquement généré dans translation-audit-report.json
```

### 3. Vérifier une clé spécifique
```bash
# À créer : script pour vérifier si une clé existe dans toutes les langues
node scripts/check-translation-key.cjs "crm.client.new"
```

---

## Métriques de Qualité

### Couverture de Traduction
- ✅ **FR:** 188.3% (2,152 clés valides / 1,143 utilisées)
- ✅ **EN:** 188.3% (2,152 clés valides / 1,143 utilisées)
- ✅ **ES:** 187.9% (2,148 clés valides / 1,143 utilisées)

### Santé du Projet
- ⚠️ **Clés manquantes:** 289 (25.3%)
- ⚠️ **Clés orphelines:** 1,587 (65.0%)
- ⚠️ **Fichiers avec hardcoding:** 20+ fichiers

### Score de Qualité Global
**Score: 6.5/10**

**Détails:**
- ✅ Bon: Toutes les langues ont le même nombre de clés
- ✅ Bon: Grande base de traductions existantes
- ⚠️ Moyen: 25% de clés manquantes
- ❌ Faible: 65% de clés orphelines
- ⚠️ Moyen: Textes hardcodés dans plusieurs fichiers critiques

---

## Plan d'Action Recommandé

### Phase 1 - Semaine 1-2 (Correctif Critique)
1. ✅ Générer les 289 clés manquantes avec des traductions de base
2. ✅ Traduire en priorité les modules critiques (journal_entries, crm, validation)
3. ✅ Tester que l'application fonctionne dans les 3 langues

### Phase 2 - Semaine 3-4 (Nettoyage)
1. ✅ Auditer les clés orphelines par catégorie
2. ✅ Créer un backup avant suppression
3. ✅ Supprimer progressivement les clés non utilisées

### Phase 3 - Semaine 5-6 (Amélioration)
1. ✅ Internationaliser les 20 fichiers avec textes hardcodés
2. ✅ Mettre en place les hooks de validation
3. ✅ Documenter le processus de traduction

### Phase 4 - Maintenance Continue
1. ✅ Valider automatiquement les nouvelles PR
2. ✅ Ajouter des tests pour les traductions
3. ✅ Monitorer l'utilisation des clés

---

## Annexes

### A. Fichiers Générés
- `translation-audit-report.json` - Rapport JSON complet
- `audit-translations.cjs` - Script d'audit

### B. Ressources
- Documentation i18next : https://www.i18next.com/
- Guide React i18next : https://react.i18next.com/

### C. Contact
Pour toute question sur ce rapport, contacter l'équipe technique CassKai.

---

**Fin du rapport**
