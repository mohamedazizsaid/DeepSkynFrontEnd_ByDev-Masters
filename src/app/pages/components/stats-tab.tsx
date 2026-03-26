import React from 'react';
import { motion } from 'motion/react';
import { Eye, Heart, MessageCircle, Share2, TrendingUp, Users, BarChart3, Activity } from 'lucide-react';
import { useAccessibilityStore } from '../../../stores/accessibility.store';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  color: string;
  delay?: number;
}

function StatCard({ icon, label, value, change, changeType = 'up', color, delay = 0 }: StatCardProps) {
  const { theme, contrastMode } = useAccessibilityStore();
  const isDark = theme === 'dark';
  const isHcHigh = contrastMode === 'high';

  const cardBg = isHcHigh ? 'bg-black border-2 border-yellow-400' : isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#E5E7EB]';
  const textColor = isHcHigh ? 'text-cyan-400' : isDark ? 'text-gray-200' : 'text-[#111827]';
  const subText = isHcHigh ? 'text-yellow-300' : isDark ? 'text-gray-400' : 'text-[#6B7280]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -3, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
      className={`rounded-2xl border shadow-sm p-5 transition-all ${cardBg}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl`} style={{ backgroundColor: `${color}15` }}>
          <div style={{ color }}>{icon}</div>
        </div>
        {change && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            changeType === 'up' ? 'bg-green-100 text-green-600' :
            changeType === 'down' ? 'bg-red-100 text-red-600' :
            'bg-gray-100 text-gray-500'
          }`}>
            {changeType === 'up' ? '↑' : changeType === 'down' ? '↓' : '→'} {change}
          </span>
        )}
      </div>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      <p className={`text-xs ${subText} mt-1`}>{label}</p>
    </motion.div>
  );
}

interface StoryStatProps {
  name: string;
  avatar: string;
  views: number;
  time: string;
  index: number;
}

function StoryStatRow({ name, avatar, views, time, index }: StoryStatProps) {
  const { theme, contrastMode } = useAccessibilityStore();
  const isDark = theme === 'dark';
  const isHcHigh = contrastMode === 'high';
  const textColor = isHcHigh ? 'text-cyan-400' : isDark ? 'text-gray-200' : 'text-[#111827]';
  const subText = isHcHigh ? 'text-yellow-300' : isDark ? 'text-gray-400' : 'text-[#6B7280]';
  const borderColor = isHcHigh ? 'border-yellow-400/20' : isDark ? 'border-[#334155]' : 'border-[#E5E7EB]';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center gap-3 py-3 border-b last:border-b-0 ${borderColor}`}
    >
      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-[#0EA5E9] via-[#8B5CF6] to-[#EC4899] p-[2px] flex-shrink-0">
        <div className={`w-full h-full rounded-full overflow-hidden border-2 ${isHcHigh ? 'border-black' : isDark ? 'border-[#1e293b]' : 'border-white'}`}>
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${textColor}`}>{name}</p>
        <p className={`text-[11px] ${subText}`}>{time}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <Eye className={`w-3.5 h-3.5 ${subText}`} />
        <span className={`text-sm font-semibold ${textColor}`}>{views}</span>
      </div>
    </motion.div>
  );
}

// Mini bar chart component
function MiniBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((val, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(val / max) * 100}%` }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
          className="flex-1 rounded-t-sm min-w-[6px]"
          style={{ backgroundColor: color, opacity: 0.3 + (val / max) * 0.7 }}
        />
      ))}
    </div>
  );
}

export interface CommunityStats {
  posts: number;
  followers: number;
  following: number;
  totalLikes: number;
  totalComments: number;
  weeklyActivity: number[];
  storyViews: number;
  impressions: number;
  shares: number;
  recentFollowersAvatars: string[];
  followersDetail: {
    name: string;
    avatar: string;
    time: string;
    views: number;
  }[];
}


