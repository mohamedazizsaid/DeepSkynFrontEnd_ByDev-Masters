import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export interface PostCardData {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  media?: string;
  createdAt: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
  isByCurrentUser?: boolean;
}

interface PostCardProps {
  post: PostCardData;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

const getRelativeTime = (date: string) => {
  const now = new Date();
  const postDate = new Date(date);
  const seconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  if (seconds < 60) return 'à l\'instant';
  if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `il y a ${Math.floor(seconds / 86400)}j`;
  return postDate.toLocaleDateString('fr-FR');
};

export function PostCard({
  post,
  onLike,
  onComment,
  onShare,
  onDelete,
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showMenu, setShowMenu] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    if (onLike) {
      onLike(post.id);
    }
  };

  const handleComment = () => {
    if (onComment) {
      onComment(post.id);
    }
    toast('Commentaires - Fonctionnalité à venir', { icon: '💬' });
  };

  const handleShare = () => {
    if (onShare) {
      onShare(post.id);
    }
    toast.success('Post partagé !');
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(post.id);
    }
    toast.success('Post supprimé');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden mb-6 hover:shadow-md transition-shadow"
    >
      {/* Post Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {post.userAvatar ? (
              <img
                src={post.userAvatar}
                alt={post.userName}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              post.userName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h4 className="font-semibold text-sm text-[#111827]">{post.userName}</h4>
            <p className="text-xs text-[#9CA3AF]">{getRelativeTime(post.createdAt)}</p>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <motion.button
            whileHover={{ backgroundColor: 'rgba(107, 114, 128, 0.1)' }}
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </motion.button>

          {showMenu && post.isByCurrentUser && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-10 overflow-hidden"
            >
              <motion.button
                whileHover={{ backgroundColor: '#FEF2F2' }}
                onClick={() => {
                  handleDelete();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 flex items-center gap-2 text-red-600 hover:text-red-700 text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-[#374151] text-sm whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Post Media */}
      {post.media && (
        <div className="px-4 pb-3">
          <img
            src={post.media}
            alt="Post media"
            className="w-full rounded-xl object-cover max-h-96"
          />
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB] text-sm text-[#6B7280]">
        <motion.button
          whileHover={{ scale: 1.05, color: '#EF4444' }}
          onClick={handleLike}
          className={`flex items-center gap-2 transition-colors ${
            isLiked ? 'text-[#EF4444]' : 'text-[#6B7280] hover:text-[#EF4444]'
          }`}
        >
          <motion.div
            animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </motion.div>
          <span className={`font-medium ${isLiked ? 'text-[#EF4444]' : ''}`}>
            {likeCount}
          </span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={handleComment}
          className="flex items-center gap-2 hover:text-[#0EA5E9] transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">{post.comments}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={handleShare}
          className="flex items-center gap-2 hover:text-[#0EA5E9] transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span className="font-medium">{post.shares}</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
