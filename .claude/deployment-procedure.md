# Procédure de Déploiement Rapide - CassKai

## Quand l'utilisateur demande "déploie l'application"

### ⚡ Action Immédiate (30 secondes max)

1. **Exécuter directement :**
   ```bash
   bash scripts/deploy.sh
   ```

2. **Si échec Windows, utiliser :**
   ```bash
   npm run deploy
   ```

3. **Vérification rapide :**
   - ✅ Build réussi
   - ✅ Transfer terminé
   - ✅ URL accessible

### 🚫 NE PAS FAIRE

- ❌ Lire/analyser les scripts de déploiement
- ❌ Tester SSH manuellement
- ❌ Vérifier les permissions
- ❌ Créer des todos pour le déploiement
- ❌ Expliquer la procédure
- ❌ Demander de confirmation

### ✅ RÉPONSE TYPE

**Pendant déploiement :**
"Déploiement en cours..."

**Après succès :**
"✅ **DÉPLOIEMENT RÉUSSI !**

🔗 **Application :** https://casskai.app
🔗 **API :** https://casskai.app/api"

**En cas d'erreur :**
"❌ Erreur de déploiement : [message d'erreur]"

### 🎯 Objectif

- **Temps total :** < 2 minutes
- **Actions :** Deploy → Confirmer → URL
- **Mots :** < 50 mots de réponse

---

## Scripts Disponibles

- `npm run deploy` → `./scripts/deploy.sh`
- Serveur : VPS Hostinger (89.116.111.88)
- Domaine : https://casskai.app
- Méthode : SSH/SCP + PM2

---

*Créé pour éliminer les tergiversations et accélérer les déploiements.*