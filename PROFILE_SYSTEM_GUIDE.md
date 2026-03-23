# Système de Profil DeepSkyn - Documentation Complète

## 📋 Vue d'Ensemble

Le système de profil DeepSkyn implémente une page profil complète de style Facebook avec:
- **Hero Section** avec photo de couverture et avatar
- **Navigation par onglets** (Publications, À propos, Photos, Vidéos, Amis)
- **Compositeur de posts** pour créer du contenu
- **Fil d'actualité** avec posts mockés et publicités intégrées
- **Sidebar** avec infos utilisateur, photos récentes et amis

## 🗂️ Structure des Fichiers

```
src/app/pages/
├── profile-page.tsx                    # Page principale du profil
└── components/
    ├── profile-hero.tsx                # Section hero (couverture + avatar)
    ├── profile-tabs.tsx                # Navigation par onglets sticky
    ├── post-composer.tsx               # Compositeur de posts
    ├── post-card.tsx                   # Carte post individuelle
    ├── ad-card.tsx                     # Carte publicité
    ├── profile-sidebar.tsx             # Sidebar gauche (sticky)
    ├── mock-posts.ts                   # Données statiques des posts
    ├── mock-ads.ts                     # Données statiques des publicités
    └── index.ts                        # Exports centralisés
```

## 🎨 Architecture des Composants

### 1. ProfileHero (`profile-hero.tsx`)

**Fonction**: Affiche les infos principales du profil et les contrôles de couverture/avatar.

**Props**:
- `user: UserProfile` - Données utilisateur complètes
- `isOwnProfile: boolean` - Affiche boutons d'édition si c'est le propre profil
- `onEditProfile?: () => void` - Callback pour éditer le profil
- `onCoverPhotoUpload?: (url: string) => Promise<void>` - Upload photo de couverture
- `onAvatarUpload?: (url: string) => Promise<void>` - Upload avatar
- `onFollow?: () => void` - Callback pour suivre
- `isFollowing?: boolean` - État de suivi

**Caractéristiques**:
- 🖼️ Banneau de couverture 3:1 avec upload au hover
- 👤 Avatar circulaire chevauchant la couverture
- 📊 Compteurs: Posts · Abonnés · Abonnements
- 📝 Affiche bio, localisation, site web, date d'inscription
- 📱 Responsive (mobile: stack vertical)

### 2. ProfileTabs (`profile-tabs.tsx`)

**Fonction**: Navigation sticky entre les sections du profil.

**Props**:
- `activeTab: Tab` - Onglet actuellement sélectionné
- `onTabChange: (tab: Tab) => void` - Callback au changement

**Onglets disponibles**:
- `publications` - Fil d'actualité
- `about` - À propos
- `photos` - Galerie photo
- `videos` - Vidéos
- `friends` - Liste amis

**Caractéristiques**:
- 📌 Position sticky en haut
- ✨ Barres d'animation sous les onglets actifs
- 🎯 Smooth scroll responsif

### 3. PostComposer (`post-composer.tsx`)

**Fonction**: Interface de création de posts.

**Props**:
- `userAvatar?: string` - Avatar de l'utilisateur
- `userName?: string` - Nom de l'utilisateur
- `onSubmit?: (content, media?) => void` - Callback publication
- `isLoading?: boolean` - État de chargement

**Caractéristiques**:
- 📝 Champ texte expansible
- 🖼️ Boutons d'action: Photo · Feeling · Localisation
- 🎬 Préview de média avant envoi
- ❌ Bouton supprimer média
- 🚀 Publier (disabled si vide)

### 4. PostCard (`post-card.tsx`)

**Fonction**: Affiche un post individuel dans le feed.

**Props**:
- `post: PostCardData` - Données du post
- `onLike?: (postId) => void` - Callback like
- `onComment?: (postId) => void` - Callback comment
- `onShare?: (postId) => void` - Callback share
- `onDelete?: (postId) => void` - Callback delete

**Caractéristiques**:
- ❤️ Like animé avec bounce
- 💬 Compteur commentaires cliquable
- ↗️ Partage avec toast de confirmation
- 🗑️ Menu suppression pour propriétaire
- 📅 Temps relatif (il y a Xm/h/j)
- 🖼️ Préview média responsive

### 5. AdCard (`ad-card.tsx`)

**Fonction**: Affiche une publicité dans le feed.

**Props**:
- `ad: AdData` - Données publicité
- `onClose?: () => void` - Callback fermeture
- `onView?: (adId) => void` - Callback vue

**Caractéristiques**:
- 🏷️ Badge "SPONSORISÉ" discret
- 🖼️ Image avec hover scale
- 📌 CTA "En savoir plus →"
- ✕ Bouton fermeture
- 🎯 Lien cliquable

### 6. ProfileSidebar (`profile-sidebar.tsx`)

**Fonction**: Sidebar sticky avec infos supplémentaires.

**Contient**:
- 📋 Card "À propos" (bio, localisation, site, date)
- 🖼️ Grille photos 3x3 (9 max)
- 👥 Avatars amis en grille 3x3 (9 max)

**Caractéristiques**:
- 📌 Position sticky
- 🎬 Animations fade-in progressives
- 🔗 Liens cliquables
- 👤 Affichage initiale utilisateur si pas d'avatar

## 🔄 Flux de Données

### Architecture Props-Down

