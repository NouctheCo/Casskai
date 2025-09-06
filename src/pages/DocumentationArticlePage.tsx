// @ts-nocheck
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Calendar, 
  BookOpen,
  CheckCircle,
  ArrowRight,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Copy,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/ui/PageContainer';

// Base de données simplifiée des articles
const articlesDatabase = {
  'creer-votre-premier-compte': {
    id: 'creer-votre-premier-compte',
    title: 'Créer votre premier compte',
    category: 'Premiers pas',
    description: 'Guide complet pour créer votre compte CassKai et commencer à utiliser la plateforme',
    readTime: '5 min',
    difficulty: 'Débutant',
    lastUpdated: '2025-01-15',
    author: 'Équipe CassKai',
    rating: 4.8,
    views: 1205,
    content: [
      '# Créer votre premier compte CassKai',
      '',
      'Bienvenue dans CassKai ! Ce guide vous accompagne étape par étape pour créer votre compte et configurer votre espace de travail.',
      '',
      '## Prérequis',
      '',
      '- Une adresse email valide',
      '- Informations de votre entreprise (SIREN, adresse, etc.)',
      '- 5 minutes de votre temps',
      '',
      '## Étape 1 : Inscription',
      '',
      '1. Rendez-vous sur casskai.app',
      '2. Cliquez sur "Commencer l\'essai gratuit"',
      '3. Saisissez vos informations personnelles',
      '',
      '## Étape 2 : Configuration de l\'entreprise',
      '',
      'Lors de votre première connexion, vous devrez renseigner :',
      '',
      '**Informations obligatoires**',
      '- Dénomination sociale : Le nom officiel de votre entreprise',
      '- SIREN : Votre numéro d\'identification (9 chiffres)',
      '- Adresse du siège : L\'adresse officielle de votre entreprise',
      '- Secteur d\'activité : Choisissez dans la liste proposée',
      '',
      '## Étape 3 : Choix du plan comptable',
      '',
      'CassKai propose plusieurs référentiels :',
      '',
      '- Plan comptable français (PCG 2014)',
      '- Plan comptable SYSCOHADA (pour l\'Afrique de l\'Ouest et Centrale)',
      '- Plan comptable personnalisé',
      '',
      '💡 **Conseil** : Vous pourrez modifier ce choix ultérieurement dans les paramètres.',
      '',
      '## Prochaines étapes',
      '',
      'Maintenant que votre compte est configuré :',
      '',
      '1. Créez votre première facture',
      '2. Configurez vos comptes bancaires',
      '3. Invitez vos collaborateurs',
      '',
      '## Besoin d\'aide ?',
      '',
      '- 💬 Chat en direct : Disponible 24/7',
      '- 📧 Email : support@casskai.app',
      '- 📞 Téléphone : +33 6 88 89 33 72'
    ],
    relatedArticles: [
      'configuration-de-entreprise',
      'tour-d-horizon-de-interface',
      'invitation-des-collaborateurs'
    ]
  },
  
  'creer-une-facture': {
    id: 'creer-une-facture',
    title: 'Comment créer votre première facture',
    category: 'Facturation',
    description: 'Guide complet pour créer et envoyer votre première facture avec CassKai',
    readTime: '5 min',
    difficulty: 'Débutant',
    lastUpdated: '2025-01-10',
    author: 'Équipe CassKai',
    rating: 4.9,
    views: 2540,
    content: [
      '# Comment créer votre première facture',
      '',
      'Créer une facture professionnelle n\'a jamais été aussi simple avec CassKai. Suivez ce guide pas à pas.',
      '',
      '## Accéder au module Facturation',
      '',
      '1. Depuis votre tableau de bord, cliquez sur **📄 Facturation**',
      '2. Sélectionnez **"Nouvelle facture"**',
      '3. Choisissez le type de facture :',
      '   - **Facture simple** : Pour une vente ponctuelle',
      '   - **Facture récurrente** : Pour un abonnement',
      '   - **Facture d\'acompte** : Pour un paiement partiel',
      '',
      '## Sélectionner le client',
      '',
      '### Client existant',
      '1. Commencez à taper le nom dans le champ "Client"',
      '2. Sélectionnez le client dans la liste déroulante',
      '3. Ses informations se complètent automatiquement',
      '',
      '### Nouveau client',
      '1. Cliquez sur **"+ Nouveau client"**',
      '2. Remplissez les informations obligatoires :',
      '   - Dénomination ou nom/prénom',
      '   - Adresse complète',
      '   - SIRET (si professionnel)',
      '',
      '## Ajouter des lignes de facture',
      '',
      'Pour chaque produit ou service :',
      '',
      '1. **Description** : Décrivez clairement la prestation',
      '2. **Quantité** : Nombre d\'unités',
      '3. **Prix unitaire HT** : Prix avant taxes',
      '4. **TVA** : Sélectionnez le taux approprié',
      '',
      '💡 **Astuce** : Utilisez les modèles de lignes pour gagner du temps.',
      '',
      '## Envoi de la facture',
      '',
      '### Par email (recommandé)',
      '1. L\'email du client est pré-rempli',
      '2. Personnalisez l\'objet et le message',
      '3. La facture PDF est automatiquement jointe',
      '4. Cliquez sur **"Envoyer"**',
      '',
      '## Suivi après envoi',
      '',
      '### Statuts de facture',
      '- 📝 **Brouillon** : En cours de création',
      '- 📤 **Envoyée** : Transmise au client',
      '- 💰 **Payée** : Montant encaissé',
      '- ⏰ **Échue** : Dépassement du délai',
      '',
      '## Articles complémentaires',
      '',
      '- Personnaliser les modèles de facture',
      '- Gérer les factures récurrentes',
      '- Configurer les relances automatiques'
    ],
    relatedArticles: [
      'personnaliser-les-modeles',
      'suivi-des-paiements',
      'factures-recurrentes'
    ]
  },

  'configuration-plan-comptable-syscohada': {
    id: 'configuration-plan-comptable-syscohada',
    title: 'Configuration des plans comptables',
    category: 'Comptabilité',
    description: 'Paramétrer votre plan comptable selon vos normes locales',
    readTime: '8 min',
    difficulty: 'Intermédiaire',
    lastUpdated: '2025-01-12',
    author: 'Expert Comptable OHADA',
    rating: 4.7,
    views: 890,
    content: [
      '# Configuration du plan comptable SYSCOHADA',
      '',
      'Le Système Comptable OHADA (SYSCOHADA) révisé est obligatoire pour les entreprises des 17 pays membres de l\'OHADA.',
      '',
      '## Qu\'est-ce que le SYSCOHADA ?',
      '',
      'Le SYSCOHADA est le référentiel comptable unifié pour les pays OHADA :',
      '',
      '### Pays membres OHADA',
      '🇧🇯 Bénin • 🇧🇫 Burkina Faso • 🇨🇲 Cameroun • 🇹🇩 Tchad • 🇨🇮 Côte d\'Ivoire • 🇬🇦 Gabon',
      '🇬🇭 Ghana • 🇬🇳 Guinée • 🇬🇼 Guinée-Bissau • 🇲🇱 Mali • 🇳🇪 Niger • 🇸🇳 Sénégal • 🇹🇬 Togo',
      '',
      '## Activation du plan SYSCOHADA',
      '',
      '### Nouvelle entreprise',
      '1. Lors de l\'onboarding, sélectionnez **"Plan comptable SYSCOHADA"**',
      '2. Choisissez votre pays pour les spécificités locales',
      '3. La configuration se fait automatiquement',
      '',
      '### Entreprise existante',
      '1. Allez dans **Paramètres > Comptabilité**',
      '2. Section **"Plan comptable"**',
      '3. Cliquez **"Changer de référentiel"**',
      '⚠️ **Attention** : Cette action nécessite une validation comptable',
      '',
      '## Structure du plan SYSCOHADA révisé',
      '',
      '### Classes principales',
      '',
      '#### Classe 1 - Comptes de ressources durables',
      '- **10** Capital et réserves',
      '- **16** Emprunts et dettes assimilées',
      '- **19** Provisions financières pour risques et charges',
      '',
      '#### Classe 2 - Comptes d\'actif immobilisé',
      '- **21** Immobilisations corporelles',
      '- **24** Matériels',
      '- **28** Amortissements des immobilisations',
      '',
      '#### Classe 4 - Comptes de tiers',
      '- **40** Fournisseurs et comptes rattachés',
      '- **41** Clients et comptes rattachés',
      '- **44** État et collectivités publiques',
      '',
      '#### Classe 6 - Comptes de charges',
      '- **60** Achats et variations de stocks',
      '- **62** Services extérieurs',
      '- **64** Charges de personnel',
      '',
      '#### Classe 7 - Comptes de produits',
      '- **70** Ventes',
      '- **75** Autres produits',
      '- **76** Produits financiers',
      '',
      '## Configuration dans CassKai',
      '',
      '### Étape 1 : Sélection du pays',
      'Choisissez votre pays pour adapter :',
      '- Les taux de TVA locaux',
      '- Les comptes d\'impôts spécifiques',
      '- Les obligations déclaratives',
      '- La devise de référence',
      '',
      '### Étape 2 : Paramétrage des comptes',
      'CassKai génère automatiquement :',
      '- Structure complète des classes 1 à 8',
      '- Comptes de TVA selon la législation locale',
      '- Journaux obligatoires (achats, ventes, banque)',
      '',
      '## États financiers SYSCOHADA',
      '',
      'CassKai génère automatiquement :',
      '',
      '#### États primaires',
      '- **Bilan** (modèle normal et simplifié)',
      '- **Compte de résultat** (nature et fonction)',
      '- **Tableau des flux de trésorerie** (TFT)',
      '',
      '## Formation et support',
      '',
      '### Ressources disponibles',
      '- 📚 Guide complet SYSCOHADA (200 pages)',
      '- 🎥 Vidéos de formation (15h de contenu)',
      '- 📞 Support téléphonique spécialisé OHADA'
    ],
    relatedArticles: [
      'ecritures-automatiques',
      'rapports-financiers',
      'export-fec'
    ]
  },

  'invitation-et-gestion-des-utilisateurs': {
    id: 'invitation-et-gestion-des-utilisateurs',
    title: 'Invitation et gestion des utilisateurs',
    category: 'Gestion d\'équipe',
    description: 'Ajouter des collaborateurs et définir leurs permissions',
    readTime: '6 min',
    difficulty: 'Débutant',
    lastUpdated: '2025-01-08',
    author: 'Équipe CassKai',
    rating: 4.6,
    views: 1450,
    content: [
      '# Invitation et gestion des utilisateurs',
      '',
      'Collaborer efficacement avec votre équipe grâce au système de gestion des utilisateurs de CassKai.',
      '',
      '## Types d\'utilisateurs',
      '',
      '### Administrateur',
      '**Accès complet** à toutes les fonctionnalités :',
      '- ✅ Gestion des utilisateurs et permissions',
      '- ✅ Configuration générale de l\'entreprise',
      '- ✅ Accès à tous les modules (compta, facturation, RH...)',
      '- ✅ Consultation des logs et statistiques',
      '',
      '### Comptable',
      '**Accès aux modules financiers** :',
      '- ✅ Comptabilité générale et analytique',
      '- ✅ Facturation et gestion commerciale',
      '- ✅ Banques et trésorerie',
      '- ✅ Déclarations fiscales',
      '- ❌ Gestion RH (sauf si autorisé)',
      '',
      '### Utilisateur Standard',
      '**Accès limité selon attribution** :',
      '- ✅ Consultation des données autorisées',
      '- ✅ Saisie dans les modules attribués',
      '- ✅ Édition de rapports spécifiques',
      '- ❌ Modification des paramètres',
      '',
      '## Inviter un nouvel utilisateur',
      '',
      '### Processus d\'invitation',
      '',
      '1. **Accéder à la gestion des utilisateurs**',
      '   - Allez dans **Paramètres > Utilisateurs**',
      '   - Cliquez sur **"+ Inviter un utilisateur"**',
      '',
      '2. **Renseigner les informations**',
      '   - Email : john.doe@entreprise.com',
      '   - Prénom : John',
      '   - Nom : Doe',
      '   - Poste : Comptable junior',
      '',
      '3. **Définir le niveau d\'accès**',
      '   - Sélectionnez le **rôle principal**',
      '   - Cochez les **modules autorisés**',
      '   - Configurez les **permissions spécifiques**',
      '',
      '4. **Envoyer l\'invitation**',
      '   - L\'utilisateur reçoit un email automatique',
      '   - Le lien d\'activation expire en 7 jours',
      '',
      '## Gestion des permissions avancées',
      '',
      '### Permissions par module',
      '',
      '#### Module Comptabilité',
      '- **Consultation** : Voir les écritures, bilans, comptes',
      '- **Saisie** : Créer des écritures, lettrage',
      '- **Validation** : Valider les écritures, clôtures',
      '',
      '#### Module Facturation',
      '- **Consultation** : Voir factures et devis',
      '- **Création** : Créer factures, avoir, devis',
      '- **Envoi** : Transmettre aux clients',
      '',
      '## Sécurité et authentification',
      '',
      '### Authentification à deux facteurs (2FA)',
      '**Obligatoire pour :**',
      '- Administrateurs',
      '- Comptables avec droit de validation',
      '- Accès aux données sensibles',
      '',
      '**Configuration :**',
      '1. SMS sur téléphone portable',
      '2. Application authenticator (Google, Microsoft)',
      '3. Codes de récupération d\'urgence',
      '',
      '### Politique de mots de passe',
      '**Critères obligatoires :**',
      '- Minimum 8 caractères',
      '- 1 majuscule, 1 minuscule, 1 chiffre',
      '- 1 caractère spécial',
      '- Renouvellement tous les 6 mois',
      '',
      '## Besoin d\'aide ?',
      '',
      'La gestion des utilisateurs est cruciale pour la sécurité. N\'accordez que les permissions nécessaires !'
    ],
    relatedArticles: [
      'ajouter-des-utilisateurs',
      'definir-les-roles',
      'securite-des-acces'
    ]
  },

  'connexion-bancaire-automatique': {
    id: 'connexion-bancaire-automatique',
    title: 'Connexion bancaire automatique',
    category: 'Intégrations',
    description: 'Synchroniser vos comptes bancaires pour un rapprochement automatique',
    readTime: '10 min',
    difficulty: 'Intermédiaire',
    lastUpdated: '2025-01-05',
    author: 'Expert Technique',
    rating: 4.5,
    views: 756,
    content: [
      '# Connexion bancaire automatique',
      '',
      'Automatisez votre comptabilité en synchronisant directement vos comptes bancaires avec CassKai.',
      '',
      '## Pourquoi connecter vos banques ?',
      '',
      '### Avantages de l\'automatisation',
      '- ⚡ **Gain de temps** : Fini la saisie manuelle des écritures',
      '- 🎯 **Précision** : Élimination des erreurs de frappe',
      '- 📊 **Vision temps réel** : Trésorerie actualisée en permanence',
      '- 🔍 **Rapprochement automatique** : Lettrage intelligent des écritures',
      '',
      '### Cas d\'usage pratiques',
      '- Suivi quotidien de trésorerie',
      '- Rapprochement bancaire automatisé',
      '- Détection des impayés clients',
      '- Analyse des charges récurrentes',
      '',
      '## Banques compatibles',
      '',
      '### France 🇫🇷',
      '**Banques universelles :**',
      '- BNP Paribas (particuliers & entreprises)',
      '- Crédit Agricole (toutes caisses régionales)',
      '- Société Générale (particuliers & pro)',
      '- LCL (Le Crédit Lyonnais)',
      '- Crédit Mutuel (fédérations)',
      '',
      '**Banques en ligne :**',
      '- Boursorama Banque',
      '- Fortuneo',
      '- ING Direct',
      '- Hello Bank! (BNP Paribas)',
      '',
      '### Afrique 🌍',
      '**Sénégal :**',
      '- CBAO Groupe Attijariwafa Bank',
      '- Banque Atlantique',
      '- UBA Sénégal',
      '- Ecobank Sénégal',
      '',
      '**Côte d\'Ivoire :**',
      '- Société Générale Côte d\'Ivoire',
      '- BNP Paribas BICI',
      '- Ecobank Côte d\'Ivoire',
      '- UBA Côte d\'Ivoire',
      '',
      '## Processus de connexion',
      '',
      '### Étape 1 : Préparation',
      '**Documents nécessaires :**',
      '- RIB de chaque compte à connecter',
      '- Identifiants de banque en ligne',
      '- Numéro de téléphone (pour validation SMS)',
      '',
      '**Vérifications préalables :**',
      '- ✅ Banque en ligne activée',
      '- ✅ Accès fonctionnel aux comptes',
      '- ✅ Dernière connexion récente (< 30 jours)',
      '',
      '### Étape 2 : Configuration dans CassKai',
      '1. **Accéder au module Banques**',
      '   - Menu **Banques > Comptes bancaires**',
      '   - Cliquez **"+ Ajouter un compte"**',
      '',
      '2. **Sélectionner votre établissement**',
      '   - Tapez le nom de votre banque',
      '   - Sélectionnez dans la liste',
      '   - Vérifiez le logo affiché',
      '',
      '3. **Renseigner vos identifiants**',
      '   - Numéro client : 12345678',
      '   - Code secret : (votre mot de passe)',
      '   - Code d\'accès : 123456 (si applicable)',
      '',
      '4. **Validation par la banque**',
      '   - SMS de confirmation reçu',
      '   - Code de validation saisi',
      '   - Autorisation accordée',
      '',
      '### Étape 3 : Sélection des comptes',
      '**Types de comptes détectés :**',
      '- 💳 Comptes courants professionnels',
      '- 💰 Comptes d\'épargne entreprise',
      '- 📱 Comptes livrets',
      '- 🏦 Comptes multi-devises',
      '',
      '## Catégorisation automatique',
      '',
      '### Intelligence artificielle intégrée',
      'CassKai analyse automatiquement :',
      '- **Libellé de l\'opération** (mots-clés)',
      '- **Montant et fréquence** (récurrence)',
      '- **Tiers identifié** (base clients/fournisseurs)',
      '- **Historique des catégories** (apprentissage)',
      '',
      '### Exemples de règles automatiques',
      '- "VIREMENT DE DUPONT SA" → Client DUPONT',
      '- "PRLV SEPA EDF" → Électricité',
      '- "CB CARREFOUR MARKET" → Achats bureautique',
      '- "FRAIS TENUE COMPTE" → Frais bancaires',
      '',
      '## Sécurité et confidentialité',
      '',
      '### Protection des données bancaires',
      '- 🔒 **Chiffrement AES-256** : Données et communications',
      '- 🏦 **Agrégateur certifié** : Partenaire agréé ACPR/BCE',
      '- 🔐 **Authentification forte** : 2FA obligatoire',
      '- 🚫 **Zero-storage** : Pas de stockage des identifiants',
      '',
      '### Conformité réglementaire',
      '**DSP2 (Directive européenne) :**',
      '- ✅ Consentement explicite du client',
      '- ✅ Renouvellement tous les 90 jours',
      '- ✅ Audit trail complet',
      '- ✅ Droit de révocation immédiate',
      '',
      '## Tarification des connexions',
      '',
      '### Modèle de facturation',
      '- **Comptes inclus** : 3 comptes par défaut',
      '- **Comptes supplémentaires** : 5€/mois par compte',
      '- **Historique étendu** : +2€/mois (> 12 mois)',
      '- **Multi-établissements** : Gratuit',
      '',
      'La synchronisation bancaire transforme votre comptabilité. Testez dès maintenant !'
    ]
  }
};

