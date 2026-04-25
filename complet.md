# Documentation Complète du Projet - Law Just

## 📝 Présentation Générale
**Law Just** est une plateforme juridique moderne conçue pour simplifier l'accès au droit français. Elle intègre des outils d'intelligence artificielle pour la recherche, un générateur de documents juridiques, et des espaces dédiés pour les citoyens et les professionnels du droit (avocats).

## 🚀 Stack Technique
- **Frontend Framework**: React 19
- **Build Tool**: Vite 7
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (utilisation native de `@tailwindcss/vite`)
- **Icons**: Lucide React
- **Routing**: React Router DOM v6
- **UI Components**: Headless UI + Composants personnalisés

## 📂 Structure du Projet
```text
law_just/
├── src/
│   ├── components/
│   │   ├── features/      # Intelligence métier (Recherche IA, Database)
│   │   ├── forms/         # Formulaires d'inscription (User, Lawyer)
│   │   ├── layout/        # Header, Footer
│   │   └── ui/            # Composants atomiques (Button, Card, Modal, etc.)
│   ├── hooks/             # Hooks personnalisés (useToast)
│   ├── lib/               # API helpers et utilitaires
│   ├── pages/             # Pages de l'application (14 pages au total)
│   ├── styles/            # Design system et styles globaux
│   ├── App.tsx            # Configuration du Dashboard et des Routes
│   └── main.tsx           # Point d'entrée
├── public/                # Assets statiques
├── tailwind.config.ts     # Configuration Tailwind (thème juridique)
└── package.json           # Dépendances et scripts
```

## 🗺️ Navigation et Routes
La plateforme gère les accès basés sur les rôles (`user`, `lawyer`, `admin`).

### Pages Publiques
- `/` : Accueil
- `/search` : Recherche Juridique
- `/lawyers` : Annuaire des avocats
- `/services` : Services proposés
- `/about` : À propos
- `/contact` : Contact
- `/guide` : Guide pratique
- `/faq` : FAQ
- `/login` : Connexion

### Pages Protégées / Fonctionnelles
- `/generator` : Générateur de documents (Plaintes, recours)
- `/assistant` : Assistant juridique IA
- `/dashboard/user` : Espace citoyen (Historique, documents)
- `/dashboard/lawyer` : Espace professionnel (Gestion des clients)
- `/dashboard/admin` : Administration du système

## ✨ Fonctionnalités Clés

### 1. Recherche Juridique IA (`LegalAISearch`)
Permet de poser des questions en langage naturel. L'IA analyse la demande et propose :
- Une explication simplifiée du concept juridique.
- Les articles de loi correspondants (ex: Art 1382 Code Civil).
- La jurisprudence pertinente.
- Des recommandations d'actions.

### 2. Base de Données Juridique (`LegalDatabase`)
Accès structuré à la loi française :
- Recherche par filtre (Civil, Pénal, Travail, Commerce).
- Consultation des Codes complets.
- Sauvegarde (Bookmark) et partage des textes.

### 3. Générateur de Documents
Interface multi-étapes pour créer des documents officiels :
- Pré-plaintes.
- Courriers de mise en demeure.
- Recours administratifs.
- Exportation en PDF (prévu).

### 4. Dashboards Spécialisés
- **User**: Suivi des démarches et documents générés.
- **Lawyer**: Profil public, mise en relation avec des prospects, outils de gestion.
- **Admin**: Gestion des utilisateurs, modération des contenus juridiques.

## 🎨 Design System
Le design utilise une esthétique "Premium & Trustworthy" :
- **Primary**: Bleu Juridique (#1E40AF)
- **Success**: Vert Emeraude pour les validations
- **Surface**: Verre/Givré (Glassmorphism) pour certains composants UI
- **Typographie**: Inter (via Google Fonts) pour une lisibilité maximale

## 🛠️ Scripts de Développement
- `npm run dev` : Lance le serveur de développement à `http://localhost:5173`.
- `npm run build` : Compilation TypeScript et build Vite pour la production.
- `npm run preview` : Test local du build de production.
- `npm run lint` : Analyse statique du code.

## 🔒 Sécurité et Accessibilité
- Protection contre les injections (Sanitisation).
- Navigation clavier optimisée.
- Contraste de couleurs conforme aux standards d'accessibilité.
- Gestion sécurisée des rôles via LocalStorage et Guards.

---
*Documentation générée par Antigravity - Mars 2024*
