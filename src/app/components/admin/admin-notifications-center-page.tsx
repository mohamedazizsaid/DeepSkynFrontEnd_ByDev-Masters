import React, { useEffect, useState } from 'react';
import { Card } from '../card';
import { Button } from '../button';
import { adminService } from '../../../lib/services/admin.service';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { getAdminLocale } from '../../../lib/i18n/admin-locale';

export function AdminNotificationsCenterPage() {
  const { language } = useAccessibilityStore();
  const adminLocale = getAdminLocale(language);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'info', actionUrl: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminService.getNotifications(1, 50);
      setNotifications(res.notifications || res || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message) return;
    setBroadcasting(true);
    try {
      await adminService.broadcastNotification({
        title: form.title,
        message: form.message,
        type: form.type || undefined,
        actionUrl: form.actionUrl || undefined,
      });
      setForm({ title: '', message: '', type: 'info', actionUrl: '' });
      await load();
    } finally {
      setBroadcasting(false);
    }
  };

  const handleCleanup = async (days: number) => {
    if (!confirm(adminLocale.notifications.confirmCleanup.replace('{days}', String(days)))) return;
    await adminService.cleanupNotifications(days);
    await load();
  };

  return (
    <main className="admin-panel p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-2xl" aria-labelledby="admin-notifications-title" aria-describedby="admin-notifications-live" aria-busy={loading || broadcasting}>
      <p id="admin-notifications-live" className="sr-only" role="status" aria-live="polite">
        {broadcasting ? adminLocale.notifications.sending : loading ? adminLocale.common.loading : `${notifications.length} ${adminLocale.notifications.recentNotifications}`}
      </p>
      <div>
        <h1 id="admin-notifications-title" className="text-3xl font-bold">{adminLocale.notifications.title}</h1>
        <p className="text-[#6B7280]">{adminLocale.notifications.subtitle}</p>
      </div>

      {/* Broadcast form */}
      <Card>
        <h3 className="font-bold mb-4">{adminLocale.notifications.broadcastTitle}</h3>
        <form onSubmit={handleBroadcast} className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="broadcast-title" className="block text-sm font-medium text-[#1B3A5C] mb-1">{adminLocale.notifications.notificationTitle}</label>
              <input
                id="broadcast-title"
              className="border border-[#E5E7EB] rounded-xl px-4 py-2"
              placeholder={adminLocale.notifications.notificationTitle}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            </div>
            <div>
              <label htmlFor="broadcast-type" className="block text-sm font-medium text-[#1B3A5C] mb-1">{adminLocale.notifications.type}</label>
              <select
                id="broadcast-type"
              className="border border-[#E5E7EB] rounded-xl px-4 py-2"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="info">{adminLocale.notifications.typeInfo}</option>
              <option value="warning">{adminLocale.notifications.typeWarning}</option>
              <option value="success">{adminLocale.notifications.typeSuccess}</option>
              <option value="error">{adminLocale.notifications.typeError}</option>
            </select>
            </div>
          </div>
          <label htmlFor="broadcast-message" className="block text-sm font-medium text-[#1B3A5C] mb-1">{adminLocale.notifications.message}</label>
          <textarea
            id="broadcast-message"
            className="border border-[#E5E7EB] rounded-xl px-4 py-2 w-full"
            placeholder={adminLocale.notifications.message}
            rows={3}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
          />
          <label htmlFor="broadcast-action-url" className="block text-sm font-medium text-[#1B3A5C] mb-1">{adminLocale.notifications.actionUrlOptional}</label>
          <input
            id="broadcast-action-url"
            className="border border-[#E5E7EB] rounded-xl px-4 py-2 w-full"
            placeholder={adminLocale.notifications.actionUrlOptional}
            value={form.actionUrl}
            onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
          />
          <Button type="submit" disabled={broadcasting}>
            {broadcasting ? adminLocale.notifications.sending : adminLocale.notifications.sendToAll}
          </Button>
        </form>
      </Card>

      {/* Cleanup actions */}
      <Card>
        <h3 className="font-bold mb-4">{adminLocale.notifications.cleanup}</h3>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => handleCleanup(7)}>
            {adminLocale.notifications.deleteOlderThan.replace('{days}', '7')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleCleanup(30)}>
            {adminLocale.notifications.deleteOlderThan.replace('{days}', '30')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleCleanup(90)}>
            {adminLocale.notifications.deleteOlderThan.replace('{days}', '90')}
          </Button>
        </div>
      </Card>

      {/* Notification history */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">{adminLocale.notifications.recentNotifications}</h3>
          <Button variant="outline" size="sm" onClick={load}>
            {adminLocale.common.refresh}
          </Button>
        </div>
        <div className="space-y-3" role="list" aria-label={adminLocale.notifications.recentNotifications}>
          {notifications.map((n: any) => (
            <div
              key={n.id}
              role="listitem"
              className="flex justify-between items-start border-b border-[#F3F4F6] pb-3 last:border-0"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      n.type === 'error'
                        ? 'bg-[#EF4444]'
                        : n.type === 'warning'
                        ? 'bg-[#F59E0B]'
                        : n.type === 'success'
                        ? 'bg-[#10B981]'
                        : 'bg-[#0EA5E9]'
                    }`}
                  />
                  <span className="font-semibold text-sm text-[#1B3A5C]">{n.title}</span>
                </div>
                <p className="text-sm text-[#6B7280] mt-1">{n.message}</p>
              </div>
              <span className="text-xs text-[#6B7280] shrink-0 ml-4">
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
          {!notifications.length && !loading && (
            <p className="text-[#6B7280] text-center py-6" role="status">{adminLocale.notifications.noNotifications}</p>
          )}
          {loading && <p className="text-[#6B7280] text-center py-6" role="status">{adminLocale.common.loading}</p>}
        </div>
      </Card>
    </main>
  );
}
