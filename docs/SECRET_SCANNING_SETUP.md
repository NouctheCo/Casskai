# Détection de secrets avant commit

## Option 1: ggshield (recommandé)

1. Installer ggshield (global):
   - macOS/Linux: `pipx install ggshield` ou `pip install --user ggshield`
   - Windows: `pipx install ggshield` (recommandé)
2. Authentifier auprès de GitGuardian (si compte disponible): `ggshield auth login`
3. Activer le hook Husky (déjà fourni dans `.husky/pre-commit`).

## Option 2: git-secrets

1. Installer git-secrets: https://github.com/awslabs/git-secrets
2. Initialiser: `git secrets --install` puis `git secrets --register-aws --global` (exemples).
3. Le hook `.husky/pre-commit` exécutera git-secrets automatiquement si présent.

## CI/CD

Configurer un job CI pour exécuter `ggshield secret scan ci` ou équivalent.
