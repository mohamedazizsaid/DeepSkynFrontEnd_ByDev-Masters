export interface Keypoint {
  id: string;
  x: number;
  y: number;
  z: number;
}

export interface Frame {
  hand_right_keypoints: Keypoint[];
  hand_left_keypoints: Keypoint[];
  pose_keypoints: Keypoint[];
}

export interface SignTranslationMetadata {
  gloss: string;
  fps: number;
  total_frames: number;
  duration_ms?: number;
  sign_language?: string;
  translation_quality?: 'real' | 'mock';
  source?: string;
}

export interface SignTranslationResponse {
  frames: Frame[];
  metadata: SignTranslationMetadata;
}
