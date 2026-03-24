import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, Loader2, Users, Camera
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

interface CommunityPageProps {
  onBack?: () => void;
}

export function CommunityPage({ onBack }: CommunityPageProps) {
  const { user, setUser } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
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

  const { theme, contrastMode } = useAccessibilityStore();
  const isHcHigh = contrastMode === 'high';
  const isHcMedium = contrastMode === 'medium';
  const isDark = theme === 'dark';

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

  const handleCoverPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La photo doit faire moins de 5MB');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Seul JPG, PNG et WEBP sont acceptés');
      return;
    }

    setLoadingCover(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        await handleCoverPhotoUpload(base64);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Erreur lors du téléchargement de la photo');
      console.error(error);
    } finally {
      setLoadingCover(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'avatar doit faire moins de 5MB');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Seul JPG, PNG et WEBP sont acceptés');
      return;
    }

    setLoadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        await handleAvatarUpload(base64);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Erreur lors du téléchargement de l\'avatar');
      console.error(error);
    } finally {
      setLoadingAvatar(false);
    }
  };

  const handleCoverPhotoUpload = async (base64: string) => {
    try {
      setLoadingCover(true);
      // Call the backend API to update cover photo
      const response = await fetch('http://localhost:3000/auth/profile/cover', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ coverPhotoUrl: base64 }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de la couverture');
      }

      const updatedUser = await response.json();
      // Update auth store with new user data
      setUser({ ...user, coverPhoto: updatedUser.coverPhoto });
      setCommunityImage(updatedUser.coverPhoto);
      toast.success('Photo de couverture mise à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de la photo');
      console.error(error);
    } finally {
      setLoadingCover(false);
    }
  };

  const handleAvatarUpload = async (base64: string) => {
    try {
      setLoadingAvatar(true);
      // Call the backend API to update avatar
      const response = await fetch('http://localhost:3000/auth/profile/avatar', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ avatarUrl: base64 }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de l\'avatar');
      }

      const updatedUser = await response.json();
      // Update auth store with new user data
      setUser({ ...user, avatar: updatedUser.avatar });
      toast.success('Avatar mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de l\'avatar');
      console.error(error);
    } finally {
      setLoadingAvatar(false);
    }
  };

  useEffect(() => {
    loadPosts(1);
  }, [loadPosts]);

  // Sync cover photo when user changes
  useEffect(() => {
    if (user?.coverPhoto) {
      setCommunityImage(user.coverPhoto);
    }
  }, [user?.coverPhoto]);

  const handleCreatePost = async (content: string, media?: string) => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      const post = await postsService.create({
        message: content,
        media: media || undefined,
      });
      setPosts((prev) => [post, ...prev]);
      toast.success('Post publié !');
    } catch {
      toast.error('Erreur lors de la publication');
    } finally {
      setPosting(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      await postsService.toggleLike(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLiked: !p.isLiked,
                _count: {
                  ...p._count,
                  likes: (p._count?.likes || 0) + (p.isLiked ? -1 : 1),
                  comments: p._count?.comments || 0,
                },
              }
            : p
        )
      );
    } catch {
      toast.error('Erreur');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await postsService.delete(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success('Post supprimé');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const loadComments = async (postId: string) => {
    if (selectedPost === postId) {
      setSelectedPost(null);
      setComments([]);
      return;
    }
    
    setSelectedPost(postId);
    setCommentLoading(true);
    try {
      const result = await postsService.getComments(postId);
      setComments(result.data || []);
    } catch {
      toast.error('Erreur lors du chargement des commentaires');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return;
    try {
      const comment = await postsService.addComment({
        postId: selectedPost,
        comment: newComment,
      });
      setComments((prev) => [...prev, comment]);
      setNewComment('');
      setPosts((prev) =>
        prev.map((p) =>
          p.id === selectedPost
            ? { ...p, _count: { ...p._count, likes: p._count?.likes || 0, comments: (p._count?.comments || 0) + 1 } }
            : p
        )
      );
    } catch {
      toast.error('Erreur lors de l\'ajout du commentaire');
    }
  };

  return (
    <div className="min-h-screen relative" style={{ zIndex: 1 }}>
      {/* Header */}
      

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9]" />
          </div>
        ) : (
          <>
            {/* Community Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl shadow-sm overflow-hidden mb-6 ${
                isHcHigh ? 'border-2 border-yellow-400 bg-black' : isDark ? 'bg-[#16213e]' : 'bg-white'
              }`}
            >
              {/* Cover Photo */}
              <div 
                className={`relative h-48 cursor-pointer group ${
                  isHcHigh ? 'bg-black border-b-2 border-yellow-400' : 'bg-gradient-to-r from-[#F9A8D4] to-[#FED7AA]'
                }`}
                onClick={() => coverInputRef.current?.click()}
              >
                {communityImage && (
                  <img 
                    src={communityImage} 
                    alt="Community cover" 
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/50 transition-all">
                  {loadingCover ? (
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-8 h-8 text-white" />
                      <span className="text-white text-sm font-medium">Modifier la couverture</span>
                    </div>
                  )}
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverPhotoChange}
                  className="hidden"
                />
              </div>

              {/* Profile Content */}
              <div className="px-8 pb-8">
                <div className="flex items-end gap-6 mb-6">
                  {/* Avatar */}
                  <div 
                    className="relative -mt-16 flex-shrink-0 cursor-pointer group"
                  >
                    <div 
                      onClick={() => avatarInputRef.current?.click()}
                      className={`w-32 h-32 rounded-full border-4 overflow-hidden shadow-lg flex items-center justify-center text-5xl font-bold group-hover:opacity-80 transition-opacity ${
                        isHcHigh ? 'border-yellow-400 bg-black text-cyan-400' : 'border-white bg-gradient-to-br from-[#F9A8D4] to-[#FED7AA] text-white'
                      }`}
                    >
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user?.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-16 h-16" />
                      )}
                    </div>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2.5 bg-[#0EA5E9] text-white rounded-full hover:bg-[#0284C7] transition-colors shadow-lg"
                    >
                      {loadingAvatar ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1"></div>
                </div>

                {/* Community Info */}
                <div className="mb-4">
                  <h1 className="text-3xl font-bold text-[#111827]">DeepSkyn Communauté</h1>
                  <p className="text-[#6B7280]">Partagez votre parcours skincare</p>
                </div>

                {/* Description */}
                <p className="text-[#374151] mb-6 leading-relaxed">
                  Bienvenue dans la communauté DeepSkyn ! Ici, partage tes expériences skincare, tes routines, tes avant/après et tes conseils avec le reste de la communauté. 💙
                </p>

                {/* Stats */}
                <div className="flex gap-8 pt-4 border-t border-[#E5E7EB]">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="cursor-pointer"
                  >
                    <p className="font-bold text-[#111827]">{posts.length}</p>
                    <p className="text-sm text-[#6B7280]">Publications</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="cursor-pointer"
                  >
                    <p className="font-bold text-[#111827]">1.2K</p>
                    <p className="text-sm text-[#6B7280]">Membres</p>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Post Composer */}
            <PostComposer
              userAvatar={user?.avatar}
              userName={user?.name || 'Utilisateur'}
              onSubmit={handleCreatePost}
              isLoading={posting}
            />

            {/* Posts Feed */}
            {posts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 bg-white rounded-2xl border border-[#E5E7EB]"
              >
                <Users className="w-16 h-16 mx-auto mb-4 text-[#D1D5DB]" />
                <h3 className="text-lg font-semibold text-[#6B7280]">Aucun post pour le moment</h3>
                <p className="text-sm text-[#9CA3AF]">Soyez le premier à partager !</p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={{
                      id: post.id,
                      userId: post.userId,
                      userName: post.user?.name || 'Utilisateur',
                      userAvatar: post.user?.avatar,
                      content: post.message,
                      media: post.media,
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

                {/* Comments Section */}
                {selectedPost && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden mt-6"
                  >
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-[#111827] mb-4">Commentaires</h3>

                      {commentLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-[#0EA5E9]" />
                        </div>
                      ) : comments.length === 0 ? (
                        <p className="text-[#6B7280] text-center py-6">Aucun commentaire pour le moment</p>
                      ) : (
                        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                          {comments.map((comment) => (
                            <motion.div
                              key={comment.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex gap-3 pb-4 border-b border-[#E5E7EB] last:border-b-0"
                            >
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                isHcHigh ? 'bg-black border border-yellow-400 text-cyan-400' : 'bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white'
                              }`}>
                                {comment.user?.avatar ? (
                                  <img
                                    src={comment.user.avatar}
                                    alt={comment.user?.name}
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                ) : (
                                  comment.user?.name?.charAt(0).toUpperCase() || 'U'
                                )}
                              </div>
                              <div className="flex-1">
                                <span className="text-xs font-semibold text-[#111827]">
                                  {comment.user?.name || 'Utilisateur'}
                                </span>
                                <p className="text-sm text-[#4B5563] mt-1">{comment.comment}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Comment Input */}
                      <div className="flex gap-2 pt-4 border-t border-[#E5E7EB]">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                          isHcHigh ? 'bg-black border border-yellow-400 text-cyan-400' : 'bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white'
                        }`}>
                          {user?.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user?.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            user?.name?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        <input
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                          placeholder="Ajouter un commentaire..."
                          className="flex-1 px-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-sm focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          className="px-4 py-2.5 bg-[#0EA5E9] text-white rounded-full hover:bg-[#0284C7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                        >
                          Envoyer
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Load More */}
                {hasMore && (
                  <div className="text-center pt-6">
                    <Button
                      variant="outline"
                      onClick={() => { setPage((p) => p + 1); loadPosts(page + 1); }}
                      loading={loading}
                    >
                      Charger plus
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

