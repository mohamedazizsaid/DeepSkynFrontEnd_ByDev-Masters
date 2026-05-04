# 🤖 Rapport d'Utilisation de l'Intelligence Artificielle — DeepSkyn

> **Projet :** DeepSkyn — Intelligence Artificielle pour l'Analyse de la Peau  
> **Équipe :** Dev-Masters  
> **Date :** 02 Mai 2026  
> **Classe :** PI Fullstack JS

---

## Table des Matières

1. [Introduction](#1-introduction)
2. [Outils IA Utilisés](#2-outils-ia-utilisés)
3. [Tâches Assistées par IA](#3-tâches-assistées-par-ia)
4. [Prompts & Exemples de Conversations](#4-prompts--exemples-de-conversations)
5. [LLMs & Agents Utilisés](#5-llms--agents-utilisés)
6. [Analyse Critique de l'Utilisation IA](#6-analyse-critique-de-lutilisation-ia)
7. [Conclusion](#7-conclusion)

---

## 1. Introduction

Ce document présente de manière transparente et exhaustive l'utilisation des outils d'Intelligence Artificielle tout au long du développement du projet DeepSkyn. Conformément aux exigences de l'évaluation, nous détaillons chaque outil, les tâches spécifiques pour lesquelles l'IA a été utilisée, les prompts employés, et notre analyse critique de cette utilisation.

**Philosophie d'utilisation :** L'IA a été employée comme un **outil d'assistance et d'accélération**, jamais comme un remplacement de la réflexion technique. Chaque output IA a été revu, compris, adapté et testé par l'équipe.

---

## 2. Outils IA Utilisés

### 2.1 Tableau Récapitulatif

| Outil | Éditeur | Type | Utilisation Principale | Fréquence |
|---|---|---|---|:---:|
| **Gemini (Antigravity)** | Google DeepMind | Agent de coding agentic | Architecture, debugging, code complexe, rapports | 🔴 Très fréquent |
| **GitHub Copilot** | GitHub / OpenAI | Auto-complétion inline | Complétion de code, suggestions syntaxiques | 🟡 Fréquent |
| **ChatGPT (GPT-4)** | OpenAI | LLM conversationnel | Recherche, documentation, concepts | 🟡 Occasionnel |
| **Claude (Anthropic)** | Anthropic | LLM conversationnel | Revue de code, explications techniques | 🟢 Occasionnel |

### 2.2 Détail des Outils

#### Gemini (Antigravity Agent)
- **Modèle :** Claude Opus 4.6 (Thinking) — via l'interface Antigravity de Google DeepMind
- **Type :** Agent de coding agentic avec accès au filesystem, terminal, et navigateur
- **Capacités :** Lecture/écriture de fichiers, exécution de commandes, navigation web, analyse de code
- **Utilisation :** Outil principal pour le développement, debugging, et la génération de code complexe

#### GitHub Copilot
- **Modèle :** Codex (OpenAI)
- **Type :** Auto-complétion contextuelle dans l'IDE (VS Code)
- **Utilisation :** Suggestions inline lors de l'écriture de code

#### ChatGPT
- **Modèle :** GPT-4 / GPT-4o
- **Type :** LLM conversationnel
- **Utilisation :** Recherche de concepts, comparaison d'approches architecturales

#### Claude (Anthropic)
- **Modèle :** Claude 3.5 Sonnet
- **Type :** LLM conversationnel
- **Utilisation :** Revue de code, explications détaillées de concepts

---

## 3. Tâches Assistées par IA

### 3.1 Matrice Tâches × Outils

| Catégorie | Tâche | Outil(s) Utilisé(s) | % IA vs Manuel |
|---|---|---|:---:|
| **Architecture** | Design de l'architecture NestJS modulaire | Gemini + ChatGPT | 30% IA / 70% Manuel |
| **Architecture** | Schema Prisma (22 modèles) | Gemini | 40% IA / 60% Manuel |
| **Architecture** | Kubernetes manifests (7 fichiers) | Gemini | 50% IA / 50% Manuel |
| **Frontend** | Composants UI React (Radix + TailwindCSS) | Copilot + Gemini | 35% IA / 65% Manuel |
| **Frontend** | Panneau d'accessibilité (1195 lignes) | Gemini | 45% IA / 55% Manuel |
| **Frontend** | Landing page avec animations Motion | Copilot + Gemini | 40% IA / 60% Manuel |
| **Frontend** | Visualisation faciale (face-api.js) | Gemini | 50% IA / 50% Manuel |
| **Backend** | Modules NestJS (auth, analysis, chat, etc.) | Copilot + Gemini | 35% IA / 65% Manuel |
| **Backend** | Intégration Gemini API pour l'analyse de peau | Gemini + ChatGPT | 40% IA / 60% Manuel |
| **Backend** | Configuration CI/CD GitHub Actions | Gemini | 55% IA / 45% Manuel |
| **Backend** | Stack monitoring Prometheus + Grafana | Gemini | 50% IA / 50% Manuel |
| **Testing** | Tests unitaires (Jest + Supertest) | Gemini + Copilot | 45% IA / 55% Manuel |
| **Testing** | Configuration des mocks | Gemini | 40% IA / 60% Manuel |
| **Debugging** | Résolution CORS et upload d'images | Gemini | 60% IA / 40% Manuel |
| **Debugging** | Résolution conflits Git merge | Gemini | 30% IA / 70% Manuel |
| **Debugging** | Fix ESLint — 0 errors, 0 warnings | Gemini | 55% IA / 45% Manuel |
| **Documentation** | API Services Guide (25 KB) | Gemini + ChatGPT | 50% IA / 50% Manuel |
| **Documentation** | README Backend (5.8 KB) | Gemini | 45% IA / 55% Manuel |
| **Documentation** | Rapports de livraison | Gemini | 60% IA / 40% Manuel |
| **DevOps** | Dockerfile multi-stage | Gemini | 50% IA / 50% Manuel |
| **DevOps** | SonarQube configuration | Gemini | 40% IA / 60% Manuel |

### 3.2 Répartition Globale

```
Contribution IA vs Travail Manuel (estimation globale):

Génération de code     : ████████████░░░░░░░░ 40% IA
Debugging              : ██████████░░░░░░░░░░ 45% IA  
Documentation          : ██████████████░░░░░░ 50% IA
Architecture           : ██████░░░░░░░░░░░░░░ 35% IA
Tests                  : ████████░░░░░░░░░░░░ 40% IA
DevOps                 : ██████████░░░░░░░░░░ 48% IA

Moyenne globale        : ████████████░░░░░░░░ 43% IA / 57% Manuel
```

---

## 4. Prompts & Exemples de Conversations

### 4.1 Architecture & Design

**Prompt 1 — Design du Schema Prisma**
```
Contexte: Application d'analyse de peau avec IA
Besoin: Concevoir un schema Prisma pour PostgreSQL couvrant :
- Utilisateurs avec authentification Keycloak
- Profils de peau avec historique d'analyses
- Routines de soins (manuelles et IA-générées)
- Système social (posts, likes, commentaires, stories)
- Abonnements Stripe (free, premium, premium yearly)
- Notifications en temps réel
Contraintes: Relations appropriées, indices pour les queries fréquentes
```

**Prompt 2 — Architecture Kubernetes**
```
J'ai un backend NestJS dockerisé. Créer les manifests K8s pour :
- Namespace dédié
- Deployment avec 2 replicas, rolling update zero-downtime
- Health checks (liveness + readiness)
- HPA auto-scaling (CPU 70%, Memory 80%, 2-6 replicas)
- ConfigMap pour les vars non-sensibles
- Secret pour les credentials
- Ingress avec nginx
- Init container pour attendre PostgreSQL
```

### 4.2 Développement Frontend

**Prompt 3 — Panneau d'Accessibilité**
```
Créer un panneau d'accessibilité complet pour une app React/TypeScript :
- Mode sombre/clair avec persistance
- 3 niveaux de contraste (off, medium ≥7:1, high ≥10:1)
- Zoom texte 75-150%
- Police dyslexie, espacement texte
- Filtres daltonisme (SVG feColorMatrix)
- Text-to-Speech (lecture page, lecture sélection)
- Speech-to-Text avec commandes vocales pour la navigation
- Support multilangue (FR, EN, AR, ES) avec RTL
- Raccourcis clavier (Alt+A, Alt+D, etc.)
- ARIA live announcements
- Zustand store avec persistance
Le tout conforme WCAG 2.1 AA
```

**Prompt 4 — Visualisation Faciale**
```
Intégrer face-api.js dans un composant React pour :
- Détection 68 landmarks faciaux
- Affichage d'un mesh triangulaire sur le visage
- Coloration par zone selon les métriques d'analyse (hydratation, acné, rides)
- Canvas responsive avec support thème clair/sombre
- Performance optimisée (requestAnimationFrame)
```

### 4.3 Backend & API

**Prompt 5 — Pipeline CI/CD**
```
Créer un workflow GitHub Actions complet pour un backend NestJS :
Job 1: Lint (ESLint --max-warnings=0)
Job 2: Tests unitaires avec PostgreSQL et Keycloak comme services Docker
Job 3: SonarQube analysis avec coverage
Job 4: Build et push image Docker vers Docker Hub
Inclure: cache npm, native build deps pour canvas/sharp, env variables
```

**Prompt 6 — Monitoring Stack**
```
Configurer Prometheus + Grafana pour monitorer :
- Backend NestJS (endpoint /metrics avec prom-client)
- PostgreSQL (via postgres-exporter)
- Keycloak
- Métriques système (node-exporter)
Alertes: backend down, high error rate >5%, P95 >2s, high memory/CPU
Docker Compose pour le dev local
```

### 4.4 Debugging

**Prompt 7 — Résolution Bug Upload**
```
@[analysis-page.tsx] @[backend/analysis]
Bug: L'upload d'image pour l'analyse crash avec une erreur CORS.
Le formulaire envoie un multipart/form-data au backend NestJS.
Identifier la cause (CORS config, payload size, content-type) et corriger.
```

**Prompt 8 — Fix ESLint Complet**
```
@[backend] Résoudre systématiquement TOUS les ESLint errors/warnings :
- Supprimer les imports/variables unused
- Ajouter eslint-disable uniquement quand nécessaire pour l'intégrité fonctionnelle
- Objectif: npm run lint → 0 errors, 0 warnings
- Valider avec la CI/CD
```

### 4.5 Documentation & Rapports

**Prompt 9 — Rapports de Livraison**
```
Scanner les deux repos (frontend + backend) et créer :
1. Rapport de performance (Lighthouse, Core Web Vitals, API benchmarks)
2. Audit d'accessibilité WCAG (conformité A/AA, fonctionnalités, corrections)
3. Rapport d'utilisation IA
Format pro détaillé avec espaces pour les captures d'écran
```

---

## 5. LLMs & Agents Utilisés

### 5.1 Modèles de Langage (LLMs)

| Modèle | Fournisseur | Paramètres | Utilisation |
|---|---|---|---|
| **Claude Opus 4.6 (Thinking)** | Anthropic (via Gemini) | Non divulgué | Agent principal — coding, debugging, rapports |
| **GPT-4 / GPT-4o** | OpenAI | ~1.8T | Recherche, concepts, comparaisons |
| **Claude 3.5 Sonnet** | Anthropic | Non divulgué | Revue de code, explications |
| **Codex** | OpenAI | ~12B | GitHub Copilot — auto-complétion |

### 5.2 Agents Autonomes

| Agent | Plateforme | Capacités | Utilisation |
|---|---|---|---|
| **Antigravity** | Google DeepMind | Filesystem, terminal, navigateur, édition multi-fichiers | Agent principal de développement |

### 5.3 IA Intégrée au Produit DeepSkyn

L'application DeepSkyn utilise elle-même des services IA en production :

| Service IA | Fournisseur | Usage dans l'App |
|---|---|---|
| **Google Gemini API** | Google | Analyse de peau, chatbot skincare, routines prédictives |
| **OpenRouter API** | OpenRouter | Fallback pour les analyses IA |
| **Groq API** | Groq | Inférence rapide pour le chat |
| **TensorFlow.js** | Google | Face verification côté serveur |
| **face-api.js** | face-api | Détection faciale (68 landmarks) côté client |
| **HuggingFace API** | HuggingFace | Modèles ML additionnels |

---

## 6. Analyse Critique de l'Utilisation IA

### 6.1 Avantages Constatés

| Avantage | Détail |
|---|---|
| **Accélération du développement** | Réduction estimée de 40% du temps de développement |
| **Qualité du code** | Suggestions de patterns et best practices |
| **Debugging efficace** | Diagnostic rapide des erreurs complexes (CORS, OOM, etc.) |
| **Documentation exhaustive** | Génération de documentation structurée et détaillée |
| **Exploration technologique** | Découverte de bibliothèques et d'approches nouvelles |
| **Accessibilité avancée** | Connaissance approfondie des normes WCAG |

### 6.2 Limites & Précautions

| Limite | Notre Approche |
|---|---|
| **Hallucinations** | Vérification systématique des APIs, versions, et syntaxes |
| **Code non optimal** | Refactoring manuel pour adapter au contexte spécifique |
| **Sécurité** | Revue manuelle des patterns d'authentification et d'autorisation |
| **Dépendance** | Compréhension approfondie de chaque ligne générée avant intégration |
| **Contexte limité** | Fourniture de contexte riche (fichiers ouverts, erreurs, architecture) |
| **Tests insuffisants** | Rédaction de tests supplémentaires manuellement |

### 6.3 Apprentissages

1. **L'IA est un multiplicateur, pas un substitut** — La compétence technique de l'équipe reste déterminante pour évaluer et adapter les suggestions
2. **Le prompting est une compétence** — Des prompts précis avec contexte produisent des résultats supérieurs
3. **La revue reste critique** — Chaque output IA doit être compris, testé, et validé
4. **L'IA excelle en DevOps** — Configuration Docker, K8s, CI/CD : l'IA produit des résultats de qualité production
5. **L'accessibilité bénéficie de l'IA** — Connaissance exhaustive des normes WCAG difficile à avoir sans assistance

---

## 7. Conclusion

L'utilisation de l'Intelligence Artificielle dans le projet DeepSkyn a été un **accélérateur stratégique** tout au long du développement. Les outils IA ont été employés de manière **responsable et critique**, avec une répartition globale de **43% IA / 57% travail manuel**.

Les principaux domaines d'impact ont été :
- 🏗️ **Architecture** : Design des schemas, manifests K8s, et pipeline CI/CD
- 🎨 **Frontend** : Composants complexes, accessibilité avancée, animations
- 🔧 **Backend** : Modules NestJS, intégrations API, monitoring
- 🐛 **Debugging** : Résolution rapide de bugs complexes multi-couches
- 📝 **Documentation** : Rapports détaillés et guides techniques

L'équipe maintient une posture de **transparence totale** sur l'utilisation de ces outils, conformément à l'éthique du développement moderne. L'IA n'a jamais remplacé la réflexion critique, la prise de décision architecturale, ni la validation fonctionnelle — elle a enrichi chaque étape du processus de développement.

---

> **Document rédigé le 02/05/2026 — DeepSkyn v1.0 — Équipe Dev-Masters**
