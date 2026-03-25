import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { StoryUser } from './story-bar';

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: StoryUser[];
  initialIndex?: number;
}

export function StoryViewerModal({ isOpen, onClose, stories, initialIndex = 0 }: StoryViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  const activeStories = stories.filter(s => s.hasStory && s.mediaUrl);
  const currentStory = activeStories[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < activeStories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, activeStories.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setProgress(0);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (!isOpen || !currentStory) return;

    const DURATION = 5000; // 5 seconds per story
    const INTERVAL = 50; // update every 50ms

    const timer = setInterval(() => {
      setProgress(prev => {
        const nextProgress = prev + (INTERVAL / DURATION) * 100;
        if (nextProgress >= 100) {
          clearInterval(timer);
          handleNext();
          return 100;
        }
        return nextProgress;
      });
    }, INTERVAL);

    return () => clearInterval(timer);
  }, [isOpen, currentIndex, currentStory, handleNext]);

  if (!isOpen || activeStories.length === 0 || !currentStory) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black text-white flex items-center justify-center p-0 sm:p-4 backdrop-blur-xl"
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
          className="relative w-full h-full sm:w-[400px] sm:h-[90vh] bg-neutral-900 sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Progress Bars */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-4 pt-4 pb-4 bg-gradient-to-b from-black/80 to-transparent">
            {activeStories.map((_, idx) => (
              <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-[50ms]"
                  style={{
                    width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* User Info Overlay */}
          <div className="absolute top-8 left-0 right-0 z-20 px-4 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-white/50 overflow-hidden bg-white/20 p-[2px]">
                   <img src={currentStory.avatar || `https://ui-avatars.com/api/?name=${currentStory.name}`} alt={currentStory.name} className="w-full h-full object-cover rounded-full" />
                </div>
                <div>
                   <span className="font-bold text-sm drop-shadow-md">{currentStory.name}</span>
                   <span className="ml-2 text-xs text-white/70">2h</span>
                </div>
             </div>
             
             {/* Mobile Close Button */}
             <button onClick={onClose} className="p-2 sm:hidden text-white/70 hover:text-white">
               <X className="w-6 h-6" />
             </button>
          </div>

          {/* Media Content */}
          <div className="flex-1 relative bg-black flex items-center justify-center">
            {currentStory.mediaUrl?.includes('video') ? (
               <video src={currentStory.mediaUrl} autoPlay loop playsInline className="w-full h-full object-cover" />
            ) : (
               <img src={currentStory.mediaUrl} alt="Story content" className="w-full h-full object-cover pointer-events-none" />
            )}
            
            {/* Click Areas for Prev / Next */}
            <div className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer" onClick={handlePrev} />
            <div className="absolute inset-y-0 right-0 w-2/3 z-10 cursor-pointer" onClick={handleNext} />
          </div>

          {/* Desktop Navigation Chevrons */}
          <button 
             onClick={handlePrev} 
             className={`absolute -left-16 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors hidden sm:block ${currentIndex === 0 ? 'opacity-0 pointer-events-none' : ''}`}
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
             <div className="flex items-center gap-3">
               <input type="text" placeholder={`Répondre à ${currentStory.name}...`} className="flex-1 bg-black/40 border border-white/30 rounded-full px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-colors" />
             </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
