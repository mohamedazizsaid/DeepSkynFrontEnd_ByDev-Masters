import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart, MessageCircle, Send, Image, Plus, Trash2, MoreHorizontal,
  ArrowLeft, Loader2, Users
} from 'lucide-react';
import { Button } from '../components/button';
import { postsService } from '../../lib/services/posts.service';
import { useAuthStore } from '../../stores/auth.store';
import type { Post, Comment } from '../../lib/types';
import toast from 'react-hot-toast';

interface CommunityPageProps {
  onBack?: () => void;
}

export function CommunityPage({ onBack }: CommunityPageProps) {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostMessage, setNewPostMessage] = useState('');
  const [newPostMedia, setNewPostMedia] = useState('');
  const [posting, setPosting] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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

  useEffect(() => {
    loadPosts(1);
  }, [loadPosts]);

  const handleCreatePost = async () => {
    if (!newPostMessage.trim()) return;
    setPosting(true);
    try {
      const post = await postsService.create({
        message: newPostMessage,
        media: newPostMedia || undefined,
      });
      setPosts((prev) => [post, ...prev]);
      setNewPostMessage('');
      setNewPostMedia('');
      setShowCreatePost(false);
      toast.success('Post publié !');
    } catch {
      toast.error('Erreur lors de la publication');
    } finally {
      setPosting(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      const result = await postsService.toggleLike(postId);
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
    <div className="p-8 max-w-2xl mx-auto">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#6B7280] hover:text-[#0EA5E9] transition-colors">
        <ArrowLeft className="w-5 h-5" />
        <span>Retour</span>
      </button>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F9A8D4] to-[#FED7AA] flex items-center justify-center">
            <Users className="w-7 h-7 text-[#111827]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Communauté</h1>
            <p className="text-[#6B7280]">Partagez votre parcours skincare</p>
          </div>
        </div>
        <Button onClick={() => setShowCreatePost(true)} size="sm">
          <Plus className="w-4 h-4" /> Publier
        </Button>
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreatePost && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 bg-white rounded-2xl border border-[#E5E7EB] shadow-lg p-6"
          >
            <textarea
              value={newPostMessage}
              onChange={(e) => setNewPostMessage(e.target.value)}
              placeholder="Partagez votre expérience skincare..."
              className="w-full p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl resize-none h-24 focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all"
              autoFocus
            />
            <input
              value={newPostMedia}
              onChange={(e) => setNewPostMedia(e.target.value)}
              placeholder="URL de l'image (optionnel)"
              className="w-full mt-3 p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all text-sm"
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" size="sm" onClick={() => setShowCreatePost(false)}>Annuler</Button>
              <Button size="sm" onClick={handleCreatePost} loading={posting} disabled={!newPostMessage.trim()}>
                <Send className="w-4 h-4" /> Publier
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Posts Feed */}
      {loading && posts.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9]" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto mb-4 text-[#D1D5DB]" />
          <h3 className="text-lg font-semibold text-[#6B7280]">Aucun post pour le moment</h3>
          <p className="text-sm text-[#9CA3AF]">Soyez le premier à partager !</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
            >
              {/* Post Header */}
              <div className="flex items-center justify-between p-4 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center text-white font-bold text-sm">
                    {post.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{post.user?.name || 'Utilisateur'}</h4>
                    <p className="text-xs text-[#9CA3AF]">{new Date(post.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                {post.userId === user?.sub && (
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="p-2 hover:bg-[#FEF2F2] rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-[#EF4444]" />
                  </button>
                )}
              </div>

              {/* Post Content */}
              <div className="px-4 pb-3">
                <p className="text-[#374151] whitespace-pre-wrap">{post.message}</p>
              </div>

              {post.media && (
                <div className="px-4 pb-3">
                  <img src={post.media} alt="Post media" className="w-full rounded-xl object-cover max-h-96" />
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center gap-6 px-4 py-3 border-t border-[#E5E7EB]">
                <button
                  onClick={() => handleToggleLike(post.id)}
                  className={`flex items-center gap-2 text-sm transition-colors ${
                    post.isLiked ? 'text-[#EF4444]' : 'text-[#6B7280] hover:text-[#EF4444]'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                  <span>{post._count?.likes || 0}</span>
                </button>
                <button
                  onClick={() => loadComments(post.id)}
                  className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#0EA5E9] transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>{post._count?.comments || 0}</span>
                </button>
              </div>

              {/* Comments Section */}
              {selectedPost === post.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="border-t border-[#E5E7EB] p-4 space-y-3 bg-[#F9FAFB]"
                >
                  {commentLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-[#0EA5E9]" />
                    </div>
                  ) : (
                    <>
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#E5E7EB] flex items-center justify-center text-xs font-bold text-[#6B7280]">
                            {comment.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 bg-white rounded-xl p-3 border border-[#E5E7EB]">
                            <span className="text-xs font-medium text-[#374151]">{comment.user?.name || 'Utilisateur'}</span>
                            <p className="text-sm text-[#4B5563] mt-1">{comment.comment}</p>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                          placeholder="Ajouter un commentaire..."
                          className="flex-1 p-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all"
                        />
                        <button
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          className="p-2.5 bg-[#0EA5E9] text-white rounded-xl hover:bg-[#0284C7] disabled:opacity-50 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}

          {hasMore && (
            <div className="text-center pt-4">
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
    </div>
  );
}
