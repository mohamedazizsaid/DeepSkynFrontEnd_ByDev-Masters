import apiClient from '../api-client';

function extractSettledData(result: PromiseSettledResult<any>) {
  if (result.status !== 'fulfilled') {
    return null;
  }
  return result.value?.data ?? null;
}

function normalizeSkinStats(raw: any) {
  if (!raw || typeof raw !== 'object') {
    return {
      totalProfiles: 0,
      skinTypeDistribution: {},
      averageHealthScore: 0,
      averageSkinAge: 0,
      topConcerns: [],
      topSensitivities: [],
    };
  }

  return {
    totalProfiles: Number(raw.totalProfiles || 0),
    skinTypeDistribution:
      raw.skinTypeDistribution && typeof raw.skinTypeDistribution === 'object'
        ? raw.skinTypeDistribution
        : {},
    averageHealthScore: Number(raw.averageHealthScore || 0),
    averageSkinAge: Number(raw.averageSkinAge || 0),
    topConcerns: Array.isArray(raw.topConcerns) ? raw.topConcerns : [],
    topSensitivities: Array.isArray(raw.topSensitivities)
      ? raw.topSensitivities
      : [],
  };
}

function normalizeAnalysisStats(raw: any) {
  if (!raw || typeof raw !== 'object') {
    return {
      totalAnalyses: 0,
      completedAnalyses: 0,
      failedAnalyses: 0,
      averageHealthScore: 0,
      averageProcessingTime: 0,
      topConditions: [],
    };
  }

  return {
    totalAnalyses: Number(raw.totalAnalyses || 0),
    completedAnalyses: Number(raw.completedAnalyses || 0),
    failedAnalyses: Number(raw.failedAnalyses || 0),
    averageHealthScore: Number(raw.averageHealthScore || 0),
    averageProcessingTime: Number(raw.averageProcessingTime || 0),
    topConditions: Array.isArray(raw.topConditions) ? raw.topConditions : [],
  };
}

function normalizeSubscriptionStats(raw: any) {
  if (!raw || typeof raw !== 'object') {
    return {
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      expiredSubscriptions: 0,
      monthlyRecurringRevenue: 0,
      subscriptionsByPlan: [],
    };
  }

  // New backend shape: { total, byPlan, byStatus, revenue }
  if ('total' in raw || 'byPlan' in raw || 'byStatus' in raw || 'revenue' in raw) {
    const byPlan = raw.byPlan && typeof raw.byPlan === 'object' ? raw.byPlan : {};
    const byStatus = raw.byStatus && typeof raw.byStatus === 'object' ? raw.byStatus : {};
    const revenue = raw.revenue && typeof raw.revenue === 'object' ? raw.revenue : {};

    return {
      totalSubscriptions: Number(raw.total || 0),
      activeSubscriptions: Number(byStatus.active || 0),
      expiredSubscriptions: Number(byStatus.expired || 0),
      monthlyRecurringRevenue: Number(revenue.total || 0),
      subscriptionsByPlan: Object.entries(byPlan).map(([plan, count]) => ({
        plan,
        count: Number(count || 0),
      })),
    };
  }

  // Legacy frontend-expected shape
  return {
    totalSubscriptions: Number(raw.totalSubscriptions || 0),
    activeSubscriptions: Number(raw.activeSubscriptions || 0),
    expiredSubscriptions: Number(raw.expiredSubscriptions || 0),
    monthlyRecurringRevenue: Number(raw.monthlyRecurringRevenue || 0),
    subscriptionsByPlan: Array.isArray(raw.subscriptionsByPlan) ? raw.subscriptionsByPlan : [],
  };
}

