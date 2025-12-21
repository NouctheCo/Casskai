# 📤 Export comptable FEC et Multi-format - CassKai

## Vue d'ensemble

CassKai dispose d'un **générateur d'export comptable universel** qui permet d'exporter vos écritures comptables dans différents formats selon votre région et standard comptable.

## 🎯 Obligation légale FEC (France)

En France, l'export FEC est **obligatoire** depuis 2014 pour toute entreprise soumise à un contrôle fiscal (Article A.47 A-1 du Livre des Procédures Fiscales).

### Format FEC obligatoire

Le fichier FEC doit contenir **18 colonnes** dans cet ordre exact :

| # | Colonne | Description | Format |
|---|---------|-------------|--------|
| 1 | JournalCode | Code journal | Texte max 10 |
| 2 | JournalLib | Libellé journal | Texte max 100 |
| 3 | EcritureNum | Numéro d'écriture | Texte max 20 |
| 4 | EcritureDate | Date écriture | YYYYMMDD |
| 5 | CompteNum | Numéro de compte | Texte max 20 |
| 6 | CompteLib | Libellé compte | Texte max 100 |
| 7 | CompAuxNum | Compte auxiliaire | Texte max 20 (optionnel) |
| 8 | CompAuxLib | Libellé auxiliaire | Texte max 100 (optionnel) |
| 9 | PieceRef | Référence pièce | Texte max 50 |
| 10 | PieceDate | Date pièce | YYYYMMDD |
| 11 | EcritureLib | Libellé écriture | Texte max 200 |
| 12 | Debit | Montant débit | Nombre (virgule) |
| 13 | Credit | Montant crédit | Nombre (virgule) |
| 14 | EcritureLet | Code lettrage | Texte max 10 (optionnel) |
| 15 | DateLet | Date lettrage | YYYYMMDD (optionnel) |
| 16 | ValidDate | Date validation | YYYYMMDD |
| 17 | Montantdevise | Montant devise | Nombre (optionnel) |
| 18 | Idevise | Code devise | Texte max 3 (optionnel) |

### Règles de nommage FEC
- **Format** : `{SIREN}FEC{YYYYMMDD}.txt`
- **Exemple** : `123456789FEC20241231.txt`
- **Séparateur** : `|` (pipe)
- **Décimale** : `,` (virgule)
- **Encodage** : UTF-8 ou ISO-8859-1

## 🌍 Formats d'export supportés

| Format | Région | Standard | Séparateur | Décimale | Devise |
|--------|--------|----------|------------|----------|--------|
| **FEC** | 🇫🇷 France | PCG | `\|` | `,` | EUR |
| **SYSCOHADA** | 🌍 Afrique OHADA | SYSCOHADA | `;` | `,` | XOF, XAF |
| **SCF** | 🇲🇦🇩🇿🇹🇳 Maghreb | SCF | `\|` | `,` | MAD, DZD, TND |
| **IFRS** | 🌐 International | IFRS | `,` | `.` | Variable |
| **CSV** | 📊 Universel | Générique | `,` | `.` | Variable |

## 📋 Caractéristiques des formats

### Format FEC (France)
- **18 colonnes obligatoires** selon DGFiP
- Dates au format `YYYYMMDD`
- Montants avec virgule décimale
- Nom de fichier : `{SIREN}FEC{DATE}.txt`
- **Conformité** : 100% conforme à l'article A.47 A-1 du LPF

### Format SYSCOHADA (Afrique OHADA)
- **11 colonnes principales**
- Adapté au plan comptable OHADA
- Support des devises XOF (FCFA Ouest) et XAF (FCFA Central)
- Pays membres : Bénin, Burkina Faso, Cameroun, Centrafrique, Comores, Congo, Côte d'Ivoire, Gabon, Guinée, Guinée-Bissau, Guinée équatoriale, Mali, Niger, RD Congo, Sénégal, Tchad, Togo

### Format SCF (Maghreb)
- **11 colonnes adaptées**
- Compatible avec le Système Comptable Financier
- Pays : Maroc (MAD), Algérie (DZD), Tunisie (TND)
- Structure similaire au FEC mais adaptée

