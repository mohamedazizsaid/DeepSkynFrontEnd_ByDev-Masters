import React, { useState, useRef, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UploadCloud, Image as ImageIcon, CheckCircle, Loader2, Play } from 'lucide-react';
import { useAccessibilityStore } from '../../../stores/accessibility.store';

interface StoryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  userAvatar?: string;
  userName?: string;
}

export function StoryUploadModal({ isOpen, onClose, onUpload, userAvatar, userName = 'Utilisateur' }: StoryUploadModalProps) {
  const { theme, contrastMode, t } = useAccessibilityStore();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';
  const isHcHigh = contrastMode === 'high';

  const modalBg = isHcHigh ? 'bg-black border-2 border-yellow-400' : isDark ? 'bg-[#1e293b] border border-[#334155]' : 'bg-white border border-gray-100';
  const textColor = isHcHigh ? 'text-cyan-400' : isDark ? 'text-white' : 'text-gray-900';
  const subText = isHcHigh ? 'text-yellow-400' : isDark ? 'text-gray-400' : 'text-gray-500';

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
      alert('Veuillez sélectionner une image ou une vidéo.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('Le fichier est trop volumineux (max 10MB).');
      return;
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const handleUploadClick = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      await onUpload(file);
      handleReset();
      onClose();
    } catch (e) {
      console.error(e);
      alert('Failed to upload story');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] ${modalBg}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header (Mobile Only) */}
          <div className={`md:hidden p-4 border-b flex justify-between items-center ${isHcHigh ? 'border-yellow-400' : isDark ? 'border-[#334155]' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-bold ${textColor}`}>Créer une Story</h2>
            <button onClick={onClose} className={`p-2 rounded-full ${isDark ? 'bg-[#334155] text-gray-200' : 'bg-gray-100 text-gray-600'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Left / Settings Side */}
          <div className={`w-full md:w-80 flex flex-col border-r ${isHcHigh ? 'border-yellow-400 bg-black' : isDark ? 'border-[#334155] bg-[#0f172a]' : 'border-gray-200 bg-gray-50/50'} p-6`}>
            <div className="hidden md:flex justify-between items-center mb-6">
              <h2 className={`text-xl font-bold ${textColor}`}>Votre Story</h2>
              <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-[#334155] text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-black'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden ${isHcHigh ? 'border border-yellow-400 bg-black text-cyan-400' : 'bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white'}`}>
                {userAvatar ? <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" /> : userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className={`font-semibold ${textColor}`}>{userName}</p>
                <p className={`text-xs ${subText}`}>Sera visible pendant 24h</p>
              </div>
            </div>

            <div className="mt-auto">
              {!file ? (
                <div className="p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 opacity-50 border-gray-400">
                  <span className={`text-xs font-medium text-center ${textColor}`}>Sélectionnez ou glissez un média pour commencer</span>
                </div>
              ) : (
                <button
                  onClick={handleUploadClick}
                  disabled={isUploading}
                  className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg ${
                    isHcHigh 
                      ? 'bg-yellow-400 text-black hover:bg-yellow-500' 
                      : 'bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white hover:from-[#0284C7] hover:to-[#0891B2] hover:shadow-[#0EA5E9]/30'
                  }`}
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Partager la Story'}
                </button>
              )}
            </div>
          </div>

          {/* Right / Preview Area */}
          <div className="flex-1 relative flex items-center justify-center p-6 sm:p-10 bg-black/5">
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full max-w-sm aspect-[9/16] rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 border-2 border-dashed ${
                  isDragging
                    ? 'border-[#0EA5E9] bg-[#0EA5E9]/10 scale-105'
                    : isDark ? 'border-[#334155] bg-[#1e293b] hover:border-[#475569]' : 'border-gray-300 bg-white hover:border-[#0EA5E9]/50 hover:bg-gray-50'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDragging ? 'bg-[#0EA5E9]/20 text-[#0EA5E9]' : isDark ? 'bg-[#334155] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                  <ImageIcon className="w-8 h-8" />
                </div>
                <h3 className={`text-lg font-bold mb-1 ${textColor}`}>Ajouter à votre Story</h3>
                <p className={`text-sm text-center px-6 ${subText}`}>Glissez et déposez une photo/vidéo, ou cliquez pour parcourir.</p>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
              </div>
            ) : (
              <div className="relative w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl bg-black flex items-center justify-center">
                {file.type.startsWith('video/') ? (
                  <video src={previewUrl!} controls autoPlay loop className="w-full h-full object-cover" />
                ) : (
                  <img src={previewUrl!} alt="Preview" className="w-full h-full object-cover" />
                )}
                
                {/* Overlay UI to simulate story view */}
                <div className="absolute inset-x-0 top-0 p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                  <div className="flex gap-2">
                    <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                       <div className="h-full bg-white w-full rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-8 h-8 rounded-full border border-white/50 overflow-hidden bg-gray-500">
                      {userAvatar ? <img src={userAvatar} className="w-full h-full object-cover" /> : null}
                    </div>
                    <span className="text-white text-sm font-semibold drop-shadow-md">{userName}</span>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
