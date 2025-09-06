# 🚀 Déploiement Rapide - CassKai

## Commande Unique

```bash
npm run deploy
```

**C'est tout !** ⚡

## Résultat Attendu

```bash
🚀 === Déploiement CassKai sur VPS Hostinger ===
✅ VPS accessible
✅ Build réussi
✅ Frontend déployé
✅ Permissions corrigées
✅ Backend API active
✅ Tests passés
🎉 === Déploiement terminé ===
```

## URLs de Vérification

- **App Principal** : https://casskai.app
- **API Backend** : https://casskai.app/api  
- **Health Check** : https://casskai.app/health

## En Cas de Problème

1. **Vérifier SSH** : `ssh root@89.116.111.88`
2. **Reconstruire** : `npm run build`
3. **Retry** : `npm run deploy`

## Temps de Déploiement

- **Build** : ~30s
- **Transfer** : ~15s  
- **Total** : ~1min

---

## Configuration (Info)

- **Serveur** : VPS Hostinger (89.116.111.88)
- **Méthode** : SSH + SCP + PM2
- **Path** : `/var/www/casskai.app/public`
- **Script** : `scripts/deploy.sh`

---

**👥 Pour toute l'équipe : `npm run deploy` et c'est parti !**