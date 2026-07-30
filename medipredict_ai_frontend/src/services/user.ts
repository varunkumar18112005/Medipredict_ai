import api from './api';
import { ProfileResponse, HealthProfileResponse, StatsResponse } from '../types';

export const userService = {
    getProfile: () => api.get<ProfileResponse>('/users/me'),
    updateProfile: (data: Partial<ProfileResponse>) => api.put<ProfileResponse>('/users/me', data),
    uploadAvatar: (file: FormData) => api.post('/users/me/avatar', file, { headers: { 'Content-Type': 'multipart/form-data' } }),
    getHealthProfile: () => api.get<HealthProfileResponse>('/users/me/health-profile'),
    updateHealthProfile: (data: Partial<HealthProfileResponse>) => api.put<HealthProfileResponse>('/users/me/health-profile', data),
    getStats: () => api.get<StatsResponse>('/users/me/stats'),
    deleteAccount: () => api.delete('/users/me'),
};
