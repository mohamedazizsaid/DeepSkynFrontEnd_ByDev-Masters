/**
 * Composant Player Vidéo Accessible avec Avatar Traducteur LSF
 * Combine la vidéo avec la traduction en langage des signes
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Volume2, VolumeX, Settings, Loader, Users, X } from 'lucide-react';
import { SignLanguageAvatarCanvas } from '../3d/sign-language-avatar-canvas';
import { getSpeechToTextService } from '../../lib/services/speech-to-text.service';
import { getSignLanguageService } from '../../lib/services/sign-language.service';
import type { GestureData, TranscriptionResult } from '../../lib/services/speech-to-text.service';

interface VideoAccessibilityPlayerProps {
  videoUrl: string;
  videoId?: string;
  showAvatar?: boolean;
  showTranscription?: boolean;
  avatarPosition?: 'left' | 'right' | 'bottom';
  onTranscriptionUpdate?: (text: string) => void;
  className?: string;
}

export function VideoAccessibilityPlayer({
  videoUrl,
  videoId,
  showAvatar = true,
  showTranscription = true,
  avatarPosition = 'right',
  onTranscriptionUpdate,
  className = '',
}: VideoAccessibilityPlayerProps) {
  // États modal avatar LSF
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // États d'accessibilité
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [currentGestures, setCurrentGestures] = useState<GestureData[]>([]);
  const [gestureFeedback, setGestureFeedback] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Services
  const speechService = useMemo(() => getSpeechToTextService(), []);
  const signLanguageService = useMemo(() => getSignLanguageService(), []);

  /**
   * Démarrer la traduction de la vidéo
   */
  const startTranslationToSignLanguage = useCallback(async () => {
    if (!videoRef.current || isTranscribing) return;

    try {
      setIsTranscribing(true);
      setTranscription('');
      setCurrentGestures([]);

      // Démarrer la transcription
      const finalText = await speechService.transcribeAudioElement(
        videoRef.current,
        {
          language: 'fr-FR',
          continuous: true,
          interimResults: true,
        },
        {
          onResult: (result: TranscriptionResult) => {
            setTranscription(result.text);
            onTranscriptionUpdate?.(result.text);

            // Traduire en gestes immédiatement
            const gestures = signLanguageService.translateToGestures(result.text, 'fr');
            setCurrentGestures(gestures);

            // Feedback
            if (gestures.length > 0) {
              setGestureFeedback(`${gestures.length} geste(s) détecté(s)`);
            }
          },
          onError: (error: string) => {
            console.error('Erreur de transcription:', error);
            setGestureFeedback('Erreur de transcription');
          },
          onComplete: (text: string) => {
            setTranscription(text);
            onTranscriptionUpdate?.(text);
            setGestureFeedback('Traduction terminée');
          },
        }
      );
    } catch (error) {
      console.error('Erreur lors de la traduction:', error);
      setGestureFeedback('Erreur lors de la traduction vidéo');
    } finally {
      setIsTranscribing(false);
    }
  }, [videoRef, speechService, signLanguageService, isTranscribing, onTranscriptionUpdate]);

  /**
   * Gérer la lecture/pause
   */
  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
      if (showAvatar && !isTranscribing) {
        startTranslationToSignLanguage();
      }
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, showAvatar, isTranscribing, startTranslationToSignLanguage]);

  /**
   * Gérer le son
   */
  const handleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  /**
   * Gérer le plein écran
   */
  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  /**
   * Événements vidéo
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
      speechService.stop();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      speechService.stop();
    };
  }, [speechService]);

  /**
   * Formater le temps
   */
  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`relative bg-black rounded-xl overflow-hidden shadow-2xl ${className}`}
        style={{ aspectRatio: '16/9', maxWidth: '100%' }}
      >
        {/* Vidéo - Plein écran */}
        <div className="w-full h-full bg-black relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
              <Loader className="w-8 h-8 animate-spin text-white" />
            </div>
          )}

          {/* Élément vidéo */}
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain bg-black"
            crossOrigin="anonymous"
          />

          {/* Overlay contrôles */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity"
            style={{ pointerEvents: 'none' }}
          >
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3" style={{ pointerEvents: 'auto' }}>
              {/* Barre de progression */}
              <div className="group cursor-pointer">
                <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0EA5E9] group-hover:h-1.5 transition-all"
                    style={{
                      width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Contrôles */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlayPause}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={handleMute}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>

                  <span className="text-xs text-white font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {showAvatar && (
                    <button
                      onClick={() => !isTranscribing && startTranslationToSignLanguage()}
                      disabled={isTranscribing}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isTranscribing
                          ? 'bg-yellow-500/50 text-white cursor-not-allowed'
                          : 'bg-[#0EA5E9]/80 hover:bg-[#0EA5E9] text-white'
                      }`}
                    >
                      {isTranscribing ? 'Traduction...' : 'LSF'}
                    </button>
                  )}

                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleFullscreen}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                  >
                    <div className="w-5 h-5 border-2 border-white" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Petit Avatar Réel - Bas Droit */}
          {showAvatar && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAvatarModal(true)}
              className="absolute bottom-4 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] border-2 border-white/20 shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-2xl hover:border-white/40"
            >
              <Users className="w-8 h-8 text-white" />
            </motion.button>
          )}

          {/* Transcription - Bas Gauche */}
          {showTranscription && transcription && (
            <div className="absolute bottom-4 left-4 right-20 max-h-20 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-black/80 backdrop-blur-sm rounded-lg border border-white/10"
              >
                <p className="text-xs font-bold text-[#0EA5E9] mb-1">Transcription:</p>
                <p className="text-xs text-gray-200 italic">{transcription}</p>
              </motion.div>
            </div>
          )}

          {/* Settings */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute top-4 right-4 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg p-4 z-50 min-w-[250px]"
              >
                <h3 className="text-sm font-bold text-white mb-3">Accessibilité</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAvatar}
                      readOnly
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-xs text-gray-300">Avatar traducteur LSF</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTranscription}
                      readOnly
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-xs text-gray-300">Afficher transcription</span>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal Avatar 3D LSF */}
      <AnimatePresence>
        {showAvatarModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAvatarModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-black rounded-2xl border-2 border-[#0EA5E9]/30 overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#0EA5E9]" />
                    Avatar Traducteur LSF
                  </h2>
                  {currentGestures.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      {currentGestures.length} geste(s) - {gestureFeedback}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowAvatarModal(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Avatar Canvas */}
              <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800">
                <SignLanguageAvatarCanvas
                  gestures={currentGestures}
                  isAnimating={isPlaying && isTranscribing}
                  width="100%"
                  height="400px"
                />
              </div>

              {/* Info Footer */}
              <div className="p-4 border-t border-white/10 bg-black/50">
                <p className="text-xs text-gray-300 text-center">
                  Cliquez sur "LSF" dans le lecteur pour activer la traduction • Fermez cette fenêtre pour revenir
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default VideoAccessibilityPlayer;