```
ProfilePage
├── ProfileHero
│   ├── onCoverPhotoUpload → setState coverPhoto
│   └── onAvatarUpload → setState avatar
├── ProfileTabs
│   └── onTabChange → setState activeTab
├── PostComposer
│   └── onSubmit → setState posts
├── PostCard[]
│   ├── onLike → setState isLiked
│   ├── onComment → toast de notification
│   └── onDelete → setState posts - item
└── AdCard[]
    └── (Statique - pas d'interactions)
```

### State Management (Locale)

- **Utilisateur**: `userProfile` - État courant de l'utilisateur
- **Posts**: `posts` - Liste des posts (mock)
- **Feed**: `feedWithAds` - Posts + Ads interleaved
- **UI**: `activeTab`, `isLoading` - État UI

## 📊 Données Mockées

### PostCardData Interface

```typescript
interface PostCardData {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;         // Texte du post
  media?: string;          // URL image/vidéo
  createdAt: string;       // ISO timestamp
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;       // État local
  isByCurrentUser?: boolean;
}
```

### AdData Interface

```typescript
interface AdData {
  id: string;
  title: string;
  description: string;
  image: string;           // URL image
  link: string;            // URL redirection
  sponsor: string;         // Marque
}
```

### Interleaving Ads

La fonction `interleaveFeedWithAds()` intègre les publicités tous les 4-5 posts:

```typescript
// Avant
[post1, post2, post3, post4, post5, post6...]

// Après
[post1, post2, post3, post4, AD1, post5, post6, AD2...]
```

## 🎯 Responsiveness

### Desktop (1024px+)
- 2 colonnes: Feed principal (2/3) + Sidebar (1/3)
- Header sticky en haut
- Tabs sticky sous hero

### Tablet (768-1023px)
- 1 colonne
- Sidebar collapsée
- Tout stack vertical

### Mobile (<768px)
- 1 colonne full width
- Composer simplifié
- Pas de sidebar affichée
- Hero responsive

## 🔌 Intégration Backend

### Endpoints Utilisés

```
PATCH  /auth/profile/cover     ← Upload photo couverture
PATCH  /auth/profile/avatar    ← Upload avatar
GET    /auth/profile           ← Récupérer profil utilisateur
PATCH  /auth/profile           ← Mettre à jour profil
```

### Champs Utilisateur (Schema Prisma)

Nouvellement ajoutés:
```prisma
coverPhoto  String?    // URL photo couverture
```

Champs existants utilisés:
```prisma
avatar, name, email, gender, address,
city, zipCode, country, latitude, longitude,
dateOfBirth, createdAt, updatedAt
```

## 🚀 Fonctionnalités Implémentées

### ✅ Complètement Fonctionnel

- 📷 Upload photo couverture avec validation (5MB max)
- 👤 Upload avatar avec validation
- 💬 Création posts avec texte et média
- ❤️ Like avec animation (state local)
- 🗑️ Suppression posts par propriétaire
- 📊 Compteurs dynamiques (posts, followers)
- 🎨 Animations fluides (Framer Motion)
- 📱 Design responsive
- 🎯 Publicités statiques intégrées

### 📝 State Management

- **Uniquement local** (React hooks)
- Pas d'appels API pour posts/ads
- Données persistées dans l'état du composant
- Réinitialisation au refresh

## 🛠️ Configuration Requise

### Dépendances

```json
{
  "motion": "^latest",          // Animations
  "react-hot-toast": "^latest", // Notifications
  "lucide-react": "^latest"     // Icônes
}
```

### CSS Tailwind

Tous les styles utilisent Tailwind avec thème custom DeepSkyn:
- Couleurs principales: `#0EA5E9`, `#F9A8D4`
- Nuances de gris: DeepSkyn color palette

## 📖 Utilisation

### Import du Composant Principal

```tsx
import { ProfilePage } from '@/app/pages';

// Dans votre application
<ProfilePage onBack={() => navigate('/home')} />
```

### Utilisation Composants Individuels

```tsx
import {
  ProfileHero,
  ProfileTabs,
  PostComposer,
  PostCard,
  ProfileSidebar,
} from '@/app/pages/components';

// Utilisez-les indépendamment...
```

## 🔮 Extensions Futures

- [ ] Pagination posts (infinite scroll)
- [ ] Commentaires bidirectionnels
- [ ] @mentions et hashtags
- [ ] Système de suivi réel
- [ ] Notifications temps réel
- [ ] Édition posts
- [ ] Stories utilisateur
- [ ] Recherche utilisateurs
- [ ] Suggéstions d\'amis
- [ ] Chat direct

## 📌 Notes Importantes

1. **Posts et Ads sont 100% statiques** - aucun appel API backend
2. **State local uniquement** - réinitialisation au refresh
3. **Upload photos**: vraiment envoyé au backend (PATCH endpoints)
4. **Responsive mobile-first**: design adaptatif complet
5. **Accessibilité**: labels, alt text, focus states
6. **Performance**: lazy loading images, Framer Motion optimisée

## 🐛 Dépannage

### Les photos ne s'affichent pas
→ Vérifier répertoire `public/images/` ou URLs CDN

### State ne persiste pas
→ Normal! État local intentionnel. Pour la persistance, ajouter backend integration

### Animations saccadées
→ Réduire nombre posts dans feed, vérifier GPU acceleration

### Responsive cassé
→ Vérifier breakpoints Tailwind: `lg:`, `md:`, `sm:`
