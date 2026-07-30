import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function LandingScreen({ navigation }: any) {
    const { colors } = useTheme();
    const { user } = useAuth();

    const handleExplore = () => {
        if (user) {
            navigation.navigate('MainTabs');
        } else {
            navigation.navigate('Login');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: '#F5FAFF' }]}>
            {/* Soft Background Orbs */}
            <View style={styles.glowOrb1} />
            <View style={styles.glowOrb2} />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Top Navbar */}
            <View style={styles.navBar}>
                <View style={styles.logoSection}>
                    <View style={styles.logoIconBg}>
                      <Ionicons name="pulse" size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.logoText}>
                        MediPredict <Text style={{ color: '#1E88E5' }}>AI</Text>
                    </Text>
                </View>

                {/* Mobile Auth Actions */}
                <View style={styles.navLinks}>
                    {user ? (
                        <TouchableOpacity
                            style={styles.btnPrimary}
                            onPress={() => navigation.navigate('MainTabs')}
                        >
                            <Text style={styles.btnText}>Enter App ➔</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.btnPrimary}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.btnText}>Sign In ➔</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Hero Section */}
            <View style={styles.heroSection}>
                <View style={styles.heroBadge}>
                    <Text style={styles.heroBadgeText}>
                      🚀 ENTERPRISE CLINICAL DIAGNOSTICS
                    </Text>
                </View>

                <Text style={styles.heroTitle}>
                    Intelligent <Text style={{ color: '#1E88E5' }}>Disease Prediction</Text> & Risk Telemetry.
                </Text>

                <Text style={styles.heroSubtitle}>
                    Analyze lab reports, estimate multi-disease risk profiles, scan OCR clinical documents, and route to nearby specialized hospitals instantly.
                </Text>

                <TouchableOpacity style={styles.exploreBtn} activeOpacity={0.85} onPress={handleExplore}>
                    <Text style={styles.exploreBtnText}>Open Diagnostic Hub</Text>
                    <Ionicons name="sparkles" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>

            {/* Metrics Stack */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>SYSTEM OVERVIEW</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 6 }}>
                      <Text style={styles.statHeading}>LIVE PIPELINE</Text>
                      <View style={styles.greenPulse} />
                    </View>
                    <Text style={styles.statDesc}>
                        AI inference endpoints are synchronized with real-time ML services.
                    </Text>
                </View>

                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>DIAGNOSTIC SCANS</Text>
                    <Text style={[styles.statHeading, { color: '#1E88E5' }]}>
                        14,293+
                    </Text>
                    <Text style={styles.statDesc}>
                        Real-time lab report validations with automated OCR text extraction.
                    </Text>
                </View>

                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>MODEL ACCURACY</Text>
                    <Text style={[styles.statHeading, { color: '#2EBD85' }]}>
                        99.67%
                    </Text>
                    <Text style={styles.statDesc}>
                        Optimized Random Forest & Gradient Boosting ensemble algorithms.
                    </Text>
                </View>
            </View>

            {/* Supported Inference Pipelines */}
            <View style={styles.pipelinesSection}>
                <Text style={styles.pipelinesTitle}>SPECIALIZED DIAGNOSTIC PIPELINES</Text>
                <View style={styles.pipelinesGrid}>
                    {[
                        { name: "Diabetes Mellitus", desc: "Glucose, BMI, BP, and insulin profiling.", color: '#1E88E5' },
                        { name: "Cardiovascular", desc: "Cholesterol, resting BP, and ECG telemetry.", color: '#EF5350' },
                        { name: "Hepatic Care", desc: "Bilirubin, SGOT, and liver enzyme modeling.", color: '#8B5CF6' },
                        { name: "Renal Function", desc: "Creatinine, blood urea, and eGFR testing.", color: '#2EBD85' }
                    ].map((p, idx) => (
                        <View key={idx} style={[styles.pipelineCard, { borderLeftColor: p.color, borderLeftWidth: 4 }]}>
                            <Text style={styles.pipelineName}>{p.name}</Text>
                            <Text style={styles.pipelineDesc}>{p.desc}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    © {new Date().getFullYear()} MediPredict AI • Enterprise Healthcare Platform
                </Text>
            </View>
        </ScrollView>
    </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    glowOrb1: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(30, 136, 229, 0.08)',
        top: -50,
        left: -100,
    },
    glowOrb2: {
        position: 'absolute',
        width: 350,
        height: 350,
        borderRadius: 175,
        backgroundColor: 'rgba(46, 189, 133, 0.06)',
        bottom: 50,
        right: -100,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 40,
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 24,
    },
    logoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoIconBg: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: '#1E88E5',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    logoText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#263238',
        letterSpacing: 0.5,
    },
    navLinks: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    btnPrimary: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: '#1E88E5',
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    btnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    heroSection: {
        alignItems: 'flex-start',
        marginBottom: 32,
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    heroBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(30, 136, 229, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(30, 136, 229, 0.2)',
        marginBottom: 14,
    },
    heroBadgeText: {
        fontWeight: '800',
        fontSize: 10,
        color: '#1E88E5',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#263238',
        lineHeight: 34,
        marginBottom: 12,
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 22,
        marginBottom: 20,
    },
    exploreBtn: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#1E88E5',
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'stretch',
        justifyContent: 'center',
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    exploreBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
    statsGrid: {
        gap: 16,
        marginBottom: 32,
    },
    statCard: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statHeading: {
        fontSize: 22,
        fontWeight: '800',
        color: '#263238',
    },
    greenPulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2EBD85',
        marginLeft: 8,
    },
    statDesc: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },
    pipelinesSection: {
        marginBottom: 32,
    },
    pipelinesTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748B',
        marginBottom: 16,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    pipelinesGrid: {
        gap: 12,
    },
    pipelineCard: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    pipelineName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#263238',
        marginBottom: 4,
    },
    pipelineDesc: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },
    footer: {
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
    },
});
