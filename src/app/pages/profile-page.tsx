import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ProfileHero } from './components/profile-hero';
import { ProfileTabs, type Tab } from './components/profile-tabs';
import { PostComposer } from './components/post-composer';
import { PostCard } from './components/post-card';
import { AdCard } from './components/ad-card';
import { ProfileSidebar } from './components/profile-sidebar';
import { MOCK_POSTS } from './components/mock-posts';
import { MOCK_ADS, interleaveFeedWithAds } from './components/mock-ads';
import { useAuthStore } from '../../stores/auth.store';
import toast from 'react-hot-toast';

interface ProfilePageProps {
  onBack?: () => void;
  userId?: string; // If provided, show that user's profile instead of current user
}

export function ProfilePage({ onBack, userId }: ProfilePageProps) {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('publications');
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [feedWithAds, setFeedWithAds] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState({
    id: userId || currentUser?.sub || '',
    name: currentUser?.name || 'Utilisateur',
    email: currentUser?.email || 'user@example.com',
    avatar: currentUser?.avatar,
    coverPhoto: currentUser?.coverPhoto,
    bio: 'Passionnée par la skincare et le bien-être 💙 | Partage mes routines et conseils.',
    location: 'Paris, France',
    website: 'https://www.deepskyn.com',
    gender: currentUser?.gender,
    createdAt: currentUser?.createdAt || new Date().toISOString(),
    postsCount: 24,
    followersCount: 1250,
    followingCount: 342,
  });

  const isOwnProfile = !userId || userId === currentUser?.sub;

  // Initialize feed with ads
  useEffect(() => {
    const ads = MOCK_ADS.slice(0, 2); // Show 2 ads max in feed
    const interleaved = interleaveFeedWithAds(MOCK_POSTS, ads);
    setFeedWithAds(interleaved);
  }, []);

  const handleCoverPhotoUpload = async (url: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUserProfile((prev) => ({ ...prev, coverPhoto: url }));
      // In real app, would call: await authService.updateProfile({ coverPhoto: url });
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (url: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUserProfile((prev) => ({ ...prev, avatar: url }));
      // In real app, would call: await authService.updateProfile({ avatar: url });
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (content: string, media?: string) => {
    try {
      const newPost = {
        id: String(posts.length + 1),
        userId: userProfile.id,
        userName: userProfile.name,
        userAvatar: userProfile.avatar,
        content,
        media,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
        shares: 0,
        isLiked: false,
        isByCurrentUser: true,
      };

      setPosts((prev) => [newPost, ...prev]);
      setUserProfile((prev) => ({
        ...prev,
        postsCount: prev.postsCount + 1,
      }));

      // Regenerate feed with ads
      const ads = MOCK_ADS.slice(0, 2);
      const interleaved = interleaveFeedWithAds([newPost, ...posts], ads);
      setFeedWithAds(interleaved);
    } catch (error) {
      toast.error('Erreur lors de la publication');
      console.error(error);
    }
  };

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setUserProfile((prev) => ({
      ...prev,
      postsCount: Math.max(0, prev.postsCount - 1),
    }));

    // Regenerate feed
    const newPosts = posts.filter((p) => p.id !== postId);
    const ads = MOCK_ADS.slice(0, 2);
    const interleaved = interleaveFeedWithAds(newPosts, ads);
    setFeedWithAds(interleaved);
  };

  const handleLikePost = (postId: string) => {
    // Local state only - no backend persistence
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isLiked: !p.isLiked } : p))
    );
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-[#6B7280] hover:text-[#0EA5E9] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-2xl font-bold text-[#111827]">Profil</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        )}

        {/* Profile Hero */}
        <ProfileHero
          user={userProfile}
          isOwnProfile={isOwnProfile}
          onEditProfile={() => toast('Page d\'édition - Fonctionnalité à venir')}
          onCoverPhotoUpload={handleCoverPhotoUpload}
          onAvatarUpload={handleAvatarUpload}
          onFollow={() => toast.success('Vous suivez maintenant cet utilisateur')}
        />

        {/* Tabs */}
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content Based on Active Tab */}
        {activeTab === 'publications' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Feed */}
            <div className="lg:col-span-2">
              {/* Post Composer - Only for own profile */}
              {isOwnProfile && (
                <PostComposer
                  userAvatar={userProfile.avatar}
                  userName={userProfile.name}
                  onSubmit={handleCreatePost}
                />
              )}

              {/* Feed */}
              {feedWithAds.length > 0 ? (
                <div>
                  {feedWithAds.map((item, idx) => (
                    <div key={idx}>
                      {item.type === 'post' ? (
                        <PostCard
                          post={item.data}
                          onLike={handleLikePost}
                          onDelete={handleDeletePost}
                        />
                      ) : (
                        <AdCard ad={item.data} />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-[#E5E7EB]">
                  <p className="text-[#6B7280]">Aucune publication pour le moment</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block">
              <ProfileSidebar
                data={{
                  bio: userProfile.bio,
                  location: userProfile.location,
                  website: userProfile.website,
                  joinDate: userProfile.createdAt,
                  recentPhotos: [
                    'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1570194065650-cd4628902426?w=300&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1576091160399-5f9e5c3e5c0e?w=300&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1517836357463-d25ddfcbf042?w=300&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1607631814075-e51df1bdc82f?w=300&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop',
                  ],
                  recentFriends: [
                    {
                      id: '1',
                      name: 'Sophie',
                      avatar:
                        'https://ui-avatars.com/api/?name=Sophie&background=0EA5E9&color=fff',
                    },
                    {
                      id: '2',
                      name: 'Marie',
                      avatar:
                        'https://ui-avatars.com/api/?name=Marie&background=06B6D4&color=fff',
                    },
                    {
                      id: '3',
                      name: 'Emma',
                      avatar:
                        'https://ui-avatars.com/api/?name=Emma&background=F9A8D4&color=fff',
                    },
                    {
                      id: '4',
                      name: 'Julie',
                      avatar:
                        'https://ui-avatars.com/api/?name=Julie&background=FED7AA&color=fff',
                    },
                    {
                      id: '5',
                      name: 'Laura',
                      avatar:
                        'https://ui-avatars.com/api/?name=Laura&background=A78BFA&color=fff',
                    },
                    {
                      id: '6',
                      name: 'Claire',
                      avatar:
                        'https://ui-avatars.com/api/?name=Claire&background=FBBF24&color=fff',
                    },
                    {
                      id: '7',
                      name: 'Lisa',
                      avatar:
                        'https://ui-avatars.com/api/?name=Lisa&background=34D399&color=fff',
                    },
                    {
                      id: '8',
                      name: 'Anna',
                      avatar:
                        'https://ui-avatars.com/api/?name=Anna&background=60A5FA&color=fff',
                    },
                    {
                      id: '9',
                      name: 'Nina',
                      avatar:
                        'https://ui-avatars.com/api/?name=Nina&background=F87171&color=fff',
                    },
                  ],
                }}
              />
            </div>
          </div>
        )}

        {/* Other Tabs Content */}
        {activeTab === 'about' && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8">
            <h2 className="text-2xl font-bold text-[#111827] mb-6">À propos</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-[#111827] mb-2">Bio</h3>
                <p className="text-[#6B7280]">{userProfile.bio}</p>
              </div>
              <div>
                <h3 className="font-semibold text-[#111827] mb-2">Localisation</h3>
                <p className="text-[#6B7280]">{userProfile.location}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8">
            <h2 className="text-2xl font-bold text-[#111827] mb-6">Photos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  className="aspect-square rounded-lg bg-[#F3F4F6] cursor-pointer overflow-hidden"
                >
                  <img
                    src={`https://images.unsplash.com/photo-${1556228578 + i}?w=300&h=300&fit=crop`}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-full object-cover hover:brightness-75 transition-all"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center py-12">
            <p className="text-[#6B7280]">Aucune vidéo pour le moment</p>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8">
            <h2 className="text-2xl font-bold text-[#111827] mb-6">
              Amis ({userProfile.followingCount})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center p-4 rounded-lg hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center text-white font-bold text-lg mb-3">
                    {String.fromCharCode(65 + i)}
                  </div>
                  <h3 className="font-semibold text-sm text-center">Ami {i + 1}</h3>
                  <p className="text-xs text-[#6B7280] text-center mt-1">@friend{i + 1}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
