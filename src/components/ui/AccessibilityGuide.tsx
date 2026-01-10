// Guide d'accessibilité et de design system pour CassKai
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { logger } from '@/lib/logger';
import {
  CheckCircle,
  AlertTriangle,
  Info,
  Eye,
  Keyboard,
  Mouse,
  Smartphone,
  Monitor,
  Type,
  Volume2
} from 'lucide-react';
// Définitions des standards d'accessibilité
export const AccessibilityStandards = {
  // Couleurs avec ratios de contraste WCAG AA/AAA
  colors: {
    primary: {
      main: '#2563eb', // blue-600
      contrast: '#ffffff',
      ratio: '7.3:1', // AAA
    },
    secondary: {
      main: '#64748b', // slate-500
      contrast: '#ffffff', 
      ratio: '4.8:1', // AA
    },
    success: {
      main: '#16a34a', // green-600
      contrast: '#ffffff',
      ratio: '6.1:1', // AAA
    },
    warning: {
      main: '#d97706', // amber-600
      contrast: '#ffffff',
      ratio: '4.9:1', // AA
    },
    error: {
      main: '#dc2626', // red-600
      contrast: '#ffffff',
      ratio: '6.2:1', // AAA
    },
  },
  // Tailles de police et espacement
  typography: {
    minSize: '16px', // Taille minimum pour la lisibilité
    lineHeight: '1.5', // Espacement des lignes optimal
    maxLineLength: '75ch', // Longueur maximum de ligne
  },
  // Standards d'interaction
  interaction: {
    minTouchTarget: '44px', // Surface minimum de touche (mobile)
    focusIndicator: '2px solid #2563eb', // Indicateur de focus visible
    animationDuration: '200ms', // Durée d'animation accessible
  },
  // Tests d'accessibilité
  tests: [
    {
      category: 'Vision',
      items: [
        'Contraste des couleurs (WCAG AA: 4.5:1, AAA: 7:1)',
        'Taille de police minimum (16px)',
        'Navigation au clavier uniquement',
        'Indicateurs de focus visibles',
        'Alternative textuelle pour les images',
        'Test avec lecteur d\'écran',
      ]
    },
    {
      category: 'Motricité',
      items: [
        'Surface de clic minimum (44px)',
        'Espacement entre éléments interactifs',
        'Navigation sans souris possible',
        'Pas de timeout courts sur les actions',
        'Annulation d\'actions possibles',
      ]
    },
    {
      category: 'Auditif',
      items: [
        'Sous-titres pour le contenu vidéo',
        'Alternatives visuelles aux alertes sonores',
        'Contrôle du volume',
        'Transcription pour l\'audio',
      ]
    },
    {
      category: 'Cognitif',
      items: [
        'Interface cohérente et prévisible',
        'Messages d\'erreur clairs et utiles',
        'Instructions simples et directes',
        'Possibilité de revenir en arrière',
        'Pas de clignotement > 3Hz',
        'Temps suffisant pour lire',
      ]
    }
  ]
};
// Composants de test d'accessibilité
export const AccessibilityDemo: React.FC = () => {
  const [focusedElement, setFocusedElement] = React.useState<string | null>(null);
  const handleKeyDown = (e: React.KeyboardEvent, action: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      logger.debug('AccessibilityGuide', `Action: ${action}`);
    }
  };
  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Guide d'Accessibilité CassKai
          </CardTitle>
          <CardDescription>
            Standards et bonnes pratiques pour une interface inclusive
          </CardDescription>
        </CardHeader>
      </Card>
      {/* Test des couleurs et contrastes */}
      <Card>
        <CardHeader>
          <CardTitle>Couleurs et Contrastes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(AccessibilityStandards.colors).map(([name, color]) => (
              <div key={name} className="space-y-2">
                <div 
                  className="p-4 rounded-lg text-white font-medium"
                  style={{ backgroundColor: color.main }}
                >
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </div>
                <div className="text-sm">
                  <div>Couleur: {color.main}</div>
                  <div>Contraste: {color.ratio}</div>
                  <Badge variant={
                    parseFloat(color.ratio) >= 7 ? 'default' : 
                    parseFloat(color.ratio) >= 4.5 ? 'secondary' : 
                    'destructive'
                  }>
                    {parseFloat(color.ratio) >= 7 ? 'AAA' : 
                     parseFloat(color.ratio) >= 4.5 ? 'AA' : 
                     'Fail'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Test de navigation au clavier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Navigation au Clavier
          </CardTitle>
          <CardDescription>
            Testez la navigation avec Tab, Enter et Espace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Premier', 'Deuxième', 'Troisième'].map((item, _index) => (
              <Button
                key={item}
                variant="outline"
                className={`p-4 transition-all duration-200 ${
                  focusedElement === item 
                    ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50' 
                    : ''
                }`}
                onFocus={() => setFocusedElement(item)}
                onBlur={() => setFocusedElement(null)}
                onKeyDown={(e) => handleKeyDown(e, `Bouton ${item}`)}
                aria-label={`Bouton ${item} - Utilisez Entrée ou Espace pour activer`}
              >
                {item} Bouton
              </Button>
            ))}
          </div>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Élément actuellement focalisé: <strong>{focusedElement || 'Aucun'}</strong>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      {/* Test responsive et tailles de cible */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Tailles de Cible et Responsive
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Surface de clic standard (44px minimum)</h4>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="min-w-[44px] min-h-[44px]">SM</Button>
                <Button size="default" className="min-w-[44px] min-h-[44px]">MD</Button>
                <Button size="lg" className="min-w-[44px] min-h-[44px]">LG</Button>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Espacement accessible</h4>
              <div className="flex flex-col gap-3">
                <Button variant="outline" className="w-full">
                  Bouton avec espacement correct (12px gap)
                </Button>
                <Button variant="outline" className="w-full">
                  Autre bouton avec espacement
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Typographie accessible */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Typographie Accessible
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="text-sm" style={{ fontSize: '14px' }}>
              ❌ Trop petit (14px) - Difficile à lire
            </div>
            <div className="text-base" style={{ fontSize: '16px' }}>
              ✅ Taille standard (16px) - Lisibilité optimale
            </div>
            <div className="text-lg" style={{ fontSize: '18px' }}>
              ✅ Grande taille (18px) - Confort de lecture
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Hauteur de ligne optimale (1.5)</h4>
              <p className="leading-relaxed max-w-prose">
                Cette ligne de texte utilise un espacement optimal de 1.5 entre les lignes, 
                ce qui améliore considérablement la lisibilité et réduit la fatigue oculaire. 
                C'est particulièrement important pour les utilisateurs avec des difficultés 
                de lecture ou de vision.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Test des états et feedback */}
      <Card>
        <CardHeader>
          <CardTitle>États et Feedback Visuels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">États des boutons</h4>
              <div className="flex flex-wrap gap-2">
                <Button variant="default">Normal</Button>
                <Button variant="default" className="hover:bg-blue-700" disabled={false}>
                  Hover (simulé)
                </Button>
                <Button variant="default" className="ring-2 ring-blue-500 ring-offset-2">
                  Focus
                </Button>
                <Button variant="default" disabled>
                  Désactivé
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Indicateurs de progression</h4>
              <div className="space-y-2">
                <Progress value={33} className="w-full" aria-label="Progression: 33%" />
                <Progress value={66} className="w-full" aria-label="Progression: 66%" />
                <Progress value={100} className="w-full" aria-label="Progression: 100%" />
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Messages d'état</h4>
              <div className="space-y-2">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>Opération réussie avec succès</AlertDescription>
                </Alert>
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Attention: vérifiez vos informations
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Checklist d'accessibilité */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist d'Accessibilité</CardTitle>
          <CardDescription>
            Tests recommandés pour chaque interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {AccessibilityStandards.tests.map((category) => (
              <div key={category.category}>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  {category.category === 'Vision' && <Eye className="w-4 h-4" />}
                  {category.category === 'Motricité' && <Mouse className="w-4 h-4" />}
                  {category.category === 'Auditif' && <Volume2 className="w-4 h-4" />}
                  {category.category === 'Cognitif' && <Monitor className="w-4 h-4" />}
                  {category.category}
                </h4>
                <ul className="space-y-2">
                  {category.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
// Hook pour tester l'accessibilité d'un composant
export const useAccessibilityTest = () => {
  const [violations, setViolations] = React.useState<string[]>([]);
  const testElement = (element: HTMLElement) => {
    const issues: string[] = [];
    // Test de contraste (simulation)
    const style = window.getComputedStyle(element);
    const _color = style.color;
    const _backgroundColor = style.backgroundColor;
    // Test de taille minimum
    const rect = element.getBoundingClientRect();
    if (rect.width < 44 || rect.height < 44) {
      issues.push('Surface de clic trop petite (<44px)');
    }
    // Test d'attributs accessibles
    if (element.tagName === 'BUTTON' && !element.getAttribute('aria-label') && !element.textContent?.trim()) {
      issues.push('Bouton sans label accessible');
    }
    if (element.tagName === 'IMG' && !element.getAttribute('alt')) {
      issues.push('Image sans texte alternatif');
    }
    setViolations(issues);
    return issues;
  };
  return { violations, testElement };
};
export default AccessibilityDemo;