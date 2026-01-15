# Documentation Assistant IA (CassKai)

Ce dossier contient les documents destinés à être ingérés dans la base de connaissance (KB/RAG) de l’assistant IA.

## Ajouter un document
- Créez un fichier Markdown dans `docs/assistant/` (ex: `nouvelle-procedure.md`).
- Lancez l’ingestion KB :
  - Tout ingérer : `npm run kb:ingest:app`
  - Un seul fichier : `npm run kb:ingest:app --only=docs/assistant/nouvelle-procedure.md`

## Bonnes pratiques (pour de meilleures réponses)
- Un sujet par document.
- Des titres clairs (`#`, `##`, `###`).
- Des listes à puces pour les procédures.
- Ajoutez des exemples concrets (cas d’usage, erreurs fréquentes, “si… alors…”).

## À ne pas mettre ici
- Secrets (clés API, mots de passe, tokens), exports de DB, dumps, logs sensibles.
- Docs sécurité détaillées (rotation secrets, procédures d’incident) si vous ne voulez pas que l’IA les voie.
