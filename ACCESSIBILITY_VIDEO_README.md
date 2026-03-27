# 🎥 Système d'Accessibilité Vidéo avec Avatar Traducteur LSF

Système performant pour traduire les vidéos en Langage des Signes Français (LSF) avec un avatar 3D animé.

## 🎯 Caractéristiques

- ✅ **Speech-to-Text** - Transcription vocale temps réel via Web Speech API
- ✅ **Avatar 3D Animé** - Traduction en gestes via React Three Fiber
- ✅ **Langage des Signes** - Base de gestes LSF personnalisable
- ✅ **Optimisé Performance** - LOD dynamique, cache intelligent, GPU rendering
- ✅ **Transcription** - Affichage temps réel du texte transcrit
- ✅ **Contrôles Intuitifs** - Play/Pause, son, plein écran
- ✅ **Responsive** - Adapté mobile et desktop

## 📦 Installation

Le système est déjà intégré. Aucune installation supplémentaire requise.

### Prérequis
- React 18+
- React Three Fiber
- Motion (animations)
- Tailwind CSS

## 🚀 Utilisation Basique

### Composant VideoAccessibilityPlayer

```tsx
import { VideoAccessibilityPlayer } from '@/components/video/video-accessibility-player';

export function MyComponent() {
  return (
    <VideoAccessibilityPlayer
      videoUrl="https://example.com/video.mp4"
      videoId="video-123"
      showAvatar={true}
      showTranscription={true}
      avatarPosition="right"
    />
  );
}
```

### Hook useVideoAccessibility

Pour un contrôle granulaire :

```tsx
import { useVideoAccessibility } from '@/hooks/use-video-accessibility';

export function CustomPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    isTranscribing,
    transcription,
    gestures,
    startTranscription,
    stopTranscription,
  } = useVideoAccessibility({ language: 'fr-FR', cacheGestures: true });

  const handlePlay = async () => {
    if (videoRef.current) {
      await startTranscription(videoRef.current);
    }
  };

  return (
    <>
      <video ref={videoRef} src="video.mp4" controls />
      <button onClick={handlePlay}>Démarrer traduction LSF</button>
      <p>{transcription}</p>
    </>
  );
}
```

## 🏗️ Architecture

### Services

#### SpeechToTextService
Gère la transcription vocale via Web Speech API.

```typescript
const speechService = getSpeechToTextService();
const text = await speechService.transcribeAudioElement(audioElement, {
  language: 'fr-FR',
  continuous: true,
  interimResults: true,
});
```

#### SignLanguageService
Traduit le texte en animations de gestes LSF.

```typescript
const signService = getSignLanguageService();
const gestures = signService.translateToGestures('Bonjour le monde', 'fr');
// Renvoi: [GestureData, GestureData, ...]
```

### Composants

#### VideoAccessibilityPlayer
Lecteur vidéo complet avec avatar intégré.

**Props:**
- `videoUrl` (string): URL de la vidéo
- `videoId` (string): ID unique pour le cache
- `showAvatar` (boolean): Afficher l'avatar (par défaut: true)
- `showTranscription` (boolean): Afficher la transcription (par défaut: true)
- `avatarPosition` ('left' | 'right' | 'bottom'): Position du avatar
- `onTranscriptionUpdate` (callback): Callback sur mise à jour

#### SignLanguageAvatarCanvas
Canvas Three.js pour l'avatar 3D.

**Props:**
- `gestures` (GestureData[]): Animations à jouer
- `isAnimating` (boolean): Lecture active
- `onGestureComplete` (callback): Callback fin animation
- `scale` (number): Échelle du modèle
- `position` ([x, y, z]): Position initiale

## ⚙️ Configuration & Performance

### Détection Automatique des Capacités

```typescript
import { detectDeviceCapabilities, ACCESSIBILITY_CONFIG } from '@/lib/accessibility-config';

const lod = detectDeviceCapabilities(); // 'high' | 'medium' | 'low'
```

