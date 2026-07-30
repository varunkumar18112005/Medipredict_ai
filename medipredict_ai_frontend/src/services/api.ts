import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import Constants from 'expo-constants';

const getBaseUrl = (): string => {
    let LOCAL_IP = '172.23.82.12';
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        LOCAL_IP = hostUri.split(':')[0];
    }
    const PORT = '8085';
    const url = __DEV__
        ? (Platform.OS === 'web' ? `http://localhost:${PORT}/api/v1` : `http://${LOCAL_IP}:${PORT}/api/v1`)
        : 'https://api.medipredict.com/v1';
    console.log("-> AXIOS BASE URL CONFIGURED AS:", url);
    return url;
};

export const API_URL = getBaseUrl();

const API_BASE_URL = getBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true'
    },
});

// Request interceptor: attach JWT token to every request
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    console.log("-> Requesting URL:", config.url, "Token present?", !!token);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor: handle 401/403 + auto-refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response && (error.response.status === 401 || error.response.status === 403) && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = await AsyncStorage.getItem('refreshToken');
                if (refreshToken) {
                    // Backend expects { refreshToken: "..." } matching RefreshTokenRequest DTO
                    const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
                    await AsyncStorage.setItem('accessToken', data.accessToken);
                    await AsyncStorage.setItem('refreshToken', data.refreshToken);
                    originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                    return api(originalRequest);
                }
            } catch {
                await Promise.all([
                    AsyncStorage.removeItem('accessToken'),
                    AsyncStorage.removeItem('refreshToken'),
                    AsyncStorage.removeItem('user')
                ]);
                // We should theoretically navigate to Login here, but interceptors don't have navigation context.
                // The AppNavigator will react to AuthContext state if it's tied to AsyncStorage, but AuthContext only reads on mount.
                // We will rely on the components to handle the error or the user to restart the app.
            }
        }
        return Promise.reject(error);
    }
);

export { API_BASE_URL };
export default api;
