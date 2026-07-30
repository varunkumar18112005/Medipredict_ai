import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { DiseaseType } from '../types';

export default function DiseaseSelectionScreen({ navigation }: any) {
    const { colors } = useTheme();

    const diseases: { 
      type: DiseaseType; 
      title: string; 
      desc: string; 
      icon: keyof typeof Ionicons.glyphMap; 
      accentColor: string; 
      testsCount: string;
      estTime: string;
      tags: string[];
    }[] = [
        { 
          type: 'DIABETES', 
          title: 'Diabetes Risk Profiler', 
          desc: 'Comprehensive evaluation of fasting blood glucose, HbA1c, blood pressure, insulin level, BMI, and patient age.', 
          icon: 'fitness-outline', 
          accentColor: '#1E88E5',
          testsCount: '6 Required Tests',
          estTime: '~2 Minutes',
          tags: ['Fasting Glucose', 'HbA1c', 'Blood Pressure', 'Insulin', 'BMI', 'Age']
        },
        { 
          type: 'HEART_DISEASE', 
          title: 'Cardiovascular Risk Telemetry', 
          desc: 'Cardiac screening analyzing resting blood pressure, total serum cholesterol, fasting blood sugar, resting ECG, max heart rate, and chest pain type.', 
          icon: 'heart-outline', 
          accentColor: '#EF5350',
          testsCount: '6 Required Tests',
          estTime: '~3 Minutes',
          tags: ['Resting BP', 'Total Cholesterol', 'Fasting BS', 'Resting ECG', 'Max Heart Rate', 'Chest Pain Type']
        },
        { 
          type: 'LIVER_DISEASE', 
          title: 'Hepatic Function Diagnostics', 
          desc: 'Hepatology panel evaluating total bilirubin, direct bilirubin, ALT (SGPT), AST (SGOT), alkaline phosphatase (ALP), and albumin.', 
          icon: 'medkit-outline', 
          accentColor: '#F59E0B',
          testsCount: '6 Required Tests',
          estTime: '~3 Minutes',
          tags: ['Total Bilirubin', 'Direct Bilirubin', 'ALT (SGPT)', 'AST (SGOT)', 'Alkaline Phosphatase', 'Albumin']
        },
        { 
          type: 'KIDNEY_DISEASE', 
          title: 'Renal Function Clearance', 
          desc: 'Nephrology assessment measuring serum creatinine, blood urea, estimated GFR (eGFR), urine albumin, hemoglobin, and blood pressure.', 
          icon: 'water-outline', 
          accentColor: '#2EBD85',
          testsCount: '6 Required Tests',
          estTime: '~2 Minutes',
          tags: ['Serum Creatinine', 'Blood Urea', 'eGFR', 'Urine Albumin', 'Hemoglobin', 'Blood Pressure']
        },
        { 
          type: 'THYROID_DISEASE', 
          title: 'Thyroid Dysfunction Profiler', 
          desc: 'Endocrine assessment checking TSH, Free T3 (FT3), Free T4 (FT4), and Anti-TPO Antibodies.', 
          icon: 'flask-outline', 
          accentColor: '#D946EF',
          testsCount: '4 Required Tests',
          estTime: '~2 Minutes',
          tags: ['TSH Level', 'Free T3 (FT3)', 'Free T4 (FT4)', 'Anti-TPO']
        },
        { 
          type: 'PULMONARY_DISEASE', 
          title: 'Pulmonary Risk Assessment', 
          desc: 'Respiratory telemetry measuring oxygen saturation (SpO2), FEV1, FVC, FEV1/FVC ratio, respiratory rate, and smoking history.', 
          icon: 'pulse-outline', 
          accentColor: '#06B6D4',
          testsCount: '6 Required Tests',
          estTime: '~2 Minutes',
          tags: ['SpO2 Oxygen', 'FEV1', 'FVC', 'FEV1/FVC Ratio', 'Respiratory Rate', 'Smoking History']
        },
        { 
          type: 'STROKE', 
          title: 'Stroke Risk Telemetry', 
          desc: 'Vascular risk evaluation analyzing blood pressure, blood glucose, total cholesterol, BMI, age, and history of heart disease.', 
          icon: 'flash-outline', 
          accentColor: '#F43F5E',
          testsCount: '6 Required Tests',
          estTime: '~2 Minutes',
          tags: ['Blood Pressure', 'Blood Glucose', 'Total Cholesterol', 'BMI', 'Age', 'Heart Disease History']
        },
        { 
          type: 'ANEMIA', 
          title: 'Anemia Screening Profiler', 
          desc: 'Hematology panel checking hemoglobin, Red Blood Cell (RBC) count, hematocrit (HCT), MCV, MCH, and serum ferritin.', 
          icon: 'analytics-outline', 
          accentColor: '#84CC16',
          testsCount: '6 Required Tests',
          estTime: '~2 Minutes',
          tags: ['Hemoglobin', 'RBC Count', 'Hematocrit (HCT)', 'MCV', 'MCH', 'Serum Ferritin']
        },
    ];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5FAFF' }}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header Toolbar */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={22} color="#263238" />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Ionicons name="pulse" size={20} color="#1E88E5" />
                        <Text style={styles.headerTitle}>Predictor Engine</Text>
                    </View>
                    <View style={{ width: 42 }} />
                </View>

                {/* Overline & Title matching web 1:1 */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={styles.overline}>DIAGNOSTIC PIPELINES CENTER</Text>
                    <Text style={styles.heading}>Specialized AI Risk Predictors</Text>
                    <Text style={styles.subtitle}>
                        Select an enterprise diagnostic model below. Every pipeline uses verified deep-learning models trained on clinical telemetry datasets.
                    </Text>
                </View>

                {/* Grid of Disease Cards */}
                {diseases.map((d) => (
                    <View key={d.type} style={[styles.diseaseCard, { borderLeftColor: d.accentColor }]}>
                        {/* Header Row: Icon, Time Badge, Test Count */}
                        <View style={styles.cardTopRow}>
                            <View style={[styles.diseaseIcon, { backgroundColor: `${d.accentColor}12`, borderColor: `${d.accentColor}30` }]}>
                                <Ionicons name={d.icon} size={26} color={d.accentColor} />
                            </View>

                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                <View style={[styles.timeBadge, { backgroundColor: `${d.accentColor}12`, borderColor: `${d.accentColor}30` }]}>
                                    <Text style={[styles.timeBadgeText, { color: d.accentColor }]}>⏱️ {d.estTime}</Text>
                                </View>
                                <Text style={styles.reqTestsText}>{d.testsCount}</Text>
                            </View>
                        </View>

                        {/* Title & Description */}
                        <Text style={styles.diseaseTitle}>{d.title}</Text>
                        <Text style={styles.diseaseDesc}>{d.desc}</Text>

                        {/* Required Test Tags with Checkmarks */}
                        <View style={styles.tagsRow}>
                            {d.tags.map((tag, i) => (
                                <View key={i} style={styles.tagChip}>
                                    <Text style={styles.tagText}>✓ {tag}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Launch Action Button matching web label 1:1 */}
                        <TouchableOpacity 
                            style={[styles.launchButton, { backgroundColor: d.accentColor }]} 
                            activeOpacity={0.85}
                            onPress={() => navigation.navigate('HealthAnalysis', { diseaseType: d.type })}
                        >
                            <Text style={styles.launchButtonText}>Launch Assessment ➔</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#F5FAFF' 
    },
    content: { 
        paddingHorizontal: 16, 
        paddingTop: Platform.OS === 'ios' ? 44 : 20, 
        paddingBottom: 90 
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 18 
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 6 
    },
    headerTitle: { 
        fontSize: 15, 
        fontWeight: '800', 
        color: '#263238' 
    },
    overline: { 
        fontSize: 11, 
        fontWeight: '800', 
        color: '#1E88E5', 
        textTransform: 'uppercase', 
        letterSpacing: 1,
        marginBottom: 4,
    },
    heading: { 
        fontSize: 24, 
        fontWeight: '800', 
        color: '#1E293B', 
        marginBottom: 6 
    },
    subtitle: { 
        fontSize: 13, 
        color: '#64748B', 
        lineHeight: 18 
    },
    diseaseCard: {
        backgroundColor: '#FFFFFF', 
        borderRadius: 20,
        padding: 18, 
        marginBottom: 16, 
        borderLeftWidth: 5,
        borderWidth: 1, 
        borderColor: '#E2E8F0',
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    diseaseIcon: { 
        width: 52, 
        height: 52, 
        borderRadius: 16, 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderWidth: 1,
    },
    timeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
    },
    timeBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    reqTestsText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
        marginTop: 4,
    },
    diseaseTitle: { 
        fontSize: 18, 
        fontWeight: '800', 
        color: '#1E293B', 
        marginBottom: 6 
    },
    diseaseDesc: { 
        fontSize: 13, 
        color: '#64748B', 
        lineHeight: 19,
        marginBottom: 12,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 16,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    tagChip: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#475569',
    },
    launchButton: {
        borderRadius: 14, 
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    launchButtonText: {
        color: '#FFFFFF', 
        fontSize: 15, 
        fontWeight: '800', 
    }
});
