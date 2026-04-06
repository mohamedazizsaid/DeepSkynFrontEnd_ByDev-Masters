import apiClient from '../api-client';
import type { CommunityProfile, PaginatedResponse } from '../types';

export interface UpdateUserDto {
    avatar?: string;
    dateOfBirth?: string;
    gender?: string;
    preferredLanguage?: string;
    settings?: any;
}

export interface User {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    avatar3D?: string;
    dateOfBirth?: string;
    gender?: string;
    preferredLanguage?: string;
    settings?: any;
    onboardingComplete: boolean;
}

export const usersService = {
    async getMe(): Promise<User> {
        const res = await apiClient.get<User>('/users/me');
        return res.data;
    },

    async updateMe(data: UpdateUserDto): Promise<User> {
        const res = await apiClient.patch<User>('/users/me', data);
        return res.data;
    },

    async uploadAvatar3D(file: File): Promise<User> {
        const res = await apiClient.postForm<User>('/users/avatar3d', { file });
        return res.data;
    },

    async getSuggestions(): Promise<any[]> {
        const res = await apiClient.get<any[]>('/users/suggestions');
        return res.data;
    },

    async getById(userId: string): Promise<any> {
        const res = await apiClient.get<any>(`/users/${userId}`);
        const payload = res.data;
        if (payload?.data) return payload.data;
        if (payload?.user) return payload.user;
        return payload;
    },

    async searchCommunityProfiles(
        q: string = '',
        page: number = 1,
        limit: number = 20,
    ): Promise<PaginatedResponse<CommunityProfile>> {
        const res = await apiClient.get<any>('/users/search', {
            params: { q, page, limit },
        });
        const payload = res.data ?? {};

        const data: CommunityProfile[] = Array.isArray(payload)
            ? payload
            : Array.isArray(payload.data)
                ? payload.data
                : Array.isArray(payload.users)
                    ? payload.users
                    : Array.isArray(payload.results)
                        ? payload.results
                        : [];

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

    async toggleFollow(id: string): Promise<{ followed: boolean }> {
        const res = await apiClient.post<{ followed: boolean }>(`/users/follow/${id}`);
        return res.data;
    },

    async getUserStats(userId: string): Promise<any> {
        const res = await apiClient.get<any>(`/users/${userId}/stats`);
        return res.data;
    }
};