const DocumentationArticlePage = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [hasRated, setHasRated] = useState(false);
  const [userRating, setUserRating] = useState<'positive' | 'negative' | null>(null);

  // Gestionnaires d'événements
  const handleRating = (rating: 'positive' | 'negative') => {
    setHasRated(true);
    setUserRating(rating);
    
    toast({
      title: "Merci pour votre retour !",
      description: rating === 'positive' 
        ? "Nous sommes ravis que cet article vous ait été utile." 
        : "Nous prendrons en compte votre retour pour améliorer cet article.",
      duration: 3000
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title || 'Article CassKai',
          text: article?.description || '',
          url: window.location.href
        });
      } catch (error) {
        console.log('Partage annulé');
      }
    } else {
      toast({
        title: "Partage",
        description: "Fonctionnalité de partage non disponible sur votre navigateur"
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Lien copié !",
        description: "Le lien de l'article a été copié dans le presse-papiers"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de copier le lien"
      });
    }
  };

  const handleLiveChat = () => {
    toast({
      title: "Chat en direct",
      description: "Ouverture du chat en cours...",
      duration: 2000
    });
    // Ici on pourrait intégrer un widget de chat comme Intercom, Crisp, etc.
  };

  const handleContactSupport = () => {
    window.open('mailto:support@casskai.app?subject=' + encodeURIComponent('Question sur: ' + (article?.title || 'Documentation')));
    toast({
      title: "Contact support",
      description: "Votre client email va s'ouvrir"
    });
  };

  // Récupérer l'article depuis la base de données
  const article = articlesDatabase[articleId];

  // Si l'article n'existe pas, afficher une page 404
  if (!article) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Article non trouvé
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            L'article demandé n'existe pas ou a été déplacé.
          </p>
          <Button onClick={() => navigate('/help')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au centre d'aide
          </Button>
        </div>
      </div>
    );
  }

  const renderContent = (contentLines) => {
    return contentLines.map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-3xl font-bold text-gray-900 dark:text-white mb-6 mt-8">{line.substring(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">{line.substring(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">{line.substring(4)}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={index} className="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">{line.substring(5)}</h4>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={index} className="text-gray-700 dark:text-gray-300 mb-1 ml-4">{line.substring(2)}</li>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={index} className="font-semibold text-gray-900 dark:text-white mb-2">{line.slice(2, -2)}</p>;
      }
      return <p key={index} className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">{line}</p>;
    });
  };

  return (
    <PageContainer variant="default">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/help')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Centre d'aide
            </Button>
            <Badge variant="outline">{article.category}</Badge>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {article.title}
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            {article.description}
          </p>
          
          <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              {article.readTime}
            </div>
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              {article.author}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {article.lastUpdated}
            </div>
            <div className="flex items-center">
              <Star className="w-4 h-4 mr-2 text-yellow-500" />
              {article.rating}/5
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-8">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {renderContent(article.content)}
                </div>
              </CardContent>
            </Card>
            
            {/* Actions */}
            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Cet article vous a-t-il été utile ?
                </span>
                <Button 
                  variant={userRating === 'positive' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => handleRating('positive')}
                  disabled={hasRated}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Oui
                </Button>
                <Button 
                  variant={userRating === 'negative' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => handleRating('negative')}
                  disabled={hasRated}
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Non
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copier le lien
                </Button>
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Articles liés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {article.relatedArticles?.map((relatedId, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto p-3"
                      onClick={() => navigate(`/docs/${relatedId}`)}
                    >
                      <ArrowRight className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">{relatedId.replace(/-/g, ' ')}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Besoin d'aide ?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Vous ne trouvez pas la réponse à votre question ?
                </p>
                <Button className="w-full mb-3" onClick={handleLiveChat}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat en direct
                </Button>
                <Button variant="outline" className="w-full" onClick={handleContactSupport}>
                  Contacter le support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default DocumentationArticlePage;