# 🚀 Vérification Instantanée des Fonctionnalités IA

## ⏱️ 5 Étapes (2 minutes)

### ✅ Étape 1: Hard Refresh (30 secondes)

1. Appuyez sur: **Ctrl+Shift+R** (Windows/Linux) ou **Cmd+Shift+R** (Mac)
2. Attendez le rechargement complet

**Pourquoi?** Votre navigateur cache l'ancienne version du code.

---

### ✅ Étape 2: Ouvrir DevTools (30 secondes)

1. Appuyez sur: **F12**
2. Allez sur l'onglet: **Console**
3. Cherchez des **erreurs rouges** ❌

**Résultat attendu:** Aucune erreur rouge (warnings jaunes OK)

---

### ✅ Étape 3: Naviguer au Formulaire (30 secondes)

Cliquez sur ce chemin:
1. **Comptabilité** (menu gauche)
2. **Écritures comptables**
3. **[+ Nouvelle écriture]** (bouton bleu)

---

### ✅ Étape 4: Chercher la Section IA (30 secondes)

Dans le formulaire qui vient de s'ouvrir, cherchez:

```
┌────────────────────────────────────────┐
│ ✨ Analyse automatique par IA           │
│                                        │
│ Uploadez une facture ou un reçu        │
│ pour pré-remplir automatiquement...    │
│                                        │
│ [📁 Choisir un document (PDF...)]     │
└────────────────────────────────────────┘
```

**Couleur:** Bleu clair avec bordure pointillée  
**Position:** Juste après le sélecteur "Journal"

---

### ✅ Étape 5: Tester l'Upload (30 secondes)

1. Cliquez sur: **[📁 Choisir un document]**
2. Sélectionnez un fichier:
   - 📄 PDF (facture)
   - 🖼️ JPG/PNG (reçu)
   - 📸 WEBP
3. Attendez... (l'icône changera en ⏳ "Analyse en cours...")

**Résultat attendu:** Après 2-3 secondes, vous verrez:
- ✅ Tiers (client/fournisseur) extrait
- ✅ Numéro de facture
- ✅ Montant TTC
- ✅ **Score de confiance: 85%** (ou autre %)

---

## 🎯 Checklist de Succès

| Étape | ✅ Complété |
|-------|-----------|
| Hard refresh réussi | ☐ |
| Console sans erreurs | ☐ |
| Formulaire ouvert | ☐ |
| Section IA trouvée | ☐ |
| Document uploadé | ☐ |
| Résultats affichés | ☐ |
| Données pré-remplies | ☐ |

---

## 🚨 Si Ça Ne Marche Pas

### ❌ "Je ne vois pas la section IA"

**Essayez:**
1. Vider le cache complètement:
   - F12 → Application → Cache Storage → Clear all
   - Rechargez la page
2. Ou testez en navigation "privée" (Incognito):
   - Ctrl+Shift+N (Chrome) ou Ctrl+Shift+P (Firefox)

### ❌ "Le document n'est pas analysé"

**Raison:** Edge Functions non déployées (déploiement serveur côté requis)

**Vérification dans la console:**
```
Erreur: Edge Function "ai-document-analysis" not found
```

### ❌ "Erreur CORS ou authentification"

**Raison:** Variables d'environnement mal configurées

**Vérification:**
- F12 → Network → Cherchez les requêtes `ai-document-analysis`
- Vérifiez le status (doit être 200, pas 401/403/404)

---

## 📞 Informations pour le Support

Si rien ne marche, collectez ces infos:

1. **Screenshot** de la console (F12)
2. **Navigateur/Version:** (Chrome 120, Safari 17, etc.)
3. **URL exacte:** (où êtes-vous dans l'app?)
4. **Étape qui échoue:** (1-5 ci-dessus)

---

## 🎓 Comment Ça Fonctionne

1. Vous uploadez un **PDF/JPG**
2. L'app l'envoie à **OpenAI GPT-4o-mini**
3. OpenAI analyse l'image et **extrait les données**
4. Résultat revient à votre **formulaire**
5. Les champs se **pré-remplissent automatiquement** ✨

**Temps total:** ~2-3 secondes

---

## 💡 Pro Tips

### Tip 1: Qualité du Document
- ✅ Image claire et lisible
- ✅ Toutes les données visibles
- ✅ Pas de rotation/perspective bizarre
- ❌ Flou extrême = résultats mauvais

### Tip 2: Accepter ou Corriger
Après l'extraction:
- Les données extraites apparaissent en **alerte bleue**
- Vous pouvez **manuellement corriger** si nécessaire
- Cliquez sur les champs du formulaire pour éditer

### Tip 3: Historique
Chaque analyse est loggée automatiquement:
- Tableaux → Analytics → AI Usage (futur)

---

## 🔄 Prochaine Étape

Une fois confirmé que vous voyez la section:
1. Testez avec **vrais documents** (factures, reçus)
2. Vérifiez l'**exactitude des résultats**
3. Signalez tout **bug/amélioration**

---

**Créé:** 2025-01-29  
**Durée:** 2-5 minutes pour tester complètement  
**Succès estimé:** 95% (si cache vide)
