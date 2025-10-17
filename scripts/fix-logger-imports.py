#!/usr/bin/env python3
"""
Script pour corriger les imports du logger mal insérés
Répare les cas où l'import logger a été inséré à l'intérieur d'un autre import
"""

import os
import re
from pathlib import Path

SRC_DIR = Path(__file__).parent.parent / 'src'
files_fixed = 0

def fix_imports(file_path):
    """Corrige les imports dans un fichier"""
    global files_fixed

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Pattern pour détecter l'import logger mal placé entre "import {" et les exports
        # Exemple: import {\nimport { logger } from '@/utils/logger';\n  Something,
        pattern = r"(import\s*\{\s*)\nimport\s*\{\s*logger\s*\}\s*from\s*['\"]@/utils/logger['\"]\s*;\s*\n(\s+)"

        if not re.search(pattern, content):
            return

        # Supprimer toutes les occurrences mal placées
        content = re.sub(pattern, r"\1\n\2", content)

        # Vérifier si logger est déjà importé correctement
        has_correct_import = re.search(r"^import\s*\{\s*logger\s*\}\s*from\s*['\"]@/utils/logger['\"]\s*;?\s*$", content, re.MULTILINE)

        if not has_correct_import:
            # Trouver le dernier import et insérer après
            lines = content.split('\n')
            last_import_idx = -1

            for i, line in enumerate(lines):
                if line.strip().startswith('import ') and not line.strip().startswith('import type'):
                    # Vérifier si c'est un import sur plusieurs lignes
                    if '{' in line and '}' not in line:
                        # Chercher la fermeture
                        for j in range(i+1, len(lines)):
                            if '}' in lines[j]:
                                last_import_idx = j
                                break
                    else:
                        last_import_idx = i

            if last_import_idx >= 0:
                # Insérer l'import après le dernier import
                lines.insert(last_import_idx + 1, "import { logger } from '@/utils/logger';")
                content = '\n'.join(lines)

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
                fix_imports(file_path)

def main():
    print('\nCorrection des imports logger mal places\n')
    walk_directory(SRC_DIR)
    print(f'\n{files_fixed} fichier(s) corrige(s)\n')

if __name__ == '__main__':
    main()
