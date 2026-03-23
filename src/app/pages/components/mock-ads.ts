import type { AdData } from './ad-card';

export const MOCK_ADS: AdData[] = [
  {
    id: 'ad1',
    title: 'Routine Skincare Complète',
    description:
      'Découvrez notre kit complet avec nettoyant, sérum et hydratant. Spécialement développé pour les peaux sensibles.',
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&h=400&fit=crop',
    link: '#',
    sponsor: 'DeepSkyn Beauty',
  },
  {
    id: 'ad2',
    title: 'Analyseur Cutané IA - GRATUIT',
    description:
      'Testez notre IA révolutionnaire qui analyse votre peau en 30 secondes. Obtenez une routine personnalisée adaptée à vos besoins.',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=400&fit=crop',
    link: '#',
    sponsor: 'DeepSkyn AI Labs',
  },
  {
    id: 'ad3',
    title: 'Consultation Dermo Premium',
    description:
      'Consultez un dermatologue agréé en ligne. Diagnostic professionnel en 24h. Première consultation à prix réduit.',
    image: 'https://images.unsplash.com/photo-1576091160399-5f9e5c3e5c0e?w=600&h=400&fit=crop',
    link: '#',
    sponsor: 'DermaConsult',
  },
  {
    id: 'ad4',
    title: 'SPF Minéral Haute Protection',
    description:
      'Protection UV 100% minérale. Non comédogène, idéale pour les peaux sensibles. Application facile, finition matte.',
    image: 'https://images.unsplash.com/photo-1570194065650-cd4628902426?w=600&h=400&fit=crop',
    link: '#',
    sponsor: 'SunFlow Pro',
  },
];

export function getAdsForFeed(totalPosts: number): AdData[] {
  // Insert ads every 4-5 posts
  const ads: AdData[] = [];
  const adsPerFeed = Math.ceil(totalPosts / 5);
  const shuffledAds = [...MOCK_ADS].sort(() => Math.random() - 0.5);

  return shuffledAds.slice(0, Math.min(adsPerFeed, MOCK_ADS.length));
}

export function interleaveFeedWithAds(posts: any[], ads: AdData[]) {
  const result: any[] = [];
  let adIndex = 0;
  const postsPerAd = Math.floor(posts.length / (ads.length + 1)) || 4;

  posts.forEach((post, index) => {
    result.push({ type: 'post', data: post });
    if (
      (index + 1) % postsPerAd === 0 &&
      adIndex < ads.length
    ) {
      result.push({ type: 'ad', data: ads[adIndex] });
      adIndex++;
    }
  });

  return result;
}
