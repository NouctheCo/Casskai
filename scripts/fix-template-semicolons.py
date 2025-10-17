#!/usr/bin/env python3
"""
Script pour corriger les points-virgules mal placés dans les template literals
"""

import os
import re
from pathlib import Path

SRC_DIR = Path(__file__).parent.parent / 'src'
files_fixed = 0

def fix_template_literals(file_path):
    """Corrige les template literals dans un fichier"""
    global files_fixed

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Patterns à corriger
        patterns = [
            # ${String(tableName);} -> ${String(tableName)}
            (r'\$\{String\(tableName\);\}', r'${String(tableName)}'),
            # ${someVar;} -> ${someVar}
            (r'\$\{([a-zA-Z_][a-zA-Z0-9_]*)\;\}', r'${\1}'),
            # ${func();} -> ${func()}
            (r'\$\{([^}]+)\;\}', r'${\1}'),
        ]

        for pattern, replacement in patterns:
            content = re.sub(pattern, replacement, content)

        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            files_fixed += 1
            print(f"Fixed: {file_path.relative_to(SRC_DIR)}")

    except Exception as e:
        print(f"Error processing {file_path}: {e}")

def walk_directory(directory):
    """Parcourt récursivement un répertoire"""
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                file_path = Path(root) / file
                fix_template_literals(file_path)

def main():
    print('\nCorrection des points-virgules dans les template literals\n')
    walk_directory(SRC_DIR)
    print(f'\n{files_fixed} fichier(s) corrige(s)\n')

if __name__ == '__main__':
    main()
