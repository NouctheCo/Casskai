# Amélioration des Fonctionnalités Comptables - Documentation

## Résumé des Changements

Ce document décrit les améliorations apportées au module comptable de CassKai pour répondre aux besoins suivants :
1. Rendre les libellés, types, classes et catégories budgétaires visibles et mappables
2. Permettre la création d'écritures dans le volet journaux
3. Automatiser la création de journaux à partir du plan comptable
4. Appliquer une logique d'expert-comptable pour un système cohérent et intelligent

## Nouvelles Fonctionnalités

### 1. Création Automatique des Journaux

**Fichier**: `src/components/accounting/JournalsManagement.tsx`

Le composant crée automatiquement 5 journaux standards au premier chargement :
- **VTE** - Journal des Ventes
- **ACH** - Journal des Achats  
- **BQ1** - Banque Principale
- **CAI** - Caisse Espèces
- **OD** - Opérations Diverses

Cette fonctionnalité s'active automatiquement lorsque l'utilisateur accède à l'onglet "Journaux" pour la première fois.

### 2. Catégories Budgétaires pour les Comptes

**Fichier**: `src/components/accounting/ChartOfAccountsTab.tsx`

Ajout d'un champ "Catégorie budgétaire" dans le formulaire de création/modification de compte avec les options suivantes :
- Charges d'exploitation
- Charges de personnel
- Charges financières
- Produits d'exploitation
- Produits financiers
- Investissements
- Financement

Ce champ permet de consolider les comptes pour l'analyse budgétaire et les rapports financiers.

### 3. Assistant d'Écritures Comptables

**Fichier**: `src/components/accounting/JournalEntryHelper.tsx`

Nouveau composant proposant 8 modèles d'écritures courantes :

1. **Facturation client (TTC)** - Vente avec TVA
2. **Facture fournisseur (TTC)** - Achat avec TVA récupérable
3. **Encaissement client** - Réception de paiement en banque
4. **Règlement fournisseur** - Paiement d'une facture
5. **Paiement de salaires** - Enregistrement des salaires nets
6. **Vente au comptant** - Vente payée immédiatement en espèces
7. **À-nouveau** - Report des soldes d'ouverture
8. **Frais bancaires** - Prélèvement de frais

Chaque modèle pré-remplit automatiquement :
- Les comptes à débiter et créditer
- Le journal approprié
- Une description type
- Les montants à ajuster

### 4. Service de Création Automatique des Comptes

**Fichier**: `src/services/accountsAutoCreationService.ts`

Service intelligent avec 3 modes d'import :

#### Mode Essentiel (Recommandé)
Crée ~80 comptes les plus utilisés :
- Classe 1 : Capital, Réserves, Report à nouveau, Résultat
- Classe 2 : Immobilisations corporelles et amortissements
- Classe 3 : Stocks et marchandises
- Classe 4 : Clients, Fournisseurs, Personnel, TVA
- Classe 5 : Banque, Caisse, Valeurs mobilières
- Classe 6 : Achats, Services, Charges de personnel, Charges financières
- Classe 7 : Ventes, Prestations, Produits financiers

#### Mode Complet PCG
Importe le plan comptable général français complet avec tous les comptes standards.

#### Mode Sectoriel
Plans adaptés par secteur d'activité :
- **Commerce** : Focus ventes marchandises et stocks
- **Services** : Focus prestations et charges de personnel
- **Industrie** : Focus production, stocks, immobilisations
- **Libéral** : Comptes simplifiés pour professions libérales

### 5. Intégration dans l'Assistant de Configuration

**Fichier**: `src/components/accounting/SetupWizard.tsx`

L'assistant de configuration propose maintenant :
- Import des comptes essentiels (recommandé)
- Import du PCG complet
- Création de journaux par défaut

Processus guidé en 3 étapes :
1. Configuration du plan comptable
2. Définition de l'exercice fiscal
3. Création des journaux

### 6. Bouton d'Import Rapide

**Fichier**: `src/components/accounting/ChartOfAccounts.tsx`

Ajout d'un bouton "Importer comptes essentiels" dans l'onglet Plan Comptable permettant d'importer rapidement les comptes essentiels sans passer par l'assistant.

### 7. Bouton "Utiliser un Modèle"

**Fichier**: `src/components/accounting/JournalEntriesTab.tsx`

