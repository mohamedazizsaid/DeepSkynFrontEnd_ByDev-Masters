'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { faceVerificationService, type FaceVerificationResult } from '../services/face-verification.service';

interface UseFaceVerificationReturn {
  isLoading: boolean;
  isModelLoaded: boolean;
  error: string | null;
  verificationResult: FaceVerificationResult | null;
  loadModels: () => Promise<void>;
  verifyFromVideo: (videoElement: HTMLVideoElement) => Promise<FaceVerificationResult | null>;
  verifyFromCanvas: (canvas: HTMLCanvasElement) => Promise<FaceVerificationResult | null>;
  verifyFromImage: (imageElement: HTMLImageElement) => Promise<FaceVerificationResult | null>;
  extractDescriptorFromImage: (imageElement: HTMLImageElement) => Promise<number[] | null>;
  registerFromProfilePhoto: (imageElement: HTMLImageElement) => Promise<boolean>;
  reset: () => void;
}

// Chemins des modèles face-api.js (à placer dans /public/models)
const MODEL_URL = '/models';

export function useFaceVerification(): UseFaceVerificationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<FaceVerificationResult | null>(null);
  
  const modelsLoadedRef = useRef(false);

  /**
   * Charge les modèles face-api.js nécessaires
   */
  const loadModels = useCallback(async () => {
    if (modelsLoadedRef.current) {
      setIsModelLoaded(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      
      modelsLoadedRef.current = true;
      setIsModelLoaded(true);
    } catch (err) {
      console.error('Erreur lors du chargement des modèles face-api:', err);
      setError('Impossible de charger les modèles de reconnaissance faciale');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Extrait le descripteur facial d'un élément (video, canvas, image)
   */
  const extractFaceDescriptor = async (
    input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
  ): Promise<{ descriptor: number[]; imageBase64: string } | null> => {
    if (!modelsLoadedRef.current) {
      throw new Error('Les modèles ne sont pas chargés');
    }

    // Détecter le visage avec landmarks et descriptor
    const detection = await faceapi
      .detectSingleFace(input)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return null;
    }

    // Convertir en base64
    const canvas = document.createElement('canvas');
    if (input instanceof HTMLVideoElement) {
      canvas.width = input.videoWidth;
      canvas.height = input.videoHeight;
    } else {
      canvas.width = input.width;
      canvas.height = input.height;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(input, 0, 0);
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    return {
      descriptor: Array.from(detection.descriptor),
      imageBase64,
    };
  };

  /**
   * Extrait uniquement le descripteur facial d'une image
   */
  const extractDescriptorFromImage = useCallback(async (
    imageElement: HTMLImageElement
  ): Promise<number[] | null> => {
    if (!modelsLoadedRef.current) {
      await loadModels();
    }

    try {
      const detection = await faceapi
        .detectSingleFace(imageElement)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return null;
      }

      return Array.from(detection.descriptor);
    } catch (err) {
      console.error('Erreur lors de l\'extraction du descripteur:', err);
      return null;
    }
  }, [loadModels]);

  /**
   * Enregistre le visage depuis la photo de profil
   */
  const registerFromProfilePhoto = useCallback(async (
    imageElement: HTMLImageElement
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const descriptor = await extractDescriptorFromImage(imageElement);
      
      if (!descriptor) {
        setError('Aucun visage détecté dans la photo de profil');
        return false;
      }

      await faceVerificationService.registerFromProfile({ descriptor });
      return true;
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setError('Erreur lors de l\'enregistrement de la référence faciale');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [extractDescriptorFromImage]);

  /**
   * Vérifie le visage depuis un élément vidéo
   */
  const verifyFromVideo = useCallback(async (
    videoElement: HTMLVideoElement
  ): Promise<FaceVerificationResult | null> => {
    setIsLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      const faceData = await extractFaceDescriptor(videoElement);
      
      if (!faceData) {
        const result: FaceVerificationResult = {
          verified: false,
          confidence: 0,
          message: 'Aucun visage détecté. Veuillez positionner votre visage devant la caméra.',
          needsProfilePhoto: false,
        };
        setVerificationResult(result);
        return result;
      }

      const result = await faceVerificationService.verify({
        descriptor: faceData.descriptor,
        imageBase64: faceData.imageBase64,
      });

      setVerificationResult(result);
      return result;
    } catch (err) {
      console.error('Erreur lors de la vérification faciale:', err);
      setError('Erreur lors de la vérification faciale');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Vérifie le visage depuis un canvas
   */
  const verifyFromCanvas = useCallback(async (
    canvas: HTMLCanvasElement
  ): Promise<FaceVerificationResult | null> => {
    setIsLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      const faceData = await extractFaceDescriptor(canvas);
      
      if (!faceData) {
        const result: FaceVerificationResult = {
          verified: false,
          confidence: 0,
          message: 'Aucun visage détecté dans l\'image.',
          needsProfilePhoto: false,
        };
        setVerificationResult(result);
        return result;
      }

      const result = await faceVerificationService.verify({
        descriptor: faceData.descriptor,
        imageBase64: faceData.imageBase64,
      });

      setVerificationResult(result);
      return result;
    } catch (err) {
      console.error('Erreur lors de la vérification faciale:', err);
      setError('Erreur lors de la vérification faciale');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Vérifie le visage depuis une image
   */
  const verifyFromImage = useCallback(async (
    imageElement: HTMLImageElement
  ): Promise<FaceVerificationResult | null> => {
    setIsLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      const faceData = await extractFaceDescriptor(imageElement);
      
      if (!faceData) {
        const result: FaceVerificationResult = {
          verified: false,
          confidence: 0,
          message: 'Aucun visage détecté dans l\'image.',
          needsProfilePhoto: false,
        };
        setVerificationResult(result);
        return result;
      }

      const result = await faceVerificationService.verify({
        descriptor: faceData.descriptor,
        imageBase64: faceData.imageBase64,
      });

      setVerificationResult(result);
      return result;
    } catch (err) {
      console.error('Erreur lors de la vérification faciale:', err);
      setError('Erreur lors de la vérification faciale');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Réinitialise l'état
   */
  const reset = useCallback(() => {
    setVerificationResult(null);
    setError(null);
  }, []);

  return {
    isLoading,
    isModelLoaded,
    error,
    verificationResult,
    loadModels,
    verifyFromVideo,
    verifyFromCanvas,
    verifyFromImage,
    extractDescriptorFromImage,
    registerFromProfilePhoto,
    reset,
  };
}
