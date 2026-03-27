# Intégration Sign Translation dans Post Card

## 📋 Overview

Cette intégration ajoute une traduction en Langage des Signes Français (LSF) pour tous les posts textuels dans l'application DeepSkyn. Quand un utilisateur clique sur le bouton "LSF" d'un post, un avatar 3D traduit le texte en gestes LSF dans une modal.

## 🏗️ Architecture

### Backend (NestJS)
- **Route**: `POST /sign-translation/translate`
- **Service**: Appelle le microservice Python sur le port 8000
- **Module**: `SignTranslationModule` (déjà importé dans `AppModule`)
- **Configuration**: Variable d'env `SIGN_TRANSLATION_SERVICE_URL` (défaut: `http://localhost:8000`)

### Frontend (React/Vite)
- **Service**: `src/lib/services/sign-translation.service.ts`
- **Hook**: `src/hooks/use-sign-translation.ts`
- **Modal Component**: `src/components/sign-translation-modal.tsx`
- **Post Card**: Modified `src/app/pages/components/post-card.tsx` with LSF button

## 📁 Fichiers Créés/Modifiés

### Créés
1. **Frontend Services/Services**
   - `src/lib/services/sign-translation.service.ts` - Client API pour appeler le backend
   - `src/lib/services/index.ts` - Exports (modifié pour ajouter sign-translation)

2. **Frontend Hooks**
   - `src/hooks/use-sign-translation.ts` - Hook React pour gérer la traduction

3. **Frontend Components**
   - `src/components/sign-translation-modal.tsx` - Modal avec avatar qui traduit

### Modifiés
1. **Frontend Components**
   - `src/app/pages/components/post-card.tsx`
     - Ajout imports: `Hand` icon, `SignTranslationModal`, `useSignTranslation`
     - Ajout states: `showLSFModal`, states du hook
     - Ajout fonctions: `handleLSFTranslate()`, `handleCloseLSFModal()`
     - Ajout bouton LSF dans les actions
     - Ajout du composant `SignTranslationModal` dans le render

## 🔄 Flux d'Utilisation

1. **Utilisateur clique sur bouton LSF**
   ```
   Post Card → Bouton LSF claqué → handleLSFTranslate()
   ```

2. **Appel API**
   ```
   Frontend Hook → POST /sign-translation/translate
   → NestJS Backend → Python Microservice
   → Retour des frames d'animation
   ```

3. **Affichage Modal**
   ```
   Modal s'ouvre → Avatar 3D animate les gestures → Fermeture possible
   ```

## 🚀 Configuration Requise

### Backend (.env)
```env
# Si le microservice Python n'est pas sur localhost:8000
SIGN_TRANSLATION_SERVICE_URL=http://localhost:8000

# CORS permet le frontend sur localhost:5173
FRONTEND_URL=http://localhost:5173
```

### Frontend
- Vite/React configuré sur localhost:5173 (par défaut)
- API client pointe vers localhost:3000 (NestJS backend)

### Microservice Python
- Doit tourner sur http://localhost:8000
- Endpoint: `POST /translate`
- Réponse: JSON avec frames et metadata

Example de requête Python:
```bash
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## 📊 Types de Données

### SignTranslationResponse (Backend → Frontend)
```typescript
{
  frames: Frame[];           // Array de frames d'animation
  metadata: {                // Metadata de la traduction
    gloss: string;           // Geste lexical
    fps: number;             // Frames per second
    total_frames: number;    // Total des frames
  };
  status: string;            // 'success', 'error', etc.
  error?: string;            // Message d'erreur si applicable
}

interface Frame {
  hand_right_keypoints: Keypoint[];
  hand_left_keypoints: Keypoint[];
  pose_keypoints: Keypoint[];
}

