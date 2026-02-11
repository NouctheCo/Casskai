# 📚 Guide Utilisateur CassKai - Phase 2 (Nouvelles Fonctionnalités)

**Version:** 1.5.0
**Date:** Février 2026
**Destiné à:** Utilisateurs finaux CassKai

---

## 🎯 Introduction

Bienvenue dans le guide des **nouvelles fonctionnalités Phase 2** de CassKai ! Cette mise à jour majeure améliore considérablement votre expérience avec :

- ✨ **Application mobile** (PWA) - Installez CassKai sur votre téléphone
- 📊 **Rapports interactifs** - Explorez vos données en profondeur
- ⚡ **Tableaux de bord temps réel** - Données mises à jour automatiquement
- 🚀 **Performance améliorée** - Application 2x plus rapide
- 💎 **Nouveaux composants** - Interface moderne et intuitive

---

## 📱 Application Mobile (PWA)

### Qu'est-ce qu'une PWA ?

CassKai est maintenant une **Progressive Web App (PWA)**, ce qui signifie que vous pouvez l'installer sur votre téléphone comme une application native, sans passer par les stores Apple ou Google.

### Installation sur votre téléphone

#### iPhone / iPad (Safari)

1. Ouvrez Safari et allez sur **https://casskai.app**
2. Cliquez sur le bouton **Partager** (icône carré avec flèche vers le haut)
3. Sélectionnez **"Sur l'écran d'accueil"**
4. Donnez un nom (ex: "CassKai") et cliquez **"Ajouter"**
5. ✅ L'icône CassKai apparaît sur votre écran d'accueil !

#### Android (Chrome)

1. Ouvrez Chrome et allez sur **https://casskai.app**
2. Une bannière "Installer CassKai" apparaît en bas de l'écran
3. Cliquez sur **"Installer"**
4. ✅ L'application s'installe et un raccourci est créé !

**Astuce:** Vous pouvez aussi cliquer sur le menu ⋮ > "Installer l'application" ou "Ajouter à l'écran d'accueil".

### Avantages de l'app mobile

✅ **Fonctionne hors ligne** - Consultez vos rapports même sans connexion
✅ **Plus rapide** - Démarre instantanément
✅ **Pas de navigateur** - Interface plein écran
✅ **Notifications** - Recevez des alertes importantes
✅ **Économise la batterie** - Optimisé pour mobile

### Utilisation hors ligne

**Ce qui fonctionne offline:**
- ✅ Consultation des rapports récemment consultés
- ✅ Lecture des factures et devis
- ✅ Navigation dans les écrans principaux

**Ce qui nécessite une connexion:**
- ❌ Création/modification de données
- ❌ Synchronisation avec la comptabilité
- ❌ Upload de documents

**Astuce:** Lorsque vous revenez online, vos données se synchronisent automatiquement !

---

## 📊 Rapports Interactifs (Drill-Down)

### Vue d'ensemble

Les nouveaux rapports interactifs vous permettent d'**explorer vos données en profondeur** en 3 niveaux :

