# 🚨 INSTRUCTIONS DE CORRECTION VPS - TRAEFIK vs NGINX

## PROBLÈME IDENTIFIÉ
Votre `docker-compose.yml` expose le port 80/443 sur `app-prod`, ce qui crée un conflit avec Traefik.

## DIAGNOSTIC IMMÉDIAT SUR LE VPS

Connectez-vous en SSH et exécutez ces commandes :

```bash
# Voir tous les containers actifs
docker ps

# Vérifier qui utilise les ports 80/443
sudo netstat -tulpn | grep -E ':(80|443)'
# OU
sudo ss -tulpn | grep -E ':(80|443)'

# Voir les logs de Traefik
docker logs traefik 2>&1 | tail -50

# Voir les logs du container Nginx/Nginx
docker logs casskai-nginx 2>&1 | tail -50
# ou
docker logs casskai-app-prod 2>&1 | tail -50

# Vérifier le statut des services Docker
docker-compose ps
```

## SOLUTION IMMÉDIATE

### OPTION 1 : UTILISER TRAEFIK UNIQUEMENT (RECOMMANDÉ)

1. **Arrêter les containers conflictuels**
```bash
cd /chemin/vers/votre/casskai
docker-compose down

# Si Nginx tourne en standalone
docker stop casskai-nginx 2>/dev/null || true
docker rm casskai-nginx 2>/dev/null || true

# Nettoyer les orphelins
docker system prune -f
```

2. **Mettre à jour docker-compose.yml**
- Retirez les ports 80:80 et 443:443 du service `app-prod`
- Laissez SEUL Traefik avec les ports 80/443
- Traefik doit être défini comme proxy inverse

3. **Redémarrer avec Traefik en charge**
```bash
docker-compose -f docker-compose.yml up -d traefik app-prod
docker-compose logs -f traefik
```

### OPTION 2 : SI VOUS DEVEZ GARDER NGINX

Nginx et Traefik NE PEUVENT PAS être actifs simultanément sur les mêmes ports.
- Exposez Nginx sur un port différent (ex: 8080)
- Laissez Traefik sur 80/443
- Nginx doit être derrière Traefik

## CONFIGURATION CORRIGÉE

Le service `app-prod` devrait être :
```yaml
app-prod:
  build: ...
  ports:
    - "5000:5000"  # Port interne seulement, PAS 80/443
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.app-prod.rule=Host(`votre-domaine.com`)"
    - "traefik.http.services.app-prod.loadbalancer.server.port=5000"
```

## VÉRIFICATION FINALE

```bash
# Ports écoutés après correction
sudo netstat -tulpn | grep -E ':(80|443)'

# Doit montrer seulement Traefik:
# TCP    0.0.0.0:80     (Traefik)
# TCP    0.0.0.0:443    (Traefik)

# Test accès HTTP
curl -I http://localhost

# Doit répondre avec headers Traefik, pas Nginx/app-prod
```

## SI RIEN NE FONCTIONNE

```bash
# Forcer l'arrêt de tous les containers
docker kill $(docker ps -q) 2>/dev/null || true
docker system prune -fa --volumes

# Redémarrer Docker daemon
sudo systemctl restart docker

# Relancer
docker-compose up -d
```

---
**Exécutez ces commandes et reportez-moi l'output des diagnostics !**
