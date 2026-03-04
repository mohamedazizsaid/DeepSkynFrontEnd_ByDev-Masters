import apiClient from '../api-client';

export interface UpdateUserDto {
    avatar?: string;
    dateOfBirth?: string;
    gender?: string;
    preferredLanguage?: string;
}

export interface User {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    dateOfBirth?: string;
    gender?: string;
    preferredLanguage?: string;
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
    }
};
