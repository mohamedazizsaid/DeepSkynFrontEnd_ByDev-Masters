import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Send, Music, Trash2, Loader2 } from 'lucide-react';
import type { StoryUser } from './story-bar';
import { postsService } from '../../../lib/services/posts.service';
import { useAuthStore } from '../../../stores/auth.store';
import toast from 'react-hot-toast';

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: StoryUser[];
  initialUserIndex?: number;
  onUserFinished?: (userId: string) => void;
}

const getRelativeTime = (date?: string) => {
  if (!date) return '2h';
  const now = new Date();
  const postDate = new Date(date);
  const seconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return postDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

interface StoryCommentData {
  id: string;
  comment: string;
  createdAt: string;
  userId: string;
  user?: { id: string; name: string; avatar: string | null };
}

export function StoryViewerModal({ isOpen, onClose, stories, initialUserIndex = 0, onUserFinished }: StoryViewerModalProps) {
  const { user } = useAuthStore();
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Like & comment state
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<StoryCommentData[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [highlightTitle, setHighlightTitle] = useState('');
  const [savingHighlight, setSavingHighlight] = useState(false);

  // Music
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentUser = stories[currentUserIndex];
  const currentItem = currentUser?.items[currentItemIndex];

  // Load comments & like status when story item changes
  useEffect(() => {
    if (!currentItem || !isOpen) return;
    setIsLiked(currentItem.isLiked || false);
    setLikesCount(currentItem.likesCount || 0);
    setComments([]);
    setShowComments(false);
    setNewComment('');
  }, [currentItem?.id, isOpen]);

  // Play music for current story
  useEffect(() => {
    if (!currentItem || !isOpen) return;
    const item = currentItem as any;
    if (audioRef.current) {
      if (item.musicUrl) {
        audioRef.current.src = item.musicUrl;
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentItem?.id, isOpen]);

  const handleNext = useCallback(() => {
    if (!currentUser) return;

    if (currentItemIndex < currentUser.items.length - 1) {
      setCurrentItemIndex(prev => prev + 1);
      setProgress(0);
    } else {
      if (onUserFinished) onUserFinished(currentUser.id);
      if (currentUserIndex < stories.length - 1) {
        setCurrentUserIndex(prev => prev + 1);
        setCurrentItemIndex(0);
        setProgress(0);
      } else {
        onClose();
      }
    }
  }, [currentUser, currentItemIndex, currentUserIndex, stories.length, onUserFinished, onClose]);

  const handlePrev = useCallback(() => {
    if (!currentUser) return;

    if (currentItemIndex > 0) {
      setCurrentItemIndex(prev => prev - 1);
      setProgress(0);
    } else {
      if (currentUserIndex > 0) {
        const prevUserIndex = currentUserIndex - 1;
        setCurrentUserIndex(prevUserIndex);
        setCurrentItemIndex(stories[prevUserIndex].items.length - 1);
        setProgress(0);
      }
    }
  }, [currentUser, currentItemIndex, currentUserIndex, stories]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentUserIndex(initialUserIndex);
      setCurrentItemIndex(0);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen, initialUserIndex]);

  // Progress timer
  useEffect(() => {
    if (!isOpen || !currentItem || isPaused || showComments) return;

    const DURATION = 5000;
    const INTERVAL = 50;

    const timer = setInterval(() => {
      setProgress(prev => prev + (INTERVAL / DURATION) * 100);
    }, INTERVAL);

    return () => clearInterval(timer);
  }, [isOpen, currentItem, currentItemIndex, currentUserIndex, isPaused, showComments]);

  // Auto-advance
  useEffect(() => {
    if (progress >= 100) {
      handleNext();
    }
  }, [progress, handleNext]);

  // ─── Like Handler ───
  const handleToggleLike = async () => {
    if (!currentItem) return;
    try {
      const result = await postsService.toggleStoryLike(currentItem.id);
      setIsLiked(result.liked);
      setLikesCount(result.likesCount);
      if (result.liked) {
        setLikeAnimating(true);
        setTimeout(() => setLikeAnimating(false), 600);
      }
    } catch {
      // silent
    }
  };

  // Double-tap to like
  const lastTapRef = useRef<number>(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!isLiked) handleToggleLike();
      setLikeAnimating(true);
      setTimeout(() => setLikeAnimating(false), 600);
    }
    lastTapRef.current = now;
  };

  // ─── Comments Handlers ───
  const handleOpenComments = async () => {
    if (!currentItem) return;
    setShowComments(true);
    setIsPaused(true);
    setLoadingComments(true);
    try {
      const data = await postsService.getStoryComments(currentItem.id);
      setComments(data || []);
    } catch {
      // silent
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCloseComments = () => {
    setShowComments(false);
    setIsPaused(false);
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !currentItem) return;
    setSendingComment(true);
    try {
      const comment = await postsService.addStoryComment(currentItem.id, newComment.trim());
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch {
      toast.error('Erreur');
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await postsService.deleteStoryComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch {
      // silent
    }
  };

  if (!isOpen || !currentUser || !currentItem) return null;

  const itemData = currentItem as any;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/80 text-white flex items-center justify-center p-0 sm:p-4 backdrop-blur-xl"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors hidden sm:block"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Hidden audio element for music */}
        <audio ref={audioRef} loop />

        <motion.div
          initial={{ scale: 0.9, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 50, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full h-full sm:w-[400px] sm:h-[90vh] bg-[#0A0A0A] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-white/5"
        >
          {/* Segmented Timeline */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-4 pt-4 pb-4 bg-gradient-to-b from-black/80 to-transparent">
            {currentUser.items.map((_, idx) => (
              <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-[50ms]"
                  style={{
                    width: idx === currentItemIndex ? `${progress}%` : idx < currentItemIndex ? '100%' : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* User Info Overlay */}
          <div className="absolute top-8 left-0 right-0 z-20 px-4 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-white/50 overflow-hidden bg-white/20 p-[2px]">
                   <img src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name}`} alt={currentUser.name} className="w-full h-full object-cover rounded-full" />
                </div>
                <div>
                   <span className="font-bold text-sm drop-shadow-md">{currentUser.name}</span>
                   <span className="ml-2 text-xs text-white/70">{getRelativeTime(currentItem.createdAt)}</span>
                </div>
             </div>
             
             {/* Mobile Close Button */}
             <button onClick={onClose} className="p-2 sm:hidden text-white/70 hover:text-white">
               <X className="w-6 h-6" />
             </button>
          </div>

          {/* Media Content */}
          <div
            className="flex-1 relative flex items-center justify-center shadow-inner"
            style={{ backgroundColor: '#0f0f0f' }}
            onClick={handleDoubleTap}
          >
            {currentItem.mediaUrl.includes('video') ? (
               <video src={currentItem.mediaUrl} autoPlay loop playsInline className="w-full h-full object-cover" />
            ) : (
               <img src={currentItem.mediaUrl} alt="Story content" className="w-full h-full object-cover pointer-events-none" />
            )}

            {/* Double-tap Like Animation */}
            <AnimatePresence>
              {likeAnimating && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.3, type: 'spring' }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                >
                  <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-2xl" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Music Badge */}
            {itemData.musicUrl && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-24 left-4 right-4 z-20 pointer-events-none"
              >
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-3 py-2 border border-white/10">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-[#EC4899] to-[#8B5CF6] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#EC4899]/30"
                  >
                    <Music className="w-3.5 h-3.5 text-white" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[11px] font-bold truncate">{itemData.musicTitle || 'Music'}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [3, Math.random() * 10 + 3, 3] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.06 }}
                        className="w-[2px] rounded-full bg-white/70"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Click Areas for Prev / Next */}
            <div className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer" onClick={handlePrev} />
            <div className="absolute inset-y-0 right-0 w-1/6 z-10 cursor-pointer" onClick={handleNext} />
          </div>

          {/* Desktop Navigation Chevrons */}
          <button 
             onClick={handlePrev} 
             className={`absolute -left-16 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors hidden sm:block ${currentUserIndex === 0 && currentItemIndex === 0 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button 
             onClick={handleNext} 
             className="absolute -right-16 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors hidden sm:block"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          
          {/* ─── Bottom Action Bar ─── */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
            {/* Comments Drawer */}
            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="bg-[#111] border-t border-white/10 rounded-t-3xl max-h-[45vh] overflow-hidden flex flex-col"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-white/70">
                      {comments.length} Commentaires
                    </h4>
                    <button onClick={handleCloseComments} className="text-white/50 hover:text-white p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ maxHeight: '25vh' }}>
                    {loadingComments ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-white/50" />
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="w-8 h-8 text-white/20 mx-auto mb-2" />
                        <p className="text-xs text-white/40 font-medium">Aucun commentaire</p>
                      </div>
                    ) : (
                      comments.map((c) => (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-2.5 group"
                        >
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                            {c.user?.avatar ? (
                              <img src={c.user.avatar} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white/60">
                                {c.user?.name?.charAt(0) || 'U'}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-white/90">{c.user?.name || 'Utilisateur'}</span>
                              <span className="text-[9px] text-white/30">{getRelativeTime(c.createdAt)}</span>
                            </div>
                            <p className="text-xs text-white/70 mt-0.5 leading-relaxed">{c.comment}</p>
                          </div>
                          {c.userId === (user?.id || user?.sub) && (
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                  {/* Comment Input */}
                  <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                      placeholder="Écrire un commentaire..."
                      className="flex-1 bg-white/10 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                    />
                    <button
                      onClick={handleSendComment}
                      disabled={!newComment.trim() || sendingComment}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${newComment.trim() ? 'bg-[#0EA5E9] text-white shadow-lg shadow-[#0EA5E9]/30 hover:scale-110 active:scale-95' : 'bg-white/10 text-white/30'}`}
                    >
                      {sendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Icons + Reply Input */}
            {!showComments && (
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {/* Like Button */}
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={handleToggleLike}
                    className="relative"
                  >
                    <Heart className={`w-7 h-7 transition-colors ${isLiked ? 'text-red-500 fill-red-500' : 'text-white/80 hover:text-white'}`} />
                    {likesCount > 0 && (
                      <span className="absolute -top-1 -right-2 text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                        {likesCount}
                      </span>
                    )}
                  </motion.button>

                  {/* Comment Button */}
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={handleOpenComments}
                  >
                    <MessageCircle className="w-7 h-7 text-white/80 hover:text-white transition-colors" />
                  </motion.button>

                  {/* Highlight Button - Only for own stories */}
                  {user?.id === currentUser?.id && (
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      onClick={() => setShowHighlightModal(true)}
                      className="relative"
                    >
                      <span className="text-xl">✨</span>
                    </motion.button>
                  )}
                </div>

                {/* Quick Reply Input */}
                <div className="flex items-center gap-3 text-white/90">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onFocus={() => { setIsPaused(true); }}
                    onBlur={() => { if (!showComments) setIsPaused(false); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newComment.trim()) {
                        handleOpenComments();
                        setTimeout(() => handleSendComment(), 500);
                      }
                    }}
                    placeholder={`Répondre à ${currentUser.name.split(' ')[0]}...`}
                    className="flex-1 bg-black/40 border border-white/30 rounded-full px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Highlight Modal */}
        <AnimatePresence>
          {showHighlightModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowHighlightModal(false);
                setHighlightTitle('');
              }}
              className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#111] rounded-2xl border border-white/20 p-6 w-full max-w-sm shadow-2xl"
              >
                <h2 className="text-xl font-bold text-white mb-4">Ajouter aux highlights</h2>
                
                <input
                  type="text"
                  value={highlightTitle}
                  onChange={(e) => setHighlightTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && highlightTitle.trim()) {
                      setSavingHighlight(true);
                      postsService.saveStoryAsHighlight(currentItem.id, highlightTitle)
                        .then(() => {
                          toast.success('Story ajoutée aux highlights!');
                          setShowHighlightModal(false);
                          setHighlightTitle('');
                          // Emit event for real-time update in timeline
                          window.dispatchEvent(new CustomEvent('highlightAdded'));
                        })
                        .catch(() => {
                          toast.error('Erreur lors de l\'ajout aux highlights');
                        })
                        .finally(() => setSavingHighlight(false));
                    }
                  }}
                  placeholder="Ex: Vacances, Amis, Fitness..."
                  autoFocus
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/60 mb-6 transition-colors"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowHighlightModal(false);
                      setHighlightTitle('');
                    }}
                    disabled={savingHighlight}
                    className="flex-1 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      if (highlightTitle.trim()) {
                        setSavingHighlight(true);
                        postsService.saveStoryAsHighlight(currentItem.id, highlightTitle)
                          .then(() => {
                            toast.success('Story ajoutée aux highlights!');
                            setShowHighlightModal(false);
                            setHighlightTitle('');
                            // Emit event for real-time update in timeline
                            window.dispatchEvent(new CustomEvent('highlightAdded'));
                          })
                          .catch(() => {
                            toast.error('Erreur lors de l\'ajout aux highlights');
                          })
                          .finally(() => setSavingHighlight(false));
                      }
                    }}
                    disabled={!highlightTitle.trim() || savingHighlight}
                    className="flex-1 px-4 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingHighlight ? 'Ajout...' : 'Ajouter'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
