import React, { useEffect, useRef, useState } from 'react';
import { Card } from '../card';
import { Button } from '../button';
import { adminService } from '../../../lib/services/admin.service';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { getAdminLocale } from '../../../lib/i18n/admin-locale';

export function AdminUserManagementPage() {
  const { language } = useAccessibilityStore();
  const adminLocale = getAdminLocale(language);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const lastRequestId = useRef(0);

  const loadUsers = async () => {
    const requestId = ++lastRequestId.current;
    setLoading(true);
    try {
      const res = await adminService.getUsers({ search, status: (status as any) || undefined, limit: 50 });
      // Ignore outdated responses when users type quickly.
      if (requestId === lastRequestId.current) {
        setUsers(res.users || []);
      }
    } finally {
      if (requestId === lastRequestId.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 350);

    return () => clearTimeout(timer);
  }, [search, status]);

  const toggleSuspend = async (user: any) => {
    await adminService.updateUserStatus(user.id, !user.isActive);
    await loadUsers();
  };

  const viewProfile = async (id: string) => {
    const details = await adminService.getUserById(id);
    alert(`${adminLocale.users.profileSummary}: ${details.email}\n${adminLocale.users.profileRole}: ${details.role}\n${adminLocale.users.profileAnalyses}: ${details._count?.analyses ?? 0}`);
  };

  return (
    <main className="admin-panel p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-2xl" aria-labelledby="admin-users-title" aria-describedby="admin-users-live" aria-busy={loading}>
      <p id="admin-users-live" className="sr-only" role="status" aria-live="polite">
        {loading ? adminLocale.users.loadingUsers : `${users.length} ${adminLocale.users.usersFound}`}
      </p>
      <div>
        <h1 id="admin-users-title" className="text-3xl font-bold">{adminLocale.users.title}</h1>
        <p className="text-[#6B7280]">{adminLocale.users.subtitle}</p>
      </div>

      <Card>
        <div className="flex gap-3 flex-wrap items-end">
          <div className="min-w-[280px] flex-1">
            <label htmlFor="admin-user-search" className="block text-sm font-medium text-[#1B3A5C] mb-1">{adminLocale.users.searchUsers}</label>
            <input
              id="admin-user-search"
              className="border border-[#E5E7EB] rounded-xl px-4 py-2 w-full"
              placeholder={adminLocale.users.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-describedby="admin-users-result-count"
            />
          </div>
          <div>
            <label htmlFor="admin-user-status" className="block text-sm font-medium text-[#1B3A5C] mb-1">{adminLocale.users.status}</label>
            <select id="admin-user-status" className="border border-[#E5E7EB] rounded-xl px-4 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">{adminLocale.users.allStatuses}</option>
              <option value="active">{adminLocale.common.active}</option>
              <option value="inactive">{adminLocale.common.suspended}</option>
            </select>
          </div>
          <Button onClick={loadUsers} variant="outline" aria-label={adminLocale.common.refresh}>{adminLocale.common.refresh}</Button>
        </div>
        <p id="admin-users-result-count" className="text-sm text-[#6B7280] mt-3" aria-live="polite">
          {loading ? adminLocale.users.loadingUsers : `${users.length} ${adminLocale.users.usersFound}`}
        </p>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <caption className="sr-only">{adminLocale.users.title}</caption>
            <thead>
              <tr className="text-left border-b border-[#E5E7EB] text-[#6B7280]">
                <th scope="col" className="py-3 pr-3">{adminLocale.users.name}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.users.email}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.users.subscription}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.users.joinDate}</th>
                <th scope="col" className="py-3 pr-3">{adminLocale.users.status}</th>
                <th scope="col" className="py-3">{adminLocale.users.actions}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-[#F3F4F6]">
                  <th scope="row" className="py-3 pr-3 font-medium">{user.name || '-'}</th>
                  <td className="py-3 pr-3 break-all">{user.email}</td>
                  <td className="py-3 pr-3">{user.subscription?.plan || adminLocale.common.freePlan}</td>
                  <td className="py-3 pr-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 pr-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${user.isActive ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>
                      {user.isActive ? adminLocale.common.active : adminLocale.common.suspended}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => viewProfile(user.id)} aria-label={`${adminLocale.users.view} ${user.email}`}>{adminLocale.users.view}</Button>
                      <Button size="sm" variant="outline" onClick={() => toggleSuspend(user)} aria-label={`${user.isActive ? adminLocale.users.suspend : adminLocale.users.activate} ${user.email}`}>
                        {user.isActive ? adminLocale.users.suspend : adminLocale.users.activate}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users.length && !loading && <p className="text-[#6B7280] py-6" role="status">{adminLocale.users.noUsers}</p>}
          {loading && <p className="text-[#6B7280] py-6" role="status">{adminLocale.users.loadingUsers}</p>}
        </div>
      </Card>
    </main>
  );
}