export function StatsTab({ stats }: { stats: CommunityStats | null }) {
  const { theme, contrastMode, t } = useAccessibilityStore();
  const [timeframe, setTimeframe] = React.useState<'week' | 'month'>('week');
  
  const isDark = theme === 'dark';
  const isHcHigh = contrastMode === 'high';

  const cardBg = isHcHigh ? 'bg-black border-2 border-yellow-400' : isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#E5E7EB]';
  const textColor = isHcHigh ? 'text-cyan-400' : isDark ? 'text-gray-200' : 'text-[#111827]';
  const subText = isHcHigh ? 'text-yellow-300' : isDark ? 'text-gray-400' : 'text-[#6B7280]';

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className={`${subText} font-medium tracking-wide animate-pulse`}>{t('stats.analyzingData') || 'Analyse de vos données...'}</p>
      </div>
    );
  }

  // Handle timeframe multiplier (simple mock logic if month is selected)
  const multiplier = timeframe === 'month' ? 4.2 : 1;
  const currentActivity = timeframe === 'month' 
    ? new Array(7).fill(0).map(() => Math.floor(Math.random() * 50) + 10) // Month shows random activity for now
    : stats.weeklyActivity;

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${isHcHigh ? 'bg-yellow-400/20' : 'bg-gradient-to-br from-[#0EA5E9]/10 to-[#8B5CF6]/10 shadow-inner'}`}>
            <BarChart3 className={`w-6 h-6 ${isHcHigh ? 'text-yellow-400' : 'text-[#0EA5E9]'}`} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${textColor}`}>{t('stats.dashboardTitle') || 'Tableau de bord Analytique'}</h2>
            <p className={`text-xs ${subText} opacity-80 uppercase tracking-wide font-semibold`}>{t('stats.communityPerformance') || 'Performance communautaire'}</p>
          </div>
        </div>

        <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
          {[
            { id: 'week', label: t('stats.last7Days') || '7 derniers jours' },
            { id: 'month', label: t('stats.last30Days') || '30 derniers jours' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setTimeframe(f.id as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${timeframe === f.id 
                ? 'bg-[#0EA5E9] text-white shadow-lg' 
                : `hover:bg-gray-200 dark:hover:bg-white/5 ${subText}`}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Eye className="w-5 h-5" />} label={t('stats.postViews') || 'Vues de publications'} value={Math.floor(stats.storyViews * multiplier)} change="+18%" changeType="up" color="#0EA5E9" delay={0} />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label={t('stats.impressions') || 'Impressions'} value={Math.floor(stats.impressions * multiplier)} change="+24%" changeType="up" color="#EF4444" delay={0.05} />
        <StatCard icon={<MessageCircle className="w-5 h-5" />} label={t('stats.commentsCount') || 'Commentaires'} value={Math.floor(stats.totalComments * multiplier)} change="+12%" changeType="up" color="#8B5CF6" delay={0.1} />
        <StatCard icon={<Share2 className="w-5 h-5" />} label={t('stats.shares') || 'Partages'} value={Math.floor(stats.shares * multiplier)} change="-3%" changeType="down" color="#F97316" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`rounded-2xl border shadow-sm p-5 ${cardBg}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-bold text-sm ${textColor}`}>{t('stats.periodActivity') || 'Activité de la période'}</h3>
              <p className={`text-[11px] ${subText}`}>{t('stats.interactionsPerDay') || 'Interactions par jour'}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className={`w-4 h-4 ${isHcHigh ? 'text-yellow-400' : 'text-[#0EA5E9]'}`} />
              <span className={`text-xs font-semibold ${isHcHigh ? 'text-yellow-400' : 'text-[#0EA5E9]'}`}>
                {currentActivity.reduce((a, b) => a + b, 0)} {t('stats.total') || 'total'}
              </span>
            </div>
          </div>
          <MiniBarChart data={currentActivity} color={isHcHigh ? '#FACC15' : '#0EA5E9'} />
          <div className="flex justify-between mt-2">
            {[t('stats.days.mon')||'Lun', t('stats.days.tue')||'Mar', t('stats.days.wed')||'Mer', t('stats.days.thu')||'Jeu', t('stats.days.fri')||'Ven', t('stats.days.sat')||'Sam', t('stats.days.sun')||'Dim'].map((d) => (
              <span key={d} className={`text-[9px] font-medium ${subText} flex-1 text-center`}>{d}</span>
            ))}
          </div>
        </motion.div>

        {/* Engagement Rate */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={`rounded-2xl border shadow-sm p-5 ${cardBg}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-bold text-sm ${textColor}`}>{t('stats.engagementRate') || "Taux d'engagement"}</h3>
              <p className={`text-[11px] ${subText}`}>{t('stats.basedOnFollowers') || 'Basé sur vos abonnés'}</p>
            </div>
            <TrendingUp className={`w-4 h-4 ${isHcHigh ? 'text-yellow-400' : 'text-green-500'}`} />
          </div>

          <div className="flex items-end gap-4 mb-4">
            <span className={`text-4xl font-bold ${textColor}`}>
              {stats.followers > 0 ? ((stats.totalLikes + stats.totalComments) / stats.followers * 100).toFixed(1) : '0.0'}
              <span className="text-lg">%</span>
            </span>
            <span className="text-xs font-semibold text-green-500 bg-green-100 px-2 py-0.5 rounded-full mb-1.5">↑ +2.1%</span>
          </div>

          <div className="space-y-3">
            {[
              { label: t('stats.organicReach') || 'Portée organique', value: 72, color: '#0EA5E9' },
              { label: t('stats.clickRate') || 'Taux de clic', value: 45, color: '#8B5CF6' },
              { label: t('stats.storyRetention') || 'Rétention stories', value: 61, color: '#EC4899' },
            ].map((m, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <span className={`text-[11px] font-medium ${subText}`}>{m.label}</span>
                  <span className={`text-[11px] font-bold ${textColor}`}>{m.value}%</span>
                </div>
                <div className={`h-1.5 rounded-full ${isHcHigh ? 'bg-gray-800' : isDark ? 'bg-[#0f172a]' : 'bg-[#F3F4F6]'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${m.value}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: m.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Story Views Detail */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`rounded-2xl border shadow-sm p-5 ${cardBg}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye className={`w-4 h-4 ${isHcHigh ? 'text-yellow-400' : 'text-[#0EA5E9]'}`} />
            <h3 className={`font-bold text-sm ${textColor}`}>{t('stats.recentInteractions') || 'Interactions Récentes'}</h3>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isHcHigh ? 'bg-yellow-400/20 text-yellow-400' : 'bg-[#0EA5E9]/10 text-[#0EA5E9]'}`}>
            {stats.followersDetail.length} {t('stats.newMembers') || 'nouveaux membres'}
          </span>
        </div>
        <div>
          {stats.followersDetail.map((follower, i) => (
            <StoryStatRow key={i} name={follower.name} avatar={follower.avatar} views={follower.views} time={follower.time} index={i} />
          ))}
        </div>
      </motion.div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />} label={t('stats.newFollowers') || 'Nouveaux abonnés'} value={`+${Math.floor(stats.followers * 0.05) + 3}`} change={t('stats.thisWeek') || "cette semaine"} changeType="up" color="#10B981" delay={0.25} />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label={t('stats.globalEngagement') || 'Engagement global'} value={`${(stats.storyViews > 0 ? (stats.totalLikes/stats.storyViews*100).toFixed(1) : 0)}%`} change={t('stats.all') || "tous"} changeType="neutral" color="#6366F1" delay={0.3} />
        <StatCard icon={<Eye className="w-5 h-5" />} label={t('stats.profileVisited') || 'Profil visité'} value={Math.floor(stats.storyViews * 0.8)} change="+8%" changeType="up" color="#F59E0B" delay={0.35} />
      </div>
    </div>
  );
}
