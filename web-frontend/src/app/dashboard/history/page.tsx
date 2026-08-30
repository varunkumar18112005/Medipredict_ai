"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import api, { getUser } from "../../../services/api";
import CustomDropdown from "../../../components/CustomDropdown";
import BorderGlow from "@/components/BorderGlow";

interface AssessmentHistory {
  id: number;
  diseaseType: string;
  riskScore: number;
  riskLevel: string;
  riskTrend: number;
  status: string;
  createdAt: string;
  inputDataJson?: string;
}

const METRICS_CONFIG: Record<string, { label: string; unit: string; key: string }[]> = {
  DIABETES: [
    { key: "glucose", label: "Glucose Concentration", unit: "mg/dL" },
    { key: "bmi", label: "Body Mass Index", unit: "" },
    { key: "bloodPressure", label: "Resting Blood Pressure", unit: "mmHg" },
    { key: "pregnancies", label: "Pregnancies", unit: "" },
    { key: "insulin", label: "Insulin", unit: "uU/mL" },
    { key: "skinThickness", label: "Skin Thickness", unit: "mm" },
    { key: "dpf", label: "Diabetes Pedigree Function", unit: "" },
    { key: "age", label: "Age", unit: "years" },
  ],
  HEART_DISEASE: [
    { key: "cholesterol", label: "Serum Cholesterol", unit: "mg/dL" },
    { key: "restingBP", label: "Resting Blood Pressure", unit: "mmHg" },
    { key: "heartRate", label: "Maximum Heart Rate", unit: "BPM" },
    { key: "bmi", label: "Body Mass Index", unit: "" },
    { key: "age", label: "Age", unit: "years" },
  ],
  LIVER_DISEASE: [
    { key: "totalBilirubin", label: "Total Bilirubin", unit: "mg/dL" },
    { key: "alkalinePhosphotase", label: "Alkaline Phosphotase", unit: "U/L" },
    { key: "altaminoTransferase", label: "ALT / SGPT", unit: "U/L" },
    { key: "aspartateAminoTransferase", label: "AST / SGOT", unit: "U/L" },
  ],
  KIDNEY_DISEASE: [
    { key: "serumCreatinine", label: "Serum Creatinine", unit: "mg/dL" },
    { key: "bloodUrea", label: "Blood Urea", unit: "mg/dL" },
    { key: "haemoglobin", label: "Haemoglobin", unit: "g/dL" },
    { key: "sodium", label: "Sodium", unit: "mEq/L" },
  ],
  THYROID_DISEASE: [
    { key: "tsh", label: "Thyroid Stimulating Hormone", unit: "uIU/mL" },
    { key: "t3", label: "Free T3", unit: "pg/mL" },
    { key: "t4", label: "Free T4", unit: "ng/dL" },
    { key: "age", label: "Age", unit: "years" }
  ],
  PULMONARY_DISEASE: [
    { key: "oxygenSaturation", label: "Oxygen Saturation", unit: "%" },
    { key: "fev1FvcRatio", label: "FEV1/FVC Ratio", unit: "" },
    { key: "respiratoryRate", label: "Respiratory Rate", unit: "breaths/min" },
    { key: "age", label: "Age", unit: "years" }
  ],
  STROKE: [
    { key: "avgGlucoseLevel", label: "Average Blood Glucose Level", unit: "mg/dL" },
    { key: "bloodPressure", label: "Systolic Blood Pressure", unit: "mmHg" },
    { key: "heartRate", label: "Resting Heart Rate", unit: "BPM" },
    { key: "age", label: "Age", unit: "years" }
  ],
  ANEMIA: [
    { key: "haemoglobin", label: "Hemoglobin Level", unit: "g/dL" },
    { key: "rbcCount", label: "Red Blood Cell Count", unit: "M/uL" },
    { key: "hematocrit", label: "Hematocrit", unit: "%" },
    { key: "age", label: "Age", unit: "years" }
  ]
};

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<AssessmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Chart selectors
  const [activeDisease, setActiveDisease] = useState<string>("DIABETES");
  const [activeMetric, setActiveMetric] = useState<string>("glucose");
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Helper to parse date string as UTC if no offset specified, returning local browser Date object
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

  // Helper to format dates and handle invalid or epoch dates robustly
  const formatDate = (dateInput: any, includeTime = true) => {
    if (!dateInput) return "Just now";
    const d = parseUtcDate(dateInput);
    if (d.getFullYear() === 1970) {
      return "Just now";
    }
    if (includeTime) {
      return d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get("/assessments?size=100");
      const logs = response.data.content || [];
      const sortedLogs = [...logs].sort((a, b) => parseUtcDate(b.createdAt).getTime() - parseUtcDate(a.createdAt).getTime());
      setHistory(sortedLogs);
      
      // Auto seed selectors to first available disease if possible
      if (sortedLogs.length > 0) {
        const first = sortedLogs[0].diseaseType.toUpperCase();
        setActiveDisease(first);
        const metrics = METRICS_CONFIG[first] || [];
        if (metrics.length > 0) {
          setActiveMetric(metrics[0].key);
        }
      }
    } catch (err) {
      console.error("Failed to load history:", err);
      setError("Failed to retrieve diagnostic log history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const activeUser = getUser();
    if (!activeUser) {
      router.push("/login");
      return;
    }
    setUser(activeUser);
    fetchHistory();

    const handleFocus = () => {
      fetchHistory();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [router]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this diagnostic log?")) return;

    try {
      await api.delete(`/assessments/${id}`);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      if (hoveredPoint && hoveredPoint.id === id) {
        setHoveredPoint(null);
        setHoveredIndex(null);
      }
    } catch (err) {
      console.error("Failed to delete log:", err);
      alert("Failed to delete diagnostic record.");
    }
  };

  const getDiseaseColor = (type: string) => {
    switch (type.toUpperCase()) {
      case "DIABETES": return "var(--primary)";
      case "HEART_DISEASE": return "var(--secondary)";
      case "LIVER_DISEASE": return "var(--accent)";
      case "KIDNEY_DISEASE": return "var(--success)";
      case "THYROID_DISEASE": return "#d946ef";
      case "PULMONARY_DISEASE": return "#06b6d4";
      case "STROKE": return "#f43f5e";
      case "ANEMIA": return "#f59e0b";
      default: return "#fff";
    }
  };

  const getGlowColor = (type: string) => {
    switch (type.toUpperCase()) {
      case "DIABETES": return "rgba(59, 130, 246, 0.25)";
      case "HEART_DISEASE": return "rgba(0, 242, 254, 0.25)";
      case "LIVER_DISEASE": return "rgba(255, 0, 127, 0.25)";
      case "KIDNEY_DISEASE": return "rgba(16, 185, 129, 0.25)";
      case "THYROID_DISEASE": return "rgba(217, 70, 239, 0.25)";
      case "PULMONARY_DISEASE": return "rgba(6, 182, 212, 0.25)";
      case "STROKE": return "rgba(244, 63, 94, 0.25)";
      case "ANEMIA": return "rgba(245, 158, 11, 0.25)";
      default: return "rgba(255, 255, 255, 0.15)";
    }
  };

  const formatDiseaseName = (type: string) => {
    return type.replace(/_/g, " ");
  };

  const handleDiseaseChange = (disease: string) => {
    setActiveDisease(disease);
    const metrics = METRICS_CONFIG[disease] || [];
    if (metrics.length > 0) {
      setActiveMetric(metrics[0].key);
    }
    setHoveredPoint(null);
    setHoveredIndex(null);
  };

  if (!user) return null;

  // Display all disease pipelines configured in the system
  const displayedDiseases = Object.keys(METRICS_CONFIG);

  // Filter and sort logs for the chart
  const chartLogs = history
    .filter((h) => h.diseaseType.toUpperCase() === activeDisease && h.status !== "FAILED")
    .sort((a, b) => parseUtcDate(a.createdAt).getTime() - parseUtcDate(b.createdAt).getTime());

  // Parse points to plot
  const points = chartLogs.map((log) => {
    try {
      const parsed = log.inputDataJson ? JSON.parse(log.inputDataJson) : {};
      const rawVal = parsed[activeMetric];
      if (rawVal === undefined || rawVal === null) return null;
      return {
        id: log.id,
        date: parseUtcDate(log.createdAt),
        value: Number(rawVal),
        riskScore: log.riskScore,
        riskLevel: log.riskLevel
      };
    } catch {
      return null;
    }
  }).filter((p): p is NonNullable<typeof p> => p !== null);

  const themeColor = getDiseaseColor(activeDisease);
  const glowColor = getGlowColor(activeDisease);
  const activeMetricObj = METRICS_CONFIG[activeDisease]?.find(m => m.key === activeMetric);
  const metricLabel = activeMetricObj ? `${activeMetricObj.label} (${activeMetricObj.unit || "unit"})` : activeMetric;

  // Chart scaling calculations
  const svgWidth = 800;
  const svgHeight = 280;
  const paddingX = 65;
  const paddingY = 40;

  let maxVal = 100;
  let minVal = 0;
  let svgPoints: any[] = [];
  let lineD = "";
  let areaD = "";
  let gridLines: any[] = [];

  if (points.length >= 2) {
    const values = points.map(p => p.value);
    const rawMax = Math.max(...values);
    const rawMin = Math.min(...values);

    if (rawMax === rawMin) {
      maxVal = rawMax + (rawMax === 0 ? 10 : rawMax * 0.1);
      minVal = rawMin - (rawMin === 0 ? 10 : rawMin * 0.1);
    } else {
      const diff = rawMax - rawMin;
      maxVal = rawMax + diff * 0.15;
      minVal = rawMin - diff * 0.15;
    }

    svgPoints = points.map((p, idx) => {
      const x = paddingX + (idx / (points.length - 1)) * (svgWidth - 2 * paddingX);
      const y = svgHeight - paddingY - ((p.value - minVal) / (maxVal - minVal)) * (svgHeight - 2 * paddingY);
      return { ...p, x, y };
    });

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

    lineD = getCurvedPath(svgPoints);
    areaD = `${lineD} L ${svgPoints[svgPoints.length - 1].x.toFixed(2)} ${svgHeight - paddingY} L ${svgPoints[0].x.toFixed(2)} ${svgHeight - paddingY} Z`;

    gridLines = [0, 0.33, 0.66, 1.0].map((t) => {
      const y = paddingY + t * (svgHeight - 2 * paddingY);
      const val = maxVal - t * (maxVal - minVal);
      return { y, val: val.toFixed(1) };
    });
  }

  // Trend calculation
  const valuesArray = points.map(p => p.value);
  const trendCount = points.length;
  const avgVal = trendCount > 0 ? valuesArray.reduce((s, c) => s + c, 0) / trendCount : 0;
  const lowestVal = trendCount > 0 ? Math.min(...valuesArray) : 0;
  const highestVal = trendCount > 0 ? Math.max(...valuesArray) : 0;
  
  let percentChange = 0;
  if (trendCount >= 2) {
    const first = points[0].value;
    const last = points[points.length - 1].value;
    if (first > 0) {
      percentChange = ((last - first) / first) * 100;
    }
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div style={{ marginBottom: "30px" }}>
        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>HISTORICAL DATA TELEMETRY</span>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#1e293b", marginTop: "8px" }}>
          Interactive Vitals Analytics
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Trace health trajectory history and explore glowing trend analysis charts.
        </p>
      </div>

      {error && (
        <div style={{
          background: "rgba(255, 51, 102, 0.1)",
          border: "1px solid var(--error)",
          borderRadius: "8px",
          padding: "12px",
          color: "var(--error)",
          fontSize: "0.85rem",
          marginBottom: "25px",
        }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "80px 0", textAlign: "center", color: "var(--text-muted)" }}>
          Retrieving historical diagnostic databases...
        </div>
      ) : history.length === 0 ? (
        <div className="card-3d" style={{ padding: "50px", textAlign: "center" }}>
          <span style={{ fontSize: "2rem", display: "block", marginBottom: "15px" }}>🗃️</span>
          <h3 style={{ fontSize: "1.2rem", color: "#1e293b", marginBottom: "8px" }}>No Diagnostic History Found</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "24px" }}>
            Complete an AI health assessment to generate diagnostic records.
          </p>
          <Link href="/dashboard" className="btn-3d" style={{ padding: "10px 24px", fontSize: "0.8rem" }}>
            Start Assessment
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          
          {/* Main Glowing Analytics Board */}
          <div className="card-3d" style={{ padding: "24px", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px", marginBottom: "24px" }}>
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Telemetry Stream</span>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1e293b", marginTop: "4px" }}>Time-Series Trend Baseline</h3>
              </div>
              
              {/* Dynamic Custom Dropdown Selectors */}
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", zIndex: 100 }}>
                <CustomDropdown
                  options={displayedDiseases.map((d) => ({
                    value: d,
                    label: formatDiseaseName(d)
                  }))}
                  value={activeDisease}
                  onChange={handleDiseaseChange}
                  style={{ minWidth: "190px" }}
                />
                
                <CustomDropdown
                  options={(METRICS_CONFIG[activeDisease] || []).map((m) => ({
                    value: m.key,
                    label: m.label
                  }))}
                  value={activeMetric}
                  onChange={(val) => {
                    setActiveMetric(val);
                    setHoveredPoint(null);
                    setHoveredIndex(null);
                  }}
                  style={{ minWidth: "220px" }}
                />
              </div>
            </div>

            {/* Glowing Chart Canvas */}
            <div style={{ position: "relative", width: "100%", height: `${svgHeight}px`, background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "12px", overflow: "visible" }}>
              {points.length < 2 ? (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "20px", color: "#64748B" }}>
                  <span style={{ fontSize: "1.5rem", marginBottom: "10px" }}>📈</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#263238", marginBottom: "4px" }}>Telemetry Graph Pending</span>
                  <p style={{ fontSize: "0.8rem", margin: 0, maxWidth: "420px", color: "#64748B" }}>
                    Visual tracking requires at least 2 completed assessments in the <strong>{formatDiseaseName(activeDisease)}</strong> category. Please submit another assessment to trace trends.
                  </p>
                </div>
              ) : (
                <>
                  <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="100%" style={{ overflow: "visible" }}>
                    <defs>
                      {/* Neon glow effect */}
                      <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      {/* Gradient fill */}
                      <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={themeColor} stopOpacity="0.18" />
                        <stop offset="100%" stopColor={themeColor} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Y-Axis Grid Lines & Labels */}
                    {gridLines.map((gl, i) => (
                      <g key={i}>
                        <line 
                          x1={paddingX} 
                          y1={gl.y} 
                          x2={svgWidth - paddingX} 
                          y2={gl.y} 
                          stroke="#E2E8F0" 
                          strokeDasharray="4,4" 
                        />
                        <text 
                          x={paddingX - 12} 
                          y={gl.y + 4} 
                          fill="#64748B" 
                          fontSize="10" 
                          textAnchor="end"
                          fontWeight="700"
                        >
                          {gl.val}
                        </text>
                      </g>
                    ))}

                    {/* Faded Area Path */}
                    <path d={areaD} fill="url(#area-grad)" />

                    {/* Glowing Trend Line Trace */}
                    <path 
                      d={lineD} 
                      fill="none" 
                      stroke={themeColor} 
                      strokeWidth="3.5" 
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#neon-glow)" 
                      style={{ transition: "stroke 0.3s" }}
                    />

                    {/* Interactive Data Node Nodes */}
                    {svgPoints.map((pt, idx) => {
                      const isHovered = hoveredIndex === idx;
                      return (
                        <g key={pt.id}>
                          {/* Outer highlight circle */}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 12 : 7}
                            fill={themeColor}
                            fillOpacity={isHovered ? "0.2" : "0.08"}
                            stroke={themeColor}
                            strokeWidth={isHovered ? "2.5" : "0"}
                            style={{ cursor: "pointer", transition: "all 0.2s" }}
                          />
                          {/* Inner solid circle */}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 6 : 4}
                            fill="#FFFFFF"
                            stroke={themeColor}
                            strokeWidth="2.5"
                            onMouseEnter={() => {
                              setHoveredPoint(pt);
                              setHoveredIndex(idx);
                            }}
                            onMouseLeave={() => {
                              setHoveredPoint(null);
                              setHoveredIndex(null);
                            }}
                            style={{ cursor: "pointer", transition: "all 0.2s" }}
                          />
                        </g>
                      );
                    })}

                    {/* Date labels on X-Axis */}
                    {svgPoints.length > 0 && (
                      <g>
                        {/* Start Label */}
                        <text x={svgPoints[0].x} y={svgHeight - paddingY + 22} fill="#64748B" fontSize="10.5" fontWeight="700" textAnchor="middle">
                          {formatDate(svgPoints[0].date, false)}
                        </text>
                        {/* End Label */}
                        <text x={svgPoints[svgPoints.length - 1].x} y={svgHeight - paddingY + 22} fill="#64748B" fontSize="10.5" fontWeight="700" textAnchor="middle">
                          {formatDate(svgPoints[svgPoints.length - 1].date, false)}
                        </text>
                        {/* Middle Label (if 3 or more points) */}
                        {svgPoints.length > 2 && (
                          <text 
                            x={svgPoints[Math.floor(svgPoints.length / 2)].x} 
                            y={svgHeight - paddingY + 22} 
                            fill="#64748B" 
                            fontSize="10.5" 
                            fontWeight="700" 
                            textAnchor="middle"
                          >
                            {formatDate(svgPoints[Math.floor(svgPoints.length / 2)].date, false)}
                          </text>
                        )}
                      </g>
                    )}
                  </svg>

                  {/* Interactive Pinned Glassy Tooltip Card */}
                  {hoveredPoint && (
                    <div style={{
                      position: "absolute",
                      left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                      top: `${(hoveredPoint.y / svgHeight) * 100 - 4}%`,
                      transform: "translate(-50%, -100%)",
                      background: "#FFFFFF",
                      backdropFilter: "blur(12px)",
                      border: `1.5px solid ${themeColor}`,
                      borderRadius: "12px",
                      padding: "12px 16px",
                      boxShadow: `0 10px 28px rgba(0, 0, 0, 0.12), 0 0 15px ${glowColor}`,
                      pointerEvents: "none",
                      zIndex: 10,
                      minWidth: "170px",
                      transition: "all 0.15s ease"
                    }}>
                      <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                        {formatDate(hoveredPoint.date, true)}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", margin: "4px 0" }}>
                        <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#263238" }}>
                          {hoveredPoint.value.toFixed(2)}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>
                          {activeMetricObj?.unit}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginTop: "6px", paddingTop: "6px", borderTop: "1px solid #E2E8F0" }}>
                        <span style={{ color: "#64748B", fontWeight: 600 }}>Risk Profile:</span>
                        <span style={{ 
                          fontWeight: 800,
                          color: hoveredPoint.riskLevel === "HIGH" ? "var(--error)" : hoveredPoint.riskLevel === "MODERATE" ? "var(--primary)" : "var(--success)"
                        }}>
                          {Number(hoveredPoint.riskScore).toFixed(1)}% {hoveredPoint.riskLevel}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Vitals Trend Analysis Summary Panel */}
            {points.length >= 2 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginTop: "24px" }}>
                
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px" }}>
                  <span style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "#64748B", fontWeight: 700 }}>Telemetry Average</span>
                  <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#263238", marginTop: "6px", display: "flex", alignItems: "baseline", gap: "4px" }}>
                    {avgVal.toFixed(1)}
                    <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>{activeMetricObj?.unit}</span>
                  </div>
                </div>

                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px" }}>
                  <span style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "#64748B", fontWeight: 700 }}>Peak Bounds (Min / Max)</span>
                  <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#263238", marginTop: "8px", display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ color: "var(--success)" }}>{lowestVal.toFixed(1)}</span>
                    <span style={{ color: "#64748B", fontSize: "0.8rem", fontWeight: 500 }}>/</span>
                    <span style={{ color: "var(--error)" }}>{highestVal.toFixed(1)}</span>
                  </div>
                </div>

                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px" }}>
                  <span style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "#64748B", fontWeight: 700 }}>Baseline Trend Shift</span>
                  <div style={{ fontSize: "1.4rem", fontWeight: 900, marginTop: "6px", color: percentChange > 0 ? "var(--error)" : (percentChange < 0 ? "var(--success)" : "#263238"), display: "flex", alignItems: "center", gap: "6px" }}>
                    {percentChange > 0 ? "▲" : (percentChange < 0 ? "▼" : "")}
                    {Math.abs(percentChange).toFixed(1)}%
                    <span style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 500 }}>since baseline</span>
                  </div>
                </div>

                <div style={{ gridColumn: "1 / -1", background: "#F8FAFC", border: `1px solid ${themeColor}30`, borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: themeColor, boxShadow: `0 0 10px ${themeColor}`, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.88rem", color: "#263238", lineHeight: 1.4 }}>
                    <strong>Clinical Trend Insight:</strong> Your overall <strong>{metricLabel.toLowerCase()}</strong> has shifted by <strong>{percentChange.toFixed(1)}%</strong> over a span of {trendCount} evaluations.{" "}
                    {percentChange > 5 ? (
                      <span style={{ color: "var(--error)", fontWeight: 700 }}>This upward trajectory suggests progressive systemic stress. Monitor inputs regularly.</span>
                    ) : percentChange < -5 ? (
                      <span style={{ color: "var(--success)", fontWeight: 700 }}>This downward trajectory indicates successful therapeutic baseline regression.</span>
                    ) : (
                      <span style={{ color: "#64748B", fontWeight: 600 }}>Metrics indicate relative baseline stability. Continue current therapeutic protocols.</span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* History Lists */}
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#263238", margin: "10px 0 0 4px" }}>Diagnostic Assessment Registry</h4>
            {history.map((log) => {
              const logThemeColor = getDiseaseColor(log.diseaseType);
              return (
                <div key={log.id} className="card-3d" style={{
                  borderLeft: `5px solid ${logThemeColor}`,
                  padding: "20px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "20px",
                  background: "#ffffff"
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{
                      fontSize: "0.7rem",
                      padding: "4px 10px",
                      background: `${logThemeColor}12`,
                      border: `1px solid ${logThemeColor}30`,
                      borderRadius: "6px",
                      color: logThemeColor,
                      fontWeight: 800,
                      alignSelf: "flex-start",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      {formatDiseaseName(log.diseaseType)}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      Executed: {formatDate(log.createdAt, true)}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
                    <div>
                      <span style={{ display: "block", fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                        RISK SCORE
                      </span>
                      <span style={{ fontSize: "1.6rem", fontWeight: 900, color: "#263238" }}>
                        {Number(log.riskScore).toFixed(1)}%
                      </span>
                    </div>

                    <div>
                      <span style={{ display: "block", fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                        RISK LEVEL
                      </span>
                      <span style={{
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        color: log.riskLevel === "HIGH" ? "var(--error)" : log.riskLevel === "MODERATE" ? "var(--primary)" : "var(--success)"
                      }}>
                        {log.riskLevel}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <button
                        onClick={() => window.open(`/dashboard/print/${log.id}`, "_blank")}
                        style={{
                          background: "none",
                          border: "none",
                          color: "rgba(59, 130, 246, 0.6)",
                          cursor: "pointer",
                          padding: "8px",
                          transition: "color 0.2s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--primary)"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "rgba(59, 130, 246, 0.6)"}
                        title="Print Clinical Report"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 6 2 18 2 18 9" />
                          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                          <rect x="6" y="14" width="12" height="8" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(log.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "rgba(255, 51, 102, 0.6)",
                          cursor: "pointer",
                          padding: "8px",
                          transition: "color 0.2s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--error)"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255, 51, 102, 0.6)"}
                        title="Delete log"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
