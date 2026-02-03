# Dépannage - Analyse IA de Documents PDF

## 🐛 Problèmes courants et solutions

### Erreur : "Failed to fetch dynamically imported module: pdf.worker.min.js"

**Symptômes** :
```
[App] [AI] PDF conversion failed Error: Setting up fake worker failed: 
"Failed to fetch dynamically imported module: https://cdnjs.cloudflare.com/..."
```

**Cause** : Le worker pdf.js ne peut pas être chargé depuis un CDN à cause des restrictions CORS et du module bundling de Vite.

**Solution** : ✅ **Déjà corrigé** - Le worker est maintenant chargé localement :

```typescript
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
```

**Actions** :
1. Rafraîchir le navigateur (Ctrl+Shift+R)
2. Vider le cache si nécessaire
3. Vérifier que le serveur dev est bien relancé

---

### Erreur : "Échec de la conversion du PDF en image"

**Causes possibles** :
- PDF corrompu ou non valide
- PDF protégé par mot de passe
- Format PDF non standard

**Solution** :
1. Vérifier que le PDF s'ouvre correctement dans Adobe Reader
2. Essayer d'exporter le PDF en format standard
3. Utiliser une image (JPG/PNG) du document à la place

---

### Erreur : "Fichier trop volumineux (max 10MB)"

**Solution** :
- Compresser le PDF avec un outil comme iLovePDF
- Réduire la résolution des images embarquées
- Utiliser une photo/scan du document

---

### L'analyse IA ne détecte pas les données correctement

**Solutions** :
1. **Améliorer la qualité du document** :
   - Utiliser un scan haute résolution (min 150 DPI)
   - Assurer un bon contraste et éclairage
   - Éviter les photos floues ou inclinées

2. **Vérifier le format du document** :
   - Les factures doivent avoir un format standard
   - Le texte doit être lisible (pas d'écriture manuscrite trop complexe)

3. **Essayer plusieurs fois** :
   - L'IA peut varier légèrement dans ses résultats
   - Les modèles Vision s'améliorent avec le temps

---

### Le bouton d'upload ne réagit pas

**Solutions** :
1. Vérifier que vous êtes bien connecté
2. Vérifier qu'une entreprise est sélectionnée
3. Ouvrir la console pour voir les erreurs
4. Relancer le serveur dev

---

### Erreur CORS dans les logs

**Symptômes** :
```
Access to fetch at 'https://xxx.supabase.co/functions/v1/ai-document-analysis' 
has been blocked by CORS policy
```

**Solution** :
1. Vérifier que l'Edge Function est bien déployée :
   ```bash
   supabase functions list
   ```

2. Vérifier les CORS headers dans l'Edge Function :
   ```typescript
   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
   };
   ```

3. Redéployer la fonction :
   ```bash
   supabase functions deploy ai-document-analysis
   ```

---

### Coûts OpenAI trop élevés

**Solutions d'optimisation** :
1. Réduire la résolution de conversion PDF :
   ```typescript
   const scale = 1.5; // Au lieu de 2.0
   ```

2. Utiliser `detail: 'low'` pour les documents simples :
   ```typescript
   image_url: { url: '...', detail: 'low' }
   ```

3. Monitorer l'usage :
   ```sql
   SELECT SUM(cost) as total_cost 
   FROM ai_usage_logs 
   WHERE created_at >= NOW() - INTERVAL '30 days';
   ```

---

## 🔍 Debugging avancé

### Activer les logs détaillés

Dans `src/services/aiDocumentAnalysisService.ts`, les logs sont déjà présents :

```typescript
logger.info('[AI] PDF detected, converting to image...', { fileName });
logger.info('[AI] PDF converted successfully', { newFileName, originalSize, imageSize });
logger.error('[AI] PDF conversion failed', error);
```

### Inspecter la requête OpenAI

Ajouter temporairement dans l'Edge Function :

```typescript
console.log('Request to OpenAI:', {
  model: 'gpt-4o-mini',
  messages: messages,
  max_tokens: 1500
});
```

### Vérifier le base64 généré

Ajouter dans `aiDocumentAnalysisService.ts` :

```typescript
const base64Data = await this.fileToBase64(fileToAnalyze);
console.log('Base64 preview:', base64Data.substring(0, 100) + '...');
console.log('Base64 length:', base64Data.length);
```

---

## 📞 Support

Si le problème persiste après avoir essayé ces solutions :

1. **Ouvrir un ticket GitHub** : [Issues CassKai](https://github.com/NouctheCo/Casskai/issues)
2. **Inclure** :
   - Logs de la console (F12)
   - Type et taille du fichier
   - Navigateur et version
   - Screenshot de l'erreur

3. **Email** : support@casskai.app

---

**Dernière mise à jour** : 29 janvier 2026
