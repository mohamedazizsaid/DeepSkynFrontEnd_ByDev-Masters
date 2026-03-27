/**
 * Guide d'Upload Vidéo pour les Posts
 * 
 * Le système déjà support complet l'upload de vidéos dans les posts.
 */

import React from 'react';

/**
 * ✅ SUPPORTS VIDÉO NATIF
 * 
 * Formats supportés:
 * - MP4 (.mp4)
 * - WebM (.webm)
 * - Ogg (.ogv)
 * - MOV (.mov)
 * - MKV (.mkv)
 * 
 * Limite de taille: 10 MB max
 * 
 * UTILISATION:
 * 1. Cliquez sur le bouton "Glissez ou sélectionnez"
 * 2. Sélectionnez une vidéo ou faites-la glisser
 * 3. Un aperçu s'affichera avec un badge "VIDÉO"
 * 4. Cliquez sur envoyer pour publier
 */

/**
 * FONCTIONNALITÉS AVEC VIDÉOS:
 * 
 * ✅ Prévisualisation en temps réel
 * ✅ Lecteur vidéo avec contrôles (play, pause, volume, fullscreen)
 * ✅ Supporté sur tous les navigateurs modernes
 * ✅ Validations automatiques (taille, format)
 * ✅ Messages d'erreur clairs
 * ✅ Drag & drop support
 */

/**
 * INTÉGRATION ACCESSIBILITÉ:
 * 
 * Quand une vidéo est uploadée dans un post:
 * 1. Elle apparaît dans le feed avec le lecteur standard
 * 2. Un bouton "LSF" apparaît pour activer la traduction
 * 3. Un avatar 3D traduit en langage des signes en temps réel
 * 4. La transcription s'affiche en bas
 */

/**
 * CODE D'UTILISATION:
 */

export default function VideoUploadGuide() {
  return (
    <div className="p-6 bg-white rounded-lg">
      <h2 className="text-2xl font-bold mb-4">📹 Guide Upload Vidéo</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-lg">🎬 Types de Vidéos Supportées</h3>
          <ul className="list-disc pl-5 ml-2">
            <li>Vidéos récréatives (tutoriels, vlogs, etc.)</li>
            <li>Contenu éducatif</li>
            <li>Conseils dermatologiques</li>
            <li>Démonstrations de soins</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-lg">📊 Spécifications</h3>
          <ul className="space-y-1 text-sm">
            <li>✓ <strong>Taille max:</strong> 10 MB</li>
            <li>✓ <strong>Formats:</strong> MP4, WebM, OGV, MOV, MKV</li>
            <li>✓ <strong>Résolution:</strong> Jusqu'à 4K</li>
            <li>✓ <strong>Frame rate:</strong> 24-60 fps recommandé</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-lg">🎯 Étapes d'Upload</h3>
          <ol className="list-decimal pl-5 space-y-2 ml-2">
            <li>Cliquez sur le champ "Glissez ou sélectionnez une photo / vidéo"</li>
            <li>Sélectionnez votre fichier vidéo (ou glissez-le)</li>
            <li>Un badge "VIDÉO" apparaît en haut à gauche de la prévisualisation</li>
            <li>Vous pouvez voir un aperçu avec les contrôles vidéo</li>
            <li>Complétez votre post (texte, feelings, location)</li>
            <li>Cliquez sur "Envoyer" pour publier</li>
          </ol>
        </div>

        <div>
          <h3 className="font-bold text-lg">🌐 Accessibilité Vidéo</h3>
          <p className="text-sm text-gray-700 mb-2">
            Les vidéos publiées incluent automatiquement:
          </p>
          <ul className="space-y-1 text-sm">
            <li>✓ Bouton LSF pour traduction en langage des signes</li>
            <li>✓ Avatar 3D qui reproduit les gestes LSF</li>
            <li>✓ Transcription en temps réel</li>
            <li>✓ Contrôles accessibles (clavier, lecteur d'écran)</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <h3 className="font-bold text-lg mb-2">💡 Conseil</h3>
          <p className="text-sm">
            Pour une meilleure expérience avec la traduction LSF, 
            assurez-vous que la vidéo contient une piste audio claire 
            en français. L'avatar traduira le contenu audio en gestes LSF.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <h3 className="font-bold text-lg mb-2">⚠️ Limitations Actuelles</h3>
          <ul className="text-sm space-y-1">
            <li>• Taille max 10 MB (optimisez avant d'uploader)</li>
            <li>• Vérifiez la compatibilité du codec vidéo</li>
            <li>• La transcription LSF fonctionne mieux avec audio français clair</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded p-3">
          <h3 className="font-bold text-lg mb-2">✅ Optimisation Vidéo</h3>
          <p className="text-sm mb-2">Avant d'uploader, compressez votre vidéo:</p>
          <code className="bg-gray-100 p-2 rounded text-xs block">
            ffmpeg -i video.mp4 -vcodec libx264 -crf 28 -acodec aac -b:a 128k optimized.mp4
          </code>
          <p className="text-xs text-gray-600 mt-2">Réduit la taille de 50-70% sans perte de qualité visible</p>
        </div>
      </div>
    </div>
  );
}

export { VideoUploadGuide };
