/**
 * Modal d'Affichage de la Traduction LSF d'un Texte
 * Utilise ProSignAvatar pour afficher les gestes LSF (backend + fallback local)
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, Volume2, Info, Hand } from 'lucide-react';
import { ProSignAvatar } from './sign-avatar/pro-sign-avatar';
import { useSignTranslation } from '../hooks/use-sign-translation';
import { getSpeechToTextService } from '../lib/services/speech-to-text.service';
import type { TranscriptionResult } from '../lib/services/speech-to-text.service';
import type { Frame, SignTranslationMetadata } from '../lib/services/sign-translation.service';

interface SignTranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
  videoUrl?: string;
  frames?: Frame[];
  metadata?: SignTranslationMetadata;
  isLoading?: boolean;
  error?: string | null;
}

export function SignTranslationModal({
  isOpen,
  onClose,
  text,
  frames,
  metadata,
  isLoading = false,
  error = null,
  videoUrl,
}: SignTranslationModalProps) {
  const lastTranslatedTextRef = useRef('');

  // Video translation states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [isVideoTranscribing, setIsVideoTranscribing] = useState(false);
  const speechService = useMemo(() => getSpeechToTextService(), []);
  const {
    isLoading: isVideoTranslationLoading,
    error: videoTranslationError,
    data: videoTranslationData,
    translate: translateVideoText,
    reset: resetVideoTranslation,
  } = useSignTranslation();

  useEffect(() => {
    if (isOpen) {
      setLiveTranscription('');
      setIsVideoTranscribing(false);
      lastTranslatedTextRef.current = '';
      resetVideoTranslation();
    } else {
      speechService.stop();
      if (videoRef.current) {
        videoRef.current.pause();
      }
      resetVideoTranslation();
      lastTranslatedTextRef.current = '';
    }
  }, [isOpen, speechService, resetVideoTranslation]);

  const translateTranscription = useCallback(
    async (transcription: string) => {
      const cleanText = transcription.trim();
      if (!cleanText || cleanText === lastTranslatedTextRef.current) {
        return;
      }

      lastTranslatedTextRef.current = cleanText;
      await translateVideoText(cleanText);
    },
    [translateVideoText],
  );

  const handleStartVideoTranslation = async () => {
    if (!videoRef.current || isVideoTranscribing) return;

    try {
      setIsVideoTranscribing(true);
      setLiveTranscription('');
      resetVideoTranslation();
      lastTranslatedTextRef.current = '';

      await speechService.transcribeAudioElement(
        videoRef.current,
        { language: 'fr-FR', continuous: true, interimResults: true },
        {
          onResult: (result: TranscriptionResult) => {
            setLiveTranscription(result.text);
            if (result.isFinal) {
              void translateTranscription(result.text);
            }
          },
          onError: (err: string) => {
            console.error('Erreur de transcription vidéo:', err);
            setIsVideoTranscribing(false);
            setLiveTranscription('Erreur: Impossible d\'extraire le texte. Le microphone est peut-être bloqué ou la voix est inaudible.');
          },
          onComplete: (finalText: string) => {
            const textToSet = finalText.trim() ? finalText : "Aucune voix détectée ou extraction impossible.";
            setLiveTranscription(textToSet);
            setIsVideoTranscribing(false);
            if (finalText.trim()) {
              void translateTranscription(finalText);
            }
          }
        }
      );
    } catch (err) {
      console.error(err);
      setIsVideoTranscribing(false);
    }
  };

  const textForDisplay = videoUrl
    ? (
      liveTranscription ||
      (isVideoTranscribing
        ? 'Extraction en cours...'
        : (text?.trim() || 'Veuillez scanner la video pour extraire le texte.'))
    )
    : text;

  const activeFrames = videoUrl ? (videoTranslationData?.frames ?? frames) : frames;
  const activeMetadata = videoUrl ? (videoTranslationData?.metadata ?? metadata) : metadata;
  const activeError = videoUrl ? (videoTranslationError || error) : error;
  const isAvatarLoading = videoUrl ? isVideoTranslationLoading : isLoading;
  const normalizedDisplayText = textForDisplay
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const normalizedGloss = (activeMetadata?.gloss || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const hasServerFrames = Boolean(activeFrames && activeFrames.length > 0);
  const isExplicitRealTranslation = activeMetadata?.translation_quality === 'real';
  const looksLikeMockGloss = !isExplicitRealTranslation
    && Boolean(normalizedDisplayText && normalizedGloss)
    && normalizedGloss === normalizedDisplayText.slice(0, normalizedGloss.length);
  // Keep backend frames whenever they exist; let ProSignAvatar decide motion quality.
  const shouldIgnoreServerFrames = !hasServerFrames && looksLikeMockGloss;
  const trustedFrames = shouldIgnoreServerFrames ? undefined : activeFrames;
  const trustedMetadata = shouldIgnoreServerFrames ? undefined : activeMetadata;
  const isUsingServerTranslation = Boolean(trustedFrames && trustedFrames.length > 0);

  const handleSpeak = () => {
    const textToSpeak = textForDisplay.trim();
    if (!textToSpeak) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Light Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              zIndex: 200,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl mx-auto p-4 md:p-0"
            style={{ zIndex: 201 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative rounded-3xl border border-gray-100 shadow-2xl overflow-hidden bg-white max-h-[90vh] flex flex-col">
              {/* Top gradient accent bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#0EA5E9] via-[#38BDF8] to-[#06B6D4] flex-shrink-0" />

              {/* Decorative glow circles */}
              <div
                className="absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-10 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, #38BDF8, transparent)',
                  filter: 'blur(60px)',
                }}
              />
              <div
                className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full opacity-5 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, #0EA5E9, transparent)',
                  filter: 'blur(50px)',
                }}
              />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content Container (scrollable) */}
              <div className="p-6 md:p-8 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 6px)' }}>
                <div className="flex flex-col md:flex-row gap-8">
                  
                  {/* Left Column: Text & Video */}
                  <div className="flex-1 md:w-[50%] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div
                        className="p-2.5 rounded-2xl flex-shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(6,182,212,0.12))',
                          border: '1px solid rgba(14,165,233,0.2)',
                        }}
                      >
                        <Hand className="w-6 h-6 text-[#0EA5E9]" />
                      </div>
                      <div>
                        <h2 className="text-gray-900 font-bold text-xl leading-tight">
                          Traduction LSF
                        </h2>
                        <p className="text-gray-500 text-xs mt-0.5 font-medium">
                          Langue des Signes Française
                        </p>
                      </div>
                    </div>

                    {/* Text extracted/original */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="rounded-2xl p-6 flex-1 mb-5"
                      style={{
                        background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <p className="text-xs font-bold text-[#0EA5E9] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        {videoUrl ? 'Texte extrait de la vidéo' : 'Texte original'}
                      </p>
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {textForDisplay}
                      </p>
                    </motion.div>

                    {/* Video Player */}
                    {videoUrl && (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-black rounded-2xl overflow-hidden shadow-lg border border-gray-100 mb-5 flex-shrink-0"
                      >
                        <video
                          ref={videoRef}
                          src={videoUrl}
                          className="w-full h-48 object-contain bg-black"
                          controls
                          crossOrigin="anonymous"
                          onEnded={() => {
                            setIsVideoTranscribing(false);
                          }}
                        />
                        <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {isVideoTranscribing
                              ? 'Extraction audio...'
                              : isVideoTranslationLoading
                                ? 'Traduction gestes...'
                                : 'Prêt pour l\'extraction'}
                          </p>
                          <motion.button
                            whileHover={!isVideoTranscribing ? { scale: 1.05 } : {}}
                            whileTap={!isVideoTranscribing ? { scale: 0.95 } : {}}
                            onClick={handleStartVideoTranslation}
                            disabled={isVideoTranscribing}
                            className={`text-xs px-4 py-2 rounded-xl font-bold transition-all ${
                              isVideoTranscribing
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white shadow-md hover:shadow-lg hover:shadow-[#0EA5E9]/20'
                            }`}
                          >
                            Scanner la vidéo
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {/* Info banner */}
                    <div className="p-4 rounded-xl flex items-start gap-3 mt-auto" style={{ background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.1)' }}>
                      <Info className="w-5 h-5 text-[#0EA5E9] flex-shrink-0" />
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        L'avatar affiche une interprétation LSF.
                        {isUsingServerTranslation
                          ? ' Les gestes proviennent du moteur de traduction.'
                          : ' Les gestes viennent du dictionnaire local LSF et de l\'épellation des mots inconnus.'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Vertical Divider */}
                  <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent flex-shrink-0" />

                  {/* Right Column: Avatar & Actions */}
                  <div className="flex-1 md:w-[50%] flex flex-col justify-between">
                    <div className="w-full relative rounded-3xl overflow-hidden flex-1 min-h-[350px] md:min-h-[420px]"
                      style={{
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
                      }}
                    >
                      {isAvatarLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center rounded-3xl"
                          style={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                          }}
                        >
                          <div className="flex flex-col items-center gap-4">
                            <div className="relative w-20 h-20">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-0 rounded-full"
                                style={{
                                  background: 'conic-gradient(from 0deg, transparent, #0EA5E9, #06B6D4, transparent)',
                                  maskImage: 'radial-gradient(transparent 55%, black 56%)',
                                  WebkitMaskImage: 'radial-gradient(transparent 55%, black 56%)',
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                  <Hand className="w-8 h-8 text-[#0EA5E9]" />
                                </motion.div>
                              </div>
                            </div>
                            <div className="text-center">
                              <p className="text-white font-bold text-lg">Préparation de l'avatar...</p>
                              <p className="text-sm text-gray-400 mt-1">Connexion au moteur LSF</p>
                            </div>
                          </div>
                        </div>
                      ) : activeError ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center rounded-3xl"
                          style={{
                            background: 'linear-gradient(135deg, #1a0a0a 0%, #2d1515 50%, #1a0a0a 100%)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                          }}
                        >
                           <div className="p-4 bg-red-900/30 rounded-full mb-3 border border-red-500/20">
                             <AlertCircle className="w-8 h-8 text-red-400" />
                           </div>
                           <p className="text-sm font-bold text-red-300">{activeError}</p>
                           <p className="text-xs text-red-400/70 mt-1">L'avatar utilisera un mode hors ligne simplifié.</p>
                        </div>
                      ) : (
                        <div className="absolute inset-0 rounded-3xl overflow-hidden"
                          style={{
                            border: '1px solid rgba(59, 130, 246, 0.15)',
                            boxShadow: 'inset 0 0 60px rgba(59, 130, 246, 0.05)',
                          }}
                        >
                          <ProSignAvatar
                            text={textForDisplay}
                            frames={trustedFrames}
                            metadata={trustedMetadata}
                            autoPlay={videoUrl ? (!!liveTranscription || isVideoTranscribing || isVideoTranslationLoading) : true}
                            width="100%"
                            height="100%"
                            showControls={true}
                            isDark={true}
                            style="realistic"
                          />
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mt-6 flex flex-col gap-3 flex-shrink-0"
                    >
                      <motion.button
                        whileHover={!(isAvatarLoading || !!activeError) ? { scale: 1.02 } : {}}
                        whileTap={!(isAvatarLoading || !!activeError) ? { scale: 0.98 } : {}}
                        onClick={handleSpeak}
                        disabled={isAvatarLoading || !!activeError || !textForDisplay.trim()}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white shadow-lg shadow-[#0EA5E9]/20 hover:shadow-xl hover:shadow-[#0EA5E9]/30 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                      >
                        <Volume2 className="w-5 h-5" />
                        Écouter la traduction
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ backgroundColor: '#f9fafb' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        className="w-full py-4 rounded-xl font-bold text-sm text-gray-500 hover:text-gray-700 transition-all border border-transparent hover:border-gray-100"
                      >
                        Fermer la fenêtre
                      </motion.button>
                    </motion.div>
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
