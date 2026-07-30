import api from './api';
import { AssessmentCreateRequest, AssessmentResponse, AssessmentHistoryItem, SummaryStats, DiseaseType } from '../types';

export const assessmentService = {
    create: (data: AssessmentCreateRequest) => api.post<AssessmentResponse>('/assessments', data),
    getHistory: (page = 0, size = 10) => api.get<{ content: AssessmentHistoryItem[] }>('/assessments', { params: { page, size } }),
    getById: (id: number) => api.get<AssessmentResponse>(`/assessments/${id}`),
    getStats: () => api.get<SummaryStats>('/assessments/stats'),
    getTrends: () => api.get<Record<string, Array<{ createdAt: string; riskScore: number; riskLevel: string }>>>('/assessments/trends'),
    getByDisease: (diseaseType: DiseaseType) => api.get(`/assessments/by-disease/${diseaseType}`),
    delete: (id: number) => api.delete(`/assessments/${id}`),
};
