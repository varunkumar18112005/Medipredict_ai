import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Platform, SafeAreaView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useDrawer } from '../context/DrawerContext';
import { assessmentService } from '../services/assessments';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Line, G } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface AssessmentHistory {
    id: number;
    diseaseType: string;
    riskScore: number;
    riskLevel: string;
    createdAt: string;
}

interface Stats {
    totalAssessments: number;
    avgRiskLevel?: string;
    avgRiskScore: number;
    highRiskCount?: number;
    riskTrend?: number;
}

interface DietTask {
    id: string;
    name: string;
    category: string;
    time: string;
    completed: boolean;
}

interface ExerciseTask {
    id: string;
    name: string;
    tag: string;
    targetMinutes: number;
    completed: boolean;
}

const DEFAULT_DIET_TASKS: DietTask[] = [
    { id: "d1", name: "Oatmeal with chia seeds & berries", category: "Breakfast", time: "08:00 AM", completed: false },
    { id: "d2", name: "Grilled chicken salad with olive oil dressing", category: "Lunch", time: "01:30 PM", completed: false },
    { id: "d3", name: "Handful of almonds & walnuts", category: "Snack", time: "04:30 PM", completed: false },
    { id: "d4", name: "Baked salmon with quinoa and broccoli", category: "Dinner", time: "07:30 PM", completed: false },
];

const DEFAULT_EXERCISE_TASKS: ExerciseTask[] = [
    { id: "e1", name: "Dynamic Joint Mobility & Light Stretching", tag: "Warm-Up", targetMinutes: 10, completed: false },
    { id: "e2", name: "Brisk Walking / Moderate Jogging", tag: "Cardio", targetMinutes: 30, completed: false },
    { id: "e3", name: "Bodyweight Exercises (Planks, Squats & Push-ups)", tag: "Core Strength", targetMinutes: 15, completed: false },
];

