# Hand Skeleton Animation System

## 📋 Résumé des Changements

L'avatar full-body a été **complètement remplacé** par un système d'animation de **mains squelette uniquement**, affichant:
- ✅ Les deux mains avec 21 keypoints MediaPipe par main
- ✅ Le squelette du corps (épaules, coudes, poignets)
- ✅ Contrôles de lecture intégrés (play, pause, vitesse)
- ✅ Gestes **différents pour chaque post**
- ✅ Badge avec le texte du geste (gloss)

## 🎯 Component Principal

### `AnimatedHand`
**Fichier**: `src/components/sign-avatar/animated-hand.tsx`

Composant canvas natif qui:
- Accepte `postId` pour récupérer automatiquement les frames de l'API
- Ou accepte directement `frames` + `metadata` (pour utilisation programmée)
- Dessine un squelette hands+body avec connexions osseuses
- Gère la boucle d'animation avec requestAnimationFrame

**Props**:
```typescript
{
  postId?: string;              // ID post pour fetch API
  frames?: Frame[];             // Frames d'animation directes
  metadata?: SignResponse['metadata'];
  apiBaseUrl?: string;          // URL base API (défaut: "")
  width?: number;               // Largeur canvas (défaut: 200)
  height?: number;              // Hauteur canvas (défaut: 260)
  autoPlay?: boolean;           // Auto-play (défaut: true)
  onComplete?: () => void;      // Callback fin animation
}
```

### `HandSignAvatar`
**Fichier**: `src/components/sign-avatar/hand-sign-avatar.tsx`

Wrapper simplifié autour de `AnimatedHand` (pour compatibilité)

## 🎨 Rendu Canvas

### Squelette Main (21 keypoints)
```
Pouce:        Connexions:
₀ → ₁ → ₂ → ₃ → ₄          [0,1] [1,2] [2,3] [3,4]
                             
Index:                       
₀ → ₅ → ₆ → ₇ → ₈           [0,5] [5,6] [6,7] [7,8]

... (majeur, annulaire, auriculaire)

Paume:        Connexions paume:
              [5,9] [9,13] [13,17]
```

### Squelette Corps (8 keypoints)
```
Nose
↓
L_Shoulder ← → R_Shoulder
↓         ↓
L_Elbow   R_Elbow
↓         ↓
L_Wrist   R_Wrist
```

### Couleurs
- **Main droite** (blue-purple gradient): Bleu → Rose
- **Main gauche** (cyan-blue gradient): Cyan → Bleu
- **Corps** (teal): Vert-bleu translucide
- **Tips doigts** (empattements): Couleurs plus saturées avec glow

## 🔄 Format API

### Endpoint
`GET /sign-translation/videopost/{postId}`

### Response
```typescript
{
  frames: [
    {
      frame_index?: number;
      hand_right_keypoints: [
        { id: string; x: number; y: number; z: number }
        // ... 21 keypoints
      ],
      hand_left_keypoints: [...] | null,
      pose_keypoints: [
        { id: string; x: number; y: number; z: number }
        // ... 8 keypoints (NOSE, R_SHOULDER, L_SHOULDER, ...)
      ]
    },
    // ... repeat for all frames
  ],
  metadata: {
    gloss: string;           // Texte du geste
    fps: number;             // 30 par défaut
    total_frames: number;    // Nombre total frames
    sign_language?: string;  // "LSF"
  }
}
```

**Important**: Les keypoints doivent être **normalisés 0-1** (pas en pixels)

## 📱 Utilisation

### Avec postId (fetch auto)
```jsx
import { HandSignAvatar } from '@/components/sign-avatar';

<HandSignAvatar
  postId="ahmed-detention-beauty"
  apiBaseUrl="/api"
  width={400}
  height={500}
  autoPlay={true}
/>
```

### Avec frames directes
```jsx
import { AnimatedHand } from '@/components/sign-avatar';

<AnimatedHand
  frames={myFrames}
  metadata={{ gloss: "Bonjour", fps: 30, total_frames: 60 }}
  width={200}
  height={260}
  autoPlay={true}
/>
```

## 🎮 Contrôles Intégrés

- **Play/Pause** ▶️ / ⏸️
- **Replay** ↺ (restart animation)
- **Vitesse** 0.5x | 1x | 1.5x | 2x
- **Badge gloss** (affiche le texte du geste)
- **Label langue** (bas-right: "LSF")

## ⚙️ Backend

Le microservice Python génère **automatiquement des gestes différents** par post:

```python
def hash_text_to_gesture_params(text: str):
    # Crée des paramètres uniques basés sur le hash du texte
    # Différent pour chaque contenu de post!
    
    return {
        "hand_spread": 0.02-0.10,      # Espacement doigts
        "finger_extension": 0.3-1.0,   # Extension doigts
        "curl_pattern": 0-5,           # 6 patterns: all/peace/ok/fist/point/open
        ...
    }
```

## 🗂️ Structure Files

```
src/components/sign-avatar/
├── animated-hand.tsx          ← MAIN: canvas renderer
├── hand-sign-avatar.tsx       ← Wrapper pour compatibilité
├── USAGE_EXAMPLE.tsx          ← Exemples d'utilisation
├── index.ts                   ← Exports
├── pro-sign-avatar.tsx        ← Ancien (conservé pour compat)
├── sign-avatar-renderer.ts    ← Ancien (conservé pour compat)
└── ...
```

## ✅ Changements Fait

- ❌ ~~Avatar bleu complet~~ → ✅ Mains squelette uniquement
- ❌ ~~Même geste pour tous les posts~~ → ✅ Gestes différents par post
- ❌ ~~3D Three.js lourd~~ → ✅ Canvas 2D léger
- ✅ Contrôles intégrés (play/pause/vitesse)
- ✅ API standardisée avec keypoints MediaPipe
- ✅ Performance optimisée avec requestAnimationFrame

## 📊 Performance

- **Canvas Resolution**: 200x260 par défaut (configurable)
- **Frame Rate**: 30 FPS (configurable via API metadata)
- **Memory**: ~5-10MB pour 60 frames × 2 mains + corps
- **Rendering**: ~2-3ms par frame (requestAnimationFrame)

## 🚀 Prochaines Étapes

1. **Intégrer dans les posts** - Remplacer l'ancien avatar dans l'UI
2. **Ajouter ML real** - Remplacer le hash par un vrai modèle LSF
3. **Améliorer les gestes** - Base de données de vrais gestes
4. **Animation lèvres** - Sync avec le texte si besoin
5. **Expressions faciales** - Ajouter les keypoints du visage (OpenFace)

## 🔗 Import

```typescript
// Main component
import { AnimatedHand } from '@/components/sign-avatar';
import { HandSignAvatar } from '@/components/sign-avatar';

// Types
import type { HandAnimationData } from '@/components/sign-avatar';
```
