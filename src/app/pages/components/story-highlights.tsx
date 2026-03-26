import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Plus, X } from 'lucide-react';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { postsService } from '../../../lib/services/posts.service';
import { toast } from 'sonner';
import { StoryViewerModal } from './story-viewer-modal';

interface StoryHighlight {
  title: string;
  stories: any[];
  coverImage: string | null;
}

interface StoryHighlightsProps {
  userId: string;
  isOwnProfile?: boolean;
  onHighlightCreate?: () => void;
}

export function StoryHighlights({ userId, isOwnProfile = false, onHighlightCreate }: StoryHighlightsProps) {
  const { theme, contrastMode, t } = useAccessibilityStore();
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<StoryHighlight | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);

  const isDark = theme === 'dark';
  const isHcHigh = contrastMode === 'high';
  const textColor = isHcHigh ? 'text-cyan-400' : isDark ? 'text-white' : 'text-gray-900';
  const subText = isHcHigh ? 'text-yellow-400' : isDark ? 'text-gray-400' : 'text-gray-500';

  useEffect(() => {
    loadHighlights();
  }, [userId]);

  const loadHighlights = async () => {
    try {
      setLoading(true);
      const data = await postsService.getUserHighlights(userId);
      setHighlights(data || []);
    } catch (error) {
      console.error('Error loading highlights:', error);
      toast.error(t('community.loadError') || 'Failed to load highlights');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className={`w-8 h-8 border-3 border-transparent rounded-full animate-spin ${isHcHigh ? 'border-t-cyan-400' : isDark ? 'border-t-white' : 'border-t-gray-900'}`} />
      </div>
    );
  }

  if (!highlights || highlights.length === 0) {
    return isOwnProfile ? (
      <div className={`text-center py-8 rounded-2xl border-2 border-dashed transition-colors ${isHcHigh ? 'border-yellow-400/30 bg-yellow-400/5' : isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50/30'}`}>
        <Star className={`w-8 h-8 mx-auto mb-3 opacity-30 ${textColor}`} />
        <p className={`${textColor} font-bold text-sm mb-2`}>{t('community.noHighlights') || 'No highlights yet'}</p>
        <p className={`${subText} text-xs`}>{t('community.createHighlightDesc') || 'Archive your favorite stories'}</p>
      </div>
    ) : null;
  }

  return (
    <div className="space-y-6">
      {/* Info Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className={`w-5 h-5 ${isHcHigh ? 'text-yellow-400' : 'text-[#0EA5E9]'}`} />
          <h3 className={`${textColor} font-black text-sm uppercase tracking-wider`}>
            {t('community.storyHighlights') || 'Story Highlights'}
          </h3>
          <span className={`${subText} text-xs font-bold`}>({highlights.length})</span>
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {/* Add New Highlight Button (only for own profile) */}
        {isOwnProfile && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onHighlightCreate}
            className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${isHcHigh ? 'border-yellow-400/40 hover:border-yellow-400 hover:bg-yellow-400/5' : isDark ? 'border-white/20 hover:border-white/40 hover:bg-white/5' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-100'}`}
          >
            <Plus className={`w-6 h-6 ${isHcHigh ? 'text-yellow-400' : isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${subText}`}>
              {t('common.add') || 'Add'}
            </span>
          </motion.button>
        )}

        {/* Highlight Items */}
        {highlights.map((highlight, idx) => (
          <motion.button
            key={highlight.title}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => setSelectedHighlight(highlight)}
            className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all group relative ${isHcHigh ? 'border-yellow-400/30 hover:border-yellow-400' : isDark ? 'border-white/10 hover:border-white/30' : 'border-gray-200 hover:border-gray-400'}`}
          >
            {/* Cover Image */}
            {highlight.coverImage && (
              <img
                src={highlight.coverImage}
                alt={highlight.title}
                className="w-full h-full object-cover"
              />
            )}

            {/* Overlay */}
            <div className={`absolute inset-0 ${isHcHigh ? 'bg-black/40 group-hover:bg-black/50' : isDark ? 'bg-black/30 group-hover:bg-black/40' : 'bg-black/20 group-hover:bg-black/30'} transition-colors flex flex-col items-center justify-end p-2`}>
              <p className="text-white font-bold text-xs text-center line-clamp-2 leading-tight mb-1">
                {highlight.title}
              </p>
              <span className="text-[10px] text-white/70 font-medium">
                {highlight.stories.length} {t('community.stories') || 'stories'}
              </span>
            </div>

            {/* Ring indicator */}
            <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-[#0EA5E9]/ transition-all" />
          </motion.button>
        ))}
      </div>

      {/* Highlight Detail Modal */}
      <AnimatePresence>
        {selectedHighlight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedHighlight(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`rounded-3xl p-6 max-w-md w-full ${isHcHigh ? 'bg-black border-2 border-yellow-400' : isDark ? 'bg-[#1e293b] border border-[#334155]' : 'bg-white border border-gray-100'}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ${isHcHigh ? 'ring-2 ring-yellow-400' : 'ring-2 ring-[#0EA5E9]'}`}>
                    {selectedHighlight.coverImage && (
                      <img
                        src={selectedHighlight.coverImage}
                        alt={selectedHighlight.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className={`${textColor} font-black text-sm`}>{selectedHighlight.title}</h3>
                    <p className={`${subText} text-xs`}>{selectedHighlight.stories.length} stories</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedHighlight(null)}
                  className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-[#334155] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-black'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stories Grid */}
              <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                {selectedHighlight.stories.map((story, idx) => (
                  <motion.button
                    key={story.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedStoryId(story.id)}
                    className={`aspect-square rounded-xl overflow-hidden border transition-all group ${isHcHigh ? 'border-yellow-400/30 hover:border-yellow-400' : isDark ? 'border-white/10 hover:border-white/30' : 'border-gray-200 hover:border-gray-400'}`}
                  >
                    <img
                      src={story.mediaUrl}
                      alt="story"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Viewer Modal */}
      {selectedStoryId && selectedHighlight && (
        <StoryViewerModal
          story={selectedHighlight.stories.find((s) => s.id === selectedStoryId)}
          allStories={selectedHighlight.stories}
          onClose={() => setSelectedStoryId(null)}
          onStoryChange={(story) => {
            setSelectedStoryId(story.id);
          }}
        />
      )}
    </div>
  );
}
