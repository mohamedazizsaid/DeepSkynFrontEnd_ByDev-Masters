import React from 'react';
import { motion } from 'motion/react';
import { useAccessibilityStore } from '../../../stores/accessibility.store';

export type Tab = 'publications' | 'about' | 'photos' | 'videos' | 'friends';

interface ProfileTabsProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const { t } = useAccessibilityStore();
  const tabs = [
    { id: 'publications', label: t('community.posts') },
    { id: 'about', label: t('community.profileAboutTitle') },
    { id: 'photos', label: t('community.profilePhotosTitle') },
    { id: 'videos', label: t('community.videos') },
    { id: 'friends', label: t('community.profileFriendsTitle') },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] rounded-lg mb-6 shadow-sm"
    >
      <div className="flex items-center overflow-x-auto">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id as Tab)}
            className="relative px-6 py-4 text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors whitespace-nowrap"
            whileHover={{ backgroundColor: 'rgba(15, 23, 42, 0.05)' }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-[#0EA5E9]"
                transition={{ type: 'spring', stiffness: 380, damping: 40 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