interface Keypoint {
  id: string;
  x: number;
  y: number;
  z: number;
}
```

## 🎯 Fonctionnalités

✅ **Bouton LSF** sur chaque post
✅ **Modal de traduction** avec avatar 3D
✅ **Gestion des états**: Loading, Error, Success
✅ **Boutons d'action**: Rejouer, Écouter (text-to-speech), Fermer
✅ **Accessibilité**: Support du dark mode, high contrast
✅ **Responsive**: Fonctionne sur desktop et mobile

## ⚙️ Détails d'Implémentation

### Post Card Integration
```tsx
// Aggiunto lo stato del modal
const [showLSFModal, setShowLSFModal] = useState(false);
const { isLoading, error, data, translate, reset } = useSignTranslation();

// Handler pour traduire
const handleLSFTranslate = async () => {
  setShowLSFModal(true);
  await translate(post.content);
};

// Bouton LSF
<motion.button onClick={handleLSFTranslate} disabled={isTranslating}>
  <Hand className="w-5 h-5" />
  <span>LSF</span>
</motion.button>

// Modal
<SignTranslationModal
  isOpen={showLSFModal}
  onClose={handleCloseLSFModal}
  text={post.content}
  frames={translationData?.frames}
  isLoading={isTranslating}
  error={translationError}
/>
```

### Hook useSignTranslation
```tsx
const { isLoading, error, data, translate, reset } = useSignTranslation();

// Utilisation
await translate(text, 'fr'); // Traduit en français
reset();                       // Réinitialise les états
```

### Avatar Traduction
- Convertit le texte en gestes LSF locaux
- Utilise `SignLanguageAvatarCanvas` pour l'affichage 3D
- Supporte fallback si les gestes ne sont pas générés

## 🧪 Testing

### Tester Manuellement
1. Backend NestJS lancé: `npm run start:dev`
2. Microservice Python lancé: `python -m uvicorn app:app --host 0.0.0.0 --port 8000`
3. Frontend lancé: `npm run dev`
4. Créer un post avec du texte
5. Cliquer sur bouton "LSF"
6. Vérifier que le modal s'ouvre et l'avatar apparaît

### Vérifier les Appels API
```bash
# Tester directement l'endpoint backend
curl -X POST http://localhost:3000/sign-translation/translate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"text": "Bonjour", "language": "fr"}'

# Vérifier le microservice Python
curl -X POST http://localhost:8000/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Bonjour", "language": "fr"}'
```

## 🐛 Troubleshooting

### Le bouton LSF n'apparaît pas
- Vérifier que `post-card.tsx` a bien les imports de `SignTranslationModal`
- Vérifier les erreurs TypeScript/ESLint

### La modal ne s'ouvre pas
- Vérifier que `showLSFModal` state est bien mis à jour
- Vérifier la console pour les erreurs

### L'avatar ne s'anime pas
- Vérifier que le text est bien envoyé
- Vérifier que le backend répond avec des frames
- Vérifier les logs du microservice Python

### Erreur de connexion API
- Vérifier que le backend NestJS tourne sur port 3000
- Vérifier la variable SIGN_TRANSLATION_SERVICE_URL
- Vérifier que le microservice Python tourne sur port 8000

### CORS errors
- Vérifier que FRONTEND_URL est bien configuré dans le backend (.env)
- Vérifier que le backend autorise les requêtes du frontend

## 📈 Améliorations Futures

1. **Caching**: Cache les traductions pour éviter les appels répétés
2. **Animation Smoothing**: Mieux interpoler les keypoints
3. **Multi-language**: Support d'autres langues des signes (ASL, BSL, etc.)
4. **Custom Gestures**: Permettre aux utilisateurs de personnaliser les gestes
5. **Performance**: WebWorker pour traitement asynchrone
6. **Analytics**: Tracker les traductions utilisées

## 📝 Notes

- L'intégration utilise le service `SignLanguageService` existant pour générer les gestes LSF locaux
- Les frames du backend peuvent être utilisées pour une animation plus fluide
- Le composant `SignTranslationModal` est réutilisable pour d'autres parties de l'app
- Le hook `useSignTranslation` peut être utilisé ailleurs que dans post-card

## 👥 Support

Pour toute question ou problème:
1. Vérifier les logs du backend: `npm run start:dev`
2. Vérifier les logs du microservice Python
3. Vérifier la console du navigateur (F12)
4. Vérifier les erreurs TypeScript: `npm run type-check`
