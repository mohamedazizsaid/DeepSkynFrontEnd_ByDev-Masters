import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Users, 
  MessageCircle, 
  BadgeCheck, 
  Calendar,
  Loader2,
  Share2,
  Search,
  Sun,
  Moon,
  Droplets,
  Sparkles,
  Zap,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Clock,
  Heart,
  Activity,
  Award,
  Shield,
  Layers,
  Edit2,
  Newspaper,
  Archive,
  User,
  UserPlus,
  BarChart3
} from 'lucide-react';
import { PostCard } from './components/post-card';
import { postsService } from '../../lib/services/posts.service';
import { usersService } from '../../lib/services/users.service';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import { useAuthStore } from '../../stores/auth.store';
import { routineService } from '../../lib/services/routine.service';
import toast from 'react-hot-toast';

interface PublicProfilePageProps {
  userId: string;
  onBack: () => void;
  onProfileClick?: (id: string) => void;
  onNavigate?: (page: string) => void;
}

export function PublicProfilePage({ userId, onBack, onProfileClick, onNavigate }: PublicProfilePageProps) {
  const { theme, contrastMode, t } = useAccessibilityStore();
  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'skin_profile' | 'routine'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState<any>({
    posts: 0,
    followers: 0,
    following: 0,
    likes: 0,
    comments: 0
  });

  const isHcHigh = contrastMode === 'high';
  const isDark = theme === 'dark';

  const fetchProfile = useCallback(async () => {
    const targetUserId = String(userId || '').trim();
    if (!targetUserId) {
      setLoading(false);
      toast.error(t('common.error'));
      return;
    }

    try {
      setLoading(true);
      const userRes = await usersService.getById(targetUserId);

      if (!userRes || userRes?.id == null) {
        throw new Error('User profile not found');
      }

      setIsFollowing(userRes.isFollowing || false);

      const statsRes = await usersService.getUserStats(targetUserId);
      const postsRes = await postsService.findByUser(targetUserId, 1, 20);

      setUser(userRes);
      setStats(statsRes);
      setPosts(postsRes.data || []);
      
      // If routines are not in userRes, fetch them separately (already added to backend findById but optional fallback)
      if (!userRes.routines) {
         try {
           const routines = await routineService.getUserRoutine(targetUserId); // Assuming this might exist or we add it
           setUser(prev => ({ ...prev, routines }));
         } catch (e) {
           console.log("Routines not found for user", e);
         }
      }
    } catch (err) {
      console.error("Failed to fetch public profile", err);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleToggleFollow = async () => {
    try {
      const result = await usersService.toggleFollow(userId);
      setIsFollowing(result.followed);
      setStats(prev => ({
        ...prev,
        followers: result.followed ? prev.followers + 1 : prev.followers - 1
      }));
      toast.success(result.followed ? t('common.follow') : t('common.unfollow'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleRefresh = async () => {
    const loadingToast = toast.loading(t('common.loading'));
    await fetchProfile();
    toast.success(t('common.success'), { id: loadingToast });
  };

  const handleShareRoutine = async (routine: any) => {
    try {
      const routineDetails = routine.steps.map((s: any, i: number) => `${i+1}. ${s.productName || s.name}`).join('\n');
      const message = `✨ Je viens de mettre à jour ma routine ${routine.type} !\n\n${routineDetails}\n\nDécouvrez mon profil pour plus de détails.`;
      
      const loadingToast = toast.loading(t('common.loading'));
      await postsService.create({ 
        message, 
        media: user?.avatar // Use avatar as default media if none
      });
      toast.success(t('common.success'), { id: loadingToast });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const cardBg = isHcHigh ? 'bg-black border-2 border-yellow-400' : isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#E5E7EB]';
  const textColor = isHcHigh ? 'text-cyan-400' : isDark ? 'text-gray-200' : 'text-[#111827]';
  const subText = isHcHigh ? 'text-yellow-300' : isDark ? 'text-gray-400' : 'text-[#6B7280]';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-[#0EA5E9] animate-spin mb-4" />
        <p className={subText}>{t('common.loading')}</p>
      </div>
    );
  }

  // ─── Community Tabs for illusion of continuity ───
  const communityTabs = [
    { key: 'feed', label: t('community.feed'), icon: <Newspaper className="w-4 h-4" /> },
    { key: 'archive', label: t('community.archivesTab'), icon: <Archive className="w-4 h-4" /> },
    { key: 'profile', label: t('community.profile'), icon: <User className="w-4 h-4" /> },
    { key: 'suggestions', label: t('community.suggestions'), icon: <UserPlus className="w-4 h-4" /> },
    { key: 'stats', label: t('community.stats'), icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* ═══ Fake Sub-navigation tabs (Navigates back to community) ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border shadow-sm p-1.5 mb-6 flex gap-1 ${cardBg}`}
      >
        {communityTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={onBack} // Returns to community
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
              isHcHigh
                ? 'text-yellow-400 hover:bg-yellow-400/10'
                : isDark
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-[#334155]'
                  : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Main Profile Layout */}
      <div className="max-w-4xl mx-auto">
        {/* Back Button matching theme */}
        <button 
          onClick={onBack}
          className={`mb-6 flex items-center gap-2 px-5 py-2.5 rounded-[1.25rem] text-sm font-bold transition-all shadow-md backdrop-blur-md border ${
            isHcHigh 
              ? 'bg-black border-yellow-400 text-yellow-400 hover:bg-yellow-400/10' 
              : isDark 
                ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                : 'bg-white/80 border-[#0EA5E9]/20 text-[#0EA5E9] hover:bg-white hover:border-[#0EA5E9]/40 hover:shadow-lg'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          {t('community.backToHub')}
        </button>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-[2.5rem] overflow-hidden shadow-2xl mb-8 ${cardBg} relative`}
      >
        {/* Cover with Overlay Information */}
        <div className={`h-64 relative ${isHcHigh ? 'bg-black border-b-2 border-yellow-400' : 'bg-gradient-to-br from-[#0EA5E9] via-[#8B5CF6] to-[#F9A8D4]'}`}>
          {user?.coverPhoto && <img src={user.coverPhoto} alt="cover" className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          {/* Info OVER the cover */}
          <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="flex items-end gap-6">
              <div className={`w-32 h-32 rounded-3xl border-4 overflow-hidden shadow-2xl flex-shrink-0 bg-white transition-all hover:scale-105 ${isHcHigh ? 'border-yellow-400' : 'border-white'}`}>
                {user?.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl font-bold bg-gradient-to-br from-pink-400 to-orange-300 text-white">{user?.name?.charAt(0)}</div>}
              </div>
              <div className="mb-2">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">{user?.name}</h1>
                  <BadgeCheck className="w-6 h-6 text-[#0EA5E9] fill-white" />
                </div>
                <p className="text-white/90 font-medium text-sm tracking-wide opacity-90 drop-shadow-md">@{user?.email?.split('@')[0]}</p>
                
                <div className="flex flex-wrap items-center gap-3 mt-4">
                   <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-[10px] text-white font-bold uppercase tracking-wider border border-white/20 shadow-lg">
                     {t('community.certifiedMember')}
                   </span>
                   {isFollowing && (
                     <span className="px-4 py-1.5 bg-[#0EA5E9] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-2">
                       <BadgeCheck className="w-3 h-3" />
                       {t('common.following')}
                     </span>
                   )}
                   <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-xl text-[10px] text-white font-bold uppercase tracking-wider border border-white/20 shadow-lg flex items-center gap-2">
                     <Newspaper className="w-3 h-3" />
                     {stats.posts} {t('community.posts')}
                   </span>
                   {currentUser?.sub === userId && (
                     <button 
                       onClick={handleRefresh}
                       className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-[10px] text-white font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-[#0EA5E9] transition-all"
                     >
                       <RefreshCw className="w-3 h-3" />
                       {t('common.update')}
                     </button>
                   )}
                </div>
              </div>
            </div>

            {currentUser?.sub !== userId && (
              <div className="flex gap-3 mb-2">
                <button 
                  onClick={handleToggleFollow} 
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-xl backdrop-blur-md ${isFollowing ? 'bg-white/20 text-white hover:bg-white/30 border border-white/20' : 'bg-[#0EA5E9] text-white hover:bg-[#0EA5E9]/90 border border-transparent'}`}
                >
                   <Users className="w-4 h-4" />
                   {isFollowing ? t('common.unfollow') : t('common.follow')}
                </button>
                <button className={`p-2.5 rounded-xl transition-all shadow-xl backdrop-blur-md flex items-center justify-center border ${isHcHigh ? 'bg-black text-yellow-400 border-yellow-400' : 'bg-white/20 text-white hover:bg-white/30 border-white/20'}`}>
                   <MessageCircle className="w-5 h-5" />
                </button>
                <button className={`p-2.5 rounded-xl transition-all shadow-xl backdrop-blur-md flex items-center justify-center border ${isHcHigh ? 'bg-black text-yellow-400 border-yellow-400' : 'bg-white/20 text-white hover:bg-white/30 border-white/20'}`}>
                   <Share2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats and Bio Grid (Simple) */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`col-span-1 flex items-center justify-between p-6 rounded-3xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'} border`}>
               {[
                 { label: t('community.posts'), value: stats.posts },
                 { label: t('community.followers'), value: stats.followers },
                 { label: t('community.subscriptions'), value: stats.following }
               ].map((stat, i) => (
                 <div key={i} className="text-center">
                    <p className={`text-xl font-bold ${textColor}`}>{stat.value}</p>
                    <p className={`text-[9px] uppercase tracking-widest font-bold ${subText} opacity-60`}>{stat.label}</p>
                 </div>
               ))}
            </div>
            <div className={`col-span-1 md:col-span-2 p-6 rounded-3xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'} border flex items-center`}>
               <p className={`text-sm italic font-medium leading-relaxed ${subText} opacity-80`}>
                 "{user?.bio || t('community.defaultBio')}"
               </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Switcher */}
      <div className={`flex items-center gap-6 mb-8 border-t border-b ${isDark ? 'border-white/5' : 'border-gray-100'} pt-4 pb-0 px-2 overflow-x-auto no-scrollbar`}>
        {[
          { id: 'posts', label: t('community.publications'), icon: Calendar },
          { id: 'skin_profile', label: t('community.skinProfileTab'), icon: Activity },
          { id: 'routine', label: t('nav.routine'), icon: Sun },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-4 px-2 text-sm font-semibold transition-all relative border-b-2 hover:scale-105 active:scale-95 ${isActive ? 'text-[#0EA5E9] border-[#0EA5E9] scale-110' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? 'text-[#0EA5E9]' : 'text-gray-400'}`} />
              {tab.label}
              {isActive && (
                <motion.div 
                  layoutId="activeTabUnderline"
                  className="absolute bottom-[-2px] left-0 right-0 h-1 bg-[#0EA5E9] rounded-full shadow-[0_0_12px_rgba(14,165,233,0.5)]" 
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'posts' && (
          <motion.div
            key="posts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between px-2">
              <h3 className={`text-xl font-semibold flex items-center gap-3 ${textColor}`}>
                <div className="w-10 h-10 rounded-xl bg-[#0EA5E9]/10 flex items-center justify-center shadow-inner">
                   <Calendar className="w-5 h-5 text-[#0EA5E9]" />
                </div>
                {t('community.profilePostsOfUser', { name: user?.name })}
              </h3>
              <div className={`flex items-center gap-3 p-1.5 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-100 border border-gray-200'}`}>
                 <button className={`p-2 rounded-xl transition-all ${isDark ? 'bg-[#0EA5E9] text-white shadow-lg' : 'bg-white text-[#0EA5E9] shadow-sm'} hover:scale-105 active:scale-95`}>
                    <Users className="w-4 h-4" />
                 </button>
                 <button className={`p-2 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-all`}>
                    <Search className="w-4 h-4" />
                 </button>
              </div>
            </div>

            {posts.length === 0 ? (
              <div className={`p-20 text-center rounded-[3rem] border-2 border-dashed ${isDark ? 'border-white/10' : 'border-gray-100'} ${subText} flex flex-col items-center gap-4`}>
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center opacity-40 text-[#6B7280]">
                   <Calendar className="w-10 h-10" />
                </div>
                <p className="font-semibold text-lg">{t('community.profileNoPostsYet')}</p>
                <p className="text-xs opacity-70">{t('community.profileCheckBackSoon')}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map(post => (
                  <PostCard 
                    key={post.id}
                    post={{
                      ...post,
                      userName: user.name,
                      userAvatar: user.avatar,
                      isByCurrentUser: false
                    }}
                    onProfileClick={onProfileClick}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'skin_profile' && (
          <motion.div
            key="skin_profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className={`p-10 rounded-[3rem] ${cardBg} shadow-2xl overflow-hidden relative group border-none backdrop-blur-3xl ring-1 ring-white/5`}>
               <div className="absolute top-0 right-0 w-64 h-64 bg-[#0EA5E9]/5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-150" />
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#8B5CF6]/5 rounded-full blur-3xl -ml-32 -mb-32 transition-transform duration-1000 group-hover:scale-150" />
               
               <div className="flex items-center gap-5 mb-10 overflow-hidden relative">
                 <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-[#0EA5E9] to-[#0EA5E9] flex items-center justify-center shadow-xl text-white transform -rotate-3 hover:rotate-2 transition-transform">
                   <Activity className="w-8 h-8" />
                 </div>
                 <div>
                   <h3 className={`text-3xl font-bold ${textColor} tracking-tight`}>Identité Cutanée</h3>
                   <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#0EA5E9] opacity-80">DeepSkyn Skin Analysis</span>
                 </div>
               </div>

               {user?.skinProfile ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   {/* Left Column - Main Stats */}
                   <div className="space-y-8">
                     <div className={`p-8 rounded-[2.5rem] ${isDark ? 'bg-white/5' : 'bg-gray-50'} border border-white/5 shadow-inner transition-all hover:shadow-xl`}>
                        <div className="flex items-center gap-4 mb-3 text-[#0EA5E9]">
                          <Zap className="w-5 h-5" />
                          <h4 className="text-xs font-bold uppercase tracking-widest opacity-70">{t('community.profileSkinTypeLabel')}</h4>
                        </div>
                        <p className={`text-4xl font-bold ${textColor} mb-2`}>{user.skinProfile.skinType || 'N/A'}</p>
                        <p className="text-xs font-medium text-gray-500 italic opacity-80 leading-relaxed">{t('community.profileSkinTypeSentence', { name: user.name, type: user.skinProfile.skinType || 'N/A' })}</p>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-6">
                        <div className={`p-6 rounded-[2rem] ${isDark ? 'bg-white/5' : 'bg-gray-50'} border border-white/5`}>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t('community.profileSkinAgeLabel')}</p>
                          <div className="flex items-center gap-2">
                             <Clock className="w-4 h-4 text-green-400" />
                              <p className={`text-xl font-bold ${textColor}`}>{user.skinProfile.skinAge || '32'} {t('common.years')}</p>
                          </div>
                        </div>
                        <div className={`p-6 rounded-[2rem] ${isDark ? 'bg-white/5' : 'bg-gray-50'} border border-white/5`}>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t('community.profileHealthScoreLabel')}</p>
                          <div className="flex items-center gap-2">
                             <Heart className="w-4 h-4 text-pink-400" />
                             <p className={`text-xl font-bold ${textColor}`}>{user.skinProfile.healthScore || '92'}/100</p>
                          </div>
                        </div>
                     </div>
                   </div>

                   {/* Right Column - Concerns & Sensitivities */}
                   <div className="space-y-8">
                      <div className={`p-8 rounded-[2.5rem] ${isDark ? 'bg-white/5' : 'bg-gray-50'} border border-white/5 shadow-inner`}>
                        <div className="flex items-center gap-4 mb-6 text-[#8B5CF6]">
                           <Layers className="w-5 h-5" />
                          <h4 className="text-xs font-bold uppercase tracking-widest opacity-70">{t('community.profileConcernsLabel')}</h4>
                        </div>
                        <div className="flex flex-wrap gap-3">
                           {user.skinProfile.concerns?.map((c: string) => (
                             <span key={c} className="px-4 py-2 bg-[#8B5CF6]/10 text-[#8B5CF6] text-[10px] font-bold rounded-xl border border-[#8B5CF6]/20 uppercase tracking-wide shadow-sm hover:bg-[#8B5CF6] hover:text-white transition-all">
                               {c}
                             </span>
                          )) || <p className="text-xs italic text-gray-400">{t('community.profileNoConcerns')}</p>}
                        </div>
                      </div>

                      <div className={`p-8 rounded-[2.5rem] ${isDark ? 'bg-white/5' : 'bg-gray-50'} border border-white/5 shadow-inner`}>
                        <div className="flex items-center gap-4 mb-6 text-red-400">
                           <Shield className="w-5 h-5" />
                          <h4 className="text-xs font-bold uppercase tracking-widest opacity-70">{t('community.profileSensitivitiesLabel')}</h4>
                        </div>
                        <div className="flex flex-wrap gap-3">
                           {user.skinProfile.sensitivities?.map((s: string) => (
                             <span key={s} className="px-4 py-2 bg-red-400/10 text-red-500 text-[10px] font-bold rounded-xl border border-red-400/20 uppercase tracking-wide shadow-sm hover:bg-red-500 hover:text-white transition-all">
                               {s}
                             </span>
                          )) || <p className="text-xs italic text-gray-400">{t('community.profileNoSensitivities')}</p>}
                        </div>
                      </div>
                   </div>
                 </div>
               ) : (
                 <div className="text-center py-20 px-10 border-2 border-dashed border-white/10 rounded-[3rem] bg-white/5">
                    <Sparkles className="w-16 h-16 text-gray-400/40 mx-auto mb-6" />
                    <p className={`text-xl font-semibold ${textColor} mb-2`}>{t('community.profileSkinNotConfigured')}</p>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto italic">{t('community.profileSkinNotShared')}</p>
                 </div>
               )}
            </div>
          </motion.div>
        )}

        {activeTab === 'routine' && (
          <motion.div
            key="routine"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
             <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center shadow-xl shadow-[#0EA5E9]/10">
                    <Sun className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-2xl font-bold ${textColor} tracking-tight`}>Routine de Soins</h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0EA5E9] opacity-70">Daily Skincare Regimen</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  {currentUser?.sub === userId ? (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleShareRoutine(user.routines?.[0])} 
                        disabled={!user.routines?.length}
                        className="px-6 py-3 bg-[#0EA5E9]/10 text-[#0EA5E9] rounded-2xl text-xs font-bold uppercase tracking-widest border border-[#0EA5E9]/30 shadow-xl hover:bg-[#0EA5E9] hover:text-white hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                      >
                        <Share2 className="w-4 h-4" />
                        Partager ma Routine
                      </button>
                      <button 
                        onClick={() => onNavigate?.('routine')} 
                        className="px-6 py-3 bg-[#0EA5E9] text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-[#0EA5E9]/30 hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3 border-none"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Modifier ma Routine
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => toast.success(t('common.success'))} 
                      className="px-6 py-3 bg-[#0EA5E9] text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-[#0EA5E9]/30 hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3 border-none"
                    >
                      <Share2 className="w-4 h-4" />
                      Partager la Routine
                    </button>
                  )}
                </div>
             </div>

             {user?.routines && user.routines.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {user.routines.map((routine: any) => {
                   const isMorning = routine.type === 'AM' || routine.type.toLowerCase().includes('morning') || routine.type.toLowerCase().includes('matin');
                   return (
                     <div key={routine.id} className={`p-8 rounded-[3rem] ${cardBg} shadow-2xl overflow-hidden relative group backdrop-blur-3xl border-none ring-1 ring-white/5`}>
                        <div className={`absolute top-0 right-0 w-32 h-32 ${isMorning ? 'bg-orange-400/5' : 'bg-purple-600/5'} rounded-full blur-2xl transition-transform group-hover:scale-150`} />
                        
                        <div className="flex items-center justify-between mb-8 relative">
                           <div className="flex items-center gap-4">
                              <div className={`w-14 h-14 rounded-2xl ${isMorning ? 'bg-orange-400/10 text-orange-400' : 'bg-purple-600/10 text-purple-600'} flex items-center justify-center shadow-inner`}>
                                 {isMorning ? <Sun className="w-7 h-7" /> : <Moon className="w-7 h-7" />}
                              </div>
                              <div>
                                 <h4 className={`text-xl font-bold ${textColor} truncate max-w-[150px]`}>{routine.name}</h4>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{isMorning ? t('community.profileMorningRoutine') : t('community.profileEveningRoutine')}</p>
                              </div>
                           </div>
                           <div className={`px-4 py-1.5 rounded-full ${isMorning ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'} text-[10px] font-bold uppercase tracking-tighter shadow-sm`}>
                              {t('community.profileStepsCount', { count: routine.steps?.length || 0 })}
                           </div>
                        </div>

                        <div className="space-y-4 flex-grow relative">
                           {routine.steps?.slice(0, 4).map((step: any, idx: number) => (
                             <div key={idx} className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'} border border-white/5 flex items-center gap-4 transition-all hover:bg-white hover:shadow-lg shadow-sm group/step cursor-default`}>
                                <div className={`w-8 h-8 rounded-lg ${isMorning ? 'bg-orange-400/20 text-orange-500' : 'bg-purple-600/20 text-purple-500'} flex items-center justify-center text-xs font-bold shadow-inner group-hover/step:rotate-12 transition-transform`}>
                                   {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <p className={`text-sm font-semibold ${textColor} truncate`}>{step.productName || step.name}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">{step.category || t('community.profileTreatment')}</p>
                                </div>
                                <CheckCircle2 className="w-4 h-4 text-green-400 opacity-30" />
                             </div>
                           ))}
                           {routine.steps?.length > 4 && (
                             <div className="text-center pt-2">
                                <span className="text-[10px] font-bold text-[#0EA5E9] bg-[#0EA5E9]/5 px-5 py-2 rounded-full cursor-pointer hover:bg-[#0EA5E9] hover:text-white transition-all uppercase tracking-widest border border-[#0EA5E9]/20 shadow-sm">
                                  {t('community.profileMoreSteps', { count: routine.steps.length - 4 })}
                                </span>
                             </div>
                           )}
                        </div>

                        <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between overflow-hidden relative">
                           <div className="flex items-center gap-2 opacity-60">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-[10px] font-semibold text-gray-400">{routine.estimatedTime || '15'} {t('community.profileMinutesShort')}</span>
                           </div>
                           <button className={`p-2 rounded-xl text-gray-400 hover:text-[#0EA5E9] transition-all hover:scale-110 active:scale-90`}>
                              <RefreshCw className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                   );
                 })}
               </div>
             ) : (
               <div className="text-center py-20 px-10 border-2 border-dashed border-white/10 rounded-[3rem] bg-white/5">
                  <Sun className="w-16 h-16 text-gray-400/40 mx-auto mb-6" />
                  <p className={`text-xl font-semibold ${textColor} mb-2`}>{t('community.noRoutine')}</p>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto italic">{t('community.noRoutineDesc')}</p>
               </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
