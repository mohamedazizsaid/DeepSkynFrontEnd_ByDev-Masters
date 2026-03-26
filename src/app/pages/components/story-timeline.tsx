import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Image as ImageIcon, Loader2, Heart, MessageCircle, Share2, ChevronLeft, ChevronRight, X, MoreVertical, Music, Volume2, VolumeX } from 'lucide-react';
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
  const [isOpening, setIsOpening] = useState(false);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const isDark = theme === 'dark';
  const isHcHigh = contrastMode === 'high';
  const textColor = isHcHigh ? 'text-cyan-400' : isDark ? 'text-white' : 'text-gray-900';
  const subText = isHcHigh ? 'text-yellow-400' : isDark ? 'text-gray-400' : 'text-gray-500';

  useEffect(() => {
    loadHighlights();
  }, [userId, refreshKey]);

  const loadHighlights = async () => {
    try {
      setLoading(true);
      const data = await postsService.getUserHighlights(userId);
      
      // Format highlights data
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

  const formatDate = (date: string) => {
    const now = new Date();
    const storyDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - storyDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'À l\'instant';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInHours < 48) return 'Hier';
    return `Il y a ${Math.floor(diffInHours / 24)}j`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className={`w-8 h-8 border-3 border-transparent rounded-full animate-spin ${isHcHigh ? 'border-t-cyan-400' : isDark ? 'border-t-white' : 'border-t-gray-900'}`} />
      </div>
    );
  }

  // Flatten all stories from all highlights
  const allStories = highlights.flatMap(h => h.stories);

  if (!highlights || highlights.length === 0) {
    return (
      <div className={`text-center py-12 rounded-2xl border-2 border-dashed transition-colors ${isHcHigh ? 'border-yellow-400/30 bg-yellow-400/5' : isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50/30'}`}>
        <ImageIcon className={`w-8 h-8 mx-auto mb-3 opacity-30 ${textColor}`} />
        <p className={`${textColor} font-bold text-sm mb-1`}>{t('community.noHighlights') || 'No highlights'}</p>
        <p className={`${subText} text-xs`}>{t('community.noHighlightsDesc') || 'Create highlights by adding stories'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className={`w-5 h-5 ${isHcHigh ? 'text-yellow-400' : 'text-[#0EA5E9]'}`} />
          <h3 className={`${textColor} font-black text-sm uppercase tracking-wider`}>
            {t('community.storyTimeline') || 'Highlights'}
          </h3>
          <span className={`${subText} text-xs font-bold`}>({allStories.length})</span>
        </div>
        
        {/* Toggle Dropdown Button */}
        <motion.button
          onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
          className={`p-2 rounded-full transition-all ${isHcHigh ? 'hover:bg-yellow-400/10 text-yellow-400' : isDark ? 'hover:bg-white/10 text-cyan-400' : 'hover:bg-blue-100 text-blue-600'}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: isTimelineExpanded ? 180 : 0, scale: isTimelineExpanded ? 1.1 : 1 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <ChevronRight className="w-6 h-6" />
          </motion.div>
        </motion.button>
      </div>

      {/* Premium Horizontal Scroll Container - Now Expandable Dropdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        ref={scrollContainerRef}
        className={`relative rounded-3xl overflow-hidden backdrop-blur-2xl shadow-2xl transition-all ${isHcHigh ? 'border-3 border-yellow-400 bg-black/60' : isDark ? 'bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 border-2 border-white/20' : 'bg-gradient-to-r from-blue-50/90 via-white/90 to-blue-50/90 border-2 border-blue-200/50'}`}
        layout
      >
        {/* Enhanced Gradient Overlays for Premium Look */}
        <div className={`absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none ${!isTimelineExpanded ? (isHcHigh ? 'bg-gradient-to-r from-black to-transparent' : isDark ? 'bg-gradient-to-r from-slate-900 via-slate-900/50 to-transparent' : 'bg-gradient-to-r from-white via-white/50 to-transparent') : 'hidden'}`} />
        <div className={`absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none ${!isTimelineExpanded ? (isHcHigh ? 'bg-gradient-to-l from-black to-transparent' : isDark ? 'bg-gradient-to-l from-slate-900 via-slate-900/50 to-transparent' : 'bg-gradient-to-l from-white via-white/50 to-transparent') : 'hidden'}`} />

        {/* Scrollable Stories Container */}
        <motion.div 
          animate={{
            height: isTimelineExpanded ? 'auto' : '24rem',
            maxHeight: isTimelineExpanded ? '800px' : '600px'
          }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className={`overflow-x-auto overflow-y-hidden scroll-smooth ${isTimelineExpanded ? 'overflow-y-auto' : 'h-96 md:h-[28rem]'}`} 
          style={{ scrollBehavior: 'smooth' }}
        >
          {isTimelineExpanded ? (
            // Dropdown Grid View
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6"
            >
              {highlights.map((highlight, highlightIdx) => (
                <motion.div
                  key={highlight.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: highlightIdx * 0.1, duration: 0.3 }}
                  className={`p-5 rounded-2xl backdrop-blur-sm border-2 ${isHcHigh ? 'bg-yellow-400/10 border-yellow-400 hover:bg-yellow-400/20' : isDark ? 'bg-white/5 border-white/20 hover:bg-white/10' : 'bg-blue-50 border-blue-200 hover:bg-blue-100'} transition-all cursor-pointer group`}
                  onClick={() => {
                    const firstStory = highlight.stories[0];
                    if (firstStory) {
                      const globalIndex = allStories.findIndex(s => s.id === firstStory.id);
                      setSelectedStoryIndex(globalIndex);
                    }
                  }}
                >
                  {/* Title */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${isHcHigh ? 'bg-yellow-400/30 text-yellow-300' : isDark ? 'bg-cyan-500/30 text-cyan-300' : 'bg-blue-200 text-blue-700'}`}>
                      {highlight.title}
                    </div>
                    <span className={`text-sm font-bold ${isHcHigh ? 'text-yellow-400' : isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
                      {highlight.stories.length} stories
                    </span>
                  </div>

                  {/* Stories Grid Preview */}
                  <div className="grid grid-cols-4 gap-2">
                    {highlight.stories.slice(0, 4).map((story) => (
                      <motion.div
                        key={story.id}
                        whileHover={{ scale: 1.05 }}
                        className={`aspect-square rounded-lg overflow-hidden border ${isHcHigh ? 'border-yellow-400/50' : isDark ? 'border-white/30' : 'border-blue-300'} group/story`}
                      >
                        <img
                          src={story.mediaUrl}
                          alt="Story"
                          className="w-full h-full object-cover group-hover/story:scale-110 transition-transform duration-300"
                        />
                        {story.musicUrl && (
                          <div className={`absolute inset-0 flex items-center justify-center text-lg ${isHcHigh ? 'bg-yellow-400/30' : 'bg-black/40'}`}>
                            🎵
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {highlight.stories.length > 4 && (
                      <div className={`aspect-square rounded-lg flex items-center justify-center font-bold text-sm ${isHcHigh ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400' : isDark ? 'bg-white/10 text-white border border-white/30' : 'bg-blue-100 text-blue-600 border border-blue-300'}`}>
                        +{highlight.stories.length - 4}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            // Original Horizontal Scroll View
            <div className="flex gap-6 p-6 pb-8 min-w-min">
            {/* Highlight Groups */}
            {highlights.map((highlight, highlightIdx) => (
              <motion.div
                key={highlight.title}
                initial={{ opacity: 0, scale: 0.85, x: -30 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: highlightIdx * 0.12, duration: 0.4, ease: 'easeOut' }}
                className="flex-shrink-0 flex flex-col gap-3 group cursor-pointer"
                onClick={() => {
                  setIsOpening(true);
                  setTimeout(() => {
                    const firstStory = highlight.stories[0];
                    if (firstStory) {
                      const globalIndex = allStories.findIndex(s => s.id === firstStory.id);
                      setSelectedStoryIndex(globalIndex);
                    }
                    setIsOpening(false);
                  }, 400);
                }}
              >
                {/* Highlight Title Badge - Enhanced with Arrow */}
                <motion.div 
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider w-40 shadow-md border-2 transition-all flex items-center justify-between ${isHcHigh ? 'bg-gradient-to-r from-yellow-400/30 to-yellow-300/30 border-yellow-400 text-yellow-300 shadow-yellow-400/20 group-hover:shadow-lg group-hover:shadow-yellow-400/40' : isDark ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400/60 text-cyan-300 shadow-cyan-400/10 group-hover:shadow-lg group-hover:shadow-cyan-500/30' : 'bg-gradient-to-r from-blue-200 to-blue-100 border-blue-400 text-blue-800 shadow-blue-200/40 group-hover:shadow-lg group-hover:shadow-blue-300/50'}`}
                >
                  <span className="truncate flex-1">{highlight.title}</span>
                  <motion.div
                    animate={isOpening ? { x: [0, 6, 0], scale: [1, 1.2, 1] } : { x: [0, 4, 0] }}
                    transition={isOpening ? { duration: 0.6, times: [0, 0.5, 1] } : { duration: 1.5, repeat: Infinity }}
                    className={`flex-shrink-0 text-lg ml-2 ${isHcHigh ? 'text-yellow-400' : isDark ? 'text-cyan-400' : 'text-blue-600'}`}
                  >
                    →
                  </motion.div>
                </motion.div>

                {/* Stories Grid within Highlight - Larger & Better Spacing */}
                <motion.div 
                  className="grid grid-cols-2 gap-3 w-40"
                  animate={isOpening ? { scale: [1, 0.98, 1], opacity: [1, 0.8, 1] } : {}}
                  transition={isOpening ? { duration: 0.4 } : {}}
                >
                  {highlight.stories.slice(0, 4).map((story, storyIdx) => (
                    <motion.div
                      key={story.id}
                      whileHover={{ scale: 1.12, y: -8 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => {
                        const globalIndex = allStories.findIndex(s => s.id === story.id);
                        setSelectedStoryIndex(globalIndex);
                        onStorySelect?.(story.id);
                      }}
                      className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer group transition-all border-3 shadow-xl ${isHcHigh ? 'border-yellow-400/50 hover:border-yellow-300 hover:shadow-lg hover:shadow-yellow-400/30' : isDark ? 'border-white/20 hover:border-cyan-400/80 hover:shadow-lg hover:shadow-cyan-400/20' : 'border-blue-300 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-300/40'}`}
                    >
                      {/* Story Image */}
                      <img
                        src={story.mediaUrl}
                        alt="Story"
                        className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-400"
                      />

                      {/* Music Badge - Enhanced */}
                      {story.musicUrl && (
                        <div className={`absolute top-2 left-2 p-1.5 rounded-full text-sm transition-all shadow-lg ${isHcHigh ? 'bg-yellow-400/80 text-black' : isDark ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white' : 'bg-gradient-to-br from-blue-400 to-blue-500 text-white'}`}>
                          🎵
                        </div>
                      )}

                      {/* Premium Overlay on Hover */}
                      <div className={`absolute inset-0 ${isHcHigh ? 'bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover:from-black/80 group-hover:via-black/40' : 'bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/70 group-hover:via-black/30'} transition-all opacity-30 group-hover:opacity-100 flex items-center justify-center duration-300`}>
                        <span className={`text-4xl transition-transform group-hover:scale-125 duration-300 ${isHcHigh ? 'text-yellow-300' : 'text-white'}`}>▶</span>
                      </div>

                      {/* Engagement Stats - Styled Better */}
                      {(story._count?.likes || story._count?.comments) && (
                        <div className="absolute bottom-2 left-2 right-2 flex gap-2 text-xs font-bold text-white">
                          {story._count.likes > 0 && <span className="bg-red-500/80 backdrop-blur px-2 py-1 rounded-full">❤️ {story._count.likes}</span>}
                          {story._count.comments > 0 && <span className="bg-blue-500/80 backdrop-blur px-2 py-1 rounded-full">💬 {story._count.comments}</span>}
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* See More Badge */}
                  {highlight.stories.length > 4 && (
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer flex items-center justify-center text-center text-[10px] font-black transition-all border-2 ${isHcHigh ? 'border-yellow-400/40 bg-yellow-400/10 text-yellow-400 hover:border-yellow-400 hover:bg-yellow-400/20' : isDark ? 'border-white/10 bg-white/5 text-white hover:border-white/30 hover:bg-white/10' : 'border-gray-300 bg-gray-100 text-gray-700 hover:border-blue-400 hover:bg-blue-50'}`}
                    >
                      <span>+{highlight.stories.length - 4}</span>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </div>
          )}
        </motion.div>
      </motion.div>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {selectedStoryIndex !== null && (
          <StoryModalViewer
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface StoryModalViewerProps {
  stories: UserStory[];
  initialIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

function StoryModalViewer({ stories, initialIndex, onClose, onNext, onPrev }: StoryModalViewerProps) {
  const { theme, contrastMode, t } = useAccessibilityStore();
  const { user } = useAuthStore();
  const story = stories[initialIndex];
  const isDark = theme === 'dark';
  const isHcHigh = contrastMode === 'high';
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [savingHighlight, setSavingHighlight] = useState(false);
  const [highlightTitle, setHighlightTitle] = useState('');
  const [showHighlightInput, setShowHighlightInput] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(story?.musicUrl ? true : false);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement>(null);

  if (!story) return null;

  // Handle music playback
  useEffect(() => {
    if (audioRef.current && story?.musicUrl) {
      if (isMusicPlaying) {
        audioRef.current.play().catch(() => {
          // Playback failed - likely due to autoplay policy
          setIsMusicPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [story?.musicUrl, isMusicPlaying]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume;
    }
  }, [musicVolume]);

  // Stop music on modal close
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleAddToHighlight = async () => {
    if (!highlightTitle.trim()) {
      toast.error('Veuillez entrer un titre pour le highlight');
      return;
    }

    try {
      setSavingHighlight(true);
      await postsService.saveStoryAsHighlight(story.id, highlightTitle);
      toast.success('Story ajoutée aux highlights !');
      setHighlightTitle('');
      setShowHighlightInput(false);
      setShowMenu(false);
    } catch (error) {
      console.error('Error adding to highlight:', error);
      toast.error('Erreur lors de l\'ajout aux highlights');
    } finally {
      setSavingHighlight(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative max-w-sm w-full aspect-video sm:aspect-auto sm:h-[600px] rounded-3xl flex flex-col overflow-hidden shadow-2xl ${isHcHigh ? 'border-3 border-yellow-400' : isDark ? 'border-2 border-white/30' : 'border-2 border-blue-300'}`}
      >
        {/* Story Image Container with Loading State */}
        <div className="flex-1 w-full overflow-hidden bg-gradient-to-br from-gray-900 to-black relative group">
          <img
            src={story.mediaUrl}
            alt="Story"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const placeholder = document.createElement('div');
              placeholder.className = 'absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-center';
              placeholder.innerHTML = '<div><p className="text-2xl">📷</p><p>Image not available</p></div>';
              e.currentTarget.parentElement?.appendChild(placeholder);
            }}
          />
          
          {/* Loading Skeleton */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
        </div>

        {/* Hidden Audio Element */}
        {story.musicUrl && (
          <audio
            ref={audioRef}
            src={story.musicUrl}
            loop
            crossOrigin="anonymous"
            className="hidden"
          />
        )}

        {/* Premium Music Player */}
        {story.musicUrl && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full px-4 py-3 bg-gradient-to-t from-black via-black/90 to-black/50 border-t border-white/10"
          >
            {/* Music Info */}
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{ rotate: isMusicPlaying ? 360 : 0 }}
                transition={{ duration: 2, repeat: isMusicPlaying ? Infinity : 0, ease: 'linear' }}
                className="text-lg flex-shrink-0"
              >
                🎵
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate text-xs">{story.musicTitle || 'Background Music'}</p>
                <p className="text-white/60 text-xs">Playing</p>
              </div>
            </div>

            {/* Audio Controls */}
            <div className="flex items-center gap-2">
              {/* Play/Pause Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMusicPlaying(!isMusicPlaying);
                }}
                className={`p-1.5 rounded-full transition-all flex-shrink-0 ${isHcHigh ? 'bg-yellow-400 hover:bg-yellow-300 text-black' : 'bg-white/20 hover:bg-white/30 text-white'}`}
              >
                {isMusicPlaying ? (
                  <span className="text-xs">⏸</span>
                ) : (
                  <span className="text-xs">▶</span>
                )}
              </motion.button>

              {/* Volume Control */}
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <VolumeX className="w-3 h-3 text-white/60 flex-shrink-0" />
                <motion.input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 h-0.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#0EA5E9] hover:accent-white transition-all"
                  style={{
                    background: `linear-gradient(to right, ${isHcHigh ? '#facc15' : '#0EA5E9'} 0%, ${isHcHigh ? '#facc15' : '#0EA5E9'} ${musicVolume * 100}%, rgba(255,255,255,0.2) ${musicVolume * 100}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
                <Volume2 className="w-3 h-3 text-white/60 flex-shrink-0" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Top Controls - Close Button Only */}
        <div className="absolute top-4 right-4 z-50">
          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-3 rounded-full backdrop-blur-xl transition-all duration-200 shadow-2xl bg-black/60 hover:bg-black/80 text-white border-2 border-white/80 hover:border-white cursor-pointer"
          >
            <X className="w-7 h-7" />
          </motion.button>
        </div>

        {/* Bottom Action Bar */}
        <div className="w-full px-4 py-2 flex gap-2 z-40 bg-gradient-to-t from-black via-black/80 to-transparent border-t border-white/10">
          {/* Like Button */}
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full backdrop-blur-xl bg-black/60 hover:bg-black/80 text-white border border-white/60 transition-all"
          >
            <Heart className="w-5 h-5" />
          </motion.button>

          {/* Comment Button */}
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full backdrop-blur-xl bg-black/60 hover:bg-black/80 text-white border border-white/60 transition-all"
          >
            <MessageCircle className="w-5 h-5" />
          </motion.button>

          {/* Highlight Button */}
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowHighlightInput(true);
            }}
            className="p-2 rounded-full backdrop-blur-xl bg-cyan-500 hover:bg-cyan-400 text-white border border-white/60 transition-all shadow-lg"
          >
            <span className="font-bold">✨</span>
          </motion.button>

          {/* Space for other actions */}
          <div className="flex-1" />

          {/* Share Button */}
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(window.location.href);
              toast.success('Lien copié !');
            }}
            className="p-2 rounded-full backdrop-blur-xl bg-black/60 hover:bg-black/80 text-white border border-white/60 transition-all"
          >
            <Share2 className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Highlight Input Modal */}
        {showHighlightInput && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center z-40"
            onClick={(e) => {
              e.stopPropagation();
              setShowHighlightInput(false);
              setHighlightTitle('');
            }}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-black/80 p-6 rounded-xl w-80 border-2 border-white/30"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-white font-bold mb-4 text-center">Ajouter aux highlights</p>
              <input
                type="text"
                value={highlightTitle}
                onChange={(e) => setHighlightTitle(e.target.value)}
                placeholder="Ex: Vacances, Amis..."
                autoFocus
                className="w-full px-4 py-3 rounded-lg text-sm outline-none font-medium bg-white/20 border-2 border-white/40 text-white placeholder-white/60 mb-4"
              />
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToHighlight();
                  }}
                  disabled={savingHighlight}
                  className="flex-1 px-4 py-3 rounded-lg text-sm font-bold bg-cyan-500 text-white hover:bg-cyan-400 transition-colors disabled:opacity-50"
                >
                  {savingHighlight ? 'Ajout...' : 'Ajouter'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHighlightInput(false);
                    setHighlightTitle('');
                  }}
                  className="flex-1 px-4 py-3 rounded-lg text-sm font-bold bg-white/20 text-white hover:bg-white/30 transition-colors"
                >
                  Annuler
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        {initialIndex > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className={`absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-sm transition-colors ${isHcHigh ? 'bg-yellow-400/20 hover:bg-yellow-400/40 text-yellow-400' : 'bg-white/20 hover:bg-white/30 text-white'}`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {initialIndex < stories.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-sm transition-colors ${isHcHigh ? 'bg-yellow-400/20 hover:bg-yellow-400/40 text-yellow-400' : 'bg-white/20 hover:bg-white/30 text-white'}`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Story Info */}
        <div className="absolute top-4 left-4 text-white">
          <p className="text-2xl font-bold">{initialIndex + 1}</p>
          <p className="text-sm opacity-75">{stories.length} stories</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
