import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LandingScreen({ navigation }: any) {
    const { colors, isDark } = useTheme();
    const { user } = useAuth();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    const handleExplore = () => {
        if (user) {
            navigation.navigate('AuthenticatedWebLayout', { screen: 'Home' });
        } else {
            navigation.navigate('Login');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Background glow effects */}
            <View style={styles.glowOrb1} />
            <View style={styles.glowOrb2} />

            {/* Top Navbar */}
            <View style={[styles.navBar, { borderBottomColor: colors.border }]}>
                <View style={styles.logoSection}>
                    <Image 
                        source={require('../../assets/logo.png')} 
                        style={{ width: 32, height: 32, borderRadius: 8 }} 
                        resizeMode="cover"
                    />
                    <Text style={[styles.logoText, { color: '#ffffff' }]}>
                        MediPredict <Text style={{ color: colors.primary }}>AI</Text>
                    </Text>
                </View>

                <View style={styles.navLinks}>
                    {user ? (
                        <TouchableOpacity
                            style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
                            onPress={() => navigation.navigate('AuthenticatedWebLayout', { screen: 'Home' })}
                        >
                            <Text style={styles.btnText}>Dashboard</Text>
                        </TouchableOpacity>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={styles.btnNeutral}
                                onPress={() => navigation.navigate('Login')}
                            >
                                <Text style={[styles.btnText, { color: colors.textSecondary }]}>Sign In</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
                                onPress={() => navigation.navigate('Register')}
                            >
                                <Text style={styles.btnText}>Create Account</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero section */}
                <View style={styles.heroSection}>
                    <View style={[styles.heroBadge, { borderColor: 'rgba(59, 130, 246, 0.3)', backgroundColor: 'rgba(0, 242, 254, 0.05)' }]}>
                        <Text style={[styles.heroBadgeText, { color: colors.primary }]}>
                            🚀 Next-Gen Diagnostic Command Center Live
                        </Text>
                    </View>

                    <Text style={styles.heroTitle}>
                        Predict the <Text style={{ color: colors.secondary }}>Unpredictable</Text> With High-Fidelity Diagnostics.
                    </Text>

                    <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                        Analyze real-time bio-telemetry reports, estimate risks for chronic diseases, and review high-confidence ML models instantly.
                    </Text>

                    <TouchableOpacity style={[styles.exploreBtn, { backgroundColor: colors.primary }]} onPress={handleExplore}>
                        <Text style={styles.exploreBtnText}>Enter Command Center</Text>
                        <Ionicons name="flash" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>

                {/* 3D Perspective overview card */}
                <View style={[styles.statsGrid, { flexDirection: isDesktop ? 'row' : 'column' }]}>
                    <View style={[styles.statCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                        <Text style={styles.statLabel}>SYSTEM OVERVIEW</Text>
                        <Text style={styles.statHeading}>
                            ACTIVE <View style={styles.greenPulse} />
                        </Text>
                        <Text style={[styles.statDesc, { color: colors.textSecondary }]}>
                            All AI inference endpoints are fully synchronized with Local Docker clusters.
                        </Text>
                    </View>

                    <View style={[styles.statCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                        <Text style={styles.statLabel}>SCANS COMPLETED</Text>
                        <Text style={[styles.statHeading, { color: colors.primary }]}>
                            14,293
                        </Text>
                        <Text style={[styles.statDesc, { color: colors.textSecondary }]}>
                            Real-time biological report validations with OCR text extraction.
                        </Text>
                    </View>

                    <View style={[styles.statCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                        <Text style={styles.statLabel}>MODEL ACCURACY</Text>
                        <Text style={[styles.statHeading, { color: colors.secondary }]}>
                            99.67%
                        </Text>
                        <Text style={[styles.statDesc, { color: colors.textSecondary }]}>
                            Optimized Random Forest & Gradient Boosting ensembles.
                        </Text>
                    </View>
                </View>

                {/* Inference Pipelines */}
                <View style={styles.pipelinesSection}>
                    <Text style={styles.pipelinesTitle}>SUPPORTED INFERENCE PIPELINES</Text>
                    
                    <View style={[styles.pipelinesGrid, { flexDirection: isDesktop ? 'row' : 'column' }]}>
                        {[
                            { name: "Diabetes", desc: "Glucose, BMI, BP and Age profiling.", color: colors.primary },
                            { name: "Heart Disease", desc: "Cholesterol, resting BP, and heart rate telemetry.", color: colors.secondary },
                            { name: "Liver Disease", desc: "Bilirubin and aminotransferase diagnostic modeling.", color: '#ff007f' },
                            { name: "Kidney Disease", desc: "Creatinine, urea, and hemoglobin evaluation.", color: colors.success }
                        ].map((p, idx) => (
                            <View key={idx} style={[styles.pipelineCard, { borderTopColor: p.color, borderTopWidth: 3, backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Text style={styles.pipelineName}>{p.name}</Text>
                                <Text style={[styles.pipelineDesc, { color: colors.textSecondary }]}>{p.desc}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Footer */}
                <View style={[styles.footer, { borderTopColor: colors.border }]}>
                    <Text style={[styles.footerText, { color: colors.textTertiary }]}>
                        © {new Date().getFullYear()} MediPredict AI Enterprise. Powered by Google DeepMind Antigravity.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    glowOrb1: {
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        top: -100,
        left: -100,
    },
    glowOrb2: {
        position: 'absolute',
        width: 450,
        height: 450,
        borderRadius: 225,
        backgroundColor: 'rgba(0, 242, 254, 0.06)',
        bottom: -150,
        right: -100,
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: '8%',
        paddingVertical: 20,
        backgroundColor: 'rgba(6, 6, 12, 0.5)',
        borderBottomWidth: 1,
        zIndex: 10,
    },
    logoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoText: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    navLinks: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
    },
    btnNeutral: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    btnPrimary: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    btnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ffffff',
    },
    scrollContent: {
        paddingHorizontal: '8%',
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
    },
    heroSection: {
        maxWidth: 800,
        alignItems: 'center',
        marginBottom: 80,
    },
    heroBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 30,
        borderWidth: 1,
        marginBottom: 24,
    },
    heroBadgeText: {
        fontWeight: '700',
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    heroTitle: {
        fontSize: 54,
        fontWeight: '800',
        color: '#ffffff',
        textAlign: 'center',
        lineHeight: 62,
        marginBottom: 24,
        letterSpacing: -1,
    },
    heroSubtitle: {
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 28,
        marginBottom: 40,
        maxWidth: 600,
    },
    exploreBtn: {
        paddingHorizontal: 36,
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    exploreBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '800',
    },
    statsGrid: {
        width: '100%',
        maxWidth: 900,
        gap: 24,
        marginBottom: 80,
    },
    statCard: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 20,
        padding: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    statHeading: {
        fontSize: 32,
        fontWeight: '900',
        color: '#ffffff',
        marginVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    greenPulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
        marginLeft: 8,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
    },
    statDesc: {
        fontSize: 14,
        lineHeight: 20,
    },
    pipelinesSection: {
        width: '100%',
        maxWidth: 1000,
        alignItems: 'center',
        marginBottom: 60,
    },
    pipelinesTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 30,
        letterSpacing: 2,
    },
    pipelinesGrid: {
        width: '100%',
        gap: 20,
    },
    pipelineCard: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 16,
        padding: 24,
    },
    pipelineName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 8,
    },
    pipelineDesc: {
        fontSize: 13,
        lineHeight: 18,
    },
    footer: {
        width: '100%',
        maxWidth: 1000,
        paddingTop: 30,
        borderTopWidth: 1,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 13,
    },
});
