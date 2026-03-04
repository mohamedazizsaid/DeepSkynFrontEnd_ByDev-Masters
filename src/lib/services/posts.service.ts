import apiClient from '../api-client';
import type { Post, CreatePostDto, Comment, CreateCommentDto, PaginatedResponse } from '../types';

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

  async getMyPosts(page = 1, limit = 20): Promise<PaginatedResponse<Post>> {
    const res = await apiClient.get<PaginatedResponse<Post>>('/posts/me', {
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

  // ─── Likes ───
  async toggleLike(postId: string): Promise<any> {
    const res = await apiClient.post(`/likes/${postId}/toggle`);
    return res.data;
  },

  async checkLike(postId: string): Promise<boolean> {
    const res = await apiClient.get<{ liked: boolean }>(`/likes/check/${postId}`);
    return res.data.liked;
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
};
