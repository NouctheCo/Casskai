# Règles de confidentialité et sécurité (Assistant IA)

Objectif : permettre des réponses utiles sans fuite d’informations sensibles.

## À mettre dans la KB (OK)
- Procédures métier (facturation, compta, onboarding, paramétrage modules)
- Guides utilisateur (comment faire X)
- Définitions (glossaire)
- Bonnes pratiques internes non sensibles

## À ne PAS mettre dans la KB
- Clés API, mots de passe, tokens, variables `.env`
- Secrets Supabase (service role, anon key, etc.)
- Données personnelles en clair (clients, employés, IBAN, etc.)
- Procédures d’attaque, contournement sécurité, détails RLS

## Si un document doit exister mais rester privé
- Gardez-le hors `docs/assistant/`.
- Ou stockez-le dans un espace restreint (accès contrôlé) et ne l’ingérez pas.

## Rappel
Même avec des garde-fous, le meilleur contrôle est : **ne pas ingérer de secrets**.
