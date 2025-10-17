# Déploiement (script ultra-rapide durci)

Script: `deploy-ultra-fast.sh`

Prérequis:
- Utilisateur non-root avec accès SSH par clé (ex: `deploy`).
- Variables d'environnement définies: `VPS_HOST`, `VPS_USER`, `VPS_PATH`.
- Optionnels: `RELEASES_DIR` (def: `releases`), `CURRENT_LINK` (def: `current`).

Exemples:

```bash
VPS_HOST=your.server \
VPS_USER=deploy \
VPS_PATH=/var/www/casskai.app \
./deploy-ultra-fast.sh --skip-build
```

Ce que fait le script:
- Fail-fast (`set -euo pipefail`).
- Build conditionnel (désactivable `--skip-build`).
- Upload atomique vers `releases/<timestamp>` puis bascule du lien `current`.
- Aucun `chown -R` systématique.
- Pas de double compression.

Sécurité:
- Interdit `root` par défaut (peut forcer `ALLOW_ROOT=true` mais déconseillé).
