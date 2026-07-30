import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AssessmentHistoryItem, DiseaseType } from '../types';
import { assessmentService } from '../services/assessments';

const filters: { label: string; value: DiseaseType | 'ALL' }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Cardiovascular', value: 'HEART_DISEASE' },
    { label: 'Diabetes', value: 'DIABETES' },
    { label: 'Hepatic', value: 'LIVER_DISEASE' },
    { label: 'Thyroid', value: 'THYROID' as any },
    { label: 'Renal', value: 'KIDNEY_DISEASE' },
];

const diseaseIcons: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
    DIABETES: { icon: 'medkit-outline', color: '#1E88E5', bg: 'rgba(30, 136, 229, 0.1)' },
    HEART_DISEASE: { icon: 'heart-outline', color: '#FF007F', bg: 'rgba(255, 0, 127, 0.1)' },
    CARDIOVASCULAR: { icon: 'heart-outline', color: '#FF007F', bg: 'rgba(255, 0, 127, 0.1)' },
    LIVER_DISEASE: { icon: 'fitness-outline', color: '#FFB300', bg: 'rgba(255, 179, 0, 0.1)' },
    HEPATIC: { icon: 'fitness-outline', color: '#FFB300', bg: 'rgba(255, 179, 0, 0.1)' },
    THYROID: { icon: 'medical-outline', color: '#E040FB', bg: 'rgba(224, 64, 251, 0.1)' },
    KIDNEY_DISEASE: { icon: 'water-outline', color: '#00E676', bg: 'rgba(0, 230, 118, 0.1)' },
    RENAL: { icon: 'water-outline', color: '#00E676', bg: 'rgba(0, 230, 118, 0.1)' },
    FULL_SCAN: { icon: 'scan-outline', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
};

const formatDiseaseTitle = (rawType: string): string => {
    if (!rawType) return "DIAGNOSTIC";
    const type = rawType.toUpperCase();
    if (type.includes("KIDNEY") || type.includes("RENAL")) return "RENAL";
    if (type.includes("HEART") || type.includes("CARDIOVASCULAR")) return "CARDIOVASCULAR";
    if (type.includes("LIVER") || type.includes("HEPATIC")) return "HEPATIC";
    if (type.includes("THYROID")) return "THYROID";
    if (type.includes("DIABETES")) return "DIABETES";
    return rawType.replace('_', ' ').toUpperCase();
};

const riskColors: Record<string, string> = { HIGH: '#EF5350', CRITICAL: '#EF5350', MODERATE: '#F59E0B', LOW: '#10B981' };

const mockData: AssessmentHistoryItem[] = [
    { id: 1, diseaseType: 'DIABETES', riskScore: 76, riskLevel: 'HIGH', riskTrend: 12, status: 'COMPLETED', createdAt: '2026-05-10T10:30:00' },
    { id: 2, diseaseType: 'HEART_DISEASE', riskScore: 42, riskLevel: 'MODERATE', riskTrend: -5, status: 'COMPLETED', createdAt: '2026-05-05T14:20:00' },
    { id: 3, diseaseType: 'LIVER_DISEASE', riskScore: 28, riskLevel: 'LOW', riskTrend: -3, status: 'COMPLETED', createdAt: '2026-04-28T09:15:00' },
    { id: 4, diseaseType: 'KIDNEY_DISEASE', riskScore: 35, riskLevel: 'LOW', riskTrend: -1, status: 'COMPLETED', createdAt: '2026-04-20T16:45:00' },
];

