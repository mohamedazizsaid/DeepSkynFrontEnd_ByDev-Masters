import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Scan, 
  TrendingUp, 
  Calendar, 
  MessageCircle, 
  CreditCard, 
  User, 
  Settings,
  Sparkles,
  LogOut,
  Users,
  Bell,
  ShieldCheck,
  Activity,
  Bot,
  Package,
  Megaphone
} from 'lucide-react';
import { useNotificationStore } from '../../../stores/notification.store';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { getAdminLocale } from '../../../lib/i18n/admin-locale';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  onToggleNotifications?: () => void;
  isAdmin?: boolean;
}

export function Sidebar({ currentPage, onNavigate, onLogout, onToggleNotifications, isAdmin }: SidebarProps) {
  const { unreadCount } = useNotificationStore();
  const { language } = useAccessibilityStore();
  const adminLocale = getAdminLocale(language);

  const userMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'analysis', label: 'Analysis', icon: <Scan className="w-5 h-5" /> },
    { id: 'evolution', label: 'Evolution', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'routine', label: 'Routine', icon: <Calendar className="w-5 h-5" /> },
    { id: 'chat', label: 'AI Coach', icon: <MessageCircle className="w-5 h-5" /> },
    { id: 'community', label: 'Community', icon: <Users className="w-5 h-5" /> },
    { id: 'subscription', label: 'Subscription', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> }
  ];

  const adminMenuItems = [
    { id: 'admin-overview', label: adminLocale.sidebar.overview, icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'admin-users', label: adminLocale.sidebar.users, icon: <Users className="w-5 h-5" /> },
    { id: 'admin-analysis', label: adminLocale.sidebar.skinAnalysis, icon: <Scan className="w-5 h-5" /> },
    { id: 'admin-subscriptions', label: adminLocale.sidebar.subscriptions, icon: <CreditCard className="w-5 h-5" /> },
    { id: 'admin-posts', label: adminLocale.sidebar.moderation, icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'admin-churn', label: adminLocale.sidebar.churn, icon: <Activity className="w-5 h-5" /> },
    { id: 'admin-ai', label: adminLocale.sidebar.aiChat, icon: <Bot className="w-5 h-5" /> },
    { id: 'admin-products', label: adminLocale.sidebar.catalog, icon: <Package className="w-5 h-5" /> },
    { id: 'admin-notifications', label: adminLocale.sidebar.notifications, icon: <Megaphone className="w-5 h-5" /> }
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <div className="w-64 h-screen bg-white border-r border-[#E5E7EB] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent">
            DeepSkyn
          </span>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = currentPage === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white shadow-md'
                  : 'text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#0EA5E9]'
              }`}
              whileHover={{ x: isActive ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Notification Bell */}
      {onToggleNotifications && (
        <div className="px-4 py-2 border-t border-[#E5E7EB]">
          <button
            onClick={onToggleNotifications}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#0EA5E9] rounded-xl transition-all duration-200 relative"
          >
            <Bell className="w-5 h-5" />
            <span className="font-medium">{isAdmin ? adminLocale.sidebar.notifications : 'Notifications'}</span>
            {unreadCount > 0 && (
              <span className="ml-auto bg-[#EF4444] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Logout */}
      {onLogout && (
        <div className="p-4 border-t border-[#E5E7EB]">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#EF4444] rounded-xl transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{isAdmin ? adminLocale.sidebar.logout : 'Logout'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