function normalizeChurnStats(raw: any) {
  if (!raw || typeof raw !== 'object') {
    return {
      churnRate: 0,
      atRiskCount: 0,
      totalAnalyzed: 0,
      avgProbability: 0,
      totalUsers: 0,
    };
  }

  // Backend current shape: totalUsers, analyzedUsers, lowRisk, mediumRisk, highRisk, criticalRisk
  if ('totalUsers' in raw || 'analyzedUsers' in raw || 'criticalRisk' in raw) {
    const totalUsers = Number(raw.totalUsers || 0);
    const analyzedUsers = Number(raw.analyzedUsers || 0);
    const highRisk = Number(raw.highRisk || 0);
    const criticalRisk = Number(raw.criticalRisk || 0);
    const atRiskCount = highRisk + criticalRisk;
    const churnRate = totalUsers > 0 ? atRiskCount / totalUsers : 0;

    return {
      totalUsers,
      totalAnalyzed: analyzedUsers,
      atRiskCount,
      churnRate,
      avgProbability: Number(raw.avgProbability || 0),
      lowRisk: Number(raw.lowRisk || 0),
      mediumRisk: Number(raw.mediumRisk || 0),
      highRisk,
      criticalRisk,
      emailsSentToday: Number(raw.emailsSentToday || 0),
      lastAnalysis: raw.lastAnalysis || null,
      modelReady: Boolean(raw.modelReady),
    };
  }

  // Legacy shape compatibility
  return {
    churnRate: Number(raw.churnRate || 0),
    atRiskCount: Number(raw.atRiskCount || 0),
    totalAnalyzed: Number(raw.totalAnalyzed || 0),
    avgProbability: Number(raw.avgProbability || 0),
    totalUsers: Number(raw.totalUsers || 0),
  };
}

function normalizeBiDashboard(raw: any) {
  if (!raw || typeof raw !== 'object') {
    return {
      kpis: {},
      funnel: {},
      engagement: { activitySeries: [], analysesLast30: 0, avgAnalysisProcessingTimeMs: 0 },
      churn: { riskDistribution: [], avgRiskScore: 0 },
      support: { skinAlertsLast30: 0, unreadAlerts: 0 },
      insights: { topConcerns: [] },
    };
  }

  const rawSeries =
    raw?.engagement?.activitySeries ||
    raw?.engagement?.dailySeries ||
    raw?.engagement?.activityTrend ||
    raw?.activitySeries ||
    [];

  const activitySeries = Array.isArray(rawSeries)
    ? rawSeries.map((point: any) => ({
        date: String(point?.date || point?.day || ''),
        analyses: Number(point?.analyses ?? point?.analysisCount ?? 0),
        chats: Number(point?.chats ?? point?.chatCount ?? point?.messages ?? 0),
        posts: Number(point?.posts ?? point?.postCount ?? 0),
        signups: Number(point?.signups ?? point?.users ?? point?.newUsers ?? 0),
      }))
    : [];

  return {
    ...raw,
    engagement: {
      ...(raw.engagement || {}),
      activitySeries,
      analysesLast30: Number(raw?.engagement?.analysesLast30 || 0),
      avgAnalysisProcessingTimeMs: Number(raw?.engagement?.avgAnalysisProcessingTimeMs || 0),
    },
    support: {
      ...(raw.support || {}),
      skinAlertsLast30: Number(raw?.support?.skinAlertsLast30 || 0),
      unreadAlerts: Number(raw?.support?.unreadAlerts || 0),
    },
  };
}

function normalizeChatStatistics(raw: any) {
  if (!raw || typeof raw !== 'object') {
    return {
      totalConversations: 0,
      totalMessages: 0,
      activeUsers: 0,
      avgMessagesPerChat: 0,
      dailyStats: [],
      topTopics: [],
      avgResponseTime: null,
      errorRate: null,
      totalTokens: null,
    };
  }

  const rawDaily = Array.isArray(raw.dailyStats)
    ? raw.dailyStats
    : Array.isArray(raw.dailyVolume)
    ? raw.dailyVolume
    : [];

  return {
    ...raw,
    totalConversations: Number(raw.totalConversations ?? raw.totalChats ?? 0),
    totalMessages: Number(raw.totalMessages ?? 0),
    activeUsers: Number(raw.activeUsers ?? raw.activeUsers30 ?? 0),
    avgMessagesPerChat: Number(
      raw.avgMessagesPerChat ?? raw.averageMessagesPerChat ?? 0,
    ),
    dailyStats: rawDaily.map((item: any) => ({
      date: String(item?.date || ''),
      count: Number(item?.count ?? item?.messages ?? 0),
    })),
    topTopics: Array.isArray(raw.topTopics) ? raw.topTopics : [],
    avgResponseTime:
      raw.avgResponseTime == null ? null : Number(raw.avgResponseTime),
    errorRate: raw.errorRate == null ? null : Number(raw.errorRate),
    totalTokens: raw.totalTokens == null ? null : Number(raw.totalTokens),
  };
}

export interface AdminUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: 'active' | 'inactive';
  subscriptionStatus?: string;
  skinType?: string;
}

export interface AdminAnalysesQuery {
  page?: number;
  limit?: number;
  fromDate?: string;
  toDate?: string;
  skinType?: string;
  minScore?: number;
  maxScore?: number;
  status?: string;
}

