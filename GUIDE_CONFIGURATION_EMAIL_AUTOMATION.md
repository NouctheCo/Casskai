# 📧 Guide Complet - Configuration des Emails pour l'Automation

## Date: 27 Décembre 2024

---

## 🎯 Objectif

Ce guide vous explique étape par étape comment configurer l'envoi d'emails automatiques dans CassKai pour que vos workflows d'automation puissent envoyer des emails avec la signature de votre entreprise.

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Choix du fournisseur](#choix-du-fournisseur)
3. [Configuration SMTP (Recommandé)](#configuration-smtp)
4. [Configuration SendGrid](#configuration-sendgrid)
5. [Configuration Mailgun](#configuration-mailgun)
6. [Test de configuration](#test-de-configuration)
7. [Utilisation dans les automatisations](#utilisation-dans-les-automatisations)
8. [Troubleshooting](#troubleshooting)

---

## 🌟 Vue d'ensemble

### Pourquoi configurer les emails ?

Pour que vos automatisations puissent envoyer des emails (rapports automatiques, factures impayées, notifications, etc.), vous devez configurer un service d'envoi d'emails avec les identifiants de votre entreprise.

### Qu'est-ce qui sera configuré ?

- ✅ **Service d'envoi** : SMTP, SendGrid ou Mailgun
- ✅ **Email expéditeur** : L'email qui apparaîtra comme expéditeur
- ✅ **Signature email** : Votre signature personnalisée
- ✅ **Limites d'envoi** : Pour contrôler le volume

---

## 🔧 Choix du Fournisseur

### Option 1: SMTP (⭐ Recommandé pour débuter)

**Avantages:**
- ✅ Utilise votre email existant
- ✅ Gratuit
- ✅ Configuration simple
- ✅ Pas besoin de créer un nouveau compte

**Idéal pour:**
- Petits volumes (< 500 emails/jour)
- Débuter rapidement
- Utiliser votre email professionnel

**Limites:**
- Gmail: 500 emails/jour
- Outlook: 300 emails/jour
- Serveur dédié: Variable

---

### Option 2: SendGrid

**Avantages:**
- ✅ 100 emails/jour gratuits
- ✅ Analytics détaillés
- ✅ Haute délivrabilité
- ✅ Tracking des ouvertures/clics

**Idéal pour:**
- Volumes moyens (100-10,000 emails/jour)
- Besoin de statistics
- Emails transactionnels professionnels

**Coût:**
- Gratuit: 100 emails/jour
- Essentials: $19.95/mois pour 50,000 emails

---

### Option 3: Mailgun

**Avantages:**
- ✅ API puissante
- ✅ Gros volumes
- ✅ Excellent pour développeurs

**Idéal pour:**
- Gros volumes (> 10,000 emails/jour)
- Intégrations complexes
- Entreprises

**Coût:**
- Pay as you go: $0.80/1000 emails
- Foundation: $35/mois pour 50,000 emails

---

## 📧 Configuration SMTP

### Étape 1: Accéder aux Paramètres

1. Cliquez sur **Paramètres** dans le menu
2. Allez dans **Configuration Email**
3. Cliquez sur **Nouvelle Configuration**
4. Sélectionnez **SMTP**

### Étape 2: Obtenir les identifiants SMTP

#### Pour Gmail:

1. **Activer la validation en 2 étapes:**
   - Allez sur https://myaccount.google.com/security
   - Activez "Validation en deux étapes"

2. **Créer un mot de passe d'application:**
   - Allez sur https://myaccount.google.com/apppasswords
   - Sélectionnez "Autre (nom personnalisé)"
   - Entrez "CassKai"
   - Copiez le mot de passe généré (16 caractères)

3. **Informations nécessaires:**
   ```
   Serveur SMTP: smtp.gmail.com
   Port: 587
   Sécurité: TLS
   Nom d'utilisateur: votre@gmail.com
   Mot de passe: [mot de passe d'application]
   ```

#### Pour Outlook/Hotmail:

```
Serveur SMTP: smtp-mail.outlook.com
Port: 587
Sécurité: TLS
Nom d'utilisateur: votre@outlook.com
Mot de passe: [votre mot de passe]
```

#### Pour O2Switch ou autre hébergeur:

```
Serveur SMTP: mail.votredomaine.com
Port: 587 ou 465
Sécurité: TLS ou SSL
Nom d'utilisateur: noreply@votredomaine.com
Mot de passe: [défini dans votre hébergement]
```

### Étape 3: Remplir le formulaire

1. **Configuration serveur:**
   - Serveur SMTP: `smtp.gmail.com`
   - Port: `587` (TLS recommandé)
   - Nom d'utilisateur: Votre email
   - Mot de passe: Mot de passe d'application

2. **Cliquez sur "Suivant"**

### Étape 4: Informations d'envoi

1. **Nom d'expéditeur:**
   ```
   Exemple: "ACME Corporation"
   ```
   *Ce nom apparaîtra dans la boîte de réception*

2. **Email d'expéditeur:**
   ```
   Exemple: noreply@votreentreprise.com
   ```

3. **Email de réponse (optionnel):**
   ```
   Exemple: contact@votreentreprise.com
   ```
   *Les clients qui répondent enverront ici*

4. **Signature email (HTML):**
   ```html
   <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
       <p style="margin: 0;">Cordialement,</p>
       <p style="margin: 5px 0;"><strong>L'équipe ACME</strong></p>
       <p style="margin: 0; color: #666; font-size: 12px;">
           contact@acme.com | +33 1 23 45 67 89<br>
           123 Rue Example, 75001 Paris
       </p>
   </div>
   ```

5. **Cliquez sur "Suivant"**

### Étape 5: Limites et validation

1. **Définir les limites:**
   - Limite quotidienne: `500` (Gmail) ou `1000`
   - Limite mensuelle: `15000` ou `30000`

2. **Cliquez sur "Terminer la configuration"**

---

## 🧪 Test de Configuration

### Étape 1: Tester l'envoi

1. Dans la liste des configurations, trouvez votre configuration
2. Dans le champ "Email de test", entrez votre adresse email
3. Cliquez sur **"Tester"**

### Étape 2: Vérifier la réception

**Vous devriez recevoir un email avec:**
- ✅ Objet: "✅ Test de configuration email - CassKai"
- ✅ Contenu confirmant la réussite
- ✅ Votre signature personnalisée

### Étape 3: Activer la configuration

1. Si le test réussit, un badge **"Vérifiée"** apparaît
2. Activez la configuration avec le switch
3. ✅ **Prêt à utiliser!**

---

## 🎨 Configuration SendGrid

### Étape 1: Créer un compte SendGrid

1. Allez sur https://sendgrid.com
2. Cliquez sur "Start for Free"
3. Remplissez le formulaire d'inscription
4. Vérifiez votre email

### Étape 2: Créer une clé API

1. Connectez-vous à SendGrid
2. Allez dans **Settings** → **API Keys**
3. Cliquez sur **"Create API Key"**
4. Donnez un nom: `CassKai Automation`
5. Sélectionnez **"Full Access"**
6. Cliquez sur **"Create & View"**
7. **Copiez la clé** (elle commence par `SG.`)

### Étape 3: Configuration dans CassKai

1. Sélectionnez **SendGrid** comme fournisseur
2. Collez votre **Clé API SendGrid**
3. Remplissez les informations d'envoi
4. Testez la configuration

---

## 🚀 Configuration Mailgun

### Étape 1: Créer un compte

1. Allez sur https://mailgun.com
2. Créez un compte
3. Ajoutez un domaine (ou utilisez le sandbox)

### Étape 2: Obtenir les credentials

1. Allez dans **Settings** → **API Keys**
2. Copiez votre **Private API key**
3. Notez votre domaine: `mg.votredomaine.com`

### Étape 3: Configuration dans CassKai

1. Sélectionnez **Mailgun** comme fournisseur
2. **Clé API**: Collez votre Private API key
3. **Endpoint**: `https://api.mailgun.net/v3/VOTRE_DOMAINE/messages`
4. Remplissez les informations d'envoi
5. Testez

---

## 🤖 Utilisation dans les Automatisations

### Créer un workflow avec email

1. Allez dans **Automation Center**
2. Cliquez sur **"Nouveau Workflow"**
3. Configurez le déclencheur (quotidien, hebdomadaire, etc.)
4. Ajoutez une action **"Envoi d'email"**

### Configuration de l'action email

```
Destinataires: client@exemple.com, client2@exemple.com
Sujet: Votre rapport hebdomadaire
Template: [Sélectionnez un template ou personnalisez]
```

### Variables disponibles

Dans vos templates, utilisez ces variables:

- `{{recipient_name}}` - Nom du destinataire
- `{{company_name}}` - Nom de votre entreprise
- `{{date}}` - Date actuelle
- `{{week}}` - Numéro de semaine
- `{{month}}` - Mois actuel

**Exemple de template:**
```html
<h2>Rapport Hebdomadaire</h2>
<p>Bonjour {{recipient_name}},</p>
<p>Voici votre rapport pour la semaine {{week}}.</p>
<p>Cordialement,<br>{{company_name}}</p>
```

---

## 🛠️ Troubleshooting

### ❌ Erreur: "Authentification échouée"

**Cause:** Mauvais identifiants SMTP

**Solution Gmail:**
1. Vérifiez que la validation en 2 étapes est activée
2. Utilisez un mot de passe d'application, pas votre mot de passe Gmail
3. Le format doit être: 16 caractères sans espaces

**Solution Outlook:**
1. Vérifiez votre mot de passe
2. Activez "Autoriser les applications moins sécurisées" si nécessaire

---

### ❌ Erreur: "Connexion refusée"

**Cause:** Mauvais serveur ou port

**Solution:**
1. Vérifiez le serveur SMTP
2. Utilisez le port 587 (TLS) au lieu de 465 (SSL)
3. Vérifiez que votre pare-feu autorise la connexion

---

### ❌ Erreur: "Limite quotidienne atteinte"

**Cause:** Trop d'emails envoyés

**Solution:**
1. Attendez le lendemain
2. Augmentez la limite dans les paramètres
3. Passez à SendGrid ou Mailgun pour plus de volume

---

### ❌ Les emails arrivent en spam

**Solution:**
1. Configurez SPF et DKIM sur votre domaine
2. Utilisez un service professionnel (SendGrid/Mailgun)
3. Évitez les mots "spam" dans vos emails
4. Ajoutez un lien de désinscription

---

## 📊 Monitoring et Logs

### Voir l'historique des emails

1. Allez dans **Automation Center**
2. Cliquez sur un workflow
3. Onglet **"Historique"**
4. Consultez les emails envoyés

### Informations disponibles

- ✅ Date et heure d'envoi
- ✅ Destinataire
- ✅ Sujet
- ✅ Statut (Envoyé / Échoué)
- ✅ Message d'erreur (si échec)

---

## 🔒 Sécurité et Bonnes Pratiques

### Sécurité

1. **Ne partagez jamais vos mots de passe d'application**
2. **Utilisez TLS** (port 587) pour la sécurité
3. **Limitez les envois** pour éviter les abus
4. **Surveillez les logs** régulièrement

### Bonnes pratiques

1. **Personnalisez vos emails** avec les variables
2. **Ajoutez une signature professionnelle**
3. **Testez avant d'activer** un workflow
4. **Utilisez des templates** pour la cohérence
5. **Respectez les limites** de votre fournisseur

---

## 📞 Support

### Besoin d'aide ?

**Pour Gmail:**
- https://support.google.com/accounts/answer/185833

**Pour SendGrid:**
- https://docs.sendgrid.com

**Pour Mailgun:**
- https://documentation.mailgun.com

**Pour CassKai:**
- Email: support@casskai.com
- Documentation: https://docs.casskai.com

---

## ✅ Checklist de Configuration

Avant de commencer à utiliser l'automation:

- [ ] Configuration email créée
- [ ] Test d'envoi réussi
- [ ] Badge "Vérifiée" présent
- [ ] Configuration activée
- [ ] Signature email configurée
- [ ] Limites définies
- [ ] Premier workflow testé

---

## 🎉 Félicitations !

Vous êtes maintenant prêt à utiliser l'automation email dans CassKai! 

Vos workflows peuvent désormais:
- ✅ Envoyer des rapports automatiques
- ✅ Relancer les factures impayées
- ✅ Notifier votre équipe
- ✅ Et bien plus encore!

**Prochain step:** Créez votre premier workflow d'automation! 🚀