### Format IFRS (International)
- **12 colonnes standards**
- Dates au format ISO `YYYY-MM-DD`
- Montants avec point décimal
- Compatible Excel et systèmes internationaux

### Format CSV (Générique)
- **Format universel**
- Compatible avec tous les tableurs
- Séparateur virgule, décimale point
- Échappement CSV automatique

## 🚀 Utilisation

### 1. Accès à l'export

1. Naviguer vers **Comptabilité** → Vue d'ensemble
2. Cliquer sur **"Exporter les données"** dans les actions rapides
3. Le modal d'export s'ouvre

### 2. Configuration de l'export

#### Période
- **Exercice fiscal** : Sélectionner l'année (6 dernières années disponibles)
- **Dates personnalisées** : Ajuster les dates de début et fin si nécessaire

#### Format
- **Auto-détection** : Le format est pré-sélectionné selon le standard comptable de votre entreprise
- **Choix manuel** : Vous pouvez choisir un autre format si besoin

#### Options
- **Encodage** :
  - `UTF-8` : Recommandé (compatibilité moderne)
  - `ISO-8859-1` : Pour les anciens logiciels comptables
- **Écritures non validées** : Cocher pour les inclure dans l'export

### 3. Génération et téléchargement

1. Cliquer sur **"Générer l'export"**
2. Patienter pendant la génération (quelques secondes)
3. Le fichier se télécharge automatiquement
4. Un résumé s'affiche avec les statistiques

### 4. Statistiques de l'export

Après génération, vous voyez :
- **Nombre d'écritures** exportées
- **Nombre de lignes** comptables
- **Total Débit** et **Total Crédit**
- **Équilibre** (vérification débit = crédit)
- **Journaux exportés** (liste des codes)
- **Avertissements** (déséquilibres, écritures non validées)

### 5. Retéléchargement

Si vous fermez la fenêtre, vous pouvez cliquer sur **"Retélécharger"** pour récupérer le même fichier sans le régénérer.

## 📊 Exemples de fichiers exportés

### Exemple FEC (France)

```
JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise
VT|Ventes|001|20240101|411000|Clients||||||1000,00|0,00|||20240101||
VT|Ventes|001|20240101|707000|Ventes de marchandises||||||0,00|1000,00|||20240101||
```

### Exemple SYSCOHADA (Afrique OHADA)

```
NumCompte;IntituleCompte;CodeJournal;LibelleJournal;NumPiece;DatePiece;Libelle;Debit;Credit;Devise;DateValidation
411;Clients;VT;Ventes;FV-001;20240101;Facture client;1000;0;XOF;20240101
701;Ventes de marchandises;VT;Ventes;FV-001;20240101;Facture client;0;1000;XOF;20240101
```

### Exemple IFRS (International)

```
AccountCode,AccountName,JournalCode,JournalName,EntryNumber,TransactionDate,Reference,Description,Debit,Credit,Currency,ValidationDate
1100,Accounts Receivable,SA,Sales,001,2024-01-01,INV-001,Customer invoice,1000.00,0.00,USD,2024-01-01
4000,Sales Revenue,SA,Sales,001,2024-01-01,INV-001,Customer invoice,0.00,1000.00,USD,2024-01-01
```

## ⚠️ Points d'attention

### Validation des données

Avant l'export, assurez-vous que :
- ✅ Toutes les écritures sont **équilibrées** (débit = crédit)
- ✅ Les écritures importantes sont **validées**
- ✅ Les dates sont **cohérentes** avec l'exercice fiscal
- ✅ Les comptes et journaux sont **correctement nommés**

### Contrôles automatiques

CassKai effectue automatiquement :
- ✅ Vérification de l'équilibre global
- ✅ Détection des écritures non validées
- ✅ Validation des formats de dates
- ✅ Nettoyage des caractères spéciaux
- ✅ Formatage des montants selon le standard

### Avertissements

Des avertissements peuvent apparaître si :
- ⚠️ **Déséquilibre détecté** : Différence entre débit et crédit > 0,01 €
- ⚠️ **Écritures non validées** : Si vous avez coché l'option d'inclusion
- ⚠️ **Aucune écriture** : Période sélectionnée sans données

## 🔍 Vérification du fichier

### Après export FEC

