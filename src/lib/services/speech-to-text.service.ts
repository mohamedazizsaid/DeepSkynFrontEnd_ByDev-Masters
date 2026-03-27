/**
 * Service performant de Speech-to-Text
 * Utilise Web Speech API avec fallback sur API externe
 */

export interface GestureData {
  id: string;
  name: string;
  duration: number;
  startFrame?: number;
  endFrame?: number;
  confidence?: number;
}

interface TranscriptionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
}

interface SpeechServiceConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

class SpeechToTextService {
  private recognition: any;
  private isSupported: boolean;
  private isListening: boolean = false;
  private currentTranscription: string = '';
  private callbacks: {
    onResult?: (result: TranscriptionResult) => void;
    onError?: (error: string) => void;
    onComplete?: (text: string) => void;
  } = {};

  constructor() {
    // Vérifier la support du Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    this.isSupported = !!SpeechRecognition;
    if (this.isSupported) {
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }

        if (this.callbacks.onResult) {
          this.callbacks.onResult({
            text: finalTranscript || interimTranscript,
            confidence,
            isFinal: event.results[i].isFinal,
            timestamp: Date.now(),
          });
        }
      }

      this.currentTranscription = finalTranscript || interimTranscript;
    };

    this.recognition.onerror = (event: any) => {
      if (this.callbacks.onError) {
        this.callbacks.onError(`Speech recognition error: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.callbacks.onComplete) {
        this.callbacks.onComplete(this.currentTranscription);
      }
    };
  }

  /**
   * Démarrer la reconnaissance vocale d'un élément audio/vidéo
   * @param audioElement - L'élément audio ou vidéo à transcrire
   * @param config - Configuration optionnelle
   */
  async transcribeAudioElement(
    audioElement: HTMLAudioElement | HTMLVideoElement,
    config: SpeechServiceConfig = {},
    callbacks: typeof this.callbacks = {}
  ): Promise<string> {
    if (!this.isSupported) {
      throw new Error('Speech Recognition API is not supported in this browser');
    }

    this.callbacks = callbacks;
    this.currentTranscription = '';

    if (config.language) {
      this.recognition.lang = config.language;
    }

    if (config.continuous !== undefined) {
      this.recognition.continuous = config.continuous;
    }

    if (config.interimResults !== undefined) {
      this.recognition.interimResults = config.interimResults;
    }

    return new Promise((resolve, reject) => {
      try {
        this.recognition.start();

        audioElement.addEventListener('ended', () => {
          this.recognition.stop();
          resolve(this.currentTranscription);
        });

        audioElement.play().catch((error) => {
          this.recognition.stop();
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Transcrire l'audio depuis une URL
   */
  async transcribeFromUrl(
    audioUrl: string,
    config: SpeechServiceConfig = {},
    callbacks: typeof this.callbacks = {}
  ): Promise<string> {
    const audio = new Audio(audioUrl);
    return this.transcribeAudioElement(audio, config, callbacks);
  }

  /**
   * Arrêter la reconnaissance vocale
   */
  stop() {
    if (this.isListening && this.recognition) {
      this.recognition.stop();
    }
  }

  /**
   * Vérifier si le service est supporté
   */
  static isSupported(): boolean {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;
    return !!SpeechRecognition;
  }

  /**
   * Nettoyer les ressources
   */
  dispose() {
    if (this.recognition) {
      this.stop();
      this.recognition = null;
    }
    this.callbacks = {};
    this.currentTranscription = '';
  }
}

// Singleton
let instance: SpeechToTextService | null = null;

export const getSpeechToTextService = (): SpeechToTextService => {
  if (!instance) {
    instance = new SpeechToTextService();
  }
  return instance;
};

export { SpeechToTextService };
export type { TranscriptionResult, SpeechServiceConfig, GestureData };