### Ajustement Dynamique du LOD

```typescript
import { PerformanceMonitor } from '@/lib/accessibility-config';

const monitor = new PerformanceMonitor((fps) => {
  console.log(`FPS: ${fps}`);
  const adjustment = monitor.suggestLODAdjustment(currentLOD);
});
```

### Cache de Gestes

```typescript
import { GestureCache } from '@/lib/accessibility-config';

const cache = new GestureCache(100); // Max 100 entrées
cache.set('bonjour', gesturesArray);
const cached = cache.get('bonjour');
```

## 🔧 Extensibilité

### Ajouter Nouveaux Gestes LSF

```typescript
import { getSignLanguageService } from '@/lib/services/sign-language.service';

const signService = getSignLanguageService();

// Ajouter un geste personnalisé
signService.addCustomGesture({
  id: 'custom_gesture',
  name: 'Mon Geste',
  description: 'Mon geste personnalisé',
  movement: {
    duration: 800,
    hands: [
      {
        hand: 'both',
        position: { x: 0, y: 0.3, z: 0.5 },
        rotation: { x: 0, y: 0, z: 0 },
        fingers: [/* ... */],
        speed: 0.8,
      },
    ],
    bodyRotation: 0,
    headTilt: 0,
    facialExpression: 'smile',
  },
  confidence: 0.9,
});
```

## 📊 Monitoring & Debug

### Monitor Global de Performance

```typescript
import { getGlobalPerformanceMonitor } from '@/lib/accessibility-config';

const monitor = getGlobalPerformanceMonitor();

// Dans la boucle d'animation
monitor.recordFrame();
console.log('FPS:', monitor.getFPS());
```

## 🌐 Support Navigateurs

| Navigateur | Speech API | WebGL | Support |
|-----------|-----------|-------|---------|
| Chrome/Edge | ✅ | ✅ | Complet |
| Firefox | ✅ | ✅ | Complet |
| Safari | ⚠️ | ✅ | Partiel (Safari nécessite webkit prefix) |
| Mobile Chrome | ✅ | ⚠️ | Bonne |
| Mobile Safari | ⚠️ | ⚠️ | Limitée |

### Vérifier le Support

```typescript
import { isSpeechAPISupported, isWebGLSupported } from '@/lib/accessibility-config';

if (isSpeechAPISupported() && isWebGLSupported()) {
  // Lancer le système complet
} else {
  // Fallback: lecteur vidéo simple
}
```

## 🎬 Intégration dans PostCard

Le système est déjà intégré dans le composant PostCard. Les vidéos afficheront automatiquement un avatar traducteur LSF.

```tsx
// Dans post-card.tsx
{post.media.includes('video') ? (
  <VideoAccessibilityPlayer
    videoUrl={post.media}
    videoId={post.id}
    showAvatar={true}
    showTranscription={true}
    avatarPosition="right"
  />
) : (
  <img src={post.media} alt="Post media" />
)}
```

## 📝 Notes Techniques

### Optimisations Implémentées

1. **Lazy Loading** - Composants chargés à la demande
2. **Memory Management** - Cache limité avec éviction LRU
3. **LOD Dynamique** - Ajustement basé sur FPS et capacités
4. **GPU Rendering** - Utilisation WebGL pour les animations
5. **Debouncing** - Éviter les mises à jour excessives
6. **Memoization** - Composants React.memo optimisés

### Gestion Mémoire

```typescript
// Auto-nettoyage des ressources
useEffect(() => {
  return () => {
    speechService.stop();
    gestureCache.current.clear();
  };
}, []);
```

## 🐛 Débogage

Activer le mode debug :

```typescript
// Dans environment ou config
process.env.REACT_APP_ACCESSIBILITY_DEBUG = 'true'
```

## 📚 Ressources

- [Web Speech API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- [Dictionnaire LSF](https://www.aidhm.org/)

## 📄 Licence

Même licence que le projet principal
