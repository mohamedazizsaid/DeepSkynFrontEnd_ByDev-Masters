import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { UserPlus, Sparkles, Loader2, Check, LayoutGrid, List, Search, Filter, SlidersHorizontal, Users as UsersIcon } from 'lucide-react';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { usersService } from '../../../lib/services/users.service';
import toast from 'react-hot-toast';

interface SuggestedUser {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  mutualFriends?: number;
  skinType?: string;
  _count?: { followers: number };
}

export interface SuggestionCardProps {
  user: SuggestedUser;
  onFollow: (id: string) => void;
  isFollowing: boolean;
  viewMode: 'grid' | 'list';
}

function SuggestionCard({ user, onFollow, isFollowing, viewMode }: SuggestionCardProps) {
  const { theme, contrastMode, t } = useAccessibilityStore();
  const isDark = theme === 'dark';
  const isHcHigh = contrastMode === 'high';

  const cardBg = isHcHigh ? 'bg-black border-2 border-yellow-400' : isDark ? 'bg-[#1e293b]/60 backdrop-blur-xl border-[#334155]' : 'bg-white/80 backdrop-blur-xl border-[#E5E7EB]';
  const textColor = isHcHigh ? 'text-cyan-400' : isDark ? 'text-gray-100' : 'text-[#111827]';
  const subText = isHcHigh ? 'text-yellow-300' : isDark ? 'text-gray-400' : 'text-[#6B7280]';

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-center gap-4 p-4 rounded-3xl border shadow-sm transition-all hover:shadow-md ${cardBg}`}
      >
        <div className="relative flex-shrink-0">
          <div className={`w-14 h-14 rounded-full border-2 overflow-hidden ${isHcHigh ? 'border-yellow-400' : isDark ? 'border-[#334155]' : 'border-white shadow-sm'}`}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0EA5E9] to-[#8B5CF6] text-white font-bold text-xl">
                {user.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className={`font-bold text-base ${textColor} truncate`}>{user.name}</h4>
            {user.skinType && (
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold bg-[#0EA5E9]/10 text-[#0EA5E9]`}>
                {user.skinType}
              </span>
            )}
          </div>
          <p className={`text-xs ${subText} truncate mb-1`}>{user.bio || t('community.welcomeBio')}</p>
          <div className={`text-[10px] ${subText} flex items-center gap-1`}>
            <UsersIcon className="w-3 h-3" />
            {user._count?.followers || 0} {t('community.followers')}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onFollow(user.id)}
          className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition-all group/followBtn ${
            isFollowing
              ? (isHcHigh ? 'bg-black border-2 border-yellow-400 text-yellow-400' : 'bg-gray-100 hover:bg-red-50 dark:bg-[#334155] dark:hover:bg-red-500/10 text-gray-500 hover:text-red-500 border border-transparent hover:border-red-200')
              : (isHcHigh ? 'bg-yellow-400 text-black' : 'bg-[#0EA5E9] text-white hover:bg-[#0284C7]')
          }`}
        >
          {isFollowing ? (
            <>
              <span className="group-hover/followBtn:hidden">{t('common.following')}</span>
              <span className="hidden group-hover/followBtn:inline">Désabonner</span>
            </>
          ) : (
            t('common.follow')
          )}
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className={`relative group rounded-3xl border shadow-lg overflow-hidden transition-all duration-300 h-full flex flex-col ${cardBg}`}
    >
      <div className={`absolute top-0 left-0 w-full h-24 opacity-20 group-hover:opacity-30 transition-opacity bg-gradient-to-br from-[#0EA5E9] via-[#8B5CF6] to-[#D946EF]`} />

      <div className="relative px-6 pb-6 pt-10 flex flex-col flex-1">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className={`absolute -inset-1 rounded-full bg-gradient-to-tr from-[#0EA5E9] to-[#D946EF] blur opacity-40 group-hover:opacity-100 transition duration-500`} />
            <div className={`relative w-24 h-24 rounded-full border-4 overflow-hidden shadow-2xl ${isHcHigh ? 'border-yellow-400 bg-black' : isDark ? 'border-[#1e293b] bg-[#334155]' : 'border-white bg-[#F3F4F6]'}`}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0EA5E9] to-[#8B5CF6] text-white font-bold text-3xl">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-center mb-6 flex-1">
          <h4 className={`font-bold text-lg ${textColor} truncate mb-1`}>{user.name}</h4>
          <p className={`text-sm ${subText} line-clamp-2 h-10 leading-relaxed mb-4`}>
            {user.bio || t('community.defaultBio')}
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-2">
            {user.skinType && (
              <span className={`text-[11px] px-3 py-1 rounded-full font-bold shadow-sm ${isHcHigh ? 'bg-yellow-400 text-black' : 'bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0EA5E9]/20'}`}>
                {t('community.skinType', { type: user.skinType })}
              </span>
            )}
            <span className={`text-[11px] px-3 py-1 rounded-full font-bold bg-gray-500/10 ${subText} flex items-center gap-1.5 shadow-sm`}>
              <UsersIcon className="w-3.5 h-3.5" />
              {user._count?.followers || 0} {t('community.followers')}
            </span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onFollow(user.id)}
          className={`w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center transition-all duration-300 shadow-xl shadow-[#0EA5E9]/10 mt-auto group/followBtn ${
            isFollowing
              ? (isHcHigh ? 'bg-black border-2 border-yellow-400 text-yellow-400' : 'bg-gray-100 hover:bg-red-50 dark:bg-[#334155] dark:hover:bg-red-500/10 text-gray-500 hover:text-red-500 dark:text-gray-300 hover:border-red-200 border border-transparent')
              : (isHcHigh ? 'bg-yellow-400 text-black' : 'bg-gradient-to-r from-[#0EA5E9] to-[#0184C7] text-white hover:shadow-cyan-500/30')
          }`}
        >
          {isFollowing ? (
            <>
              <span className="flex items-center gap-2 group-hover/followBtn:hidden">
                <Check className="w-4 h-4" />
                {t('common.following')}
              </span>
              <span className="hidden items-center group-hover/followBtn:flex">
                Désabonner
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                {t('common.follow')}
              </span>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

export interface SuggestionsTabProps {
  initialFilter?: 'all' | 'followers';
  followers?: any[];
  onFollowChange?: () => void;
}

export function SuggestionsTab({ initialFilter = 'all', followers = [], onFollowChange }: SuggestionsTabProps) {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SuggestedUser[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'followers'>(initialFilter);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [minSubs, setMinSubs] = useState<number>(0);
  const [maxSubs, setMaxSubs] = useState<number>(10000);
  const [showFilters, setShowFilters] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  
  const { theme, contrastMode, t } = useAccessibilityStore();
  const isDark = theme === 'dark';
  const isHcHigh = contrastMode === 'high';
  const textColor = isHcHigh ? 'text-cyan-400' : isDark ? 'text-gray-100' : 'text-[#111827]';
  const subText = isHcHigh ? 'text-yellow-300' : isDark ? 'text-gray-400' : 'text-[#6B7280]';

  useEffect(() => { fetchSuggestions(); }, []);

  useEffect(() => {
    // Si followers est sélectionné, on utilise followers
    setFilterType(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    const baseUsers = filterType === 'followers' ? followers : users;
    
    const filtered = baseUsers.map(u => ({ ...u, skinType: u.skinType || u.skinProfile?.skinType })).filter(u => {
      const nameMatch = u?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const followerCount = u?._count?.followers || 0;
      const subMatch = followerCount >= minSubs && followerCount <= maxSubs;
      return nameMatch && subMatch;
    });
    setFilteredUsers(filtered);
  }, [users, followers, filterType, searchQuery, minSubs, maxSubs]);

  const fetchSuggestions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await usersService.getSuggestions();
      const mapped = data.map(u => ({ ...u, skinType: u.skinType || u.skinProfile?.skinType || null }));
      setUsers(mapped);
    } catch { toast.error(t('common.error')); } 
    finally { if (!silent) setLoading(false); }
  };

  const handleFollow = async (id: string) => {
    try {
      const res = await usersService.toggleFollow(id);
      setFollowingMap(prev => ({ ...prev, [id]: res.followed }));
      toast.success(res.followed ? t('common.success') : t('common.success'));
      
      if (res.followed && filterType === 'all') {
         fetchSuggestions(true);
      }
      
      if (onFollowChange) onFollowChange();
    } catch { toast.error(t('common.error')); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-[#0EA5E9] mb-4" />
        <p className={`text-sm ${subText} animate-pulse`}>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* Header & Controls */}
      <div className="mb-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl shadow-inner ${isHcHigh ? 'bg-yellow-400/20' : 'bg-gradient-to-br from-[#0EA5E9]/10 to-[#8B5CF6]/10'}`}>
              <Sparkles className={`w-8 h-8 ${isHcHigh ? 'text-yellow-400' : 'text-[#0EA5E9]'}`} />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${textColor}`}>{t('community.suggestionsForYou')}</h2>
              <p className={`text-xs ${subText}`}>{t('community.skinEnthusiasts')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex p-1 rounded-xl ${isHcHigh ? 'border-2 border-yellow-400 bg-black' : 'bg-gray-100 dark:bg-[#1e293b]'}`}>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? (isHcHigh ? 'bg-yellow-400 text-black' : 'bg-white dark:bg-[#334155] text-[#0EA5E9] shadow-sm') : 'text-gray-400'}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? (isHcHigh ? 'bg-yellow-400 text-black' : 'bg-white dark:bg-[#334155] text-[#0EA5E9] shadow-sm') : 'text-gray-400'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
            
            {/* Filter Toggle Tous/Abonnés */}
            <div className={`flex p-1 rounded-xl ${isHcHigh ? 'border-2 border-yellow-400 bg-black' : 'bg-gray-100 dark:bg-[#1e293b]'}`}>
              <button 
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filterType === 'all' ? (isHcHigh ? 'bg-yellow-400 text-black' : 'bg-white dark:bg-[#334155] text-[#0EA5E9] shadow-sm') : 'text-gray-400'}`}
              >
                Suggestions
              </button>
              <button 
                onClick={() => setFilterType('followers')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filterType === 'followers' ? (isHcHigh ? 'bg-yellow-400 text-black' : 'bg-white dark:bg-[#334155] text-[#0EA5E9] shadow-sm') : 'text-gray-400'}`}
              >
                Mes abonné(e)s
              </button>
            </div>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-xl transition-all ${showFilters ? (isHcHigh ? 'bg-yellow-400 text-black' : 'bg-[#0EA5E9] text-white') : (isHcHigh ? 'border-2 border-yellow-400 text-yellow-400' : 'bg-gray-100 dark:bg-[#1e293b] text-gray-400')}`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Advanced Search & Filters */}
        <div className={`p-6 rounded-3xl border transition-all duration-300 ${isHcHigh ? 'bg-black border-2 border-yellow-400' : 'bg-white dark:bg-[#1e293b] border-[#E5E7EB] dark:border-[#334155] shadow-sm'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            {/* Search Input */}
            <div className="lg:col-span-5 relative">
              <label className={`block text-[10px] font-bold uppercase tracking-wider ${subText} mb-2 ml-1`}>{t('common.search')}</label>
              <div className="relative">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${subText}`} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('common.search')}
                  className={`w-full pl-11 pr-4 py-3 rounded-2xl text-sm transition-all focus:ring-2 outline-none ${isHcHigh ? 'bg-black border-2 border-yellow-400 text-yellow-400 focus:ring-yellow-400' : 'bg-gray-50 dark:bg-[#242f3e] border-[#E5E7EB] dark:border-[#334155] text-[#111827] dark:text-white focus:ring-[#0EA5E9]/30'}`}
                />
              </div>
            </div>

            {/* Min Subs */}
            <div className="lg:col-span-3">
              <label className={`block text-[10px] font-bold uppercase tracking-wider ${subText} mb-2 ml-1`}>{t('community.minFollowers')}</label>
              <input 
                type="number" 
                value={minSubs}
                onChange={(e) => setMinSubs(Number(e.target.value))}
                className={`w-full px-4 py-3 rounded-2xl text-sm transition-all focus:ring-2 outline-none ${isHcHigh ? 'bg-black border-2 border-yellow-400 text-yellow-400' : 'bg-gray-50 dark:bg-[#242f3e] border-[#E5E7EB] dark:border-[#334155] text-[#111827] dark:text-white focus:ring-[#0EA5E9]/30'}`}
              />
            </div>

            {/* Max Subs */}
            <div className="lg:col-span-3">
              <label className={`block text-[10px] font-bold uppercase tracking-wider ${subText} mb-2 ml-1`}>{t('community.maxFollowers')}</label>
              <input 
                type="number" 
                value={maxSubs}
                onChange={(e) => setMaxSubs(Number(e.target.value))}
                className={`w-full px-4 py-3 rounded-2xl text-sm transition-all focus:ring-2 outline-none ${isHcHigh ? 'bg-black border-2 border-yellow-400 text-yellow-400' : 'bg-gray-50 dark:bg-[#242f3e] border-[#E5E7EB] dark:border-[#334155] text-[#111827] dark:text-white focus:ring-[#0EA5E9]/30'}`}
              />
            </div>

            <div className="lg:col-span-1 flex justify-center">
               <button 
                onClick={() => { setSearchQuery(''); setMinSubs(0); setMaxSubs(10000); }}
                className={`p-3 rounded-xl text-xs font-bold transition-all ${isHcHigh ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-gray-400 hover:text-red-500'}`}
               >
                 {t('common.reset')}
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid/List Layout View */}
      {filteredUsers.length === 0 ? (
        <div className={`text-center py-20 rounded-3xl border-2 border-dashed ${isHcHigh ? 'border-yellow-400' : 'border-gray-200 dark:border-[#334155]'}`}>
           <p className={subText}>{t('common.noResults')}</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 items-stretch" : "flex flex-col gap-4"}>
          {filteredUsers.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="h-full"
            >
              <SuggestionCard
                user={user}
                onFollow={handleFollow}
                isFollowing={followingMap[user.id] ?? (filterType === 'followers')}
                viewMode={viewMode}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
