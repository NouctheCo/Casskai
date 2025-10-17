#!/usr/bin/env python3
"""
Script pour analyser et corriger les imports et variables non utilises
"""

import subprocess
import json
from pathlib import Path
from collections import defaultdict

def analyze_unused():
    """Analyse les imports et variables non utilises avec ESLint"""

    print("Analyse des imports et variables non utilises...\n")

    # Executer ESLint en format JSON
    result = subprocess.run(
        ['npx', 'eslint', 'src/**/*.{ts,tsx}', '--format', 'json'],
        capture_output=True,
        text=True
    )

    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError:
        print("Erreur: Impossible de parser la sortie ESLint")
        return

    # Analyser les resultats
    unused_by_type = defaultdict(list)
    unused_by_file = defaultdict(list)

    for file_data in data:
        file_path = file_data['filePath'].replace('\\\\', '/').split('src/')[-1]

        for message in file_data.get('messages', []):
            msg = message['message'].lower()

            if 'unused' in msg or 'defined but never used' in msg or 'no-unused' in message.get('ruleId', ''):
                issue = {
                    'file': file_path,
                    'line': message['line'],
                    'message': message['message'],
                    'ruleId': message.get('ruleId', 'unknown')
                }

                # Categoriser par type
                if 'import' in msg:
                    unused_by_type['imports'].append(issue)
                elif 'variable' in msg or 'const' in msg or 'let' in msg:
                    unused_by_type['variables'].append(issue)
                else:
                    unused_by_type['other'].append(issue)

                unused_by_file[file_path].append(issue)

    # Afficher le resume
    print("=" * 80)
    print("RESUME DES IMPORTS ET VARIABLES NON UTILISES")
    print("=" * 80)
    print()

    total = sum(len(issues) for issues in unused_by_type.values())
    print(f"Total: {total} problemes")
    print()

    for type_name, issues in unused_by_type.items():
        print(f"{type_name.upper()}: {len(issues)}")

    print()
    print("=" * 80)
    print("TOP 20 FICHIERS AVEC LE PLUS DE PROBLEMES")
    print("=" * 80)
    print()

    sorted_files = sorted(unused_by_file.items(), key=lambda x: len(x[1]), reverse=True)[:20]

    for file_path, issues in sorted_files:
        print(f"{file_path}: {len(issues)} problemes")

    print()
    print("=" * 80)
    print("EXEMPLES DE PROBLEMES (30 premiers)")
    print("=" * 80)
    print()

    all_issues = [issue for issues in unused_by_type.values() for issue in issues]

    for i, issue in enumerate(all_issues[:30], 1):
        print(f"{i}. {issue['file']}:{issue['line']}")
        print(f"   {issue['message']}")
        print()

if __name__ == '__main__':
    analyze_unused()
