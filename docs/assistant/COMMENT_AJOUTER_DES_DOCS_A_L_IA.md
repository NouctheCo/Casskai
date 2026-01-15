# Comment ajouter des documents pour l’IA

L’assistant IA ne “lit” pas automatiquement vos fichiers. Pour qu’un document serve à répondre aux questions, il faut l’**ingérer** dans la base de connaissance (KB).

## Étape 1 — Créer le document
1. Créez un fichier `.md` dans `docs/assistant/`.
2. Écrivez en clair (procédures, FAQ, règles métier, définitions).

Exemple de structure :

```md
# Sujet

## Objectif

## Procédure
1. ...
2. ...

## FAQ
- Q: ...
- R: ...
```

## Étape 2 — Lancer l’ingestion
### Option A (recommandé) : ingérer un seul fichier
```bash
npm run kb:ingest:app --only=docs/assistant/mon-doc.md
```

### Option B : tout ingérer
```bash
npm run kb:ingest:app
```

## Étape 3 — Vérifier
- Dans Supabase, table `kb_documents` : votre document apparaît.
- Dans `kb_chunks` : vous voyez des “chunks” liés au document.

## Problèmes fréquents
- Le fichier est “skippé” : il contient des mots-clés considérés sensibles.
- Le fichier n’est pas trouvé : vérifiez le chemin et l’extension `.md`.
