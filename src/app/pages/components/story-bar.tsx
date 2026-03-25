import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAccessibilityStore } from '../../../stores/accessibility.store';

interface StoryUser {
  id: string;
  name: string;
  avatar?: string;
  hasStory?: boolean;
  isViewed?: boolean;
}

const MOCK_STORIES: StoryUser[] = [
  { id: 's1', name: 'Emma L.', avatar: 'https://ui-avatars.com/api/?name=Emma+L&background=F9A8D4&color=fff', hasStory: true },
  { id: 's2', name: 'Sophie M.', avatar: 'https://ui-avatars.com/api/?name=Sophie+M&background=06B6D4&color=fff', hasStory: true },
  { id: 's3', name: 'Marie C.', avatar: 'https://ui-avatars.com/api/?name=Marie+C&background=A78BFA&color=fff', hasStory: true, isViewed: true },
  { id: 's4', name: 'Lena K.', avatar: 'https://ui-avatars.com/api/?name=Lena+K&background=FED7AA&color=fff', hasStory: true },
  { id: 's5', name: 'Julie R.', avatar: 'https://ui-avatars.com/api/?name=Julie+R&background=34D399&color=fff', hasStory: true },
  { id: 's6', name: 'Clara D.', avatar: 'https://ui-avatars.com/api/?name=Clara+D&background=F87171&color=fff', hasStory: true, isViewed: true },
  { id: 's7', name: 'Nina B.', avatar: 'https://ui-avatars.com/api/?name=Nina+B&background=60A5FA&color=fff', hasStory: true },
];

interface StoryBarProps {
  currentUserAvatar?: string;
  currentUserName?: string;
}

export function StoryBar({ currentUserAvatar, currentUserName = 'Vous' }: StoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { theme, contrastMode } = useAccessibilityStore();
  const isDark = theme === 'dark';
  const isHcHigh = contrastMode === 'high';

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  const cardBg = isHcHigh ? 'bg-black border-yellow-400' : isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#E5E7EB]';
  const textColor = isHcHigh ? 'text-cyan-400' : isDark ? 'text-gray-200' : 'text-[#111827]';
  const subText = isHcHigh ? 'text-yellow-400' : isDark ? 'text-gray-400' : 'text-[#6B7280]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border shadow-sm p-4 mb-4 relative ${cardBg}`}
    >
      <div className="relative">
        <button onClick={() => scroll('left')} className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full shadow-lg flex items-center justify-center ${isHcHigh ? 'bg-black border border-yellow-400 text-yellow-400' : 'bg-white/90 text-gray-600 hover:bg-white'} transition-all`}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={() => scroll('right')} className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full shadow-lg flex items-center justify-center ${isHcHigh ? 'bg-black border border-yellow-400 text-yellow-400' : 'bg-white/90 text-gray-600 hover:bg-white'} transition-all`}>
          <ChevronRight className="w-4 h-4" />
        </button>

        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide px-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* Create Story */}
          <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0">
            <div className="relative">
              <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${isHcHigh ? 'border-yellow-400' : 'border-[#E5E7EB]'}`}>
                {currentUserAvatar ? (
                  <img src={currentUserAvatar} alt="You" className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-lg font-bold ${isHcHigh ? 'bg-black text-cyan-400' : 'bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white'}`}>
                    {currentUserName.charAt(0)}
                  </div>
                )}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 ${isHcHigh ? 'bg-yellow-400 border-black text-black' : 'bg-[#0EA5E9] border-white text-white'}`}>
                <Plus className="w-3 h-3" />
              </div>
            </div>
            <span className={`text-[10px] font-medium ${subText} w-16 text-center truncate`}>Votre story</span>
          </motion.div>

          {/* Stories */}
          {MOCK_STORIES.map((story) => (
            <motion.div key={story.id} whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0">
              <div className={`w-16 h-16 rounded-full p-[2.5px] ${story.isViewed
                ? (isHcHigh ? 'bg-gray-600' : 'bg-gray-300')
                : (isHcHigh ? 'bg-yellow-400' : 'bg-gradient-to-tr from-[#0EA5E9] via-[#8B5CF6] to-[#EC4899]')
              }`}>
                <div className={`w-full h-full rounded-full overflow-hidden border-2 ${isHcHigh ? 'border-black' : isDark ? 'border-[#1e293b]' : 'border-white'}`}>
                  {story.avatar ? (
                    <img src={story.avatar} alt={story.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 font-bold">{story.name.charAt(0)}</div>
                  )}
                </div>
              </div>
              <span className={`text-[10px] font-medium ${subText} w-16 text-center truncate`}>{story.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
