/**
 * Service de Langage des Signes Français (LSF)
 * Traduit le texte en animations de gestes
 */

export interface GestureData {
  id: string;
  name: string;
  description: string;
  movement: {
    duration: number; // en ms
    hands: HandGesture[];
    bodyRotation?: number; // en degrés
    headTilt?: number; // en degrés
    facialExpression?: string;
  };
  confidence: number;
}

export interface HandGesture {
  hand: 'left' | 'right' | 'both';
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  fingers: FingerPosition[];
  speed: number; // vitesse du mouvement (0-1)
}

export interface FingerPosition {
  finger: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
  extended: boolean;
  curled: number; // 0-1
  rotation: { x: number; y: number; z: number };
}

interface WordGestureMapping {
  [key: string]: GestureData;
}

/**
 * Base de données de gestes LSF
 * Structure simplifiée pour la démo - à enrichir avec des animations réelles
 */
const GESTURE_DATABASE: WordGestureMapping = {
  // Gestes basiques courants
  hello: {
    id: 'hello',
    name: 'Bonjour',
    description: 'Geste de salutation',
    movement: {
      duration: 800,
      hands: [
        {
          hand: 'right',
          position: { x: 0.3, y: 0.2, z: 0.5 },
          rotation: { x: 0, y: 0, z: 0.2 },
          fingers: [
            { finger: 'thumb', extended: true, curled: 0, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'index', extended: true, curled: 0, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'middle', extended: true, curled: 0, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'ring', extended: false, curled: 1, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'pinky', extended: false, curled: 1, rotation: { x: 0, y: 0, z: 0 } },
          ],
          speed: 0.8,
        },
      ],
      bodyRotation: 0,
      headTilt: 0,
      facialExpression: 'smile',
    },
    confidence: 0.95,
  },

  thank: {
    id: 'thank',
    name: 'Merci',
    description: 'Geste de remerciement',
    movement: {
      duration: 600,
      hands: [
        {
          hand: 'both',
          position: { x: 0, y: 0.3, z: 0.5 },
          rotation: { x: -0.3, y: 0, z: 0 },
          fingers: [
            { finger: 'thumb', extended: true, curled: 0, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'index', extended: true, curled: 0, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'middle', extended: true, curled: 0, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'ring', extended: true, curled: 0, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'pinky', extended: true, curled: 0, rotation: { x: 0, y: 0, z: 0 } },
          ],
          speed: 0.7,
        },
      ],
      bodyRotation: 0,
      headTilt: 0,
      facialExpression: 'smile',
    },
    confidence: 0.92,
  },

  yes: {
    id: 'yes',
    name: 'Oui',
    description: 'Geste d\'affirmation',
    movement: {
      duration: 500,
      hands: [
        {
          hand: 'right',
          position: { x: 0.2, y: 0.1, z: 0.5 },
          rotation: { x: 0.3, y: 0, z: 0 },
          fingers: [
            { finger: 'thumb', extended: false, curled: 1, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'index', extended: true, curled: 0, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'middle', extended: false, curled: 1, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'ring', extended: false, curled: 1, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'pinky', extended: false, curled: 1, rotation: { x: 0, y: 0, z: 0 } },
          ],
          speed: 1,
        },
      ],
      bodyRotation: 0,
      headTilt: 0.2,
      facialExpression: 'neutral',
    },
    confidence: 0.9,
  },

  no: {
    id: 'no',
    name: 'Non',
    description: 'Geste de négation',
    movement: {
      duration: 800,
      hands: [
        {
          hand: 'both',
          position: { x: 0, y: 0.2, z: 0.5 },
          rotation: { x: 0, y: 0.5, z: 0 },
          fingers: [
            { finger: 'thumb', extended: true, curled: 0, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'index', extended: true, curled: 0, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'middle', extended: false, curled: 1, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'ring', extended: false, curled: 1, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'pinky', extended: false, curled: 1, rotation: { x: 0, y: 0, z: 0 } },
          ],
          speed: 0.6,
        },
      ],
      bodyRotation: 0,
      headTilt: -0.2,
      facialExpression: 'serious',
    },
    confidence: 0.89,
  },

  love: {
    id: 'love',
    name: 'Aimer',
    description: 'Geste d\'amour',
    movement: {
      duration: 1000,
      hands: [
        {
          hand: 'both',
          position: { x: 0, y: 0.3, z: 0.6 },
          rotation: { x: -0.2, y: 0, z: 0 },
          fingers: [
            { finger: 'thumb', extended: true, curled: 0, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'index', extended: true, curled: 0, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'middle', extended: false, curled: 0.8, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'ring', extended: false, curled: 0.8, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'pinky', extended: true, curled: 0, rotation: { x: 0, y: 0, z: 0 } },
          ],
          speed: 0.5,
        },
      ],
      bodyRotation: 0,
      headTilt: 0,
      facialExpression: 'smile',
    },
    confidence: 0.91,
  },

  sorry: {
    id: 'sorry',
    name: 'Désolé',
    description: 'Geste d\'excuse',
    movement: {
      duration: 900,
      hands: [
        {
          hand: 'right',
          position: { x: 0.15, y: 0.25, z: 0.5 },
          rotation: { x: -0.1, y: 0, z: 0 },
          fingers: [
            { finger: 'thumb', extended: false, curled: 1, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'index', extended: false, curled: 1, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'middle', extended: false, curled: 1, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'ring', extended: false, curled: 1, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'pinky', extended: false, curled: 1, rotation: { x: 0, y: 0, z: 0 } },
          ],
          speed: 0.4,
        },
      ],
      bodyRotation: -0.1,
      headTilt: 0.1,
      facialExpression: 'sad',
    },
    confidence: 0.88,
  },

  help: {
    id: 'help',
    name: 'Aide',
    description: 'Geste de demande d\'aide',
    movement: {
      duration: 700,
      hands: [
        {
          hand: 'right',
          position: { x: 0.25, y: 0.35, z: 0.5 },
          rotation: { x: -0.2, y: 0.1, z: 0 },
          fingers: [
            { finger: 'thumb', extended: true, curled: 0, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'index', extended: true, curled: 0, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'middle', extended: true, curled: 0, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'ring', extended: false, curled: 1, rotation: { x: 0, y: 0, z: 0 } },
            { finger: 'pinky', extended: false, curled: 1, rotation: { x: 0, y: 0, z: 0 } },
          ],
          speed: 0.75,
        },
      ],
      bodyRotation: 0,
      headTilt: 0,
      facialExpression: 'questioning',
    },
    confidence: 0.87,
  },
};

