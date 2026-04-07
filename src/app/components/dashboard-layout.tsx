import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, Crown, Sparkles, X } from 'lucide-react';
import { Sidebar } from './layout/sidebar';
import { UserNavbar } from './layout/user-navbar';
import { DashboardPage } from './dashboard/dashboard-page';
import { AnalysisPage } from './dashboard/analysis-page';
import { EvolutionPage } from './dashboard/evolution-page';
import { RoutinePage } from './dashboard/routine-page';
import { ChatPage } from './dashboard/chat-page';
import { SubscriptionPage } from './dashboard/subscription-page';
import { ProfilePage } from './dashboard/profile-page';
import { SettingsPage } from '../pages/settings-page';
import { CommunityPage } from '../pages/community-page';
import { PublicProfilePage } from '../pages/public-profile-page';
import { WeatherPage } from './dashboard/weather-page';
import { NotificationPanel } from './notification-panel';
import { GuidedTour } from './guided-tour';
import { useNotificationStore } from '../../stores/notification.store';
import { useAuthStore } from '../../stores/auth.store';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import { useSearchParams } from 'react-router-dom';
import { subscriptionService } from '../../lib/services/subscription.service';
import type { Notification, Subscription } from '../../lib/types';
import { AdminOverviewPage } from './admin/admin-overview-page';
import { AdminUserManagementPage } from './admin/admin-user-management-page';
import { AdminSkinAnalysisMonitorPage } from './admin/admin-skin-analysis-monitor-page';
import { AdminSubscriptionManagementPage } from './admin/admin-subscription-management-page';
import { AdminSocialFeedModerationPage } from './admin/admin-social-feed-moderation-page';
import { AdminChurnRetentionPage } from './admin/admin-churn-retention-page';
import { AdminAiChatMonitorPage } from './admin/admin-ai-chat-monitor-page';
import { AdminProductCatalogPage } from './admin/admin-product-catalog-page';
import { AdminNotificationsCenterPage } from './admin/admin-notifications-center-page';

interface DashboardLayoutProps {
  onLogout: () => void;
}

export type DashboardPageType = 'dashboard' | 'analysis' | 'evolution' | 'routine' | 'chat' | 'subscription' | 'profile' | 'settings' | 'community' | 'meteo' | 'user-profile' | 'admin-overview' | 'admin-users' | 'admin-analysis' | 'admin-subscriptions' | 'admin-posts' | 'admin-churn' | 'admin-ai' | 'admin-products' | 'admin-notifications';

const ADMIN_PAGES: DashboardPageType[] = [
  'admin-overview',
  'admin-users',
  'admin-analysis',
  'admin-subscriptions',
  'admin-posts',
  'admin-churn',
  'admin-ai',
  'admin-products',
  'admin-notifications',
];

