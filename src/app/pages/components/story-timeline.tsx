import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Play, X, Heart, MessageCircle, Share2, ChevronLeft, ChevronRight, Music, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { postsService } from '../../../lib/services/posts.service';
import { useAuthStore } from '../../../stores/auth.store';
import { toast } from 'sonner';

interface UserStory {
  id: string;
  mediaUrl: string;
  musicUrl?: string;
  musicTitle?: string;
  createdAt: string;
  isHighlight?: boolean;
  highlightTitle?: string;
  _count?: {
    likes: number;
    comments: number;
  };
}

interface StoryHighlight {
  title: string;
  coverImage: string;
  stories: UserStory[];
  storyCount: number;
}

interface StoryTimelineProps {
  userId: string;
  onStorySelect?: (storyId: string) => void;
}

export function StoryTimeline({ userId, onStorySelect }: StoryTimelineProps) {
  const { theme, contrastMode, t } = useAccessibilityStore();
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const isDark = theme === 'dark';
  const isHcHigh = contrastMode === 'high';
  const textColor = isHcHigh ? 'text-cyan-400' : isDark ? 'text-white' : 'text-gray-900';
  const subText = isHcHigh ? 'text-yellow-400' : isDark ? 'text-gray-400' : 'text-gray-500';
  const cardBg = isHcHigh ? 'bg-black/40 border-yellow-400/30' : isDark ? 'bg-slate-800/40 border-white/10' : 'bg-blue-50/40 border-blue-200/30';

  useEffect(() => {
    loadHighlights();
  }, [userId, refreshKey]);

  const loadHighlights = async () => {
    try {
      setLoading(true);
      const data = await postsService.getUserHighlights(userId);
      
      const formattedHighlights: StoryHighlight[] = data?.map((highlight: any) => ({
        title: highlight.title || 'Highlight',
        coverImage: highlight.coverImage || (highlight.stories?.[0]?.mediaUrl || ''),
        stories: highlight.stories || [],
        storyCount: (highlight.stories || []).length,
      })) || [];

      setHighlights(formattedHighlights.filter(h => h.storyCount > 0));
    } catch (error) {
      console.error('Error loading highlights:', error);
      toast.error(t('community.loadError') || 'Failed to load highlights');
    } finally {
      setLoading(false);
    }
  };

  // Global event listener for highlight updates
  useEffect(() => {
    const handleHighlightAdded = () => {
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('highlightAdded', handleHighlightAdded);
    return () => window.removeEventListener('highlightAdded', handleHighlightAdded);
  }, []);

  const allStories = highlights.flatMap(h => h.stories);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className={`w-10 h-10 rounded-full border-3 ${isHcHigh ? 'border-cyan-400/30 border-t-cyan-400' : isDark ? 'border-white/20 border-t-white' : 'border-gray-300 border-t-gray-900'}`}
        />
      </div>
    );
  }

  if (!highlights || highlights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className={`p-2.5 rounded-full backdrop-blur-xl ${isHcHigh ? 'bg-cyan-400/20 border border-cyan-400/40' : isDark ? 'bg-white/10 border border-white/20' : 'bg-blue-200/30 border border-blue-300/50'}`}
          >
            <Sparkles className={`w-5 h-5 ${isHcHigh ? 'text-cyan-400' : isDark ? 'text-white' : 'text-blue-600'}`} />
          </motion.div>
          <div>
            <h3 className={`${textColor} font-black text-sm uppercase tracking-widest`}>
              {t('community.storyTimeline') || 'Story Timeline'}
            </h3>
            <p className={`${subText} text-xs font-medium`}>{allStories.length} {t('community.stories') || 'stories'}</p>
          </div>
        </div>

        {/* Toggle Button */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={`p-2.5 rounded-full backdrop-blur-xl border transition-all ${isHcHigh ? 'bg-cyan-400/10 border-cyan-400/30 hover:bg-cyan-400/20 hover:border-cyan-400/50' : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20' : 'bg-blue-100/30 border-blue-200/30 hover:bg-blue-100/50 hover:border-blue-300/50'}`}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft className={`w-5 h-5 ${isHcHigh ? 'text-cyan-400' : isDark ? 'text-white' : 'text-blue-600'}`} />
          </motion.div>
        </motion.button>
      </div>

      {/* Premium Container */}
      <motion.div
        layout
        className={`relative rounded-3xl backdrop-blur-xl border-2 overflow-hidden ${isHcHigh ? 'bg-black/30 border-cyan-400/20' : isDark ? 'bg-slate-900/30 border-white/10' : 'bg-white/50 border-blue-200/30'}`}
      >
        {/* Animated gradient background */}
        <div className={`absolute inset-0 ${isHcHigh ? 'bg-gradient-to-br from-cyan-500/5 via-transparent to-yellow-500/5' : isDark ? 'bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5' : 'bg-gradient-to-br from-blue-100/30 via-transparent to-purple-100/20'}`} />

        <motion.div
          animate={{ height: isExpanded ? 'auto' : 'auto' }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="overflow-hidden relative z-10"
        >
          {isExpanded ? (
            // Grid View - Expanded
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8"
            >
              {highlights.map((highlight, idx) => (
                <HighlightCard
                  key={highlight.title}
                  highlight={highlight}
                  allStories={allStories}
                  onStorySelect={setSelectedStoryIndex}
                  isDark={isDark}
                  isHcHigh={isHcHigh}
                  textColor={textColor}
                  subText={subText}
                  index={idx}
                />
              ))}
            </motion.div>
          ) : (
            // Horizontal Scroll View - Compact
            <div ref={scrollContainerRef} className="flex gap-6 p-8 pb-10 overflow-x-auto scroll-smooth">
              {/* Gradient Fade Left */}
              <div className={`absolute left-0 top-0 bottom-0 w-16 z-20 pointer-events-none rounded-l-3xl ${isHcHigh ? 'bg-gradient-to-r from-black to-transparent' : isDark ? 'bg-gradient-to-r from-slate-900 to-transparent' : 'bg-gradient-to-r from-white to-transparent'}`} />

              {/* Gradient Fade Right */}
              <div className={`absolute right-0 top-0 bottom-0 w-16 z-20 pointer-events-none rounded-r-3xl ${isHcHigh ? 'bg-gradient-to-l from-black to-transparent' : isDark ? 'bg-gradient-to-l from-slate-900 to-transparent' : 'bg-gradient-to-l from-white to-transparent'}`} />

              {highlights.map((highlight, idx) => (
                <CompactHighlightCard
                  key={highlight.title}
                  highlight={highlight}
                  allStories={allStories}
                  onStorySelect={setSelectedStoryIndex}
                  isDark={isDark}
                  isHcHigh={isHcHigh}
                  textColor={textColor}
                  subText={subText}
                  index={idx}
                />
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {selectedStoryIndex !== null && (
          <StoryViewerPremium
            stories={allStories}
            initialIndex={selectedStoryIndex}
            onClose={() => setSelectedStoryIndex(null)}
            onNext={() => {
              if (selectedStoryIndex < allStories.length - 1) {
                setSelectedStoryIndex(selectedStoryIndex + 1);
              }
            }}
            onPrev={() => {
              if (selectedStoryIndex > 0) {
                setSelectedStoryIndex(selectedStoryIndex - 1);
              }
            }}
            isDark={isDark}
            isHcHigh={isHcHigh}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact Card for Horizontal View
function CompactHighlightCard({
  highlight,
  allStories,
  onStorySelect,
  isDark,
  isHcHigh,
  textColor,
  subText,
  index,
}: {
  highlight: StoryHighlight;
  allStories: UserStory[];
  onStorySelect: (idx: number) => void;
  isDark: boolean;
  isHcHigh: boolean;
  textColor: string;
  subText: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: -20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="flex-shrink-0 flex flex-col gap-3 group"
    >
      {/* Title Badge */}
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        className={`px-4 py-2 rounded-2xl backdrop-blur-xl border-2 font-black uppercase tracking-wider text-xs w-48 truncate shadow-lg ${isHcHigh ? 'bg-cyan-400/15 border-cyan-400/40 text-cyan-300 shadow-cyan-400/10' : isDark ? 'bg-white/10 border-white/20 text-white shadow-white/5' : 'bg-blue-100 border-blue-300 text-blue-700 shadow-blue-200/30'}`}
      >
        {highlight.title}
      </motion.div>

      {/* Stories Grid */}
      <div className="grid grid-cols-2 gap-3 w-48">
        {highlight.stories.slice(0, 4).map((story, idx) => (
          <motion.button
            key={story.id}
            whileHover={{ scale: 1.08, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const globalIdx = allStories.findIndex(s => s.id === story.id);
              onStorySelect(globalIdx);
            }}
            className={`relative aspect-square rounded-2xl overflow-hidden group/story shadow-xl hover:shadow-2xl border-2 transition-all ${isHcHigh ? 'border-cyan-400/40 hover:border-cyan-400/70' : isDark ? 'border-white/20 hover:border-white/40' : 'border-blue-300/50 hover:border-blue-400'}`}
          >
            <img
              src={story.mediaUrl}
              alt="Story"
              className="w-full h-full object-cover group-hover/story:scale-110 transition-transform duration-300"
            />

            {/* Music Badge */}
            {story.musicUrl && (
              <div className={`absolute top-2 left-2 p-1.5 rounded-full shadow-lg ${isHcHigh ? 'bg-cyan-400/80' : isDark ? 'bg-white/20' : 'bg-blue-400/80'}`}>
                🎵
              </div>
            )}

            {/* Play Icon */}
            <div className={`absolute inset-0 flex items-center justify-center ${isHcHigh ? 'bg-black/30 group-hover/story:bg-black/50' : isDark ? 'bg-black/20 group-hover/story:bg-black/40' : 'bg-black/10 group-hover/story:bg-black/30'} transition-all opacity-0 group-hover/story:opacity-100`}>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Play className="w-6 h-6 text-white fill-white" />
              </motion.div>
            </div>
          </motion.button>
        ))}

        {/* More Badge */}
        {highlight.stories.length > 4 && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={`relative aspect-square rounded-2xl flex items-center justify-center font-black text-sm border-2 ${isHcHigh ? 'bg-cyan-400/15 border-cyan-400/40 text-cyan-400' : isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-blue-100 border-blue-300 text-blue-600'}`}
          >
            +{highlight.stories.length - 4}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Grid Card for Expanded View
function HighlightCard({
  highlight,
  allStories,
  onStorySelect,
  isDark,
  isHcHigh,
  textColor,
  subText,
  index,
}: {
  highlight: StoryHighlight;
  allStories: UserStory[];
  onStorySelect: (idx: number) => void;
  isDark: boolean;
  isHcHigh: boolean;
  textColor: string;
  subText: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      onClick={() => {
        const firstStory = highlight.stories[0];
        if (firstStory) {
          const globalIdx = allStories.findIndex(s => s.id === firstStory.id);
          onStorySelect(globalIdx);
        }
      }}
      className={`group cursor-pointer p-5 rounded-2xl backdrop-blur-xl border-2 transition-all hover:scale-105 ${isHcHigh ? 'bg-cyan-400/10 border-cyan-400/40 hover:bg-cyan-400/20' : isDark ? 'bg-white/10 border-white/15 hover:bg-white/15' : 'bg-blue-100/40 border-blue-300/40 hover:bg-blue-100/60'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className={`${textColor} font-black text-sm uppercase tracking-wider`}>{highlight.title}</h4>
          <p className={`${subText} text-xs`}>{highlight.stories.length} stories</p>
        </div>
        <motion.div
          whileHover={{ rotate: 12 }}
          className={`p-2 rounded-full ${isHcHigh ? 'bg-cyan-400/20' : isDark ? 'bg-white/10' : 'bg-blue-200/50'}`}
        >
          <Sparkles className={`w-4 h-4 ${isHcHigh ? 'text-cyan-400' : isDark ? 'text-white' : 'text-blue-600'}`} />
        </motion.div>
      </div>

      {/* Stories Grid */}
      <div className="grid grid-cols-4 gap-2">
        {highlight.stories.slice(0, 4).map((story) => (
          <motion.button
            key={story.id}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              const globalIdx = allStories.findIndex(s => s.id === story.id);
              onStorySelect(globalIdx);
            }}
            className={`relative aspect-square rounded-lg overflow-hidden group/story border-2 shadow-md hover:shadow-lg transition-all ${isHcHigh ? 'border-cyan-400/30 hover:border-cyan-400/60' : isDark ? 'border-white/10 hover:border-white/30' : 'border-blue-300/40 hover:border-blue-400'}`}
          >
            <img
              src={story.mediaUrl}
              alt="Story"
              className="w-full h-full object-cover group-hover/story:scale-110 transition-transform duration-300"
            />

            {/* Play Icon */}
            <div className={`absolute inset-0 flex items-center justify-center ${isHcHigh ? 'bg-black/40 group-hover/story:bg-black/60' : isDark ? 'bg-black/30 group-hover/story:bg-black/50' : 'bg-black/20 group-hover/story:bg-black/40'} opacity-0 group-hover/story:opacity-100 transition-all`}>
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
          </motion.button>
        ))}

        {/* More Badge */}
        {highlight.stories.length > 4 && (
          <div className={`aspect-square rounded-lg flex items-center justify-center font-black text-xs ${isHcHigh ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/40' : isDark ? 'bg-white/10 text-white border border-white/20' : 'bg-blue-100 text-blue-600 border border-blue-300'}`}>
            +{highlight.stories.length - 4}
          </div>
        )}
      </div>
    </motion.div>
  );
}
// Premium Story Viewer
interface StoryViewerPremiumProps {
  stories: UserStory[];
  initialIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  isDark: boolean;
  isHcHigh: boolean;
  t: any;
}

function StoryViewerPremium({
  stories,
  initialIndex,
  onClose,
  onNext,
  onPrev,
  isDark,
  isHcHigh,
  t,
}: StoryViewerPremiumProps) {
  const { user } = useAuthStore();
  const story = stories[initialIndex];
  const [isMusicPlaying, setIsMusicPlaying] = useState(!!story?.musicUrl);
  const [musicVolume, setMusicVolume] = useState(0.6);
  const [showHighlightInput, setShowHighlightInput] = useState(false);
  const [highlightTitle, setHighlightTitle] = useState('');
  const [savingHighlight, setSavingHighlight] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && story?.musicUrl) {
      audioRef.current.volume = musicVolume;
      if (isMusicPlaying) {
        audioRef.current.play().catch(() => setIsMusicPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [story?.musicUrl, isMusicPlaying, musicVolume]);

  const handleAddToHighlight = async () => {
    if (!highlightTitle.trim()) {
      toast.error('Veuillez entrer un titre');
      return;
    }

    try {
      setSavingHighlight(true);
      await postsService.saveStoryAsHighlight(story.id, highlightTitle);
      toast.success('Story ajoutée aux highlights !');
      setHighlightTitle('');
      setShowHighlightInput(false);
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    } finally {
      setSavingHighlight(false);
    }
  };

  if (!story) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-2xl h-auto max-h-[90vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl ${isHcHigh ? 'border-3 border-cyan-400' : isDark ? 'border-2 border-white/20' : 'border-2 border-blue-300'}`}
      >
        {/* Image Container */}
        <div className="relative flex-shrink-0 w-full h-80 bg-gradient-to-br from-gray-900 to-black overflow-hidden">
          <img
            src={story.mediaUrl}
            alt="Story"
            className="w-full h-full object-cover"
          />

          {/* Overlay */}
          <div className={`absolute inset-0 ${isHcHigh ? 'bg-gradient-to-t from-black/60 to-transparent' : isDark ? 'bg-gradient-to-t from-black/50 to-transparent' : 'bg-gradient-to-t from-black/40 to-transparent'}`} />
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
          {/* Info Bar */}
          <div className={`flex-shrink-0 px-6 py-4 border-b ${isHcHigh ? 'bg-black/20 border-cyan-400/20' : isDark ? 'bg-slate-800/40 border-white/10' : 'bg-blue-50/40 border-blue-200/30'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isHcHigh ? 'text-cyan-400' : isDark ? 'text-white' : 'text-gray-900'} font-bold text-lg`}>{initialIndex + 1}/{stories.length}</p>
                <p className={`${isHcHigh ? 'text-yellow-400' : isDark ? 'text-gray-400' : 'text-gray-500'} text-xs`}>
                  {new Date(story.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className={`p-3 rounded-full backdrop-blur-xl ${isHcHigh ? 'bg-cyan-400/20 hover:bg-cyan-400/30' : isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-blue-200/40 hover:bg-blue-200/60'}`}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Music Player */}
          {story.musicUrl && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex-shrink-0 px-6 py-4 border-b ${isHcHigh ? 'bg-black/20 border-cyan-400/20' : isDark ? 'bg-slate-800/40 border-white/10' : 'bg-blue-50/40 border-blue-200/30'}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  animate={{ rotate: isMusicPlaying ? 360 : 0 }}
                  transition={{ duration: 2, repeat: isMusicPlaying ? Infinity : 0, ease: 'linear' }}
                >
                  🎵
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className={`${isHcHigh ? 'text-cyan-300' : isDark ? 'text-white' : 'text-gray-900'} font-semibold text-sm truncate`}>
                    {story.musicTitle || 'Background Music'}
                  </p>
                  <p className={`${isHcHigh ? 'text-yellow-400/60' : isDark ? 'text-gray-400' : 'text-gray-500'} text-xs`}>
                    {isMusicPlaying ? 'Playing' : 'Paused'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                  className={`flex-shrink-0 p-2 rounded-full ${isHcHigh ? 'bg-cyan-400/30 hover:bg-cyan-400/50' : isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-blue-200/40 hover:bg-blue-200/60'}`}
                >
                  {isMusicPlaying ? '⏸' : '▶'}
                </motion.button>

                <div className="flex items-center gap-1 flex-1">
                  <VolumeX className="w-4 h-4 opacity-60 flex-shrink-0" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={musicVolume}
                    onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                    className="flex-1 h-1 accent-cyan-400"
                  />
                  <Volume2 className="w-4 h-4 opacity-60 flex-shrink-0" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Bar */}
          <div className={`flex-shrink-0 px-6 py-4 border-t flex gap-2 ${isHcHigh ? 'bg-black/20 border-cyan-400/20' : isDark ? 'bg-slate-800/40 border-white/10' : 'bg-blue-50/40 border-blue-200/30'}`}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`flex-shrink-0 p-3 rounded-full ${isHcHigh ? 'bg-cyan-400/20 hover:bg-cyan-400/30' : isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-blue-200/40 hover:bg-blue-200/60'}`}
            >
              <Heart className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`flex-shrink-0 p-3 rounded-full ${isHcHigh ? 'bg-cyan-400/20 hover:bg-cyan-400/30' : isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-blue-200/40 hover:bg-blue-200/60'}`}
            >
              <MessageCircle className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowHighlightInput(true)}
              className={`flex-shrink-0 p-3 rounded-full shadow-lg ${isHcHigh ? 'bg-cyan-400/40 hover:bg-cyan-400/60 text-black' : isDark ? 'bg-cyan-500/40 hover:bg-cyan-500/60 text-white' : 'bg-cyan-400/60 hover:bg-cyan-500 text-white'}`}
            >
              <Sparkles className="w-5 h-5" />
            </motion.button>

            <div className="flex-1" />

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`flex-shrink-0 p-3 rounded-full ${isHcHigh ? 'bg-cyan-400/20 hover:bg-cyan-400/30' : isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-blue-200/40 hover:bg-blue-200/60'}`}
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Audio Element */}
        {story.musicUrl && (
          <audio
            ref={audioRef}
            src={story.musicUrl}
            loop
            crossOrigin="anonymous"
            className="hidden"
          />
        )}

        {/* Navigation */}
        {initialIndex > 0 && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full backdrop-blur-xl bg-black/40 hover:bg-black/60 text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
        )}

        {initialIndex < stories.length - 1 && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full backdrop-blur-xl bg-black/40 hover:bg-black/60 text-white"
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        )}

        {/* Highlight Input Modal */}
        {showHighlightInput && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-3xl"
            onClick={() => setShowHighlightInput(false)}
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className={`p-6 rounded-2xl w-80 backdrop-blur-xl border-2 ${isHcHigh ? 'bg-black/60 border-cyan-400/40' : isDark ? 'bg-slate-800/80 border-white/20' : 'bg-white/80 border-blue-300/50'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <p className={`${isHcHigh ? 'text-cyan-400' : isDark ? 'text-white' : 'text-gray-900'} font-black mb-4`}>
                Add to Highlights
              </p>
              <input
                type="text"
                value={highlightTitle}
                onChange={(e) => setHighlightTitle(e.target.value)}
                placeholder="Ex: Vacances..."
                autoFocus
                className={`w-full px-4 py-3 rounded-lg mb-4 border-2 outline-none font-medium ${isHcHigh ? 'bg-cyan-400/10 border-cyan-400/40 text-cyan-300 placeholder-cyan-400/40' : isDark ? 'bg-white/10 border-white/20 text-white placeholder-gray-400' : 'bg-blue-100 border-blue-300 text-gray-900 placeholder-gray-600'}`}
              />
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddToHighlight}
                  disabled={savingHighlight}
                  className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${isHcHigh ? 'bg-cyan-400/40 hover:bg-cyan-400/50 disabled:opacity-50 text-black' : 'bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white'}`}
                >
                  {savingHighlight ? 'Saving...' : 'Add'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowHighlightInput(false);
                    setHighlightTitle('');
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm ${isHcHigh ? 'bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-300' : isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
