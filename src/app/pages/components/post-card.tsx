import React, { useEffect, useRef, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ThumbsUp, MessageSquare, Share2, MoreHorizontal, Trash2, Globe2, Archive, Loader, Hand, CheckCircle2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { VideoAccessibilityPlayer } from '../../../components/video/video-accessibility-player';
import { SignTranslationModal } from '../../../components/sign-translation-modal';
import { useSignTranslation } from '../../../hooks/use-sign-translation';
import { getSpeechToTextService } from '../../../lib/services/speech-to-text.service';


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
  reaction?: string | null;
  status?: string;
}

interface PostCardProps {
  post: PostCardData;
  onLike?: (postId: string, type?: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onArchive?: (postId: string) => void;
  onProfileClick?: (userId: string) => void;
}

const getRelativeTime = (date: string, t: any) => {
  const now = new Date();
  const postDate = new Date(date);
  const seconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  if (seconds < 60) return t('community.justNow') || "À l'instant";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} j`;
  return postDate.toLocaleDateString(t('common.loading') === '...جاري التحميل' ? 'ar-SA' : 'fr-FR', { day: 'numeric', month: 'long' });
};

export function PostCard({
  post,
  onLike,
  onComment,
  onShare,
  onDelete,
  onArchive,
  onProfileClick,
}: PostCardProps) {
  const { theme, contrastMode, t } = useAccessibilityStore();
  const [reaction, setReaction] = useState<string | null>(post.reaction || (post.isLiked ? 'like' : null));
  const [showReactions, setShowReactions] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareFlow, setShowShareFlow] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'preparing' | 'opening' | 'success' | 'error'>('idle');
  const shareTimerRef = useRef<number | null>(null);

  // Sign Translation LSF
  const [showLSFModal, setShowLSFModal] = useState(false);
  const { isLoading: isTranslating, error: translationError, data: translationData, translate, reset } = useSignTranslation();
  const [isExtractingAudio, setIsExtractingAudio] = useState(false);


  // Styling based on accessibility store
  const isHcHigh = contrastMode === 'high';
  const isDark = theme === 'dark';

  const cardBg = isHcHigh ? 'bg-black border-2 border-yellow-400' : isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#E5E7EB]';
  const textColor = isHcHigh ? 'text-cyan-400' : isDark ? 'text-gray-200' : 'text-[#111827]';
  const subText = isHcHigh ? 'text-yellow-400' : isDark ? 'text-gray-400' : 'text-[#6B7280]';
  const btnHover = isHcHigh ? 'hover:bg-yellow-400/20 text-yellow-500' : isDark ? 'hover:bg-[#334155] text-gray-400' : 'hover:bg-gray-100 text-[#6B7280]';

  useEffect(() => {
    return () => {
      if (shareTimerRef.current) {
        window.clearTimeout(shareTimerRef.current);
      }
    };
  }, []);

  const handleComment = () => {
    if (onComment) {
      onComment(post.id);
    }
  };

  const buildShareUrl = () => {
    const safeContent = (post.content || '').trim();
    const shareTarget = `${window.location.origin}${window.location.pathname}?postId=${encodeURIComponent(post.id)}`;
    const quote = safeContent ? safeContent.slice(0, 160) : `${post.userName} a partage un post sur DeepSkyn`;

    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareTarget)}&quote=${encodeURIComponent(quote)}`;
  };

  const handleShare = async () => {
    if (onShare) {
      onShare(post.id);
    }

    if (shareTimerRef.current) {
      window.clearTimeout(shareTimerRef.current);
    }

    setShowShareFlow(true);
    setShareState('preparing');

    const facebookShareUrl = buildShareUrl();

    shareTimerRef.current = window.setTimeout(async () => {
      setShareState('opening');

      const popup = window.open(facebookShareUrl, '_blank', 'noopener,noreferrer,width=640,height=720');

      if (!popup) {
        setShareState('error');
        toast.error('Impossible d ouvrir Facebook. Popup bloquee.');

        try {
          const fallbackUrl = `${window.location.origin}${window.location.pathname}?postId=${encodeURIComponent(post.id)}`;
          await navigator.clipboard.writeText(fallbackUrl);
          toast.success(t('community.copyLinkSuccess') || 'Lien du post copie !');
        } catch {
          // Clipboard can fail on insecure contexts, keep UX feedback in share flow.
        }

        return;
      }

      setShareState('success');
      toast.success('Partage Facebook lance avec succes !');

      shareTimerRef.current = window.setTimeout(() => {
        setShowShareFlow(false);
        setShareState('idle');
      }, 2200);
    }, 350);
  };

  const handleLSFTranslate = async () => {
    try {
      if (post.media && post.media.includes('video')) {
        // Pour les vidéos, le modal affichera le lecteur vidéo avec transcription intégrée
        setShowLSFModal(true);
      } else {
        // Comportement standard pour les posts texte/image
        if (!post.content?.trim()) {
          toast.error('Aucun texte à traduire');
          return;
        }
        setShowLSFModal(true);
        await translate(post.content);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCloseLSFModal = () => {
    setShowLSFModal(false);
    reset();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(post.id);
    }
  };

  // Helper function to render content with hashtag styling
  const renderContentWithHashtags = (content: string) => {
    if (!content) return null;

    // Split content by hashtags and render with styling
    const parts = content.split(/(\#\w+)/g);
    
    return (
      <p className={`${textColor} text-sm whitespace-pre-wrap leading-relaxed`}>
        {parts.map((part, idx) => {
          if (part?.startsWith('#')) {
            return (
              <span
                key={idx}
                className={`font-semibold ${isHcHigh ? 'text-cyan-400' : isDark ? 'text-[#0EA5E9]' : 'text-[#0284c7]'} hover:underline cursor-pointer transition-colors`}
              >
                {part}
              </span>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </p>
    );
  };

  // Helper function to optionally render the dynamic injected templates (Location/Feelings) gracefully
  const renderContent = () => {
    if (!post.content) return null;
    
    const separatorIdx = post.content.indexOf('\n\n— ');
    if (separatorIdx !== -1) {
      const mainText = post.content.substring(0, separatorIdx);
      const feelingLocationText = post.content.substring(separatorIdx + 4);
      
      // Determine if there is a location part
      const locMarker = '📍 ';
      const locIdx = feelingLocationText.indexOf(locMarker);
      
      let feelingPart = feelingLocationText;
      let locationPart = '';
      
      if (locIdx !== -1) {
        feelingPart = feelingLocationText.substring(0, locIdx);
        locationPart = feelingLocationText.substring(locIdx + locMarker.length);
      }

      const openMap = (e: React.MouseEvent) => {
        e.stopPropagation();
        const query = encodeURIComponent(locationPart);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
      };

      return (
        <>
          {renderContentWithHashtags(mainText)}
          <div className={`mt-3 flex flex-wrap gap-2`}>
            {feelingPart.trim() && (
              <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${isHcHigh ? 'bg-yellow-400 text-black' : isDark ? 'bg-[#0f172a] text-[#0EA5E9] border border-[#334155]' : 'bg-[#e0f2fe] text-[#0284c7]'}`}>
                {feelingPart}
              </div>
            )}
            {locationPart && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openMap}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isHcHigh ? 'bg-cyan-400 text-black hover:bg-cyan-300' : isDark ? 'bg-[#0f172a] text-[#10B981] border border-[#10B981]/30 hover:border-[#10B981]' : 'bg-[#D1FAE5] text-[#059669] hover:bg-[#A7F3D0]'}`}
              >
                📍 {locationPart}
              </motion.button>
            )}
          </div>
        </>
      );
    }
    return renderContentWithHashtags(post.content);
  };



  const REACTIONS = [
    { id: 'like', icon: '👍', label: t('community.reactions.like'), color: 'text-blue-500' },
    { id: 'love', icon: '❤️', label: t('community.reactions.love'), color: 'text-red-500' },
    { id: 'haha', icon: '😆', label: t('community.reactions.haha'), color: 'text-yellow-500' },
    { id: 'wow', icon: '😮', label: t('community.reactions.wow'), color: 'text-yellow-500' },
    { id: 'sad', icon: '😢', label: t('community.reactions.sad'), color: 'text-yellow-500' },
    { id: 'angry', icon: '😡', label: t('community.reactions.angry'), color: 'text-orange-500' },
  ];

  const handleLike = (reactId: string = 'like') => {
    if (reaction === reactId) {
      setReaction(null);
      setIsLiked(false);
      setLikeCount(likeCount - 1);
    } else {
      if (!reaction) setLikeCount(likeCount + 1);
      setReaction(reactId);
      setIsLiked(true);
    }
    setShowReactions(false);
    if (onLike) onLike(post.id, reactId);
  };

  const currentReaction = REACTIONS.find(r => r.id === reaction) || REACTIONS[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl shadow-sm overflow-visible mb-4 transition-all ${cardBg}`}
    >
      {/* Post Header */}
      <div className="flex items-start justify-between p-4">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onProfileClick?.(post.userId)}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 cursor-pointer hover:opacity-90 ${isHcHigh ? 'border-2 border-yellow-400 bg-black text-cyan-400' : 'bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white'}`}
          >
            {post.userAvatar ? (
              <img src={post.userAvatar} alt={post.userName} className="w-full h-full object-cover rounded-full" />
            ) : (
              post.userName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h4 
              onClick={() => onProfileClick?.(post.userId)}
              className={`font-bold text-sm cursor-pointer hover:underline ${textColor}`}
            >
              {post.userName}
            </h4>
            <div className={`flex items-center gap-1.5 text-xs ${subText}`}>
              <span>{getRelativeTime(post.createdAt, t)}</span>
              <span>•</span>
              <Globe2 className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMenu(!showMenu)}
            className={`p-2 rounded-full transition-colors ${btnHover}`}
          >
            <MoreHorizontal className="w-5 h-5" />
          </motion.button>

          <AnimatePresence>
            {showMenu && post.isByCurrentUser && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className={`absolute right-0 top-full mt-2 border rounded-xl shadow-2xl z-50 overflow-hidden min-w-[180px] backdrop-blur-xl ${isHcHigh ? 'bg-black border-yellow-400' : isDark ? 'bg-[#1e293b]/95 border-white/10' : 'bg-white/95 border-gray-100'}`}
              >
                <div className="p-1.5 space-y-1">
                  <button
                    onClick={() => { if (onArchive) onArchive(post.id); setShowMenu(false); }}
                    className="w-full px-3 py-2.5 flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 rounded-lg text-sm font-semibold transition-all group"
                  >
                    <Archive className={`w-4 h-4 ${post.status === 'archived' ? 'text-green-500' : 'text-[#0EA5E9]'} group-hover:scale-110 transition-transform`} />
                    {post.status === 'archived' ? t('community.restore') : t('community.archive')}
                  </button>
                  <button
                    onClick={() => { handleDelete(); setShowMenu(false); }}
                    className="w-full px-3 py-2.5 flex items-center gap-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-sm font-semibold transition-all group"
                  >
                    <Trash2 className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                    {t('common.delete')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="px-4 pb-2">
        {renderContent()}
      </div>

      {post.media && (
        <div className={`mt-2 ${isHcHigh ? 'border-y-2 border-yellow-400' : isDark ? 'border-y border-white/5' : 'border-y border-gray-100'}`}>
          {post.media.includes('video') ? (
            <div className="w-full relative rounded-lg">
              <Suspense 
                fallback={
                  <div className="w-full h-[300px] bg-black flex items-center justify-center">
                    <Loader className="w-8 h-8 animate-spin text-[#0EA5E9]" />
                  </div>
                }
              >
                <VideoAccessibilityPlayer
                  videoUrl={post.media}
                  videoId={post.id}
                  showAvatar={true}
                  showTranscription={true}
                  avatarPosition="right"
                  className="rounded-lg"
                  onAvatarClick={handleLSFTranslate}
                />
              </Suspense>
            </div>
          ) : (
            <img src={post.media} alt="Post media" className="w-full max-h-[500px] object-cover bg-gray-100 dark:bg-[#0f172a]" />
          )}
        </div>
      )}

      {(likeCount > 0 || post.comments > 0) && (
        <div className={`flex items-center justify-between px-4 py-2 text-xs ${subText} ${!post.media ? (isHcHigh ? 'border-t border-yellow-400/30 mt-3' : isDark ? 'border-t border-white/5 mt-3' : 'border-t border-gray-100 mt-3') : ''}`}>
          <div className="flex items-center gap-1.5 cursor-pointer hover:underline">
            {likeCount > 0 && (
              <div className="flex -space-x-1 items-center">
                 <div className={`w-5 h-5 rounded-full flex items-center justify-center border border-white dark:border-[#1e293b] z-[1] ${reaction ? '' : 'bg-blue-500'}`}>
                   {reaction ? (
                     <span className="text-xs -mt-0.5">{currentReaction.icon}</span>
                   ) : (
                     <ThumbsUp className="w-2.5 h-2.5 text-white fill-white" />
                   )}
                 </div>
                 {likeCount > 1 && !reaction && (
                   <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center border border-white dark:border-[#1e293b]">
                     <span className="text-[8px]">❤️</span>
                   </div>
                 )}
                 <span className="ml-2 font-medium">{likeCount}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {post.comments > 0 && <span onClick={handleComment} className="cursor-pointer hover:underline">{post.comments} {t('community.comments')}</span>}
          </div>
        </div>
      )}

      {/* Post Actions (Buttons) */}
      <div className={`flex items-center justify-between px-2 py-1 mx-2 mb-2 border-t ${isHcHigh ? 'border-yellow-400/30' : isDark ? 'border-[#334155]' : 'border-[#E5E7EB]'} mt-1`}>
        <div 
          className="relative flex-1"
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          <AnimatePresence>
            {showReactions && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: -45, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                className={`absolute left-0 bottom-full mb-2 bg-white dark:bg-[#1e293b] p-1.5 rounded-full shadow-2xl flex items-center gap-1 border border-gray-100 dark:border-[#334155] z-30`}
              >
                {REACTIONS.map((r, i) => (
                  <motion.button
                    key={r.id}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: i * 0.05 } }}
                    onClick={() => handleLike(r.id)}
                    className="p-2 text-xl hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative group"
                  >
                    {r.icon}
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {r.label}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleLike('like')}
            className={`w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-colors ${btnHover} ${
              reaction ? currentReaction.color : ''
            }`}
          >
            {reaction ? (
              <span className="text-xl">{currentReaction.icon}</span>
            ) : (
              <ThumbsUp className="w-5 h-5" />
            )}
            <span>{reaction ? currentReaction.label : t('community.reactions.like')}</span>
          </motion.button>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleComment}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-colors ${btnHover}`}
        >
          <MessageSquare className="w-5 h-5" />
          <span>{t('community.comments')}</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-colors ${btnHover}`}
        >
          <Share2 className="w-5 h-5" />
          <span>{t('stats.shares') || 'Partager'}</span>
        </motion.button>

        {!post.media?.includes('video') && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleLSFTranslate}
            disabled={isTranslating}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-colors ${
              isTranslating
                ? 'opacity-50 cursor-not-allowed'
                : isHcHigh
                  ? 'hover:bg-yellow-400/20 text-yellow-500'
                  : isDark
                    ? 'hover:bg-[#334155] text-gray-400'
                    : 'hover:bg-gray-100 text-[#6B7280]'
            }`}
            title="Traduire le texte en LSF"
          >
            {isTranslating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>LSF</span>
              </>
            ) : (
              <>
                <Hand className="w-5 h-5" />
                <span>LSF</span>
              </>
            )}
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {showShareFlow && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`mx-4 mb-3 rounded-xl border p-3 ${isHcHigh ? 'border-yellow-400 bg-black' : isDark ? 'border-[#334155] bg-[#0f172a]' : 'border-[#E5E7EB] bg-[#F8FAFC]'}`}
          >
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0.9, opacity: 0.7 }}
                animate={{
                  scale: shareState === 'preparing' || shareState === 'opening' ? [0.95, 1.08, 0.95] : 1,
                  opacity: 1,
                }}
                transition={{ repeat: shareState === 'preparing' || shareState === 'opening' ? Infinity : 0, duration: 1.2 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${isHcHigh ? 'bg-yellow-400 text-black' : isDark ? 'bg-[#1e293b] text-[#60A5FA]' : 'bg-[#DBEAFE] text-[#1D4ED8]'}`}
              >
                {shareState === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : shareState === 'error' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Share2 className="w-5 h-5" />
                )}
              </motion.div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${textColor}`}>
                  {shareState === 'preparing' && 'Preparation du partage Facebook...'}
                  {shareState === 'opening' && 'Ouverture de Facebook...'}
                  {shareState === 'success' && 'Post pret a etre partage sur Facebook'}
                  {shareState === 'error' && 'Partage direct bloque. Lien copie si possible.'}
                </p>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
                  <motion.div
                    className={`h-full ${shareState === 'error' ? 'bg-red-500' : 'bg-[#1877F2]'}`}
                    initial={{ width: '15%' }}
                    animate={{
                      width:
                        shareState === 'preparing'
                          ? '35%'
                          : shareState === 'opening'
                            ? '70%'
                            : shareState === 'success'
                              ? '100%'
                              : '45%',
                    }}
                    transition={{ duration: 0.35 }}
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  if (shareTimerRef.current) {
                    window.clearTimeout(shareTimerRef.current);
                  }
                  setShowShareFlow(false);
                  setShareState('idle');
                }}
                className={`text-xs font-semibold px-2 py-1 rounded-md transition-colors ${isHcHigh ? 'text-yellow-400 hover:bg-yellow-400/20' : isDark ? 'text-gray-300 hover:bg-[#1e293b]' : 'text-[#475569] hover:bg-white'}`}
              >
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign Translation Modal */}
      <SignTranslationModal
        isOpen={showLSFModal}
        onClose={handleCloseLSFModal}
        text={post.content || ''}
        videoUrl={post.media?.includes('video') ? post.media : undefined}
        frames={translationData?.frames}
        metadata={translationData?.metadata}
        isLoading={isTranslating}
        error={translationError}
      />
    </motion.div>
  );
}
