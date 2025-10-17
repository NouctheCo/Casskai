#!/usr/bin/env python3
"""
Script pour corriger les points-virgules mal places dans les appels logger
"""

import re
from pathlib import Path

SRC_DIR = Path(__file__).parent.parent / 'src'
files_fixed = 0

def fix_logger_semicolons(file_path):
    """Corrige les semicolons mal places dans un fichier"""
    global files_fixed

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Pattern 1: logger.xxx(...);} -> logger.xxx(...)}
        # Dans les JSX props ou arrow functions
        content = re.sub(
            r"(logger\.(debug|info|warn|error|action|api|db|performance)\([^)]*\));(\s*[}\)])",
            r"\1\3",
            content
        )

        # Pattern 2: logger.xxx('...', obj);.property -> logger.xxx('...', obj).property
        # Erreur: (result as { success: false; error: string });.error
        content = re.sub(
            r"\);\.([a-zA-Z_][a-zA-Z0-9_]*)",
            r").\1",
            content
        )

        # Pattern 3: logger.xxx(`...${expr};`) -> logger.xxx(`...${expr}`)
        # Semicolon dans template literal
        content = re.sub(
            r"(\$\{[^}]+);(\})",
            r"\1\2",
            content
        )

        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            files_fixed += 1
            print(f"Fixed: {file_path.relative_to(SRC_DIR)}")

    except Exception as e:
        print(f"Error processing {file_path}: {e}")

def walk_directory(directory):
    """Parcourt recursivement un repertoire"""
    for path in directory.rglob('*.ts'):
        fix_logger_semicolons(path)
    for path in directory.rglob('*.tsx'):
        fix_logger_semicolons(path)

def main():
    print("\nCorrection des semicolons mal places dans les logger calls\n")
    walk_directory(SRC_DIR)
    print(f"\n{files_fixed} fichiers corriges\n")

if __name__ == '__main__':
    main()