export default function HistoryScreen({ navigation }: any) {
    const { colors } = useTheme();

    const [activeFilter, setActiveFilter] = useState<DiseaseType | 'ALL'>('ALL');

    const parseUtcDate = (dateInput: any): Date => {
        if (!dateInput) return new Date();
        if (dateInput instanceof Date) return dateInput;
        let dateStr = String(dateInput);
        if (!dateStr.endsWith("Z") && !dateStr.includes("+") && dateStr.includes("T")) {
            dateStr += "Z";
        }
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? new Date() : d;
    };

    const [data, setData] = useState<AssessmentHistoryItem[]>(
        [...mockData].sort((a, b) => parseUtcDate(b.createdAt).getTime() - parseUtcDate(a.createdAt).getTime())
    );

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [])
    );

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const res = await assessmentService.getHistory(0, 50);
            if (res.data.content?.length) {
                const sorted = [...res.data.content].sort((a, b) => parseUtcDate(b.createdAt).getTime() - parseUtcDate(a.createdAt).getTime());
                setData(sorted);
            }
        } catch { /* use mock */ }
    };

    const filtered = activeFilter === 'ALL' ? data : data.filter(d => {
        const itemType = d.diseaseType.toUpperCase();
        const filterVal = activeFilter.toUpperCase();
        if (filterVal === 'KIDNEY_DISEASE') return itemType.includes('KIDNEY') || itemType.includes('RENAL');
        if (filterVal === 'HEART_DISEASE') return itemType.includes('HEART') || itemType.includes('CARDIOVASCULAR');
        if (filterVal === 'LIVER_DISEASE') return itemType.includes('LIVER') || itemType.includes('HEPATIC');
        return d.diseaseType === activeFilter;
    });

    const formatDate = (iso: string) => {
        if (!iso) return "Just now";
        const d = parseUtcDate(iso);
        if (d.getFullYear() === 1970) {
            return "Just now";
        }
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const renderItem = ({ item }: { item: AssessmentHistoryItem }) => {
        const di = diseaseIcons[item.diseaseType] || diseaseIcons.DIABETES;
        return (
            <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => navigation.navigate('Result', { assessmentId: item.id })}>
                <View style={[styles.cardIcon, { backgroundColor: di.bg }]}>
                    <Ionicons name={di.icon} size={22} color={di.color} />
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{formatDiseaseTitle(item.diseaseType)} Assessment</Text>
                    <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
                </View>
                <View style={styles.cardRight}>
                    <Text style={styles.cardScore}>{Math.round(item.riskScore)}%</Text>
                    <View style={[styles.riskBadge, { backgroundColor: (riskColors[item.riskLevel] || '#64748B') + '15' }]}>
                        <Text style={[styles.riskText, { color: riskColors[item.riskLevel] || '#64748B' }]}>{item.riskLevel}</Text>
                    </View>
                    <Text style={[styles.trendText, { color: item.riskTrend > 0 ? '#EF5350' : '#2EBD85' }]}>
                        {item.riskTrend > 0 ? '↑' : '↓'}{Math.abs(item.riskTrend)}%
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="#263238" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Ionicons name="stats-chart" size={20} color="#1E88E5" />
                    <Text style={styles.headerTitle}>Diagnostic Telemetry History</Text>
                </View>
                <View style={{ width: 42 }} />
            </View>

            {/* Filter Bar */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
                {filters.map(f => (
                    <TouchableOpacity key={f.value} style={[styles.filterChip, activeFilter === f.value && styles.filterActive]} onPress={() => setActiveFilter(f.value)}>
                        <Text style={[styles.filterText, activeFilter === f.value && styles.filterTextActive]}>{f.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <FlatList data={filtered} renderItem={renderItem} keyExtractor={i => i.id.toString()} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#F5FAFF' 
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: Platform.OS === 'ios' ? 50 : 36,
        marginBottom: 16,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#263238',
    },
    filterBar: { 
        maxHeight: 44, 
        marginBottom: 16 
    },
    filterContent: { 
        paddingHorizontal: 18, 
        gap: 8 
    },
    filterChip: { 
        paddingHorizontal: 16, 
        paddingVertical: 8, 
        borderRadius: 14, 
        backgroundColor: '#FFFFFF', 
        borderWidth: 1, 
        borderColor: '#E2E8F0' 
    },
    filterActive: { 
        backgroundColor: '#1E88E5', 
        borderColor: '#1E88E5' 
    },
    filterText: { 
        fontSize: 13, 
        fontWeight: '700', 
        color: '#64748B' 
    },
    filterTextActive: { 
        color: '#FFFFFF',
        fontWeight: '800',
    },
    list: { 
        paddingHorizontal: 18, 
        paddingBottom: 90 
    },
    card: { 
        flexDirection: 'row', 
        backgroundColor: '#FFFFFF', 
        borderRadius: 18, 
        padding: 16, 
        marginBottom: 12, 
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        alignItems: 'center' 
    },
    cardIcon: { 
        width: 44, 
        height: 44, 
        borderRadius: 14, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 12 
    },
    cardContent: { 
        flex: 1 
    },
    cardTitle: { 
        fontSize: 15, 
        fontWeight: '800', 
        color: '#263238', 
        marginBottom: 2, 
        textTransform: 'capitalize' 
    },
    cardDate: { 
        fontSize: 12, 
        color: '#64748B',
        fontWeight: '600',
    },
    cardRight: { 
        alignItems: 'flex-end', 
        gap: 2 
    },
    cardScore: { 
        fontSize: 16, 
        fontWeight: '900', 
        color: '#263238' 
    },
    riskBadge: { 
        paddingHorizontal: 8, 
        paddingVertical: 2, 
        borderRadius: 6 
    },
    riskText: { 
        fontSize: 10, 
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    trendText: { 
        fontSize: 11, 
        fontWeight: '800' 
    },
});
