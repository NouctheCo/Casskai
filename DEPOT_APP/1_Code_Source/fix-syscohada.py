#!/usr/bin/env python3
"""Script pour réparer le fichier syscohada.ts"""

# Lire l'original jusqu'à la ligne 744 (fin de la classe 9)
with open('src/data/syscohada.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Trouver où ça se termine (avant les exports dupliqués)
end_index = None
for i, line in enumerate(lines):
    if i > 740 and '// Utilitaire pour filtrer' in line:
        end_index = i
        break

if end_index:
    # Garder jusqu'à la fin de class 9
    content = ''.join(lines[:end_index])
else:
    # Sinon garder jusqu'à 744
    content = ''.join(lines[:744])

# Ajouter la fermeture et les exports
closing = """  ]

};

// Exporte les classes principales SYSCOHADA (numéro et nom)
export const SYSCOHADA_CLASSES = SYSCOHADA_PLAN.classes.map(cls => ({
  number: cls.number,
  name: cls.name
}));

// Exporte tous les comptes et sous-comptes SYSCOHADA à plat
export const SYSCOHADA_ACCOUNTS = SYSCOHADA_PLAN.classes.flatMap(cls =>
  cls.accounts.flatMap(acc => [
    {
      number: acc.number,
      name: acc.name,
      type: acc.type,
      isDebitNormal: acc.isDebitNormal,
      classNumber: cls.number
    },
    ...(acc.subAccounts?.map(sub => ({
      number: sub.number,
      name: sub.name,
      type: sub.type,
      isDebitNormal: sub.isDebitNormal,
      classNumber: cls.number
    })) || [])
  ])
);

// Utilitaire pour filtrer les comptes d'une classe donnée
export function getSyscohadaAccountsByClass(classNumber: string) {
  return SYSCOHADA_ACCOUNTS.filter(acc => acc.classNumber === classNumber);
}
"""

# Écrire le fichier corrigé
with open('src/data/syscohada.ts', 'w', encoding='utf-8') as f:
    f.write(content + closing)

print("Fichier syscohada.ts réparé avec succès!")
print(f"Lignes: {len(content.split(chr(10))) + len(closing.split(chr(10)))}")
