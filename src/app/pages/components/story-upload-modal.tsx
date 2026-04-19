import React, { useState, useRef, DragEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UploadCloud, Image as ImageIcon, CheckCircle, Loader2, Play, Music, Trash2, Volume2, VolumeX, Download, ExternalLink } from 'lucide-react';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { postsService } from '../../../lib/services/posts.service';
import { toast } from 'sonner';

interface StoryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, musicFile?: File, musicTitle?: string) => Promise<void>;
  userAvatar?: string;
  userName?: string;
}

export function StoryUploadModal({ isOpen, onClose, onUpload, userAvatar, userName = 'Utilisateur' }: StoryUploadModalProps) {
  const { theme, contrastMode, t } = useAccessibilityStore();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicTitle, setMusicTitle] = useState('');
  const [musicPreviewUrl, setMusicPreviewUrl] = useState<string | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [freeMusic, setFreeMusic] = useState<any[]>([]);
  const [loadingMusic, setLoadingMusic] = useState(false);
  const [showFreeMusicList, setShowFreeMusicList] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

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
      alert(t('community.storyInvalidMediaType'));
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert(t('community.fileTooLarge'));
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

  const handleMusicSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('audio/')) {
      alert(t('community.storyInvalidMusicType'));
      return;
    }
    if (selectedFile.size > 15 * 1024 * 1024) {
      alert(t('community.storyMusicTooLarge'));
      return;
    }
    setMusicFile(selectedFile);
    setMusicTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    const url = URL.createObjectURL(selectedFile);
    setMusicPreviewUrl(url);
  };

  const handleRemoveMusic = () => {
    if (musicPreviewUrl) URL.revokeObjectURL(musicPreviewUrl);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setMusicFile(null);
    setMusicTitle('');
    setMusicPreviewUrl(null);
    setIsMusicPlaying(false);
  };

  const toggleMusicPreview = () => {
    if (!audioRef.current || !musicPreviewUrl) return;
    if (isMusicPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsMusicPlaying(!isMusicPlaying);
  };

  // Load free music
  useEffect(() => {
    const loadFreeMusic = async () => {
      try {
        setLoadingMusic(true);
        const music = await postsService.getFreeMusicForStories();
        setFreeMusic(music);
      } catch (error) {
        console.error('Error loading free music:', error);
        toast.error(t('common.error'));
      } finally {
        setLoadingMusic(false);
      }
    };

    if (isOpen) {
      loadFreeMusic();
    }
  }, [isOpen]);

  const handleSelectFreeMusic = (music: any) => {
    // Create a blob from the music URL and use it as the selected music
    setMusicTitle(music.title);
    setMusicPreviewUrl(music.url);
    setMusicFile(null); // Free music doesn't need a file object
    setShowFreeMusicList(false);
    toast.success(t('common.success'));
  };

  const handleUploadClick = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      await onUpload(file, musicFile || undefined, musicTitle || undefined);
      handleReset();
      onClose();
    } catch (e) {
      console.error(e);
      alert(t('community.storyError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    handleRemoveMusic();
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
          className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[650px] ${modalBg}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header (Mobile Only) */}
          <div className={`md:hidden p-4 border-b flex justify-between items-center ${isHcHigh ? 'border-yellow-400' : isDark ? 'border-[#334155]' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-bold ${textColor}`}>{t('community.storyCreateTitle')}</h2>
            <button onClick={onClose} className={`p-2 rounded-full ${isDark ? 'bg-[#334155] text-gray-200' : 'bg-gray-100 text-gray-600'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Left / Settings Side */}
          <div className={`w-full md:w-80 flex flex-col border-r ${isHcHigh ? 'border-yellow-400 bg-black' : isDark ? 'border-[#334155] bg-[#0f172a]' : 'border-gray-200 bg-gray-50/50'} p-6`}>
            <div className="hidden md:flex justify-between items-center mb-6">
              <h2 className={`text-xl font-bold ${textColor}`}>{t('community.storyYourStory')}</h2>
              <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-[#334155] text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-black'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden ${isHcHigh ? 'border border-yellow-400 bg-black text-cyan-400' : 'bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white'}`}>
                {userAvatar ? <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" /> : userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className={`font-semibold ${textColor}`}>{userName}</p>
                <p className={`text-xs ${subText}`}>{t('community.storyVisibleFor24h')}</p>
              </div>
            </div>

            {/* ─── Music Section ─── */}
            <div className={`rounded-2xl border p-4 mb-4 ${isHcHigh ? 'border-yellow-400/30 bg-yellow-400/5' : isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isHcHigh ? 'bg-yellow-400/20' : 'bg-gradient-to-br from-[#EC4899] to-[#8B5CF6] shadow-lg shadow-[#EC4899]/20'}`}>
                  <Music className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${textColor}`}>{t('community.storyAddMusic')}</p>
                  <p className={`text-[10px] ${subText}`}>{t('community.storyMusicFormats')}</p>
                </div>
              </div>

              {musicFile ? (
                <div className={`flex items-center gap-3 p-3 rounded-xl ${isHcHigh ? 'bg-black border border-yellow-400/30' : isDark ? 'bg-[#0f172a] border border-white/10' : 'bg-white border border-gray-200'}`}>
                  <button
                    onClick={toggleMusicPreview}
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-110 active:scale-95 ${isMusicPlaying ? 'bg-[#EC4899] shadow-lg shadow-[#EC4899]/30' : 'bg-gradient-to-br from-[#EC4899] to-[#8B5CF6]'} text-white`}
                  >
                    {isMusicPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${textColor}`}>{musicTitle}</p>
                    <p className={`text-[10px] ${subText}`}>{(musicFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                    {isMusicPlaying && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {[...Array(12)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: [4, Math.random() * 12 + 4, 4] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.05 }}
                            className="w-[3px] rounded-full bg-[#EC4899]"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleRemoveMusic}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {musicPreviewUrl && (
                    <audio 
                      ref={audioRef} 
                      src={musicPreviewUrl} 
                      crossOrigin="anonymous"
                      loop 
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => musicInputRef.current?.click()}
                    className={`w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${isHcHigh ? 'border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/5' : isDark ? 'border-white/20 text-gray-400 hover:text-white hover:border-white/40' : 'border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400'}`}
                  >
                    <UploadCloud className="w-4 h-4" />
                    {t('community.storyUploadOwnMusic')}
                  </button>

                  <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${subText}`}>
                    <div className="flex-1 h-px" style={{ backgroundColor: isHcHigh ? '#fbbf24' : isDark ? '#64748b' : '#e5e7eb' }} />
                    <span>{t('community.storyOrUpload')}</span>
                    <div className="flex-1 h-px" style={{ backgroundColor: isHcHigh ? '#fbbf24' : isDark ? '#64748b' : '#e5e7eb' }} />
                  </div>

                  {/* Free Music Browser */}
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`rounded-xl border p-3 ${isHcHigh ? 'border-yellow-400/30 bg-yellow-400/5' : isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isHcHigh ? 'bg-yellow-400/20' : 'bg-gradient-to-br from-green-400 to-[#06B6D4]'}`}>
                        <Music className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-bold uppercase tracking-wider ${textColor}`}>{t('community.storyFreeMusic')}</p>
                        <p className={`text-[10px] ${subText}`}>{t('community.storyFreeMusicDesc')}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowFreeMusicList(!showFreeMusicList)}
                      disabled={loadingMusic}
                      className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        isHcHigh
                          ? 'bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30'
                          : isDark
                          ? 'bg-white/10 text-gray-300 hover:bg-white/20'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {loadingMusic ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {t('community.storyLoadingMusic')}
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3" />
                          {t('community.storyBrowseFreeMusic')}
                        </>
                      )}
                    </button>

                    {/* Free Music List */}
                    <AnimatePresence>
                      {showFreeMusicList && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 max-h-48 overflow-y-auto space-y-2"
                        >
                          {freeMusic.length === 0 ? (
                            <p className={`text-xs text-center py-3 ${subText}`}>{t('community.storyNoMusicAvailable')}</p>
                          ) : (
                            freeMusic.map((music, idx) => (
                              <button
                                key={music.id || idx}
                                onClick={() => handleSelectFreeMusic(music)}
                                className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all hover:scale-[1.02] ${
                                  isHcHigh
                                    ? 'border-yellow-400/20 bg-yellow-400/10 hover:bg-yellow-400/20'
                                    : isDark
                                    ? 'border-white/10 bg-white/5 hover:bg-white/10'
                                    : 'border-gray-300 bg-white hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <Music className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-400" />
                                  <div className="flex-1 min-w-0">
                                    <p className={`font-bold truncate ${textColor}`}>{music.title}</p>
                                    <p className={`text-[9px] ${subText} truncate`}>{music.artist}</p>
                                    <p className={`text-[9px] ${subText}`}>{t('community.storyMusicSource', { source: music.source })}</p>
                                  </div>
                                  <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-50" />
                                </div>
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )}
              <input ref={musicInputRef} type="file" accept="audio/*" className="hidden" onChange={handleMusicSelect} />
            </div>

            {/* Music Title Input */}
            {musicFile && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${subText} mb-1 block`}>{t('community.storyMusicTitle')}</label>
                <input
                  value={musicTitle}
                  onChange={(e) => setMusicTitle(e.target.value)}
                  placeholder={t('community.storyMusicTitlePlaceholder')}
                  className={`w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all ${isHcHigh ? 'bg-black border border-yellow-400 text-cyan-400' : isDark ? 'bg-[#0f172a] border border-white/10 text-gray-200 focus:border-[#EC4899]' : 'bg-white border border-gray-200 text-gray-900 focus:border-[#EC4899]'}`}
                />
              </motion.div>
            )}

            <div className="mt-auto">
              {!file ? (
                <div className="p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 opacity-50 border-gray-400">
                  <span className={`text-xs font-medium text-center ${textColor}`}>{t('community.storySelectMedia')}</span>
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
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('community.storyShare')}
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
                <h3 className={`text-lg font-bold mb-1 ${textColor}`}>{t('community.storyAddMedia')}</h3>
                <p className={`text-sm text-center px-6 ${subText}`}>{t('community.storyDragDrop')}</p>
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

                {/* Music badge overlay */}
                {musicFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-16 left-4 right-4 pointer-events-none"
                  >
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-3 py-2 border border-white/10">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#EC4899] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
                        <Music className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-[11px] font-bold truncate">{musicTitle}</p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: [3, Math.random() * 8 + 3, 3] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08 }}
                            className="w-[2px] rounded-full bg-white/70"
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

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
