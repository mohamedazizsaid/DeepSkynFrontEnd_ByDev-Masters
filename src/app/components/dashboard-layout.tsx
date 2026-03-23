import React, { useState, useEffect } from 'react';
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
import { WeatherPage } from './dashboard/weather-page';
import { NotificationPanel } from './notification-panel';
import { useNotificationStore } from '../../stores/notification.store';
import { useAuthStore } from '../../stores/auth.store';

interface DashboardLayoutProps {
  onLogout: () => void;
}

export type DashboardPageType = 'dashboard' | 'analysis' | 'evolution' | 'routine' | 'chat' | 'subscription' | 'profile' | 'settings' | 'community' | 'meteo';

export function DashboardLayout({ onLogout }: DashboardLayoutProps) {
  const [currentPage, setCurrentPage] = useState<DashboardPageType>('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const { connect, disconnect, fetchUnreadCount } = useNotificationStore();
  const { user, roles } = useAuthStore();

  useEffect(() => {
    if (user?.sub) {
      connect(user.sub);
      fetchUnreadCount();
      return () => disconnect();
    }
  }, [user?.sub]);

  const handleNavigate = (page: string) => setCurrentPage(page as DashboardPageType);

  // Check if user is admin
  // We check for 'admin', 'ADMIN', 'realm-admin', or 'super_admin' to be safe
  const isAdmin = roles.some(role =>
    ['admin', 'ADMIN', 'realm-admin', 'super_admin', 'administrator'].includes(role)
  );

  const renderPage = () => {
    const commonProps = { onBack: () => setCurrentPage('dashboard') };

    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'analysis':
        return <AnalysisPage {...commonProps} />;
      case 'evolution':
        return <EvolutionPage {...commonProps} />;
      case 'routine':
        return <RoutinePage {...commonProps} />;
      case 'chat':
        return <ChatPage {...commonProps} onUpgrade={() => setCurrentPage('subscription')} />;
      case 'subscription':
        return <SubscriptionPage {...commonProps} />;
      case 'profile':
        return <ProfilePage {...commonProps} />;
      case 'settings':
        return <SettingsPage />;
      case 'community':
        return <CommunityPage />;
      case 'meteo':
        return <WeatherPage {...commonProps} />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  // Admin Layout (Sidebar)
  if (isAdmin) {
    return (
      <div className="flex h-screen bg-[#F9FAFB]">
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onLogout={onLogout}
          onToggleNotifications={() => setShowNotifications(!showNotifications)}
        />
        <div className="flex-1 overflow-y-auto">
          {renderPage()}
        </div>
        <NotificationPanel
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      </div>
    );
  }

  // User Layout (Navbar)
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
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
    </div>
  );
}
