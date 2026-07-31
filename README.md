# FranceJustice / Law Just — Plateforme Juridique Nationale 🇫🇷

Une plateforme juridique numérique de pointe interconnectant Citoyens, Avocats au Barreau, Étudiants en Droit, Professeurs de Droit, Doctorants/Chercheurs et Administrateurs dans un écosystème 100% synchronisé en temps réel.

---

## 📱 100% Responsive Design (Tous Écrans)

L'application a été méticuleusement conçue et testée pour offrir une expérience utilisateur optimale et réactive sur **100% des tailles d'écrans** :

- 📱 **Smartphones (320px – 640px)** : Navigation via menu burger coulissant, cartes adaptatives, formulaires multi-étapes tactiles, visioconférences optimisées mobile.
- 📱 **Tablettes (641px – 1024px)** : Grilles intelligentes 2 colonnes, tableaux de bord avec barres latérales rétractables.
- 💻 **Laptops & Desktops (1025px – 1920px)** : Affichage complet multi-panneaux, visualisations de données interactives.
- 🖥️ **Moniteurs Ultra-Wide & 4K (1921px+)** : Largeur maximale contrainte (`max-w-7xl`) avec centrage automatique pour préserver la lisibilité.

---

## 👥 Comptes & Accès de Démonstration

Chaque rôle dispose de son formulaire d'inscription dédié synchronisé avec **Supabase Auth & Database**, ainsi que d'accès par défaut prêts à l'emploi :

| Rôle | Identifiant / Email | Mot de passe | Espace dédié |
| :--- | :--- | :--- | :--- |
| 🛡️ **Administrateur** | `justlaw@gmail.com` | `Just1@` | Dashboard Admin & Supervision Globale |
| 👤 **Citoyen / Particulier** | `just@gmail.com` | `Just1@` | Espace Citoyen & Assistant IA |
| 🎓 **Étudiant en Droit** | `etudjust@gmail.com` | `Etudjust1@` | Salles de Classe, Masterclasses & Revues |
| 👨‍🏫 **Professeur de Droit** | `profjust@gmail.com` | `Profjust1@` | Animation Visioconférences & Cours Live |
| 🔬 **Doctorant / Chercheur** | `doctjust@gmail.com` | `Doctjust1@` | Publications Scientifiques & Thèses |
| ⚖️ **Avocat au Barreau** | `lawyer@francejustice.fr` | `Lawyer123@` | Espace Cabinet, Devis & Visio Client |

---

## 🚀 Fonctionnalités Clés de la Plateforme

### 📹 1. Visioconférences HD & Salles de Classe Virtuelles
- **Consultations & Masterclasses Live** : Séances vidéo HD privées ou collectives de plus de 2 heures pouvant accueillir plus de 100 participants en simultané (propulsé par Jitsi / WebRTC).
- **Chiffrement de Bout en Bout** : Protection conforme au Secret Professionnel de l'Avocat (Article 66-5 de la loi du 31 décembre 1971).
- **Résumés automatiques** : Compte-rendu de séance généré automatiquement à la fin de chaque visioconférence.

### 🤖 2. Assistant Juridique Intelligent GÉNIA-L (IA 2026)
- **Analyse d'Actes & Jurisprudence** : Analyse instantanée des pièces juridiques et réponses aux questions de droit 24/7.
- **Assistant Vocal & Textuel** : Synthèse de la doctrine française et européenne en langage naturel.
- **Sécurité des Requêtes** : Prompts encapsulés pour prévenir toute fuite de données privées.

### 📅 3. Planning Annuel National Interactif
- **Programmation d'Événements** : Publication et inscription en temps réel aux cours, webinaires, colloques et conférences d'avocats et professeurs.
- **Filtres par Discipline & Région** : Recherche ciblée par thématique juridique et localisation géographique.

### 📚 4. Centre de Revues Scientifiques & Publications
- **Publications Académiques** : Espace dédié aux articles de recherche des professeurs, doctorants et avocats.
- **Exportation PDF** : Génération automatique de documents officiels au format PDF avec mise en page institutionnelle.

### 🗞️ 5. Veille Juridique Automatique en Temps Réel
- **Agrégation Législative** : Flux d'actualités juridiques et décrets mis à jour automatiquement via Google Legal Research & JORF.
- **Filtres Thématiques** : Tri par pays (France, Europe), catégorie (Droit du Travail, Immobilier, Pénal, des Affaires) et type de média.

### 📝 6. Générateur d'Actes & Devis Avocats (Paiements Stripe)
- **Générateur d'Actes** : Création assistée de plaintes, pré-plaintes, courriers et recours gracieux.
- **Devis & Honoraires** : Émission de devis transparents et paiement sécurisé via Stripe (PCI-DSS Niveau 1).

---

## 🛠️ Stack Technique

- **Frontend** : React 18 + Vite 7 + TypeScript Strict
- **Styling & Design System** : Vanilla CSS + Tailwind CSS v4 + Design HSL Juridique & Animations Framer Motion
- **Icônes** : Lucide React
- **Backend & Database** : Supabase (Auth, PostgreSQL, Row Level Security, Storage Buckets, Realtime Subscriptions)
- **Visioconférence** : Jitsi Meet SDK / WebRTC
- **Paiements** : Stripe Checkout / Payment Elements (PCI-DSS Level 1)
- **Intelligence Artificielle** : Google Gemini API (GÉNIA-L 2026)

---

## 📦 Installation & Démarrage Local

```bash
# 1. Cloner le dépôt Git
git clone https://github.com/cons-cloud/francejustice.git
cd francejustice

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm run dev

# 4. Ouvrir dans le navigateur
# http://localhost:5173
```

---

## 🏗️ Vérification de Build de Production

```bash
# Nettoyage et vérification TypeScript + Bundling Vite
npm run build
```
*Le projet est validé avec 0 erreur TypeScript et un bundling de production complet dans `/dist`.*

---

## 🔒 Sécurité & Conformité

- **Row Level Security (RLS)** activé sur toutes les tables Supabase (`profiles_just`, `quotes_just`, `documents_just`, etc.).
- **Chiffrement TLS 1.3 & AES-256** des données sensibles en transit et au repos.
- **Respect du RGPD / CNIL** et du **Secret Professionnel de l'Avocat**.

---

**FranceJustice** — *La Justice Numérique de Demain, Accessible à Tous les Citoyens, Étudiants et Avocats.* 🇫🇷