import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Loader2, Users, Camera, Newspaper, User, UserPlus, BarChart3, BadgeCheck, MoreHorizontal, MessageSquare, ThumbsUp, Share2, Trash2, Archive, Calendar, Filter, ChevronDown
} from 'lucide-react';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import { Button } from '../components/button';
import { postsService } from '../../lib/services/posts.service';
import { usersService } from '../../lib/services/users.service';
import { useAuthStore } from '../../stores/auth.store';
import type { Post, Comment } from '../../lib/types';
import toast from 'react-hot-toast';
import { ProfileHero } from './components/profile-hero';
import { PostComposer } from './components/post-composer';
import { PostCard } from './components/post-card';
import { StoryTimeline } from './components/story-timeline';
import type { PostCardData } from './components/post-card';
import { StoryBar, StoryUser } from './components/story-bar';
import { StoryUploadModal } from './components/story-upload-modal';
import { StoryViewerModal } from './components/story-viewer-modal';
import { SuggestionsTab } from './components/suggestions-tab';
import { StatsTab, CommunityStats } from './components/stats-tab';

type CommunityTab = 'feed' | 'profile' | 'suggestions' | 'stats' | 'archive';

interface CommunityPageProps {
  onBack?: () => void;
  onViewProfile?: (userId: string) => void;
}

const StackedAvatars = ({ avatars, extraCount, className = "" }: { avatars: string[], extraCount: string, className?: string }) => (
  <div className={`flex items-center -space-x-2.5 ${className}`}>
    {avatars.map((avatar, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: i * 0.1 }}
        className="relative w-7 h-7 rounded-full border-2 border-white dark:border-[#1e293b] overflow-hidden shadow-sm"
      >
        <img src={avatar} alt={`Member ${i}`} className="w-full h-full object-cover" />
      </motion.div>
    ))}
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-white dark:border-[#1e293b] bg-gradient-to-tr from-[#0EA5E9] to-[#8B5CF6] text-[8px] font-black text-white shadow-sm"
    >
      +{extraCount}
    </motion.div>
  </div>
);

