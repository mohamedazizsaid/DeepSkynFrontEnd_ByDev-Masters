import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { StoryUser } from './story-bar';

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

export function StoryViewerModal({ isOpen, onClose, stories, initialUserIndex = 0, onUserFinished }: StoryViewerModalProps) {
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const currentUser = stories[currentUserIndex];
  const currentItem = currentUser?.items[currentItemIndex];

  const handleNext = useCallback(() => {
    if (!currentUser) return;

    if (currentItemIndex < currentUser.items.length - 1) {
      // Go to next item for the same user
      setCurrentItemIndex(prev => prev + 1);
      setProgress(0);
    } else {
      // User stories finished
      if (onUserFinished) onUserFinished(currentUser.id);
      
      // Go to next user
      if (currentUserIndex < stories.length - 1) {
        setCurrentUserIndex(prev => prev + 1);
        setCurrentItemIndex(0);
        setProgress(0);
      } else {
        // Last user finished
        onClose();
      }
    }
  }, [currentUser, currentItemIndex, currentUserIndex, stories.length, onUserFinished, onClose]);

  const handlePrev = useCallback(() => {
    if (!currentUser) return;

    if (currentItemIndex > 0) {
      // Prev item of same user
      setCurrentItemIndex(prev => prev - 1);
      setProgress(0);
    } else {
      // Prev user
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
    }
  }, [isOpen, initialUserIndex]);

  // Progress timer
  useEffect(() => {
    if (!isOpen || !currentItem) return;

    const DURATION = 5000;
    const INTERVAL = 50;

    const timer = setInterval(() => {
      setProgress(prev => prev + (INTERVAL / DURATION) * 100);
    }, INTERVAL);

    return () => clearInterval(timer);
  }, [isOpen, currentItem, currentItemIndex, currentUserIndex]);

  // Auto-advance
  useEffect(() => {
    if (progress >= 100) {
      handleNext();
    }
  }, [progress, handleNext]);

  if (!isOpen || !currentUser || !currentItem) return null;

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

        <motion.div
          initial={{ scale: 0.9, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 50, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full h-full sm:w-[400px] sm:h-[90vh] bg-[#0A0A0A] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-white/5"
        >
          {/* Segmented Timeline (Progress Bars per User Items) */}
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
          <div className="flex-1 relative flex items-center justify-center shadow-inner" style={{ backgroundColor: '#0f0f0f' }}>
            {currentItem.mediaUrl.includes('video') ? (
               <video src={currentItem.mediaUrl} autoPlay loop playsInline className="w-full h-full object-cover" />
            ) : (
               <img src={currentItem.mediaUrl} alt="Story content" className="w-full h-full object-cover pointer-events-none" />
            )}
            
            {/* Click Areas for Prev / Next */}
            <div className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer" onClick={handlePrev} />
            <div className="absolute inset-y-0 right-0 w-2/3 z-10 cursor-pointer" onClick={handleNext} />
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
          
          {/* Reply Action */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent">
             <div className="flex items-center gap-3 text-white/90">
               <input type="text" placeholder={`Répondre à ${currentUser.name.split(' ')[0]}...`} className="flex-1 bg-black/40 border border-white/30 rounded-full px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-colors" />
             </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
