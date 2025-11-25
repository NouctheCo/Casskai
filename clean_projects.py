import re

# Lire le fichier
with open('c:/Users/noutc/Casskai/src/pages/ProjectsPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Supprimer toutes les données mock (lignes 58-345)
# Pattern pour supprimer depuis "// Données mock pour les projets" jusqu'à "mockProjectMetrics = {...};"
mock_pattern = r'// Données mock pour les projets.*?mockProjectMetrics = \{[^}]+\};'
content = re.sub(mock_pattern, '// Les données sont chargées depuis le service projectsService via useProjects hook', content, flags=re.DOTALL)

# Écrire le fichier modifié
with open('c:/Users/noutc/Casskai/src/pages/ProjectsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
