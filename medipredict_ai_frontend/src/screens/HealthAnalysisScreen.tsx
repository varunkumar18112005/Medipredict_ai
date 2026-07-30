import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Animated, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../context/ThemeContext';
import { DiseaseType, AssessmentCreateRequest } from '../types';
import { assessmentService } from '../services/assessments';
import { reportService } from '../services/reports';

const diabetesFields = [
    { key: 'glucose', label: 'FASTING BLOOD GLUCOSE (MG/DL)', half: true },
    { key: 'hba1c', label: 'HBA1C (%)', half: true },
    { key: 'bloodPressure', label: 'BLOOD PRESSURE (MMHG)', half: true },
    { key: 'insulin', label: 'INSULIN LEVEL (UU/ML)', half: true },
    { key: 'bmi', label: 'BODY MASS INDEX (BMI)', half: true },
    { key: 'age', label: 'AGE', half: true },
];

const heartFields = [
    { key: 'restingBP', label: 'RESTING BLOOD PRESSURE (MMHG)', half: true },
    { key: 'cholesterol', label: 'TOTAL SERUM CHOLESTEROL (MG/DL)', half: true },
    { key: 'fastingBS', label: 'FASTING BLOOD SUGAR (0/1)', half: true },
    { key: 'restingECG', label: 'RESTING ECG (0-2)', half: true },
    { key: 'maxHeartRate', label: 'MAXIMUM HEART RATE (BPM)', half: true },
    { key: 'chestPainType', label: 'CHEST PAIN TYPE (0-3)', half: true },
];

const liverFields = [
    { key: 'totalBilirubin', label: 'TOTAL BILIRUBIN (MG/DL)', half: true },
    { key: 'directBilirubin', label: 'DIRECT BILIRUBIN (MG/DL)', half: true },
    { key: 'alt', label: 'ALT / SGPT (U/L)', half: true },
    { key: 'ast', label: 'AST / SGOT (U/L)', half: true },
    { key: 'alp', label: 'ALKALINE PHOSPHATASE ALP (U/L)', half: true },
    { key: 'albumin', label: 'ALBUMIN (G/DL)', half: true },
];

const kidneyFields = [
    { key: 'serumCreatinine', label: 'SERUM CREATININE (MG/DL)', half: true },
    { key: 'bloodUrea', label: 'BLOOD UREA (MG/DL)', half: true },
    { key: 'egfr', label: 'ESTIMATED GFR - EGFR', half: true },
    { key: 'urineAlbumin', label: 'URINE ALBUMIN (MG/G)', half: true },
    { key: 'haemoglobin', label: 'HEMOGLOBIN (G/DL)', half: true },
    { key: 'bloodPressure', label: 'BLOOD PRESSURE (MMHG)', half: true },
];

const thyroidFields = [
    { key: 'tsh', label: 'TSH LEVEL (UIU/ML)', half: true },
    { key: 'freeT3', label: 'FREE T3 (PG/ML)', half: true },
    { key: 'freeT4', label: 'FREE T4 (NG/DL)', half: true },
    { key: 'antiTpo', label: 'ANTI-TPO ANTIBODIES (IU/ML)', half: true },
];

const pulmonaryFields = [
    { key: 'oxygenSaturation', label: 'SPO2 OXYGEN (%)', half: true },
    { key: 'fev1', label: 'FEV1 (L)', half: true },
    { key: 'fvc', label: 'FVC (L)', half: true },
    { key: 'fev1FvcRatio', label: 'FEV1/FVC RATIO', half: true },
    { key: 'respiratoryRate', label: 'RESPIRATORY RATE', half: true },
    { key: 'smokingHistory', label: 'SMOKING HISTORY (0/1)', half: true },
];

