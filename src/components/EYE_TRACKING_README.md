# Eye Tracking - Configuration

## Modèles Face-API.js requis

Pour que le suivi oculaire fonctionne, vous devez télécharger les modèles face-api.js et les placer dans le dossier `public/models/`.

### Téléchargement des modèles

1. Téléchargez les modèles depuis le repo officiel :
   - https://github.com/justadudewhohacks/face-api.js-models

2. Ou téléchargez directement ces fichiers :
   - `ssd_mobilenetv1_model-weights_manifest.json`
   - `ssd_mobilenetv1_model-shard1`
   - `ssd_mobilenetv1_model-shard2`
   - `face_landmark_68_model-weights_manifest.json`
   - `face_landmark_68_model-shard1`

3. Placez-les dans `public/models/`

### Structure attendue

```
public/
└── models/
    ├── ssd_mobilenetv1_model-weights_manifest.json
    ├── ssd_mobilenetv1_model-shard1
    ├── ssd_mobilenetv1_model-shard2
    ├── face_landmark_68_model-weights_manifest.json
    └── face_landmark_68_model-shard1
```

## Utilisation

1. Ouvrez le panneau d'accessibilité (icône en bas à droite ou Alt+A)
2. Dans la section "Vision & Lecture", activez "Suivi Oculaire"
3. Autorisez l'accès à la webcam
4. Bougez votre tête pour contrôler le curseur
5. Restez immobile 3 secondes sur un élément pour cliquer

## Fonctionnement

- Le curseur suit la position de votre nez via la webcam
- Phase de calibration automatique de 10 secondes au démarrage
- Auto-scroll quand le curseur est en haut/bas de l'écran
- Clic par immobilité (3 secondes sur la même zone)
