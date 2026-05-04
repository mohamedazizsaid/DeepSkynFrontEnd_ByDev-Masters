import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Camera, MapPin, Link2, Calendar, MessageCircle, UserPlus, Loader2 } from 'lucide-react';
import { Button } from '../../components/button';
import { StoryHighlights } from './story-highlights';
import { StoryTimeline } from './story-timeline';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  coverPhoto?: string;
  bio?: string;
  location?: string;
  website?: string;
  createdAt: string;
  gender?: string;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
}

interface ProfileHeroProps {
  user: UserProfile;
  isOwnProfile: boolean;
  onEditProfile?: () => void;
  onCoverPhotoUpload?: (url: string) => Promise<void>;
  onAvatarUpload?: (url: string) => Promise<void>;
  onFollow?: () => void;
  isFollowing?: boolean;
}

export function ProfileHero({
  user,
  isOwnProfile,
  onEditProfile,
  onCoverPhotoUpload,
  onAvatarUpload,
  onFollow,
  isFollowing = false,
}: ProfileHeroProps) {
  const { t, language } = useAccessibilityStore();
  const [loadingCover, setLoadingCover] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const handleCoverPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('community.photoSizeError'));
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error(t('community.typeError'));
      return;
    }

    setLoadingCover(true);
    try {
      // Convert to base64 for now
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        if (onCoverPhotoUpload) {
          await onCoverPhotoUpload(base64);
          toast.success(t('community.coverUpdated'));
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error(t('community.uploadError'));
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
      toast.error(t('community.photoSizeError'));
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error(t('community.typeError'));
      return;
    }

    setLoadingAvatar(true);
    try {
      // Convert to base64 for now
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        if (onAvatarUpload) {
          await onAvatarUpload(base64);
          toast.success(t('community.avatarUpdated'));
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error(t('community.uploadError'));
      console.error(error);
    } finally {
      setLoadingAvatar(false);
    }
  };

  const formatJoinDate = (date: string) => {
    const locale = language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-GB' : language === 'es' ? 'es-ES' : 'fr-FR';
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden mb-6"
    >
      {/* Cover Photo Section */}
      <div className="relative h-48 bg-gradient-to-r from-[#7DD3FC] to-[#BAE6FD]">
        {user.coverPhoto && (
          <img
            src={user.coverPhoto}
            alt="Cover photo"
            className="w-full h-full object-cover"
          />
        )}

        {/* Cover Photo Upload Button */}
        {isOwnProfile && (
          <div
            className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            onClick={() => coverInputRef.current?.click()}
          >
            {loadingCover ? (
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Camera className="w-8 h-8 text-white" />
                <span className="text-white text-sm font-medium">{t('common.edit')}</span>
              </div>
            )}
          </div>
        )}

        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleCoverPhotoChange}
          className="hidden"
        />
      </div>

      {/* Profile Content */}
      <div className="px-8 pt-0 pb-8">
        <div className="flex items-end gap-6 mb-6">
          {/* Avatar */}
          <div className="relative -mt-16 flex-shrink-0">
            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800 overflow-hidden shadow-lg">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[#6B7280]">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>

            {/* Avatar Edit Button */}
            {isOwnProfile && (
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
            )}

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* User Action Buttons */}
          <div className="flex-1"></div>
          <div className="flex gap-3">
            {isOwnProfile ? (
              <Button onClick={onEditProfile}>{t('common.edit')}</Button>
            ) : (
              <>
                <Button
                  variant={isFollowing ? 'outline' : 'primary'}
                  onClick={onFollow}
                >
                  <UserPlus className="w-4 h-4" />
                  {isFollowing ? t('common.following') : t('common.follow')}
                </Button>
                <Button variant="outline">
                  <MessageCircle className="w-4 h-4" />
                  {t('common.send')}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-[#111827] dark:text-gray-100">{user.name || t('common.user')}</h1>
          <p className="text-[#6B7280] dark:text-gray-400">@{user.email?.split('@')[0] || t('common.user')}</p>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-[#374151] dark:text-gray-300 mb-4 leading-relaxed">{user.bio}</p>
        )}

        {/* Location, Website, Join Date */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm text-[#6B7280] dark:text-gray-400">
          {user.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{user.location}</span>
            </div>
          )}
          {user.website && (
            <div className="flex items-center gap-1.5 text-[#0EA5E9] hover:underline cursor-pointer">
              <Link2 className="w-4 h-4" />
              <a href={user.website} target="_blank" rel="noopener noreferrer">
                {user.website}
              </a>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{t('community.joinedIn', { date: formatJoinDate(user.createdAt) })}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-8 pt-4 border-t border-[#E5E7EB] dark:border-slate-700">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="cursor-pointer"
          >
            <p className="font-bold text-[#111827] dark:text-gray-100">{user.postsCount || 0}</p>
            <p className="text-sm text-[#6B7280] dark:text-gray-400">{t('community.publications')}</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="cursor-pointer"
          >
            <p className="font-bold text-[#111827] dark:text-gray-100">{user.followersCount || 0}</p>
            <p className="text-sm text-[#6B7280] dark:text-gray-400">{t('community.followers')}</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="cursor-pointer"
          >
            <p className="font-bold text-[#111827] dark:text-gray-100">{user.followingCount || 0}</p>
            <p className="text-sm text-[#6B7280] dark:text-gray-400">{t('community.subscriptions')}</p>
          </motion.div>
        </div>

        {/* Story Highlights */}
        <div className="mt-8 pt-6 border-t border-[#E5E7EB] dark:border-slate-700">
          <StoryHighlights
            userId={user.id}
            isOwnProfile={isOwnProfile}
            onHighlightCreate={onEditProfile}
          />
        </div>

        {/* Story Timeline */}
        <div className="mt-8 pt-6 border-t border-[#E5E7EB] dark:border-slate-700">
          <StoryTimeline userId={user.id} />
        </div>
      </div>
    </motion.div>
  );
}
