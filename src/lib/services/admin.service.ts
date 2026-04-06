import apiClient from '../api-client';

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

export const adminService = {
  getOverviewStats() {
    return Promise.all([
      apiClient.get('/skin-profiles/statistics'),
      apiClient.get('/analyses/statistics'),
      apiClient.get('/subscriptions/admin/statistics'),
      apiClient.get('/churn/stats'),
    ]).then(([skin, analyses, subscriptions, churn]) => ({
      skin: skin.data,
      analyses: analyses.data,
      subscriptions: subscriptions.data,
      churn: churn.data,
    }));
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
    return apiClient.get('/subscriptions/admin/statistics').then((res) => res.data);
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
    return apiClient.get('/churn/stats').then((res) => res.data);
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
    return apiClient.get('/chat/admin/statistics').then((res) => res.data);
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
};