const strokeFields = [
    { key: 'bloodPressure', label: 'BLOOD PRESSURE (MMHG)', half: true },
    { key: 'glucose', label: 'BLOOD GLUCOSE (MG/DL)', half: true },
    { key: 'cholesterol', label: 'TOTAL CHOLESTEROL (MG/DL)', half: true },
    { key: 'bmi', label: 'BODY MASS INDEX (BMI)', half: true },
    { key: 'age', label: 'AGE', half: true },
    { key: 'heartDiseaseHistory', label: 'HEART DISEASE HISTORY (0/1)', half: true },
];

const anemiaFields = [
    { key: 'haemoglobin', label: 'HEMOGLOBIN LEVEL (G/DL)', half: true },
    { key: 'rbcCount', label: 'RBC COUNT (M/UL)', half: true },
    { key: 'hematocrit', label: 'HEMATOCRIT HCT (%)', half: true },
    { key: 'mcv', label: 'MCV (FL)', half: true },
    { key: 'mch', label: 'MCH (PG)', half: true },
    { key: 'ferritin', label: 'SERUM FERRITIN (NG/ML)', half: true },
];

const getFieldsForDisease = (type: DiseaseType) => {
    switch (type) {
        case 'DIABETES': return diabetesFields;
        case 'HEART_DISEASE': return heartFields;
        case 'LIVER_DISEASE': return liverFields;
        case 'KIDNEY_DISEASE': return kidneyFields;
        case 'THYROID_DISEASE': return thyroidFields;
        case 'PULMONARY_DISEASE': return pulmonaryFields;
        case 'STROKE': return strokeFields;
        case 'ANEMIA': return anemiaFields;
        default: return diabetesFields;
    }
};

