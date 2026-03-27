"""
Documentation du composant React SignLanguageVideo
"""

# SignLanguageVideo - Composant de visualisation LSF

## 📋 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `postId` | `string` | **required** | ID du post vidéo pour lequel récupérer la traduction |
| `autoPlay` | `boolean` | `false` | Démarrer la lecture automatiquement au mount |
| `className` | `string` | `''` | Classes Tailwind CSS supplémentaires |

## 💡 Exemples d'utilisation

### Exemple basique

```tsx
import SignLanguageVideo from '@/components/sign-language-video';

export function VideoPost() {
  return (
    <section className="max-w-4xl mx-auto">
      <h1>Ma vidéo</h1>
      <SignLanguageVideo postId="post-123" />
    </section>
  );
}
```

### Avec autoPlay

```tsx
<SignLanguageVideo 
  postId="post-456"
  autoPlay={true}
  className="rounded-lg shadow-lg"
/>
```

### Dans une page de détail post

```tsx
import { useParams } from 'react-router-dom';
import SignLanguageVideo from '@/components/sign-language-video';

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();

  if (!postId) {
    return <div>Post non trouvé</div>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Contenu original */}
      <div>
        <h1>Post Original</h1>
        {/* ... contenu du post ... */}
      </div>

      {/* Traduction LSF */}
      <div>
        <h2>Traduction en Langue des Signes</h2>
        <SignLanguageVideo 
          postId={postId}
          autoPlay={false}
          className="rounded-xl border-2 border-blue-200"
        />
      </div>
    </div>
  );
}
```

### Avec gestion d'erreur personnalisée

```tsx
import { useState } from 'react';
import SignLanguageVideo from '@/components/sign-language-video';

export function VideoWithErrorHandler() {
  const [error, setError] = useState<string | null>(null);
  const postId = 'post-789';

  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4">
          <p className="font-bold">Erreur de traduction</p>
          <p className="text-sm">{error}</p>
          <button
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      )}

      <SignLanguageVideo 
        postId={postId}
        className="max-w-2xl"
      />
    </div>
  );
}
```

## 🎨 Customisation du canvas (Tailwind)

```tsx
// Pour modifier la taille
<SignLanguageVideo 
  postId={postId}
  className="max-w-sm"    // Petit
/>

<SignLanguageVideo 
  postId={postId}
  className="max-w-4xl"   // Grand
/>

// Avec border et shadow
<SignLanguageVideo 
  postId={postId}
  className="border-4 border-blue-500 rounded-2xl shadow-2xl"
/>

// Responsive
<SignLanguageVideo 
  postId={postId}
  className="w-full md:max-w-3xl lg:max-w-5xl"
/>
```

## 🔄 États du composant

Le composant gère 3 états:

### 1. Loading
```
──────────────────
│    ⏳ Loading  │
└──────────────────
```

### 2. Error
```
──────────────────────────
│  ⚠️ Erreur de charge
│  [Retry button]
└──────────────────────────
```

### 3. Loaded (avec controls)
```
──────────────────────────
│    [Canvas Video]
│  [▶ Play] [↻ Restart]
│  [═════ Slider ═════]
│  [Frame X of Y]
│  [Gloss text]
│
└──────────────────────────
```

## 📊 Structure des données

Le composant récupère les données du backend:

```json
{
  "id": "uuid",
  "postId": "post-123",
  "transcript": "Bonjour, comment allez-vous?",
  "language": "fr",
  "frames": [
    {
      "hand_right_keypoints": [
        { "id": "rwrist", "x": 200, "y": 150, "z": 0 },
        { "id": "rthumb", "x": 210, "y": 140, "z": 5 }
      ],
      "hand_left_keypoints": [
        { "id": "lwrist", "x": 100, "y": 150, "z": 0 },
        { "id": "lthumb", "x": 90, "y": 140, "z": 5 }
      ],
      "pose_keypoints": [
        { "id": "nose", "x": 150, "y": 100, "z": 0 },
        { "id": "neck", "x": 150, "y": 130, "z": 0 }
      ]
    },
    // ... 11 autres frames
  ],
  "metadata": {
    "gloss": "HELLO-HOW-ARE-YOU",
    "fps": 24,
    "total_frames": 12
  }
}
```

## ⚙️ Configuration du .env

```
# Frontend (.env.local ou .env)
REACT_APP_API_URL=http://localhost:3001
```

## 🔧 Rendu du Canvas

Le composant dessine:

### Keypoints (points)
- 🔴 **Main droite**: En rouge (#FF6B6B)
- 🔴 **Main gauche**: En rouge (#FF6B6B)
- 🟢 **Pose (corps)**: En vert (#4ECDC4)

### Connexions (lignes)
- 💜 **Entre keypoints**: En pourpre (#95E1D3)
- Affichées avec transparence

### Texte
- ⚪ **Gloss**: Centré en bas du canvas (blanc)

## 📱 Responsive Design

Le composant utilise les classes Tailwind pour être responsive:

```tsx
// Largeur complète sur mobile, max-width sur desktop
<SignLanguageVideo 
  postId={postId}
  className="w-full max-w-4xl mx-auto"
/>
```

## 🎬 Contrôles utilisateur

### Boutons

| Bouton | Fonction |
|--------|----------|
| ▶ Play / ⏸ Pause | Lancer/Arrêter la lecture |
| ↻ Restart | Retourner au début |

### Slider

- Permet de naviguer frame par frame
- Affiche le numéro de la frame actuelle

## 🐛 Dépannage

### "Loading sign language translation..." n'affiche pas

Vérifier:
1. Le serveur backend est lancé (`npm run start:dev`)
2. `REACT_APP_API_URL` est correct
3. L'ID du post existe en base

### Le canvas affiche du noir

C'est normal! Le background est noir (#000000) pour une meilleure visibilité des keypoints.

### Les keypoints ne s'affichent pas

Vérifier:
1. L'API retourne bien les frames
2. Les coordonnées x, y, z sont valides
3. Les FPS sont configurés correctement

### "Translation status: pending"

La traduction est encore en cours de traitement. Attendre quelques secondes et rafraîchir.

## 🔐 Permissions

Pour afficher la traduction d'un post:
- L'utilisateur doit avoir accès au post
- Le post doit avoir une traduction LSF disponible

## 📚 Intégration avec React Suspense (optionnel)

```tsx
import { Suspense } from 'react';
import SignLanguageVideo from '@/components/sign-language-video';

<Suspense fallback={<div>Chargement...</div>}>
  <SignLanguageVideo postId={postId} />
</Suspense>
```

## 🎯 Performance

- Les frames sont rendues à la RAF (requestAnimationFrame)
- Cache interne des données du post
- Pas de re-render inutile avec `useRef`

## 📦 Versions supportées

- React: 16.8+
- TypeScript: 4.5+
- Tailwind CSS: 2.0+

## 🔗 Ressources

- [Canvas API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [React Hooks](https://react.dev/reference/react)
- [TypeScript in React](https://www.typescriptlang.org/docs/handbook/jsx.html)