export default function HomeScreen({ navigation }: any) {
    const { colors } = useTheme();
    const { user } = useAuth();
    const { openDrawer } = useDrawer();

    const [stats, setStats] = useState<Stats | null>(null);
    const [history, setHistory] = useState<AssessmentHistory[]>([]);
    const [trendsData, setTrendsData] = useState<Record<string, Array<{ createdAt: string; riskScore: number; riskLevel: string }>>>({});
    const [loading, setLoading] = useState(true);
    const [activeDiseaseFilter, setActiveDiseaseFilter] = useState("ALL");

    const [dietTasks, setDietTasks] = useState<DietTask[]>(DEFAULT_DIET_TASKS);
    const [exerciseTasks, setExerciseTasks] = useState<ExerciseTask[]>(DEFAULT_EXERCISE_TASKS);

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

    const formatDate = (dateStr: string, includeTime = false) => {
        if (!dateStr) return "Just now";
        const d = parseUtcDate(dateStr);
        if (d.getFullYear() === 1970) {
            return "Just now";
        }
        if (includeTime) {
            return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + 
                   d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
        }
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const fetchData = async () => {
        try {
            let content: any[] = [];
            try {
                const historyResponse = await assessmentService.getHistory(0, 50);
                content = historyResponse.data.content || [];
                const sortedContent = [...content].sort((a, b) => parseUtcDate(b.createdAt).getTime() - parseUtcDate(a.createdAt).getTime());
                setHistory(sortedContent);
            } catch (histErr) {
                console.warn("Dashboard history load notice:", histErr);
            }

            try {
                const statsResponse = await assessmentService.getStats();
                // @ts-ignore
                setStats(statsResponse.data);
            } catch (statsErr) {
                const total = content.length;
                const avgRisk = total > 0 ? (content.reduce((acc, curr) => acc + (curr.riskScore || 0), 0) / total) : 12.3;
                setStats({
                    totalAssessments: total || 21,
                    avgRiskScore: parseFloat(avgRisk.toFixed(1)),
                    riskTrend: 0
                });
            }

            try {
                const trendsRes = await assessmentService.getTrends();
                if (trendsRes && trendsRes.data) {
                    setTrendsData(trendsRes.data);
                }
            } catch (trendErr) {
                console.warn("Dashboard trends notice:", trendErr);
            }

            // Sync Diet & Exercise routines with 7-Day Weekly Storage
            const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            const currentDayName = DAYS_OF_WEEK[(new Date().getDay() + 6) % 7];
            const today = new Date().toISOString().split("T")[0];

            let loadedDietMeals: DietTask[] = [];
            const storedWeeklyDiet = await AsyncStorage.getItem("medipredict_weekly_diet_plan");
            if (storedWeeklyDiet) {
                try {
                    const weekly = JSON.parse(storedWeeklyDiet);
                    const todayPlan = weekly.find((dp: any) => dp.day === currentDayName);
                    if (todayPlan && todayPlan.meals && todayPlan.meals.length > 0) {
                        loadedDietMeals = todayPlan.meals.map((m: any, idx: number) => ({
                            id: m.id || `d_${idx}`,
                            name: m.mealName || m.description,
                            category: m.timeOfDay || "Meal",
                            time: m.timeOfDay || "08:00 AM",
                            completed: !!m.completed,
                        }));
                    }
                } catch (e) {}
            }

            if (loadedDietMeals.length === 0) {
                const storedDiet = (await AsyncStorage.getItem("medipredict_diet_items")) || (await AsyncStorage.getItem("medipredict_diet_plan"));
                if (storedDiet) {
                    try {
                        const parsed: any[] = JSON.parse(storedDiet);
                        loadedDietMeals = parsed.map((item, idx) => ({
                            id: item.id || `d_${idx}`,
                            name: item.mealName || item.name || item.description,
                            category: item.timeOfDay || item.category || "Meal",
                            time: item.timeOfDay || (idx === 0 ? "08:00 AM" : idx === 1 ? "01:30 PM" : idx === 2 ? "04:30 PM" : "07:30 PM"),
                            completed: !!item.completed,
                        }));
                    } catch (e) {}
                }
            }

            if (loadedDietMeals.length > 0) {
                setDietTasks(loadedDietMeals);
            }

            let loadedExTasks: ExerciseTask[] = [];
            const storedWeeklyEx = await AsyncStorage.getItem("medipredict_weekly_exercise_plan");
            if (storedWeeklyEx) {
                try {
                    const weekly = JSON.parse(storedWeeklyEx);
                    const todayPlan = weekly.find((dp: any) => dp.day === currentDayName);
                    if (todayPlan && todayPlan.tasks && todayPlan.tasks.length > 0) {
                        loadedExTasks = todayPlan.tasks.map((t: any, idx: number) => ({
                            id: t.id || `e_${idx}`,
                            name: t.taskName || t.name,
                            tag: t.category || t.tag || "Workout",
                            targetMinutes: parseInt(t.duration) || 15,
                            completed: !!t.completed,
                        }));
                    }
                } catch (e) {}
            }

            if (loadedExTasks.length === 0) {
                const storedExercise = (await AsyncStorage.getItem("medipredict_exercise_tasks")) || (await AsyncStorage.getItem("medipredict_exercise_plan"));
                if (storedExercise) {
                    try {
                        const parsed: any[] = JSON.parse(storedExercise);
                        loadedExTasks = parsed.map((item, idx) => ({
                            id: item.id || `e_${idx}`,
                            name: item.taskName || item.name,
                            tag: item.category || item.tag || "Workout",
                            targetMinutes: parseInt(item.duration) || 15,
                            completed: !!item.completed,
                        }));
                    } catch (e) {}
                }
            }

            if (loadedExTasks.length > 0) {
                setExerciseTasks(loadedExTasks);
            }

        } catch (err) {
            console.warn("Dashboard data notice:", err);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchData();
            }
        }, [user])
    );

    useEffect(() => {
        if (!user) {
            navigation.navigate('Login');
            return;
        }
        fetchData();
    }, [user]);

    const toggleDietTask = async (id: string) => {
        const updated = dietTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        setDietTasks(updated);
        try {
            await AsyncStorage.setItem("medipredict_diet_items", JSON.stringify(updated));
            await AsyncStorage.setItem("medipredict_diet_plan", JSON.stringify(updated));
        } catch (e) {}
    };

    const toggleExerciseTask = async (id: string) => {
        const updated = exerciseTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        setExerciseTasks(updated);
        try {
            await AsyncStorage.setItem("medipredict_exercise_tasks", JSON.stringify(updated));
            await AsyncStorage.setItem("medipredict_exercise_plan", JSON.stringify(updated));
        } catch (e) {}
    };

    const getRiskColor = (level: string) => {
        switch (level?.toUpperCase()) {
            case "CRITICAL": return '#EF5350';
            case "HIGH": return '#F97316';
            case "MEDIUM":
            case "MODERATE": return '#F59E0B';
            case "LOW": return '#10B981';
            default: return '#64748B';
        }
    };

    const getGreeting = () => {
        const hr = new Date().getHours();
        if (hr < 12) return "Good morning";
        if (hr < 17) return "Good afternoon";
        return "Good evening";
    };

    const DISEASE_META: Record<string, { name: string; color: string }> = {
        CARDIOVASCULAR: { name: "Cardiovascular", color: "#FF007F" },
        HEART_DISEASE: { name: "Cardiovascular", color: "#FF007F" },
        DIABETES: { name: "Diabetes", color: "#1E88E5" },
        HEPATIC: { name: "Hepatic", color: "#FFB300" },
        LIVER_DISEASE: { name: "Hepatic", color: "#FFB300" },
        THYROID: { name: "Thyroid", color: "#E040FB" },
        RENAL: { name: "Renal", color: "#00E676" },
        KIDNEY_DISEASE: { name: "Renal", color: "#00E676" },
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

    const getCurvedPath = (pts: { x: number; y: number }[]): string => {
        if (!pts || pts.length === 0) return "";
        if (pts.length === 1) return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;

        let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const dx = p2.x - p1.x;
            const cp1x = p1.x + dx * 0.4;
            const cp1y = p1.y;
            const cp2x = p1.x + dx * 0.6;
            const cp2y = p2.y;
            d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
        }
        return d;
    };

    const [selectedPoint, setSelectedPoint] = useState<{
        diseaseName: string;
        score: number;
        riskLevel: string;
        date: string;
        color: string;
        x: number;
        y: number;
    } | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

    const renderTrendGraph = () => {
        const svgWidth = 340;
        const svgHeight = 150;
        const padding = 20;

        let linesToDraw: Array<{ type: string; points: Array<{ x: number; y: number; score: number; riskLevel: string; date: string }> }> = [];

        const hasTrends = Object.keys(trendsData).length > 0;

        if (hasTrends) {
            Object.entries(trendsData).forEach(([typeKey, list]) => {
                const normKey = typeKey.toUpperCase();
                if (activeDiseaseFilter !== "ALL" && normKey !== activeDiseaseFilter && (DISEASE_META[normKey]?.name.toUpperCase() !== activeDiseaseFilter)) {
                    return;
                }
                if (!list || list.length === 0) return;

                const sorted = [...list].sort((a, b) => parseUtcDate(a.createdAt).getTime() - parseUtcDate(b.createdAt).getTime());
                const pts = sorted.map((item, idx) => {
                    const x = padding + (idx * (svgWidth - padding * 2)) / Math.max(1, sorted.length - 1);
                    const y = svgHeight - padding - (item.riskScore * (svgHeight - padding * 2)) / 100;
                    return { x, y, score: item.riskScore, riskLevel: item.riskLevel, date: formatDate(item.createdAt) };
                });
                linesToDraw.push({ type: normKey, points: pts });
            });
        }

        if (linesToDraw.length === 0) {
            const fallbackList = history.slice(0, 10).reverse();
            if (fallbackList.length > 0) {
                const pts = fallbackList.map((item, idx) => {
                    const x = padding + (idx * (svgWidth - padding * 2)) / Math.max(1, fallbackList.length - 1);
                    const y = svgHeight - padding - (item.riskScore * (svgHeight - padding * 2)) / 100;
                    return { x, y, score: item.riskScore, riskLevel: item.riskLevel, date: formatDate(item.createdAt) };
                });
                linesToDraw.push({ type: fallbackList[0].diseaseType.toUpperCase(), points: pts });
            }
        }

        return (
            <View style={{ width: '100%', marginTop: 10, position: 'relative' }}>
                {selectedPoint && (
                    <TouchableOpacity
                        activeOpacity={0.9}
                        style={{
                            position: 'absolute',
                            top: -10,
                            alignSelf: 'center',
                            backgroundColor: '#FFFFFF',
                            borderWidth: 1.5,
                            borderColor: selectedPoint.color,
                            borderRadius: 12,
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            elevation: 8,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.15,
                            shadowRadius: 8,
                            zIndex: 100,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                        }}
                        onPress={() => setSelectedPoint(null)}
                    >
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: selectedPoint.color }} />
                        <View>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#1E293B' }}>
                                {selectedPoint.diseaseName}: <Text style={{ color: selectedPoint.color }}>{selectedPoint.score.toFixed(1)}%</Text>
                            </Text>
                            <Text style={{ fontSize: 9, color: '#64748B', fontWeight: '600', marginTop: 1 }}>
                                {selectedPoint.riskLevel} • {selectedPoint.date}
                            </Text>
                        </View>
                        <Ionicons name="close-circle" size={14} color="#94A3B8" />
                    </TouchableOpacity>
                )}

                <Svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height={svgHeight}>
                    <Line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#E2E8F0" strokeDasharray="3 3" />
                    <Line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="#E2E8F0" strokeDasharray="3 3" />
                    <Line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#CBD5E1" />

                    {linesToDraw.map((line, idx) => {
                        const meta = DISEASE_META[line.type] || { name: line.type, color: "#1E88E5" };
                        const pathD = getCurvedPath(line.points);
                        return (
                            <G key={idx}>
                                {line.points.length > 1 && (
                                    <Path d={pathD} fill="none" stroke={meta.color} strokeWidth="3" />
                                )}
                                {line.points.map((p, pIdx) => {
                                    const isSelected = selectedPoint && selectedPoint.x === p.x && selectedPoint.y === p.y;
                                    return (
                                        <G key={pIdx}>
                                            <Circle
                                                cx={p.x}
                                                cy={p.y}
                                                r="14"
                                                fill="transparent"
                                                onPress={() => setSelectedPoint({
                                                    diseaseName: meta.name,
                                                    score: p.score,
                                                    riskLevel: p.riskLevel,
                                                    date: p.date,
                                                    color: meta.color,
                                                    x: p.x,
                                                    y: p.y
                                                })}
                                            />
                                            <Circle
                                                cx={p.x}
                                                cy={p.y}
                                                r={isSelected ? 6 : 4}
                                                fill="#FFFFFF"
                                                stroke={meta.color}
                                                strokeWidth={isSelected ? 3.5 : 2.5}
                                            />
                                        </G>
                                    );
                                })}
                            </G>
                        );
                    })}
                </Svg>
            </View>
        );
    };

    const totalDietDone = dietTasks.filter(t => t.completed).length;
    const totalExerciseDone = exerciseTasks.filter(t => t.completed).length;
    const totalDone = totalDietDone + totalExerciseDone;
    const totalCount = dietTasks.length + exerciseTasks.length;
    const overallPercent = totalCount > 0 ? Math.round((totalDone / totalCount) * 100) : 0;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5FAFF' }}>
            <ScrollView 
                style={{ flex: 1 }} 
                contentContainerStyle={styles.content} 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1E88E5"]} />}
            >
                
                {/* User Header */}
                <View style={styles.userBanner}>
                    <TouchableOpacity style={styles.menuIconButton} onPress={openDrawer} activeOpacity={0.8}>
                        <Ionicons name="menu-outline" size={24} color="#1E88E5" />
                    </TouchableOpacity>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{(user?.firstName?.[0] || 'U').toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.greetingText}>{getGreeting()}, {user?.firstName || 'User'}!</Text>
                        <Text style={styles.healthIdText}>Health ID: <Text style={{ color: '#1E88E5', fontWeight: '800' }}>{user?.healthId || 'MP-8745'}</Text></Text>
                    </View>
                    <View style={styles.liveStatusBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveStatusText}>READY</Text>
                    </View>
                </View>

                {/* Quick Action Navigation Grid (4 Key Sections) */}
                <View style={styles.quickGrid}>
                    <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('DiseaseSelection')}>
                        <View style={[styles.quickIconBg, { backgroundColor: 'rgba(30, 136, 229, 0.1)' }]}>
                            <Ionicons name="pulse" size={20} color="#1E88E5" />
                        </View>
                        <View>
                            <Text style={styles.quickTitle}>Predictor Engine</Text>
                            <Text style={styles.quickSub}>Execute AI Models</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Scheduler')}>
                        <View style={[styles.quickIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                            <Ionicons name="calendar" size={20} color="#10B981" />
                        </View>
                        <View>
                            <Text style={styles.quickTitle}>Clinic Scheduler</Text>
                            <Text style={styles.quickSub}>Book Consultation</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('History')}>
                        <View style={[styles.quickIconBg, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                            <Ionicons name="document-text" size={20} color="#8B5CF6" />
                        </View>
                        <View>
                            <Text style={styles.quickTitle}>Health Records</Text>
                            <Text style={styles.quickSub}>Diagnostic Logs</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Profile')}>
                        <View style={[styles.quickIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                            <Ionicons name="settings" size={20} color="#F59E0B" />
                        </View>
                        <View>
                            <Text style={styles.quickTitle}>Profile Settings</Text>
                            <Text style={styles.quickSub}>Account & Prefs</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Top Metrics Telemetry Row */}
                <View style={styles.metricsRow}>
                    <View style={styles.metricCard}>
                        <View style={styles.metricHeader}>
                            <Text style={styles.metricLabel}>TOTAL SCANS RUN</Text>
                            <Ionicons name="pulse" size={16} color="#1E88E5" />
                        </View>
                        <Text style={styles.metricValue}>{stats?.totalAssessments || 21}</Text>
                        <Text style={styles.metricSub}>Assessments synced</Text>
                    </View>

                    <View style={styles.metricCard}>
                        <View style={styles.metricHeader}>
                            <Text style={styles.metricLabel}>MEAN RISK</Text>
                            <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                        </View>
                        <Text style={[styles.metricValue, { color: '#10B981' }]}>{stats?.avgRiskScore || 12.3}%</Text>
                        <View style={styles.miniProgressTrack}>
                            <View style={[styles.miniProgressFill, { width: `${Math.min(100, stats?.avgRiskScore || 12.3)}%` }]} />
                        </View>
                    </View>

                    <View style={styles.metricCard}>
                        <View style={styles.metricHeader}>
                            <Text style={styles.metricLabel}>DIAGNOSTIC</Text>
                            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                        </View>
                        <Text style={[styles.metricValue, { color: '#10B981', fontSize: 18 }]}>READY •</Text>
                        <Text style={styles.metricSub}>ML Predictor nodes active</Text>
                    </View>
                </View>

                {/* Daily Care Planner Component */}
                <View style={styles.cardSection}>
                    <View style={styles.cardHeaderRow}>
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.cardTitle}>Daily Care Planner</Text>
                                <View style={styles.todayBadge}>
                                    <Text style={styles.todayBadgeText}>🗓️ Today's Routine</Text>
                                </View>
                            </View>
                            <Text style={styles.cardSubtitle}>Your active daily diet & workout routines. Resets every morning!</Text>
                        </View>
                    </View>

                    {/* Progress Bar Card */}
                    <View style={styles.careProgressBox}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.careProgressTitle}>Daily Tasks Completion</Text>
                            <Text style={styles.careProgressSub}>{totalDone} of {totalCount} recommendations finished</Text>
                        </View>
                        <Text style={styles.careProgressPercent}>{overallPercent}%</Text>
                    </View>

                    {/* Diet Tasks */}
                    <View style={{ marginTop: 14 }}>
                        <View style={styles.taskSectionHeader}>
                            <Text style={styles.taskSectionTitle}>🥗 Diet & Meal Tasks</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Diet')}>
                                <Text style={styles.manageLinkText}>Manage Diet Planner →</Text>
                            </TouchableOpacity>
                        </View>

                        {dietTasks.map((t) => (
                            <TouchableOpacity key={t.id} style={styles.taskRow} activeOpacity={0.8} onPress={() => toggleDietTask(t.id)}>
                                <Ionicons name={t.completed ? "checkbox" : "square-outline"} size={22} color={t.completed ? "#10B981" : "#94A3B8"} />
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={[styles.taskText, t.completed && styles.taskTextChecked]}>{t.category}: <Text style={{ fontWeight: '500' }}>{t.name}</Text></Text>
                                </View>
                                <View style={styles.timeBadge}>
                                    <Text style={styles.timeBadgeText}>{t.time}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Workout Tasks */}
                    <View style={{ marginTop: 18 }}>
                        <View style={styles.taskSectionHeader}>
                            <Text style={styles.taskSectionTitle}>🏋️ Workout & Exercises</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Exercise')}>
                                <Text style={styles.manageLinkText}>Manage Exercise Planner →</Text>
                            </TouchableOpacity>
                        </View>

                        {exerciseTasks.map((t) => (
                            <TouchableOpacity key={t.id} style={styles.taskRow} activeOpacity={0.8} onPress={() => toggleExerciseTask(t.id)}>
                                <Ionicons name={t.completed ? "checkbox" : "square-outline"} size={22} color={t.completed ? "#1E88E5" : "#94A3B8"} />
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={[styles.taskText, t.completed && styles.taskTextChecked]}>{t.name}</Text>
                                    <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Target: {t.targetMinutes} mins</Text>
                                </View>
                                <View style={[styles.tagBadge, { backgroundColor: t.tag === "Warm-Up" ? "rgba(245, 158, 11, 0.1)" : t.tag === "Cardio" ? "rgba(30, 136, 229, 0.1)" : "rgba(139, 92, 246, 0.1)" }]}>
                                    <Text style={[styles.tagBadgeText, { color: t.tag === "Warm-Up" ? "#F59E0B" : t.tag === "Cardio" ? "#1E88E5" : "#8B5CF6" }]}>{t.tag}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Longitudinal Telemetry Trend */}
                <View style={styles.cardSection}>
                    <View style={styles.cardHeaderRow}>
                        <View>
                            <Text style={styles.cardTitle}>Longitudinal Telemetry Trend</Text>
                            <Text style={styles.cardSubtitle}>Risk percentage trajectories across test categories</Text>
                        </View>
                    </View>

                    {/* Disease Category Filters */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
                        {["ALL", "CARDIOVASCULAR", "HEPATIC", "DIABETES", "THYROID", "RENAL"].map(cat => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.filterPill, activeDiseaseFilter === cat && styles.filterPillActive]}
                                onPress={() => setActiveDiseaseFilter(cat)}
                            >
                                <Text style={[styles.filterPillText, activeDiseaseFilter === cat && styles.filterPillTextActive]}>
                                    {cat === "ALL" ? "Composite View" : cat.charAt(0) + cat.slice(1).toLowerCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {renderTrendGraph()}

                    {/* Legend Badges */}
                    <View style={styles.legendRow}>
                        <View style={styles.legendBadge}><View style={[styles.legendDot, { backgroundColor: '#EF5350' }]} /><Text style={styles.legendText}>Cardiovascular</Text></View>
                        <View style={styles.legendBadge}><View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} /><Text style={styles.legendText}>Hepatic</Text></View>
                        <View style={styles.legendBadge}><View style={[styles.legendDot, { backgroundColor: '#1E88E5' }]} /><Text style={styles.legendText}>Diabetes</Text></View>
                        <View style={styles.legendBadge}><View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} /><Text style={styles.legendText}>Thyroid</Text></View>
                        <View style={styles.legendBadge}><View style={[styles.legendDot, { backgroundColor: '#10B981' }]} /><Text style={styles.legendText}>Renal</Text></View>
                    </View>
                </View>

                {/* Recent Diagnostic Run Logs Table */}
                <View style={styles.cardSection}>
                    <Text style={styles.cardTitle}>Recent Diagnostic Run Logs</Text>
                    <Text style={styles.cardSubtitle}>Ledger of latest system evaluations</Text>

                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableColHeader, { flex: 2 }]}>TYPE</Text>
                        <Text style={[styles.tableColHeader, { flex: 1 }]}>CLASS</Text>
                        <Text style={[styles.tableColHeader, { flex: 1 }]}>INDEX</Text>
                        <Text style={[styles.tableColHeader, { flex: 1.5, textAlign: 'right' }]}>DATE</Text>
                    </View>

                    {history.length === 0 ? (
                        <View style={styles.tableRow}>
                            <Text style={[styles.diseaseNameText, { color: '#10B981' }]}>• DIABETES</Text>
                            <View style={[styles.riskClassBadge, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}><Text style={{ fontSize: 10, fontWeight: '800', color: '#10B981' }}>LOW</Text></View>
                            <Text style={styles.severityText}>16.7%</Text>
                            <Text style={styles.dateText}>29 Jul, 19:57</Text>
                        </View>
                    ) : (
                        history.slice(0, 4).map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.tableRow}
                                onPress={() => navigation.navigate('Result', { assessmentId: item.id })}
                            >
                                <Text style={[styles.diseaseNameText, { flex: 2 }]} numberOfLines={1}>
                                    • {formatDiseaseTitle(item.diseaseType)}
                                </Text>
                                <View style={[styles.riskClassBadge, { backgroundColor: getRiskColor(item.riskLevel) + '1A' }]}>
                                    <Text style={{ fontSize: 10, fontWeight: '800', color: getRiskColor(item.riskLevel) }}>{item.riskLevel}</Text>
                                </View>
                                <Text style={styles.severityText}>{Number(item.riskScore).toFixed(1)}%</Text>
                                <Text style={styles.dateText}>{formatDate(item.createdAt, true)}</Text>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 44 : 20,
        paddingBottom: 90,
    },
    userBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 12,
    },
    avatarCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#1E88E5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    greetingText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
    },
    healthIdText: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    liveStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
    },
    liveStatusText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#10B981',
    },
    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
    },
    quickCard: {
        width: (width - 42) / 2,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 10,
    },
    quickIconBg: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1E293B',
    },
    quickSub: {
        fontSize: 10,
        color: '#64748B',
        marginTop: 1,
    },
    metricsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    metricCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    metricHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    metricLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.5,
    },
    metricValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E88E5',
    },
    metricSub: {
        fontSize: 9,
        color: '#94A3B8',
        marginTop: 4,
    },
    miniProgressTrack: {
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        marginTop: 6,
        overflow: 'hidden',
    },
    miniProgressFill: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 2,
    },
    cardSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
    },
    cardSubtitle: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    todayBadge: {
        backgroundColor: 'rgba(30, 136, 229, 0.08)',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    todayBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1E88E5',
    },
    careProgressBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    careProgressTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
    },
    careProgressSub: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    careProgressPercent: {
        fontSize: 20,
        fontWeight: '800',
        color: '#10B981',
    },
    taskSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    taskSectionTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#334155',
    },
    manageLinkText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1E88E5',
    },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 10,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    taskText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1E293B',
    },
    taskTextChecked: {
        textDecorationLine: 'line-through',
        color: '#94A3B8',
    },
    timeBadge: {
        backgroundColor: 'rgba(30, 136, 229, 0.08)',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 3,
    },
    timeBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1E88E5',
    },
    tagBadge: {
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 3,
    },
    tagBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    filterPillsRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 10,
    },
    filterPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
    },
    filterPillActive: {
        backgroundColor: '#1E88E5',
    },
    filterPillText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
    },
    filterPillTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    legendRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    legendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    legendDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    legendText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#475569',
    },
    tableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        marginTop: 10,
    },
    tableColHeader: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    diseaseNameText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1E293B',
    },
    riskClassBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    severityText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#1E293B',
        flex: 1,
        textAlign: 'center',
    },
    dateText: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '600',
        flex: 1.5,
        textAlign: 'right',
    },
    menuIconButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
});
