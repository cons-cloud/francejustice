# Guide de Développement - Law Just

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Git

### Installation
```bash
# Cloner le projet
git clone <repository-url>
cd law_just

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

## 🏗️ Architecture du Projet

### Structure des Dossiers
```
src/
├── components/          # Composants réutilisables
│   ├── ui/             # Composants UI de base (Button, Card, etc.)
│   ├── layout/         # Composants de mise en page (Header, Footer)
│   └── features/       # Composants métier (LegalAISearch, etc.)
├── pages/              # Pages de l'application
├── hooks/              # Hooks personnalisés React
├── lib/                # Utilitaires et helpers
├── types/              # Définitions TypeScript
└── assets/             # Images et ressources statiques
```

### Conventions de Nommage
- **Composants**: PascalCase (ex: `LegalAISearch`)
- **Fichiers**: kebab-case (ex: `legal-ai-search.tsx`)
- **Variables**: camelCase (ex: `searchQuery`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `API_BASE_URL`)

## 🎨 Design System

### Couleurs
```typescript
// Palette principale
primary: {
  50: '#eff6ff',
  100: '#dbeafe',
  // ...
  600: '#1E40AF', // Bleu juridique principal
}

// Utilisation
className="bg-primary-600 text-white"
```

### Composants UI
```typescript
// Button avec variants
<Button variant="primary" size="lg">
  Action
</Button>

// Card avec hover
<Card hover>
  <CardContent>Contenu</CardContent>
</Card>
```

## 🔧 Configuration

### Tailwind CSS
Configuration personnalisée dans `tailwind.config.ts` :
- Couleurs juridiques
- Animations personnalisées
- Composants utilitaires
- Dark mode support

### TypeScript
Configuration stricte avec :
- Types stricts dans `tsconfig.json`
- Interfaces complètes
- Props validation
- Error handling

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile First */
sm: 640px   /* Tablette */
md: 768px   /* Desktop petit */
lg: 1024px  /* Desktop */
xl: 1280px  /* Desktop large */
2xl: 1536px /* Desktop très large */
```

### Classes Responsive
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Responsive grid */}
</div>
```

## 🧩 Composants

### Création d'un Nouveau Composant
```typescript
// src/components/ui/NewComponent.tsx
import React from 'react';
import { cn } from '../../lib/utils';

interface NewComponentProps {
  children: React.ReactNode;
  className?: string;
}

const NewComponent: React.FC<NewComponentProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn('base-classes', className)}>
      {children}
    </div>
  );
};

export default NewComponent;
```

### Hooks Personnalisés
```typescript
// src/hooks/useCustomHook.ts
import { useState, useEffect } from 'react';

export const useCustomHook = (initialValue: any) => {
  const [value, setValue] = useState(initialValue);
  
  useEffect(() => {
    // Logique du hook
  }, []);
  
  return { value, setValue };
};
```

## 🚀 Fonctionnalités

### Recherche IA
```typescript
// Composant de recherche avec IA
const LegalAISearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  const handleSearch = async (e: React.FormEvent) => {
    // Logique de recherche IA
  };
  
  return (
    <form onSubmit={handleSearch}>
      {/* Interface de recherche */}
    </form>
  );
};
```

### Générateur de Documents
```typescript
// Formulaires multi-étapes
const GeneratorPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  
  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };
  
  return (
    <div>
      {/* Interface multi-étapes */}
    </div>
  );
};
```

## 🧪 Tests

### Tests Unitaires
```bash
# Lancer les tests
npm run test

# Tests en mode watch
npm run test:watch

# Coverage
npm run test:coverage
```

### Tests E2E
```bash
# Tests end-to-end
npm run test:e2e
```

## 📦 Build et Déploiement

### Build de Production
```bash
# Build optimisé
npm run build

# Preview du build
npm run preview
```

### Variables d'Environnement
```bash
# .env.local
VITE_API_BASE_URL=https://api.lawjust.fr
VITE_ENABLE_AI_SEARCH=true
```

## 🔍 Debugging

### Outils de Développement
- **React DevTools**: Inspection des composants
- **Redux DevTools**: State management
- **Network Tab**: Requêtes API
- **Console**: Logs et erreurs

### Logs Personnalisés
```typescript
// Utilitaires de logging
const logger = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  error: (message: string) => console.error(`[ERROR] ${message}`),
  warn: (message: string) => console.warn(`[WARN] ${message}`),
};
```

## 🚨 Gestion des Erreurs

### Error Boundaries
```typescript
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Quelque chose s'est mal passé.</h1>;
    }
    
    return this.props.children;
  }
}
```

### Validation des Props
```typescript
// PropTypes ou validation TypeScript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}
```

## 📈 Performance

### Optimisations
- **Lazy Loading**: `React.lazy()` pour les composants
- **Memoization**: `React.memo()` pour éviter les re-renders
- **Code Splitting**: Division du bundle
- **Image Optimization**: Formats modernes (WebP, AVIF)

### Monitoring
```typescript
// Métriques de performance
const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name}: ${end - start}ms`);
};
```

## 🔒 Sécurité

### Bonnes Pratiques
- Validation des inputs utilisateur
- Sanitisation des données
- Protection XSS
- HTTPS en production
- Headers de sécurité

### Validation des Formulaires
```typescript
// Validation avec Zod ou Yup
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

## 🌐 Internationalisation

### Support Multi-langues
```typescript
// Configuration i18n
const i18n = {
  fr: {
    'welcome.title': 'Bienvenue sur Law Just',
  },
  en: {
    'welcome.title': 'Welcome to Law Just',
  },
};
```

## 📚 Documentation

### JSDoc
```typescript
/**
 * Composant de recherche juridique avec IA
 * @param props - Props du composant
 * @returns JSX.Element
 */
const LegalAISearch: React.FC<LegalAISearchProps> = (props) => {
  // Implementation
};
```

### Storybook
```bash
# Lancer Storybook
npm run storybook

# Build Storybook
npm run build-storybook
```

## 🤝 Contribution

### Workflow Git
1. Fork du projet
2. Créer une branche feature
3. Développer la fonctionnalité
4. Tests et validation
5. Pull Request

### Code Review
- Vérification du code
- Tests passants
- Documentation mise à jour
- Performance validée

## 📞 Support

### Ressources
- 📖 Documentation: [docs.lawjust.fr]
- 💬 Discord: [Serveur Law Just]
- 📧 Email: dev@lawjust.fr
- 🐛 Issues: [GitHub Issues]

---

**Happy Coding!** 🚀