1. **Nom du fichier** : Vérifier qu'il commence par votre SIREN
2. **Taille** : Vérifier qu'elle est cohérente avec vos données
3. **Ouverture** : Ouvrir dans un éditeur de texte ou Excel
4. **En-tête** : Vérifier la présence des 18 colonnes
5. **Données** : Contrôler quelques lignes au hasard

### Validation avec TestCompta (France)

Pour les exports FEC en France, vous pouvez utiliser l'outil **TestCompta** de la DGFiP :
1. Télécharger TestCompta sur le site impots.gouv.fr
2. Charger votre fichier FEC
3. Lancer les tests de conformité
4. Corriger les erreurs éventuelles

## 🛠️ Dépannage

### Le fichier ne se télécharge pas

**Solutions :**
- Vérifier que les popups ne sont pas bloquées
- Essayer avec un autre navigateur
- Vider le cache du navigateur
- Vérifier l'espace disque disponible

### Erreur "Aucune écriture trouvée"

**Solutions :**
- Vérifier la période sélectionnée
- S'assurer qu'il y a des écritures saisies
- Vérifier que l'entreprise sélectionnée est la bonne
- Rafraîchir la page et réessayer

### Déséquilibre détecté

**Solutions :**
- Vérifier les écritures déséquilibrées dans l'onglet "Écritures"
- Corriger les écritures problématiques
- Régénérer l'export

### Caractères mal affichés

**Solutions :**
- Essayer l'encodage UTF-8 au lieu de ISO-8859-1
- Ouvrir avec un éditeur de texte au lieu d'Excel
- Utiliser l'import CSV d'Excel en spécifiant l'encodage

### Format non reconnu par le logiciel cible

**Solutions :**
- Vérifier que vous avez choisi le bon format
- Essayer le format CSV générique si le format spécifique ne fonctionne pas
- Contacter le support du logiciel cible pour connaître le format attendu

## 📚 Références légales et techniques

### France - FEC
- **Article A.47 A-1 du LPF** : Obligation de remise du FEC
- **BOI-CF-IOR-60-40** : Bulletin Officiel des Impôts sur le FEC
- **TestCompta** : Outil de validation DGFiP

### OHADA - SYSCOHADA
- **Acte uniforme OHADA** : Système comptable harmonisé
- **SYSCOHADA révisé 2017** : Version actuelle du référentiel

### International - IFRS
- **IFRS Foundation** : Standards comptables internationaux
- **IAS/IFRS** : Normes applicables

## 💡 Bonnes pratiques

1. **Exporter régulièrement**
   - À la fin de chaque mois
   - À la clôture de l'exercice
   - Avant tout contrôle fiscal

2. **Archiver les exports**
   - Conserver pendant 10 ans minimum (obligation légale France)
   - Organiser par année et mois
   - Sauvegarder sur plusieurs supports

3. **Vérifier systématiquement**
   - Toujours ouvrir et contrôler le fichier généré
   - Vérifier l'équilibre global
   - Contrôler quelques écritures au hasard

4. **Anticiper les contrôles**
   - Générer un FEC test avant un contrôle
   - Le valider avec TestCompta
   - Corriger les erreurs à l'avance

5. **Documenter**
   - Noter la date de chaque export
   - Conserver une trace des paramètres utilisés
   - Documenter les corrections apportées

## 🎯 Cas d'usage

### Contrôle fiscal (France)
→ Export FEC, période = exercice complet, validation des écritures

### Audit comptable
→ Export au format approprié, période = exercice complet, avec écritures non validées

### Migration vers un autre logiciel
→ Export CSV générique ou format natif du logiciel cible

### Sauvegarde mensuelle
→ Export du mois écoulé, archivage systématique

### Transmission à l'expert-comptable
→ Export du format qu'il utilise (souvent FEC ou CSV)

## 📞 Support

En cas de problème avec l'export :
1. Consulter cette documentation
2. Vérifier les [Issues GitHub](https://github.com/anthropics/claude-code/issues)
3. Contacter le support CassKai avec :
   - Le format d'export utilisé
   - Le message d'erreur exact
   - Une capture d'écran si possible
   - Les statistiques affichées

---

**Version** : 1.0.0
**Date** : Décembre 2024
**Auteur** : CassKai Team - NOUTCHE CONSEIL
