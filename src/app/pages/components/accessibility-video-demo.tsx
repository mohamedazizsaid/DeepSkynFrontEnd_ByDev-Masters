/**
 * Composant de Démonstration du Système d'Accessibilité Vidéo
 * Exemple complet d'utilisation
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { VideoAccessibilityPlayer } from '@/components/video/video-accessibility-player';
import {
  isSpeechAPISupported,
  isWebGLSupported,
  detectDeviceCapabilities,
} from '@/lib/accessibility-config';

export function AccessibilityVideoDemo() {
  const [selectedVideo, setSelectedVideo] = useState(0);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Vidéos de démo (remplacer par vos URLs)
  const demoVideos = [
    {
      id: 'demo-1',
      title: 'Vidéo 1 - Bonjour',
      url: 'https://example.com/demo1.mp4',
      description: 'Démonstration simple de traduction LSF',
    },
    {
      id: 'demo-2',
      title: 'Vidéo 2 - Dictée',
      url: 'https://example.com/demo2.mp4',
      description: 'Texte plus complexe avec gestes multiples',
    },
  ];

  const currentVideo = demoVideos[selectedVideo];

  // Vérifier les capacités
  const speechSupported = isSpeechAPISupported();
  const webglSupported = isWebGLSupported();
  const deviceCapabilities = detectDeviceCapabilities();

  const isFullySupported = speechSupported && webglSupported;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            🎥 Accessibilité Vidéo avec Avatar LSF
          </h1>
          <p className="text-gray-300">
            Traduction automatique en Langage des Signes Français
          </p>
        </motion.div>

        {/* Status Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold mb-2">État du Système</h3>
              <div className="space-y-1 text-sm">
                <p className={speechSupported ? 'text-green-400' : 'text-red-400'}>
                  ✓ Speech-to-Text API: {speechSupported ? 'Supporté' : 'Non supporté'}
                </p>
                <p className={webglSupported ? 'text-green-400' : 'text-red-400'}>
                  ✓ WebGL Avatar: {webglSupported ? 'Supporté' : 'Non supporté'}
                </p>
                <p className="text-blue-400">
                  📊 Capacités Détectées: {deviceCapabilities.toUpperCase()}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              {showDebugInfo ? 'Masquer' : 'Afficher'} Debug Info
            </button>
          </div>
        </motion.div>

        {/* Debug Info */}
        {showDebugInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg font-mono text-xs text-gray-300"
          >
            <pre>
              {JSON.stringify(
                {
                  speechSupported,
                  webglSupported,
                  deviceCapabilities,
                  browserInfo: {
                    userAgent: navigator.userAgent.substring(0, 50) + '...',
                    language: navigator.language,
                    vendor: navigator.vendor,
                    hardwareConcurrency: (navigator as any).hardwareConcurrency,
                    deviceMemory: (navigator as any).deviceMemory,
                  },
                },
                null,
                2
              )}
            </pre>
          </motion.div>
        )}

        {/* Support Warning */}
        {!isFullySupported && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg text-yellow-300 text-sm"
          >
            ⚠️ Votre navigateur ne supporte pas toutes les fonctionnalités. {!speechSupported && 'La transcription vocale ne fonctionna pas. '}
            {!webglSupported && 'L\'avatar 3D ne fonctionnera pas. '}
            Certaines fonctionnalités seront désactivées.
          </motion.div>
        )}

        {/* Video Player */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-2">
              {currentVideo.title}
            </h2>
            <p className="text-gray-300 text-sm">{currentVideo.description}</p>
          </div>

          {isFullySupported ? (
            <VideoAccessibilityPlayer
              videoUrl={currentVideo.url}
              videoId={currentVideo.id}
              showAvatar={true}
              showTranscription={true}
              avatarPosition="right"
              className="rounded-xl shadow-2xl"
            />
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
              <p className="text-gray-300 mb-4">
                Lecteur vidéo standard (fonctionnalités LSF désactivées)
              </p>
              <video
                src={currentVideo.url}
                controls
                className="w-full max-h-[500px] rounded-lg"
              />
            </div>
          )}
        </motion.div>

        {/* Video Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Autres Vidéos de Démo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demoVideos.map((video, index) => (
              <button
                key={video.id}
                onClick={() => setSelectedVideo(index)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedVideo === index
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                }`}
              >
                <h4 className="text-white font-semibold">{video.title}</h4>
                <p className="text-gray-400 text-sm mt-1">{video.description}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Features Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="p-6 bg-slate-800/30 border border-slate-700 rounded-lg">
            <div className="text-3xl mb-2">🎤</div>
            <h3 className="text-white font-semibold mb-2">Speech-to-Text</h3>
            <p className="text-gray-400 text-sm">
              Transcription vocale temps réel via Web Speech API
            </p>
          </div>

          <div className="p-6 bg-slate-800/30 border border-slate-700 rounded-lg">
            <div className="text-3xl mb-2">🤖</div>
            <h3 className="text-white font-semibold mb-2">Avatar 3D</h3>
            <p className="text-gray-400 text-sm">
              Animation 3D des gestes dans React Three Fiber
            </p>
          </div>

          <div className="p-6 bg-slate-800/30 border border-slate-700 rounded-lg">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="text-white font-semibold mb-2">Performance</h3>
            <p className="text-gray-400 text-sm">
              Optimisé avec LOD dynamique et cache intelligent
            </p>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-6 bg-slate-800/50 border border-slate-700 rounded-lg"
        >
          <h3 className="text-white font-semibold mb-4">📖 Instructions</h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>✓ Cliquez sur le bouton <span className="text-blue-400">LSF</span> pour activer la traduction</li>
            <li>✓ L'avatar commencera à reproduire les gestes LSF correspondant au son</li>
            <li>✓ La transcription s'affichera en temps réel en bas</li>
            <li>✓ Le système s'adapte automatiquement aux capacités de votre appareil</li>
            <li>✓ Les gestes sont mis en cache pour une performance optimale</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

export default AccessibilityVideoDemo;
