# 🔧 Solution : Cache persistant après suppression des données

## 🔍 Problème

Vous avez **supprimé les écritures dans Supabase**, mais elles **apparaissent toujours** dans l'application, même après avoir actualisé la page avec `F5`.

## 💡 Explication

Les données peuvent être cachées à **5 niveaux différents** :

1. **Cache HTTP du navigateur** (requêtes API)
2. **localStorage** (données persistantes)
3. **sessionStorage** (données de session)
4. **IndexedDB** (base de données locale Supabase)
5. **Cache API / Service Worker** (PWA)

Un simple `F5` ne vide **QUE** le cache HTTP, mais **PAS** les autres !

---

## ✅ SOLUTION IMMÉDIATE (à faire MAINTENANT)

### Option 1 : Page de nettoyage automatique (RECOMMANDÉ)

1. Allez sur cette URL : **https://casskai.app/clear-all-cache.html**
2. Cliquez sur **"✅ Tout vider + Recharger l'app"**
3. Attendez 5 secondes (rechargement automatique)
4. Reconnectez-vous
5. Les données sont maintenant à jour ! ✅

### Option 2 : Nettoyage manuel (si Option 1 ne fonctionne pas)

1. **Ouvrez la console** : `F12`
2. **Allez dans l'onglet "Application"** (Chrome) ou "Stockage" (Firefox)
3. **Cliquez sur "Clear site data"** ou "Effacer les données du site"
4. **Cochez TOUTES les cases** :
   - ✅ Cookies
   - ✅ localStorage
   - ✅ sessionStorage
   - ✅ IndexedDB
   - ✅ Cache
   - ✅ Service Workers
5. **Cliquez sur "Clear data"** ou "Effacer les données"
6. **Rechargez la page** : `Ctrl+Shift+R`
7. **Reconnectez-vous**

### Option 3 : Console JavaScript (rapide)

1. **Ouvrez la console** : `F12` → Console
2. **Copiez-collez** ce code :

```javascript
// Vider tout
localStorage.clear();
sessionStorage.clear();

// Vider IndexedDB
indexedDB.databases().then(dbs => {
  dbs.forEach(db => indexedDB.deleteDatabase(db.name));
});

// Vider caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// Recharger
setTimeout(() => location.reload(), 1000);
```

3. **Appuyez sur Entrée**
4. La page va se recharger automatiquement
5. **Reconnectez-vous**

---

## 🚀 Vérification

Après le nettoyage :

1. ✅ Allez sur **https://casskai.app**
2. ✅ Connectez-vous
3. ✅ Allez dans **Comptabilité → Journal**
4. ✅ **Vérifiez** : Les écritures supprimées ne doivent **PLUS** apparaître
5. ✅ Allez dans **Dashboard**
6. ✅ **Vérifiez** : Les données doivent être à **0** (puisque vous avez tout supprimé)

---

## 📊 Si les données persistent ENCORE

Si après tout ça, les données sont toujours là, c'est qu'elles **NE SONT PAS supprimées** dans Supabase.

### Vérification dans Supabase

1. Allez sur **Supabase Dashboard**
2. Ouvrez **Table Editor**
3. Regardez les tables :
   - `journal_entries`
   - `journal_entry_lines`

**Si vous voyez encore des lignes**, exécutez ce SQL :

```sql
-- Compter les lignes
SELECT 'journal_entries' as table_name, COUNT(*) as count FROM journal_entries
UNION ALL
SELECT 'journal_entry_lines' as table_name, COUNT(*) as count FROM journal_entry_lines;

-- Si vous voulez VRAIMENT tout supprimer :
DELETE FROM journal_entry_lines;
DELETE FROM journal_entries;

-- Vérifier que c'est vide
SELECT COUNT(*) FROM journal_entries; -- devrait retourner 0
SELECT COUNT(*) FROM journal_entry_lines; -- devrait retourner 0
```

---

## 🔄 Après le nettoyage : Réimporter les données

Une fois que tout est propre :

1. ✅ Allez dans **Comptabilité → Importer**
2. ✅ **Uploadez votre fichier FEC**
3. ✅ **Cliquez sur "Démarrer l'import"**
4. ✅ **Attendez** le message de succès
5. ✅ **Rechargez la page** : `F5`
6. ✅ **Vérifiez** que les données sont bien là avec les **montants corrects**

---

## 🐛 Pourquoi ce problème arrive ?

### Cause 1 : Supabase Realtime Offline

Supabase garde une **copie locale** des données dans IndexedDB pour fonctionner hors ligne. Même si vous supprimez dans la base, la copie locale persiste jusqu'à ce que vous la vidiez manuellement.

### Cause 2 : React Query Cache

Si votre app utilise React Query, il garde les données en mémoire pendant un certain temps (staleTime).

### Cause 3 : localStorage/sessionStorage

Certaines données peuvent être sauvegardées localement pour des raisons de performance.

---

## 💡 Solution permanente (pour éviter ce problème à l'avenir)

### Ajouter un bouton "Vider le cache" dans l'app

Dans **Settings** ou **Debug**, ajouter un bouton qui fait :

```typescript
const clearAllCaches = async () => {
  // Vider tous les caches
  localStorage.clear();
  sessionStorage.clear();

  // Vider IndexedDB
  const dbs = await indexedDB.databases();
  for (const db of dbs) {
    if (db.name) await indexedDB.deleteDatabase(db.name);
  }

  // Vider Cache API
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));

  // Recharger
  window.location.reload();
};
```

### Désactiver le cache Supabase Realtime (si pas nécessaire)

Dans la config Supabase client :

```typescript
const supabase = createClient(url, key, {
  realtime: {
    params: {
      eventsPerSecond: 0 // Désactiver realtime
    }
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  }
});
```

---

## 📋 Checklist de nettoyage

- [ ] Aller sur https://casskai.app/clear-all-cache.html
- [ ] Cliquer sur "Tout vider + Recharger"
- [ ] Reconnexion
- [ ] Vérifier que les anciennes données ont disparu
- [ ] Réimporter le fichier FEC (si nécessaire)
- [ ] Recharger la page après l'import (`F5`)
- [ ] Vérifier que les nouvelles données s'affichent correctement

---

**Date** : 08 Décembre 2025
**Status** : 🔧 Solution complète
**Fichiers créés** :
- `public/clear-all-cache.html` - Page de nettoyage automatique
- Ce document d'instructions
