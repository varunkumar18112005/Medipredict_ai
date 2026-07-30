import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { assessmentService } from '../services/assessments';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Line, G } from 'react-native-svg';

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

function HoverCard({ children, style, hoverStyle, ...props }: any) {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <View
            // @ts-ignore
            onMouseEnter={() => setIsHovered(true)}
            // @ts-ignore
            onMouseLeave={() => setIsHovered(false)}
            style={[style, isHovered && hoverStyle]}
            {...props}
        >
            {children}
        </View>
    );
}

export default function HomeScreen({ navigation }: any) {
    const { colors, isDark } = useTheme();
    const { user } = useAuth();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    const [stats, setStats] = useState<Stats | null>(null);
    const [history, setHistory] = useState<AssessmentHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [careTasks, setCareTasks] = useState<{ id: string; text: string; checked: boolean }[]>([]);
    const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

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
            return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
        }
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const fetchData = async () => {
        try {
            let content: any[] = [];
            try {
                const historyResponse = await assessmentService.getHistory(0, 20);
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
                const avgRisk = total > 0 ? (content.reduce((acc, curr) => acc + (curr.riskScore || 0), 0) / total) : 0;
                const highRiskCount = content.filter((h: any) => h.riskLevel === "HIGH" || h.riskLevel === "CRITICAL").length;
                setStats({
                    totalAssessments: total,
                    avgRiskScore: parseFloat(avgRisk.toFixed(1)),
                    highRiskCount,
                    riskTrend: 0
                });
            }

            const hasHighRisk = content.some((h: any) => h.riskLevel === "HIGH" || h.riskLevel === "CRITICAL");
            
            const tasks = [
                { id: "diet", text: hasHighRisk ? "Restrict simple sugars and processed carbs" : "Maintain balanced macro diet", checked: false },
                { id: "exercise", text: hasHighRisk ? "30 mins light cardio (brisk walking)" : "45 mins dynamic cardio/strength training", checked: false },
                { id: "water", text: hasHighRisk ? "Drink 3.0L clean water (renal clearance)" : "Drink 2.2L water", checked: false },
                { id: "logs", text: "Log physical metrics in diagnostic portal", checked: false }
            ];

            const todayKey = `care_tasks_${new Date().toISOString().split("T")[0]}`;
            const savedChecked = await AsyncStorage.getItem(todayKey);
            if (savedChecked) {
                const checkedMap = JSON.parse(savedChecked);
                tasks.forEach(t => {
                    if (checkedMap[t.id] !== undefined) {
                        t.checked = checkedMap[t.id];
                    }
                });
            }
            setCareTasks(tasks);

        } catch (err) {
            console.warn("Dashboard data notice:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            navigation.navigate('Login');
            return;
        }
        fetchData();
    }, [user]);

    const handleToggleTask = async (id: string) => {
        const updated = careTasks.map(t => t.id === id ? { ...t, checked: !t.checked } : t);
        setCareTasks(updated);

        const checkedMap: Record<string, boolean> = {};
        updated.forEach(t => checkedMap[t.id] = t.checked);
        const todayKey = `care_tasks_${new Date().toISOString().split("T")[0]}`;
        await AsyncStorage.setItem(todayKey, JSON.stringify(checkedMap));
    };

    const getRiskColor = (level: string) => {
        switch (level?.toUpperCase()) {
            case "CRITICAL": return colors.danger;
            case "HIGH": return '#f97316'; // Orange
            case "MEDIUM":
            case "MODERATE": return colors.warning;
            case "LOW": return colors.success;
            default: return colors.textSecondary;
        }
    };

    const getGreeting = () => {
        const hr = new Date().getHours();
        if (hr < 12) return "Good morning";
        if (hr < 17) return "Good afternoon";
        return "Good evening";
    };

    const getInitials = () => {
        if (!user) return "";
        const f = user.firstName ? user.firstName[0] : "";
        const l = user.lastName ? user.lastName[0] : "";
        return (f + l).toUpperCase();
    };

    const renderTrendGraph = () => {
        if (history.length === 0) {
            return (
                <View style={styles.emptyGraph}>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
                        No telemetry records available.{"\n"}
                        <Text style={{ fontSize: 11 }}>Complete diagnostic assessments to see longitudinal trends.</Text>
                    </Text>
                </View>
            );
        }

        const sortedHistory = [...history].slice(0, 7).reverse();
        const svgWidth = 500;
        const svgHeight = 160;
        const padding = 24;

        const points = sortedHistory.map((item, idx) => {
            const x = padding + (idx * (svgWidth - padding * 2)) / Math.max(1, sortedHistory.length - 1);
            const y = svgHeight - padding - (item.riskScore * (svgHeight - padding * 2)) / 100;
            return { 
                x, 
                y, 
                score: item.riskScore, 
                type: item.diseaseType, 
                date: formatDate(item.createdAt),
                riskLevel: item.riskLevel 
            };
        });

        const pathD = points.reduce((acc, p, i) => {
            return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
        }, "");

        const areaD = points.length > 1 
            ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - padding} L ${points[0].x} ${svgHeight - padding} Z`
            : "";

        return (
            <View style={{ position: 'relative', width: '100%' }}>
                <Svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height={svgHeight} style={{ overflow: 'visible' }}>
                    <Defs>
                        <SvgLinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.25" />
                            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.0" />
                        </SvgLinearGradient>
                    </Defs>

                    {/* Dotted Grid lines */}
                    <Line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                    <Line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                    <Line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="rgba(255,255,255,0.08)" />

                    {/* Shaded area */}
                    {points.length > 1 && (
                        <Path d={areaD} fill="url(#areaGradient)" />
                    )}

                    {/* Line Path */}
                    {points.length > 1 && (
                        <Path
                            d={pathD}
                            fill="none"
                            stroke={colors.primary}
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    )}

                    {/* Render vertices */}
                    {points.map((p, i) => (
                        <G key={i}>
                            <Circle
                                cx={p.x}
                                cy={p.y}
                                r="5"
                                fill={colors.background}
                                stroke={getRiskColor(p.riskLevel)}
                                strokeWidth="2.5"
                            />
                        </G>
                    ))}
                </Svg>

                {/* Transparent Interactive Mouse Overlays */}
                {points.map((p, idx) => (
                    <TouchableOpacity
                        key={idx}
                        // @ts-ignore
                        onMouseEnter={() => setHoveredPoint(p)}
                        // @ts-ignore
                        onMouseLeave={() => setHoveredPoint(null)}
                        style={{
                            position: 'absolute',
                            left: `${(p.x / svgWidth) * 100}%`,
                            top: `${(p.y / svgHeight) * 100}%`,
                            width: 24,
                            height: 24,
                            marginLeft: -12,
                            marginTop: -12,
                            backgroundColor: 'transparent',
                            zIndex: 100,
                            cursor: 'pointer',
                        }}
                        activeOpacity={1}
                    />
                ))}

                {/* Hover Tooltip Overlay */}
                {hoveredPoint && (
                    <View style={{
                        position: 'absolute',
                        left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                        top: `${(hoveredPoint.y / svgHeight) * 100}%`,
                        transform: [{ translateX: -75 }, { translateY: -95 }],
                        backgroundColor: 'rgba(8, 11, 18, 0.95)',
                        borderColor: getRiskColor(hoveredPoint.riskLevel),
                        borderWidth: 1,
                        borderRadius: 10,
                        padding: 8,
                        zIndex: 200,
                        width: 150,
                    }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff', textTransform: 'capitalize' }}>
                            {hoveredPoint.type.replace("_", " ")}
                        </Text>
                        <Text style={{ fontSize: 11, color: getRiskColor(hoveredPoint.riskLevel), marginTop: 3, fontWeight: '700' }}>
                            Score: {hoveredPoint.score}% ({hoveredPoint.riskLevel})
                        </Text>
                        <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 3 }}>
                            {hoveredPoint.date}
                        </Text>
                    </View>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 8 }}>
                    <Text style={{ fontSize: 11, color: colors.textTertiary }}>Oldest record ({points[0]?.date || "N/A"})</Text>
                    <Text style={{ fontSize: 11, color: colors.textTertiary }}>Latest record ({points[points.length - 1]?.date || "N/A"})</Text>
                </View>
            </View>
        );
    };

    if (!user) return null;

    const completedTasksCount = careTasks.filter(t => t.checked).length;
    const totalTasksCount = careTasks.length;
    const completionPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

    return (
        <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Header Banner */}
            <View style={[styles.welcomeBanner, { borderColor: 'rgba(59, 130, 246, 0.12)' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                    <View style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: colors.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: colors.primary,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.4,
                        shadowRadius: 10,
                    }}>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>
                            {getInitials()}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.greetingText}>
                            {getGreeting()}, {user.firstName}!
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>
                            MediPredict Health Portal • Health ID: <Text style={{ color: '#fff', fontWeight: '600' }}>{user.healthId || "MP-PENDING"}</Text>
                        </Text>
                    </View>
                </View>

                {/* Pipeline Online Status */}
                <View style={[styles.statusCapsule, { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: colors.border }]}>
                    <View style={styles.pulseDot} />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>PIPELINE ONLINE</Text>
                    <View style={{ width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 4 }} />
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </Text>
                </View>
            </View>

            {/* Grid Layout Container */}
            <View style={[styles.gridContainer, { flexDirection: isDesktop ? 'row' : 'column' }]}>
                {/* Left Side: Stats and Chart Panel */}
                <View style={{ flex: isDesktop ? 2 : undefined, gap: 30 }}>
                    
                    {/* Metrics grid */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
                        {/* Total Scans */}
                        <HoverCard style={[styles.statsCard, { borderColor: colors.border }]} hoverStyle={styles.statsCardHover}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={styles.statsLabel}>Total Scans Run</Text>
                                <Ionicons name="pulse-outline" size={20} color={colors.primary} />
                            </View>
                            <Text style={[styles.statsValue, { color: colors.primary }]}>
                                {loading ? "..." : stats?.totalAssessments ?? 0}
                            </Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6 }}>
                                Assessments successfully synced
                            </Text>
                        </HoverCard>

                        {/* Mean Risk Profile */}
                        <HoverCard style={[styles.statsCard, { borderColor: colors.border }]} hoverStyle={styles.statsCardHover}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={styles.statsLabel}>Mean Risk Profile</Text>
                                <Ionicons name="heart-outline" size={20} color={colors.secondary} />
                            </View>
                            <Text style={[styles.statsValue, { color: colors.secondary }]}>
                                {loading ? "..." : stats?.avgRiskScore ? `${stats.avgRiskScore.toFixed(1)}%` : "0.0%"}
                            </Text>
                            {/* Linear progress track */}
                            <View style={styles.progressTrack}>
                                <View style={[styles.progressFill, {
                                    width: loading ? '0%' : `${stats?.avgRiskScore ?? 0}%`,
                                    backgroundColor: getRiskColor(stats?.avgRiskLevel || 'LOW')
                                }]} />
                            </View>
                        </HoverCard>

                        {/* Diagnostic Health */}
                        <HoverCard style={[styles.statsCard, { borderColor: colors.border }]} hoverStyle={styles.statsCardHover}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={styles.statsLabel}>Diagnostic Health</Text>
                                <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
                            </View>
                            <Text style={[styles.statsValue, { color: colors.success, fontSize: 24, marginTop: 14 }]}>
                                READY <View style={[styles.greenPulseDot, { backgroundColor: colors.success }]} />
                            </Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 10 }}>
                                ML Predictor nodes active
                            </Text>
                        </HoverCard>
                    </View>

                    {/* Longitudinal Telemetry Trend */}
                    <HoverCard style={[styles.sectionCard, { borderColor: colors.border }]} hoverStyle={styles.statsCardHover}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <View>
                                <Text style={styles.cardTitle}>Longitudinal Telemetry Trend</Text>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Risk percentage trajectories across test categories</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.15)' }]}>
                                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Category Scores</Text>
                            </View>
                        </View>
                        {loading ? (
                            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
                        ) : (
                            renderTrendGraph()
                        )}
                    </HoverCard>

                    {/* Recent Diagnostic Run Logs */}
                    <HoverCard style={[styles.sectionCard, { borderColor: colors.border }]} hoverStyle={styles.statsCardHover}>
                        <View style={{ marginBottom: 20 }}>
                            <Text style={styles.cardTitle}>Recent Diagnostic Run Logs</Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Ledger of latest system evaluations</Text>
                        </View>

                        <View style={styles.ledgerContainer}>
                            <View style={[styles.ledgerHeader, { borderBottomColor: colors.border }]}>
                                <Text style={styles.ledgerHeaderCol}>Assessment Type</Text>
                                <Text style={styles.ledgerHeaderCol}>Risk Class</Text>
                                <Text style={styles.ledgerHeaderCol}>Severity Index</Text>
                                <Text style={[styles.ledgerHeaderCol, { textAlign: 'right' }]}>Completed</Text>
                            </View>

                            {loading ? (
                                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
                            ) : history.length === 0 ? (
                                <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: 20, fontSize: 13 }}>
                                    No recent activity logs found.
                                </Text>
                            ) : (
                                history.slice(0, 4).map((item) => (
                                    <View key={item.id} style={[styles.ledgerRow, { borderBottomColor: colors.border }]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <View style={[styles.categoryDot, { backgroundColor: getRiskColor(item.riskLevel) }]} />
                                            <Text style={styles.ledgerText}>{item.diseaseType.replace("_", " ")}</Text>
                                        </View>
                                        <View>
                                            <View style={[styles.riskBadge, { backgroundColor: `${getRiskColor(item.riskLevel)}15` }]}>
                                                <Text style={{ color: getRiskColor(item.riskLevel), fontSize: 11, fontWeight: '700' }}>
                                                    {item.riskLevel}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.ledgerText, { fontWeight: '700' }]}>{item.riskScore}%</Text>
                                        <Text style={[styles.ledgerText, { color: colors.textSecondary, textAlign: 'right' }]}>
                                            {formatDate(item.createdAt, true)}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </HoverCard>

                </View>

                {/* Right Side: Quick Controls & Care Routine Planner */}
                <View style={{ flex: isDesktop ? 1 : undefined, gap: 30 }}>
                    
                    {/* Quick Controls */}
                    <HoverCard style={[styles.sectionCard, { borderColor: colors.border }]} hoverStyle={styles.statsCardHover}>
                        <Text style={[styles.cardTitle, { marginBottom: 16 }]}>Quick Controls</Text>
                        <View style={styles.quickGrid}>
                            <TouchableOpacity style={[styles.quickCard, { borderColor: colors.border }]} onPress={() => navigation.navigate('DiseaseSelection')}>
                                <View style={[styles.quickIconWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}>
                                    <Ionicons name="pulse" size={20} color={colors.primary} />
                                </View>
                                <Text style={styles.quickTitle}>Predictor</Text>
                                <Text style={{ fontSize: 11, color: colors.textSecondary }}>Execute AI Engine</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.quickCard, { borderColor: colors.border }]} onPress={() => navigation.navigate('History')}>
                                <View style={[styles.quickIconWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}>
                                    <Ionicons name="clipboard-outline" size={20} color="#fff" />
                                </View>
                                <Text style={styles.quickTitle}>History</Text>
                                <Text style={{ fontSize: 11, color: colors.textSecondary }}>View Past Tests</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.quickCard, { borderColor: colors.border }]} onPress={() => navigation.navigate('Reports')}>
                                <View style={[styles.quickIconWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}>
                                    <Ionicons name="document-text-outline" size={20} color={colors.secondary} />
                                </View>
                                <Text style={styles.quickTitle}>Vault</Text>
                                <Text style={{ fontSize: 11, color: colors.textSecondary }}>Manage Reports</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.quickCard, { borderColor: colors.border }]} onPress={() => navigation.navigate('Profile')}>
                                <View style={[styles.quickIconWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}>
                                    <Ionicons name="settings-outline" size={20} color={colors.success} />
                                </View>
                                <Text style={styles.quickTitle}>Settings</Text>
                                <Text style={{ fontSize: 11, color: colors.textSecondary }}>Account Config</Text>
                            </TouchableOpacity>
                        </View>
                    </HoverCard>

                    {/* Daily Care Planner */}
                    <HoverCard style={[styles.sectionCard, { borderColor: colors.border }]} hoverStyle={styles.statsCardHover}>
                        <View style={{ marginBottom: 20 }}>
                            <Text style={styles.cardTitle}>Daily Care Planner</Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Target metrics calculated from risk parameters</Text>
                        </View>

                        {/* Circular Progress Gauge */}
                        <View style={[styles.gaugeCard, { borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.015)' }]}>
                            <View style={{ width: 50, height: 50, position: 'relative' }}>
                                <Svg width="50" height="50" viewBox="0 0 36 36">
                                    <Path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="rgba(255, 255, 255, 0.05)"
                                        strokeWidth="3.5"
                                    />
                                    <Path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke={colors.success}
                                        strokeWidth="3.5"
                                        strokeDasharray={`${completionPercent}, 100`}
                                        strokeLinecap="round"
                                    />
                                </Svg>
                                <View style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>{completionPercent}%</Text>
                                </View>
                            </View>

                            <View>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Daily Tasks Completion</Text>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                                    {completedTasksCount} of {totalTasksCount} recommendations finished
                                </Text>
                            </View>
                        </View>

                        {/* Checklist items */}
                        <View style={{ gap: 12 }}>
                            {careTasks.map((t) => (
                                <TouchableOpacity
                                    key={t.id}
                                    style={[
                                        styles.taskRow,
                                        { borderColor: t.checked ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255,255,255,0.04)' },
                                        t.checked && { backgroundColor: 'rgba(16, 185, 129, 0.03)' }
                                    ]}
                                    onPress={() => handleToggleTask(t.id)}
                                >
                                    <View style={[
                                        styles.checkbox,
                                        { borderColor: t.checked ? colors.success : 'rgba(255,255,255,0.2)' },
                                        t.checked && { backgroundColor: colors.success }
                                    ]}>
                                        {t.checked && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✓</Text>}
                                    </View>
                                    <Text style={[
                                        styles.taskText,
                                        t.checked && { color: colors.textSecondary, textDecorationLine: 'line-through' }
                                    ]}>
                                        {t.text}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </HoverCard>

                </View>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    content: { paddingVertical: 40, paddingHorizontal: 24, alignSelf: 'center', width: '100%', maxWidth: 1200 },
    welcomeBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 28,
        borderRadius: 20,
        backgroundColor: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(0, 242, 254, 0.04))',
        borderWidth: 1,
        marginBottom: 30,
        flexWrap: 'wrap',
        gap: 20,
    },
    greetingText: { fontSize: 24, fontWeight: '800', color: '#fff', lineHeight: 28 },
    statusCapsule: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
    },
    gridContainer: { gap: 30 },
    statsCard: {
        flex: 1,
        minWidth: 200,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderWidth: 1,
        borderRadius: 16,
        padding: 24,
        // @ts-ignore
        transition: 'all 0.25s ease',
    },
    statsCardHover: {
        transform: [{ translateY: -2 }],
        borderColor: 'rgba(59, 130, 246, 0.3)',
        shadowColor: 'rgba(59, 130, 246, 0.12)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
    },
    statsLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statsValue: { fontSize: 32, fontWeight: '800', marginTop: 12 },
    progressTrack: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, marginTop: 12, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    greenPulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 8,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
    },
    sectionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderWidth: 1,
        borderRadius: 16,
        padding: 24,
        // @ts-ignore
        transition: 'all 0.25s ease',
    },
    cardTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
    },
    emptyGraph: {
        height: 130,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ledgerContainer: { width: '100%' },
    ledgerHeader: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    ledgerHeaderCol: {
        flex: 1,
        fontSize: 11,
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    ledgerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    ledgerText: { flex: 1, fontSize: 13, color: '#fff' },
    categoryDot: { width: 6, height: 6, borderRadius: 3 },
    riskBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    quickCard: {
        flex: 1,
        minWidth: 120,
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.015)',
        borderWidth: 1,
        borderRadius: 12,
        alignItems: 'flex-start',
        gap: 10,
    },
    quickIconWrapper: {
        width: 38,
        height: 38,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickTitle: { fontSize: 13, fontWeight: '700', color: '#fff' },
    gaugeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 20,
    },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    taskText: { fontSize: 13, color: '#fff', flex: 1, lineHeight: 18 },
});
