# Workflow N8n pour WhatsApp + IA CassKai

## 🎯 Structure du workflow recommandée

Voici la structure du workflow N8n que vous devriez créer à l'adresse :
`https://n8n.srv782070.hstgr.cloud/workflow/new`

## 📝 Nœuds du workflow

### 1. **Webhook Trigger**
- **URL** : `https://n8n.srv782070.hstgr.cloud/webhook/whatsapp-casskai`
- **Méthode** : POST
- **Authentification** : None (ou selon vos préférences)

**Données reçues** :
```json
{
  "phone": "+33752027198",
  "message": "Bonjour ! J'ai besoin d'aide avec CassKai.",
  "context": "support",
  "timestamp": "2025-01-15T10:30:00Z",
  "source": "casskai_website",
  "business_hours": true,
  "user_info": {
    "page": "/documentation/premiers-pas",
    "language": "fr",
    "user_agent": "Mozilla/5.0...",
    "referrer": "https://google.com"
  },
  "config": {
    "auto_response": "🤖 Notre agent IA va analyser votre demande...",
    "transfer_keywords": ["humain", "human", "personne", "équipe", "team"]
  }
}
```

### 2. **Switch Node** - Analyse du contexte
Créez des branches selon `{{ $json.context }}` :

- **support** → Questions techniques
- **documentation** → Questions sur la doc
- **pricing** → Questions tarifaires
- **demo** → Demandes de démo
- **general** → Questions générales

### 3. **AI Agent Node** (OpenAI/Claude/etc.)
Configurez votre modèle IA avec ce prompt système :

```
Tu es l'assistant IA de CassKai, une suite logicielle de gestion d'entreprise.

CONTEXTE: {{ $json.context }}
LANGUE: {{ $json.user_info.language }}
PAGE: {{ $json.user_info.page }}

INFORMATIONS CLÉS SUR CASSKAI:
- Suite de gestion complète (comptabilité, facturation, inventaire, etc.)
- Conçue pour les entreprises en France et Afrique
- Support du plan comptable français (PCG) et SYSCOHADA
- Essai gratuit de 30 jours
- Intégrations bancaires et import de fichiers

INSTRUCTIONS:
1. Réponds en {{ $json.user_info.language }} (français par défaut)
2. Sois concis et utile (max 200 mots)
3. Si la question nécessite un humain, dis "Je vais vous transférer vers notre équipe"
4. Propose toujours une action concrète (essai gratuit, démo, documentation)
5. Utilise des emojis avec parcimonie

MESSAGE UTILISATEUR: {{ $json.message }}
```

### 4. **Function Node** - Détection transfert humain
```javascript
const message = $input.first().json.message.toLowerCase();
const transferKeywords = $input.first().json.config.transfer_keywords;

const needsHuman = transferKeywords.some(keyword =>
  message.includes(keyword.toLowerCase())
);

return [{
  json: {
    ...$input.first().json,
    needs_human_transfer: needsHuman,
    ai_response: $input.first().json.ai_response || ""
  }
}];
```

### 5. **Switch Node** - Human vs IA
- **needs_human_transfer = true** → Notification équipe
- **needs_human_transfer = false** → Réponse IA automatique

### 6A. **HTTP Request** - Notification équipe (si humain)
Envoyez une notification à votre équipe :
- **Slack webhook**
- **Email via SendGrid**
- **Discord webhook**
- **SMS via Twilio**

### 6B. **WhatsApp Business Node** - Réponse IA automatique
Configurez avec vos credentials WhatsApp Business API :
- **Numéro** : +33752027198
- **Message** : `{{ $json.ai_response }}`

### 7. **Set Node** - Log pour analytics
Sauvegardez les données pour analytics :
```json
{
  "timestamp": "{{ $json.timestamp }}",
  "context": "{{ $json.context }}",
  "page": "{{ $json.user_info.page }}",
  "language": "{{ $json.user_info.language }}",
  "response_type": "{{ $json.needs_human_transfer ? 'human' : 'ai' }}",
  "processing_time": "{{ $now.diff($json.timestamp) }}ms"
}
```

## 🔧 Configuration avancée

### Horaires d'ouverture intelligents
```javascript
const businessHours = $input.first().json.business_hours;
const isWeekend = new Date().getDay() % 6 === 0;

if (!businessHours || isWeekend) {
  return [{
    json: {
      ...$input.first().json,
      priority: "ai_only",
      message_prefix: "🤖 Agent IA (hors heures d'ouverture)\n\n"
    }
  }];
}
```

### Réponses contextuelles
```javascript
const context = $input.first().json.context;
const contextResponses = {
  support: "🛠️ Support technique CassKai",
  pricing: "💰 Information tarifaire CassKai",
  demo: "🎥 Demande de démo CassKai",
  documentation: "📖 Aide documentation CassKai"
};

const prefix = contextResponses[context] || "🤖 Assistant CassKai";
```

## 🚀 Test du workflow

1. **Déployez votre workflow**
2. **Testez l'endpoint** :
```bash
curl -X POST https://n8n.srv782070.hstgr.cloud/webhook/whatsapp-casskai \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+33752027198",
    "message": "Bonjour, comment utiliser CassKai ?",
    "context": "support"
  }'
```

3. **Testez depuis le site** :
   - Allez sur casskai.app
   - Cliquez sur le bouton WhatsApp
   - Vérifiez que N8n reçoit les données

## 📊 Métriques recommandées

Trackez ces métriques dans N8n :
- Nombre de demandes/jour
- Contextes les plus fréquents
- Taux de transfert vers humain
- Pages générant le plus de demandes
- Langues utilisées

## 🔄 Workflow de base (5 minutes)

Si vous voulez commencer simple :

1. **Webhook** → Reçoit les données
2. **OpenAI** → Génère une réponse
3. **Email** → Vous notifie avec la question + réponse suggérée

Vous pourrez ensuite ajouter WhatsApp Business API quand vous serez prêt !

---

**Votre workflow N8n est maintenant connecté à CassKai !** 🎉