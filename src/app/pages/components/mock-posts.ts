import type { PostCardData } from './post-card';

export const MOCK_POSTS: PostCardData[] = [
  {
    id: '1',
    userId: 'user1',
    userName: 'Emma Laurent',
    userAvatar: 'https://ui-avatars.com/api/?name=Emma+Laurent&background=0EA5E9&color=fff',
    content:
      'Découvrez ma nouvelle routine skincare ! Après 3 mois de test, ma peau est enfin claire et hydratée. Les secrets : 1️⃣ Nettoyage doux matin et soir 2️⃣ Sérum vitamine C 3️⃣ Hydratant riche en soir. Qui d\'entre vous a une routine similaire ? 🧴✨',
    media: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&h=400&fit=crop',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likes: 324,
    comments: 48,
    shares: 12,
    isLiked: false,
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'Sophie Mercier',
    userAvatar: 'https://ui-avatars.com/api/?name=Sophie+Mercier&background=06B6D4&color=fff',
    content:
      'Avant/après 6 mois avec la gamme DeepSkyn 💙 Je suis TELLEMENT contente des résultats ! Fini les rougeurs et l\'acné hormonale. Merci beaucoup pour ces produits de qualité !',
    media: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=400&fit=crop',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    likes: 512,
    comments: 89,
    shares: 34,
    isLiked: false,
  },
  {
    id: '3',
    userId: 'user3',
    userName: 'Marie Chen',
    userAvatar: 'https://ui-avatars.com/api/?name=Marie+Chen&background=F9A8D4&color=fff',
    content:
      'Conseil skincare du jour : Ne sous-estimez pas l\'importance de l\'hydratation ! Une peau bien hydratée est une peau saine et granuleuse. Pensez à boire 2-3 litres d\'eau par jour et utilisez un bon hydratant adapté à votre type de peau 💧',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    likes: 203,
    comments: 32,
    shares: 15,
    isLiked: false,
  },
  {
    id: '4',
    userId: 'user4',
    userName: 'Lena K.',
    userAvatar: 'https://ui-avatars.com/api/?name=Lena+K&background=FED7AA&color=fff',
    content:
      'QUI D\'AUTRE souffre de sensibilité cutanée ? 🙋‍♀️ J\'ai enfin trouvé des produits adaptés à ma peau sensible. Pas de parabènes, pas d\'alcool, juste des ingrédients doux et efficaces. Ma peau n\'a jamais été mieux !',
    media: 'https://images.unsplash.com/photo-1570194065650-cd4628902426?w=600&h=400&fit=crop',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    likes: 445,
    comments: 67,
    shares: 28,
    isLiked: false,
  },
  {
    id: '5',
    userId: 'user5',
    userName: 'Julie Rosset',
    userAvatar: 'https://ui-avatars.com/api/?name=Julie+Rosset&background=A78BFA&color=fff',
    content:
      'Routines du matin vs routines du soir. Laquelle est la plus importante ? 🤔 \n\n✨ Matin: Nettoyage + Quartz fluide + Hydratant léger + SPF 50+\n✨ Soir: Nettoyage doux + Sérums/actifs + Masque 1x par semaine\n\nMerci d\'avancer votre avis ! 👇',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    likes: 178,
    comments: 54,
    shares: 18,
    isLiked: false,
  },
];