class SignLanguageService {
  private gestureDatabase: WordGestureMapping;

  constructor() {
    this.gestureDatabase = GESTURE_DATABASE;
  }

  /**
   * Transcrire du texte en suite de gestes
   */
  translateToGestures(text: string, language: string = 'fr'): GestureData[] {
    const words = text
      .toLowerCase()
      .split(/[\s,!?.;:]+/)
      .filter((w) => w.length > 0);

    const gestures: GestureData[] = [];

    for (const word of words) {
      const gesture = this.findGestureForWord(word, language);
      if (gesture) {
        gestures.push(gesture);
      }
    }

    return gestures;
  }

  /**
   * Chercher un geste pour un mot spécifique
   */
  private findGestureForWord(word: string, language: string = 'fr'): GestureData | null {
    // Recherche directe
    if (this.gestureDatabase[word]) {
      return this.gestureDatabase[word];
    }

    // Recherche par lemmatisation simple (formes courantes)
    const lemmaMap: { [key: string]: string } = {
      hello: 'hello',
      hi: 'hello',
      hey: 'hello',
      thanks: 'thank',
      thankyou: 'thank',
      merci: 'thank',
      oui: 'yes',
      ouiais: 'yes',
      non: 'no',
      nope: 'no',
      aimer: 'love',
      amour: 'love',
      j_aime: 'love',
      sorry: 'sorry',
      excuse: 'sorry',
      pardon: 'sorry',
      help: 'help',
      aide: 'help',
    };

    const lemma = lemmaMap[word];
    if (lemma && this.gestureDatabase[lemma]) {
      return this.gestureDatabase[lemma];
    }

    return null;
  }

  /**
   * Récupérer tous les gestes disponibles
   */
  getAllGestures(): GestureData[] {
    return Object.values(this.gestureDatabase);
  }

  /**
   * Ajouter un geste personnalisé à la base de données
   */
  addCustomGesture(gesture: GestureData): void {
    this.gestureDatabase[gesture.id] = gesture;
  }

  /**
   * Calculer le timing total pour une séquence de gestes
   */
  calculateTotalDuration(gestures: GestureData[]): number {
    return gestures.reduce((total, gesture) => {
      return total + gesture.movement.duration + 200; // 200ms entre chaque geste
    }, 0);
  }
}

// Singleton
let instance: SignLanguageService | null = null;

export const getSignLanguageService = (): SignLanguageService => {
  if (!instance) {
    instance = new SignLanguageService();
  }
  return instance;
};

export { SignLanguageService };
export type { GestureData, HandGesture, FingerPosition, WordGestureMapping };
