import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Loader2, Users, Camera, Newspaper, User, UserPlus, BarChart3
} from 'lucide-react';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import { Button } from '../components/button';
import { postsService } from '../../lib/services/posts.service';
import { useAuthStore } from '../../stores/auth.store';
import type { Post, Comment } from '../../lib/types';
import toast from 'react-hot-toast';
import { ProfileHero } from './components/profile-hero';
import { PostComposer } from './components/post-composer';
import { PostCard } from './components/post-card';
import type { PostCardData } from './components/post-card';
import { StoryBar, MOCK_STORIES, StoryUser } from './components/story-bar';
import { StoryUploadModal } from './components/story-upload-modal';
import { StoryViewerModal } from './components/story-viewer-modal';
import { SuggestionsTab } from './components/suggestions-tab';
import { StatsTab } from './components/stats-tab';

type CommunityTab = 'feed' | 'profile' | 'suggestions' | 'stats';

interface CommunityPageProps {
  onBack?: () => void;
}

export function CommunityPage({ onBack }: CommunityPageProps) {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<CommunityTab>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<StoryUser[]>(MOCK_STORIES);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [posting, setPosting] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingCover, setLoadingCover] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [communityImage, setCommunityImage] = useState<string | null>(user?.coverPhoto || null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const { theme, contrastMode, t } = useAccessibilityStore();
  const isHcHigh = contrastMode === 'high';
  const isDark = theme === 'dark';

  // ─── Colors ───
  const pageBg = isHcHigh ? 'bg-black' : isDark ? 'bg-[#0f172a]' : '';
  const cardBg = isHcHigh ? 'bg-black border-2 border-yellow-400' : isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#E5E7EB]';
  const textColor = isHcHigh ? 'text-cyan-400' : isDark ? 'text-gray-200' : 'text-[#111827]';
  const subText = isHcHigh ? 'text-yellow-300' : isDark ? 'text-gray-400' : 'text-[#6B7280]';

  const loadPosts = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const result = await postsService.getFeed(pageNum, 20);
      if (pageNum === 1) {
        setPosts(result.data || []);
      } else {
        setPosts((prev) => [...prev, ...(result.data || [])]);
      }
      setHasMore((result.data?.length || 0) >= 20);
    } catch {
      toast.error('Erreur lors du chargement des posts');
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Cover / Avatar handlers (unchanged logic) ───
  const handleCoverPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('La photo doit faire moins de 5MB'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('Seul JPG, PNG et WEBP sont acceptés'); return; }
    setLoadingCover(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        await handleCoverPhotoUpload(base64);
      };
      reader.readAsDataURL(file);
    } catch { toast.error('Erreur lors du téléchargement de la photo'); } finally { setLoadingCover(false); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("L'avatar doit faire moins de 5MB"); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('Seul JPG, PNG et WEBP sont acceptés'); return; }
    setLoadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        await handleAvatarUpload(base64);
      };
      reader.readAsDataURL(file);
    } catch { toast.error("Erreur lors du téléchargement de l'avatar"); } finally { setLoadingAvatar(false); }
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
      toast.success('Photo de couverture mise à jour');
    } catch { toast.error('Erreur lors de la mise à jour de la photo'); } finally { setLoadingCover(false); }
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
      toast.success('Avatar mis à jour');
    } catch { toast.error("Erreur lors de la mise à jour de l'avatar"); } finally { setLoadingAvatar(false); }
  };

  useEffect(() => { loadPosts(1); }, [loadPosts]);
  useEffect(() => { if (user?.coverPhoto) setCommunityImage(user.coverPhoto); }, [user?.coverPhoto]);

  // ─── Story Upload Handler ───
  const handleStoryUpload = async (file: File) => {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    const newStoryUrl = URL.createObjectURL(file);
    
    // Add to the front of stories, pretending the current user uploaded it
    const newStory: StoryUser = {
      id: `new-${Date.now()}`,
      name: user?.name || 'Moi',
      avatar: user?.avatar,
      hasStory: true,
      isViewed: false,
      mediaUrl: newStoryUrl
    };
    
    setStories([newStory, ...stories]);
    toast.success('Story publiée avec succès !');
  };

  // ─── Post actions ───
  const handleCreatePost = async (content: string, media?: string) => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      const post = await postsService.create({ message: content, media: media || undefined });
      setPosts((prev) => [post, ...prev]);
      toast.success('Post publié !');
    } catch { toast.error('Erreur lors de la publication'); } finally { setPosting(false); }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      await postsService.toggleLike(postId);
      setPosts((prev) => prev.map((p) => p.id === postId
        ? { ...p, isLiked: !p.isLiked, _count: { ...p._count, likes: (p._count?.likes || 0) + (p.isLiked ? -1 : 1), comments: p._count?.comments || 0 } }
        : p
      ));
    } catch { toast.error('Erreur'); }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await postsService.delete(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success('Post supprimé');
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  const loadComments = async (postId: string) => {
    if (selectedPost === postId) { setSelectedPost(null); setComments([]); return; }
    setSelectedPost(postId);
    setCommentLoading(true);
    try {
      const result = await postsService.getComments(postId);
      setComments(result.data || []);
    } catch { toast.error('Erreur lors du chargement des commentaires'); } finally { setCommentLoading(false); }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return;
    try {
      const comment = await postsService.addComment({ postId: selectedPost, comment: newComment });
      setComments((prev) => [...prev, comment]);
      setNewComment('');
      setPosts((prev) => prev.map((p) => p.id === selectedPost
        ? { ...p, _count: { ...p._count, likes: p._count?.likes || 0, comments: (p._count?.comments || 0) + 1 } }
        : p
      ));
    } catch { toast.error("Erreur lors de l'ajout du commentaire"); }
  };

  // ─── Sub-tab definitions ───
  const tabs: { key: CommunityTab; label: string; icon: React.ReactNode }[] = [
    { key: 'feed', label: t('community.feed'), icon: <Newspaper className="w-4 h-4" /> },
    { key: 'profile', label: t('community.profile'), icon: <User className="w-4 h-4" /> },
    { key: 'suggestions', label: t('community.suggestions'), icon: <UserPlus className="w-4 h-4" /> },
    { key: 'stats', label: t('community.stats'), icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className={`min-h-screen relative ${pageBg}`} style={{ zIndex: 1 }}>
      <StoryUploadModal 
        isOpen={isStoryModalOpen} 
        onClose={() => setIsStoryModalOpen(false)} 
        onUpload={handleStoryUpload}
        userAvatar={user?.avatar}
        userName={user?.name || 'Utilisateur'}
      />
      <StoryViewerModal
        isOpen={selectedStoryIndex !== null}
        onClose={() => setSelectedStoryIndex(null)}
        stories={stories}
        initialIndex={selectedStoryIndex !== null ? selectedStoryIndex : 0}
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
              onClick={() => setActiveTab(tab.key)}
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
                      currentUserName={user?.name || 'Vous'} 
                      stories={stories}
                      onAddClick={() => setIsStoryModalOpen(true)}
                      onStoryClick={(i) => setSelectedStoryIndex(i)}
                    />

                    {/* Post Composer */}
                    <PostComposer
                      userAvatar={user?.avatar}
                      userName={user?.name || 'Utilisateur'}
                      onSubmit={handleCreatePost}
                      isLoading={posting}
                    />

                    {/* Posts */}
                    {posts.length === 0 ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-center py-16 rounded-2xl border ${cardBg}`}>
                        <Users className={`w-16 h-16 mx-auto mb-4 ${isHcHigh ? 'text-yellow-400' : 'text-[#D1D5DB]'}`} />
                        <h3 className={`text-lg font-semibold ${subText}`}>{t('community.noPosts')}</h3>
                        <p className={`text-sm ${subText} opacity-70`}>{t('community.beFirst')}</p>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        {posts.map((post) => (
                          <PostCard
                            key={post.id}
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
                              isByCurrentUser: post.userId === user?.sub,
                            }}
                            onLike={handleToggleLike}
                            onComment={loadComments}
                            onDelete={handleDeletePost}
                          />
                        ))}

                        {/* Inline Comments */}
                        {selectedPost && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border shadow-sm overflow-hidden ${cardBg}`}>
                            <div className="p-6">
                              <h3 className={`text-lg font-bold ${textColor} mb-4`}>{t('community.comments')}</h3>
                              {commentLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#0EA5E9]" /></div>
                              ) : comments.length === 0 ? (
                                <p className={`${subText} text-center py-6`}>{t('community.noComments')}</p>
                              ) : (
                                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                                  {comments.map((comment) => (
                                    <motion.div key={comment.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 pb-4 border-b last:border-b-0 ${isHcHigh ? 'border-yellow-400/30' : isDark ? 'border-[#334155]' : 'border-[#E5E7EB]'}`}>
                                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${isHcHigh ? 'bg-black border border-yellow-400 text-cyan-400' : 'bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white'}`}>
                                        {comment.user?.avatar ? <img src={comment.user.avatar} alt={comment.user?.name} className="w-full h-full object-cover rounded-full" /> : comment.user?.name?.charAt(0).toUpperCase() || 'U'}
                                      </div>
                                      <div className="flex-1">
                                        <span className={`text-xs font-semibold ${textColor}`}>{comment.user?.name || 'Utilisateur'}</span>
                                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-[#4B5563]'} mt-1`}>{comment.comment}</p>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              )}
                              <div className={`flex gap-2 pt-4 border-t ${isHcHigh ? 'border-yellow-400/30' : isDark ? 'border-[#334155]' : 'border-[#E5E7EB]'}`}>
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${isHcHigh ? 'bg-black border border-yellow-400 text-cyan-400' : 'bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white'}`}>
                                  {user?.avatar ? <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover rounded-full" /> : user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <input value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} placeholder={t('community.addComment')}
                                  className={`flex-1 px-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-2 transition-all ${isHcHigh ? 'bg-black border-2 border-yellow-400 text-cyan-400 focus:ring-yellow-400' : isDark ? 'bg-[#0f172a] border border-[#334155] text-gray-200 focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20' : 'bg-[#F9FAFB] border border-[#E5E7EB] focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20'}`}
                                />
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAddComment} disabled={!newComment.trim()}
                                  className="px-4 py-2.5 bg-[#0EA5E9] text-white rounded-full hover:bg-[#0284C7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm">
                                  {t('common.send')}
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        )}

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
                    <div className={`rounded-2xl border shadow-sm overflow-hidden ${cardBg}`}>
                      <div className={`h-20 ${isHcHigh ? 'bg-gradient-to-r from-yellow-600 to-yellow-800' : 'bg-gradient-to-r from-[#0EA5E9]/30 to-[#8B5CF6]/30'}`}>
                        {communityImage && <img src={communityImage} alt="cover" className="w-full h-full object-cover" />}
                      </div>
                      <div className="px-4 pb-4 -mt-8 text-center">
                        <div className={`w-16 h-16 rounded-full mx-auto border-4 overflow-hidden shadow-md mb-2 ${isHcHigh ? 'border-black' : isDark ? 'border-[#1e293b]' : 'border-white'}`}>
                          {user?.avatar ? <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" /> : (
                            <div className={`w-full h-full flex items-center justify-center text-xl font-bold ${isHcHigh ? 'bg-black text-cyan-400' : 'bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white'}`}>
                              {user?.name?.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>
                        <h3 className={`font-bold text-sm ${textColor}`}>{user?.name || 'Utilisateur'}</h3>
                        <p className={`text-xs ${subText}`}>@{user?.email?.split('@')[0]}</p>
                        <div className={`flex justify-center gap-6 mt-3 pt-3 border-t ${isHcHigh ? 'border-yellow-400/30' : isDark ? 'border-[#334155]' : 'border-[#E5E7EB]'}`}>
                          <div className="text-center"><p className={`font-bold text-sm ${textColor}`}>{posts.length}</p><p className={`text-[10px] ${subText}`}>{t('community.posts')}</p></div>
                          <div className="text-center"><p className={`font-bold text-sm ${textColor}`}>1.2K</p><p className={`text-[10px] ${subText}`}>{t('community.followers')}</p></div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Suggestions */}
                    <div className={`rounded-2xl border shadow-sm p-4 ${cardBg}`}>
                      <h3 className={`font-bold text-sm ${textColor} mb-3`}>{t('community.suggestions')}</h3>
                      {['Amira B.', 'Yasmine T.', 'Nour E.'].map((name, i) => (
                        <div key={i} className={`flex items-center gap-3 py-2.5 ${i < 2 ? `border-b ${isHcHigh ? 'border-yellow-400/20' : isDark ? 'border-[#334155]' : 'border-[#E5E7EB]'}` : ''}`}>
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${isHcHigh ? 'bg-black border border-yellow-400 text-cyan-400' : 'bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white'}`}>
                            {name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${textColor}`}>{name}</p>
                            <p className={`text-[10px] ${subText}`}>Skincare passionné(e)</p>
                          </div>
                          <button className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${isHcHigh ? 'bg-yellow-400 text-black' : 'bg-[#0EA5E9]/10 text-[#0EA5E9] hover:bg-[#0EA5E9]/20'}`}>
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
              {/* Existing profile hero section (preserved) */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl shadow-sm overflow-hidden mb-6 ${isHcHigh ? 'border-2 border-yellow-400 bg-black' : isDark ? 'bg-[#1e293b]' : 'bg-white'}`}>
                <div className={`relative h-48 cursor-pointer group ${isHcHigh ? 'bg-black border-b-2 border-yellow-400' : 'bg-gradient-to-r from-[#F9A8D4] to-[#FED7AA]'}`}
                  onClick={() => coverInputRef.current?.click()}>
                  {communityImage && <img src={communityImage} alt="Community cover" className="w-full h-full object-cover" />}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/50 transition-all">
                    {loadingCover ? <Loader2 className="w-8 h-8 animate-spin text-white" /> : (
                      <div className="flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-8 h-8 text-white" /><span className="text-white text-sm font-medium">{t('common.edit')}</span>
                      </div>
                    )}
                  </div>
                  <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverPhotoChange} className="hidden" />
                </div>
                <div className="px-8 pb-8">
                  <div className="flex items-end gap-6 mb-6">
                    <div className="relative -mt-16 flex-shrink-0 cursor-pointer group">
                      <div onClick={() => avatarInputRef.current?.click()}
                        className={`w-32 h-32 rounded-full border-4 overflow-hidden shadow-lg flex items-center justify-center text-5xl font-bold group-hover:opacity-80 transition-opacity ${isHcHigh ? 'border-yellow-400 bg-black text-cyan-400' : isDark ? 'border-[#1e293b] bg-gradient-to-br from-[#F9A8D4] to-[#FED7AA] text-white' : 'border-white bg-gradient-to-br from-[#F9A8D4] to-[#FED7AA] text-white'}`}>
                        {user?.avatar ? <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" /> : <Users className="w-16 h-16" />}
                      </div>
                      <button onClick={() => avatarInputRef.current?.click()} className="absolute bottom-0 right-0 p-2.5 bg-[#0EA5E9] text-white rounded-full hover:bg-[#0284C7] transition-colors shadow-lg">
                        {loadingAvatar ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                      </button>
                      <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="hidden" />
                    </div>
                    <div className="flex-1"></div>
                  </div>
                  <div className="mb-4">
                    <h1 className={`text-3xl font-bold ${textColor}`}>{user?.name || 'DeepSkyn Communauté'}</h1>
                    <p className={subText}>@{user?.email?.split('@')[0] || 'utilisateur'}</p>
                  </div>
                  <p className={`${isDark ? 'text-gray-300' : 'text-[#374151]'} mb-6 leading-relaxed`}>
                    {t('community.welcomeBio')}
                  </p>
                  <div className={`flex gap-8 pt-4 border-t ${isHcHigh ? 'border-yellow-400/30' : isDark ? 'border-[#334155]' : 'border-[#E5E7EB]'}`}>
                    <motion.div whileHover={{ scale: 1.05 }} className="cursor-pointer">
                      <p className={`font-bold ${textColor}`}>{posts.length}</p><p className={`text-sm ${subText}`}>{t('community.publications')}</p>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} className="cursor-pointer">
                      <p className={`font-bold ${textColor}`}>1.2K</p><p className={`text-sm ${subText}`}>{t('community.members')}</p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* User's Posts */}
              <PostComposer userAvatar={user?.avatar} userName={user?.name || 'Utilisateur'} onSubmit={handleCreatePost} isLoading={posting} />
              {posts.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-center py-16 rounded-2xl border ${cardBg}`}>
                  <Users className={`w-16 h-16 mx-auto mb-4 ${isHcHigh ? 'text-yellow-400' : 'text-[#D1D5DB]'}`} />
                  <h3 className={`text-lg font-semibold ${subText}`}>{t('community.noPosts')}</h3>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard key={post.id}
                      post={{ id: post.id, userId: post.userId, userName: post.user?.name || 'Utilisateur', userAvatar: post.user?.avatar ?? undefined, content: post.message, media: post.media ?? undefined, createdAt: post.createdAt, likes: post._count?.likes || 0, comments: post._count?.comments || 0, shares: 0, isLiked: post.isLiked || false, isByCurrentUser: post.userId === user?.sub }}
                      onLike={handleToggleLike} onComment={loadComments} onDelete={handleDeletePost}
                    />
                  ))}
                </div>
              )}
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
              <StatsTab postsCount={posts.length} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
