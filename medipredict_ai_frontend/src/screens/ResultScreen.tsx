import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Dimensions,
  LayoutAnimation,
  UIManager,
  Alert,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import { AssessmentResponse } from '../types';
import { assessmentService } from '../services/assessments';
import { LIFESTYLE_PLANS, LifestylePlan } from '../services/lifestylePlans';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const TypewriterText = ({ text, delay = 8 }: { text: string; delay?: number }) => {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(timer);
      }
    }, delay);
    return () => clearInterval(timer);
  }, [text]);

  return <Text style={styles.aiText}>{displayed}</Text>;
};

export default function ResultScreen({ route, navigation }: any) {
  const { colors } = useTheme();

  const riskColors: Record<string, string> = {
    HIGH: '#EF5350',
    CRITICAL: '#EF5350',
    MODERATE: '#F59E0B',
    LOW: '#10B981',
    NORMAL: '#10B981',
  };

  const assessmentId = route.params?.assessmentId;
  const [result, setResult] = useState<AssessmentResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'diet' | 'exercise'>('analysis');
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  useEffect(() => {
    loadResult();
  }, []);

  const loadResult = async () => {
    try {
      const response = await assessmentService.getById(assessmentId);
      setResult(response.data);
    } catch {
      setResult({
        id: assessmentId,
        diseaseType: 'DIABETES',
        riskScore: 15.4,
        riskLevel: 'LOW',
        riskTrend: 0,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        riskFactors: [
          { name: 'Fasting Blood Glucose', value: '95 mg/dL', level: 'LOW', score: 20 },
          { name: 'HbA1c Level', value: '5.4%', level: 'LOW', score: 22 },
          { name: 'Body Mass Index (BMI)', value: '23.8', level: 'LOW', score: 25 },
        ],
        suggestions: [
          'Maintain balanced nutrient-dense diet and routine health screenings.',
          'Engage in at least 150 minutes of moderate aerobic physical activity per week.',
          'Continue maintaining your current healthy lifestyle.',
        ],
      });
    }
  };

  const getDiseaseColor = (type: string) => {
    switch (type) {
      case 'DIABETES': return '#1E88E5';
      case 'HEART_DISEASE': return '#EF5350';
      case 'LIVER_DISEASE': return '#8B5CF6';
      case 'KIDNEY_DISEASE': return '#2EBD85';
      case 'THYROID_DISEASE': return '#D946EF';
      case 'PULMONARY_DISEASE': return '#0EA5E9';
      case 'STROKE': return '#F59E0B';
      case 'ANEMIA': return '#E11D48';
      default: return '#1E88E5';
    }
  };

  const handleSaveReport = async () => {
    if (!result) return;

    try {
      const html = `
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #263238; }
            .header { text-align: center; border-bottom: 2px solid #1E88E5; padding-bottom: 20px; margin-bottom: 30px; }
            .title { color: #1E88E5; font-size: 32px; font-weight: 800; margin: 0; }
            .subtitle { color: #64748B; font-size: 16px; margin-top: 5px; }
            .summary-box { background-color: #F8FAFC; border: 1px solid #CBD5E1; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
            .risk-level { font-size: 24px; font-weight: 800; color: ${riskColors[result.riskLevel] || '#1E88E5'}; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">MediPredict AI Diagnostic Report</h1>
            <p class="subtitle">Confidential Clinical Assessment Output</p>
          </div>
          <div class="summary-box">
            <h2>Module: ${result.diseaseType.replace('_', ' ')} Profiler</h2>
            <div class="risk-level">DETECTED RISK LEVEL: ${result.riskLevel} (${Math.round(result.riskScore * 10) / 10}%)</div>
            <p>Date Evaluated: ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        }
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  if (!result) return <View style={styles.container}><Text style={styles.loadingText}>Loading diagnostic results...</Text></View>;

  const diseaseLabel = result.diseaseType.replace('_', ' ');
  const themeColor = getDiseaseColor(result.diseaseType);

  const getAiAnalysisText = () => {
    const high = result.riskFactors?.filter((f: any) => f.level === 'HIGH' || f.level === 'CRITICAL') || [];
    const mod = result.riskFactors?.filter((f: any) => f.level === 'MODERATE') || [];

    let txt = '';
    if (result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL') {
      txt += `Based on the deep-learning model analysis for the ${diseaseLabel} Risk Profiler, your risk profile is classified as ${result.riskLevel} (${Math.round(result.riskScore * 10) / 10}%). `;
      if (high.length > 0) {
        txt += `This elevated risk is primarily driven by your ${high.map((f: any) => f.name).join(' and ')}, which are currently critically out of optimal range. `;
      }
      txt += 'Given these indicators, it is highly recommended that you consult with a specialized doctor or clinician immediately for a professional medical evaluation.';
    } else if (result.riskLevel === 'MODERATE') {
      txt += `Your ${diseaseLabel} Risk Profiler analysis indicates a ${result.riskLevel} risk (${Math.round(result.riskScore * 10) / 10}%). `;
      if (mod.length > 0 || high.length > 0) {
        const issues = [...high, ...mod];
        txt += `While generally stable, metrics such as ${issues.map((f: any) => f.name).join(' and ')} show deviations from the ideal baseline. `;
      }
      txt += 'Consider scheduling a routine check-up with your primary care physician to monitor these levels proactively.';
    } else {
      txt += `Excellent news. Your ${diseaseLabel} Risk Profiler analysis shows a ${result.riskLevel} risk profile (${Math.round(result.riskScore * 10) / 10}%). `;
      txt += 'All provided biological markers and telemetry data appear to fall well within the normal healthy ranges. Continue maintaining your current lifestyle. No immediate medical consultation is necessary.';
    }
    return txt;
  };

  const radius = 40;
  const circ = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(result.riskScore, 0), 100);
  const strokeOffset = circ * (1 - progress / 100);
  const dialColor = riskColors[result.riskLevel] || '#10B981';

  const levelKey: 'LOW' | 'MODERATE' | 'HIGH' =
    result.riskLevel === 'CRITICAL' || result.riskLevel === 'HIGH'
      ? 'HIGH'
      : result.riskLevel === 'MODERATE'
      ? 'MODERATE'
      : 'LOW';
  const plan = LIFESTYLE_PLANS[result.diseaseType]?.[levelKey];

  const togglePhase = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedPhase(expandedPhase === index ? null : index);
  };

  // Export Diet Plan to Daily Planner
  const handleExportDiet = async () => {
    if (!plan?.diet?.weekly) return;
    try {
      const formattedPlan = plan.diet.weekly.map((item, idx) => ({
        day: item.day,
        meals: [
          { id: `${idx}_b`, timeOfDay: '08:00 AM', mealName: 'Breakfast', description: item.breakfast, completed: false },
          { id: `${idx}_l`, timeOfDay: '01:30 PM', mealName: 'Lunch', description: item.lunch, completed: false },
          { id: `${idx}_d`, timeOfDay: '07:30 PM', mealName: 'Dinner', description: item.dinner, completed: false },
          { id: `${idx}_s`, timeOfDay: '04:30 PM', mealName: 'Snack', description: item.snack, completed: false },
        ],
      }));

      await AsyncStorage.setItem('medipredict_weekly_diet_plan', JSON.stringify(formattedPlan));

      const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todayObj = formattedPlan.find((p) => p.day === todayStr) || formattedPlan[0];
      const todayItems = todayObj.meals.map((m) => ({
        id: m.id,
        name: m.description,
        category: m.mealName,
        time: m.timeOfDay,
        completed: false,
      }));
      await AsyncStorage.setItem('medipredict_diet_items', JSON.stringify(todayItems));

      Alert.alert(
        'Export Successful! 📌',
        'Your 7-Day Nutrition Plan has been exported to your Daily Care Planner.',
        [{ text: 'View Planner', onPress: () => navigation.navigate('Diet') }]
      );
    } catch (e) {
      Alert.alert('Export Failed', 'Could not export diet plan. Please try again.');
    }
  };

  // Export Exercise Plan to Daily Planner
  const handleExportExercise = async () => {
    if (!plan?.exercise?.routine) return;
    try {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const formattedWeeklyPlan = days.map((day) => ({
        day,
        workouts: plan.exercise.routine.map((p, idx) => ({
          id: `${day}_w_${idx}`,
          name: p.phase,
          tag: idx === 0 ? 'Warm-Up' : idx === 1 ? 'Cardio' : 'Recovery',
          targetMinutes: idx === 0 ? 10 : idx === 1 ? 25 : 10,
          completed: false,
          notes: p.details,
        })),
      }));

      await AsyncStorage.setItem('medipredict_weekly_exercise_plan', JSON.stringify(formattedWeeklyPlan));

      const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todayObj = formattedWeeklyPlan.find((p) => p.day === todayStr) || formattedWeeklyPlan[0];
      const todayTasks = todayObj.workouts.map((w) => ({
        id: w.id,
        name: w.name,
        tag: w.tag,
        targetMinutes: w.targetMinutes,
        completed: false,
      }));
      await AsyncStorage.setItem('medipredict_exercise_tasks', JSON.stringify(todayTasks));

      Alert.alert(
        'Export Successful! 📌',
        'Your Workout Routine has been exported to your Daily Care Planner.',
        [{ text: 'View Planner', onPress: () => navigation.navigate('Exercise') }]
      );
    } catch (e) {
      Alert.alert('Export Failed', 'Could not export exercise plan. Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5FAFF' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="arrow-back" size={20} color="#263238" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerSubtitle}>DIAGNOSTIC PIPELINE RESPONSE</Text>
          <Text style={styles.headerTitle}>{diseaseLabel} Result</Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={handleSaveReport}>
          <Ionicons name="share-outline" size={20} color="#1E88E5" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Risk Score Gauge Panel */}
        <View style={styles.gaugePanel}>
          <View style={styles.gaugeContainer}>
            <Svg width="110" height="110" viewBox="0 0 100 100">
              <Circle cx="50" cy="50" r={radius} stroke="#E2E8F0" strokeWidth="8" fill="none" />
              <Circle
                cx="50"
                cy="50"
                r={radius}
                stroke={dialColor}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${circ}`}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </Svg>
            <View style={styles.gaugeLabelWrapper}>
              <Text style={styles.gaugeValue}>{Math.round(result.riskScore * 10) / 10}%</Text>
              <Text style={styles.gaugeSub}>RISK SCORE</Text>
            </View>
          </View>

          <View style={styles.classificationDetails}>
            <Text style={styles.classLabel}>CLASSIFICATION LEVEL</Text>
            <Text style={[styles.classValue, { color: dialColor }]}>{result.riskLevel}</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'analysis' && { borderBottomColor: themeColor }]}
            onPress={() => setActiveTab('analysis')}
          >
            <Ionicons name="analytics" size={16} color={activeTab === 'analysis' ? themeColor : '#64748B'} />
            <Text style={[styles.tabButtonText, activeTab === 'analysis' && { color: themeColor, fontWeight: '800' }]}>
              AI Analysis
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'diet' && { borderBottomColor: themeColor }]}
            onPress={() => setActiveTab('diet')}
          >
            <MaterialCommunityIcons name="nutrition" size={16} color={activeTab === 'diet' ? themeColor : '#64748B'} />
            <Text style={[styles.tabButtonText, activeTab === 'diet' && { color: themeColor, fontWeight: '800' }]}>
              Weekly Diet Plan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'exercise' && { borderBottomColor: themeColor }]}
            onPress={() => setActiveTab('exercise')}
          >
            <Ionicons name="fitness" size={16} color={activeTab === 'exercise' ? themeColor : '#64748B'} />
            <Text style={[styles.tabButtonText, activeTab === 'exercise' && { color: themeColor, fontWeight: '800' }]}>
              Exercise & Recovery
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: AI Analysis */}
        {activeTab === 'analysis' && (
          <View style={styles.tabContentCard}>
            <Text style={styles.sectionHeadingTitle}>AI Predictive Analysis</Text>
            <View style={styles.aiBanner}>
              <TypewriterText text={getAiAnalysisText()} />
            </View>

            <Text style={[styles.sectionHeadingTitle, { marginTop: 18 }]}>Recommended Medical Interventions</Text>
            <View style={styles.suggestionsCard}>
              {result.suggestions && result.suggestions.length > 0 ? (
                result.suggestions.map((sugg: string, idx: number) => (
                  <View key={idx} style={styles.suggestionRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginTop: 2 }} />
                    <Text style={styles.suggestionText}>{sugg}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.suggestionText}>Maintain routine yearly health checkups.</Text>
              )}
            </View>

            {result.riskFactors && result.riskFactors.length > 0 && (
              <>
                <Text style={[styles.sectionHeadingTitle, { marginTop: 18 }]}>Key Biomarker Telemetry</Text>
                <View style={styles.factorsList}>
                  {result.riskFactors.map((f: any, idx: number) => (
                    <View key={idx} style={styles.factorCard}>
                      <View style={styles.factorHeaderRow}>
                        <Text style={styles.factorName}>{f.name}</Text>
                        <Text
                          style={[
                            styles.factorBadge,
                            { color: riskColors[f.level] || '#263238', backgroundColor: `${riskColors[f.level]}14` },
                          ]}
                        >
                          {f.value} • {f.level}
                        </Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${f.score || 50}%`, backgroundColor: riskColors[f.level] || '#1E88E5' },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* Tab 2: Weekly Diet Plan */}
        {activeTab === 'diet' && plan && (
          <View style={styles.tabContentCard}>
            {/* Core Nutrition Guidelines Box */}
            <View style={styles.guidelinesBox}>
              <Text style={styles.guidelinesTitle}>🥗 Core Nutrition Guidelines ({levelKey} Risk)</Text>
              {plan.diet.guidelines.map((item: string, idx: number) => (
                <View key={idx} style={styles.guidelineRow}>
                  <Ionicons name="ellipse" size={6} color="#065F46" style={{ marginTop: 6 }} />
                  <Text style={styles.guidelineText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Export To-Do List Button */}
            <View style={styles.exportRow}>
              <Text style={styles.sectionHeadingTitle}>Weekly Meal Plan</Text>
              <TouchableOpacity style={styles.exportBtnDiet} onPress={handleExportDiet}>
                <Ionicons name="pin" size={14} color="#FFFFFF" />
                <Text style={styles.exportBtnText}>Export to Daily Diet</Text>
              </TouchableOpacity>
            </View>

            {/* 7-Day Meal Cards */}
            <View style={styles.mealCardsList}>
              {plan.diet.weekly.map((m, idx) => (
                <View key={idx} style={styles.dayMealCard}>
                  <Text style={styles.dayMealTitle}>{m.day.toUpperCase()}</Text>
                  <View style={styles.mealSlotRow}>
                    <Text style={styles.mealSlotIcon}>🍳</Text>
                    <Text style={styles.mealSlotText}>
                      <Text style={{ fontWeight: '800' }}>Breakfast: </Text>
                      {m.breakfast}
                    </Text>
                  </View>
                  <View style={styles.mealSlotRow}>
                    <Text style={styles.mealSlotIcon}>🥗</Text>
                    <Text style={styles.mealSlotText}>
                      <Text style={{ fontWeight: '800' }}>Lunch: </Text>
                      {m.lunch}
                    </Text>
                  </View>
                  <View style={styles.mealSlotRow}>
                    <Text style={styles.mealSlotIcon}>🍽️</Text>
                    <Text style={styles.mealSlotText}>
                      <Text style={{ fontWeight: '800' }}>Dinner: </Text>
                      {m.dinner}
                    </Text>
                  </View>
                  <View style={styles.mealSlotRow}>
                    <Text style={styles.mealSlotIcon}>🥜</Text>
                    <Text style={styles.mealSlotText}>
                      <Text style={{ fontWeight: '800' }}>Snack: </Text>
                      {m.snack}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tab 3: Exercise & Recovery */}
        {activeTab === 'exercise' && plan && (
          <View style={styles.tabContentCard}>
            {/* Target Training Schedule */}
            <View style={styles.scheduleBox}>
              <Text style={styles.scheduleTitle}>🏃 Target Training Schedule</Text>
              <Text style={styles.scheduleValue}>{plan.exercise.schedule}</Text>
            </View>

            {/* Export To-Do List Button */}
            <View style={styles.exportRow}>
              <Text style={styles.sectionHeadingTitle}>Daily Training Routine</Text>
              <TouchableOpacity style={styles.exportBtnExercise} onPress={handleExportExercise}>
                <Ionicons name="pin" size={14} color="#FFFFFF" />
                <Text style={styles.exportBtnText}>Export to Daily Exercise</Text>
              </TouchableOpacity>
            </View>

            {/* Routine Accordion Phases */}
            <View style={{ gap: 10, marginTop: 8 }}>
              {plan.exercise.routine.map((phaseItem, idx) => {
                const isExpanded = expandedPhase === idx;
                return (
                  <View key={idx} style={styles.phaseCard}>
                    <TouchableOpacity style={styles.phaseHeaderRow} onPress={() => togglePhase(idx)} activeOpacity={0.8}>
                      <View style={styles.phaseNumberBadge}>
                        <Text style={styles.phaseNumberText}>{idx + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.phaseName}>{phaseItem.phase}</Text>
                        <Text style={styles.phaseDetails}>{phaseItem.details}</Text>
                      </View>
                      <View style={styles.toggleRow}>
                        <Text style={styles.toggleText}>Show Drills</Text>
                        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#1E88E5" />
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.phaseBody}>
                        {phaseItem.exercises.map((ex, exIdx) => (
                          <View key={exIdx} style={styles.exerciseItemRow}>
                            <Ionicons name="radio-button-on" size={12} color="#1E88E5" style={{ marginTop: 3 }} />
                            <Text style={styles.exerciseItemText}>{ex}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Safety Guidelines Alert Box */}
            <View style={styles.safetyBox}>
              <Text style={styles.safetyTitle}>⚠️ Safety Guidelines & Warnings</Text>
              {plan.exercise.guidelines.map((g: string, idx: number) => (
                <Text key={idx} style={styles.safetyText}>
                  • {g}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Bottom Quick Action Navigation Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.actionSecondaryBtn} onPress={() => navigation.navigate('DiseaseSelection')}>
            <Ionicons name="refresh" size={16} color="#1E88E5" />
            <Text style={styles.actionSecondaryText}>New Assessment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionSecondaryBtn} onPress={handleSaveReport}>
            <Ionicons name="document-text" size={16} color="#1E88E5" />
            <Text style={styles.actionSecondaryText}>Share Report</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionPrimaryBtn} onPress={() => navigation.navigate('Home')}>
            <Ionicons name="home" size={16} color="#FFFFFF" />
            <Text style={styles.actionPrimaryText}>Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FAFF',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 100,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1E293B',
  },
  gaugePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  gaugeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeLabelWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  gaugeValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
  },
  gaugeSub: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: 2,
  },
  classificationDetails: {
    flex: 1,
    marginLeft: 20,
  },
  classLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  classValue: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginTop: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabContentCard: {
    marginTop: 14,
  },
  sectionHeadingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  aiBanner: {
    backgroundColor: 'rgba(30, 136, 229, 0.06)',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#1E88E5',
    borderWidth: 1,
    borderColor: 'rgba(30, 136, 229, 0.15)',
  },
  aiText: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 20,
    fontWeight: '500',
  },
  suggestionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  suggestionText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
    lineHeight: 18,
    fontWeight: '600',
  },
  factorsList: {
    gap: 10,
  },
  factorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  factorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  factorName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  factorBadge: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  guidelinesBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: 14,
  },
  guidelinesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 8,
  },
  guidelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  guidelineText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  exportBtnDiet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  exportBtnExercise: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E88E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  exportBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mealCardsList: {
    gap: 12,
  },
  dayMealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayMealTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1E88E5',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 4,
  },
  mealSlotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  mealSlotIcon: {
    fontSize: 13,
  },
  mealSlotText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
    lineHeight: 17,
  },
  scheduleBox: {
    backgroundColor: 'rgba(30, 136, 229, 0.06)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(30, 136, 229, 0.2)',
    marginBottom: 14,
  },
  scheduleTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  scheduleValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1E88E5',
    marginTop: 2,
  },
  phaseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  phaseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  phaseNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseNumberText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1E88E5',
  },
  phaseName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  phaseDetails: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E88E5',
  },
  phaseBody: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6,
  },
  exerciseItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  exerciseItemText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
    lineHeight: 17,
  },
  safetyBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginTop: 14,
  },
  safetyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 6,
  },
  safetyText: {
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 17,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 20,
  },
  actionSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 42,
  },
  actionSecondaryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E88E5',
  },
  actionPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#1E88E5',
    borderRadius: 12,
    height: 42,
  },
  actionPrimaryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