Nouveau bouton dans l'onglet Écritures Comptables qui ouvre l'assistant de modèles. 
L'utilisateur peut :
1. Filtrer par catégorie (Ventes, Achats, Banque, Caisse, Divers)
2. Sélectionner un modèle
3. Voir les comptes impliqués visuellement
4. Appliquer le modèle qui pré-remplit le formulaire

## Logique Comptable Expert

### Respect des Normes PCG

Tous les comptes et modèles suivent le Plan Comptable Général français :
- Structure de classes 1 à 7
- Numérotation standard
- Relations parent-enfant correctes
- Types de comptes appropriés (Actif, Passif, Capitaux propres, Produits, Charges)

### Principe de la Partie Double

Chaque modèle d'écriture respecte :
- Équilibre Débit = Crédit
- Contrepartie systématique
- Logique économique de l'opération

### Gestion de la TVA

Les modèles incluent :
- TVA collectée (compte 445710) pour les ventes
- TVA déductible (compte 445660) pour les achats
- Calcul automatique du montant HT

### Catégorisation Budgétaire

Le mapping automatique des comptes en catégories budgétaires permet :
- Consolidation pour l'analyse financière
- Génération de rapports budgétaires
- Suivi des coûts par nature

## Utilisation

### Pour Créer une Nouvelle Écriture Rapidement

1. Aller dans "Écritures Comptables"
2. Cliquer sur "Utiliser un modèle"
3. Sélectionner le type d'opération
4. Ajuster les montants
5. Enregistrer

### Pour Importer le Plan Comptable

**Via l'Assistant :**
1. Cliquer sur "Assistant de Configuration"
2. Configurer le plan comptable
3. Choisir "Comptes essentiels"
4. Valider

**Via l'Import Rapide :**
1. Aller dans "Plan Comptable"
2. Cliquer sur "Importer comptes essentiels"
3. Confirmer

### Pour les Journaux

Les journaux se créent automatiquement au premier accès à l'onglet "Journaux". 
Aucune action manuelle n'est nécessaire.

## Architecture Technique

### Nouveaux Composants

- `JournalEntryHelper.tsx` - Sélecteur interactif de modèles
- `accountsAutoCreationService.ts` - Service de création automatique des comptes

### Composants Modifiés

- `JournalsManagement.tsx` - Auto-création des journaux
- `ChartOfAccountsTab.tsx` - Ajout catégorie budgétaire
- `JournalEntriesTab.tsx` - Intégration du helper
- `SetupWizard.tsx` - Connexion au service d'auto-création
- `ChartOfAccounts.tsx` - Bouton d'import rapide

### Services

Le `accountsAutoCreationService` utilise les données PCG de `src/data/pcg.ts` pour générer les comptes selon les standards français.

## Avantages

1. **Gain de Temps** : Plus besoin de créer manuellement des dizaines de comptes
2. **Conformité** : Respect automatique des normes PCG
3. **Facilité** : Modèles d'écritures pour les opérations courantes
4. **Intelligence** : Mapping automatique des catégories budgétaires
5. **Flexibilité** : Choix entre import essentiel, complet ou par secteur
6. **Formation** : Les modèles servent de référence pour apprendre la comptabilité

## Prochaines Étapes Possibles

- [ ] Ajouter plus de modèles d'écritures sectoriels
- [ ] Implémenter l'import de plan comptable depuis fichier CSV
- [ ] Créer des modèles d'écritures personnalisables par l'utilisateur
- [ ] Ajouter la génération automatique d'écritures récurrentes
- [ ] Intégrer la validation automatique des écritures par règles métier

## Notes Techniques

### Dépendances

Le système utilise :
- `src/data/pcg.ts` - Données du Plan Comptable Général
- `src/services/journalsService.ts` - Gestion des journaux
- `src/hooks/useJournals.ts` - Hook React pour les journaux
- `src/hooks/useAccounting.ts` - Hook React pour la comptabilité

### Base de Données

Les modifications nécessitent les tables suivantes (déjà existantes) :
- `accounts` - Comptes comptables
- `journals` - Journaux
- `journal_entries` - Écritures comptables
- `journal_entry_lines` - Lignes d'écritures

### Champs Ajoutés

Nouveau champ dans `accounts` :
- `budget_category` (string, nullable) - Catégorie budgétaire

## Support

Pour toute question sur l'utilisation ou l'extension de ces fonctionnalités, consulter :
- Le code source des composants mentionnés
- La documentation du Plan Comptable Général français
- Les normes de comptabilité applicables à votre juridiction