export interface AdminPostsQuery {
  page?: number;
  limit?: number;
  reported?: boolean;
  userId?: string;
}

export type AdminCouponDiscountType = 'percentage' | 'fixed';

export interface AdminCoupon {
  id: string;
  code: string;
  discountType: AdminCouponDiscountType;
  discountValue: number;
  currency: string | null;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  maxRedemptions: number | null;
  maxPerUser: number | null;
  allowedPlans: string[];
  stripePromotionCodeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCouponPayload {
  code: string;
  discountType: AdminCouponDiscountType;
  discountValue: number;
  currency?: string;
  isActive?: boolean;
  startsAt?: string;
  expiresAt?: string;
  maxRedemptions?: number;
  maxPerUser?: number;
  allowedPlans?: string[];
  stripePromotionCodeId?: string;
}

export interface AdminSubscriptionPlan {
  id: string;
  plan: string;
  name: string;
  price: number;
  currency: string;
  duration: number | null;
  features: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminCreateSubscriptionPlanPayload {
  plan?: string;
  code?: string;
  planCode?: string;
  name: string;
  price: number;
  currency?: string;
  duration?: number;
  features?: string[];
  isActive?: boolean;
}

function normalizeAdminSubscriptionPlan(raw: any, fallbackKey = ''): AdminSubscriptionPlan {
  const planCode = String(raw?.plan || raw?.code || raw?.planCode || fallbackKey || '').trim();
  const planId = String(raw?.id || planCode).trim();

  return {
    id: planId,
    plan: planCode,
    name: String(raw?.name || raw?.label || planCode || '').trim(),
    price: Number(raw?.price || 0),
    currency: String(raw?.currency || 'EUR').toUpperCase(),
    duration:
      raw?.duration == null || raw?.duration === ''
        ? null
        : Number(raw.duration),
    features: Array.isArray(raw?.features)
      ? raw.features.map((feature: unknown) => String(feature)).filter(Boolean)
      : [],
    isActive: raw?.isActive !== false,
    createdAt: raw?.createdAt,
    updatedAt: raw?.updatedAt,
  };
}

function normalizeAdminSubscriptionPlanList(raw: any): AdminSubscriptionPlan[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => normalizeAdminSubscriptionPlan(item));
  }

  if (raw && typeof raw === 'object' && Array.isArray(raw.plans)) {
    return raw.plans.map((item: unknown) => normalizeAdminSubscriptionPlan(item));
  }

  if (raw && typeof raw === 'object') {
    return Object.entries(raw).map(([key, value]) =>
      normalizeAdminSubscriptionPlan(value, key),
    );
  }

  return [];
}

