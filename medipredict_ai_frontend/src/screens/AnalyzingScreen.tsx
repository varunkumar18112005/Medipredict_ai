import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { assessmentService } from '../services/assessments';

const tasks = ['Validating physiological parameters...', 'Executing Random Forest & Gradient Boost models...', 'Calculating SHAP feature contribution scores...', 'Synthesizing biomarker telemetry...', 'Generating personalized recommendations...', 'Finalizing diagnostic report...'];

export default function AnalyzingScreen({ route, navigation }: any) {
    const { colors } = useTheme();

    const assessmentId = route.params?.assessmentId;
    const [progress, setProgress] = useState(0);
    const [currentTask, setCurrentTask] = useState(0);
    const spinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinValue, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true })
        ).start();

        const interval = setInterval(() => {
            setProgress(prev => {
                const next = Math.min(prev + Math.random() * 25 + 15, 100);
                setCurrentTask(Math.min(Math.floor(next / 18), tasks.length - 1));
                if (next >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        navigation.replace('Result', { assessmentId });
                    }, 100);
                }
                return next;
            });
        }, 120);

        return () => clearInterval(interval);
    }, []);

    const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Ionicons name="pulse" size={22} color="#1E88E5" />
                <Text style={styles.headerTitle}>MediPredict AI Pipeline</Text>
            </View>

            {/* Scanning Radar Hero */}
            <View style={styles.heroSection}>
                <View style={styles.iconCircle}>
                  <Animated.View style={[styles.spinner, { borderTopColor: '#1E88E5', transform: [{ rotate: spin }] }]} />
                  <Ionicons name="hardware-chip-outline" size={32} color="#1E88E5" style={{ position: 'absolute' }} />
                </View>

                <Text style={styles.title}>
                    RUNNING AI INFERENCE
                </Text>

                <Text style={styles.subtitle}>
                    Evaluating biological indicators against trained ML ensembles...
                </Text>

                {/* Task Checklist */}
                <View style={styles.tasksContainer}>
                  {tasks.map((taskText, idx) => {
                    const isDone = idx < currentTask;
                    const isCurrent = idx === currentTask;
                    return (
                      <View key={idx} style={styles.taskRow}>
                        <Ionicons 
                          name={isDone ? "checkmark-circle" : isCurrent ? "radio-button-on" : "ellipse-outline"} 
                          size={18} 
                          color={isDone ? "#2EBD85" : isCurrent ? "#1E88E5" : "#94A3B8"} 
                        />
                        <Text style={[styles.taskText, isDone && styles.taskDoneText, isCurrent && styles.taskCurrentText]}>
                          {taskText}
                        </Text>
                      </View>
                    );
                  })}
                </View>
            </View>

            {/* Bottom Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(progress)}% Clinical Analysis Complete</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#F5FAFF', 
        paddingHorizontal: 20, 
        paddingTop: Platform.OS === 'ios' ? 50 : 36 
    },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 6, 
        marginBottom: 24 
    },
    headerTitle: { 
        fontSize: 16, 
        fontWeight: '800', 
        color: '#263238' 
    },
    heroSection: { 
        alignItems: 'center', 
        paddingVertical: 30, 
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF', 
        borderRadius: 22, 
        marginBottom: 24, 
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    iconCircle: {
        width: 90,
        height: 90,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        position: 'relative',
    },
    spinner: {
        width: 86,
        height: 86,
        borderRadius: 43,
        borderWidth: 4,
        borderColor: '#E2E8F0',
    },
    title: { 
        fontSize: 20, 
        fontWeight: '800', 
        color: '#1E88E5',
        textAlign: 'center', 
        marginBottom: 6,
        letterSpacing: 0.8,
    },
    subtitle: { 
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center', 
        marginBottom: 24,
        lineHeight: 18,
    },
    tasksContainer: {
        width: '100%',
        gap: 10,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    taskText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94A3B8',
    },
    taskCurrentText: {
        color: '#1E88E5',
        fontWeight: '800',
    },
    taskDoneText: {
        color: '#263238',
        fontWeight: '700',
    },
    progressContainer: {
        marginTop: 'auto',
        marginBottom: 40,
        alignItems: 'center',
    },
    progressBar: { 
        width: '100%',
        height: 8, 
        backgroundColor: '#E2E8F0', 
        borderRadius: 4, 
        marginBottom: 10, 
        overflow: 'hidden' 
    },
    progressFill: { 
        height: '100%', 
        borderRadius: 4,
        backgroundColor: '#1E88E5',
    },
    progressText: { 
        fontSize: 13, 
        color: '#263238', 
        fontWeight: '800' 
    },
});
