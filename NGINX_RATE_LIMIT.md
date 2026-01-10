# Nginx Rate‑Limit pour /api

Objectif: limiter les rafales et abus côté HTTP avant l'API, réduire la charge et atténuer les bursts accidentels (F5, scripts), tout en laissant l'API saine traiter le trafic normal.

## Pourquoi c'est utile
- Protège contre les rafales (burst) et les attaques simples.
- Lisse le trafic et évite les pics CPU côté Node/PM2.
- Réduit l'impact de clients mal configurés.

## Snippet recommandé
À placer dans la configuration Nginx (http{} et location /api):

```
# Dans le bloc http {}
limit_req_zone $binary_remote_addr zone=api_zone:10m rate=30r/m; # 30 requêtes/min par IP

server {
  # ...
  location /api/ {
    limit_req zone=api_zone burst=10 nodelay; # autorise 10 requêtes en rafale
    proxy_pass http://host.docker.internal:3001; # adapter selon votre proxy
    # autres directives proxy...
  }

  # Exempter le webhook Stripe si nécessaire
  location = /webhook {
    # pas de rate limit sur le webhook
    proxy_pass http://host.docker.internal:3001/webhook;
  }
}
```

## Notes
- Ajustez `rate` et `burst` selon votre trafic.
- Si vous observez des 429 trop fréquents, augmentez `burst`.
- Exemptez les endpoints critiques (webhooks, callbacks externes).
- Après modification, recharger Nginx:
  - Container: `docker exec casskai-proxy nginx -s reload`
  - Hôte: `nginx -s reload`
