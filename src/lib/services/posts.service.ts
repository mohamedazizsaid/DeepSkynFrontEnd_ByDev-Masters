import apiClient from '../api-client';
import type {
  Post,
  CreatePostDto,
  Comment,
  CreateCommentDto,
  PaginatedResponse,
  PostReaction,
} from '../types';

export const postsService = {
  // ─── Posts ───
  async create(data: CreatePostDto): Promise<Post> {
    const res = await apiClient.post<Post>('/posts', data);
    return res.data;
  },

  async getFeed(page = 1, limit = 20): Promise<PaginatedResponse<Post>> {
    const res = await apiClient.get<PaginatedResponse<Post>>('/posts', {
      params: { page, limit },
    });
    return res.data;
  },

  async getCommunityFeed(page = 1, limit = 20): Promise<PaginatedResponse<Post>> {
    const res = await apiClient.get<PaginatedResponse<Post>>('/posts', {
      params: { page, limit },
    });
    return res.data;
  },

  async getMyPosts(page = 1, limit = 20): Promise<PaginatedResponse<Post>> {
    const res = await apiClient.get<PaginatedResponse<Post>>('/posts/me', {
      params: { page, limit },
    });
    return res.data;
  },

  async findByUser(userId: string, page = 1, limit = 20): Promise<PaginatedResponse<Post>> {
    const res = await apiClient.get<PaginatedResponse<Post>>(`/posts/user/${userId}`, {
      params: { page, limit },
    });
    return res.data;
  },

  async getById(id: string): Promise<Post> {
    const res = await apiClient.get<Post>(`/posts/${id}`);
    return res.data;
  },

  async update(id: string, data: Partial<CreatePostDto>): Promise<Post> {
    const res = await apiClient.patch<Post>(`/posts/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/posts/${id}`);
  },

  async toggleArchive(id: string): Promise<Post> {
    const res = await apiClient.patch<Post>(`/posts/${id}/archive`);
    return res.data;
  },

  async getArchivedPosts(page = 1, limit = 20): Promise<PaginatedResponse<Post>> {
    const res = await apiClient.get<PaginatedResponse<Post>>('/posts/archives', {
      params: { page, limit },
    });
    return res.data;
  },

  // ─── Likes ───
  async toggleLike(postId: string, type: string = 'like'): Promise<any> {
    const res = await apiClient.post(`/likes/${postId}/toggle?type=${type}`);
    return res.data;
  },

  async checkLike(postId: string): Promise<boolean> {
    const res = await apiClient.get<{ liked: boolean }>(`/likes/check/${postId}`);
    return res.data.liked;
  },

  async getPostReactions(
    postId: string,
    page = 1,
    limit = 50,
  ): Promise<PaginatedResponse<PostReaction>> {
    const res = await apiClient.get<any>(
      `/likes/post/${postId}`,
      {
        params: { page, limit },
      },
    );

    const payload = res.data ?? {};
    const rawItems: any[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload.likes)
          ? payload.likes
          : Array.isArray(payload.reactions)
            ? payload.reactions
            : Array.isArray(payload.items)
              ? payload.items
              : [];

    const data: PostReaction[] = rawItems.map((item: any, index: number) => ({
      id: item.id || item.likeId || `${postId}-${item.userId || index}-${item.type || 'like'}`,
      postId: item.postId || postId,
      userId: item.userId || item.user?.id || item.user?.userId || '',
      type: item.type || item.reactionType || 'like',
      createdAt: item.createdAt || item.created_at || new Date().toISOString(),
      user: item.user
        ? {
            id: item.user.id || item.user.userId || item.userId || '',
            name:
              item.user.name ||
              item.user.username ||
              item.user.displayName ||
              item.user.fullName ||
              null,
            avatar:
              item.user.avatar ||
              item.user.profilePicture ||
              item.user.photoUrl ||
              null,
          }
        : undefined,
    }));

    const safeLimit = Number(payload.limit ?? limit) || limit;
    const safeTotal = Number(payload.total ?? payload.count ?? data.length) || data.length;
    const safePage = Number(payload.page ?? page) || page;
    const safeTotalPages =
      Number(payload.totalPages ?? payload.total_pages) ||
      Math.max(1, Math.ceil(safeTotal / Math.max(1, safeLimit)));

    return {
      data,
      total: safeTotal,
      page: safePage,
      limit: safeLimit,
      totalPages: safeTotalPages,
    };
  },

  // ─── Comments ───
  async addComment(data: CreateCommentDto): Promise<Comment> {
    const res = await apiClient.post<Comment>('/comments', data);
    return res.data;
  },

  async getComments(postId: string, page = 1, limit = 20): Promise<PaginatedResponse<Comment>> {
    const res = await apiClient.get<PaginatedResponse<Comment>>(`/comments/post/${postId}`, {
      params: { page, limit },
    });
    return res.data;
  },

  async updateComment(id: string, comment: string): Promise<Comment> {
    const res = await apiClient.patch<Comment>(`/comments/${id}`, { comment });
    return res.data;
  },

  async deleteComment(id: string): Promise<void> {
    await apiClient.delete(`/comments/${id}`);
  },

  async toggleCommentLike(commentId: string): Promise<{ liked: boolean }> {
    const res = await apiClient.post<{ liked: boolean }>(`/comments/${commentId}/like`);
    return res.data;
  },

  async getCommentReplies(commentId: string): Promise<Comment[]> {
    const res = await apiClient.get<Comment[]>(`/comments/${commentId}/replies`);
    return res.data;
  },

  // ─── Stories ───
  async getActiveStories(): Promise<any[]> {
    const res = await apiClient.get<any[]>('/stories');
    return res.data;
  },

  async getUserStories(userId: string): Promise<any[]> {
    const res = await apiClient.get<any[]>(`/stories/user/${userId}`);
    return res.data;
  },

  async createStory(mediaUrl: string, userId?: string, musicUrl?: string, musicTitle?: string): Promise<any> {
    const res = await apiClient.post<any>('/stories', { mediaUrl, userId, musicUrl, musicTitle });
    return res.data;
  },

  // ─── Story Likes ───
  async toggleStoryLike(storyId: string): Promise<{ liked: boolean; likesCount: number }> {
    const res = await apiClient.post<{ liked: boolean; likesCount: number }>(`/stories/${storyId}/like`);
    return res.data;
  },

  // ─── Story Comments ───
  async getStoryComments(storyId: string): Promise<any[]> {
    const res = await apiClient.get<any[]>(`/stories/${storyId}/comments`);
    return res.data;
  },

  async addStoryComment(storyId: string, comment: string): Promise<any> {
    const res = await apiClient.post<any>(`/stories/${storyId}/comments`, { comment });
    return res.data;
  },

  async deleteStoryComment(commentId: string): Promise<void> {
    await apiClient.delete(`/stories/comments/${commentId}`);
  },

  // ─── Free Music for Stories ───
  async getFreeMusicForStories(): Promise<any[]> {
    const res = await apiClient.get<any[]>('/stories/music/free');
    return res.data;
  },

  async searchFreeMusic(query: string = 'royalty free'): Promise<any[]> {
    const res = await apiClient.get<any[]>('/stories/music/search', {
      params: { query },
    });
    return res.data;
  },

  // ─── Story Highlights ───
  async getUserHighlights(userId: string): Promise<any[]> {
    const res = await apiClient.get<any[]>(`/stories/highlights/${userId}`);
    return res.data;
  },

  async saveStoryAsHighlight(storyId: string, highlightTitle?: string): Promise<any> {
    const res = await apiClient.post<any>(`/stories/${storyId}/highlight`, {
      highlightTitle,
    });
    return res.data;
  },

  async removeStoryFromHighlight(storyId: string): Promise<void> {
    await apiClient.delete(`/stories/${storyId}/highlight`);
  },
};