export function DashboardLayout({ onLogout }: DashboardLayoutProps) {
  const { user, roles } = useAuthStore();
  const isAdminUser = roles.some(role =>
    ['admin', 'ADMIN', 'realm-admin', 'super_admin', 'administrator'].includes(role)
  );
  const [currentPage, setCurrentPage] = useState<DashboardPageType>(isAdminUser ? 'admin-overview' : 'dashboard');
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showSubscriptionExpiredModal, setShowSubscriptionExpiredModal] = useState(false);
  const [lastPaidPlan, setLastPaidPlan] = useState<Subscription['plan'] | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { connect, disconnect, fetchUnreadCount, addNotification } = useNotificationStore();
  const { t } = useAccessibilityStore();

  useEffect(() => {
    const savedLastPaidPlan = localStorage.getItem('last_paid_subscription_plan');
    if (savedLastPaidPlan === 'premium' || savedLastPaidPlan === 'premium_yearly') {
      setLastPaidPlan(savedLastPaidPlan);
    }
  }, []);

  useEffect(() => {
    const page = searchParams.get('page');
    if (!page) return;

    const requestedPage = page as DashboardPageType;
    if (isAdminUser) {
      setCurrentPage(ADMIN_PAGES.includes(requestedPage) ? requestedPage : 'admin-overview');
    } else {
      setCurrentPage(requestedPage);
    }

    const next = new URLSearchParams(searchParams);
    next.delete('page');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, isAdminUser]);

  useEffect(() => {
    if (isAdminUser && !ADMIN_PAGES.includes(currentPage)) {
      setCurrentPage('admin-overview');
    }
  }, [isAdminUser, currentPage]);

  useEffect(() => {
    if (user?.sub) {
      connect(user.sub);
      fetchUnreadCount();
      return () => disconnect();
    }
  }, [user?.sub]);

  useEffect(() => {
    if (!user?.sub && !user?.id) return;

    let cancelled = false;

    const notifyExpired = (plan?: Subscription['plan'] | null) => {
      const nowIso = new Date().toISOString();
      const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const planName =
        plan === 'premium_yearly'
          ? t('subscriptionPage.planNames.premiumYearly')
          : plan === 'premium'
            ? t('subscriptionPage.planNames.premiumMonthly')
            : t('subscriptionPage.planNames.free');

      const notification: Notification = {
        id,
        userId: (user as any)?.sub || (user as any)?.id || (user as any)?.email || 'me',
        title: t('subscriptionPage.expiredModal.title'),
        message: `${t('subscriptionPage.expiredModal.message')} (${planName})`,
        type: 'warning',
        isRead: false,
        actionUrl: '/dashboard?page=subscription',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      addNotification(notification);
      setShowSubscriptionExpiredModal(true);
    };

    const checkSubscriptionExpiry = async () => {
      try {
        const sub = await subscriptionService.getMySubscription();
        if (cancelled || !sub) return;

        const plan = String((sub as any)?.plan || '').toLowerCase();
        if (plan === 'premium' || plan === 'premium_yearly') {
          setLastPaidPlan(plan as Subscription['plan']);
          localStorage.setItem('last_paid_subscription_plan', plan);
          return;
        }

        const endDate = (sub as any)?.endDate as string | null | undefined;
        const status = String((sub as any)?.status || '').toLowerCase();
        const isExpiredNow = endDate
          ? !Number.isNaN(new Date(endDate).getTime()) && new Date(endDate).getTime() <= Date.now()
          : false;
        const paidPlan = (lastPaidPlan || localStorage.getItem('last_paid_subscription_plan')) as Subscription['plan'] | null;

        const canTrigger = Boolean(paidPlan) && plan === 'free' && (isExpiredNow || status === 'expired');
        if (!canTrigger) return;

        const marker = `${sub.id}:${String(endDate || '')}`;
        const notifiedMarker = localStorage.getItem('subscription_expired_notified_marker');
        if (notifiedMarker === marker) return;

        localStorage.setItem('subscription_expired_notified_marker', marker);
        notifyExpired(paidPlan);
      } catch {
        // Ignore polling failures and retry later.
      }
    };

    void checkSubscriptionExpiry();
    const interval = window.setInterval(() => {
      void checkSubscriptionExpiry();
    }, 30000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void checkSubscriptionExpiry();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user?.sub, user?.id, addNotification, t, lastPaidPlan]);

  // Listen for voice navigation commands from accessibility assistant
  useEffect(() => {
    function handleA11yNavigate(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.page) {
        setCurrentPage(detail.page as DashboardPageType);
      }
    }
    window.addEventListener('a11y-navigate', handleA11yNavigate);
    return () => window.removeEventListener('a11y-navigate', handleA11yNavigate);
  }, []);

  const handleNavigate = (page: string) => setCurrentPage(page as DashboardPageType);

  const handleViewProfile = (userId: string) => {
    if (userId === user?.id || userId === user?.sub) {
      setCurrentPage('profile');
      return;
    }
    setViewedUserId(userId);
    setCurrentPage('user-profile');
  };

  const isAdmin = isAdminUser;

  const renderPage = () => {
    if (isAdmin) {
      switch (currentPage) {
        case 'admin-overview':
          return <AdminOverviewPage />;
        case 'admin-users':
          return <AdminUserManagementPage />;
        case 'admin-analysis':
          return <AdminSkinAnalysisMonitorPage />;
        case 'admin-subscriptions':
          return <AdminSubscriptionManagementPage />;
        case 'admin-posts':
          return <AdminSocialFeedModerationPage />;
        case 'admin-churn':
          return <AdminChurnRetentionPage />;
        case 'admin-ai':
          return <AdminAiChatMonitorPage />;
        case 'admin-products':
          return <AdminProductCatalogPage />;
        case 'admin-notifications':
          return <AdminNotificationsCenterPage />;
        default:
          return <AdminOverviewPage />;
      }
    }

    const commonProps = { onBack: () => setCurrentPage('dashboard') };
    const premiumProps = { onUpgrade: () => setCurrentPage('subscription') };
    const settingsNavProps = { onNavigateToSettings: () => setCurrentPage('settings') };
    const routineNavProps = { onNavigateToRoutine: () => setCurrentPage('routine') };

    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'analysis':
        return <AnalysisPage {...commonProps} {...premiumProps} {...settingsNavProps} {...routineNavProps} />;
      case 'evolution':
        return <EvolutionPage {...commonProps} />;
      case 'routine':
        return <RoutinePage {...commonProps} {...premiumProps} />;
      case 'chat':
        return <ChatPage {...commonProps} onUpgrade={() => setCurrentPage('subscription')} />;
      case 'subscription':
        return <SubscriptionPage {...commonProps} />;
      case 'profile':
        return <ProfilePage {...commonProps} onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsPage />;
      case 'community':
        return <CommunityPage onViewProfile={handleViewProfile} />;
      case 'user-profile':
        return <PublicProfilePage userId={viewedUserId || ''} onBack={() => setCurrentPage('community')} onProfileClick={handleViewProfile} onNavigate={handleNavigate} />;
      case 'meteo':
        return <WeatherPage {...commonProps} />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  const expiryModal = (
    <AnimatePresence>
      {showSubscriptionExpiredModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSubscriptionExpiredModal(false)}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            style={{ zIndex: 250 }}
          />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg px-4"
            style={{ zIndex: 251 }}
          >
            <div className="relative rounded-3xl bg-white border border-gray-100 shadow-2xl overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#F59E0B] via-[#EF4444] to-[#8B5CF6]" />

              <button
                onClick={() => setShowSubscriptionExpiredModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F59E0B]/20 to-[#EF4444]/20 border border-[#F59E0B]/30 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#EF4444]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{t('subscriptionPage.expiredModal.title')}</h3>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {t('subscriptionPage.expiredModal.message')}
                </div>

                {lastPaidPlan && (
                  <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-semibold">
                        <Crown className="w-4 h-4" />
                        {lastPaidPlan === 'premium_yearly'
                          ? t('subscriptionPage.planNames.premiumYearly')
                          : t('subscriptionPage.planNames.premiumMonthly')}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[#0EA5E9] font-medium">
                        <CalendarDays className="w-4 h-4" />
                        {t('subscriptionPage.expiredModal.renewHint')}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    onClick={() => setShowSubscriptionExpiredModal(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    {t('subscriptionPage.expiredModal.later')}
                  </button>
                  <button
                    onClick={() => {
                      setShowSubscriptionExpiredModal(false);
                      setCurrentPage('subscription');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0EA5E9] text-white hover:bg-[#0284C7]"
                  >
                    {t('subscriptionPage.expiredModal.renewNow')}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Admin Layout (Sidebar)
  if (isAdmin) {
    return (
      <div className="flex h-screen relative" style={{ zIndex: 1 }}>
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onLogout={onLogout}
          onToggleNotifications={() => setShowNotifications(!showNotifications)}
          isAdmin={isAdmin}
        />
        <div className="flex-1 overflow-y-auto">
          {renderPage()}
        </div>
        <NotificationPanel
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
        {expiryModal}
        {currentPage === 'dashboard' && <GuidedTour forceShow={showTour} onComplete={() => setShowTour(false)} />}
      </div>
    );
  }

  // User Layout (Navbar)
  return (
    <div className="min-h-screen relative" style={{ zIndex: 1 }}>
      <UserNavbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        onToggleNotifications={() => setShowNotifications(!showNotifications)}
        user={user}
      />
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[calc(100vh-64px)]">
        {renderPage()}
      </main>
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
      {expiryModal}
      {currentPage === 'dashboard' && <GuidedTour forceShow={showTour} onComplete={() => setShowTour(false)} />}
    </div>
  );
}
