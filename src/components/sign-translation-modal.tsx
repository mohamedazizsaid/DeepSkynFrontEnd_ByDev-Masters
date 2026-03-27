/**
 * Composant Modal d'Affichage de la Traduction LSF d'un Texte
 * Affiche un avatar qui traduit le texte en gestes de langage des signes
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader, AlertCircle, Volume2 } from 'lucide-react';
import { SignLanguageAvatarCanvas } from './3d/sign-language-avatar-canvas';
import { getSignLanguageService } from '../lib/services/sign-language.service';
import type { GestureData, HandGesture } from '../lib/services/sign-language.service';
import type { Frame, SignTranslationMetadata } from '../lib/services/sign-translation.service';

interface SignTranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
  frames?: Frame[];
  metadata?: SignTranslationMetadata;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Converti les frames du backend en gestes LSF locaux
 * Chaque frame du backend est transformée en GestureData
 */
function convertFramesToGestures(frames: Frame[], metadata?: any): GestureData[] {
  if (!frames || frames.length === 0) return [];
  
  // Calculer la durée par frame en fonction du FPS (par défaut 30fps)
  const fps = metadata?.fps || 30;
  const frameDuration = 1000 / fps; // en millisecondes
  
  const gestures: GestureData[] = frames.map((frame, index) => {
    // Convertir hand_right_keypoints - prendre moyenne de tous les keypoints comme position
    const rightKeypoints = frame.hand_right_keypoints || [];
    const rightAvgX = rightKeypoints.length > 0 
      ? rightKeypoints.reduce((sum, kp) => sum + (kp.x || 0), 0) / rightKeypoints.length 
      : 0;
    const rightAvgY = rightKeypoints.length > 0 
      ? rightKeypoints.reduce((sum, kp) => sum + (kp.y || 0), 0) / rightKeypoints.length 
      : 0;
    const rightAvgZ = rightKeypoints.length > 0 
      ? rightKeypoints.reduce((sum, kp) => sum + (kp.z || 0), 0) / rightKeypoints.length 
      : 0;

    const rightHand: HandGesture = {
      hand: 'right',
      position: {
        x: rightAvgX,
        y: rightAvgY,
        z: rightAvgZ,
      },
      rotation: { x: 0, y: 0, z: 0 },
      fingers: rightKeypoints.slice(0, 5).map((kp, i) => ({
        finger: (['thumb', 'index', 'middle', 'ring', 'pinky'] as const)[i],
        extended: true,
        curled: 0,
        rotation: { x: (kp.x || 0) * 0.1, y: (kp.y || 0) * 0.1, z: (kp.z || 0) * 0.1 },
      })),
      speed: 0.7,
    };

    // Convertir hand_left_keypoints
    const leftKeypoints = frame.hand_left_keypoints || [];
    const leftAvgX = leftKeypoints.length > 0 
      ? leftKeypoints.reduce((sum, kp) => sum + (kp.x || 0), 0) / leftKeypoints.length 
      : 0;
    const leftAvgY = leftKeypoints.length > 0 
      ? leftKeypoints.reduce((sum, kp) => sum + (kp.y || 0), 0) / leftKeypoints.length 
      : 0;
    const leftAvgZ = leftKeypoints.length > 0 
      ? leftKeypoints.reduce((sum, kp) => sum + (kp.z || 0), 0) / leftKeypoints.length 
      : 0;

    const leftHand: HandGesture = {
      hand: 'left',
      position: {
        x: leftAvgX,
        y: leftAvgY,
        z: leftAvgZ,
      },
      rotation: { x: 0, y: 0, z: 0 },
      fingers: leftKeypoints.slice(0, 5).map((kp, i) => ({
        finger: (['thumb', 'index', 'middle', 'ring', 'pinky'] as const)[i],
        extended: true,
        curled: 0,
        rotation: { x: (kp.x || 0) * 0.1, y: (kp.y || 0) * 0.1, z: (kp.z || 0) * 0.1 },
      })),
      speed: 0.7,
    };

    const hands = [];
    if (rightKeypoints.length > 0) hands.push(rightHand);
    if (leftKeypoints.length > 0) hands.push(leftHand);

    return {
      id: `frame-${index}`,
      name: `Geste ${index + 1}`,
      description: `Geste du frame ${index + 1}`,
      movement: {
        duration: frameDuration,
        hands: hands.length > 0 ? hands : [rightHand], // Fallback si pas de keypoints
        bodyRotation: 0,
        headTilt: 0,
        facialExpression: 'neutral',
      },
      confidence: 0.95,
    };
  });

  return gestures;
}

