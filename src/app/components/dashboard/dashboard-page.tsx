import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Scan, Calendar, MessageCircle, TrendingUp, TrendingDown, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../button';
import { Card } from '../card';
import { RadialBarChart, RadialBar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAuthStore } from '../../../stores/auth.store';
import { analysisService } from '../../../lib/services/analysis.service';
import { skinProfileService } from '../../../lib/services/skin-profile.service';
import { calculateScoreChange, formatChartDate, formatAnalysisDate } from '../../../lib/analysis-helpers';
import type { SkinProfile, Analysis, AnalysisStats } from '../../../lib/types';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user } = useAuthStore();
  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<Analysis | null>(null);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profile, analysis, statsRes] = await Promise.allSettled([
          skinProfileService.getMyProfile(),
          analysisService.getLatest(),
          analysisService.getStats(),
        ]);
        if (profile.status === 'fulfilled') setSkinProfile(profile.value);
        if (analysis.status === 'fulfilled') setLatestAnalysis(analysis.value);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      } catch { /* use fallback */ } finally { setDataLoading(false); }
    };
    loadData();
  }, []);

  const skinHealthScore = latestAnalysis?.healthScore ?? skinProfile?.healthScore ?? 0;
  const skinAge = latestAnalysis?.skinAge ?? skinProfile?.skinAge ?? null;
  const userName = user?.given_name || user?.name?.split(' ')[0] || 'User';
  const scoreChange = calculateScoreChange(stats);

  // Calculate real age from user's date of birth (fallback to 30)
  const realAge = (() => {
    const dob = (user as any)?.dateOfBirth || (skinProfile as any)?.dateOfBirth;
    if (!dob) return 30;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  })();
  
  const gaugeData = [
    { name: 'Score', value: skinHealthScore, fill: '#0EA5E9' }
  ];

  // Real evolution data from stats, fallback to empty
  const evolutionData = useMemo(() => {
    if (!stats?.healthScoreHistory?.length) return [];
    // Show last 6 data points for the mini chart
    const recent = stats.healthScoreHistory.slice(-6);
    return recent.map((entry) => ({
      date: formatChartDate(entry.date),
      score: entry.score,
    }));
  }, [stats]);

  // Read detailed scores from the typed Gemini results
  const detailed = latestAnalysis?.results?.detailedAnalysis;
  const skinMetrics = [
    { label: 'Hydration', value: detailed?.hydration?.score ?? 0, color: '#06B6D4' },
    { label: 'Texture', value: detailed?.texture?.score ?? 0, color: '#0EA5E9' },
    { label: 'Pigmentation', value: detailed?.pigmentation?.score ?? 0, color: '#F9A8D4' },
    { label: 'Wrinkles', value: detailed?.wrinkles?.score ?? 0, color: '#FBBF24' },
  ];

  const quickActions = [
    {
      icon: <Scan className="w-6 h-6" />,
      title: 'New Analysis',
      description: 'Upload new photos',
      color: '#0EA5E9',
      onClick: () => onNavigate('analysis')
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'View Routine',
      description: 'Check daily tasks',
      color: '#F9A8D4',
      onClick: () => onNavigate('routine')
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: 'AI Coach',
      description: 'Get advice',
      color: '#FBBF24',
      onClick: () => onNavigate('chat')
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Welcome back, {userName}!</h1>
        <p className="text-[#6B7280]">Here's your skin health overview</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Skin Health Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full">
            <div className="text-center">
              <h3 className="text-lg font-bold mb-4">Skin Health Score</h3>
              <div className="relative w-48 h-48 mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="70%"
                    outerRadius="100%"
                    data={gaugeData}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar
                      dataKey="value"
                      cornerRadius={10}
                      fill="#0EA5E9"
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <div className="text-5xl font-bold text-[#0EA5E9]">{skinHealthScore}</div>
                  <div className="text-sm text-[#6B7280]">out of 100</div>
                </div>
              </div>
              <div className="mt-4">
                {scoreChange !== 0 ? (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                    scoreChange > 0 ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'
                  }`}>
                    {scoreChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {scoreChange > 0 ? '+' : ''}{scoreChange} this month
                  </span>
                ) : stats && stats.totalAnalyses > 0 ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#6B7280]/10 text-[#6B7280] rounded-full text-sm font-medium">
                    Stable
                  </span>
                ) : null}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Age Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <h3 className="text-lg font-bold mb-6">Age Comparison</h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#6B7280]">Real Age</span>
                  <span className="text-2xl font-bold">{realAge}</span>
                </div>
                <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div className="h-full bg-[#6B7280] rounded-full" style={{ width: `${Math.min(realAge, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#6B7280]">Skin Age</span>
                  <span className="text-2xl font-bold text-[#0EA5E9]">{skinAge ?? '—'}</span>
                </div>
                <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] rounded-full" style={{ width: `${Math.min(skinAge ?? 0, 100)}%` }} />
                </div>
              </div>
              {skinAge !== null ? (
                <div className={`${realAge > skinAge ? 'bg-[#10B981]/10' : 'bg-[#F59E0B]/10'} rounded-xl p-4 text-center`}>
                  <p className={`text-sm font-medium ${realAge > skinAge ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
                    {realAge > skinAge
                      ? `Your skin looks ${realAge - skinAge} years younger! 🎉`
                      : realAge === skinAge
                        ? 'Your skin age matches your real age!'
                        : `Your skin looks ${skinAge - realAge} years older. Let's improve it! 💪`}
                  </p>
                </div>
              ) : (
                <div className="bg-[#F3F4F6] rounded-xl p-4 text-center">
                  <p className="text-sm text-[#6B7280]">Complete an analysis to see your skin age comparison.</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Quick Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <h3 className="text-lg font-bold mb-6">Skin Metrics</h3>
            <div className="space-y-4">
              {skinMetrics.map((metric, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#6B7280]">{metric.label}</span>
                    <span className="text-sm font-bold" style={{ color: metric.color }}>
                      {metric.value}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: metric.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Evolution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Skin Health Evolution</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('evolution')}>
              View Details
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="h-64">
            {evolutionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E5E7EB', 
                    borderRadius: '12px' 
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#0EA5E9" 
                  strokeWidth={3} 
                  dot={{ fill: '#0EA5E9', r: 6 }}
                  activeDot={{ r: 8 }}
                  fill="url(#scoreGradient)"
                />
              </LineChart>
            </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#6B7280] text-sm">
                Complete multiple analyses to see your evolution chart.
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <h3 className="text-lg font-bold mb-6">Quick Actions</h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <motion.button
                  key={index}
                  onClick={action.onClick}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[#E5E7EB] hover:border-[#0EA5E9] hover:bg-[#F9FAFB] transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: action.color }}
                  >
                    {action.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold">{action.title}</div>
                    <div className="text-sm text-[#6B7280]">{action.description}</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#9CA3AF]" />
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <h3 className="text-lg font-bold mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {latestAnalysis ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center flex-shrink-0">
                      <Scan className="w-5 h-5 text-[#0EA5E9]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        Skin analysis {latestAnalysis.status === 'completed' ? 'completed' : latestAnalysis.status === 'processing' ? 'in progress' : latestAnalysis.status}
                      </p>
                      <p className="text-sm text-[#6B7280]">{formatAnalysisDate(latestAnalysis.createdAt)}</p>
                      {latestAnalysis.status === 'completed' && (
                        <p className="text-sm text-[#0EA5E9] font-medium mt-1">Score: {latestAnalysis.healthScore}/100</p>
                      )}
                    </div>
                  </div>
                  {stats && stats.totalAnalyses > 1 && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FBBF24]/10 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-[#FBBF24]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{stats.totalAnalyses} total analyses completed</p>
                        <p className="text-sm text-[#6B7280]">Average score: {stats.averageHealthScore}/100</p>
                      </div>
                    </div>
                  )}
                  {latestAnalysis.conditions?.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F9A8D4]/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-[#F9A8D4]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Detected conditions</p>
                        <p className="text-sm text-[#6B7280]">{latestAnalysis.conditions.slice(0, 3).join(', ')}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 text-[#6B7280]">
                  <p className="text-sm">No recent activity. Start a skin analysis to see your results here.</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
