import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image, Smile, MapPin, Send, X } from 'lucide-react';
import { Button } from '../../components/button';
import toast from 'react-hot-toast';

interface PostComposerProps {
  userAvatar?: string;
  userName?: string;
  onSubmit?: (content: string, media?: string) => void;
  isLoading?: boolean;
}

export function PostComposer({
  userAvatar,
  userName = 'Utilisateur',
  onSubmit,
  isLoading = false,
}: PostComposerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaPreview, setMediaPreview] = useState('');

  const handleMediaAdd = () => {
    // In a real app, this would open a file picker
    // For now, we'll show a URL input
    const url = prompt('Entrez l\'URL de l\'image:');
    if (url) {
      setMediaUrl(url);
      setMediaPreview(url);
    }
  };

  const handleRemoveMedia = () => {
    setMediaUrl('');
    setMediaPreview('');
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Veuillez écrire quelque chose');
      return;
    }

    try {
      if (onSubmit) {
        await onSubmit(content, mediaUrl || undefined);
      }
      toast.success('Post publié !');
      setContent('');
      setMediaUrl('');
      setMediaPreview('');
      setIsExpanded(false);
    } catch (error) {
      toast.error('Erreur lors de la publication');
      console.error(error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden mb-6"
    >
      <div className="p-6">
        {/* Composer Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-full h-full rounded-full object-cover" />
            ) : (
              userName.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1">
            <input
              type="text"
              placeholder={`Quoi de neuf, ${userName.split(' ')[0]} ?`}
              value={isExpanded ? '' : content}
              onClick={() => setIsExpanded(true)}
              onFocus={() => setIsExpanded(true)}
              className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-sm focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all cursor-pointer"
              readOnly={!isExpanded}
            />
          </div>
        </div>

        {/* Expanded Composer */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <textarea
                autoFocus
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Quoi de neuf, ${userName.split(' ')[0]} ?`}
                className="w-full p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl resize-none h-32 focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all"
              />

              {/* Media Preview */}
              {mediaPreview && (
                <div className="relative mt-4 rounded-xl overflow-hidden group">
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full max-h-96 object-cover"
                  />
                  <button
                    onClick={handleRemoveMedia}
                    className="absolute top-2 right-2 p-2 bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E5E7EB]">
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleMediaAdd}
                    className="p-2 text-[#6B7280] hover:text-[#0EA5E9] hover:bg-[#F0F9FF] rounded-lg transition-colors"
                    title="Ajouter une photo/vidéo"
                  >
                    <Image className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 text-[#6B7280] hover:text-[#0EA5E9] hover:bg-[#F0F9FF] rounded-lg transition-colors"
                    title="Ajouter un feeling"
                  >
                    <Smile className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 text-[#6B7280] hover:text-[#0EA5E9] hover:bg-[#F0F9FF] rounded-lg transition-colors"
                    title="Ajouter une localisation"
                  >
                    <MapPin className="w-5 h-5" />
                  </motion.button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsExpanded(false);
                      setContent('');
                      setMediaUrl('');
                      setMediaPreview('');
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!content.trim() || isLoading}
                    loading={isLoading}
                  >
                    <Send className="w-4 h-4" />
                    Publier
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