const CommentsSection = ({ 
  postId, 
  comments, 
  loading, 
  onAddComment, 
  newComment, 
  setNewComment, 
  userAvatar, 
  userName, 
  t, 
  isDark, 
  isHcHigh, 
  cardBg, 
  textColor, 
  subText,
  onLikeComment,
  onReplyComment,
  onDeleteComment,
  replyingTo,
  setReplyingTo,
  currentUserId
}: { 
  postId: string, 
  comments: Comment[], 
  loading: boolean, 
  onAddComment: () => void, 
  newComment: string, 
  setNewComment: (s: string) => void, 
  userAvatar?: string, 
  userName: string, 
  t: any, 
  isDark: boolean, 
  isHcHigh: boolean, 
  cardBg: string, 
  textColor: string, 
  subText: string,
  onLikeComment: (commentId: string) => void,
  onReplyComment: (comment: Comment | null) => void,
  onDeleteComment: (commentId: string) => void,
  replyingTo: Comment | null,
  setReplyingTo: (c: Comment | null) => void,
  currentUserId?: string
}) => (
  <motion.div 
    initial={{ opacity: 0, height: 0 }} 
    animate={{ opacity: 1, height: 'auto' }} 
    exit={{ opacity: 0, height: 0 }} 
    className={`overflow-hidden rounded-2xl border shadow-lg mt-[-10px] mb-4 z-10 relative ${isHcHigh ? 'bg-black border-yellow-400' : isDark ? 'bg-white/5 border-white/10 backdrop-blur-xl shadow-black/40' : 'bg-white/80 border-gray-100 backdrop-blur-xl shadow-gray-200/50'}`}
  >
    <div className="p-4 sm:p-5 pt-6">
      <div className="flex items-center justify-between mb-4 px-2">
        <h4 className={`text-xs font-black uppercase tracking-[0.1em] ${subText}`}>{comments.length} {t('community.comments')}</h4>
        <div className={`h-px flex-1 mx-4 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9]" />
          <p className={`text-xs font-bold animate-pulse ${subText}`}>{t('community.loadingDiscussions')}</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10">
          <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <MessageSquare className={`w-6 h-6 ${subText} opacity-30`} />
          </div>
          <p className={`${subText} text-xs font-medium italic`}>{t('community.noComments')}</p>
        </div>
      ) : (
        <div className="space-y-5 mb-6 relative">
          <div className={`absolute left-[15px] top-6 bottom-8 w-[2px] ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
          {comments.map((comment, idx) => (
            <motion.div 
              key={comment.id} 
              initial={{ opacity: 0, x: -15 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: idx * 0.05 }}
              className={`group/comment flex items-start gap-3 relative z-10 ${comment.parentId ? 'ml-8' : ''}`}
            >
              <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm transition-transform group-hover/comment:scale-110 ${isHcHigh ? 'bg-black border-yellow-400 text-cyan-400' : isDark ? 'bg-[#1e293b] border-white/10 text-white' : 'bg-white border-gray-100 text-[#0EA5E9]'}`}>
                {comment.user?.avatar ? <img src={comment.user.avatar} alt={comment.user?.name} className="w-full h-full object-cover rounded-2xl" /> : comment.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`px-4 py-3 rounded-2xl transition-all ${isHcHigh ? 'bg-black border border-yellow-400' : isDark ? 'bg-[#0f172a]/80 group-hover/comment:bg-[#0f172a]' : 'bg-[#F8FAFC] group-hover/comment:bg-[#F1F5F9]'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`block text-xs font-black ${textColor}`}>{comment.user?.name || t('common.user')}</span>
                    <span className={`text-[10px] font-bold opacity-40 ${subText}`}>{t('community.justNow')}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-[#334155]'}`}>{comment.comment}</p>
                </div>
                <div className="flex items-center gap-4 px-2 mt-2">
                  <button 
                    onClick={() => onLikeComment(comment.id)}
                    className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider transition-colors hover:text-[#0EA5E9] ${comment.isLiked ? 'text-[#0EA5E9]' : subText}`}
                  >
                    <ThumbsUp className={`w-3 h-3 ${comment.isLiked ? 'fill-current' : ''}`} /> 
                    {comment._count?.likes || 0} {t('community.reactions.like')}
                  </button>
                  {!comment.parentId && (
                    <button 
                      onClick={() => onReplyComment(comment)}
                      className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider transition-colors hover:text-[#0EA5E9] ${replyingTo?.id === comment.id ? 'text-[#0EA5E9]' : subText}`}
                    >
                      <Share2 className="w-3 h-3" /> {t('common.reply')}
                    </button>
                  )}
                  {comment.userId === currentUserId && (
                    <button 
                      onClick={() => onDeleteComment(comment.id)}
                      className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider transition-colors hover:text-red-500 ${subText}`}
                    >
                      <Trash2 className="w-3 h-3" /> {t('common.delete')}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Replying indicator */}
      {replyingTo && (
        <div className={`flex items-center justify-between px-3 py-2 mb-2 rounded-xl text-[10px] font-black uppercase tracking-wider border-l-4 border-[#0EA5E9] ${isDark ? 'bg-white/5 text-[#0EA5E9]' : 'bg-blue-50 text-[#0EA5E9]'}`}>
           <span>{t('community.replyingTo')} <strong>{replyingTo.user?.name}</strong></span>
           <button onClick={() => setReplyingTo(null)} className="opacity-60 hover:opacity-100">{t('common.cancel')}</button>
        </div>
      )}

      {/* Comment Input Box */}
      <div className={`mt-2 p-3 rounded-3xl border ${isHcHigh ? 'border-yellow-400' : isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100 shadow-inner'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center font-bold text-xs flex-shrink-0 ${isHcHigh ? 'bg-black border-yellow-400 text-cyan-400' : isDark ? 'bg-[#334155] border-white/20 shadow-lg' : 'bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white shadow-md shadow-[#0EA5E9]/20'}`}>
            {userAvatar ? <img src={userAvatar} alt={userName} className="w-full h-full object-cover rounded-2xl" /> : (userName || t('common.user')).charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 relative group">
            <input 
              value={newComment} 
              onChange={(e) => setNewComment(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && onAddComment()} 
              placeholder={t('community.addComment')}
              className={`w-full px-4 py-2.5 rounded-2xl text-sm focus:outline-none transition-all pr-12 ${isHcHigh ? 'bg-black border-2 border-yellow-400 text-cyan-400' : isDark ? 'bg-[#0f172a] border border-white/10 text-gray-200 focus:border-[#0EA5E9] focus:bg-[#0f172a]' : 'bg-white border border-gray-200 text-[#111827] focus:border-[#0EA5E9] focus:shadow-sm'}`}
            />
            <button 
              onClick={onAddComment} 
              disabled={!newComment.trim()}
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl transition-all ${newComment.trim() ? 'bg-[#0EA5E9] text-white shadow-lg shadow-[#0EA5E9]/30 hover:scale-105 active:scale-95' : 'bg-gray-400/10 text-gray-400 opacity-40'}`}
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

export function CommunityPage({ onBack, onViewProfile }: CommunityPageProps) {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<CommunityTab>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<StoryUser[]>([]);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [posting, setPosting] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingCover, setLoadingCover] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [communityImage, setCommunityImage] = useState<string | null>(user?.coverPhoto || null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [myStory, setMyStory] = useState<StoryUser | null>(null);
  const [openMyStory, setOpenMyStory] = useState(false);
  const [userStats, setUserStats] = useState<CommunityStats>({
    posts: 0,
    followers: 0,
    following: 0,
    totalLikes: 0,
    totalComments: 0,
    weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
    storyViews: 0,
    impressions: 0,
    shares: 0,
    recentFollowersAvatars: [],
    followersDetail: []
  });
  const [dateFilter, setDateFilter] = useState<'recent' | 'month' | 'year'>('recent');

  const { theme, contrastMode, t } = useAccessibilityStore();
  const isHcHigh = contrastMode === 'high';
  const isDark = theme === 'dark';

  const [quickSuggestions, setQuickSuggestions] = useState<any[]>([]);

  // ─── Colors ───
  const pageBg = isHcHigh ? 'bg-black' : isDark ? 'bg-[#0f172a]' : '';
  const cardBg = isHcHigh ? 'bg-black border-2 border-yellow-400' : isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#E5E7EB]';
  const textColor = isHcHigh ? 'text-cyan-400' : isDark ? 'text-gray-200' : 'text-[#111827]';
  const subText = isHcHigh ? 'text-yellow-300' : isDark ? 'text-gray-400' : 'text-[#6B7280]';

  const loadPosts = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const result = activeTab === 'archive'
        ? await postsService.getArchivedPosts(pageNum, 20)
        : activeTab === 'profile' 
        ? await postsService.getMyPosts(pageNum, 20)
        : await postsService.getFeed(pageNum, 20);
        
      if (pageNum === 1) {
        setPosts(result.data || []);
      } else {
        setPosts((prev) => [...prev, ...(result.data || [])]);
      }
      setHasMore((result.data?.length || 0) >= 20);
    } catch {
      toast.error(t('community.loadPostsError'));
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // ─── Cover / Avatar handlers (unchanged logic) ───
  const handleCoverPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t('community.fileTooLarge')); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error(t('community.invalidFileType')); return; }
    setLoadingCover(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        await handleCoverPhotoUpload(base64);
      };
      reader.readAsDataURL(file);
    } catch { toast.error(t('community.uploadError')); } finally { setLoadingCover(false); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t('community.fileTooLarge')); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error(t('community.invalidFileType')); return; }
    setLoadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        await handleAvatarUpload(base64);
      };
      reader.readAsDataURL(file);
    } catch { toast.error(t('community.uploadError')); } finally { setLoadingAvatar(false); }
  };

  const handleCoverPhotoUpload = async (base64: string) => {
    try {
      setLoadingCover(true);
      const response = await fetch('http://localhost:3000/auth/profile/cover', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({ coverPhotoUrl: base64 }),
      });
      if (!response.ok) throw new Error('Erreur');
      const updatedUser = await response.json();
      if (user) {
        setUser({ ...user, coverPhoto: updatedUser.coverPhoto });
        setCommunityImage(updatedUser.coverPhoto);
      }
      toast.success(t('community.coverUpdated'));
    } catch { toast.error(t('community.uploadError')); } finally { setLoadingCover(false); }
  };

  const handleAvatarUpload = async (base64: string) => {
    try {
      setLoadingAvatar(true);
      const response = await fetch('http://localhost:3000/auth/profile/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({ avatarUrl: base64 }),
      });
      if (!response.ok) throw new Error('Erreur');
      const updatedUser = await response.json();
      if (user) {
        setUser({ ...user, avatar: updatedUser.avatar });
      }
      toast.success(t('community.avatarUpdated'));
    } catch { toast.error(t('community.uploadError')); } finally { setLoadingAvatar(false); }
  };

  const loadStories = useCallback(async () => {
    try {
      const activeStories = await postsService.getActiveStories();
      if (activeStories && activeStories.length > 0) {
        // Group by user
        const groupedMap = new Map<string, StoryUser>();
        activeStories.forEach(s => {
           if (!groupedMap.has(s.userId)) {
              groupedMap.set(s.userId, {
                 id: s.userId,
                 name: s.name,
                 avatar: s.avatar,
                 items: [],
                 isAllViewed: false
              });
           }
           groupedMap.get(s.userId)!.items.push({
              id: s.id,
              mediaUrl: s.mediaUrl,
              createdAt: s.createdAt,
              musicUrl: s.musicUrl,
              musicTitle: s.musicTitle,
              likesCount: s.likesCount || 0,
              commentsCount: s.commentsCount || 0,
              isLiked: s.isLiked || false,
           });
        });

        const allStoriesArray = Array.from(groupedMap.values());
        
        // Find my story and separate from others
        const myId = user?.id || user?.sub;
        const meIndex = allStoriesArray.findIndex(s => s.id === myId);
        
        if (meIndex !== -1) {
           setMyStory(allStoriesArray[meIndex]);
           setStories(allStoriesArray.filter(s => s.id !== myId));
        } else {
           setMyStory(null);
           setStories(allStoriesArray);
        }
      } else {
        setMyStory(null);
        setStories([]);
      }
    } catch {
      // Failed to load stories
    }
  }, [user]);

  const loadUserStats = useCallback(async () => {
    const userId = user?.id || user?.sub;
    if (!userId) return;
    try {
      const data = await usersService.getUserStats(userId);
      setUserStats(data);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'stats') {
      loadUserStats();
    }
  }, [activeTab, loadUserStats]);

  useEffect(() => { loadPosts(1); loadStories(); loadUserStats(); loadQuickSuggestions(); }, [loadPosts, loadStories, loadUserStats]);
  useEffect(() => { if (user?.coverPhoto) setCommunityImage(user.coverPhoto); }, [user?.coverPhoto]);

  const loadQuickSuggestions = async () => {
    try {
      const data = await usersService.getSuggestions();
      setQuickSuggestions(data.slice(0, 3));
    } catch { /* ignore */ }
  };

  // ─── Story Upload Handler ───
  const handleStoryUpload = async (file: File, musicFile?: File, musicTitle?: string) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;

      let musicBase64: string | undefined;
      if (musicFile) {
        musicBase64 = await new Promise<string>((resolve) => {
          const musicReader = new FileReader();
          musicReader.onload = (ev) => resolve(ev.target?.result as string);
          musicReader.readAsDataURL(musicFile);
        });
      }

      try {
        const created = await postsService.createStory(
          base64Data,
          user?.id || user?.sub,
          musicBase64,
          musicTitle
        );
        
        loadStories();
        
        toast.success(t('community.storySuccess'));
      } catch {
        toast.error(t('community.storyError'));
      }
    };

    reader.readAsDataURL(file);
  };

  const handleUserStoryFinished = useCallback((userId: string) => {
    setStories(prev => {
      const storyUserIndex = prev.findIndex(s => s.id === userId);
      if (storyUserIndex === -1) return prev;
      
      const newArr = [...prev];
      if (newArr[storyUserIndex].isAllViewed) return prev; // prevent redundant update causing loops
      
      const viewedUser = { ...newArr[storyUserIndex], isAllViewed: true };
      
      // Move to the end
      newArr.splice(storyUserIndex, 1);
      newArr.push(viewedUser);
      
      return newArr;
    });
  }, []);

  // ─── Post actions ───
  const handleCreatePost = async (content: string, media?: string) => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      const post = await postsService.create({ message: content, media: media || undefined });
      setPosts((prev) => [post, ...prev]);
      toast.success(t('community.postPublished'));
    } catch { toast.error(t('community.uploadError')); } finally { setPosting(false); }
  };

  const handleToggleLike = async (postId: string, type: string = 'like') => {
    try {
      const result = await postsService.toggleLike(postId, type);
      setPosts((prev) => prev.map((p) => p.id === postId
        ? { 
            ...p, 
            isLiked: result.liked, 
            reaction: result.type,
            _count: { 
              ...p._count, 
              likes: result.likesCount,
              comments: p._count?.comments || 0 
            } 
          }
        : p
      ));
    } catch { toast.error(t('common.error')); }
  };

  const handleDeletePost = async (postId: string) => {
    toast((toastInstance) => (
      <div className="flex flex-col gap-3 min-w-[280px]">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-black text-gray-900 dark:text-white">{t('community.deletePostTitle')}</p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
              {t('community.deletePostDesc')}
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-2">
          <button onClick={() => toast.dismiss(toastInstance.id)} className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-gray-400 hover:text-gray-500 transition-colors">
            {t('common.cancel')}
          </button>
          <button
            onClick={async () => {
              toast.dismiss(toastInstance.id);
              try {
                const loadingToast = toast.loading(t('common.loading') || "Suppression...");
                await postsService.delete(postId);
                setPosts((prev) => prev.filter((p) => p.id !== postId));
                setUserStats(prev => ({ ...prev, posts: Math.max(0, prev.posts - 1) }));
                toast.success(t('common.success') || "Publication supprimée", { id: loadingToast });
              } catch {
                toast.error(t('common.error') || "Erreur lors de la suppression");
              }
            }}
            className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-red-600 text-white shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all hover:scale-105 active:scale-95"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    ), { duration: 5000, position: 'bottom-center', className: isDark ? '!bg-[#0F172A] !border-white/10 !text-white backdrop-blur-xl' : '!bg-white !border-gray-100 !text-gray-900' });
  };

  const handleArchivePost = async (postId: string, isArchived: boolean = false) => {
    return new Promise<void>((resolve) => {
      toast((toastInstance) => (
        <div className="flex flex-col gap-3 min-w-[280px]">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${isArchived ? 'bg-green-500/10' : 'bg-[#0EA5E9]/10'}`}>
              <Archive className={`w-5 h-5 ${isArchived ? 'text-green-500' : 'text-[#0EA5E9]'}`} />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 dark:text-white">
                {isArchived ? t('community.restorePostTitle') : t('community.archivePostTitle')}
              </p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                {isArchived ? t('community.restorePostDesc') : t('community.archivePostDesc')}
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button onClick={() => { toast.dismiss(toastInstance.id); resolve(); }} className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-gray-400 hover:text-gray-500 transition-colors">
              {t('common.cancel')}
            </button>
            <button
              onClick={async () => {
                toast.dismiss(toastInstance.id);
                try {
                  const loadingToast = toast.loading(t('common.loading') || "Traitement...");
                  await postsService.toggleArchive(postId);
                  setPosts((prev) => prev.filter((p) => p.id !== postId));
                  toast.success(t('common.success') || "Action réussie", { id: loadingToast });
                  resolve();
                } catch {
                  toast.error(t('common.error') || "Erreur lors de l'action");
                  resolve();
                }
              }}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${isArchived ? 'bg-green-600 shadow-green-500/20 hover:bg-green-700' : 'bg-[#0EA5E9] shadow-[#0EA5E9]/20 hover:bg-[#0284C7]'}`}
            >
              {isArchived ? t('community.restore') : t('community.archive')}
            </button>
          </div>
        </div>
      ), { duration: 5000, position: 'bottom-center', className: isDark ? '!bg-[#0F172A] !border-white/10 !text-white backdrop-blur-xl' : '!bg-white !border-gray-100 !text-gray-900' });
    });
  };

  const loadComments = async (postId: string) => {
    if (selectedPost === postId) { setSelectedPost(null); setComments([]); return; }
    setSelectedPost(postId);
    setCommentLoading(true);
    try {
      const result = await postsService.getComments(postId);
      setComments(result.data || []);
    } catch { toast.error(t('community.loadCommentsError')); } finally { setCommentLoading(false); }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return;
    try {
      const comment = await postsService.addComment({ 
        postId: selectedPost, 
        comment: replyingTo ? `@${replyingTo.user?.name} ${newComment}` : newComment,
        parentId: replyingTo?.id 
      });
      setComments((prev) => [...prev, comment]);
      setNewComment('');
      setReplyingTo(null);
      setPosts((prev) => prev.map((p) => p.id === selectedPost
        ? { ...p, _count: { ...p._count, likes: p._count?.likes || 0, comments: (p._count?.comments || 0) + 1 } }
        : p
      ));
    } catch { toast.error(t('community.addCommentError')); }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const res = await postsService.toggleCommentLike(commentId);
      setComments(prev => prev.map(c => c.id === commentId 
        ? { 
            ...c, 
            isLiked: res.liked, 
            _count: { ...c._count, likes: (c._count?.likes || 0) + (res.liked ? 1 : -1) } 
          } 
        : c
      ));
    } catch { /* ignore */ }
  };

  const handleDeleteComment = async (commentId: string) => {
    toast((toastInstance) => (
      <div className="flex flex-col gap-3 min-w-[280px]">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-black text-gray-900 dark:text-white">{t('community.deleteCommentTitle')}</p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
              {t('community.deleteCommentDesc')}
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-2">
          <button
            onClick={() => toast.dismiss(toastInstance.id)}
            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-gray-400 hover:text-gray-500 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={async () => {
              toast.dismiss(toastInstance.id);
              try {
                const loadingToast = toast.loading(t('common.loading'));
                await postsService.deleteComment(commentId);
                setComments(prev => prev.filter(c => c.id !== commentId));
                setPosts((prev) => prev.map((p) => p.id === selectedPost
                  ? { ...p, _count: { ...p._count, likes: p._count?.likes || 0, comments: Math.max(0, (p._count?.comments || 0) - 1) } }
                  : p
                ));
                toast.success(t('community.commentDeleted'), { id: loadingToast });
              } catch {
                toast.error(t('common.error'));
              }
            }}
            className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-red-600 text-white shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all hover:scale-105 active:scale-95"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'bottom-center',
      className: isDark ? '!bg-[#0F172A] !border-white/10 !text-white backdrop-blur-xl' : '!bg-white !border-gray-100 !text-gray-900',
    });
  };

  // ─── Sub-tab definitions ───
  const tabs: { key: CommunityTab; label: string; icon: React.ReactNode }[] = [
    { key: 'feed', label: t('community.feed'), icon: <Newspaper className="w-4 h-4" /> },
    { key: 'archive', label: t('community.archivesTab') || 'Archives', icon: <Archive className="w-4 h-4" /> },
    { key: 'profile', label: t('community.profile'), icon: <User className="w-4 h-4" /> },
    { key: 'suggestions', label: t('community.suggestions'), icon: <UserPlus className="w-4 h-4" /> },
    { key: 'stats', label: t('community.stats'), icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className={`min-h-screen relative ${pageBg}`}>
      <StoryUploadModal 
        isOpen={isStoryModalOpen} 
        onClose={() => setIsStoryModalOpen(false)} 
        onUpload={handleStoryUpload}
        userAvatar={user?.avatar}
        userName={user?.name || t('common.user')}
      />
      <StoryViewerModal
        isOpen={selectedStoryIndex !== null || openMyStory}
        onClose={() => {
          setSelectedStoryIndex(null);
          setOpenMyStory(false);
        }}
        stories={openMyStory && myStory ? [myStory] : stories}
        initialUserIndex={openMyStory ? 0 : (selectedStoryIndex !== null ? selectedStoryIndex : 0)}
        onUserFinished={handleUserStoryFinished}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* ═══ Sub-navigation tabs ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border shadow-sm p-1.5 mb-6 flex gap-1 ${cardBg}`}
        >
          {tabs.map((tab) => (
            <motion.button
              key={tab.key}
              onClick={() => {
                if (tab.key === 'profile' && activeTab === 'profile') {
                  loadUserStats();
                }
                setActiveTab(tab.key as any);
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.key
                  ? isHcHigh
                    ? 'bg-yellow-400 text-black shadow-md'
                    : isDark
                      ? 'bg-[#0EA5E9] text-white shadow-lg shadow-[#0EA5E9]/20'
                      : 'bg-[#0EA5E9] text-white shadow-lg shadow-[#0EA5E9]/20'
                  : isHcHigh
                    ? 'text-yellow-400 hover:bg-yellow-400/10'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-[#334155]'
                      : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* ═══ Tab Content ═══ */}
        <AnimatePresence mode="wait">
          {/* ────── FEED TAB ────── */}
          {activeTab === 'feed' && (
            <motion.div key="feed" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9]" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                  {/* Main Feed */}
                  <div>
                    {/* Stories */}
                    <StoryBar 
                      currentUserAvatar={user?.avatar} 
                      currentUserName={user?.name || t('common.you')} 
                      stories={stories}
                      myStory={myStory}
                      onAddClick={() => setIsStoryModalOpen(true)}
                      onStoryClick={(i) => setSelectedStoryIndex(i)}
                      onMyStoryClick={() => setOpenMyStory(true)}
                    />

                    {/* Post Composer */}
                    <PostComposer
                      userAvatar={user?.avatar}
                      userName={user?.name || t('common.user')}
                      onSubmit={handleCreatePost}
                      placeholder={t('community.postPlaceholder')}
                      isLoading={posting}
                    />

                    {/* Posts Feed */}
                    {posts.length === 0 ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-center py-16 rounded-2xl border ${cardBg}`}>
                        <Users className={`w-16 h-16 mx-auto mb-4 ${isHcHigh ? 'text-yellow-400' : 'text-[#D1D5DB]'}`} />
                        <h3 className={`text-lg font-semibold ${subText}`}>{t('community.noPosts')}</h3>
                        <p className={`text-sm ${subText} opacity-70`}>{t('community.beFirst')}</p>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        {posts.map((post) => (
                          <React.Fragment key={post.id}>
                            <PostCard
                              post={{
                                id: post.id, userId: post.userId,
                                userName: post.user?.name || t('common.user'),
                                userAvatar: post.user?.avatar ?? undefined,
                                content: post.message, media: post.media ?? undefined,
                                createdAt: post.createdAt,
                                likes: post._count?.likes || 0,
                                comments: post._count?.comments || 0,
                                shares: 0,
                                isLiked: post.isLiked || false,
                                isByCurrentUser: post.userId === user?.sub || post.userId === user?.id,
                                reaction: post.reaction,
                              }}
                              onLike={handleToggleLike}
                              onComment={loadComments}
                              onDelete={handleDeletePost}
                              onArchive={(id) => handleArchivePost(id, false)}
                              onProfileClick={onViewProfile}
                            />
                            <AnimatePresence>
                              {selectedPost === post.id && (
                                <CommentsSection
                                  postId={post.id}
                                  comments={comments}
                                  loading={commentLoading}
                                  onAddComment={handleAddComment}
                                  newComment={newComment}
                                  setNewComment={setNewComment}
                                  userAvatar={user?.avatar}
                                  userName={user?.name || 'User'}
                                  t={t}
                                  isDark={isDark}
                                  isHcHigh={isHcHigh}
                                  cardBg={cardBg}
                                  textColor={textColor}
                                  subText={subText}
                                  onLikeComment={handleLikeComment}
                                  onReplyComment={setReplyingTo}
                                  onDeleteComment={handleDeleteComment}
                                  replyingTo={replyingTo}
                                  setReplyingTo={setReplyingTo}
                                  currentUserId={user?.id || user?.sub}
                                />
                              )}
                            </AnimatePresence>
                          </React.Fragment>
                        ))}

                        {hasMore && (
                          <div className="text-center pt-4">
                            <Button variant="outline" onClick={() => { setPage((p) => p + 1); loadPosts(page + 1); }} loading={loading}>
                              {t('common.loadMore')}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sidebar (desktop) */}
                  <div className="hidden lg:block space-y-4 sticky top-20 h-fit">
                    {/* Quick Profile Card */}
                    <div className={`rounded-2xl border shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl group/card ${cardBg}`}>
                      <div className={`relative h-24 overflow-hidden ${isHcHigh ? 'bg-gradient-to-r from-yellow-600 to-yellow-800' : 'bg-gradient-to-br from-[#0EA5E9]/40 via-[#8B5CF6]/30 to-[#F9A8D4]/40'}`}>
                        {communityImage && <img src={communityImage} alt="cover" className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                      <div className="px-4 pb-5 -mt-10 relative z-10 text-center">
                        <div className={`w-20 h-20 rounded-full mx-auto border-4 overflow-hidden shadow-xl mb-3 transition-transform duration-500 group-hover/card:scale-105 ${isHcHigh ? 'border-black' : isDark ? 'border-[#1e293b]' : 'border-white'}`}>
                          {user?.avatar ? <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" /> : (
                            <div className={`w-full h-full flex items-center justify-center text-2xl font-bold ${isHcHigh ? 'bg-black text-cyan-400' : 'bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white'}`}>
                              {user?.name?.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <h3 className={`font-bold text-sm ${textColor}`}>{user?.name || 'Utilisateur'}</h3>
                          <BadgeCheck className="w-3.5 h-3.5 text-[#0EA5E9] fill-[#0EA5E9]/10" />
                        </div>
                        <p className={`text-xs ${subText} opacity-80`}>@{user?.email?.split('@')[0]}</p>

                        <div className={`flex justify-around mt-5 py-3 rounded-xl border border-dashed transition-colors ${isHcHigh ? 'border-yellow-400/30' : isDark ? 'border-[#334155] bg-[#0f172a]/40' : 'border-[#E5E7EB] bg-[#F9FAFB]/80'}`}>
                          <div className="text-center group/stat cursor-pointer" onClick={() => setActiveTab('profile')}>
                            <div className="flex flex-col items-center">
                              <p className={`font-black text-sm ${textColor} group-hover/stat:text-[#0EA5E9] transition-colors`}>{userStats.posts}</p>
                              <div className="mt-1 scale-75 origin-top flex items-center gap-1 bg-[#0EA5E9]/10 text-[#0EA5E9] px-2.5 py-1 rounded-xl font-bold shadow-sm">
                                <Newspaper className="w-3 h-3" />
                                <span className="text-[10px] uppercase tracking-widest">{t('community.active')}</span>
                              </div>
                            </div>
                            <p className={`text-[9px] uppercase tracking-wider font-bold ${subText} mt-1`}>{t('community.posts')}</p>
                          </div>
                          <div className="w-px h-8 self-center bg-gray-200 dark:bg-[#334155]" />
                          <div className="text-center group/stat cursor-pointer" onClick={() => setActiveTab('suggestions')}>
                            <div className="flex flex-col items-center">
                              <p className={`font-black text-sm ${textColor} group-hover/stat:text-[#0EA5E9] transition-colors`}>
                                {userStats.followers >= 1000 ? `${(userStats.followers / 1000).toFixed(1)}K` : userStats.followers}
                              </p>
                              <StackedAvatars
                                className="mt-1 scale-75 origin-top"
                                extraCount={userStats.followers > 3 ? (userStats.followers - 3).toString() : "0"}
                                avatars={userStats.recentFollowersAvatars.length > 0 ? userStats.recentFollowersAvatars : ["https://i.pravatar.cc/150?u=1", "https://i.pravatar.cc/150?u=2", "https://i.pravatar.cc/150?u=3"]}
                              />
                            </div>
                            <p className={`text-[9px] uppercase tracking-wider font-bold ${subText} mt-1`}>{t('community.followers')}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Suggestions */}
                    <div className={`rounded-2xl border shadow-sm p-4 ${cardBg}`}>
                      <h3 className={`font-bold text-sm ${textColor} mb-3`}>{t('community.suggestions')}</h3>
                      {quickSuggestions.map((suggestion, i) => (
                        <div key={suggestion.id || i} className={`flex items-center gap-3 py-2.5 ${i < 2 ? `border-b ${isHcHigh ? 'border-yellow-400/20' : isDark ? 'border-[#334155]' : 'border-[#E5E7EB]'}` : ''}`}>
                          <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold ${isHcHigh ? 'bg-black border border-yellow-400 text-cyan-400' : 'bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white'}`}>
                            {suggestion.avatar ? <img src={suggestion.avatar} alt={suggestion.name} className="w-full h-full object-cover" /> : suggestion.name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1 min-w-0" onClick={() => onViewProfile && onViewProfile(suggestion.id)} style={{ cursor: 'pointer' }}>
                            <p className={`text-xs font-semibold truncate ${textColor} hover:text-[#0EA5E9] transition-colors`}>{suggestion.name}</p>
                            <p className={`text-[10px] ${subText} truncate`}>{suggestion.skinProfile?.skinType ? t('community.skinType', { type: suggestion.skinProfile.skinType }) : t('community.skincareEnthusiast')}</p>
                          </div>
                          <button 
                            onClick={async () => {
                              try {
                                const res = await usersService.toggleFollow(suggestion.id);
                                if (res.followed) toast.success(t('common.success'));
                              } catch { toast.error(t('common.error')); }
                            }}
                            className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${isHcHigh ? 'bg-yellow-400 text-black' : 'bg-[#0EA5E9]/10 text-[#0EA5E9] hover:bg-[#0EA5E9]/20'}`}
                          >
                            {t('common.follow')}
                          </button>
                        </div>
                      ))}
                      <button onClick={() => setActiveTab('suggestions')} className={`w-full text-center text-xs font-semibold mt-3 py-2 rounded-lg transition-colors ${isHcHigh ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-[#0EA5E9] hover:bg-[#0EA5E9]/5'}`}>
                        {t('common.seeAll')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ────── PROFILE TAB ────── */}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-3xl shadow-xl overflow-hidden mb-8 group/hero ${isHcHigh ? 'border-2 border-yellow-400 bg-black' : isDark ? 'bg-[#1e293b] border border-[#334155]' : 'bg-white border border-gray-100'}`}>
                <div className={`relative h-64 cursor-pointer overflow-hidden ${isHcHigh ? 'bg-black border-b-2 border-yellow-400' : 'bg-gradient-to-br from-[#0EA5E9] via-[#8B5CF6] to-[#F9A8D4]'}`}
                  onClick={() => coverInputRef.current?.click()}>
                  {communityImage && <img src={communityImage} alt="Community cover" className="w-full h-full object-cover transition-transform duration-1000 group-hover/hero:scale-105" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-8 backdrop-blur-[2px]">
                    <div className="flex items-center gap-6 mb-2">
                       <div className="relative flex-shrink-0 cursor-pointer group/avatar">
                        <div onClick={(e) => { e.stopPropagation(); avatarInputRef.current?.click(); }}
                          className={`w-40 h-40 rounded-3xl border-4 overflow-hidden shadow-2xl flex items-center justify-center text-6xl font-bold transition-all duration-500 group-hover/hero:translate-y-[-8px] ${isHcHigh ? 'border-yellow-400 bg-black text-cyan-400' : isDark ? 'border-[#1e293b] bg-gradient-to-br from-[#F9A8D4] to-[#FED7AA] text-white' : 'border-white bg-gradient-to-br from-[#F9A8D4] to-[#FED7AA] text-white'}`}>
                          {user?.avatar ? <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" /> : <p>{user?.name?.charAt(0) || 'U'}</p>}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); avatarInputRef.current?.click(); }} className="absolute -bottom-2 -right-2 p-3 bg-[#0EA5E9] text-white rounded-2xl hover:bg-[#0284C7] transition-all shadow-xl hover:scale-110 active:scale-95 z-20">
                          {loadingAvatar ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                        </button>
                        <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="hidden" />
                      </div>
                      <div className="mb-4 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <h1 className="text-4xl font-black text-white drop-shadow-lg">{user?.name || 'DeepSkyn Communauté'}</h1>
                          <BadgeCheck className="w-7 h-7 text-[#0EA5E9] fill-white" />
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-white/90 font-medium">@{user?.email?.split('@')[0] || 'utilisateur'}</p>
                          <span className="w-1 h-1 rounded-full bg-white/40" />
                          <p className="text-white/90 font-medium flex items-center gap-1.5"><Users className="w-4 h-4" /> Membre depuis 2024</p>
                        </div>
                      </div>
                    </div>

                    <button className="mb-6 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 text-white font-bold transition-all flex items-center gap-2">
                       <MoreHorizontal className="w-5 h-5" />
                       Modifier le profil
                    </button>
                  </div>

                  <div className="absolute top-6 right-6 opacity-0 group-hover/hero:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }} className="p-3 bg-black/40 hover:bg-black/60 backdrop-blur-lg rounded-2xl border border-white/20 text-white transition-all">
                       <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverPhotoChange} className="hidden" />
                </div>

                <div className="px-8 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-gradient-to-b from-transparent to-gray-50/30 dark:to-white/5">
                  <div className="max-w-2xl text-left">
                    <p className={`text-lg italic mb-2 ${isDark ? 'text-gray-300' : 'text-[#374151]'}`}>"{t('community.welcomeBio')}"</p>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex -space-x-3">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#1e293b] bg-gray-100 overflow-hidden shadow-sm">
                            <img src={`https://i.pravatar.cc/150?u=${i+10}`} alt="Friend" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                      <p className={`text-sm font-medium ${subText}`}>
                        <span className={`font-bold ${textColor}`}>Amira B.</span> et {userStats.followers > 0 ? userStats.followers - 1 : 42} autres amis sont membres
                      </p>
                    </div>
                  </div>

                  <div className={`flex gap-4 p-1.5 rounded-3xl border ${isHcHigh ? 'border-yellow-400 bg-black' : isDark ? 'bg-white/5 border-white/10 backdrop-blur-md' : 'bg-gray-50/80 border-gray-100'}`}>
                    <motion.div whileHover={{ scale: 1.02 }} className="px-6 py-4 rounded-2xl bg-white dark:bg-[#1e293b] shadow-sm text-center min-w-[120px] cursor-pointer" onClick={() => setActiveTab('feed')}>
                      <p className={`text-2xl font-black ${textColor}`}>{userStats.posts}</p>
                      <p className={`text-[10px] uppercase tracking-wider font-bold ${subText}`}>{t('community.publications')}</p>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} className="px-6 py-4 rounded-2xl bg-[#0EA5E9] shadow-lg shadow-[#0EA5E9]/30 text-center min-w-[140px] group/members cursor-pointer" onClick={() => setActiveTab('suggestions')}>
                      <div className="flex flex-col items-center">
                        <p className="text-2xl font-black text-white">
                          {userStats.followers >= 1000 ? `${(userStats.followers / 1000).toFixed(1)}K` : userStats.followers}
                        </p>
                        <StackedAvatars
                          className="mt-1 group-hover/members:scale-110 transition-transform origin-bottom"
                          extraCount={userStats.followers > 3 ? (userStats.followers - 3).toString() : "0"}
                          avatars={userStats.recentFollowersAvatars.length > 0 ? userStats.recentFollowersAvatars : ["https://i.pravatar.cc/150?u=4", "https://i.pravatar.cc/150?u=5", "https://i.pravatar.cc/150?u=6"]}
                        />
                      </div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-white mt-1">{t('community.members')}</p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* User's Posts (Profile Tab) */}
              <PostComposer userAvatar={user?.avatar} userName={user?.name || 'Utilisateur'} onSubmit={handleCreatePost} isLoading={posting} />

              {/* Story Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-3xl shadow-xl overflow-hidden mb-8 p-6 ${isHcHigh ? 'border-2 border-yellow-400 bg-black' : isDark ? 'bg-[#1e293b] border border-[#334155]' : 'bg-white border border-gray-100'}`}
              >
                <StoryTimeline userId={user?.id || ''} />
              </motion.div>

              {/* Posts Section */}
              {posts.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-center py-16 rounded-2xl border ${cardBg}`}>
                  <Users className={`w-16 h-16 mx-auto mb-4 ${isHcHigh ? 'text-yellow-400' : 'text-[#D1D5DB]'}`} />
                  <h3 className={`text-lg font-semibold ${subText}`}>{t('community.noPosts')}</h3>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <React.Fragment key={post.id}>
                      <PostCard
                        post={{
                          id: post.id, userId: post.userId,
                          userName: post.user?.name || 'Utilisateur',
                          userAvatar: post.user?.avatar ?? undefined,
                          content: post.message, media: post.media ?? undefined,
                          createdAt: post.createdAt,
                          likes: post._count?.likes || 0,
                          comments: post._count?.comments || 0,
                          shares: 0,
                          isLiked: post.isLiked || false,
                          isByCurrentUser: post.userId === user?.sub || post.userId === user?.id,
                          reaction: post.reaction,
                        }}
                        onLike={handleToggleLike}
                        onComment={loadComments}
                        onDelete={handleDeletePost}
                        onArchive={handleArchivePost}
                        onProfileClick={onViewProfile}
                      />
                      <AnimatePresence>
                        {selectedPost === post.id && (
                          <CommentsSection
                            postId={post.id}
                            comments={comments}
                            loading={commentLoading}
                            onAddComment={handleAddComment}
                            newComment={newComment}
                            setNewComment={setNewComment}
                            userAvatar={user?.avatar}
                            userName={user?.name || 'Utilisateur'}
                            t={t}
                            isDark={isDark}
                            isHcHigh={isHcHigh}
                            cardBg={cardBg}
                            textColor={textColor}
                            subText={subText}
                            onLikeComment={handleLikeComment}
                            onReplyComment={setReplyingTo}
                            onDeleteComment={handleDeleteComment}
                            replyingTo={replyingTo}
                            setReplyingTo={setReplyingTo}
                            currentUserId={user?.id || user?.sub}
                          />
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ────── ARCHIVE TAB ────── */}
          {activeTab === 'archive' && (
            <motion.div key="archive" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              <div className={`p-8 rounded-[2rem] border ${cardBg} flex flex-col items-center text-center shadow-2xl relative overflow-hidden group`}>
                <div className="absolute -top-10 -right-10 p-8 opacity-5 transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12">
                  <Archive className="w-48 h-48" />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-20 h-20 rounded-[2rem] mb-6 flex items-center justify-center shadow-xl rotate-3 transition-transform hover:rotate-0 ${isDark ? 'bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10' : 'bg-white border border-gray-100'}`}>
                    <Archive className={`w-10 h-10 text-[#0EA5E9]`} />
                  </div>
                  <h2 className={`text-3xl font-bold ${textColor}`}>{t('community.archiveVaultTitle')}</h2>
                  <p className={`text-sm max-w-md ${subText} mt-3 font-medium opacity-80 leading-relaxed`}>
                    {t('community.archiveVaultDesc')}
                  </p>
                </div>

                {/* PREMIUM FILTER BAR */}
                <div className="mt-8 flex items-center gap-2 p-1.5 rounded-2xl bg-gray-50/50 dark:bg-white/5 backdrop-blur-md border border-gray-100 dark:border-white/10 relative z-10">
                  <div className="flex items-center gap-2 px-3 mr-2 border-r border-gray-200 dark:border-white/10">
                    <Filter className="w-4 h-4 text-[#0EA5E9]" />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${subText}`}>{t('community.filterBy')}</span>
                  </div>
                  {[
                    { id: 'recent', label: t('community.filterRecent'), icon: <Calendar className="w-3 h-3" /> },
                    { id: 'month', label: t('community.filterMonth'), icon: <Calendar className="w-3 h-3" /> },
                    { id: 'year', label: t('community.filterYear'), icon: <Calendar className="w-3 h-3" /> }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setDateFilter(f.id as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${dateFilter === f.id
                        ? 'bg-[#0EA5E9] text-white shadow-lg shadow-[#0EA5E9]/20 scale-105'
                        : `hover:bg-gray-100/50 dark:hover:bg-white/5 ${subText}`}`}
                    >
                      {f.icon}
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Archive section - No posts stored locally after archiving */}
              <div className={`text-center py-20 rounded-3xl border-2 border-dashed transition-colors ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/30'}`}>
                 <div className="w-16 h-16 rounded-full bg-gray-100/50 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                   <Newspaper className={`w-8 h-8 opacity-20 ${textColor}`} />
                 </div>
                 <p className={`${subText} font-black uppercase tracking-widest text-[10px]`}>{t('community.noArchiveFound')}</p>
                 <p className={`${subText} text-xs mt-1 opacity-60`}>{t('community.noArchiveDesc')}</p>
              </div>
            </motion.div>
          )}

          {/* ────── SUGGESTIONS TAB ────── */}
          {activeTab === 'suggestions' && (
            <motion.div key="suggestions" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <SuggestionsTab />
            </motion.div>
          )}

          {/* ────── STATS TAB ────── */}
          {activeTab === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <StatsTab stats={userStats} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