export const adminService = {
  async getOverviewStats() {
    const [skin, analyses, subscriptions, churn] = await Promise.allSettled([
      apiClient.get('/skin-profiles/statistics'),
      apiClient.get('/analyses/statistics'),
      apiClient.get('/subscriptions/admin/statistics'),
      apiClient.get('/churn/stats'),
    ]);

    return {
      skin: normalizeSkinStats(extractSettledData(skin)),
      analyses: normalizeAnalysisStats(extractSettledData(analyses)),
      subscriptions: normalizeSubscriptionStats(extractSettledData(subscriptions)),
      churn: normalizeChurnStats(extractSettledData(churn)),
    };
  },

  getUsers(query: AdminUsersQuery = {}) {
    return apiClient.get('/users/admin/all', { params: query }).then((res) => res.data);
  },

  getUserById(id: string) {
    return apiClient.get(`/users/admin/${id}`).then((res) => res.data);
  },

  updateUserStatus(id: string, isActive: boolean) {
    return apiClient.patch(`/users/admin/${id}/status`, { isActive }).then((res) => res.data);
  },

  getAdminAnalyses(query: AdminAnalysesQuery = {}) {
    return apiClient.get('/analyses/admin/all', { params: query }).then((res) => res.data);
  },

  retryAnalysisAsAdmin(id: string) {
    return apiClient.post(`/analyses/admin/${id}/retry`).then((res) => res.data);
  },

  getSubscriptionsStats() {
    return apiClient
      .get('/subscriptions/admin/statistics')
      .then((res) => normalizeSubscriptionStats(res.data));
  },

  getAllSubscriptions(params: { plan?: string; status?: string; limit?: number; offset?: number } = {}) {
    return apiClient.get('/subscriptions/admin/all', { params }).then((res) => res.data);
  },

  checkExpiredSubscriptions() {
    return apiClient.post('/subscriptions/admin/check-expired').then((res) => res.data);
  },

  createManualSubscription(userId: string, payload: { plan: string; status?: string; amount?: number; currency?: string }) {
    return apiClient.post(`/subscriptions/admin/create/${userId}`, payload).then((res) => res.data);
  },

  getAdminPosts(query: AdminPostsQuery = {}) {
    return apiClient.get('/posts/admin/all', { params: query }).then((res) => res.data);
  },

  flagPost(id: string, payload: { flagged: boolean; remove?: boolean; reason?: string }) {
    return apiClient.patch(`/posts/admin/${id}/flag`, payload).then((res) => res.data);
  },

  deletePost(id: string) {
    return apiClient.delete(`/posts/${id}`).then((res) => res.data);
  },

  getChurnStats() {
    return apiClient.get('/churn/stats').then((res) => normalizeChurnStats(res.data));
  },

  runChurnAnalysis() {
    return apiClient.post('/churn/analyze').then((res) => res.data);
  },

  getAtRiskUsers(limit = 20) {
    return apiClient.get('/churn/at-risk', { params: { limit } }).then((res) => res.data);
  },

  sendRetentionEmails() {
    return apiClient.post('/churn/send-emails').then((res) => res.data);
  },

  getChatStatistics() {
    return apiClient
      .get('/chat/admin/statistics')
      .then((res) => normalizeChatStatistics(res.data));
  },

  getScrapedFiles() {
    return apiClient.get('/scraper/files').then((res) => res.data);
  },

  triggerScrape() {
    return apiClient.post('/scraper/scrape-dermaceutic').then((res) => res.data);
  },

  getScrapedData(fileName: string) {
    return apiClient.get(`/scraper/data/${encodeURIComponent(fileName)}`).then((res) => res.data);
  },

  broadcastNotification(payload: { title: string; message: string; type?: string; actionUrl?: string }) {
    return apiClient.post('/notifications/broadcast', payload).then((res) => res.data);
  },

  cleanupNotifications(days: number) {
    return apiClient.delete(`/notifications/cleanup/${days}`).then((res) => res.data);
  },

  getNotifications(page = 1, limit = 20, unreadOnly = false) {
    return apiClient
      .get('/notifications', { params: { page, limit, unreadOnly } })
      .then((res) => res.data);
  },

  getBiDashboard() {
    return apiClient
      .get('/admin-bi/dashboard')
      .then((res) => normalizeBiDashboard(res.data));
  },

  getCoupons() {
    return apiClient
      .get<AdminCoupon[]>('/coupons/admin')
      .then((res) => (Array.isArray(res.data) ? res.data : []));
  },

  createCoupon(payload: AdminCouponPayload) {
    return apiClient
      .post<AdminCoupon>('/coupons/admin', payload)
      .then((res) => res.data);
  },

  updateCoupon(id: string, payload: Partial<AdminCouponPayload>) {
    return apiClient
      .patch<AdminCoupon>(`/coupons/admin/${id}`, payload)
      .then((res) => res.data);
  },

  deleteCoupon(id: string) {
    return apiClient
      .delete<AdminCoupon>(`/coupons/admin/${id}`)
      .then((res) => res.data);
  },

  getSubscriptionPlans() {
    return apiClient
      .get('/subscriptions/admin/plans')
      .then((res) => normalizeAdminSubscriptionPlanList(res.data));
  },

  async createSubscriptionPlan(payload: AdminCreateSubscriptionPlanPayload) {
    const attempts: AdminCreateSubscriptionPlanPayload[] = [];
    attempts.push(payload);

    if (payload.plan && !payload.code) {
      attempts.push({ ...payload, code: payload.plan });
    }

    if (payload.plan && !payload.planCode) {
      attempts.push({ ...payload, planCode: payload.plan });
    }

    let lastError: unknown = null;

    for (let index = 0; index < attempts.length; index += 1) {
      try {
        const response = await apiClient.post('/subscriptions/admin/plans', attempts[index]);
        return normalizeAdminSubscriptionPlan(response.data);
      } catch (error) {
        lastError = error;
        const status =
          (error as { response?: { status?: number } })?.response?.status || 0;

        if (status !== 400 && status !== 422) {
          break;
        }
      }
    }

    throw lastError;
  },

  deleteSubscriptionPlan(id: string) {
    return apiClient
      .delete(`/subscriptions/admin/plans/${id}`)
      .then((res) => res.data);
  },
};
