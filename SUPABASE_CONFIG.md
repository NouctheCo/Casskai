# Configuration Supabase pour CassKai

## 🔧 Configuration Auth URLs

Dans votre dashboard Supabase → Settings → Auth → URL Configuration :

### Site URL
```
https://casskai.app
```

### Redirect URLs
```
https://casskai.app
https://casskai.app/auth/callback
https://casskai.app/dashboard
https://casskai.app/auth
```

## 🌐 Configuration CORS

Dans Supabase → Settings → API → CORS :

### Allowed Origins
```
https://casskai.app
http://localhost:5173
http://localhost:4173
```

## 🔑 Variables d'environnement GitHub

Assurez-vous que ces secrets sont configurés dans GitHub → Settings → Secrets :

- `VITE_SUPABASE_URL`: `https://smtdtgrymuzwvctattmx.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- `VITE_STRIPE_PUBLISHABLE_KEY`: `pk_live_...`

## ✅ Validation

1. **Test de connexion**:
   ```bash
   curl -X GET "https://smtdtgrymuzwvctattmx.supabase.co/auth/v1/settings"
   ```

2. **Test CORS**:
   - Ouvrir https://casskai.app
   - Console : aucune erreur CORS
   - Auth fonctionne

## 🛠️ Dépannage

Si l'erreur persiste :

1. **Vérifier les credentials** dans Supabase Dashboard
2. **Régénérer les clés** si nécessaire 
3. **Mettre à jour GitHub Secrets**
4. **Redéployer** : `git push origin main`