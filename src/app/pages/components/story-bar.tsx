import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAccessibilityStore } from '../../../stores/accessibility.store';

export interface StoryItem {
  id: string;
  mediaUrl: string;
  createdAt: string;
  musicUrl?: string;
  musicTitle?: string;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
}

export interface StoryUser {
  id: string; // userId
  name: string;
  avatar?: string;
  items: StoryItem[];
  isAllViewed?: boolean;
}

interface StoryBarProps {
  currentUserAvatar?: string;
  currentUserName?: string;
  stories?: StoryUser[];
  myStory?: StoryUser | null;
  onAddClick?: () => void;
  onStoryClick?: (index: number) => void;
  onMyStoryClick?: () => void;
}

export function StoryBar({ 
  currentUserAvatar, 
  currentUserName = 'Vous', 
  stories = [], 
  myStory = null,
  onAddClick, 
  onStoryClick,
  onMyStoryClick
}: StoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { theme, contrastMode } = useAccessibilityStore();
  const isDark = theme === 'dark';
  const isHcHigh = contrastMode === 'high';

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: dir === 'left' ? -300 : 300,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative mb-6">
      <button 
        onClick={() => scroll('left')}
        className={`absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 p-1.5 rounded-full shadow-md bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 lg:hidden`}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x px-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Current User Add Story */}
        <motion.div 
          whileHover={{ scale: 1.05 }} 
          className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0"
        >
          <div 
            className={`relative w-16 h-16 rounded-full p-[2.5px] ${myStory 
              ? (isHcHigh ? 'bg-yellow-400' : 'bg-gradient-to-tr from-[#0EA5E9] via-[#8B5CF6] to-[#EC4899]') 
              : 'bg-transparent'
            }`}
            onClick={() => myStory ? onMyStoryClick?.() : onAddClick?.()}
          >
            <div className={`w-full h-full rounded-full overflow-hidden border-2 bg-white dark:bg-black ${isHcHigh ? 'border-yellow-400 bg-black' : 'border-white dark:border-[#1e293b]'}`}>
              {currentUserAvatar ? (
                <img src={currentUserAvatar} alt="Vous" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 bg-gray-100 dark:bg-gray-800">
                  {currentUserName.charAt(0)}
                </div>
              )}
            </div>
            <div 
              onClick={(e) => { e.stopPropagation(); onAddClick?.(); }}
              className={`absolute bottom-0 right-0 w-5 h-5 bg-[#0EA5E9] border-2 border-white dark:border-[#1e293b] rounded-full flex items-center justify-center z-10 hover:bg-[#0284c7] transition-colors`}
            >
              <Plus className="w-3 h-3 text-white" />
            </div>
          </div>
          <span className={`text-xs font-medium ${isHcHigh ? 'text-cyan-400' : isDark ? 'text-gray-300' : 'text-[#374151]'}`}>
            Votre story
          </span>
        </motion.div>

        {/* Stories */}
        {stories.map((storyUser, index) => (
          <motion.div 
            key={storyUser.id} 
            whileHover={{ scale: 1.05 }} 
            onClick={() => onStoryClick && onStoryClick(index)}
            className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0"
          >
            <div className={`w-16 h-16 rounded-full p-[2.5px] ${storyUser.isAllViewed
              ? (isHcHigh ? 'bg-gray-600' : 'bg-gray-300 dark:bg-gray-600')
              : (isHcHigh ? 'bg-yellow-400' : 'bg-gradient-to-tr from-[#0EA5E9] via-[#8B5CF6] to-[#EC4899]')
            }`}>
              <div className="w-full h-full rounded-full border-2 border-white dark:border-[#1e293b] overflow-hidden bg-white dark:bg-black">
                {storyUser.avatar ? (
                  <img src={storyUser.avatar} alt={storyUser.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center font-bold ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {storyUser.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
            <span className={`text-xs font-medium truncate w-16 text-center ${storyUser.isAllViewed ? (isDark ? 'text-gray-500' : 'text-gray-500') : (isHcHigh ? 'text-cyan-400' : isDark ? 'text-gray-200' : 'text-[#374151]')}`}>
              {storyUser.name.split(' ')[0]}
            </span>
          </motion.div>
        ))}
      </div>

      <button 
        onClick={() => scroll('right')}
        className={`absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 p-1.5 rounded-full shadow-md bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 lg:hidden`}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
