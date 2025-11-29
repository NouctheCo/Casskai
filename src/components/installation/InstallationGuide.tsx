// components/InstallationGuide.tsx
import { useState } from 'react';
import { Button } from '../ui/button';
import { createSafeHTML } from '@/utils/sanitize';

export function InstallationGuide() {
  const [currentStep, setCurrentStep] = useState(1);
  
  const steps = [
    {
      title: "Prérequis",
      content: `
## Avant de commencer

### Compte Supabase
1. Créez un compte gratuit sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez l'URL et la clé API anonyme

### Serveur/Hébergement
- **Option 1**: Netlify/Vercel (recommandé)
- **Option 2**: Serveur VPS avec Node.js
- **Option 3**: Hébergement partagé avec support Node.js

### Domaine personnalisé (optionnel)
- Nom de domaine pointant vers votre hébergement
- Certificat SSL configuré
      `
    },
    {
      title: "Installation",
      content: `
## Installation de Casskai

### 1. Téléchargement
\`\`\`bash
# Télécharger depuis GitHub
git clone https://github.com/NouctheCo/Casskai.git
cd Casskai

# Ou télécharger le ZIP depuis GitHub
\`\`\`

### 2. Configuration
\`\`\`bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env
\`\`\`

### 3. Configuration Supabase
Éditez le fichier \`.env\`:
\`\`\`
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anonyme
VITE_APP_URL=https://votre-domaine.com
\`\`\`
      `
    },
    {
      title: "Base de données",
      content: `
## Configuration de la base de données

### 1. Migrations automatiques
Lors du premier lancement, Casskai créera automatiquement:
- Les tables nécessaires
- Le plan comptable adapté à votre pays
- Les données de base

### 2. Vérification manuelle (optionnel)
Dans l'interface Supabase:
1. Allez dans "Table Editor"
2. Vérifiez que les tables sont créées:
   - companies
   - users
   - accounts
   - transactions
   - journal_entries

### 3. Configuration RLS (Row Level Security)
Les politiques de sécurité sont automatiquement appliquées.
      `
    },
    {
      title: "Déploiement",
      content: `
## Déploiement en production

### Option 1: Netlify (Recommandé)
\`\`\`bash
# Build de production
npm run build

# Déployer sur Netlify
npm run deploy:netlify
\`\`\`

### Option 2: Vercel
\`\`\`bash
# Installation Vercel CLI
npm install -g vercel

# Déploiement
vercel --prod
\`\`\`

### Option 3: Serveur VPS
\`\`\`bash
# Build
npm run build

# Copier le dossier 'dist' sur votre serveur
# Configurer nginx/apache pour servir les fichiers statiques
\`\`\`

### Configuration domaine
1. Pointez votre domaine vers l'hébergement
2. Configurez le certificat SSL
3. Mettez à jour VITE_APP_URL dans la configuration
      `
    },
    {
      title: "Premier lancement",
      content: `
## Configuration initiale

### 1. Accès à l'application
Ouvrez votre navigateur et allez sur votre domaine.

### 2. Assistant de configuration
L'assistant vous guidera pour:
- Créer le compte administrateur
- Configurer la première entreprise
- Choisir la devise et le pays
- Importer le plan comptable

### 3. Vérifications
- Testez la connexion Supabase
- Créez une première écriture comptable
- Vérifiez les rapports de base

### 4. Formation utilisateurs
- Consultez la documentation utilisateur
- Organisez une formation pour votre équipe
- Configurez les rôles et permissions
      `
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Guide d'Installation Casskai</h1>
      
      <div className="flex mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex-1">
            <div className={`
              w-full h-2 ${index + 1 <= currentStep ? 'bg-blue-600' : 'bg-gray-200'}
              ${index === 0 ? 'rounded-l' : ''}
              ${index === steps.length - 1 ? 'rounded-r' : ''}
            `} />
            <div className="mt-2 text-center">
              <button
                onClick={() => setCurrentStep(index + 1)}
                className={`
                  text-sm font-medium
                  ${index + 1 === currentStep ? 'text-blue-600' : 'text-gray-500'}
                `}
              >
                {step.title}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="prose prose-blue max-w-none">
          <div dangerouslySetInnerHTML={createSafeHTML(
            steps[currentStep - 1].content.replace(/\n/g, '<br>')
          )} />
        </div>
        
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Précédent
          </Button>
          
          <Button
            onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
            disabled={currentStep === steps.length}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