1. **Niveau 1 : Vue d'ensemble** (Bilan complet)
2. **Niveau 2 : Détail compte** (Toutes les écritures d'un compte)
3. **Niveau 3 : Détail écriture** (Informations complètes d'une écriture)

### Comment utiliser

#### Étape 1 : Accéder aux rapports

1. Allez dans **Comptabilité**
2. Cliquez sur l'onglet **"Rapports"**
3. Vous voyez le **Bilan complet** avec tous les comptes

**Éléments affichés :**
- 🥧 **Graphique circulaire** - Répartition des comptes par catégorie
- 📋 **Table des comptes** - Liste détaillée (n° compte, nom, solde)
- 📅 **Filtres de période** - Sélectionnez les dates à analyser

#### Étape 2 : Explorer un compte (Drill-Down Level 2)

1. **Cliquez sur une ligne** du tableau (ex: compte "411 - Clients")
2. Vous arrivez sur le **détail du compte** :
   - 📈 **Graphique d'évolution** mensuelle du solde
   - 📋 **Liste des écritures** liées à ce compte
   - 🔗 **Fil d'Ariane** en haut (ex: "Bilan > 411 - Clients")

#### Étape 3 : Voir le détail d'une écriture (Level 3)

1. **Cliquez sur une écriture** dans la liste
2. Vous voyez le **journal d'écriture complet** :
   - 📝 Libellé et date
   - 💰 Montants débit/crédit
   - 🏷️ Pièce comptable de référence
   - 📄 Document associé (si disponible)

#### Navigation rapide

Le **fil d'Ariane** (breadcrumb) en haut vous permet de revenir facilement :
```
Bilan > 411 - Clients > Écriture #JE-2024-001
   ↑        ↑                ↑
Cliquez pour revenir à ce niveau
```

### Filtrer par période

1. En haut des rapports, vous voyez **Date de début** et **Date de fin**
2. Cliquez sur les champs de date pour sélectionner une période
3. Les données se mettent à jour automatiquement

**Exemples de périodes utiles :**
- **Mois en cours** : 01/02/2026 → 28/02/2026
- **Trimestre** : 01/01/2026 → 31/03/2026
- **Année fiscale** : 01/01/2026 → 31/12/2026

### Exporter en Excel

Besoin de travailler sur Excel ? C'est facile !

1. En haut à droite, cliquez sur **"Exporter"** 📥
2. Un fichier Excel se télécharge automatiquement
3. Ouvrez-le avec Excel, LibreOffice ou Google Sheets

**Contenu du fichier :**
- ✅ Toutes les données affichées à l'écran
- ✅ Filtres de période appliqués
- ✅ Formatage préservé (montants, dates)

---

## ⚡ Tableaux de Bord Temps Réel

### Qu'est-ce que le temps réel ?

Vos tableaux de bord se **mettent à jour automatiquement** dès qu'une donnée change, sans que vous ayez besoin de rafraîchir la page !

**Exemple concret :**
- Vous consultez votre tableau de bord
- Un collègue crée une nouvelle facture
- 🔴 **Badge "LIVE"** s'affiche
- 📈 Votre chiffre d'affaires se met à jour instantanément

### Badge LIVE

Quand vous voyez le **badge rouge "LIVE"** en haut à droite :
```
🔴 LIVE
```

Cela signifie qu'**une donnée vient d'être mise à jour** en temps réel. Le badge clignote 2 secondes puis disparaît.

### Indicateur de connexion

En bas du tableau de bord, vous voyez l'état de la connexion :

- ✅ **"Connecté"** (vert) - Temps réel actif
- 🔄 **"Reconnexion..."** (orange) - Connexion en cours
- ❌ **"Déconnecté"** (rouge) - Hors ligne

**Ne vous inquiétez pas** si vous voyez "Déconnecté" brièvement - la reconnexion est automatique !

### Données mises à jour automatiquement

Les KPIs suivants se rafraîchissent en temps réel :

| KPI | Mise à jour quand... |
|-----|----------------------|
| **Chiffre d'affaires** | Une facture est créée/modifiée |
| **Paiements reçus** | Un paiement est enregistré |
| **Solde banque** | Une transaction bancaire est importée |
| **Comptes à recevoir** | Une facture ou un paiement change |
| **Éc

ritures comptables** | Une nouvelle écriture est créée |

### Notifications

Vous recevez une **notification** discrète en bas à droite quand :
- 📝 Une facture est créée
- 💰 Un paiement est reçu
- 🏦 Des transactions bancaires sont importées

**Astuce:** Cliquez sur la notification pour accéder directement à l'élément !

---

## 🚀 Actions Rapides (QuickActions)

### Barre d'actions rapides

En haut de chaque page, une **barre d'actions** vous donne accès aux fonctions les plus utilisées :

```
[➕ Nouvelle Facture] [👤 Nouveau Client] [📦 Nouveau Produit] [🔍 Recherche]
```

### Raccourcis clavier

**Gagnez du temps** avec ces shortcuts :

| Raccourci | Action |
|-----------|--------|
| **Ctrl + N** | Nouvelle facture |
| **Ctrl + Shift + C** | Nouveau client |
| **Ctrl + K** | Recherche globale |
| **Ctrl + ,** | Paramètres |
| **Esc** | Fermer modal |

**Sur Mac**, remplacez `Ctrl` par `Cmd`.

### Mode mobile

Sur téléphone, la barre devient un **bouton flottant** en bas à droite :
```
    [☰]  ← Cliquez ici
```

Un menu s'ouvre avec toutes les actions disponibles, organisées par catégorie.

---

## 📋 Tables de Données Avancées

### Tri des colonnes

Dans toutes les tables (factures, clients, etc.), vous pouvez **trier** en cliquant sur le **nom de la colonne** :

1. **1er clic** : Tri croissant (A→Z, 0→9) ↑
2. **2e clic** : Tri décroissant (Z→A, 9→0) ↓
3. **3e clic** : Annuler le tri

### Recherche globale

En haut de chaque table, un **champ de recherche** 🔍 vous permet de filtrer rapidement :

```
🔍 Rechercher...
```

Tapez n'importe quoi (nom client, numéro facture, montant) et la table se filtre instantanément !

### Sélection multiple

**Cochez les cases** à gauche pour sélectionner plusieurs lignes :
```
☑️ Facture #2024-001
☑️ Facture #2024-002
☑️ Facture #2024-003
```

Puis cliquez sur **"Actions"** pour :
- ✅ Marquer comme payé (en masse)
- 📧 Envoyer par email (toutes)
- 🗑️ Supprimer (attention !)

### Export Excel

Besoin d'analyser vos données dans Excel ?

1. Cliquez sur **"Exporter"** 📥 en haut à droite
2. Un fichier Excel se télécharge avec :
   - ✅ **Toutes les données affichées** (respects les filtres)
   - ✅ **Formatage préservé**
   - ✅ **Nom du fichier** : `factures-2026-02-08.xlsx`

### Pagination

En bas de la table :

```
Afficher [25 ▼] sur 156 lignes        Page 1 sur 7  [◀◀] [◀] [▶] [▶▶]
```

- **Sélectionner nombre de lignes** : 10, 25, 50, 100
- **Première page** : ◀◀
- **Page précédente** : ◀
- **Page suivante** : ▶
- **Dernière page** : ▶▶

---

## ✍️ Éditeur de Texte Enrichi

### Où le trouver ?

L'éditeur de texte enrichi est disponible pour :
- 📄 **Contrats** - Clauses et conditions
- 💼 **Opportunités CRM** - Notes détaillées
- 📝 **Descriptions produits** - Texte formaté
- ✉️ **Emails** - Messages HTML

### Toolbar de formatage

En haut de l'éditeur, une barre d'outils complète :

```
[B] [I] [U] [S] | [H1] [H2] [H3] | [•] [1.] | [""] [</>] [🔗] [📷]
```

**Légende :**
- **B** : Gras
- **I** : Italique
- **U** : Souligné
- **S** : Barré
- **H1/H2/H3** : Titres
- **•** : Liste à puces
- **1.** : Liste numérotée
- **""** : Citation
- **</>** : Code
- **🔗** : Lien
- **📷** : Image

### Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| **Ctrl + B** | Gras |
| **Ctrl + I** | Italique |
| **Ctrl + U** | Souligné |
| **Ctrl + K** | Insérer lien |
| **Ctrl + Z** | Annuler |
| **Ctrl + Y** | Rétablir |

### Insérer un lien

1. Sélectionnez le texte à transformer en lien
2. Cliquez sur 🔗 ou appuyez sur **Ctrl + K**
3. Une fenêtre s'ouvre :
   - **URL** : `https://example.com`
   - **Texte** : "Cliquez ici" (optionnel)
4. Cliquez **"Insérer"**

### Insérer une image

1. Cliquez sur 📷
2. Entrez **l'URL de l'image** : `https://example.com/image.jpg`
3. Entrez le **texte alternatif** (description) : "Logo entreprise"
4. Cliquez **"Insérer"**

### Mode Prévisualisation

Cliquez sur l'icône **👁️ Aperçu** pour voir le rendu final de votre texte formaté, sans les outils d'édition.

### Exporter en HTML

Besoin de réutiliser votre texte ailleurs ?

1. Cliquez sur **📥 Exporter**
2. Un fichier `.html` se télécharge
3. Ouvrez-le dans un navigateur ou réutilisez le code HTML

---

## 📤 Upload de Fichiers

### Drag & Drop

La façon la plus simple d'uploader des fichiers :

1. **Glissez** votre fichier depuis votre ordinateur
2. **Déposez-le** sur la zone prévue :
   ```
   ┌────────────────────────────┐
   │   📤 Glissez vos fichiers   │
   │    ou cliquez pour choisir  │
   │                             │
   │  Max 10 fichiers • 10MB max │
   └────────────────────────────┘
   ```
3. ✅ Le fichier s'ajoute à la liste et s'uploade automatiquement !

### Sélection manuelle

Vous pouvez aussi **cliquer** sur la zone pour ouvrir l'explorateur de fichiers.

### Preview des images

Les **images** (JPG, PNG) s'affichent en miniature :
```
┌─────────────┐
│   📷        │  facture.jpg
│   [Image]   │  2.5 MB
│   ✓         │  [✕ Supprimer]
└─────────────┘
```

### Barre de progression

Pendant l'upload, vous voyez la **progression** en temps réel :
```
facture.pdf (2.5 MB)
Upload...  ████████░░  80%
```

### Compression automatique des images

**Astuce** : CassKai compresse automatiquement vos images pour économiser de l'espace !

- **Avant** : 5 MB (photo haute résolution)
- **Après compression** : 2 MB (-60%) sans perte visible de qualité

### Fichiers acceptés

Selon le contexte, vous pouvez uploader :

| Type | Extensions | Usage |
|------|-----------|-------|
| **Documents** | PDF, DOCX, TXT | Justificatifs, contrats |
| **Images** | JPG, PNG, WEBP | Photos produits, logos |
| **Tableurs** | XLSX, CSV | Imports comptables |
| **Archives** | ZIP, RAR | Multiples fichiers |

### Supprimer un fichier

Avant l'upload :
1. Cliquez sur **✕** à droite du fichier
2. Il est retiré de la liste (pas encore uploadé)

Après l'upload :
1. Cliquez sur **🗑️ Supprimer**
2. Confirmez la suppression
3. Le fichier est définitivement supprimé du serveur

---

## 🎯 Astuces et Bonnes Pratiques

### Performance

✅ **Utilisez l'app mobile** - 2x plus rapide que le navigateur web
✅ **Lazy loading activé** - Les pages se chargent plus vite
✅ **Cache intelligent** - Moins de rechargements inutiles

### Productivité

✅ **Apprenez 3 shortcuts clavier** - Gagnez 30% de temps
✅ **Utilisez la recherche globale** (Ctrl+K) - Trouvez tout rapidement
✅ **Favorisez le drag & drop** - Plus rapide que cliquer

### Données

✅ **Exportez régulièrement** en Excel - Sauvegarde externe
✅ **Vérifiez le badge temps réel** - Assurez-vous d'avoir les dernières données
✅ **Utilisez le drill-down** - Comprenez mieux vos chiffres

---

## ❓ FAQ - Questions Fréquentes

### Application Mobile

**Q: Dois-je payer pour l'app mobile ?**
R: Non ! L'app PWA est incluse gratuitement dans votre abonnement CassKai.

**Q: L'app prend-elle beaucoup d'espace ?**
R: Non, environ 5-10 MB seulement (vs 100+ MB pour apps natives).

**Q: Puis-je désinstaller l'app ?**
R: Oui, comme n'importe quelle app : maintenez l'icône → "Supprimer de l'écran d'accueil".

**Q: Mes données sont-elles en sécurité ?**
R: Oui, l'app utilise le même chiffrement HTTPS que le site web.

### Rapports Interactifs

**Q: Puis-je imprimer un rapport ?**
R: Oui ! Cliquez sur "Exporter" puis imprimez le fichier Excel.

**Q: Le drill-down fonctionne-t-il sur mobile ?**
R: Oui, l'expérience est optimisée pour tactile.

**Q: Combien de niveaux puis-je explorer ?**
R: 3 niveaux maximum : Vue d'ensemble → Compte → Écriture.

### Temps Réel

**Q: Le temps réel consomme-t-il beaucoup de données ?**
R: Non, moins de 10 KB par heure (négligeable).

**Q: Dois-je laisser la page ouverte ?**
R: Oui, le temps réel fonctionne uniquement si la page est ouverte.

**Q: Combien de temps avant déconnexion ?**
R: Après 5 minutes d'inactivité, la connexion se met en veille (se réactive au clic).

### Performance

**Q: Pourquoi l'app est-elle plus rapide maintenant ?**
R: Lazy loading, compression images, cache intelligent, et bundles optimisés.

**Q: Combien de données sont mises en cache ?**
R: Environ 20-50 MB selon votre usage (nettoyage automatique).

**Q: Comment vider le cache ?**
R: Paramètres navigateur → Effacer données → Cocher "Cache" → OK.

---

## 🆘 Besoin d'Aide ?

### Support Utilisateurs

📧 **Email** : support@casskai.app
💬 **Chat** : Bouton en bas à droite de l'application
📚 **Centre d'aide** : https://casskai.app/help
📺 **Vidéos** : https://casskai.app/tutorials

### Ressources

- 📖 [Guide complet CassKai](https://casskai.app/docs)
- 🎥 [Tutoriels vidéo](https://casskai.app/tutorials)
- 💡 [Astuces et conseils](https://casskai.app/tips)
- 🔧 [Dépannage](https://casskai.app/troubleshooting)

### Signaler un Bug

Si vous rencontrez un problème :

1. **Prenez un screenshot** de l'erreur
2. **Notez les étapes** pour reproduire le bug
3. **Envoyez à** : bugs@casskai.app

Nous répondons sous 24h !

---

## 📅 Prochaines Évolutions

Voici un aperçu des fonctionnalités à venir :

- 🤖 **Assistant IA amélioré** - Analyse prédictive et recommandations
- 📱 **App native iOS/Android** - Expérience encore meilleure
- 🔔 **Notifications push** - Alertes importantes sur votre téléphone
- 🌍 **Mode multi-devises avancé** - Gestion change automatique
- 📊 **Dashboards personnalisables** - Créez vos propres KPIs

**Votre avis compte !** Envoyez vos suggestions à : feedback@casskai.app

---

**© 2026 Noutche Conseil SAS - Tous droits réservés**
**Version du document:** 1.5.0 (Février 2026)
