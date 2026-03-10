# IRTS - Application d'Analyse des Candidatures Parcoursup

## 🎯 POC IRTS Parfait

Ce POC est une application web complète pour l'IRTS (Institut Régional du Travail Social) qui automatise l'analyse des dossiers de candidature Parcoursup.

### ✨ Fonctionnalités implémentées

1. **📊 Analyse IA intelligente** - Notation automatique sur 8 points avec détection d'alertes
2. **🎨 Interface moderne** - Design system IRTS avec animations et micro-interactions  
3. **🔍 Dashboard interactif** - Cartes candidats, filtres, visualisations
4. **✅ Validation humaine** - Traçabilité complète avec commentaires
5. **📈 Export Excel** - Génération de rapports consolidés
6. **🎉 Animations** - Confettis, transitions fluides, effets visuels

### 🚀 Démarrage rapide

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour production
npm run build
```

### 🎨 Design System

- **Couleurs IRTS**: Bleu/violet principal (#5B4ED8), orange accent (#E67E22)
- **Typographie**: Inter, hiérarchie claire
- **Animations**: Framer Motion, transitions fluides
- **Micro-interactions**: Hover effects, validations animées

### 📁 Structure

```
src/
├── components/     # Composants React réutilisables
├── hooks/         # Hooks personnalisés
├── lib/           # Utilitaires et configuration
├── pages/         # Pages de l'application
├── services/      # Services d'analyse IA
├── store/         # État global Zustand
├── styles/        # Styles Tailwind CSS
└── types/         # Types TypeScript
```

### 🔧 Technologies

- **React 18** + **TypeScript**
- **Tailwind CSS** + **Framer Motion**
- **Vite** pour le build
- **Zustand** pour l'état global
- **React Query** pour la gestion des données

### 📊 Analyse IA

Le système analyse :
- Moyennes scolaires et évolution
- Lettres de motivation (sémantique)
- Expériences et engagements
- Alertes potentielles
- Éléments valorisants

### 🎯 Notes attribuées (sur 8)

Le système propose une note basée sur :
- **Résultats académiques** (40%)
- **Motivation et projet** (25%)
- **Expériences pertinentes** (20%)
- **Qualités personnelles** (15%)

---

**Status**: ✅ POC COMPLET ET FONCTIONNEL
**Version**: 1.0.0 - "Parfait"