/**
 * Converti le texte en gestes LSF locaux
 * Utilisé comme fallback ou en complément des frames du backend
 */
function generateGesturesFromText(text: string): GestureData[] {
  const signLanguageService = getSignLanguageService();
  if (!text?.trim()) return [];

  // Traduire le texte en gestes
  const gestures = signLanguageService.translateToGestures(text, 'fr');
  return gestures;
}

export function SignTranslationModal({
  isOpen,
  onClose,
  text,
  frames,
  metadata,
  isLoading = false,
  error = null,
}: SignTranslationModalProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // Générer les gestes à partir des frames du backend ou du texte
  const gestures = useMemo(() => {
    // Priorité 1: Utiliser les frames du backend
    if (frames && frames.length > 0) {
      return convertFramesToGestures(frames, metadata);
    }
    // Fallback: Générer à partir du texte
    return generateGesturesFromText(text);
  }, [text, frames, metadata]);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setIsPlaying(true);
    }
  }, [isOpen]);

  const handleAnimationComplete = () => {
    setIsAnimating(false);
  };

  const handlePlayAgain = () => {
    setIsAnimating(true);
    setIsPlaying(true);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#334155]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <span className="text-2xl">🤟</span>
                </div>
                <div>
                  <h2 className="font-bold text-lg dark:text-white">Traduction LSF</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Langage des Signes Français</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#334155] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 dark:text-gray-300" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Texte original */}
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Texte original :</p>
                <div className="p-4 bg-gray-50 dark:bg-[#0f172a] rounded-lg border border-gray-200 dark:border-[#334155]">
                  <p className="text-gray-800 dark:text-gray-100 leading-relaxed">{text}</p>
                </div>
              </div>

              {/* Avatar ou état chargement/erreur */}
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Avatar Traducteur :</p>
                
                {isLoading ? (
                  <div className="h-[400px] bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader className="w-8 h-8 animate-spin text-purple-500" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Génération de la traduction...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="h-[400px] bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center border border-red-200 dark:border-red-800">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  </div>
                ) : gestures.length > 0 ? (
                  <SignLanguageAvatarCanvas
                    gestures={gestures}
                    isAnimating={isAnimating}
                    onGestureComplete={handleAnimationComplete}
                    width="100%"
                    height="400px"
                    showControls={false}
                  />
                ) : (
                  <div className="h-[400px] bg-gray-50 dark:bg-[#0f172a] rounded-xl flex items-center justify-center border border-gray-200 dark:border-[#334155]">
                    <p className="text-gray-500 dark:text-gray-400">Aucune traduction disponible</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePlayAgain}
                  disabled={isLoading || error !== null || gestures.length === 0}
                  className="flex-1 px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span>▶️</span>
                  <span>Rejouer</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSpeak}
                  disabled={isLoading || error !== null}
                  className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Écouter</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-[#334155] dark:hover:bg-[#475569] text-gray-800 dark:text-white font-semibold rounded-lg transition-colors"
                >
                  Fermer
                </motion.button>
              </div>

              {/* Info */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  ℹ️ L'avatar montre une interprétation en Langage des Signes Français (LSF).
                  {frames && frames.length > 0 && ' Les gestes sont basés sur les données du serveur.'}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
