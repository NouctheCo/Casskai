#!/usr/bin/env python3
"""
Script pour appliquer TOUTES les migrations SQL manquantes sur Supabase
Ceci corrige le problème où les migrations ont été créées mais jamais appliquées
"""

import os
import requests
import time

# Configuration Supabase
SUPABASE_URL = "https://smtdtgrymuzwvctattmx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODEzNzkxMSwiZXhwIjoyMDQzNzEzOTExfQ.x0wAyY_CtbkdzeunN5gxPLYFSWXO6p-Z-Y2OZS4V9_w"

# Liste des migrations à appliquer dans l'ordre
MIGRATIONS = [
    "supabase/migrations/20251107000001_populate_chart_templates_all_countries_v2.sql",
    "supabase/migrations/20251107000002_auto_initialize_chart_of_accounts.sql",
    "supabase/migrations/20251107100000_create_tax_module_tables.sql",
    "supabase/migrations/20251107110000_create_forecasts_tables.sql",
    "supabase/migrations/20251107120000_create_purchases_tables.sql",
    "supabase/migrations/20251107120001_fix_purchases_schema.sql",
    "supabase/migrations/20251107130000_create_onboarding_function.sql",
    "supabase/migrations/20251107140000_fix_trial_to_30_days_enterprise.sql",
]

def apply_migration(sql_file_path):
    """Applique une migration SQL via l'API Supabase"""
    if not os.path.exists(sql_file_path):
        print(f"❌ Fichier introuvable: {sql_file_path}")
        return False

    print(f"\n📄 Lecture de {sql_file_path}...")
    with open(sql_file_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    print(f"📤 Application de la migration...")

    # Appel API Supabase pour exécuter le SQL
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }

    # Note: L'API REST de Supabase ne permet pas d'exécuter du SQL arbitraire
    # Il faut utiliser l'API SQL directement ou le dashboard
    print("⚠️  Impossible d'appliquer via API REST")
    print("📋 Contenu SQL à copier dans le SQL Editor de Supabase:")
    print("=" * 80)
    print(sql_content[:500] + "..." if len(sql_content) > 500 else sql_content)
    print("=" * 80)

    return None

def main():
    print("=" * 80)
    print("🚀 APPLICATION DES MIGRATIONS SQL MANQUANTES")
    print("=" * 80)
    print()
    print("⚠️  IMPORTANT: Les migrations ne peuvent pas être appliquées automatiquement")
    print("    via l'API REST. Vous devez les appliquer manuellement.")
    print()
    print("📋 ÉTAPES À SUIVRE:")
    print()
    print("1. Ouvrez le SQL Editor de Supabase:")
    print(f"   https://supabase.com/dashboard/project/smtdtgrymuzwvctattmx/sql/new")
    print()
    print("2. Copiez-collez le contenu de chaque fichier ci-dessous dans l'ordre:")
    print()

    for i, migration_file in enumerate(MIGRATIONS, 1):
        if os.path.exists(migration_file):
            print(f"   {i}. {os.path.basename(migration_file)} ✅")
        else:
            print(f"   {i}. {os.path.basename(migration_file)} ❌ INTROUVABLE")

    print()
    print("3. Cliquez sur 'Run' pour chaque migration")
    print()
    print("4. Vérifiez qu'il n'y a pas d'erreurs")
    print()
    print("=" * 80)
    print()

    # Afficher le contenu de chaque migration
    for i, migration_file in enumerate(MIGRATIONS, 1):
        if os.path.exists(migration_file):
            print(f"\n{'=' * 80}")
            print(f"MIGRATION {i}/{len(MIGRATIONS)}: {os.path.basename(migration_file)}")
            print('=' * 80)
            with open(migration_file, 'r', encoding='utf-8') as f:
                content = f.read()
                # Afficher les 20 premières lignes
                lines = content.split('\n')[:20]
                print('\n'.join(lines))
                if len(content.split('\n')) > 20:
                    print(f"\n... ({len(content.split('\n')) - 20} lignes restantes)\n")
                print(f"\n📏 Taille totale: {len(content)} caractères")

    print("\n" + "=" * 80)
    print("✅ Toutes les migrations sont listées ci-dessus")
    print("=" * 80)

if __name__ == "__main__":
    main()
