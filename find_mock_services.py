#!/usr/bin/env python3
"""
Script pour identifier tous les services qui utilisent des données mockées
"""

import os
import re
from pathlib import Path

def analyze_service_file(filepath):
    """Analyse un fichier service et retourne les problèmes trouvés"""
    issues = []

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')

            # Chercher les patterns suspects
            for i, line in enumerate(lines, 1):
                # Mock data
                if re.search(r'(MOCK_DATA|mockData|generateMock|mock_data)', line, re.IGNORECASE):
                    issues.append((i, 'MOCK_DATA', line.strip()[:80]))

                # TODO Supabase
                if re.search(r'TODO.*[Ss]upabase', line):
                    issues.append((i, 'TODO_SUPABASE', line.strip()[:80]))

                # TODO Replace/Implement
                if re.search(r'TODO.*(replace|implement|remplacer)', line, re.IGNORECASE):
                    issues.append((i, 'TODO_IMPL', line.strip()[:80]))

                # Return mock/fake data
                if re.search(r'return\s+(this\.)?([a-z]+Mock|fake[A-Z]|dummy[A-Z])', line):
                    issues.append((i, 'RETURN_MOCK', line.strip()[:80]))

    except Exception as e:
        issues.append((0, 'ERROR', f"Error reading file: {e}"))

    return issues

def main():
    services_dir = Path('src/services')

    print("=" * 80)
    print("ANALYSE DES SERVICES AVEC DONNÉES MOCKÉES")
    print("=" * 80)
    print()

    all_issues = {}

    # Parcourir tous les fichiers .ts dans services/
    for filepath in services_dir.rglob('*.ts'):
        if filepath.name.endswith('.test.ts'):
            continue

        issues = analyze_service_file(filepath)
        if issues:
            all_issues[str(filepath)] = issues

    # Afficher les résultats
    if not all_issues:
        print("✅ Aucun problème trouvé!")
        return

    print(f"🔴 {len(all_issues)} fichiers avec des problèmes détectés:\n")

    for filepath, issues in sorted(all_issues.items()):
        print(f"\n📄 {filepath}")
        print("─" * 80)
        for line_num, issue_type, line_content in issues:
            print(f"  L{line_num:4d} [{issue_type:15s}] {line_content}")

    print("\n" + "=" * 80)
    print(f"TOTAL: {sum(len(issues) for issues in all_issues.values())} problèmes dans {len(all_issues)} fichiers")
    print("=" * 80)

if __name__ == '__main__':
    main()
