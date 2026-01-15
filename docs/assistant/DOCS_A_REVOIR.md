# Docs à revoir / à trier (non destructif)

Objectif : garder une documentation “produit” claire pour les utilisateurs, et isoler les documents internes (audit/debug/sécurité/déploiement).

## Proposition de tri
### À garder “produit” (utile sur un espace documentation)
- `docs/user-guide/`
- `docs/api/`
- `docs/guides/`
- `docs/FAQ.md`

### À archiver (interne / historique)
- `docs/archive/`
- Tous les `AUDIT_*`, `DEBUG_*`, `*_REPORT*`, `*_SUMMARY*`, `PHASE*`, `SPRINT*` si ce sont des rapports internes.

### À protéger (ne pas exposer publiquement)
- `docs/security/` et tout ce qui parle de rotation de secrets, actions immédiates, etc.

## Important (Assistant IA)
L’ingestion KB utilise une liste d’exclusions (déploiement/sécurité/env/sql…). Donc même si ces fichiers restent dans le repo, ils ne sont en général pas ingérés.

## Prochaine étape
Si tu veux, je peux :
1) Générer une liste des fichiers `docs/**` potentiellement “internes” (audit/debug/sécurité/déploiement)
2) Proposer une arborescence propre (ex: `docs/public/*` vs `docs/internal/*`)
3) Adapter la config d’ingestion pour n’ingérer que `docs/public/**` + `docs/assistant/**`
