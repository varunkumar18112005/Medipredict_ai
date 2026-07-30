import api, { API_URL } from './api';
import { ReportResponse } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const reportService = {
    upload: async (file: FormData, assessmentId?: number) => {
        const url = assessmentId ? `/reports/upload?assessmentId=${assessmentId}` : '/reports/upload';

        const token = await AsyncStorage.getItem('accessToken');
        const baseUrl = API_URL;

        const response = await fetch(`${baseUrl}${url}`, {
            method: 'POST',
            body: file,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Bypass-Tunnel-Reminder': 'true'
            }
        });

        if (response.status === 401) {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refreshToken })
                    });
                    if (refreshRes.ok) {
                        const data = await refreshRes.json();
                        await AsyncStorage.setItem('accessToken', data.accessToken);
                        await AsyncStorage.setItem('refreshToken', data.refreshToken);

                        // Retry the original upload with the new token
                        const retryResponse = await fetch(`${API_URL}${url}`, {
                            method: 'POST',
                            body: file,
                            headers: {
                                'Authorization': `Bearer ${data.accessToken}`,
                                'Bypass-Tunnel-Reminder': 'true'
                            }
                        });
                        if (!retryResponse.ok) {
                            const errStr = await retryResponse.text();
                            throw new Error(`Upload failed after token refresh: ${retryResponse.status} - ${errStr}`);
                        }
                        const jsonRes = await retryResponse.json();
                        return { data: jsonRes };
                    }
                } catch {
                    await Promise.all([
                        AsyncStorage.removeItem('accessToken'),
                        AsyncStorage.removeItem('refreshToken'),
                        AsyncStorage.removeItem('user')
                    ]);
                }
            }
            throw new Error('Session expired. Please log in again.');
        }

        if (!response.ok) {
            const errStr = await response.text();
            throw new Error(`Upload failed: ${response.status} - ${errStr}`);
        }

        const jsonRes = await response.json();
        return { data: jsonRes };
    },

    list: (page = 0, size = 10) => api.get<{ content: ReportResponse[] }>('/reports', { params: { page, size } }),
    getById: (id: number) => api.get<ReportResponse>(`/reports/${id}`),
    download: (id: number) => api.get(`/reports/${id}/download`, { responseType: 'blob' }),
    delete: (id: number) => api.delete(`/reports/${id}`),
};