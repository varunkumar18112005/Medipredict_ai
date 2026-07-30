import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function SuggestionsScreen({ navigation }: any) {
    const { colors } = useTheme();

    const suggestions = [
        { severity: 'CRITICAL', severityColor: '#EF5350', priority: 'AI Priority: High', title: 'Reduce Refined Sugar & Carbs', desc: 'Your glucose levels are trending upward. Cutting back on refined sugars can significantly lower your risk of insulin resistance.', action: 'Take Action ➔', actionFilled: true },
        { severity: 'RECOMMENDED', severityColor: '#1E88E5', priority: 'Daily Goal: 30min', title: 'Aerobic Exercise Routine', desc: 'Consistent movement strengthens your cardiovascular system. Aim for at least 150 minutes of moderate activity weekly.', action: 'Track Activity', actionFilled: false },
        { severity: 'BALANCED', severityColor: '#2EBD85', priority: 'Nutrition Score: 85/100', title: 'Maintain Fiber-Rich Macro Diet', desc: 'Integrate more soluble fiber and healthy omega fats. This will help stabilize your metabolism and blood pressure.', action: 'View Meal Plan', actionFilled: false },
        { severity: 'PRECAUTION', severityColor: '#F59E0B', priority: 'Expert Consultation', title: 'Consult Specialist Physician', desc: 'Your heart rate telemetry shows minor fluctuations. We recommend a check-up with your physician for a detailed assessment.', action: 'Book Telehealth ➔', actionFilled: true },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="#263238" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Ionicons name="sparkles" size={20} color="#1E88E5" />
                    <Text style={styles.headerTitle}>Clinical Recommendations</Text>
                </View>
                <View style={{ width: 42 }} />
            </View>

            <Text style={styles.heading}>Personalized Action Plan</Text>
            <Text style={styles.subtitle}>AI-synthesized lifestyle modifications and prevention steps based on your latest diagnostic runs.</Text>

            {suggestions.map((s, i) => (
                <View key={i} style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <View style={[styles.cardIconBg, { backgroundColor: `${s.severityColor}15` }]}>
                            <Ionicons name={i === 0 ? 'nutrition-outline' : i === 1 ? 'walk-outline' : i === 2 ? 'restaurant-outline' : 'pulse-outline'} size={24} color={s.severityColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={styles.metaRow}>
                                <View style={[styles.severityBadge, { backgroundColor: `${s.severityColor}15` }]}>
                                    <Text style={[styles.severityText, { color: s.severityColor }]}>{s.severity}</Text>
                                </View>
                                <Text style={styles.priorityText}>• {s.priority}</Text>
                            </View>
                            <Text style={styles.cardTitle}>{s.title}</Text>
                        </View>
                    </View>
                    
                    <Text style={styles.cardDesc}>{s.desc}</Text>

                    <TouchableOpacity style={[styles.actionButton, s.actionFilled ? styles.actionFilled : styles.actionOutlined]} activeOpacity={0.85}>
                        <Text style={[styles.actionText, { color: s.actionFilled ? '#FFFFFF' : '#1E88E5' }]}>{s.action}</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#F5FAFF' 
    },
    content: { 
        paddingHorizontal: 18, 
        paddingTop: Platform.OS === 'ios' ? 50 : 36, 
        paddingBottom: 60 
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 20 
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
        color: '#263238' 
    },
    heading: { 
        fontSize: 26, 
        fontWeight: '800', 
        color: '#263238', 
        marginBottom: 4 
    },
    subtitle: { 
        fontSize: 13, 
        color: '#64748B', 
        marginBottom: 20,
        lineHeight: 18 
    },
    card: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 20, 
        padding: 18, 
        marginBottom: 16, 
        borderWidth: 1, 
        borderColor: '#E2E8F0',
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    cardIconBg: { 
        width: 48, 
        height: 48, 
        borderRadius: 16, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    metaRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8, 
        marginBottom: 4 
    },
    severityBadge: { 
        paddingHorizontal: 8, 
        paddingVertical: 2, 
        borderRadius: 6 
    },
    severityText: { 
        fontSize: 10, 
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    priorityText: { 
        fontSize: 11, 
        color: '#64748B',
        fontWeight: '600',
    },
    cardTitle: { 
        fontSize: 16, 
        fontWeight: '800', 
        color: '#263238' 
    },
    cardDesc: { 
        fontSize: 13, 
        lineHeight: 20, 
        marginBottom: 16, 
        color: '#64748B' 
    },
    actionButton: { 
        borderRadius: 16, 
        height: 46, 
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionFilled: { 
        backgroundColor: '#1E88E5',
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    actionOutlined: { 
        borderWidth: 1.5, 
        borderColor: '#90CAF9',
        backgroundColor: '#FFFFFF',
    },
    actionText: { 
        fontSize: 14, 
        fontWeight: '800' 
    },
});
