// Validation constants
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_REGEX: /^[a-zA-Z0-9_]+$/,
  PHONE_REGEX: /^[\d\s\-\+\(\)]+$/,
  FILE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  IMAGE_MAX_WIDTH: 5000,
  IMAGE_MAX_HEIGHT: 5000,
};

export const ERROR_MESSAGES = {
  INVALID_EMAIL: 'Veuillez entrer une adresse email valide',
  PASSWORD_TOO_SHORT: `Le mot de passe doit contenir au moins ${VALIDATION.PASSWORD_MIN_LENGTH} caractères`,
  USERNAME_INVALID: 'Le nom d\'utilisateur doit contenir au moins 3 caractères',
  FILE_TOO_LARGE: 'Le fichier dépasse la taille maximale autorisée',
  INVALID_FILE_TYPE: 'Type de fichier non autorisé',
  NETWORK_ERROR: 'Erreur réseau. Veuillez vérifier votre connexion',
  SERVER_ERROR: 'Erreur serveur. Veuillez réessayer',
  UNAUTHORIZED: 'Non authentifié. Veuillez vous connecter',
  FORBIDDEN: 'Accès refusé',
  NOT_FOUND: 'Ressource non trouvée',
};

export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profil mis à jour avec succès',
  POST_CREATED: 'Post publié avec succès',
  LOGOUT_SUCCESS: 'Déconnexion réussie',
  PASSWORD_CHANGED: 'Mot de passe changé avec succès',
};