export default function HealthAnalysisScreen({ route, navigation }: any) {
    const { colors } = useTheme();

    const diseaseType: DiseaseType = route.params?.diseaseType || 'DIABETES';

    const defaultValues: Record<DiseaseType, Record<string, string>> = {
        DIABETES: { glucose: '100', hba1c: '5.5', bloodPressure: '120', insulin: '15', bmi: '25', age: '40' },
        HEART_DISEASE: { restingBP: '120', cholesterol: '180', fastingBS: '0', restingECG: '0', maxHeartRate: '150', chestPainType: '0' },
        LIVER_DISEASE: { totalBilirubin: '1.0', directBilirubin: '0.3', alt: '30', ast: '30', alp: '100', albumin: '4.0' },
        KIDNEY_DISEASE: { serumCreatinine: '1.0', bloodUrea: '20', egfr: '90', urineAlbumin: '15', haemoglobin: '14.0', bloodPressure: '120' },
        THYROID_DISEASE: { tsh: '2.5', freeT3: '1.2', freeT4: '1.1', antiTpo: '10' },
        PULMONARY_DISEASE: { oxygenSaturation: '97', fev1: '3.0', fvc: '4.0', fev1FvcRatio: '0.75', respiratoryRate: '16', smokingHistory: '0' },
        STROKE: { bloodPressure: '120', glucose: '105', cholesterol: '190', bmi: '25', age: '50', heartDiseaseHistory: '0' },
        ANEMIA: { haemoglobin: '14.0', rbcCount: '4.5', hematocrit: '42', mcv: '88', mch: '29', ferritin: '100' },
        FULL_SCAN: {}
    };

    const [values, setValues] = useState<Record<string, string>>(
        defaultValues[diseaseType] || {}
    );
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<string | null>(null);

    const spinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (uploading) {
            Animated.loop(
                Animated.timing(spinValue, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true })
            ).start();
        } else {
            spinValue.setValue(0);
        }
    }, [uploading]);

    const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

    const fields = getFieldsForDisease(diseaseType);

    const handleSelectDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                await handleUpload(result.assets[0]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to select document');
        }
    };

    const handleUpload = async (asset: DocumentPicker.DocumentPickerAsset) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: asset.uri,
                name: asset.name,
                type: asset.mimeType || 'application/pdf',
            } as any);

            const response = await reportService.upload(formData);
            setUploadedFile(response.data.originalFileName);

            if (response.data.extractedtext) {
                try {
                    const extractedData = JSON.parse(response.data.extractedtext);
                    const activeFieldKeys = fields.map(f => f.key);
                    const filteredVals: Record<string, string> = {};

                    Object.entries(extractedData).forEach(([k, v]) => {
                        if (activeFieldKeys.includes(k) && v !== null && v !== undefined) {
                            filteredVals[k] = String(v);
                        }
                    });

                    if (Object.keys(filteredVals).length > 0) {
                        setValues(prev => ({ ...prev, ...filteredVals }));
                        Alert.alert(
                            'Extraction Complete', 
                            `Scanning Successful!\nExtracted ${Object.keys(filteredVals).length} relevant markers for your ${diseaseType.replace('_', ' ')} assessment.`
                        );
                    } else {
                        Alert.alert('Upload Successful', 'Report uploaded, but no matching parameters for this disease were found.');
                    }
                } catch (e) {
                    Alert.alert('Success', 'Report uploaded successfully!');
                }
            } else {
                Alert.alert('Success', 'Report uploaded successfully!');
            }
        } catch (error: any) {
            console.log(error);
            Alert.alert('Upload Failed', error.response?.data?.message || 'Could not upload the report.');
        } finally {
            setUploading(false);
        }
    };

    const handlePredict = async () => {
        setLoading(true);
        try {
            const numericValues: Record<string, number> = {};
            Object.entries(values).forEach(([k, v]) => { if (v) numericValues[k] = parseFloat(v); });

            if (Object.keys(numericValues).length === 0 && !uploadedFile) {
                Alert.alert('Validation Error', 'Please enter some data or upload a report to proceed.');
                setLoading(false);
                return;
            }

            const request: AssessmentCreateRequest = { diseaseType, ...numericValues } as any;
            const response = await assessmentService.create(request);
            navigation.navigate('Analyzing', { assessmentId: response.data.id });
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to submit assessment');
        } finally {
            setLoading(false);
        }
    };

    const diseaseTitles: Record<string, string> = {
        DIABETES: 'Diabetes Mellitus', HEART_DISEASE: 'Cardiovascular Risk', LIVER_DISEASE: 'Hepatic Function',
        KIDNEY_DISEASE: 'Renal Clearance', THYROID_DISEASE: 'Thyroid Dysfunction',
        PULMONARY_DISEASE: 'Pulmonary Risk', STROKE: 'Stroke Risk', ANEMIA: 'Anemia Profiler',
        FULL_SCAN: 'Full Body Scan',
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                  <Ionicons name="arrow-back" size={22} color="#263238" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Ionicons name="pulse" size={20} color="#1E88E5" />
                    <Text style={styles.headerTitle}>MediPredict AI Input</Text>
                </View>
                <View style={{ width: 42 }} />
            </View>

            <Text style={styles.heading}>Clinical Indicators Entry</Text>
            <Text style={styles.subtitle}>Enter physiological values or upload a medical PDF report for {diseaseTitles[diseaseType]} assessment.</Text>

            {/* Upload Section */}
            <TouchableOpacity style={[styles.uploadCard, uploadedFile && styles.uploadCardSuccess]} activeOpacity={0.85} onPress={handleSelectDocument}>
                {!uploading ? (
                    <View style={styles.uploadContent}>
                        <View style={[styles.uploadIconContainer, uploadedFile && { backgroundColor: 'rgba(46, 189, 133, 0.1)', borderColor: '#2EBD85' }]}>
                            <Ionicons name={uploadedFile ? "checkmark-circle" : "cloud-upload-outline"} size={28} color={uploadedFile ? "#2EBD85" : "#1E88E5"} />
                        </View>
                        <Text style={[styles.uploadTitle, uploadedFile && { color: "#2EBD85" }]}>
                            {uploadedFile ? 'Report Document Loaded!' : 'Upload Lab Report or Prescription PDF/Image'}
                        </Text>
                        <Text style={styles.uploadDesc}>
                            {uploadedFile ? uploadedFile : 'Automatic AI OCR will scan and pre-fill form fields'}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.uploadingContainer}>
                        <Animated.View style={[styles.uploadSpinner, { borderTopColor: '#1E88E5', transform: [{ rotate: spin }] }]} />
                        <Text style={styles.uploadTitleActive}>AI OCR SYSTEM SCANNING...</Text>
                        <Text style={styles.uploadDesc}>Extracting physiological parameters from document...</Text>
                    </View>
                )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR ENTER VALUES MANUALLY</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Input Fields */}
            <View style={styles.fieldsGrid}>
                {fields.filter(f => f.key !== 'age').map((f) => (
                    <View key={f.key} style={[styles.fieldWrapper, !f.half && styles.fieldFull]}>
                        <Text style={styles.fieldLabel}>{f.label}</Text>
                        <TextInput
                            style={styles.fieldInput}
                            placeholder="e.g. 120"
                            placeholderTextColor="#94A3B8"
                            keyboardType="numeric"
                            value={values[f.key] || ''}
                            onChangeText={(v) => setValues(prev => ({ ...prev, [f.key]: v }))}
                        />
                    </View>
                ))}
            </View>

            <TouchableOpacity 
              style={[styles.predictButton, loading && { opacity: 0.6 }]} 
              activeOpacity={0.85}
              onPress={handlePredict} 
              disabled={loading || uploading}
            >
                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                <Text style={styles.predictButtonText}>{loading ? 'Executing AI Model...' : 'Run Health Assessment'}</Text>
            </TouchableOpacity>
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
        gap: 6 
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
    uploadCard: {
        backgroundColor: '#FFFFFF', 
        borderRadius: 20, 
        borderWidth: 2, 
        borderColor: '#1E88E5', 
        borderStyle: 'dashed', 
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    uploadCardSuccess: {
        borderColor: '#2EBD85', 
        backgroundColor: '#F0FDF4',
    },
    uploadContent: {
        padding: 20,
        alignItems: 'center',
    },
    uploadIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(30, 136, 229, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    uploadingContainer: {
        padding: 24,
        alignItems: 'center',
    },
    uploadSpinner: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 3,
        borderColor: '#CBD5E1',
        marginBottom: 12,
    },
    uploadTitle: { 
        fontSize: 15, 
        fontWeight: '800', 
        textAlign: 'center', 
        color: '#263238' 
    },
    uploadTitleActive: { 
        fontSize: 15, 
        fontWeight: '800', 
        color: '#1E88E5', 
        textAlign: 'center' 
    },
    uploadDesc: { 
        fontSize: 12, 
        textAlign: 'center', 
        marginTop: 4, 
        color: '#64748B' 
    },
    divider: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginVertical: 18 
    },
    dividerLine: { 
        flex: 1, 
        height: 1, 
        backgroundColor: '#CBD5E1' 
    },
    dividerText: { 
        paddingHorizontal: 12, 
        fontSize: 11, 
        fontWeight: '800', 
        color: '#64748B', 
        letterSpacing: 0.8 
    },
    fieldsGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between',
        gap: 12 
    },
    fieldWrapper: { 
        width: '48%' 
    },
    fieldFull: { 
        width: '100%' 
    },
    fieldLabel: { 
        fontSize: 12, 
        fontWeight: '700', 
        color: '#263238', 
        marginBottom: 6 
    },
    fieldInput: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 14, 
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        height: 48, 
        paddingHorizontal: 14, 
        fontSize: 15, 
        fontWeight: '700',
        color: '#263238' 
    },
    predictButton: {
        flexDirection: 'row', 
        backgroundColor: '#1E88E5', 
        borderRadius: 18,
        height: 52, 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: 8, 
        marginTop: 24,
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    predictButtonText: { 
        fontSize: 16, 
        fontWeight: '800', 
        color: '#FFFFFF' 
    },
});
