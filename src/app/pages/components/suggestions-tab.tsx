import React from 'react';
import { motion } from 'motion/react';
import { UserPlus, Sparkles, Users } from 'lucide-react';
import { useAccessibilityStore } from '../../../stores/accessibility.store';

interface SuggestedUser {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  mutualFriends?: number;
  skinType?: string;
}

const MOCK_SUGGESTIONS: SuggestedUser[] = [
  { id: 'u1', name: 'Amira Ben Salah', avatar: 'https://ui-avatars.com/api/?name=Amira+BS&background=F472B6&color=fff', bio: 'Passionnée skincare 🧴 Routine naturelle', mutualFriends: 5, skinType: 'Mixte' },
  { id: 'u2', name: 'Yasmine Trabelsi', avatar: 'https://ui-avatars.com/api/?name=Yasmine+T&background=60A5FA&color=fff', bio: 'Dermatologue en formation 👩‍⚕️', mutualFriends: 3, skinType: 'Sensible' },
  { id: 'u3', name: 'Nour El Houda', avatar: 'https://ui-avatars.com/api/?name=Nour+EH&background=34D399&color=fff', bio: 'Avant/après avec DeepSkyn ✨', mutualFriends: 8, skinType: 'Sèche' },
  { id: 'u4', name: 'Salma Khelifi', avatar: 'https://ui-avatars.com/api/?name=Salma+K&background=A78BFA&color=fff', bio: 'Clean beauty enthusiast 🌿', mutualFriends: 2, skinType: 'Grasse' },
  { id: 'u5', name: 'Ines Mansouri', avatar: 'https://ui-avatars.com/api/?name=Ines+M&background=FB923C&color=fff', bio: 'K-beauty addict 🇰🇷', mutualFriends: 4, skinType: 'Normale' },
  { id: 'u6', name: 'Rania Bouazizi', avatar: 'https://ui-avatars.com/api/?name=Rania+B&background=F87171&color=fff', bio: 'Skincare minimaliste 💧', mutualFriends: 6, skinType: 'Mixte' },
  { id: 'u7', name: 'Hajer Mejri', avatar: 'https://ui-avatars.com/api/?name=Hajer+M&background=2DD4BF&color=fff', bio: 'Maman & skincare routine', mutualFriends: 1, skinType: 'Sensible' },
  { id: 'u8', name: 'Selma Gharbi', avatar: 'https://ui-avatars.com/api/?name=Selma+G&background=818CF8&color=fff', bio: 'DIY masques naturels 🍯', mutualFriends: 7, skinType: 'Sèche' },
];

interface SuggestionCardProps {
  user: SuggestedUser;
  onFollow: (id: string) => void;
  isFollowing: boolean;
}

function SuggestionCard({ user, onFollow, isFollowing }: SuggestionCardProps) {
  const { theme, contrastMode } = useAccessibilityStore();
  const isDark = theme === 'dark';
  const isHcHigh = contrastMode === 'high';

  const cardBg = isHcHigh ? 'bg-black border-2 border-yellow-400' : isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#E5E7EB]';
  const textColor = isHcHigh ? 'text-cyan-400' : isDark ? 'text-gray-200' : 'text-[#111827]';
  const subText = isHcHigh ? 'text-yellow-300' : isDark ? 'text-gray-400' : 'text-[#6B7280]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`rounded-2xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${cardBg}`}
    >
      {/* Banner */}
      <div className={`h-16 ${isHcHigh ? 'bg-gradient-to-r from-yellow-600 to-yellow-800' : 'bg-gradient-to-r from-[#0EA5E9]/20 to-[#8B5CF6]/20'}`} />

      <div className="px-4 pb-4 -mt-8">
        {/* Avatar */}
        <div className="flex justify-center mb-3">
          <div className={`w-16 h-16 rounded-full border-4 overflow-hidden shadow-md ${isHcHigh ? 'border-black' : isDark ? 'border-[#1e293b]' : 'border-white'}`}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white font-bold text-lg">
                {user.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="text-center mb-3">
          <h4 className={`font-semibold text-sm ${textColor} truncate`}>{user.name}</h4>
          {user.bio && <p className={`text-xs ${subText} mt-0.5 line-clamp-1`}>{user.bio}</p>}
          <div className="flex items-center justify-center gap-2 mt-1.5">
            {user.skinType && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isHcHigh ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400' : 'bg-[#0EA5E9]/10 text-[#0EA5E9]'}`}>
                Peau {user.skinType}
              </span>
            )}
            {user.mutualFriends && user.mutualFriends > 0 && (
              <span className={`text-[10px] ${subText} flex items-center gap-0.5`}>
                <Users className="w-2.5 h-2.5" />
                {user.mutualFriends} en commun
              </span>
            )}
          </div>
        </div>

        {/* Follow Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onFollow(user.id)}
          className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            isFollowing
              ? (isHcHigh ? 'bg-black border-2 border-yellow-400 text-yellow-400' : isDark ? 'bg-[#334155] text-gray-300' : 'bg-[#F3F4F6] text-[#6B7280]')
              : (isHcHigh ? 'bg-yellow-400 text-black' : 'bg-[#0EA5E9] text-white hover:bg-[#0284C7]')
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          {isFollowing ? 'Suivi' : "S'abonner"}
        </motion.button>
      </div>
    </motion.div>
  );
}

interface SuggestionsTabProps {
  onFollow?: (id: string) => void;
}

export function SuggestionsTab({ onFollow }: SuggestionsTabProps) {
  const [following, setFollowing] = React.useState<Set<string>>(new Set());
  const { theme, contrastMode } = useAccessibilityStore();
  const isDark = theme === 'dark';
  const isHcHigh = contrastMode === 'high';

  const textColor = isHcHigh ? 'text-cyan-400' : isDark ? 'text-gray-200' : 'text-[#111827]';
  const subText = isHcHigh ? 'text-yellow-300' : isDark ? 'text-gray-400' : 'text-[#6B7280]';

  const handleFollow = (id: string) => {
    setFollowing(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    onFollow?.(id);
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2.5 rounded-xl ${isHcHigh ? 'bg-yellow-400/20' : 'bg-gradient-to-br from-[#0EA5E9]/10 to-[#8B5CF6]/10'}`}>
            <Sparkles className={`w-5 h-5 ${isHcHigh ? 'text-yellow-400' : 'text-[#0EA5E9]'}`} />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${textColor}`}>Suggestions pour vous</h2>
            <p className={`text-xs ${subText}`}>Des passionnés skincare qui partagent vos préoccupations</p>
          </div>
        </div>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {MOCK_SUGGESTIONS.map((user, i) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <SuggestionCard
              user={user}
              onFollow={handleFollow}
              isFollowing={following.has(user.id)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
