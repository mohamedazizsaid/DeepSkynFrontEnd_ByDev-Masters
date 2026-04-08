import React, { useEffect, useState } from 'react';
import { Card } from '../card';
import { Button } from '../button';
import { adminService } from '../../../lib/services/admin.service';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { getAdminLocale } from '../../../lib/i18n/admin-locale';

export function AdminSocialFeedModerationPage() {
  const { language } = useAccessibilityStore();
  const adminLocale = getAdminLocale(language);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'reported'>('all');

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAdminPosts({
        limit: 50,
        reported: filter === 'reported' ? true : undefined,
      });
      setPosts(res.posts || res || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFlag = async (id: string, flagged: boolean) => {
    await adminService.flagPost(id, { flagged, reason: flagged ? adminLocale.moderation.flagged : undefined });
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(adminLocale.moderation.confirmDelete)) return;
    await adminService.deletePost(id);
    await load();
  };

  return (
    <main className="admin-panel p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-2xl" aria-labelledby="admin-moderation-title" aria-describedby="admin-moderation-live" aria-busy={loading}>
      <p id="admin-moderation-live" className="sr-only" role="status" aria-live="polite">
        {loading ? adminLocale.moderation.loadingPosts : `${posts.length} ${adminLocale.moderation.allPosts}`}
      </p>
      <div>
        <h1 id="admin-moderation-title" className="text-3xl font-bold">{adminLocale.moderation.title}</h1>
        <p className="text-[#6B7280]">{adminLocale.moderation.subtitle}</p>
      </div>

      <Card>
        <div className="flex gap-3 items-end">
          <div>
            <label htmlFor="moderation-filter" className="block text-sm font-medium text-[#1B3A5C] mb-1">{adminLocale.moderation.postFilter}</label>
          <select
            id="moderation-filter"
            className="border border-[#E5E7EB] rounded-xl px-4 py-2"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">{adminLocale.moderation.allPosts}</option>
            <option value="reported">{adminLocale.moderation.reportedOnly}</option>
          </select>
          </div>
          <Button onClick={load} aria-label={adminLocale.common.refresh}>{adminLocale.common.refresh}</Button>
        </div>
      </Card>

      <div className="space-y-4" role="list" aria-label={adminLocale.moderation.allPosts}>
        {posts.map((post) => {
          const isFlagged = post.flagged || post.title?.startsWith('[FLAGGED]');

          return (
            <Card key={post.id} role="listitem">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[#1B3A5C]">{post.author?.name || post.author?.email || adminLocale.moderation.unknownAuthor}</span>
                    <span className="text-xs text-[#6B7280]">{new Date(post.createdAt).toLocaleString()}</span>
                    {isFlagged && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-[#EF4444]/10 text-[#EF4444]">{adminLocale.moderation.flagged}</span>
                    )}
                  </div>
                  <p className="font-medium mb-1">{post.title}</p>
                  <p className="text-sm text-[#6B7280] line-clamp-3">{post.content}</p>
                  <div className="flex gap-4 mt-2 text-xs text-[#6B7280]">
                    <span>{post._count?.likes ?? post.likes ?? 0} {adminLocale.moderation.likes}</span>
                    <span>{post._count?.comments ?? post.comments ?? 0} {adminLocale.moderation.comments}</span>
                  </div>
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt={adminLocale.moderation.attachmentAlt.replace('{author}', post.author?.name || post.author?.email || adminLocale.common.unknown)}
                      className="mt-2 rounded-xl max-h-40 object-cover"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {isFlagged ? (
                    <Button size="sm" variant="outline" onClick={() => handleFlag(post.id, false)} aria-label={`${adminLocale.moderation.unflag} ${post.title || post.id}`}>
                      {adminLocale.moderation.unflag}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleFlag(post.id, true)} aria-label={`${adminLocale.moderation.flag} ${post.title || post.id}`}>
                      {adminLocale.moderation.flag}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-[#EF4444]" onClick={() => handleDelete(post.id)} aria-label={`${adminLocale.moderation.delete} ${post.title || post.id}`}>
                    {adminLocale.moderation.delete}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {!posts.length && !loading && (
          <Card>
            <p className="text-[#6B7280] text-center py-6" role="status">{adminLocale.moderation.noPosts}</p>
          </Card>
        )}
        {loading && (
          <Card>
            <p className="text-[#6B7280] text-center py-6" role="status">{adminLocale.moderation.loadingPosts}</p>
          </Card>
        )}
      </div>
    </main>
  );
}
