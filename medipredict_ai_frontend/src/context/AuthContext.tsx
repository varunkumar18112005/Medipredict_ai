import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, UserSummary, LoginRequest, RegisterRequest } from '../types';
import { authService } from '../services/auth';
import api from '../services/api';
import { Platform } from 'react-native';

interface AuthContextType {
    user: UserSummary | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    loginWithGoogle: (data?: { idToken?: string; accessToken?: string; email?: string; firstName?: string; lastName?: string; profilePictureUrl?: string }) => Promise<void>;
    registerInitiate: (data: RegisterRequest) => Promise<void>;
    registerVerify: (data: RegisterRequest & { otp: string }) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStoredAuth();
    }, []);

    const loadStoredAuth = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user');
            const token = await AsyncStorage.getItem('accessToken');
            if (storedUser && token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Failed to load auth:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveAuth = async (authResponse: AuthResponse) => {
        try {
            api.defaults.headers.common['Authorization'] = `Bearer ${authResponse.accessToken}`;
            await AsyncStorage.setItem('accessToken', authResponse.accessToken);
            await AsyncStorage.setItem('refreshToken', authResponse.refreshToken);
            await AsyncStorage.setItem('user', JSON.stringify(authResponse.user));
        } catch (err) {
            console.error("AsyncStorage Auth Save Error:", err);
            throw err;
        }
        setUser(authResponse.user);
    };

    const login = async (data: LoginRequest) => {
        const response = await authService.login(data);
        await saveAuth(response.data);
    };

    const registerInitiate = async (data: RegisterRequest) => {
        await authService.registerInitiate(data);
    };

    const registerVerify = async (data: RegisterRequest & { otp: string }) => {
        const response = await authService.registerVerify(data);
        await saveAuth(response.data);
    };

    const loginWithGoogle = async (googleData?: { idToken?: string; accessToken?: string; email?: string; firstName?: string; lastName?: string; profilePictureUrl?: string }) => {
        setIsLoading(true);
        try {
            let email = googleData?.email || '';
            let firstName = googleData?.firstName || 'Google';
            let lastName = googleData?.lastName || 'User';
            let photoUrl = googleData?.profilePictureUrl || null;

            let targetEmail = email.trim().toLowerCase();
            if (!targetEmail) {
                targetEmail = 'google.user@gmail.com';
            }
            if (!targetEmail.includes('@')) {
                targetEmail += '@gmail.com';
            }
            if (!targetEmail.endsWith('@gmail.com')) {
                const prefix = targetEmail.split('@')[0];
                targetEmail = `${prefix}@gmail.com`;
            }

            const response = await authService.googleLogin({
                email: targetEmail,
                firstName,
                lastName,
                profilePictureUrl: photoUrl,
                idToken: googleData?.idToken
            });

            await saveAuth(response.data);
        } catch (error: any) {
            console.error('Google login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch { }
        delete api.defaults.headers.common['Authorization'];
        await Promise.all([
            AsyncStorage.removeItem('accessToken'),
            AsyncStorage.removeItem('refreshToken'),
            AsyncStorage.removeItem('user'),
        ]);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, loginWithGoogle, registerInitiate, registerVerify, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
