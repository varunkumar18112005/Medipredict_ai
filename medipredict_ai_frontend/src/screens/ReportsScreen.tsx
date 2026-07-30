import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ReportResponse } from '../types';
import { reportService } from '../services/reports';

const mockReports: ReportResponse[] = [
    { id: 1, fileName: 'blood_test_results.pdf', originalFileName: 'Blood_Test_Results.pdf', fileType: 'PDF', fileSize: 2516582, extractedtext: '', status: 'PROCESSED', assessmentId: 1, uploadedAt: '2026-05-10T10:30:00', processedAt: '2026-05-10T10:32:00' },
    { id: 2, fileName: 'lipid_profile.pdf', originalFileName: 'Lipid_Profile_2026.pdf', fileType: 'PDF', fileSize: 1887436, extractedtext: '', status: 'PROCESSED', assessmentId: null, uploadedAt: '2026-05-05T14:20:00', processedAt: '2026-05-05T14:25:00' },
    { id: 3, fileName: 'lab_report.png', originalFileName: 'Lab_Report_Scan.png', fileType: 'PNG', fileSize: 4404019, extractedtext: '', status: 'PROCESSING', assessmentId: null, uploadedAt: '2026-04-28T09:15:00', processedAt: null },
];

const formatSize = (bytes: number) => {
    if (!bytes) return '1.2 MB';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default function ReportsScreen({ navigation }: any) {
    const { colors } = useTheme();
    const [reports, setReports] = useState<ReportResponse[]>(mockReports);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadReports = async () => {
        try {
            const res = await reportService.list(0, 50);
            if (res.data?.content && res.data.content.length > 0) {
                setReports(res.data.content);
            }
        } catch (err) {
            console.log("Could not load backend reports, using local vault list:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadReports();
        }, [])
    );

    useEffect(() => {
        loadReports();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadReports();
    };

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

    const statusConfig: Record<string, { color: string; bg: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
        PROCESSED: { color: '#2EBD85', bg: 'rgba(46, 189, 133, 0.1)', label: 'Processed', icon: 'checkmark-circle' },
        PROCESSING: { color: '#1E88E5', bg: 'rgba(30, 136, 229, 0.1)', label: 'Processing', icon: 'sync-outline' },
        UPLOADED: { color: '#64748B', bg: '#F1F5F9', label: 'Uploaded', icon: 'cloud-upload-outline' },
        FAILED: { color: '#EF5350', bg: 'rgba(239, 83, 80, 0.1)', label: 'Failed', icon: 'close-circle' },
    };

    const renderReport = ({ item }: { item: ReportResponse }) => {
        const sc = statusConfig[item.status] || statusConfig.UPLOADED;
        const isPdf = item.fileType === 'PDF' || item.fileName?.endsWith('.pdf');
        const formattedDate = parseUtcDate(item.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        return (
            <View style={styles.reportCard}>
                <View style={[styles.fileIcon, { backgroundColor: isPdf ? 'rgba(239, 83, 80, 0.1)' : 'rgba(30, 136, 229, 0.1)' }]}>
                    <Ionicons name={isPdf ? 'document-text' : 'image'} size={22} color={isPdf ? '#EF5350' : '#1E88E5'} />
                </View>
                <View style={styles.reportInfo}>
                    <Text style={styles.reportName} numberOfLines={1}>{item.originalFileName || item.fileName}</Text>
                    <Text style={styles.reportMeta}>{formatSize(item.fileSize)} • {formattedDate}</Text>
                </View>
                <View style={styles.reportRight}>
                    <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                        <Ionicons name={sc.icon} size={12} color={sc.color} />
                        <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
                    </View>
                </View>
            </View>
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
                    <Ionicons name="folder-open" size={20} color="#1E88E5" />
                    <Text style={styles.headerTitle}>Medical Reports Vault</Text>
                </View>
                <View style={{ width: 42 }} />
            </View>

            {/* Upload Banner */}
            <View style={styles.uploadBanner}>
                <View style={styles.uploadIconBg}>
                  <Ionicons name="cloud-upload-outline" size={28} color="#1E88E5" />
                </View>
                <Text style={styles.uploadTitle}>Upload Clinical Document</Text>
                <Text style={styles.uploadDesc}>Supports PDF, PNG, JPG, or WEBP (Max 10MB)</Text>
                <TouchableOpacity style={styles.uploadButton} activeOpacity={0.85} onPress={() => navigation.navigate('HealthAnalysis')}>
                    <Text style={styles.uploadButtonText}>+ Select File ➔</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>REPORTS ARCHIVE ({reports.length})</Text>
                {loading && <ActivityIndicator size="small" color="#1E88E5" />}
            </View>

            <FlatList 
                data={reports} 
                renderItem={renderReport} 
                keyExtractor={i => i.id.toString()} 
                contentContainerStyle={styles.list} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E88E5']} tintColor="#1E88E5" />
                }
            />
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
        paddingBottom: 16,
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
    uploadBanner: {
        marginHorizontal: 18,
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    uploadIconBg: {
        width: 54,
        height: 54,
        borderRadius: 18,
        backgroundColor: 'rgba(30, 136, 229, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    uploadTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#263238',
        marginBottom: 4,
    },
    uploadDesc: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 16,
    },
    uploadButton: {
        backgroundColor: '#1E88E5',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 14,
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    uploadButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 22,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.8,
    },
    list: {
        paddingHorizontal: 18,
        paddingBottom: 40,
    },
    reportCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    fileIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    reportInfo: {
        flex: 1,
    },
    reportName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#263238',
        marginBottom: 2,
    },
    reportMeta: {
        fontSize: 12,
        color: '#64748B',
    },
    reportRight: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
    },
});
