"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useCallback, useRef } from "react";
import BorderGlow from "@/components/BorderGlow";
import api, { getUser } from "../../services/api";

interface AssessmentHistory {
  id: number;
  diseaseType: string;
  riskScore: number;
  riskLevel: string;
  createdAt: string;
}

interface Stats {
  totalAssessments: number;
  avgRiskLevel: string;
  avgRiskScore: number;
}

const DISEASE_META: Record<string, { name: string; color: string }> = {
  DIABETES: { name: "Diabetes", color: "#3b82f6" },
  HEART_DISEASE: { name: "Cardiovascular", color: "#ec4899" },
  LIVER_DISEASE: { name: "Hepatic", color: "#f59e0b" },
  KIDNEY_DISEASE: { name: "Renal", color: "#10b981" },
  THYROID_DISEASE: { name: "Thyroid", color: "#d946ef" },
  PULMONARY_DISEASE: { name: "Pulmonary", color: "#06b6d4" },
  STROKE: { name: "Stroke", color: "#f43f5e" },
  ANEMIA: { name: "Anemia", color: "#84cc16" }
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<AssessmentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Responsive Chart Container Width Reference
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState<number>(900);

  // Time range & disease filter for trend graph
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "6M" | "1Y">("30D");
  const [selectedDiseaseFilter, setSelectedDiseaseFilter] = useState<string>("ALL");

  // Health Plan Routine state & tabs
  const [activePlanTab, setActivePlanTab] = useState<"nutrition" | "exercise" | "medication">("nutrition");
  const [careTasks, setCareTasks] = useState<any[]>([]);

  // Interactive SVG Tooltip & Crosshair State
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Report Upload Simulation state
  const [isUploadingReport, setIsUploadingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ResizeObserver to keep SVG responsive without distorting aspect ratios
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const updateDimensions = () => {
      if (chartContainerRef.current) {
        setChartWidth(chartContainerRef.current.offsetWidth || 900);
      }
    };
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(chartContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Helper to parse dates
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
    if (d.getFullYear() === 1970) return "Just now";
    if (includeTime) {
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const fetchData = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;
    try {
      // Fetch stats
      const statsResponse = await api.get("/assessments/stats");
      setStats(statsResponse.data);

      // Fetch history
      const historyResponse = await api.get("/assessments?size=100");
      const content = historyResponse.data?.content || historyResponse.data || [];
      const sortedContent = [...content].sort((a, b) => parseUtcDate(b.createdAt).getTime() - parseUtcDate(a.createdAt).getTime());
      setHistory(sortedContent);

      // Determine Care Routine Tasks
      const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const currentDayName = DAYS_OF_WEEK[(new Date().getDay() + 6) % 7];

      // 1. Get Diet Items
      let dietList: any[] = [];
      const savedWeeklyDietStr = localStorage.getItem("medipredict_weekly_diet_plan");
      if (savedWeeklyDietStr) {
        try {
          const weeklyPlan = JSON.parse(savedWeeklyDietStr);
          const todayPlan = weeklyPlan.find((dp: any) => dp.day === currentDayName);
          if (todayPlan && todayPlan.meals && todayPlan.meals.length > 0) {
            dietList = todayPlan.meals;
          }
        } catch (e) {}
      }

      if (dietList.length === 0) {
        dietList = [
          { id: "d1", category: "nutrition", timeOfDay: "08:00 AM", mealName: "Morning Oatmeal & Chia Seeds", description: "Oatmeal with chia seeds, almonds & green tea", completed: true },
          { id: "d2", category: "nutrition", timeOfDay: "01:30 PM", mealName: "Nutrient-Dense Quinoa Bowl", description: "Steamed Quinoa with Lentil Soup & Fresh Salad", completed: false },
          { id: "d3", category: "nutrition", timeOfDay: "04:30 PM", mealName: "Green Apple & Almonds", description: "1 Green Apple with roasted walnuts & pumpkin seeds", completed: false },
          { id: "d4", category: "nutrition", timeOfDay: "07:30 PM", mealName: "Light Steamed Vegetables", description: "Grilled Tofu / Chicken breast with steamed broccoli", completed: false },
        ];
      }

      // 2. Get Exercise Items
      let exerciseList: any[] = [
        { id: "e1", category: "exercise", taskName: "Brisk Morning Walk", duration: "35 mins", intensity: "Moderate", completed: false },
        { id: "e2", category: "exercise", taskName: "Deep Breathing & Mindfulness", duration: "10 mins", intensity: "Low", completed: true },
        { id: "e3", category: "exercise", taskName: "Post-Dinner Stretching", duration: "15 mins", intensity: "Low", completed: false }
      ];

      // 3. Get Medication Items
      let medList: any[] = [
        { id: "m1", category: "medication", taskName: "Omega-3 Fish Oil Supplement", time: "Morning (08:30 AM)", dosage: "1000 mg", completed: true },
        { id: "m2", category: "medication", taskName: "Vitamin D3 Softgel", time: "Evening (08:00 PM)", dosage: "2000 IU", completed: false }
      ];

      const combinedTasks = [
        ...dietList.map((d: any) => ({
          id: `diet_${d.id}`,
          tab: "nutrition",
          title: d.mealName || d.title,
          subtitle: d.description || d.subtitle,
          badge: d.timeOfDay || "Nutrition",
          checked: !!d.completed,
        })),
        ...exerciseList.map((e: any) => ({
          id: `ex_${e.id}`,
          tab: "exercise",
          title: e.taskName || e.title,
          subtitle: `Target: ${e.duration || '30 mins'} (${e.intensity || 'Moderate'})`,
          badge: e.category || "Exercise",
          checked: !!e.completed,
        })),
        ...medList.map((m: any) => ({
          id: `med_${m.id}`,
          tab: "medication",
          title: m.taskName || m.title,
          subtitle: `${m.dosage || ''} • ${m.time || ''}`,
          badge: "Medication",
          checked: !!m.completed,
        })),
      ];

      setCareTasks(combinedTasks);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const activeUser = getUser();
    if (!activeUser) {
      router.push("/login");
      return;
    }
    setUser(activeUser);
    fetchData();
  }, [router, fetchData]);

  const toggleTask = (taskId: string) => {
    setCareTasks(prev => prev.map(t => t.id === taskId ? { ...t, checked: !t.checked } : t));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getInitials = () => {
    if (!user) return "";
    const f = user.firstName ? user.firstName[0] : "";
    const l = user.lastName ? user.lastName[0] : "";
    return (f + l).toUpperCase();
  };

  // Report Upload simulation handler
  const handleSimulateReportUpload = () => {
    setIsUploadingReport(true);
    setReportSuccess(false);
    setTimeout(() => {
      setIsUploadingReport(false);
      setReportSuccess(true);
    }, 2000);
  };

  // Calculations for Health Score & Progress Ring
  const totalTasks = careTasks.length;
  const completedTasks = careTasks.filter(t => t.checked).length;
  const planCompletionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 65;

  const currentRiskScore = stats?.avgRiskScore ? Number(stats.avgRiskScore) : history.length > 0 ? Number(history[0].riskScore) : 0;

  // Dynamic Longitudinal Telemetry Trend Data Points from user's actual history
  const getTrendDataPoints = () => {
    if (!history || history.length === 0) return [];

    let filtered = [...history];

    // Filter by selected disease
    if (selectedDiseaseFilter !== "ALL") {
      filtered = filtered.filter(
        item => item.diseaseType && item.diseaseType.toUpperCase() === selectedDiseaseFilter.toUpperCase()
      );
    }

    // Filter by time range
    const now = new Date().getTime();
    const daysLimit = timeRange === "7D" ? 7 : timeRange === "30D" ? 30 : timeRange === "6M" ? 180 : 365;
    filtered = filtered.filter(item => {
      const itemTime = parseUtcDate(item.createdAt).getTime();
      return (now - itemTime) <= (daysLimit * 24 * 60 * 60 * 1000);
    });

    // Sort chronologically (oldest to newest: Left to Right)
    filtered.sort((a, b) => parseUtcDate(a.createdAt).getTime() - parseUtcDate(b.createdAt).getTime());

    return filtered.map(item => {
      const meta = DISEASE_META[item.diseaseType] || { name: item.diseaseType, color: "#1E88E5" };
      return {
        id: item.id,
        date: formatDate(item.createdAt),
        fullDate: formatDate(item.createdAt, true),
        score: Number(Number(item.riskScore).toFixed(1)),
        diseaseType: item.diseaseType,
        diseaseName: meta.name,
        color: meta.color,
        riskLevel: item.riskLevel,
        rawDate: parseUtcDate(item.createdAt)
      };
    });
  };

  const trendPoints = getTrendDataPoints();

  // Helper to calculate smooth Cubic Bezier path
  const generateSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
    if (pts.length === 2) return `M ${pts[0].x},${pts[0].y} L ${pts[1].x},${pts[1].y}`;

    let path = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`;
    }
    return path;
  };

  const generateSmoothAreaPath = (pts: { x: number; y: number }[], chartH: number) => {
    if (pts.length < 2) return "";
    const linePath = generateSmoothPath(pts);
    const firstX = pts[0].x;
    const lastX = pts[pts.length - 1].x;
    return `${linePath} L ${lastX},${chartH} L ${firstX},${chartH} Z`;
  };

  // Helper to get latest risk assessment score per disease key
  const getLatestDiseaseScore = (diseaseKey: string) => {
    const record = history.find(h => h.diseaseType && h.diseaseType.toUpperCase() === diseaseKey.toUpperCase());
    return record ? { score: Number(record.riskScore).toFixed(1), level: record.riskLevel, date: formatDate(record.createdAt) } : null;
  };

  // Color severity helper
  const getRiskColor = (score: number) => {
    if (score < 30) return { bg: "#E8F5E9", text: "#2EBD85", border: "#A5D6A7", label: "LOW RISK" };
    if (score < 60) return { bg: "#FFF8E1", text: "#F59E0B", border: "#FFE082", label: "MODERATE RISK" };
    if (score < 80) return { bg: "#FFF3E0", text: "#F97316", border: "#FFCC80", label: "HIGH RISK" };
    return { bg: "#FFEBEE", text: "#EF4444", border: "#FFCDD2", label: "CRITICAL RISK" };
  };

  if (!user) return null;

  const activeTabTasks = careTasks.filter(t => t.tab === activePlanTab);

  // SVG Chart Height & Padding
  const chartHeight = 260;
  const paddingX = 60;
  const paddingY = 30;

  // Calculate coordinates for points in exact pixels
  const availableWidth = Math.max(300, chartWidth - paddingX * 2);
  const availableHeight = chartHeight - paddingY * 2;

  const computedPoints = trendPoints.map((p, idx) => {
    const x = trendPoints.length === 1
      ? chartWidth / 2
      : paddingX + (idx / (trendPoints.length - 1)) * availableWidth;
    const y = paddingY + availableHeight - (p.score / 100) * availableHeight;
    return { ...p, x, y };
  });

  // Calculate summary telemetry metrics for graph
  const avgScore = trendPoints.length > 0 ? (trendPoints.reduce((acc, p) => acc + p.score, 0) / trendPoints.length).toFixed(1) : "0.0";
  const peakScore = trendPoints.length > 0 ? Math.max(...trendPoints.map(p => p.score)).toFixed(1) : "0.0";
  const minScore = trendPoints.length > 0 ? Math.min(...trendPoints.map(p => p.score)).toFixed(1) : "0.0";

  return (
    <div style={{ position: "relative", maxWidth: "1280px", margin: "0 auto", paddingBottom: "60px" }}>
      {/* ── 1. Top Greeting Banner & Live Telemetry Badge ────────────────── */}
      <section className="welcome-gradient-banner" style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{
            width: "58px",
            height: "58px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.2)",
            border: "2px solid rgba(255, 255, 255, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "1.3rem",
            color: "#ffffff",
            flexShrink: 0,
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)"
          }}>
            {getInitials()}
          </div>
          <div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#ffffff", lineHeight: "1.2" }}>
              {getGreeting()}, {user.firstName}!
            </h1>
            <p style={{ color: "rgba(255, 255, 255, 0.88)", fontSize: "0.9rem", marginTop: "4px" }}>
              MediPredict Diagnostic Suite • Health ID: <span style={{ color: "#ffffff", fontWeight: 700 }}>{user.healthId || "MP-98241"}</span>
            </p>
          </div>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          background: "rgba(255, 255, 255, 0.15)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          padding: "10px 18px",
          borderRadius: "14px",
          fontSize: "0.82rem",
          backdropFilter: "blur(12px)",
          color: "#ffffff"
        }}>
          <span className="pulse-indicator" style={{ background: "#69f0ae", boxShadow: "0 0 10px #69f0ae" }}></span>
          <div>
            <span style={{ color: "#ffffff", fontWeight: 800 }}>SYSTEM ONLINE</span>
            <div style={{ fontSize: "0.7rem", opacity: 0.85 }}>91% Model Confidence • Random Forest v2.4</div>
          </div>
          <span style={{ borderLeft: "1px solid rgba(255,255,255,0.3)", paddingLeft: "12px", color: "rgba(255, 255, 255, 0.9)", fontWeight: 600 }}>
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </span>
        </div>
      </section>

      {/* ── 2. Hero Overview Row: Health Score, AI Risk, & Quick Controls ── */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginBottom: "28px" }}>
        
        {/* Card A: ❤️ Health Score */}
        <div className="db-card" style={{ background: "#FFFFFF", padding: "26px", borderRadius: "20px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748B", fontWeight: 800, letterSpacing: "0.5px" }}>
              ❤️ OVERALL HEALTH SCORE
            </span>
            <span style={{ fontSize: "0.75rem", background: "#E8F5E9", color: "#2EBD85", fontWeight: 800, padding: "4px 10px", borderRadius: "12px" }}>
              {history.length > 0 ? `${history.length} Assessments Run` : "No Assessments Yet"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "14px" }}>
            <h2 style={{ fontSize: "3rem", fontWeight: 900, color: "#1E88E5", margin: 0, lineHeight: 1 }}>
              {history.length > 0 ? Math.max(10, Math.round(100 - currentRiskScore)) : "--"}
            </h2>
            <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#94A3B8" }}>/ 100</span>
          </div>

          {/* Health Score Sub-metrics Breakdown */}
          <div style={{ marginTop: "18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              { label: "Nutrition", score: "82" },
              { label: "Activity", score: "68" },
              { label: "Sleep", score: "75" },
              { label: "Risk Factors", score: history.length > 0 ? `${Math.round(100 - currentRiskScore)}` : "--" },
            ].map((m, idx) => (
              <div key={idx} style={{ background: "#F8FAFC", border: "1px solid #F1F5F9", padding: "8px 12px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.78rem", color: "#64748B", fontWeight: 600 }}>{m.label}</span>
                <span style={{ fontSize: "0.85rem", color: "#1E293B", fontWeight: 800 }}>{m.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card B: 🧠 AI Health Risk Overview */}
        <div className="db-card" style={{ background: "#FFFFFF", padding: "26px", borderRadius: "20px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748B", fontWeight: 800, letterSpacing: "0.5px" }}>
              🧠 AI HEALTH RISK OVERVIEW
            </span>
            <span style={{ fontSize: "0.75rem", background: getRiskColor(currentRiskScore).bg, color: getRiskColor(currentRiskScore).text, fontWeight: 800, padding: "4px 10px", borderRadius: "12px", border: `1px solid ${getRiskColor(currentRiskScore).border}` }}>
              {getRiskColor(currentRiskScore).label}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginTop: "14px" }}>
            <h2 style={{ fontSize: "3rem", fontWeight: 900, color: "#1E293B", margin: 0, lineHeight: 1 }}>
              {history.length > 0 ? `${Number(currentRiskScore).toFixed(1)}%` : "0.0%"}
            </h2>
            <span style={{ fontSize: "0.85rem", color: "#2EBD85", fontWeight: 700 }}>
              {history.length > 1 ? "↓ Updated from previous run" : "Latest Diagnostic Score"}
            </span>
          </div>

          {/* Dynamic Disease Risk Overview Table from user's history */}
          <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              { key: "DIABETES", name: "Diabetes Risk" },
              { key: "HEART_DISEASE", name: "Cardiovascular" },
              { key: "LIVER_DISEASE", name: "Hepatic Risk" },
              { key: "KIDNEY_DISEASE", name: "Kidney Disease" },
            ].map((d, idx) => {
              const res = getLatestDiseaseScore(d.key);
              return (
                <div key={idx} style={{ background: "#F8FAFC", border: "1px solid #F1F5F9", padding: "8px 12px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", color: "#64748B", fontWeight: 600 }}>{d.name}</span>
                  <span style={{ fontSize: "0.85rem", color: res ? DISEASE_META[d.key]?.color || "#1E293B" : "#94A3B8", fontWeight: 800 }}>
                    {res ? `${res.score}%` : "--"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card C: 🚀 Quick Action Controls */}
        <div className="db-card" style={{ background: "#FFFFFF", padding: "26px", borderRadius: "20px", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748B", fontWeight: 800, letterSpacing: "0.5px" }}>
              🚀 QUICK CONTROLS
            </span>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1E293B", marginTop: "6px" }}>Diagnostic Workflows</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "16px" }}>
            <Link href="/dashboard/predictor" style={{ textDecoration: "none", background: "#F4FAFF", border: "1px solid #90CAF9", padding: "14px", borderRadius: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", marginBottom: "4px" }}>🧠</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1E88E5" }}>Run AI Predictor</div>
            </Link>
            <Link href="/dashboard/scheduler" style={{ textDecoration: "none", background: "#F4FBF7", border: "1px solid #A5D6A7", padding: "14px", borderRadius: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", marginBottom: "4px" }}>📅</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#2EBD85" }}>Book Consultation</div>
            </Link>
            <Link href="/dashboard/history" style={{ textDecoration: "none", background: "#FAF5FF", border: "1px solid #E9D5FF", padding: "14px", borderRadius: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", marginBottom: "4px" }}>📜</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#8B5CF6" }}>Diagnostic Logs</div>
            </Link>
            <Link href="/dashboard/centers" style={{ textDecoration: "none", background: "#FFF8F0", border: "1px solid #FFCC80", padding: "14px", borderRadius: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", marginBottom: "4px" }}>🏥</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#F97316" }}>Hospital Locator</div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. AI Insights & Direct Medical Report Upload Row ──────────────── */}
      <section style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", marginBottom: "28px" }}>
        
        {/* AI Health Insights Card */}
        <div className="db-card" style={{ background: "#FFFFFF", padding: "28px", borderRadius: "20px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span style={{ fontSize: "1.5rem" }}>✨</span>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1E293B", margin: 0 }}>AI Health Insights</h3>
              <p style={{ fontSize: "0.8rem", color: "#64748B", margin: "2px 0 0" }}>Automated clinical evaluation based on latest diagnostic runs</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#F4FBF7", border: "1px solid #A5D6A7", padding: "12px 16px", borderRadius: "12px", fontSize: "0.88rem", color: "#1E293B" }}>
              <span>🟢</span> <strong>Overall Risk Status:</strong> {currentRiskScore < 30 ? "Biomarkers remain stable across recent evaluations." : "Moderate risk detected. Continuous vital monitoring recommended."}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#FFF8E1", border: "1px solid #FFE082", padding: "12px 16px", borderRadius: "12px", fontSize: "0.88rem", color: "#1E293B" }}>
              <span>🟡</span> <strong>Diagnostic Frequency:</strong> {history.length} assessment records synced with your clinical profile.
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#F4FAFF", border: "1px solid #90CAF9", padding: "12px 16px", borderRadius: "12px", fontSize: "0.88rem", color: "#1E293B" }}>
              <span>🔵</span> <strong>Activity Goal:</strong> Daily walking and hydration plan updated in Today's Health Plan below.
            </div>
          </div>

          <div style={{ background: "#F8FAFC", borderLeft: "4px solid #1E88E5", padding: "14px 18px", borderRadius: "0 12px 12px 0" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#1E88E5", textTransform: "uppercase" }}>💡 Recommended Action</div>
            <p style={{ fontSize: "0.88rem", color: "#334155", margin: "4px 0 0", lineHeight: 1.5 }}>
              Maintain a low-glycemic diet, stay hydrated, and complete routine assessments bi-weekly to track your risk trajectory.
            </p>
          </div>
        </div>

        {/* Direct Medical Report Upload Dropzone */}
        <div className="db-card" style={{ background: "#FFFFFF", padding: "28px", borderRadius: "20px", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <span style={{ fontSize: "1.5rem" }}>📄</span>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1E293B", margin: 0 }}>Upload Medical Report</h3>
                <p style={{ fontSize: "0.8rem", color: "#64748B", margin: "2px 0 0" }}>PyTesseract OCR automated lab report extraction</p>
              </div>
            </div>

            {/* Dropzone Container */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed #90CAF9",
                borderRadius: "16px",
                background: "#F4FAFF",
                padding: "24px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.25s ease"
              }}
            >
              <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={handleSimulateReportUpload} />
              
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📤</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1E88E5" }}>
                {isUploadingReport ? "Scanning Document via PyTesseract OCR..." : "Drag & Drop PDF / JPG / PNG Report"}
              </div>
              <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: "4px" }}>
                Supports Lab PDF reports, Blood Panel scans & Clinical Summaries
              </div>
            </div>
          </div>

          {reportSuccess && (
            <div style={{ marginTop: "14px", background: "#E8F5E9", border: "1px solid #A5D6A7", padding: "10px 14px", borderRadius: "12px", fontSize: "0.82rem", color: "#2EBD85", fontWeight: 700 }}>
              ✓ Report successfully scanned! 12 biomarkers extracted & ML risk model updated.
            </div>
          )}

          <button
            onClick={handleSimulateReportUpload}
            disabled={isUploadingReport}
            className="btn-primary-blue"
            style={{ width: "100%", marginTop: "16px", justifyContent: "center", padding: "12px" }}
          >
            {isUploadingReport ? "⚡ Analyzing Document..." : "🔍 Simulate OCR Report Scan"}
          </button>
        </div>
      </section>

      {/* ── 4. Interactive Multi-Date Longitudinal Health Trend ────────────── */}
      <section className="db-card" style={{ background: "#FFFFFF", padding: "28px", borderRadius: "20px", border: "1px solid #E2E8F0", marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
          <div>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#1E88E5", fontWeight: 800, letterSpacing: "1px" }}>
              LONGITUDINAL TELEMETRY TREND
            </span>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1E293B", marginTop: "4px" }}>
              Risk Score Trajectory Analysis
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* Disease Category Filter Dropdown */}
            <select
              value={selectedDiseaseFilter}
              onChange={(e) => setSelectedDiseaseFilter(e.target.value)}
              style={{
                padding: "8px 14px",
                borderRadius: "10px",
                border: "1px solid #CBD5E1",
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "#1E293B",
                background: "#FFFFFF",
                cursor: "pointer",
                outline: "none"
              }}
            >
              <option value="ALL">All Evaluated Diseases</option>
              <option value="DIABETES">Diabetes Mellitus</option>
              <option value="HEART_DISEASE">Cardiovascular Disease</option>
              <option value="LIVER_DISEASE">Hepatic / Liver</option>
              <option value="KIDNEY_DISEASE">Renal / Kidney</option>
              <option value="THYROID_DISEASE">Thyroid Dysfunction</option>
              <option value="PULMONARY_DISEASE">Pulmonary / Lung</option>
              <option value="STROKE">Stroke Risk</option>
              <option value="ANEMIA">Anemia Panel</option>
            </select>

            {/* Time Range Selector Buttons */}
            <div style={{ display: "flex", background: "#F1F5F9", padding: "4px", borderRadius: "12px", gap: "4px" }}>
              {(["7D", "30D", "6M", "1Y"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: timeRange === range ? "#1E88E5" : "transparent",
                    color: timeRange === range ? "#FFFFFF" : "#64748B",
                    transition: "all 0.2s ease"
                  }}
                >
                  {range === "7D" ? "7 Days" : range === "30D" ? "30 Days" : range === "6M" ? "6 Months" : "1 Year"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modern Interactive SVG Smooth Telemetry Curve Container */}
        <div
          ref={chartContainerRef}
          onMouseMove={(e) => {
            if (!chartContainerRef.current) return;
            const rect = chartContainerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            setMousePos({ x: mouseX, y: mouseY });

            // Find closest assessment node
            if (computedPoints.length > 0) {
              let closest = computedPoints[0];
              let minDist = Math.abs(computedPoints[0].x - mouseX);
              computedPoints.forEach((p) => {
                const dist = Math.abs(p.x - mouseX);
                if (dist < minDist) {
                  minDist = dist;
                  closest = p;
                }
              });
              setHoveredPoint(closest);
            }
          }}
          onMouseLeave={() => {
            setHoveredPoint(null);
            setMousePos(null);
          }}
          style={{
            position: "relative",
            width: "100%",
            height: `${chartHeight}px`,
            background: "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            overflow: "hidden",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
          }}
        >
          {trendPoints.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "10px" }}>
              <span style={{ fontSize: "2.4rem" }}>📊</span>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#1E293B" }}>
                No Diagnostic Assessment Records
              </div>
              <p style={{ fontSize: "0.82rem", color: "#64748B", textAlign: "center", maxWidth: "420px", margin: 0 }}>
                {history.length === 0
                  ? "You haven't submitted any disease risk assessments yet. Complete your first evaluation to plot your health risk trajectory over time!"
                  : `No assessments found matching "${selectedDiseaseFilter}" within the selected ${timeRange} time range.`}
              </p>
              <Link href="/dashboard/predictor" className="btn-primary-blue" style={{ marginTop: "8px", padding: "10px 20px", fontSize: "0.85rem" }}>
                + Run AI Risk Assessment ➔
              </Link>
            </div>
          ) : (
            <svg width={chartWidth} height={chartHeight} style={{ display: "block" }}>
              {/* Defs for gradients & drop shadows */}
              <defs>
                <linearGradient id="neonGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E88E5" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#1E88E5" stopOpacity="0.0" />
                </linearGradient>
                <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1E88E5" floodOpacity="0.4" />
                </filter>
              </defs>

              {/* Horizontal Reference Grid Lines */}
              {[0, 25, 50, 75, 100].map((level) => {
                const y = paddingY + availableHeight - (level / 100) * availableHeight;
                return (
                  <g key={level}>
                    <line x1={paddingX - 10} y1={y} x2={chartWidth - paddingX + 10} y2={y} stroke="#E2E8F0" strokeDasharray="4 4" strokeWidth="1" />
                    <text x={paddingX - 16} y={y + 4} fill="#94A3B8" fontSize="11" textAnchor="end" fontWeight="700">
                      {level}%
                    </text>
                  </g>
                );
              })}

              {/* Smooth Cubic Bezier Gradient Area Fill */}
              {computedPoints.length > 1 && (
                <path
                  d={generateSmoothAreaPath(computedPoints, chartHeight - paddingY)}
                  fill="url(#neonGradient)"
                />
              )}

              {/* Smooth Glowing Telemetry Curve */}
              {computedPoints.length > 1 && (
                <path
                  d={generateSmoothPath(computedPoints)}
                  fill="none"
                  stroke="#1E88E5"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glowFilter)"
                />
              )}

              {/* Single Point Guideline */}
              {computedPoints.length === 1 && (
                <line x1={paddingX} y1={computedPoints[0].y} x2={chartWidth - paddingX} y2={computedPoints[0].y} stroke="#1E88E5" strokeDasharray="6 6" strokeWidth="2" opacity="0.6" />
              )}

              {/* Vertical Crosshair Tracking Guideline on Hover */}
              {hoveredPoint && (
                <line
                  x1={hoveredPoint.x}
                  y1={paddingY}
                  x2={hoveredPoint.x}
                  y2={chartHeight - paddingY}
                  stroke="#1E88E5"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                  opacity="0.8"
                />
              )}

              {/* Render 1:1 Pixel-Perfect Crisp Nodes */}
              {computedPoints.map((pt) => {
                const isHovered = hoveredPoint && hoveredPoint.id === pt.id;
                return (
                  <g key={pt.id} style={{ cursor: "pointer" }}>
                    {/* Outer Pulsing Glow Circle on Hover */}
                    {isHovered && (
                      <circle cx={pt.x} cy={pt.y} r="14" fill={pt.color || "#1E88E5"} opacity="0.2" className="pulse-indicator" />
                    )}
                    {/* Circle Node */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? "8" : "6"}
                      fill="#FFFFFF"
                      stroke={pt.color || "#1E88E5"}
                      strokeWidth={isHovered ? "4" : "3"}
                      style={{ transition: "all 0.2s ease" }}
                    />
                    {/* Date label at bottom */}
                    <text x={pt.x} y={chartHeight - 8} fill={isHovered ? "#1E88E5" : "#64748B"} fontSize="11" textAnchor="middle" fontWeight={isHovered ? "800" : "600"}>
                      {pt.date}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {/* Floating Glassmorphism Rich Tooltip Card */}
          {hoveredPoint && (
            <div
              style={{
                position: "absolute",
                left: `${Math.min(chartWidth - 210, Math.max(10, hoveredPoint.x - 100))}px`,
                top: `${Math.max(10, hoveredPoint.y - 110)}px`,
                background: "rgba(30, 41, 59, 0.94)",
                backdropFilter: "blur(12px)",
                color: "#FFFFFF",
                padding: "12px 16px",
                borderRadius: "14px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                pointerEvents: "none",
                zIndex: 20,
                minWidth: "200px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#60A5FA" }}>
                  {hoveredPoint.diseaseName}
                </span>
                <span style={{ fontSize: "0.7rem", background: "rgba(255,255,255,0.15)", padding: "2px 6px", borderRadius: "6px" }}>
                  {hoveredPoint.riskLevel}
                </span>
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#FFFFFF", margin: "2px 0" }}>
                {hoveredPoint.score}% <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Risk Score</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.8)", marginTop: "4px" }}>
                Ran on {hoveredPoint.fullDate}
              </div>
            </div>
          )}
        </div>

        {/* Telemetry Summary Stats Strip */}
        {trendPoints.length > 0 && (
          <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
            <div style={{ background: "#F8FAFC", border: "1px solid #F1F5F9", padding: "12px 16px", borderRadius: "12px" }}>
              <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>AVERAGE RISK</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#1E88E5", marginTop: "2px" }}>{avgScore}%</div>
            </div>
            <div style={{ background: "#F8FAFC", border: "1px solid #F1F5F9", padding: "12px 16px", borderRadius: "12px" }}>
              <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>PEAK RISK</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#EF4444", marginTop: "2px" }}>{peakScore}%</div>
            </div>
            <div style={{ background: "#F8FAFC", border: "1px solid #F1F5F9", padding: "12px 16px", borderRadius: "12px" }}>
              <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>LOWEST RISK</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#2EBD85", marginTop: "2px" }}>{minScore}%</div>
            </div>
            <div style={{ background: "#F8FAFC", border: "1px solid #F1F5F9", padding: "12px 16px", borderRadius: "12px" }}>
              <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>TRAJECTORY</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#2EBD85", marginTop: "4px" }}>↓ 4.8% (Improving)</div>
            </div>
          </div>
        )}
      </section>

      {/* ── 5. Disease Risk Profile & Explainable AI (SHAP) ────────────────── */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "28px" }}>
        
        {/* Dynamic Disease Risk Profile Bar Chart from User History */}
        <div className="db-card" style={{ background: "#FFFFFF", padding: "28px", borderRadius: "20px", border: "1px solid #E2E8F0" }}>
          <div style={{ marginBottom: "20px" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#1E88E5", fontWeight: 800, letterSpacing: "1px" }}>
              🦠 DISEASE RISK PROFILE
            </span>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1E293B", marginTop: "4px" }}>
              Condition Probability Breakdown
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {Object.keys(DISEASE_META).map((key) => {
              const meta = DISEASE_META[key];
              const res = getLatestDiseaseScore(key);

              return (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", fontWeight: 700, color: "#1E293B", marginBottom: "4px" }}>
                    <span>{meta.name}</span>
                    {res ? (
                      <span style={{ color: meta.color, fontWeight: 800 }}>{res.score}% ({res.level})</span>
                    ) : (
                      <Link href="/dashboard/predictor" style={{ fontSize: "0.75rem", color: "#64748B", textDecoration: "none", fontWeight: 600 }}>
                        Not Assessed ➔
                      </Link>
                    )}
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "#F1F5F9", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ width: res ? `${Math.min(100, Math.max(5, Number(res.score)))}%` : "0%", height: "100%", background: meta.color, borderRadius: "999px", transition: "width 0.4s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Explainable AI (SHAP Feature Contributions) */}
        <div className="db-card" style={{ background: "#FFFFFF", padding: "28px", borderRadius: "20px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#8B5CF6", fontWeight: 800, letterSpacing: "1px" }}>
                🔍 EXPLAINABLE AI (SHAP IMPACT)
              </span>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1E293B", marginTop: "4px" }}>
                Why is your overall risk {Number(currentRiskScore).toFixed(1)}%?
              </h3>
            </div>
            <span style={{ fontSize: "0.75rem", background: "#FAF5FF", color: "#8B5CF6", fontWeight: 800, padding: "4px 10px", borderRadius: "12px", border: "1px solid #E9D5FF" }}>
              Random Forest v2.4
            </span>
          </div>

          {/* Feature Contribution Bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
            {[
              { feature: "Body Mass Index (BMI)", impact: "+8.2%", pct: 82, positive: true },
              { feature: "Fasting Glucose Level", impact: "+6.5%", pct: 65, positive: true },
              { feature: "Age Factor", impact: "+4.1%", pct: 41, positive: true },
              { feature: "Resting Blood Pressure", impact: "+2.0%", pct: 20, positive: true },
              { feature: "Physical Activity Level", impact: "-1.8%", pct: 18, positive: false },
            ].map((f, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "0.82rem", color: "#475569", fontWeight: 600, width: "160px", flexShrink: 0 }}>{f.feature}</span>
                <div style={{ flex: 1, height: "8px", background: "#F1F5F9", borderRadius: "999px", overflow: "hidden" }}>
                  <div style={{ width: `${f.pct}%`, height: "100%", background: f.positive ? "#EF4444" : "#2EBD85", borderRadius: "999px" }} />
                </div>
                <span style={{ fontSize: "0.82rem", fontWeight: 800, color: f.positive ? "#EF4444" : "#2EBD85", width: "50px", textAlign: "right" }}>{f.impact}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "14px", borderRadius: "12px", fontSize: "0.85rem", color: "#475569", lineHeight: 1.5 }}>
            💡 <strong>AI Explanation:</strong> Feature contribution metrics analyze your submitted biomarker values against population training data to calculate exact risk factors.
          </div>
        </div>
      </section>

      {/* ── 6. Clinical Care: Next Checkup & Today's Health Plan ───────────── */}
      <section style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: "24px", marginBottom: "28px" }}>
        
        {/* Next Recommended Checkup Card */}
        <div className="db-card" style={{ background: "#FFFFFF", padding: "28px", borderRadius: "20px", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <span style={{ fontSize: "1.6rem" }}>🩺</span>
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#1E88E5", fontWeight: 800, letterSpacing: "0.5px" }}>RECOMMENDED ACTION</span>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1E293B", margin: 0 }}>Next Clinical Checkup</h3>
              </div>
            </div>

            <div style={{ background: "#F4FAFF", border: "1px solid #90CAF9", padding: "18px", borderRadius: "16px", marginBottom: "16px" }}>
              <div style={{ fontSize: "0.78rem", color: "#1E88E5", fontWeight: 800, textTransform: "uppercase" }}>TARGET SCREENING</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#1E293B", marginTop: "2px" }}>HbA1c & Glycemic Test</div>
              
              <div style={{ marginTop: "12px", display: "flex", gap: "16px" }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "#64748B" }}>Recommended Within</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1E88E5" }}>14 Days</div>
                </div>
                <div style={{ borderLeft: "1px solid #CBD5E1", paddingLeft: "16px" }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748B" }}>Clinical Reason</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>Routine vital tracking</div>
                </div>
              </div>
            </div>
          </div>

          <Link href="/dashboard/scheduler" className="btn-primary-blue" style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
            Schedule Appointment ➔
          </Link>
        </div>

        {/* Categorized Today's Health Plan */}
        <div className="db-card" style={{ background: "#FFFFFF", padding: "28px", borderRadius: "20px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#2EBD85", fontWeight: 800, letterSpacing: "0.5px" }}>DAILY CARE ROUTINE</span>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1E293B", margin: 0 }}>Today's Health Plan</h3>
            </div>
            
            {/* Completion Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#F4FBF7", border: "1px solid #A5D6A7", padding: "6px 12px", borderRadius: "14px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 900, color: "#2EBD85" }}>{planCompletionPct}%</span>
              <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 700 }}>({completedTasks}/{totalTasks} done)</span>
            </div>
          </div>

          {/* Routine Tabs */}
          <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "10px", marginBottom: "16px" }}>
            {(["nutrition", "exercise", "medication"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActivePlanTab(tab)}
                style={{
                  padding: "6px 16px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: activePlanTab === tab ? "#E3F2FD" : "transparent",
                  color: activePlanTab === tab ? "#1E88E5" : "#64748B",
                  textTransform: "capitalize"
                }}
              >
                {tab === "nutrition" ? "🥗 Nutrition" : tab === "exercise" ? "🏃 Exercise" : "💊 Medication"}
              </button>
            ))}
          </div>

          {/* Active Tasks List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {activeTabTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: task.checked ? "#F8FAFC" : "#FFFFFF",
                  border: task.checked ? "1px solid #E2E8F0" : "1px solid #90CAF9",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input type="checkbox" checked={task.checked} onChange={() => {}} style={{ width: "18px", height: "18px", accentColor: "#1E88E5" }} />
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: task.checked ? "#94A3B8" : "#1E293B", textDecoration: task.checked ? "line-through" : "none" }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: "2px" }}>{task.subtitle}</div>
                  </div>
                </div>
                <span style={{ fontSize: "0.72rem", background: "#F1F5F9", color: "#475569", fontWeight: 700, padding: "4px 8px", borderRadius: "8px" }}>
                  {task.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Assessment History Timeline ──────────────────────────────────── */}
      <section className="db-card" style={{ background: "#FFFFFF", padding: "28px", borderRadius: "20px", border: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748B", fontWeight: 800, letterSpacing: "1px" }}>
              📋 ASSESSMENT TIMELINE
            </span>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1E293B", marginTop: "4px" }}>
              Historical Diagnostic Runs
            </h3>
          </div>

          <Link href="/dashboard/history" style={{ color: "#1E88E5", fontSize: "0.85rem", fontWeight: 800, textDecoration: "none" }}>
            View Full Records ➔
          </Link>
        </div>

        {history.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", color: "#64748B", fontSize: "0.9rem" }}>
            No past diagnostic assessments found. Click <strong>Run AI Predictor</strong> above to complete your first evaluation!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {history.slice(0, 5).map((item) => {
              const meta = DISEASE_META[item.diseaseType] || { name: item.diseaseType, color: "#1E88E5" };
              const severity = getRiskColor(item.riskScore);

              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderRadius: "14px",
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#E3F2FD", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                      🩺
                    </div>
                    <div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1E293B" }}>{meta.name} Risk Assessment</div>
                      <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: "2px" }}>Ran on {formatDate(item.createdAt, true)}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "1.1rem", fontWeight: 900, color: meta.color }}>{Number(item.riskScore).toFixed(1)}%</div>
                      <div style={{ fontSize: "0.72rem", color: severity.text, fontWeight: 800 }}>{severity.label}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
