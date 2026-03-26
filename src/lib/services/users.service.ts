import apiClient from '../api-client';

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

    async toggleFollow(id: string): Promise<{ followed: boolean }> {
        const res = await apiClient.post<{ followed: boolean }>(`/users/follow/${id}`);
        return res.data;
    },

    async getUserStats(userId: string): Promise<any> {
        const res = await apiClient.get<any>(`/users/${userId}/stats`);
        return res.data;
    }
};
