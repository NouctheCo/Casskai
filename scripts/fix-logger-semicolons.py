#!/usr/bin/env python3
"""
Script pour corriger les points-virgules mal placés dans les appels logger
"""

import os
import re
from pathlib import Path

SRC_DIR = Path(__file__).parent.parent / 'src'
files_fixed = 0

def fix_logger_calls(file_path):
    """Corrige les appels logger dans un fichier"""
    global files_fixed

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Pattern 1: logger.xxx(...);} -> logger.xxx(...)}
        content = re.sub(r'logger\.(debug|info|warn|error|action|api|db|performance)\(([^)]*)\);\}', r'logger.\1(\2)}', content)

        # Pattern 2: logger.xxx(...);. -> logger.xxx(...).
        content = re.sub(r'logger\.(debug|info|warn|error|action|api|db|performance)\(([^)]*)\);\.([\w]+)', r'logger.\1(\2).\3', content)

        # Pattern 3: );) -> ))
        content = re.sub(r'logger\.(debug|info|warn|error|action|api|db|performance)\([^)]+\);\)', r'logger.\1(\2))', content)

        # Pattern 4: logger.xxx('...');` (fin de template literal avec semicolon)
        content = re.sub(r"logger\.(debug|info|warn|error)\(([^)]*)\);['\"]", r"logger.\1(\2)'", content)

        # Pattern 5: );, dans les appels
        content = re.sub(r'\);\,', '),', content)

        # Pattern 6: logger.info('...');); -> logger.info('...'));
        content = re.sub(r'logger\.(debug|info|warn|error|action|api|db)\(([^;]+)\);\)', r'logger.\1(\2))', content)

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
                fix_logger_calls(file_path)

def main():
    print('\nCorrection des points-virgules dans les appels logger\n')
    walk_directory(SRC_DIR)
    print(f'\n{files_fixed} fichier(s) corrige(s)\n')

if __name__ == '__main__':
    main()
