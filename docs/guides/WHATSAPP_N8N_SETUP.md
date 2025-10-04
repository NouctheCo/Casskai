# Configuration WhatsApp + Agent IA N8n pour CassKai

## 🎯 Vue d'ensemble

Votre système de chat WhatsApp est maintenant intégré avec la possibilité de connecter votre agent IA N8n. Voici comment finaliser la configuration.

## 📞 1. Configuration de votre numéro WhatsApp

### Étape 1 : Mettre à jour votre numéro
Modifiez le fichier `src/config/whatsapp.config.ts` :

```typescript
export const WHATSAPP_CONFIG = {
  // Remplacez par votre vrai numéro WhatsApp Business
  phoneNumber: "+223XXXXXXXX", // Format Mali : +223 suivi de 8 chiffres
  // Ou format français : "+33XXXXXXXXX"
```

### Étape 2 : Variables d'environnement (optionnel mais recommandé)
Ajoutez dans votre `.env.local` :

```env
REACT_APP_WHATSAPP_PHONE="+223XXXXXXXX"
REACT_APP_N8N_WEBHOOK_URL="https://votre-n8n.com/webhook/whatsapp"
```

## 🤖 2. Configuration de l'agent IA N8n

### Architecture recommandée :

```
WhatsApp → N8n Webhook → Agent IA → WhatsApp Business API
```

### Étape 1 : Créer le workflow N8n

1. **Webhook Trigger Node** : Recevra les messages WhatsApp
2. **AI Agent Node** : Traite le message avec votre modèle IA
3. **WhatsApp Business Node** : Envoie la réponse

### Étape 2 : Structure du webhook N8n

Votre webhook N8n devrait recevoir ces données :

```json
{
  "phone": "+223XXXXXXXX",
  "message": "Bonjour ! J'ai besoin d'aide avec CassKai.",
  "context": "support", // ou "documentation", "pricing", etc.
  "timestamp": "2025-01-15T10:30:00Z",
  "user_info": {
    "page": "landing_page",
    "language": "fr"
  }
}
```

### Étape 3 : Réponses IA intelligentes

Configurez votre IA pour reconnaître ces contextes :

- **Support technique** : "J'ai un problème avec...", "Ça ne marche pas..."
- **Questions tarifaires** : "Combien coûte...", "Prix", "Abonnement"
- **Demande de démo** : "Démo", "Essayer", "Voir le produit"
- **Transfert humain** : "Parler à quelqu'un", "Humain", "Personne réelle"

## 🔧 3. Configuration WhatsApp Business API

### Option A : WhatsApp Business API (Recommandée)
- Créez un compte Meta Business
- Configurez WhatsApp Business API
- Connectez à N8n avec le node WhatsApp Business

### Option B : Solution transitoire
Pour commencer rapidement, les messages arrivent sur votre WhatsApp et vous pouvez :
1. Copier le message
2. Le coller dans votre N8n manuellement
3. Copier la réponse IA
4. La renvoyer via WhatsApp

## 📊 4. Analytics et suivi

Le système track automatiquement :
- Clics sur les boutons WhatsApp
- Type de contexte (support, pricing, etc.)
- Heures d'ouverture vs 24h/7j
- Source de la demande (landing page, documentation, etc.)

## 🌍 5. Messages contextuels par région

Actuellement configuré pour :
- **France** : Heures 9h-18h Paris
- **Afrique** : Messages adaptés aux fuseaux horaires locaux

Vous pouvez personnaliser dans `whatsapp.config.ts`.

## 🚀 6. Test de la configuration

1. **Build et déployez** : `./deploy-vps.sh`
2. **Testez les boutons** :
   - Bouton flottant sur la landing page
   - Bouton dans la documentation
3. **Vérifiez** que WhatsApp s'ouvre avec le bon message

## 📱 7. Exemples de messages automatiques

### Message de bienvenue IA :
```
🤖 Bonjour ! Je suis l'assistant IA de CassKai.
Je peux vous aider avec :
• Questions sur les fonctionnalités
• Aide à l'utilisation
• Informations tarifaires
• Problèmes techniques

Écrivez "HUMAIN" pour parler à notre équipe 👨‍💻
```

### Messages contextuels :
- **Documentation** : "Je vais vous aider avec la documentation CassKai..."
- **Support** : "Décrivez-moi votre problème, je vais analyser..."
- **Pricing** : "Voici nos tarifs adaptés à votre région..."

## 🔄 8. Workflow N8n suggéré

```
1. Webhook reçoit le message WhatsApp
2. Détection du contexte/intention
3. Si question simple → Réponse IA automatique
4. Si question complexe → Alerte équipe + Réponse IA temporaire
5. Si demande "HUMAIN" → Transfert immédiat
6. Log de la conversation pour améliorer l'IA
```

## ⚙️ 9. Configuration avancée

### Variables à personnaliser :

```typescript
// Messages par type
messages: {
  general: "Votre message de bienvenue...",
  support: "Message pour le support...",
  // ... personnalisez selon vos besoins
}

// Heures d'ouverture
businessHours: {
  timezone: "Africa/Bamako", // ou votre fuseau
  days: {
    // Adaptez selon vos horaires
  }
}
```

## 📞 Action immédiate requise

**Pour activer le système, vous devez :**

1. ✅ Mettre votre vrai numéro WhatsApp dans `whatsapp.config.ts`
2. ⏳ Configurer votre workflow N8n (optionnel pour commencer)
3. ✅ Déployer : `./deploy-vps.sh`

**Le système est déjà fonctionnel** - les utilisateurs peuvent vous contacter via WhatsApp immédiatement !

---

💡 **Besoin d'aide ?** Testez votre propre bouton WhatsApp une fois déployé !