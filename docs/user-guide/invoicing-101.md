# 💰 Guide Facturation - CassKai

## Tout savoir sur la facturation client avec CassKai

---

## 📑 Table des Matières

1. [Types de Documents](#types-de-documents)
2. [Créer une Facture](#créer-une-facture)
3. [Devis Commerciaux](#devis-commerciaux)
4. [Avoirs et Remboursements](#avoirs-et-remboursements)
5. [Automatisations](#automatisations)
6. [Relances Clients](#relances-clients)
7. [Statistiques](#statistiques)

---

## 1. Types de Documents

### Devis (Quote)
Document **non comptable** envoyé au client pour proposition commerciale.
- Valable 30 jours par défaut
- Peut être accepté/refusé par le client
- Se convertit en facture une fois accepté

### Facture (Invoice)
Document **légal et comptable** enregistrant une vente.
- Numérotation obligatoire et séquentielle
- Mentions légales obligatoires
- Impact comptable immédiat

### Avoir (Credit Note)
Document annulant totalement ou partiellement une facture.
- Référence la facture d'origine
- Montant négatif
- Régularisation comptable automatique

### Facture d'Acompte
Facture partielle avant livraison/réalisation.
- 30%, 50% du montant total typiquement
- Déduite de la facture finale

### Facture de Solde
Facture finale après déduction des acomptes.

---

## 2. Créer une Facture

### Méthode 1: Depuis le Menu

**Navigation**: Menu → Facturation → Factures → **+ Nouvelle Facture**

### Méthode 2: Depuis un Devis Accepté

Si le client a accepté votre devis:
1. Ouvrez le devis
2. Cliquez sur **"Convertir en Facture"**
3. Les données sont pré-remplies! ✨

### Formulaire de Facturation

#### Informations Client
- **Client** *(requis)*: Sélectionnez dans la liste ou créez-en un nouveau
- **Adresse de facturation**: Auto-remplie depuis la fiche client (modifiable)
- **Contact**: Personne destinataire (optionnel)

#### Informations Facture
- **Numéro de facture**: Généré automatiquement (ex: FA-2025-001)
  - Format personnalisable dans Paramètres
- **Date de facture** *(requis)*: Aujourd'hui par défaut
- **Date d'échéance** *(requis)*: Calculée depuis conditions de paiement client
  - Ex: 30 jours = date facture + 30j

#### Lignes de Facture

Pour chaque ligne, renseignez:

| Champ | Description |
|-------|-------------|
| **Article/Service** | Sélectionnez dans le catalogue ou saisissez manuellement |
| **Description** | Détails complémentaires |
| **Quantité** | Nombre d'unités |
| **Prix unitaire HT** | Prix avant TVA |
| **Remise** | Pourcentage ou montant fixe (optionnel) |
| **TVA** | Taux appliqué (5.5%, 10%, 20% en France) |
| **Total HT** | Calcul automatique |

💡 **Astuce**: Cliquez sur **"+ Ajouter une ligne"** pour les factures multi-produits

#### Totaux Automatiques

CassKai calcule en temps réel:
- **Sous-total HT**: Somme des lignes HT
- **Remise globale**: Pourcentage sur le sous-total (optionnel)
- **Total HT**: Après remise globale
- **TVA par taux**: Détail par taux de TVA
- **Total TTC**: Montant à payer

#### Options Avancées

**Conditions de paiement**:
- Délai: 7j, 15j, 30j, 45j, 60j, ou personnalisé
- Escompte pour paiement anticipé
- Pénalités de retard (légal: 3x taux BCE)

**Mode de paiement**:
- Virement bancaire (IBAN affiché)
- Carte bancaire (lien de paiement Stripe)
- Chèque
- Espèces (si < 1000€)
- Prélèvement automatique

**Pièce jointe**:
- Ajoutez des documents complémentaires (bon de commande, CGV, etc.)

**Notes**:
- **Note interne**: Visible uniquement par votre équipe
- **Note client**: Affichée sur la facture PDF

---

## 3. Devis Commerciaux

### Créer un Devis

**Navigation**: Facturation → Devis → **+ Nouveau Devis**

Formulaire similaire à la facture, avec en plus:

- **Validité**: 30 jours par défaut (modifiable)
- **Référence projet** (optionnel)
- **Lien CRM**: Associer à une opportunité commerciale

### Cycle de Vie d'un Devis

```
Brouillon → Envoyé → Consulté → Accepté/Refusé → Expiré
                                      ↓
                               Facture générée
```

### Envoyer un Devis

1. **Prévisualiser**: Vérifiez le PDF généré
2. **Envoyer par email**:
   - Destinataire auto-rempli depuis contact client
   - Objet et message personnalisables
   - PDF attaché automatiquement
3. **Copier le lien**: Partagez un lien sécurisé
   - Le client peut accepter/refuser en ligne
   - Suivi: Date de consultation notifiée

### Suivi des Devis

**Tableau de bord devis** affiche:
- ⏳ **En attente**: Envoyés mais pas de réponse
- ✅ **Acceptés**: Convertibles en facture
- ❌ **Refusés**: Archivés
- 🕐 **Expirés**: Validité dépassée

**Taux de conversion**: % de devis acceptés vs envoyés

---

## 4. Avoirs et Remboursements

### Créer un Avoir

**Cas d'usage**:
- Erreur sur la facture
- Retour de marchandise
- Geste commercial
- Annulation partielle/totale

**Méthode**:
1. Ouvrez la facture d'origine
2. Cliquez sur **"Créer un Avoir"**
3. Sélectionnez:
   - **Avoir total**: Annule 100% de la facture
   - **Avoir partiel**: Sélectionnez les lignes à rembourser

### Traitement Comptable

L'avoir génère automatiquement:
- Écriture comptable inverse (crédit → débit)
- Mise à jour du solde client
- Notification client par email

### Remboursement

Une fois l'avoir créé, deux options:

1. **Imputation sur prochaine facture**:
   - Le crédit reste disponible sur le compte client
   - Déduction automatique sur facture suivante

2. **Remboursement immédiat**:
   - Virement bancaire
   - Chèque
   - Transaction enregistrée dans Banques

---

## 5. Automatisations

### Factures Récurrentes

Pour abonnements, locations, prestations mensuelles:

1. **Créer un modèle**:
   - Facture → **"Rendre Récurrente"**
   - Fréquence: Hebdomadaire, Mensuelle, Trimestrielle, Annuelle
   - Date de début
   - Nombre d'occurrences ou **Illimité**

2. **Génération automatique**:
   - Facture créée à la date prévue
   - Envoyée automatiquement au client
   - Email de confirmation à l'équipe

### Relances Automatiques

**Configuration**: Paramètres → Facturation → Relances

**Scénarios par défaut**:
- **1ère relance**: Échéance + 7 jours (email courtois)
- **2ème relance**: Échéance + 15 jours (email ferme)
- **3ème relance**: Échéance + 30 jours (mise en demeure)

**Personnalisation**:
- Modèles d'emails
- Délais
- Activation par client (ignorer pour clients VIP)

### Paiements en Ligne

**Intégration Stripe** (plan Pro+):
1. Paramètres → Intégrations → Stripe
2. Connectez votre compte Stripe
3. Sur chaque facture, activez **"Paiement en ligne"**

**Résultat**:
- Bouton "Payer maintenant" dans l'email
- Le client règle par CB en 30 secondes
- Rapprochement bancaire automatique ✨

---

## 6. Relances Clients

### Tableau de Bord Impayés

**Navigation**: Facturation → **Impayés**

Visualisez:
- **< 30 jours**: Relance courtoise
- **30-60 jours**: Relance ferme
- **> 60 jours**: Action juridique envisagée

### Relance Manuelle

1. Sélectionnez la facture impayée
2. Cliquez sur **"Relancer"**
3. Choisissez le modèle d'email
4. Personnalisez si besoin
5. Envoyez

**Email de relance inclut**:
- Rappel des coordonnées facture
- Montant dû
- Date d'échéance dépassée
- Moyens de paiement
- PDF facture en pièce jointe

### Actions de Masse

Sélectionnez plusieurs factures impayées:
- **Relancer en masse**: Email groupé
- **Exporter PDF**: Envoi postal
- **Passer en contentieux**: Statut spécial + alerte

---

## 7. Statistiques

### Tableau de Bord Facturation

**Indicateurs clés**:

| KPI | Description |
|-----|-------------|
| **CA du mois** | Chiffre d'affaires facturé (TTC) |
| **CA encaissé** | Montant effectivement payé |
| **Impayés** | Factures échues non réglées |
| **Délai de paiement moyen** | Nombre de jours entre facture et règlement |
| **Taux de recouvrement** | % factures payées vs émises |

### Graphiques

📊 **Évolution du CA**:
- Courbe mensuelle sur 12 mois
- Comparaison N vs N-1

📈 **Répartition par Client**:
- Top 10 clients (Pareto 80/20)
- Diversification du portefeuille

🎯 **Statuts des Factures**:
- Brouillon, Envoyée, Payée, En retard, Annulée

### Exports

**Formats disponibles**:
- **Excel**: Analyse approfondie
- **PDF**: Présentation client/banque
- **CSV**: Import dans autre logiciel

**Filtres**:
- Période (date de facture ou date de paiement)
- Client
- Statut
- Montant min/max

---

## 🎓 Bonnes Pratiques

### ✅ À Faire

1. **Numérotation claire**: Préfixe + année + numéro séquentiel
2. **Mentions légales**: SIRET, TVA, Capital social, RCS
3. **Conditions de paiement**: Toujours précisées
4. **Pénalités de retard**: Mentionnées (légal)
5. **Coordonnées bancaires**: IBAN visible
6. **Sauvegardes PDF**: Archivage 10 ans (légal)

### ❌ À Éviter

1. **Doublon de numérotation**: Sanction fiscale
2. **Factures rétroactives**: Date antérieure à l'émission
3. **Modification après envoi**: Créer un avoir + nouvelle facture
4. **Oubli de TVA**: Vérifier taux applicables
5. **Absence de sauvegarde**: Exigence légale 10 ans

---

## 🆘 Problèmes Courants

### Le client n'a pas reçu la facture

**Solutions**:
1. Vérifiez l'email dans Historique → Emails envoyés
2. Email en spam? Demandez au client de whitelister @casskai.app
3. Renvoyez la facture: Facture → Actions → **Renvoyer**

### Erreur après envoi de facture

**Ne modifiez pas la facture!**
1. Créez un **avoir** pour annuler
2. Créez une **nouvelle facture** correcte

### Facture impayée depuis 90 jours

1. Vérifiez le contact client (changement?)
2. Relance téléphonique
3. Mise en demeure recommandée avec AR
4. Si > 120j: Procédure de recouvrement ou contentieux

---

## 📞 Besoin d'Aide?

- **Documentation**: [docs.casskai.app/invoicing](https://docs.casskai.app/invoicing)
- **Support**: support@casskai.app
- **Vidéo**: [Maîtriser la Facturation en 10 min](https://casskai.app/videos/invoicing)

---

*Dernière mise à jour: 5 octobre 2025*
*Version: 1.0.0*
