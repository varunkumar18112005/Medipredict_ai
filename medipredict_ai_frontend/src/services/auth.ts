import api from './api';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types';

export const authService = {
    login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
    googleLogin: (data: { email: string; firstName: string; lastName: string; profilePictureUrl: string | null; idToken?: string }) => 
        api.post<AuthResponse>('/auth/google', data),
    registerInitiate: (data: RegisterRequest) => api.post<{ message: string }>('/auth/register/initiate', data),
    registerVerify: (data: RegisterRequest & { otp: string }) => api.post<AuthResponse>('/auth/register/verify', data),
    refreshToken: (refreshToken: string) => api.post<AuthResponse>('/auth/refresh', { refreshToken }),
    logout: () => api.post('/auth/logout'),
    forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token: string, newPassword: string) => api.post('/auth/reset-password', { token, newPassword }),
    changePassword: (currentPassword: string, newPassword: string) => api.post('/auth/change-password', { currentPassword, newPassword }),
};
